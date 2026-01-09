import { Sun, Sunrise, Sunset, Landmark, Utensils, Star, X, ArrowUp, ArrowDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Activity } from './ActivityCard';

export interface DayData {
  dayNumber: number;
  title: string;
  date?: string;
  weather?: {
    temp: number;
    condition: string;
  };
  morning: Activity[];
  afternoon: Activity[];
  evening: Activity[];
}

interface ItineraryTimelineProps {
  days: DayData[];
  onActivityRemove?: (dayNumber: number, activityId: string) => void;
  onActivityToggleMustDo?: (dayNumber: number, activityId: string) => void;
}

const TimeSlotSection = ({
  icon: Icon,
  label,
  activities,
  dayNumber,
  onRemove,
  onToggleMustDo,
}: {
  icon: React.ElementType;
  label: string;
  activities: Activity[];
  dayNumber: number;
  onRemove?: (dayNumber: number, id: string) => void;
  onToggleMustDo?: (dayNumber: number, id: string) => void;
}) => {
  if (activities.length === 0) return null;

  return (
    <div className="relative pl-8 pb-6 last:pb-0">
      {/* Timeline connector */}
      <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
      
      {/* Time slot indicator */}
      <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-background border-2 border-primary flex items-center justify-center">
        <Icon className="w-3 h-3 text-primary" />
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </h4>
        
        <div className="space-y-2">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className={cn(
                "group relative flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors",
                activity.mustDo && "ring-1 ring-primary/30 bg-primary/5"
              )}
            >
              {/* Activity icon */}
              <div className={cn(
                "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                activity.type === 'restaurant' 
                  ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                  : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
              )}>
                {activity.type === 'restaurant' ? (
                  <Utensils className="w-4 h-4" />
                ) : (
                  <Landmark className="w-4 h-4" />
                )}
              </div>

              {/* Activity content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={cn(
                      "font-medium text-foreground",
                      activity.mustDo && "text-primary"
                    )}>
                      {activity.title}
                      {activity.mustDo && (
                        <Star className="inline-block w-3.5 h-3.5 ml-1.5 fill-primary text-primary" />
                      )}
                    </p>
                    {activity.description && (
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                        {activity.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onToggleMustDo && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onToggleMustDo(dayNumber, activity.id)}
                      >
                        <Star className={cn(
                          "w-3.5 h-3.5",
                          activity.mustDo && "fill-primary text-primary"
                        )} />
                      </Button>
                    )}
                    {onRemove && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => onRemove(dayNumber, activity.id)}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {activity.duration && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <Badge variant="secondary" className="text-xs py-0 px-1.5">
                      {activity.duration}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const DaySection = ({
  day,
  isLast,
  onActivityRemove,
  onActivityToggleMustDo,
}: {
  day: DayData;
  isLast: boolean;
  onActivityRemove?: (dayNumber: number, activityId: string) => void;
  onActivityToggleMustDo?: (dayNumber: number, activityId: string) => void;
}) => {
  const totalActivities = day.morning.length + day.afternoon.length + day.evening.length;

  return (
    <div className={cn("relative", !isLast && "pb-8")}>
      {/* Day header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg">
          {day.dayNumber}
        </div>
        <div>
          <h3 className="font-display text-xl font-bold text-foreground">
            {day.title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {totalActivities} {totalActivities === 1 ? 'activity' : 'activities'}
            {day.date && ` • ${day.date}`}
            {day.weather && ` • ${day.weather.temp}°C ${day.weather.condition}`}
          </p>
        </div>
      </div>

      {/* Time slots */}
      <div className="ml-2">
        <TimeSlotSection
          icon={Sunrise}
          label="Morning"
          activities={day.morning}
          dayNumber={day.dayNumber}
          onRemove={onActivityRemove}
          onToggleMustDo={onActivityToggleMustDo}
        />
        <TimeSlotSection
          icon={Sun}
          label="Afternoon"
          activities={day.afternoon}
          dayNumber={day.dayNumber}
          onRemove={onActivityRemove}
          onToggleMustDo={onActivityToggleMustDo}
        />
        <TimeSlotSection
          icon={Sunset}
          label="Evening"
          activities={day.evening}
          dayNumber={day.dayNumber}
          onRemove={onActivityRemove}
          onToggleMustDo={onActivityToggleMustDo}
        />
      </div>

      {/* Day separator */}
      {!isLast && (
        <div className="absolute left-7 bottom-0 w-px h-8 bg-gradient-to-b from-border to-transparent" />
      )}
    </div>
  );
};

export const ItineraryTimeline = ({
  days,
  onActivityRemove,
  onActivityToggleMustDo,
}: ItineraryTimelineProps) => {
  if (days.length === 0) return null;

  return (
    <Card className="border-0 shadow-card overflow-hidden">
      <div className="p-6">
        <h2 className="font-display text-xl font-bold text-foreground mb-6">
          Your Itinerary
        </h2>
        
        <div className="space-y-0">
          {days.map((day, index) => (
            <DaySection
              key={day.dayNumber}
              day={day}
              isLast={index === days.length - 1}
              onActivityRemove={onActivityRemove}
              onActivityToggleMustDo={onActivityToggleMustDo}
            />
          ))}
        </div>
      </div>
    </Card>
  );
};
