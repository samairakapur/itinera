import { Plane, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DayConstraints, formatAvailableTime } from '@/hooks/useSmartScheduling';
import { cn } from '@/lib/utils';

interface FlightConstraintBannerProps {
  constraints: DayConstraints;
  className?: string;
}

export const FlightConstraintBanner = ({ constraints, className }: FlightConstraintBannerProps) => {
  const { isArrivalDay, isDepartureDay, arrivalFlight, departureFlight, earliestStart, latestEnd, availableMinutes, dayLabel } = constraints;

  if (!isArrivalDay && !isDepartureDay) {
    return null;
  }

  const isLimitedTime = availableMinutes < 360; // Less than 6 hours

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
          <span className="font-semibold">{dayLabel}</span>
        </div>
        <Badge 
          variant={isLimitedTime ? "destructive" : "secondary"}
          className="gap-1"
        >
          <Clock className="w-3 h-3" />
          {formatAvailableTime(availableMinutes)} available
        </Badge>
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

        {departureFlight && (
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
      </div>

      {/* Limited Time Warning */}
      {isLimitedTime && (
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
