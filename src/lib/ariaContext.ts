/**
 * ariaContext.ts
 *
 * Pure utility — builds a TripState snapshot from data already loaded by
 * TripDetail's hooks.  No side-effects, no imports of React.
 *
 * The snapshot is passed to TripConcierge → trip-concierge Edge Function
 * so Aria has complete trip context without the server needing to re-fetch
 * itinerary rows, items, flights, or legs from the database.
 */

import { format } from 'date-fns';
import type { TripState, TripLeg, AriaContext, Activity as TripActivity, Day as TripDay, TripLeg as TripLegShape, Flight } from './types';
import type { SavedItinerary } from '@/hooks/useItineraries';
import type { DayData } from '@/components/trip/DayCard';
import type { Activity as CardActivity } from '@/components/trip/ActivityCard';
import type { FlightDetail } from '@/hooks/useFlightDetails';
import type { TripLeg as HookTripLeg } from '@/hooks/useTripLegs';
import { getCityForDay } from '@/hooks/useTripLegs';

/**
 * Map a single ActivityCard Activity into the canonical TripActivity shape.
 * @param a        Activity from DayCard / ActivityCard
 * @param slot     Time-slot bucket it lives in
 * @param dayNum   1-based day number
 * @param completed  Set of completed activity IDs
 */
function mapActivity(
  a: CardActivity,
  slot: 'morning' | 'afternoon' | 'evening',
  dayNum: number,
  completed: Set<string>
): TripActivity {
  return {
    id: a.id,
    title: a.title,
    itemType: a.type,
    timeSlot: slot,
    scheduledTime: a.time ?? undefined,
    notes: a.reasoning ?? undefined,
    isCompleted: completed.has(a.id),
    dayNumber: dayNum,
  };
}

/**
 * Build a TripState object from data already loaded by TripDetail's hooks.
 *
 * @param itinerary       From useItinerary()
 * @param days            Parsed DayData[] state
 * @param flights         From useFlightDetails()
 * @param tripLegs        From useTripLegs()
 * @param completedIds    Set of completed activity IDs
 */
/**
 * Default scheduled time for each slot when no explicit time is stored.
 */
function slotDefaultTime(slot: string): string {
  if (slot === 'morning') return '09:00';
  if (slot === 'evening') return '18:00';
  return '13:00';
}

/**
 * Build a compact AriaContext from an already-built TripState.
 *
 * @param itinerary   Full TripState (the canonical in-memory snapshot)
 * @param tripLegs    TripLeg[] — pass itinerary.legs or hook data (same shape)
 * @param currentDate ISO date string "YYYY-MM-DD" (user's local date)
 * @param userId      Current user ID (reserved for future per-user customisation)
 */
