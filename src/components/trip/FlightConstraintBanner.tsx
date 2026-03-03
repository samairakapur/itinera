import { Plane, Clock, AlertCircle, CalendarClock, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DayConstraints, formatAvailableTime } from '@/hooks/useSmartScheduling';
import { cn } from '@/lib/utils';

interface FlightConstraintBannerProps {
  constraints: DayConstraints;
  className?: string;
}

export const FlightConstraintBanner = ({ constraints, className }: FlightConstraintBannerProps) => {
  const {
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
  } = constraints;

  if (!isArrivalDay && !isDepartureDay) {
    return null;
  }

  // ── Early departure day: show a friendly "plan manually" notice ──────────
  // These days have a flight before ~10:30 AM so there's essentially no time
  // for scheduled activities. Encourage the user to add anything manually.
  if (isEarlyDeparture && isDepartureDay && !isArrivalDay) {
    return (
      <div className={cn(
        "rounded-lg border p-4 space-y-3 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
        className
      )}>
        <div className="flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="font-semibold text-amber-900 dark:text-amber-200">Early Departure Day</span>
        </div>

        {departureFlight && (
          <div className="flex items-center gap-3 p-2 rounded-md bg-background/50 text-sm">
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              <Plane className="w-4 h-4 -rotate-45 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="font-medium">Depart {departureFlight.departure_city}</span>
              {departureFlight.departure_time && (
                <span className="text-muted-foreground">
                  at {departureFlight.departure_time.slice(0, 5)}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 bg-amber-100 dark:bg-amber-900/40 rounded-md p-3">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
              Tight schedule before your flight
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              With an early morning departure, there may not be enough time for most activities.
              We've left this day open so you can plan it exactly the way you want — use the
              <strong> + Add Activity</strong> button to add anything you'd like to squeeze in
              (a quick breakfast, airport transfer, etc.).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
          <PlusCircle className="w-3 h-3" />
          <span>Tap <strong>Edit Day</strong> on the day card below to adjust the start time or add activities manually.</span>
        </div>
      </div>
    );
  }

  const isLimitedTime = availableMinutes < 360; // Less than 6 hours

  // ── Standard arrival / departure / transit banner ────────────────────────
  return (
    <div className={cn(
      "rounded-lg border p-4 space-y-3",
      isArrivalDay && isDepartureDay
        ? "bg-warning/10 border-warning/30"
        : isArrivalDay
          ? "bg-teal/10 border-teal/30"
          : "bg-coral/10 border-coral/30",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plane className={cn(
            "w-5 h-5",
            isArrivalDay && !isDepartureDay && "rotate-90",
            isDepartureDay && !isArrivalDay && "-rotate-45"
          )} />
          <span className="font-semibold">
            {isOvernightTransit ? 'Arrival Day' : dayLabel}
          </span>
        </div>
        {!isEarlyDeparture && (
          <Badge
            variant={isLimitedTime ? "destructive" : "secondary"}
            className="gap-1"
          >
            <Clock className="w-3 h-3" />
            {formatAvailableTime(availableMinutes)} available
          </Badge>
        )}
      </div>

      {/* Flight Details */}
      <div className="grid gap-2 text-sm">
        {arrivalFlight && (
          <div className="flex items-center gap-3 p-2 rounded-md bg-background/50">
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              <Plane className="w-4 h-4 rotate-90 text-teal shrink-0" />
              <span className="font-medium">Arrive {arrivalFlight.arrival_city}</span>
              {arrivalFlight.arrival_time && (
                <span className="text-muted-foreground">
                  at {arrivalFlight.arrival_time.slice(0, 5)}
                </span>
              )}
              {(arrivalFlight.delay_minutes ?? 0) > 0 && (
                <span className="text-xs text-amber-600 dark:text-amber-400">
                  +{arrivalFlight.delay_minutes}min delay
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              → activities from {earliestStart}
            </span>
          </div>
        )}

        {/* Only show departure row if it's NOT an overnight transit leg */}
        {departureFlight && !isOvernightTransit && (
          <div className="flex items-center gap-3 p-2 rounded-md bg-background/50">
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              <Plane className="w-4 h-4 -rotate-45 text-coral shrink-0" />
              <span className="font-medium">Depart {departureFlight.departure_city}</span>
              {departureFlight.departure_time && (
                <span className="text-muted-foreground">
                  at {departureFlight.departure_time.slice(0, 5)}
                </span>
              )}
              {departureFlight.is_international && (
                <span className="text-xs text-muted-foreground">(international)</span>
              )}
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              → activities until {latestEnd}
            </span>
          </div>
        )}

        {/* For overnight transits, show the departure as context only (no cutoff applied) */}
        {departureFlight && isOvernightTransit && (
          <div className="flex items-center gap-3 p-2 rounded-md bg-background/30 opacity-60">
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              <Plane className="w-4 h-4 -rotate-45 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">
                Departed {departureFlight.departure_city} at{' '}
                {departureFlight.departure_time?.slice(0, 5)} (overnight)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Limited Time Warning — only for non-overnight days */}
      {isLimitedTime && !isOvernightTransit && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-background/50 p-2 rounded-md">
          <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <p>
            Limited time today. Consider keeping activities close together or moving some to another day.
          </p>
        </div>
      )}
    </div>
  );
};
