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
import type { TripState, Activity as TripActivity, Day as TripDay, TripLeg as TripLegShape, Flight } from './types';
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
