import type { Activity } from './types';

export interface ValidationError {
  type: 'over_schedule' | 'meal_timing' | 'flight_conflict' | 'duplicate_time' | 'impossible_sequence';
  severity: 'error' | 'warning';
  dayNumber: number;
  activityId: string | null;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// Keys must match the itinerary.pace values actually stored in the DB
// (see mapDailyPace in NewTrip.tsx: relaxed→light, balanced→medium, fast→full).
const PACE_END_TIMES: Record<string, number> = {
  light: 18 * 60,
  medium: 20 * 60,
  full: 21 * 60 + 30,
};

const DAY_START_MINUTES = 8 * 60;

const MEAL_WINDOWS = {
  breakfast: { min: 7 * 60, max: 10 * 60 },
  lunch: { min: 11 * 60 + 30, max: 14 * 60 },
  dinner: { min: 18 * 60, max: 21 * 60 },
};

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function isMealActivity(title: string, itemType: string): 'breakfast' | 'lunch' | 'dinner' | null {
  const t = title.toLowerCase();
  if (itemType === 'restaurant') {
    if (t.includes('breakfast') || t.includes('brunch') || t.includes('toast') || t.includes('coffee'))
      return 'breakfast';
    if (t.includes('lunch')) return 'lunch';
    if (t.includes('dinner') || t.includes('supper')) return 'dinner';
  }
  return null;
}

export function validateItinerary(
  activities: Activity[],
  pace: string,
  flightDepartureTime: string | null,
  flightArrivalTime: string | null,
  dayNumber: number,
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (!activities || activities.length === 0) {
    return { valid: true, errors: [], warnings: [] };
  }

  const sorted = [...activities]
    .filter(a => a.scheduledTime)
    .sort((a, b) => timeToMinutes(a.scheduledTime!) - timeToMinutes(b.scheduledTime!));

  let dayEndCeiling = PACE_END_TIMES[pace] ?? 20 * 60;

  if (flightDepartureTime) {
    const depMinutes = timeToMinutes(flightDepartureTime);
    dayEndCeiling = Math.min(dayEndCeiling, depMinutes - 120);
  }

  let dayStart = DAY_START_MINUTES;
  if (flightArrivalTime) {
    const arrMinutes = timeToMinutes(flightArrivalTime);
    dayStart = Math.max(dayStart, arrMinutes + 120);
    if (arrMinutes > 18 * 60) {
      if (sorted.some(a => a.itemType !== 'accommodation')) {
        errors.push({
          type: 'flight_conflict',
          severity: 'error',
          dayNumber,
          activityId: null,
          message: `Flight arrives at ${flightArrivalTime}. No activities should be scheduled on arrival day after 18:00.`,
        });
      }
    }
  }

  let runningTime = dayStart;

  for (const activity of sorted) {
    const startMin = timeToMinutes(activity.scheduledTime!);
    const endMin = startMin + (activity.estimatedDurationMinutes ?? 60);

    if (endMin > dayEndCeiling) {
      errors.push({
        type: 'over_schedule',
        severity: 'error',
        dayNumber,
        activityId: activity.id,
        message: `"${activity.title}" ends at ${Math.floor(endMin / 60)}:${String(endMin % 60).padStart(2, '0')} which exceeds the day limit of ${Math.floor(dayEndCeiling / 60)}:${String(dayEndCeiling % 60).padStart(2, '0')}.`,
      });
    }

    const duplicate = sorted.find(
      a => a.id !== activity.id && a.scheduledTime === activity.scheduledTime,
    );
    if (duplicate) {
      errors.push({
        type: 'duplicate_time',
        severity: 'error',
        dayNumber,
        activityId: activity.id,
        message: `"${activity.title}" and "${duplicate.title}" are both scheduled at ${activity.scheduledTime}.`,
      });
    }

    const mealType = isMealActivity(activity.title, activity.itemType);
    if (mealType) {
      const window = MEAL_WINDOWS[mealType];
      if (startMin < window.min || startMin > window.max) {
        warnings.push({
          type: 'meal_timing',
          severity: 'warning',
          dayNumber,
          activityId: activity.id,
          message: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} "${activity.title}" is scheduled at ${activity.scheduledTime}, outside the typical window.`,
        });
      }
    }

    if (startMin < runningTime && activity.itemType !== 'flex') {
      errors.push({
        type: 'impossible_sequence',
        severity: 'error',
        dayNumber,
        activityId: activity.id,
        message: `"${activity.title}" starts at ${activity.scheduledTime} but previous activity ends at ${Math.floor(runningTime / 60)}:${String(runningTime % 60).padStart(2, '0')}.`,
      });
    }

    runningTime = Math.max(runningTime, endMin);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