export function buildAriaContext(
  itinerary: TripState,
  tripLegs: TripLeg[],
  currentDate: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _userId: string
): AriaContext {
  const numDays = itinerary.numDays;
  // Prefer legs passed explicitly, fall back to those embedded in TripState
  const legs = tripLegs.length > 0 ? tripLegs : itinerary.legs;

  // ── Calculate current day number ──────────────────────────────────────
  let currentDay = 1;
  let daysRemaining = numDays;

  if (itinerary.startDate) {
    const start = new Date(itinerary.startDate);
    const current = new Date(currentDate);
    const msPerDay = 1000 * 60 * 60 * 24;
    const dayIdx = Math.floor((current.getTime() - start.getTime()) / msPerDay);

    if (dayIdx < 0) {
      // Trip has not started yet
      currentDay = 1;
      daysRemaining = numDays;
    } else if (dayIdx >= numDays) {
      // Trip has ended
      currentDay = numDays;
      daysRemaining = 0;
    } else {
      currentDay = dayIdx + 1;
      daysRemaining = numDays - currentDay;
    }
  }

  // ── Find current city and leg ─────────────────────────────────────────
  let currentCity = itinerary.city ?? 'your destination';
  let currentLeg = 1;

  if (legs.length > 0) {
    const activeLeg =
      legs.find(l => l.startDay <= currentDay && l.endDay >= currentDay) ??
      (currentDay < legs[0].startDay ? legs[0] : legs[legs.length - 1]);
    currentCity = activeLeg.city || currentCity;
    currentLeg = activeLeg.legNumber;
  }

  // ── Today's activities ────────────────────────────────────────────────
  const todayDay = itinerary.days.find(d => d.dayNumber === currentDay);
  const todayActivities: AriaContext['todayActivities'] = (todayDay?.activities ?? []).map(a => ({
    time: a.scheduledTime ?? slotDefaultTime(a.timeSlot),
    title: a.title,
    itemType: a.itemType,
    isCompleted: a.isCompleted ?? false,
    estimatedDurationMinutes: a.estimatedDurationMinutes ?? 60,
  }));

  // ── Upcoming activities (next 2 days) ─────────────────────────────────
  const upcomingActivities: AriaContext['upcomingActivities'] = [currentDay + 1, currentDay + 2]
    .filter(d => d >= 1 && d <= numDays)
    .map(dayNum => {
      const day = itinerary.days.find(d => d.dayNumber === dayNum);
      const leg = legs.find(l => l.startDay <= dayNum && l.endDay >= dayNum);
      const city = day?.city ?? leg?.city ?? currentCity;
      return {
        dayNumber: dayNum,
        city,
        activities: (day?.activities ?? []).map(a => ({
          time: a.scheduledTime ?? slotDefaultTime(a.timeSlot),
          title: a.title,
          itemType: a.itemType,
        })),
      };
    });

  // ── Completed activity IDs ────────────────────────────────────────────
  const completedActivityIds = itinerary.days
    .flatMap(d => d.activities.filter(a => a.isCompleted).map(a => a.id))
    .filter(Boolean);

  // ── Flight today (departure or arrival) ──────────────────────────────
  let flightToday: AriaContext['flightToday'] = null;
  for (const flight of itinerary.flights) {
    if (flight.departureDate === currentDate) {
      flightToday = {
        type: 'departure',
        time: flight.departureTime ?? 'TBD',
        fromCity: flight.departureCity,
        toCity: flight.arrivalCity,
      };
      break;
    }
    if (flight.arrivalDate === currentDate) {
      flightToday = {
        type: 'arrival',
        time: flight.arrivalTime ?? 'TBD',
        fromCity: flight.departureCity,
        toCity: flight.arrivalCity,
      };
      break;
    }
  }

  return {
    tripName: itinerary.name ?? `Trip to ${itinerary.city ?? 'your destination'}`,
    totalDays: numDays,
    currentDay,
    currentCity,
    currentLeg,
    daysRemaining,
    groupSize: itinerary.groupSize ?? 2,
    todayActivities,
    upcomingActivities,
    completedActivityIds,
    flightToday,
    preferences: {
      budgetLevel: itinerary.budgetLevel ?? null,
      groupSize: itinerary.groupSize ?? 2,
    },
  };
}

export function buildTripState(
  itinerary: SavedItinerary,
  days: DayData[],
  flights: FlightDetail[],
  tripLegs: HookTripLeg[],
  completedIds: Set<string>
): TripState {
  const mappedLegs: TripLegShape[] = tripLegs.map(l => ({
    legNumber: l.leg_number,
    startDay: l.start_day,
    endDay: l.end_day,
    city: l.city?.name ?? '',
    country: l.city?.country ?? undefined,
  }));

  const mappedFlights: Flight[] = flights.map(f => ({
    legNumber: f.leg_number,
    airline: f.airline ?? undefined,
    flightNumber: f.flight_number ?? undefined,
    departureCity: f.departure_city,
    arrivalCity: f.arrival_city,
    departureDate: f.departure_date,
    departureTime: f.departure_time ?? undefined,
    arrivalDate: f.arrival_date,
    arrivalTime: f.arrival_time ?? undefined,
  }));

  const mappedDays: TripDay[] = days.map(day => {
    const legForDay = getCityForDay(day.dayNumber, tripLegs);
    const cityName = legForDay?.city?.name ?? itinerary.cities?.name ?? undefined;

    const activities: TripActivity[] = [
      ...day.morning.map(a => mapActivity(a, 'morning', day.dayNumber, completedIds)),
      ...day.afternoon.map(a => mapActivity(a, 'afternoon', day.dayNumber, completedIds)),
      ...day.evening.map(a => mapActivity(a, 'evening', day.dayNumber, completedIds)),
    ];

    return {
      dayNumber: day.dayNumber,
      date: day.actualDate ? format(day.actualDate, 'yyyy-MM-dd') : undefined,
      startTime: day.startTime,
      city: cityName,
      activities,
    };
  });

  return {
    id: itinerary.id,
    name: itinerary.name ?? undefined,
    numDays: itinerary.num_days,
    startDate: itinerary.start_date ?? undefined,
    endDate: itinerary.end_date ?? undefined,
    city: itinerary.cities?.name ?? undefined,
    country: itinerary.cities?.country ?? undefined,
    budgetLevel: itinerary.budget_level ?? undefined,
    pace: itinerary.pace ?? undefined,
    travelStyle: itinerary.travel_style ?? undefined,
    dietaryPreferences: (itinerary.dietary_preferences as string[] | null) ?? undefined,
    groupSize: (itinerary as Record<string, unknown>).group_size as number | undefined,
    legs: mappedLegs,
    flights: mappedFlights,
    days: mappedDays,
  };
}
