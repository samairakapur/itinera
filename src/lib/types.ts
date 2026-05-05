/**
 * Canonical domain types for Itinera.
 * Single source of truth — do not redefine these in component files.
 * Field naming: camelCase throughout.
 *
 * These types represent the TripState wire format sent from the frontend
 * to the trip-concierge Edge Function so Aria has full trip context without
 * the Edge Function needing to re-fetch data from the database.
 */

export interface Activity {
  id: string;
  title: string;
  /** Maps to item_type in the DB / type field in ActivityCard */
  itemType: string;
  timeSlot: 'morning' | 'afternoon' | 'evening';
  scheduledTime?: string;              // "09:00"
  estimatedDurationMinutes?: number;
  travelTimeFromPrevious?: number;     // minutes
  tripLegId?: string;
  dayNumber: number;
  notes?: string;
  isCompleted?: boolean;
  orderIndex?: number;
}

export interface Day {
  dayNumber: number;
  date?: string;       // ISO date "2024-03-15"
  startTime?: string;  // "09:00"
  city?: string;
  activities: Activity[];
}

export interface TripLeg {
  legNumber: number;
  startDay: number;
  endDay: number;
  city: string;
  country?: string;
}

export interface Flight {
  legNumber?: number;
  airline?: string;
  flightNumber?: string;
  departureCity: string;
  arrivalCity: string;
  departureDate?: string;
  departureTime?: string;
  arrivalDate?: string;
  arrivalTime?: string;
}

export interface TripState {
  id: string;
  name?: string;
  numDays: number;
  startDate?: string;
  endDate?: string;
  city?: string;
  country?: string;
  budgetLevel?: string;
  pace?: string;
  travelStyle?: string;
  dietaryPreferences?: string[];
  groupSize?: number;
  legs: TripLeg[];
  flights: Flight[];
  days: Day[];
}

/**
 * Compact, pre-computed context object sent to the trip-concierge Edge Function
 * on every Aria message.  Focused on the current day + 2 upcoming days so the
 * payload stays well under 2 000 tokens.
 *
 * Built by buildAriaContext() in ariaContext.ts from the in-memory TripState.
 */
export interface AriaContext {
  tripName: string;
  totalDays: number;
  /** 1-based day number calculated from dates */
  currentDay: number;
  /** City derived from which TripLeg covers today */
  currentCity: string;
  /** Which leg index we are on (1-based) */
  currentLeg: number;
  daysRemaining: number;
  groupSize: number;
  /** Compact summary of today's activities only */
  todayActivities: {
    time: string;
    title: string;
    itemType: string;
    isCompleted: boolean;
    estimatedDurationMinutes: number;
  }[];
  /** Next 2 days only */
  upcomingActivities: {
    dayNumber: number;
    city: string;
    activities: {
      time: string;
      title: string;
      itemType: string;
    }[];
  }[];
  completedActivityIds: string[];
  flightToday: {
    type: 'departure' | 'arrival';
    time: string;
    fromCity: string;
    toCity: string;
  } | null;
  preferences: {
    budgetLevel: string | null;
    groupSize: number;
  };
}

