import { useMemo } from 'react';
import { FlightDetail } from './useFlightDetails';
import { DayPreference } from './useDayPreferences';
import { Activity } from '@/components/trip/ActivityCard';
import { isSameDay } from 'date-fns';

export interface DayConstraints {
  dayNumber: number;
  isArrivalDay: boolean;
  isDepartureDay: boolean;
  isOvernightTransit: boolean;  // departure < arrival on same day (overnight flight)
  isEarlyDeparture: boolean;    // pure departure day with flight before 10:30 AM
  arrivalFlight?: FlightDetail;
  departureFlight?: FlightDetail;
  earliestStart: string;      // HH:mm — first activity can start no earlier
  latestEnd: string;          // HH:mm — last activity must end by this
  availableMinutes: number;
  dayLabel: 'Arrival Day' | 'Departure Day' | 'Full Day' | 'Arrival & Departure Day';
  // Human-readable breakdown shown in FlightConstraintBanner
  arrivalBufferBreakdown?: ArrivalBufferBreakdown;
  departureBufferBreakdown?: DepartureBufferBreakdown;
}

export interface ArrivalBufferBreakdown {
  landingTime: string;
  delayMinutes: number;
  immigrationMinutes: number;
  baggageMinutes: number;
  transitMinutes: number;
  hotelCheckinMinutes: number;
  totalBufferMinutes: number;
  earliestActivityStart: string;
}

export interface DepartureBufferBreakdown {
  departureTime: string;
  transitMinutes: number;
  airportCheckinMinutes: number;  // 90 domestic / 150 international
  lastActivityMustEndBy: string;
}

// ---------------------------------------------------------------------------
// Airport transit times (city centre ↔ airport) in minutes.
// Based on typical fastest transit option (metro / express train / shuttle).
// Keyed by IATA airport code.
// ---------------------------------------------------------------------------
const AIRPORT_TRANSIT_MINUTES: Record<string, number> = {
  // United Kingdom
  LHR: 50, LGW: 60, STN: 75, MAN: 35, EDI: 30, BHX: 25, LTN: 55,
  // France
  CDG: 45, ORY: 35, NCE: 20,
  // Germany
  FRA: 15, MUC: 45, BER: 45, HAM: 30, DUS: 20,
  // Spain
  MAD: 30, BCN: 35, AGP: 20,
  // Italy
  FCO: 35, MXP: 55, LIN: 10, VCE: 20, NAP: 30,
  // Netherlands & Belgium
  AMS: 20, BRU: 25,
  // Scandinavia
  ARN: 40, CPH: 15, OSL: 20, HEL: 30,
  // Portugal
  LIS: 30, OPO: 30,
  // Austria & Switzerland
  VIE: 30, ZRH: 15,
  // Eastern Europe
  PRG: 35, BUD: 35, WAW: 35, OTP: 45,
  // Greece & Turkey
  ATH: 40, SKG: 20, IST: 55, SAW: 60,
  // Ireland
  DUB: 25, ORK: 15,
  // Iceland
  KEF: 50,
  // Russia/CIS
  SVO: 45, DME: 50,

  // Middle East
  DXB: 30, AUH: 30, DOH: 25, RUH: 30, KWI: 20, BAH: 25, AMM: 35,

  // Africa
  JNB: 25, CPT: 25, NBO: 30, CAI: 45, CMN: 30, RAK: 20,

  // Asia — East
  PEK: 50, PKX: 70, PVG: 40, SHA: 15, HKG: 30, MFM: 15,
  ICN: 55, GMP: 30,
  NRT: 90, HND: 35, KIX: 75, CTS: 40,
  TPE: 40, KHH: 35,
  // Asia — Southeast
  SIN: 30,
  BKK: 40, DMK: 45,
  KUL: 30,
  CGK: 50, DPS: 30, SUB: 30,
  MNL: 45, CEB: 25,
  SGN: 30, HAN: 40,
  RGN: 30, PNH: 15,
  // Asia — South
  DEL: 45, BOM: 30, MAA: 40, BLR: 40, HYD: 30,
  DAC: 30, CMB: 35, KTM: 20,

  // Oceania
  SYD: 30, MEL: 30, BNE: 25, PER: 25, ADL: 25,
  AKL: 35, CHC: 30, WLG: 20,

  // North America — USA
  ATL: 25, LAX: 30, ORD: 45, DFW: 30, DEN: 35,
  JFK: 45, SFO: 30, SEA: 30, LAS: 15, MCO: 30,
  MIA: 30, CLT: 20, EWR: 40, PHX: 25, IAH: 35,
  MSP: 25, BOS: 35, DTW: 25, PHL: 30, LGA: 30,
  IAD: 50, BWI: 40, MDW: 25, SNA: 20, SAN: 15,
  // Canada
  YYZ: 30, YVR: 25, YUL: 25, YYC: 25,
  // Mexico
  MEX: 45, CUN: 20,

  // Caribbean & Central America
  HAV: 20, SJO: 25, GUA: 25, PTY: 25,

  // South America
  GRU: 50, GIG: 60, BOG: 35, LIM: 45, SCL: 40, EZE: 50, UIO: 30,
};

