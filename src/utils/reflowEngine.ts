/**
 * Reflow Engine — Gap 1 core differentiator
 *
 * Computes a realistic, cascading daily schedule from an ordered list of
 * activities and a set of flight-aware day constraints.
 *
 * Key behaviours:
 *  • Starts at `constraints.earliestStart` (respects arrival flight buffers)
 *  • Adds each activity's duration + estimated travel time to the next
 *  • Flags activities that overflow `constraints.latestEnd` (departure cutoff)
 *  • Automatically re-runs whenever activities or constraints change (pure fn)
 *  • Suggests dropping Flex blocks first to fix overflows (soft-sacrifice logic)
 *
 * This is a pure-computation module — no React, no side effects.
 */

import { Activity } from '@/components/trip/ActivityCard';
import {
  DayConstraints,
  estimateTravelTime,
  timeToMinutes,
  minutesToTime,
} from '@/hooks/useSmartScheduling';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScheduledActivity {
  activityId: string;
  slot: 'morning' | 'afternoon' | 'evening';
  computedStart: string;    // "09:30"
  computedEnd: string;      // "11:30"
  durationMins: number;
  travelMinsAfter: number;  // estimated transit to next activity
  isOverflow: boolean;      // this activity ends after latestEnd
  isTight: boolean;         // ends within 30 min of latestEnd (warning zone)
}

export interface DaySchedule {
  /** Map from activityId → ScheduledActivity for O(1) lookup in renderers */
  byId: Map<string, ScheduledActivity>;
  hasOverflow: boolean;
  overflowCount: number;
  /** Sum of all activity durations + inter-activity travel */
  totalMinsNeeded: number;
  totalMinsAvailable: number;
  dayEndsAt: string;
  /**
   * Flex / low-priority activity IDs that could be dropped to resolve overflow.
   * Listed in reverse order (last flex activities first — safest to drop).
   */
  suggestedDropIds: string[];
}

// ---------------------------------------------------------------------------
// Duration parsing
// Handles AI-generated strings like "2 hours", "90 minutes", "1h 30m", "1.5h"
// Falls back to per-type defaults so the engine always produces a schedule.
// ---------------------------------------------------------------------------

export function parseDurationMins(durationStr?: string | null, type?: string): number {
  if (durationStr) {
    const hoursMatch = durationStr.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h\b)/i);
    const minsMatch  = durationStr.match(/(\d+)\s*(?:minutes?|mins?|m\b)/i);
    let total = 0;
    if (hoursMatch) total += parseFloat(hoursMatch[1]) * 60;
    if (minsMatch)  total += parseInt(minsMatch[1], 10);
    if (total > 0)  return Math.round(Math.max(15, Math.min(total, 480)));
  }
  // Per-type defaults (minutes)
  switch (type) {
    case 'attraction':
    case 'museum':
    case 'landmark':   return 120;
    case 'restaurant':
    case 'food':       return 90;
    case 'shopping':   return 60;
    case 'transport':  return 30;
    case 'prebooked':  return 120;
    case 'flex':       return 90;
    default:           return 60;
  }
}

// ---------------------------------------------------------------------------
// Core: computeDaySchedule
//
// Takes morning / afternoon / evening activity arrays (already in display order)
// plus the day's flight-aware constraints and returns a full schedule.
//
// Calling this inside a useMemo gives automatic reflow: any change to flights,
// day start time, activity order, or activity list triggers recomputation.
// ---------------------------------------------------------------------------

export function computeDaySchedule(
  morningActivities: Activity[],
  afternoonActivities: Activity[],
  eveningActivities: Activity[],
  constraints: DayConstraints,
): DaySchedule {
  // Flatten into a single ordered sequence with slot metadata
  const all: Array<{ activity: Activity; slot: 'morning' | 'afternoon' | 'evening' }> = [
    ...morningActivities.map(a  => ({ activity: a, slot: 'morning'   as const })),
    ...afternoonActivities.map(a => ({ activity: a, slot: 'afternoon' as const })),
    ...eveningActivities.map(a   => ({ activity: a, slot: 'evening'   as const })),
  ];

  const byId         = new Map<string, ScheduledActivity>();
  const latestEndMin = timeToMinutes(constraints.latestEnd);
  let currentMin     = timeToMinutes(constraints.earliestStart);
  let hasOverflow    = false;
  let overflowCount  = 0;
  let totalNeeded    = 0;

  for (let i = 0; i < all.length; i++) {
    const { activity, slot } = all[i];
    const durationMins = parseDurationMins(activity.duration, activity.type);

    // Estimate travel time to the next activity using haversine (from useSmartScheduling)
    let travelMinsAfter = 0;
    if (i < all.length - 1) {
      travelMinsAfter = estimateTravelTime(activity, all[i + 1].activity).minutes;
    }

    const startMin = currentMin;
    const endMin   = startMin + durationMins;
    const overflow = endMin > latestEndMin;
    const tight    = !overflow && endMin > latestEndMin - 30;

    if (overflow) { hasOverflow = true; overflowCount++; }

    byId.set(activity.id, {
      activityId:     activity.id,
      slot,
      computedStart:  minutesToTime(Math.min(startMin, 23 * 60 + 59)),
      computedEnd:    minutesToTime(Math.min(endMin,   23 * 60 + 59)),
      durationMins,
      travelMinsAfter,
      isOverflow:     overflow,
      isTight:        tight,
    });

    totalNeeded += durationMins + travelMinsAfter;
    currentMin   = endMin + travelMinsAfter;
  }

  const lastActivity = all.length > 0 ? all[all.length - 1].activity : null;
  const dayEndsAt    = lastActivity
    ? (byId.get(lastActivity.id)?.computedEnd ?? constraints.earliestStart)
    : constraints.earliestStart;

  // Suggest dropping Flex activities to resolve overflow (last ones first,
  // since they're the lowest priority on any given day).
  const suggestedDropIds: string[] = [];
  if (hasOverflow) {
    for (let i = all.length - 1; i >= 0 && suggestedDropIds.length < overflowCount; i--) {
      const { activity } = all[i];
      if (activity.type === 'flex' && !activity.mustDo) {
        suggestedDropIds.push(activity.id);
      }
    }
  }

  return {
    byId,
    hasOverflow,
    overflowCount,
    totalMinsNeeded:    totalNeeded,
    totalMinsAvailable: Math.max(0, latestEndMin - timeToMinutes(constraints.earliestStart)),
    dayEndsAt,
    suggestedDropIds,
  };
}

// ---------------------------------------------------------------------------
// Convenience: human-readable label for overflow severity
// ---------------------------------------------------------------------------

export function overflowLabel(schedule: DaySchedule): string {
  const overMin = schedule.totalMinsNeeded - schedule.totalMinsAvailable;
  if (overMin <= 0) return '';
  const h = Math.floor(overMin / 60);
  const m = overMin % 60;
  if (h === 0) return `${m} min over`;
  if (m === 0) return `${h}h over`;
  return `${h}h ${m}m over`;
}
