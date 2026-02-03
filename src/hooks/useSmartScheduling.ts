import { useMemo } from 'react';
import { FlightDetail } from './useFlightDetails';
import { DayPreference } from './useDayPreferences';
import { Activity } from '@/components/trip/ActivityCard';
import { isSameDay, addMinutes, parse, format } from 'date-fns';

export interface DayConstraints {
  dayNumber: number;
  isArrivalDay: boolean;
  isDepartureDay: boolean;
  arrivalFlight?: FlightDetail;
  departureFlight?: FlightDetail;
  earliestStart: string;  // HH:mm
  latestEnd: string;      // HH:mm
  availableMinutes: number;
  dayLabel: 'Arrival Day' | 'Departure Day' | 'Full Day' | 'Arrival & Departure Day';
}

// Calculate buffer time after arrival (hotel check-in, freshen up)
const ARRIVAL_BUFFER_MINUTES = 90; // 1.5 hours to get to hotel and settle
// Calculate buffer time before departure (travel to airport, check-in)
const DEPARTURE_BUFFER_MINUTES = 180; // 3 hours before flight

export const calculateDayConstraints = (
  dayNumber: number,
  dayDate: Date | undefined,
  flights: FlightDetail[],
  customStartTime?: string
): DayConstraints => {
  if (!dayDate) {
    return {
      dayNumber,
      isArrivalDay: false,
      isDepartureDay: false,
      earliestStart: customStartTime || '09:00',
      latestEnd: '22:00',
      availableMinutes: calculateMinutesBetween(customStartTime || '09:00', '22:00'),
      dayLabel: 'Full Day',
    };
  }

  // Find flights for this day
  const arrivalFlight = flights.find(f => isSameDay(new Date(f.arrival_date), dayDate));
  const departureFlight = flights.find(f => isSameDay(new Date(f.departure_date), dayDate));
  
  const isArrivalDay = !!arrivalFlight;
  const isDepartureDay = !!departureFlight;

  let earliestStart = customStartTime || '09:00';
  let latestEnd = '22:00';

  // Adjust for arrival
  if (arrivalFlight?.arrival_time) {
    const arrivalMinutes = timeToMinutes(arrivalFlight.arrival_time);
    const adjustedStartMinutes = arrivalMinutes + ARRIVAL_BUFFER_MINUTES;
    const adjustedStart = minutesToTime(adjustedStartMinutes);
    
    // Only override if later than default/custom
    if (adjustedStartMinutes > timeToMinutes(earliestStart)) {
      earliestStart = adjustedStart;
    }
  }

  // Adjust for departure
  if (departureFlight?.departure_time) {
    const departureMinutes = timeToMinutes(departureFlight.departure_time);
    const adjustedEndMinutes = departureMinutes - DEPARTURE_BUFFER_MINUTES;
    const adjustedEnd = minutesToTime(Math.max(adjustedEndMinutes, timeToMinutes('08:00')));
    latestEnd = adjustedEnd;
  }

  const availableMinutes = calculateMinutesBetween(earliestStart, latestEnd);

  let dayLabel: DayConstraints['dayLabel'] = 'Full Day';
  if (isArrivalDay && isDepartureDay) {
    dayLabel = 'Arrival & Departure Day';
  } else if (isArrivalDay) {
    dayLabel = 'Arrival Day';
  } else if (isDepartureDay) {
    dayLabel = 'Departure Day';
  }

  return {
    dayNumber,
    isArrivalDay,
    isDepartureDay,
    arrivalFlight,
    departureFlight,
    earliestStart,
    latestEnd,
    availableMinutes,
    dayLabel,
  };
};

// Calculate if activities fit within constraints
export const checkActivitiesFit = (
  activities: Activity[],
  constraints: DayConstraints,
  activityDurations: Map<string, number>
): { fits: boolean; overflow: Activity[]; totalMinutesNeeded: number } => {
  const BUFFER_BETWEEN_ACTIVITIES = 30; // 30 min travel buffer
  
  let totalMinutesNeeded = 0;
  const overflow: Activity[] = [];
  
  activities.forEach((activity, index) => {
    const duration = activityDurations.get(activity.id) || estimateActivityDuration(activity.type);
    totalMinutesNeeded += duration;
    if (index > 0) {
      totalMinutesNeeded += BUFFER_BETWEEN_ACTIVITIES;
    }
  });

  const fits = totalMinutesNeeded <= constraints.availableMinutes;
  
  if (!fits) {
    // Find which activities don't fit
    let runningMinutes = 0;
    for (const activity of activities) {
      const duration = activityDurations.get(activity.id) || estimateActivityDuration(activity.type);
      runningMinutes += duration + BUFFER_BETWEEN_ACTIVITIES;
      if (runningMinutes > constraints.availableMinutes) {
        overflow.push(activity);
      }
    }
  }

  return { fits, overflow, totalMinutesNeeded };
};

// Estimate travel time between two activities (placeholder - would use real API)
export const estimateTravelTime = (
  from: Activity,
  to: Activity
): { minutes: number; mode: 'walk' | 'metro' | 'taxi' | 'bus' } => {
  // Without real coordinates, estimate based on activity types
  // In a real implementation, this would call a routing API
  
  // If both have coordinates, calculate rough distance
  if (from.latitude && from.longitude && to.latitude && to.longitude) {
    const distance = haversineDistance(
      from.latitude, from.longitude,
      to.latitude, to.longitude
    );
    
    // Walking: ~5km/h, up to 1km
    if (distance < 1) {
      return { minutes: Math.ceil(distance * 12), mode: 'walk' };
    }
    // Metro/Bus: ~20km/h for 1-5km
    if (distance < 5) {
      return { minutes: Math.ceil(distance * 3) + 5, mode: 'metro' };
    }
    // Taxi: ~30km/h for longer distances
    return { minutes: Math.ceil(distance * 2) + 10, mode: 'taxi' };
  }
  
  // Default estimates based on common scenarios
  return { minutes: 15, mode: 'metro' };
};

// Haversine formula for distance between coordinates
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Helper functions
export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.slice(0, 5).split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export const calculateMinutesBetween = (start: string, end: string): number => {
  return Math.max(0, timeToMinutes(end) - timeToMinutes(start));
};

export const estimateActivityDuration = (type: string): number => {
  switch (type) {
    case 'attraction':
    case 'museum':
    case 'landmark':
      return 120; // 2 hours
    case 'restaurant':
    case 'food':
      return 90; // 1.5 hours
    case 'shopping':
      return 60; // 1 hour
    case 'transport':
      return 30; // 30 minutes
    case 'prebooked':
      return 120; // 2 hours default for pre-booked
    default:
      return 60; // 1 hour default
  }
};

export const formatAvailableTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
};

// Hook to calculate all day constraints for an itinerary
export const useDayConstraints = (
  numDays: number,
  startDate: Date | undefined,
  flights: FlightDetail[],
  dayPreferences: DayPreference[]
): DayConstraints[] => {
  return useMemo(() => {
    const constraints: DayConstraints[] = [];
    
    for (let i = 1; i <= numDays; i++) {
      const dayDate = startDate 
        ? new Date(startDate.getTime() + (i - 1) * 24 * 60 * 60 * 1000)
        : undefined;
      
      const pref = dayPreferences.find(p => p.day_number === i);
      const customStartTime = pref?.start_time;
      
      constraints.push(calculateDayConstraints(i, dayDate, flights, customStartTime));
    }
    
    return constraints;
  }, [numDays, startDate, flights, dayPreferences]);
};
