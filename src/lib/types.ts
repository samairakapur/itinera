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