const DEFAULT_TRANSIT_MINUTES = 45; // Used when airport not in table

function getTransitMinutes(iataCode?: string | null): number {
  if (iataCode && AIRPORT_TRANSIT_MINUTES[iataCode] !== undefined) {
    return AIRPORT_TRANSIT_MINUTES[iataCode];
  }
  return DEFAULT_TRANSIT_MINUTES;
}

// ---------------------------------------------------------------------------
// Buffer constants
// ---------------------------------------------------------------------------
const IMMIGRATION_MINUTES = 45;        // Passport control + customs
const BAGGAGE_MINUTES     = 30;        // Baggage reclaim
const HOTEL_CHECKIN_MINUTES = 60;      // Hotel check-in + freshen up

const DOMESTIC_CHECKIN_BUFFER      = 90;   // Airport check-in before domestic flight
const INTERNATIONAL_CHECKIN_BUFFER = 150;  // Airport check-in before international flight

// ---------------------------------------------------------------------------
// Core constraint calculator
// ---------------------------------------------------------------------------
export const calculateDayConstraints = (
  dayNumber: number,
  dayDate: Date | undefined,
  flights: FlightDetail[],
  customStartTime?: string,
): DayConstraints => {
  // Departure day default: 08:00. User can adjust via Edit Day.
  const baseStart = customStartTime || '08:00';
  const baseEnd   = '22:00';

  if (!dayDate) {
    return {
      dayNumber,
      isArrivalDay: false,
      isDepartureDay: false,
      isOvernightTransit: false,
      isEarlyDeparture: false,
      earliestStart: baseStart,
      latestEnd: baseEnd,
      availableMinutes: calculateMinutesBetween(baseStart, baseEnd),
      dayLabel: 'Full Day',
    };
  }

  // Match flights to this calendar day
  const arrivalFlight   = flights.find(f => {
    try { return isSameDay(new Date(f.arrival_date),   dayDate); } catch { return false; }
  });
  const departureFlight = flights.find(f => {
    try { return isSameDay(new Date(f.departure_date), dayDate); } catch { return false; }
  });

  const isArrivalDay   = !!arrivalFlight;
  const isDepartureDay = !!departureFlight;

  // Detect overnight transit: same flight departs before it arrives on the same calendar
  // day (e.g. 00:10 depart Singapore → 07:25 arrive Seoul). In this case the user has
  // already left — don't apply a departure cutoff to their arrival day activities.
  const isOvernightTransit =
    isArrivalDay &&
    isDepartureDay &&
    !!departureFlight?.departure_time &&
    !!arrivalFlight?.arrival_time &&
    timeToMinutes(departureFlight.departure_time) < timeToMinutes(arrivalFlight.arrival_time);

  let earliestStart = baseStart;
  let latestEnd     = baseEnd;
  let arrivalBreakdown: ArrivalBufferBreakdown | undefined;
  let departureBreakdown: DepartureBufferBreakdown | undefined;
  let isEarlyDeparture = false;

  // ── Arrival day: work out what time the user can realistically start ────
  // Buffer = immigration + baggage + city transit + hotel check-in
  if (arrivalFlight?.arrival_time) {
    const delayMins    = arrivalFlight.delay_minutes ?? 0;
    const transitMins  = getTransitMinutes(arrivalFlight.destination_iata);

    const totalBuffer  =
      delayMins +
      IMMIGRATION_MINUTES +
      BAGGAGE_MINUTES +
      transitMins +
      HOTEL_CHECKIN_MINUTES;

    const arrivalMins  = timeToMinutes(arrivalFlight.arrival_time);
    const adjustedMins = arrivalMins + totalBuffer;
    // Guard against wrapping past midnight
    const cappedMins   = Math.min(adjustedMins, timeToMinutes('23:00'));
    const adjustedTime = minutesToTime(cappedMins);

    // Arrival buffer always takes priority — it tells the user when they can
    // *realistically* start sightseeing after landing, clearing customs and checking in.
    earliestStart = adjustedTime;

    arrivalBreakdown = {
      landingTime:          arrivalFlight.arrival_time.slice(0, 5),
      delayMinutes:         delayMins,
      immigrationMinutes:   IMMIGRATION_MINUTES,
      baggageMinutes:       BAGGAGE_MINUTES,
      transitMinutes:       transitMins,
      hotelCheckinMinutes:  HOTEL_CHECKIN_MINUTES,
      totalBufferMinutes:   totalBuffer,
      earliestActivityStart: earliestStart,
    };
  }

  // ── Departure day: work out latest activity end time ────────────────────
  // Skip entirely for overnight-transit days — the departure already happened
  // before the user arrived at the destination.
  if (departureFlight?.departure_time && !isOvernightTransit) {
    const isIntl       = departureFlight.is_international ?? true;
    const transitMins  = getTransitMinutes(departureFlight.origin_iata);
    const checkinMins  = isIntl ? INTERNATIONAL_CHECKIN_BUFFER : DOMESTIC_CHECKIN_BUFFER;

    const totalBuffer  = transitMins + checkinMins;
    const depMins      = timeToMinutes(departureFlight.departure_time);
    const latestMins   = depMins - totalBuffer;
    const latestTime   = minutesToTime(Math.max(latestMins, 0));

    latestEnd = latestTime;

    // Flag early departure: flight before 10:30 on a pure departure day.
    // These days have so little time that we show a special "plan manually" banner
    // instead of a regular activity schedule.
    const depHour = Math.floor(depMins / 60);
    const depMinute = depMins % 60;
    if (!isArrivalDay && (depHour < 10 || (depHour === 10 && depMinute < 30))) {
      isEarlyDeparture = true;
    }

    departureBreakdown = {
      departureTime:         departureFlight.departure_time.slice(0, 5),
      transitMinutes:        transitMins,
      airportCheckinMinutes: checkinMins,
      lastActivityMustEndBy: latestTime,
    };
  }

  const availableMinutes = calculateMinutesBetween(earliestStart, latestEnd);

  let dayLabel: DayConstraints['dayLabel'] = 'Full Day';
  if (isArrivalDay && isDepartureDay) dayLabel = 'Arrival & Departure Day';
  else if (isArrivalDay)              dayLabel = 'Arrival Day';
  else if (isDepartureDay)            dayLabel = 'Departure Day';

  return {
    dayNumber,
    isArrivalDay,
    isDepartureDay,
    isOvernightTransit,
    isEarlyDeparture,
    arrivalFlight,
    departureFlight,
    earliestStart,
    latestEnd,
    availableMinutes,
    dayLabel,
    arrivalBufferBreakdown:   arrivalBreakdown,
    departureBufferBreakdown: departureBreakdown,
  };
};

