// reflow-engine — reorders a day's activities respecting priority rules:
//   1. Flights (arrival/departure constraints)
//   2. Firm activities (fixed-time, pre-booked)
//   3. Soft activities (approximate time, reorderable)
//   4. Flex activities (fill-in, always last)
//
// POST /functions/v1/reflow-engine
// Body: { activities: Activity[], dayStart: string, dayEnd: string, flightConstraint?: { type: 'arrival'|'departure', time: string } }
// Returns: { activities: Activity[] } — same array, reordered

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ActivityIn {
  id: string;
  type: string;
  title: string;
  flexibility?: 'firm' | 'soft' | 'flex';
  time?: string;
  duration?: string;
  travelTimeMinutes?: number;
  [key: string]: unknown;
}

interface FlightConstraint {
  type: 'arrival' | 'departure';
  time: string; // HH:MM 24h
}

const timeToMinutes = (t: string): number => {
  if (!t) return 0;
  const clean = t.replace(/\s*(AM|PM)/i, '').trim();
  const [h, m] = clean.split(':').map(Number);
  const isPM = /PM/i.test(t) && h !== 12;
  const isAM = /AM/i.test(t) && h === 12;
  let hours = h;
  if (isPM) hours += 12;
  if (isAM) hours = 0;
  return hours * 60 + (m || 0);
};

const priority = (a: ActivityIn): number => {
  if (a.flexibility === 'firm' || a.type === 'prebooked') return 1;
  if (a.type === 'transport') return 2;
  if (a.flexibility === 'flex' || a.type === 'flex') return 4;
  return 3; // soft / default
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { activities, dayStart = '09:00', dayEnd = '22:00', flightConstraint } = await req.json() as {
      activities: ActivityIn[];
      dayStart?: string;
      dayEnd?: string;
      flightConstraint?: FlightConstraint;
    };

    if (!Array.isArray(activities) || activities.length === 0) {
      return new Response(JSON.stringify({ activities: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Sort by priority then preserve original order within priority groups
    const sorted = [...activities].sort((a, b) => {
      const pa = priority(a);
      const pb = priority(b);
      if (pa !== pb) return pa - pb;
      // Within same priority: firm activities keep their time-based order
      if (a.time && b.time) return timeToMinutes(a.time) - timeToMinutes(b.time);
      return 0;
    });

    // 2. Apply flight constraints
    const startMinutes = timeToMinutes(dayStart);
    const endMinutes = timeToMinutes(dayEnd);

    let effectiveStart = startMinutes;
    let effectiveEnd = endMinutes;

    if (flightConstraint) {
      const constraintMinutes = timeToMinutes(flightConstraint.time);
      if (flightConstraint.type === 'arrival') {
        // Don't schedule activities before arrival + 90 min buffer
        effectiveStart = Math.max(effectiveStart, constraintMinutes + 90);
      } else if (flightConstraint.type === 'departure') {
        // Don't schedule activities after departure - 180 min buffer
        effectiveEnd = Math.min(effectiveEnd, constraintMinutes - 180);
      }
    }

    // 3. Assign computed start times
    let cursor = effectiveStart;
    const AVG_ACTIVITY_MINUTES = 90;
    const TRAVEL_BUFFER = 20;

    const reflowed = sorted.map((activity) => {
      if (cursor >= effectiveEnd) {
        return { ...activity, isScheduleOverflow: true };
      }

      const durationStr = activity.duration as string | undefined;
      let durationMinutes = AVG_ACTIVITY_MINUTES;
      if (durationStr) {
        const hoursMatch = durationStr.match(/(\d+(?:\.\d+)?)\s*h/i);
        const minsMatch = durationStr.match(/(\d+)\s*min/i);
        if (hoursMatch) durationMinutes = Math.round(parseFloat(hoursMatch[1]) * 60);
        else if (minsMatch) durationMinutes = parseInt(minsMatch[1]);
      }

      const travelTime = (activity.travelTimeMinutes as number | undefined) ?? TRAVEL_BUFFER;

      // Firm activities keep their original time
      const computedMinutes = (activity.flexibility === 'firm' || activity.type === 'prebooked') && activity.time
        ? timeToMinutes(activity.time as string)
        : cursor;

      const hours = Math.floor(computedMinutes / 60);
      const mins = computedMinutes % 60;
      const computedStartTime = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

      cursor = computedMinutes + durationMinutes + travelTime;

      return {
        ...activity,
        computedStartTime,
        isScheduleOverflow: computedMinutes > effectiveEnd,
      };
    });

    return new Response(JSON.stringify({ activities: reflowed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[reflow-engine]', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
