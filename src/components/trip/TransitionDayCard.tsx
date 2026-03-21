/**
 * TransitionDayCard — Gap 4 (Multi-city legs)
 *
 * Rendered between the last activity-day of one leg and the first
 * activity-day of the next leg.  Shows the inter-city journey at a glance:
 *  • Route visualisation  (departure city  →  arrival city)
 *  • Connecting flight details  (if available from flight_details)
 *  • Earliest activity start on the arrival day  (from dayConstraints)
 */

import { Plane, ArrowRight, Clock, MapPin, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FlightDetail } from '@/hooks/useFlightDetails';
import { TripLeg } from '@/hooks/useTripLegs';

interface TransitionDayCardProps {
  /** The leg the traveller is leaving */
  fromLeg: TripLeg;
  /** The leg the traveller is arriving at */
  toLeg: TripLeg;
  /**
   * Flights whose departure_city roughly matches fromLeg and arrival_city
   * matches toLeg (filtered by the parent before passing in).
   */
  connectingFlights: FlightDetail[];
  /**
   * The computed `earliestStart` string ("HH:mm") for the arrival day.
   * When provided, we show "Activities resume from HH:MM" — giving the user
   * an instant read of how the flight buffers affect their free time.
   */
  arrivalDayStart?: string;
  /** 1-indexed day number of the arrival day (for the label) */
  arrivalDayNumber?: number;
}

export const TransitionDayCard = ({
  fromLeg,
  toLeg,
  connectingFlights,
  arrivalDayStart,
  arrivalDayNumber,
}: TransitionDayCardProps) => {
  const fromCity = fromLeg.city?.name || 'Departure';
  const toCity   = toLeg.city?.name   || 'Arrival';

  // Pick the most relevant flight — first leg-number match, else first in list
  const flight = connectingFlights[0] ?? null;

  const depTime = flight?.departure_time?.slice(0, 5);
  const arrTime = flight?.arrival_time?.slice(0, 5);
  const flightLabel = [flight?.airline, flight?.flight_number].filter(Boolean).join(' ');

  return (
    <Card className="border border-violet-200 dark:border-violet-800 bg-gradient-to-r from-violet-50/60 to-indigo-50/60 dark:from-violet-950/30 dark:to-indigo-950/30 overflow-hidden">
      {/* Thin accent stripe */}
      <div className="h-1 w-full bg-gradient-to-r from-violet-400 via-indigo-400 to-sky-400" />

      <CardContent className="p-4">
        {/* Header row */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center shrink-0">
            <Plane className="w-3.5 h-3.5 text-violet-600 dark:text-violet-300" />
          </div>
          <p className="text-sm font-semibold text-violet-900 dark:text-violet-100">
            Travel Day — onward to {toCity}
          </p>
          {flight?.is_international && (
            <Badge
              variant="outline"
              className="text-[10px] border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 ml-auto"
            >
              International
            </Badge>
          )}
        </div>

        {/* Route visualisation */}
        <div className="flex items-center gap-2 mb-3">
          {/* From city pill */}
          <div className="flex items-center gap-1.5 rounded-full bg-white/70 dark:bg-white/10 border border-violet-200 dark:border-violet-700 px-3 py-1.5">
            <MapPin className="w-3 h-3 text-violet-500 dark:text-violet-400 shrink-0" />
            <span className="text-xs font-medium text-violet-900 dark:text-violet-100 whitespace-nowrap">
              {fromCity}
            </span>
            {flight?.origin_iata && (
              <span className="text-[10px] text-violet-500 dark:text-violet-400 font-mono">
                {flight.origin_iata}
              </span>
            )}
          </div>

          {/* Arrow */}
          <div className="flex-1 flex items-center justify-center gap-1 min-w-0">
            <div className="h-px flex-1 bg-violet-200 dark:bg-violet-700" />
            <ArrowRight className="w-3.5 h-3.5 text-violet-400 dark:text-violet-500 shrink-0" />
            <div className="h-px flex-1 bg-violet-200 dark:bg-violet-700" />
          </div>

          {/* To city pill */}
          <div className="flex items-center gap-1.5 rounded-full bg-white/70 dark:bg-white/10 border border-violet-200 dark:border-violet-700 px-3 py-1.5">
            <MapPin className="w-3 h-3 text-indigo-500 dark:text-indigo-400 shrink-0" />
            <span className="text-xs font-medium text-indigo-900 dark:text-indigo-100 whitespace-nowrap">
              {toCity}
            </span>
            {flight?.destination_iata && (
              <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-mono">
                {flight.destination_iata}
              </span>
            )}
          </div>
        </div>

        {/* Flight details row */}
        {flight ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 mb-2.5">
            {flightLabel && (
              <span className="text-xs font-medium text-violet-800 dark:text-violet-200">
                {flightLabel}
              </span>
            )}
            {depTime && (
              <span className="text-xs text-violet-700 dark:text-violet-300">
                Dep {depTime}
              </span>
            )}
            {arrTime && (
              <span className="text-xs text-violet-700 dark:text-violet-300">
                Arr {arrTime}
              </span>
            )}
            {flight.terminal && (
              <span className="text-xs text-muted-foreground">
                Terminal {flight.terminal}
              </span>
            )}
            {flight.booking_reference && (
              <span className="text-xs text-muted-foreground font-mono">
                Ref: {flight.booking_reference}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-1 mb-2.5">
            <Info className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              No flight details recorded for this leg — add via the ✈ button above.
            </span>
          </div>
        )}

        {/* Arrival buffer note */}
        {arrivalDayStart && (
          <div className="flex items-center gap-2 rounded-lg bg-white/60 dark:bg-white/5 border border-violet-100 dark:border-violet-800/60 px-3 py-2 mt-1">
            <Clock className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
            <p className="text-xs text-indigo-800 dark:text-indigo-200">
              Activities{arrivalDayNumber ? ` on Day ${arrivalDayNumber}` : ''} start from{' '}
              <span className="font-semibold">{arrivalDayStart}</span>
              {' '}— flight arrival + transfer buffer applied
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
