import { useState } from 'react';
import { ChevronDown, Sun, CloudSun, Sunrise, Sunset } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ActivityCard, Activity } from './ActivityCard';
import { cn } from '@/lib/utils';

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

interface DayCardProps {
  day: DayData;
  defaultOpen?: boolean;
  onActivityRemove?: (dayNumber: number, activityId: string) => void;
  onActivitySwap?: (dayNumber: number, activityId: string) => void;
  onActivityToggleMustDo?: (dayNumber: number, activityId: string) => void;
  onActivityMove?: (dayNumber: number, activityId: string, direction: 'up' | 'down') => void;
}

const TimeSlot = ({
  icon: Icon,
  label,
  activities,
  onRemove,
  onSwap,
  onToggleMustDo,
  onMoveUp,
  onMoveDown,
}: {
  icon: React.ElementType;
  label: string;
  activities: Activity[];
  onRemove?: (id: string) => void;
  onSwap?: (id: string) => void;
  onToggleMustDo?: (id: string) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
}) => {
  if (activities.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </div>
      <div className="space-y-2 pl-6">
        {activities.map((activity, index) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            onRemove={onRemove}
            onSwap={onSwap}
            onToggleMustDo={onToggleMustDo}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            isFirst={index === 0}
            isLast={index === activities.length - 1}
          />
        ))}
      </div>
    </div>
  );
};

export const DayCard = ({
  day,
  defaultOpen = false,
  onActivityRemove,
  onActivitySwap,
  onActivityToggleMustDo,
  onActivityMove,
}: DayCardProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const totalActivities = day.morning.length + day.afternoon.length + day.evening.length;

  const handleRemove = onActivityRemove
    ? (id: string) => onActivityRemove(day.dayNumber, id)
    : undefined;
  const handleSwap = onActivitySwap
    ? (id: string) => onActivitySwap(day.dayNumber, id)
    : undefined;
  const handleToggleMustDo = onActivityToggleMustDo
    ? (id: string) => onActivityToggleMustDo(day.dayNumber, id)
    : undefined;
  const handleMoveUp = onActivityMove
    ? (id: string) => onActivityMove(day.dayNumber, id, 'up')
    : undefined;
  const handleMoveDown = onActivityMove
    ? (id: string) => onActivityMove(day.dayNumber, id, 'down')
    : undefined;

  // Get preview of activities for collapsed state
  const allActivities = [...day.morning, ...day.afternoon, ...day.evening];
  const previewActivities = allActivities.slice(0, 3);
  const remainingCount = allActivities.length - 3;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border shadow-sm overflow-hidden bg-card">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0">
                  {day.dayNumber}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lg font-bold text-foreground">
                    Day {day.dayNumber} – {day.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {totalActivities} {totalActivities === 1 ? 'activity' : 'activities'}
                    {day.date && ` • ${day.date}`}
                  </p>
                  {/* Activity preview when collapsed */}
                  {!isOpen && previewActivities.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {previewActivities.map((activity) => (
                        <span
                          key={activity.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground"
                        >
                          {activity.type === 'restaurant' ? '🍽️' : '🏛️'}
                          <span className="truncate max-w-[120px]">{activity.title}</span>
                        </span>
                      ))}
                      {remainingCount > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground">
                          +{remainingCount} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {day.weather && (
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-sm">
                    <span>{day.weather.temp}°C</span>
                  </div>
                )}
                <Button variant="ghost" size="icon" className="shrink-0">
                  <ChevronDown className={cn(
                    "w-5 h-5 transition-transform duration-200",
                    isOpen && "rotate-180"
                  )} />
                </Button>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="p-4 pt-0 space-y-6">
            <TimeSlot
              icon={Sunrise}
              label="Morning"
              activities={day.morning}
              onRemove={handleRemove}
              onSwap={handleSwap}
              onToggleMustDo={handleToggleMustDo}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
            />
            <TimeSlot
              icon={Sun}
              label="Afternoon"
              activities={day.afternoon}
              onRemove={handleRemove}
              onSwap={handleSwap}
              onToggleMustDo={handleToggleMustDo}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
            />
            <TimeSlot
              icon={Sunset}
              label="Evening"
              activities={day.evening}
              onRemove={handleRemove}
              onSwap={handleSwap}
              onToggleMustDo={handleToggleMustDo}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
            />
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