// ---------------------------------------------------------------------------
// Check whether a set of activities fits within a day's constraints
// ---------------------------------------------------------------------------
export const checkActivitiesFit = (
  activities: Activity[],
  constraints: DayConstraints,
  activityDurations: Map<string, number>,
): { fits: boolean; overflow: Activity[]; totalMinutesNeeded: number } => {
  const TRAVEL_BUFFER_BETWEEN = 30;

  let totalMinutesNeeded = 0;
  activities.forEach((activity, idx) => {
    const duration = activityDurations.get(activity.id) ?? estimateActivityDuration(activity.type);
    totalMinutesNeeded += duration + (idx > 0 ? TRAVEL_BUFFER_BETWEEN : 0);
  });

  const fits = totalMinutesNeeded <= constraints.availableMinutes;
  const overflow: Activity[] = [];

  if (!fits) {
    let running = 0;
    for (const activity of activities) {
      const duration = activityDurations.get(activity.id) ?? estimateActivityDuration(activity.type);
      running += duration + TRAVEL_BUFFER_BETWEEN;
      if (running > constraints.availableMinutes) overflow.push(activity);
    }
  }

  return { fits, overflow, totalMinutesNeeded };
};

// ---------------------------------------------------------------------------
// Estimate travel time between two activities using Haversine
// ---------------------------------------------------------------------------
export const estimateTravelTime = (
  from: Activity,
  to: Activity,
): { minutes: number; mode: 'walk' | 'metro' | 'taxi' | 'bus' } => {
  if (from.latitude && from.longitude && to.latitude && to.longitude) {
    const distance = haversineDistance(from.latitude, from.longitude, to.latitude, to.longitude);
    if (distance < 1)  return { minutes: Math.ceil(distance * 12),     mode: 'walk' };
    if (distance < 5)  return { minutes: Math.ceil(distance * 3) + 5,  mode: 'metro' };
    return               { minutes: Math.ceil(distance * 2) + 10,       mode: 'taxi' };
  }
  return { minutes: 15, mode: 'metro' };
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const timeToMinutes = (time: string): number => {
  const [h, m] = time.slice(0, 5).split(':').map(Number);
  return h * 60 + m;
};

export const minutesToTime = (minutes: number): string => {
  const capped = Math.max(0, Math.min(minutes, 23 * 60 + 59));
  const h = Math.floor(capped / 60);
  const m = capped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const calculateMinutesBetween = (start: string, end: string): number =>
  Math.max(0, timeToMinutes(end) - timeToMinutes(start));

export const estimateActivityDuration = (type: string): number => {
  switch (type) {
    case 'attraction':
    case 'museum':
    case 'landmark':    return 120;
    case 'restaurant':
    case 'food':        return 90;
    case 'shopping':    return 60;
    case 'transport':   return 30;
    case 'prebooked':   return 120;
    default:            return 60;
  }
};

export const formatAvailableTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
};

// ---------------------------------------------------------------------------
// Hook: compute constraints for every day of an itinerary
// ---------------------------------------------------------------------------
export const useDayConstraints = (
  numDays: number,
  startDate: Date | undefined,
  flights: FlightDetail[],
  dayPreferences: DayPreference[],
): DayConstraints[] => {
  return useMemo(() => {
    const constraints: DayConstraints[] = [];
    for (let i = 1; i <= numDays; i++) {
      const dayDate = startDate
        ? new Date(startDate.getTime() + (i - 1) * 86_400_000)
        : undefined;
      const pref = dayPreferences.find(p => p.day_number === i);
      constraints.push(calculateDayConstraints(i, dayDate, flights, pref?.start_time));
    }
    return constraints;
  }, [numDays, startDate, flights, dayPreferences]);
};
