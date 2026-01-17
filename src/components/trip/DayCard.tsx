import { useState } from 'react';
import { 
  ChevronDown, 
  Sun, 
  CloudSun, 
  Sunrise, 
  Sunset, 
  Cloud, 
  CloudRain, 
  Snowflake,
  Clock,
  Plus,
  Thermometer,
  Droplets,
  Wind
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ActivityCard, Activity } from './ActivityCard';
import { cn } from '@/lib/utils';

export interface DayWeather {
  date: string;
  condition: string;
  tempMin: number;
  tempMax: number;
  precipChance: number;
  recommendation: string; // AI recommendation based on weather
}

export interface DayData {
  dayNumber: number;
  title: string;
  date?: string;
  startTime?: string; // e.g., "9:00 AM"
  weather?: DayWeather;
  weatherNote?: string; // AI-generated weather planning note
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
  onActivityEdit?: (dayNumber: number, activityId: string) => void;
  onAddActivity?: (dayNumber: number, timeSlot: 'morning' | 'afternoon' | 'evening') => void;
}

const getWeatherIcon = (condition: string) => {
  const lower = condition.toLowerCase();
  if (lower.includes('rain') || lower.includes('drizzle') || lower.includes('shower')) {
    return CloudRain;
  }
  if (lower.includes('snow')) {
    return Snowflake;
  }
  if (lower.includes('cloud') || lower.includes('overcast')) {
    return Cloud;
  }
  if (lower.includes('partly') || lower.includes('variable')) {
    return CloudSun;
  }
  return Sun;
};

const TimeSlot = ({
  icon: Icon,
  label,
  activities,
  dayNumber,
  timeSlot,
  onRemove,
  onSwap,
  onToggleMustDo,
  onMoveUp,
  onMoveDown,
  onEdit,
  onAdd,
}: {
  icon: React.ElementType;
  label: string;
  activities: Activity[];
  dayNumber: number;
  timeSlot: 'morning' | 'afternoon' | 'evening';
  onRemove?: (id: string) => void;
  onSwap?: (id: string) => void;
  onToggleMustDo?: (id: string) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  onEdit?: (id: string) => void;
  onAdd?: () => void;
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Icon className="w-4 h-4" />
          <span>{label}</span>
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
            {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
          </span>
        </div>
        {onAdd && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-primary hover:text-primary"
            onClick={onAdd}
          >
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        )}
      </div>
      <div className="space-y-2 pl-6">
        {activities.length > 0 ? (
          activities.map((activity, index) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onRemove={onRemove}
              onSwap={onSwap}
              onToggleMustDo={onToggleMustDo}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              onEdit={onEdit}
              isFirst={index === 0}
              isLast={index === activities.length - 1}
            />
          ))
        ) : (
          <div className="py-4 px-3 border-2 border-dashed rounded-lg text-center text-muted-foreground text-sm">
            No activities planned
            {onAdd && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 ml-1 text-primary"
                onClick={onAdd}
              >
                Add one
              </Button>
            )}
          </div>
        )}
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
  onActivityEdit,
  onAddActivity,
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
  const handleEdit = onActivityEdit
    ? (id: string) => onActivityEdit(day.dayNumber, id)
    : undefined;
  const handleAddMorning = onAddActivity
    ? () => onAddActivity(day.dayNumber, 'morning')
    : undefined;
  const handleAddAfternoon = onAddActivity
    ? () => onAddActivity(day.dayNumber, 'afternoon')
    : undefined;
  const handleAddEvening = onAddActivity
    ? () => onAddActivity(day.dayNumber, 'evening')
    : undefined;

  // Get weather icon component
  const WeatherIcon = day.weather ? getWeatherIcon(day.weather.condition) : Sun;

  // Clean title - remove redundant "Day X" prefixes
  const cleanTitle = day.title && !day.title.toLowerCase().startsWith('day') 
    ? day.title 
    : day.title.replace(/^day\s*\d+\s*[-–—:\s]*/i, '').trim() || 'Exploring';

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border shadow-sm overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                  {day.dayNumber}
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground">
                    Day {day.dayNumber} – {cleanTitle}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{totalActivities} {totalActivities === 1 ? 'activity' : 'activities'}</span>
                    {day.startTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Starts {day.startTime}
                      </span>
                    )}
                    {day.date && <span>• {day.date}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {day.weather && (
                  <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-sm">
                    <WeatherIcon className="w-4 h-4 text-primary" />
                    <div className="flex flex-col items-end">
                      <span className="font-medium">{day.weather.tempMin}° - {day.weather.tempMax}°C</span>
                      <span className="text-xs text-muted-foreground">{day.weather.condition}</span>
                    </div>
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
            {/* Weather Summary Banner */}
            {day.weather && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-sky/10 via-primary/5 to-teal/10 border border-sky/20">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-background/80 shadow-sm">
                    <WeatherIcon className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h4 className="font-semibold text-foreground">{day.weather.condition}</h4>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Thermometer className="w-3.5 h-3.5" />
                          {day.weather.tempMin}° - {day.weather.tempMax}°C
                        </span>
                        {day.weather.precipChance > 0 && (
                          <span className="flex items-center gap-1">
                            <Droplets className="w-3.5 h-3.5" />
                            {day.weather.precipChance}% rain
                          </span>
                        )}
                      </div>
                    </div>
                    {(day.weatherNote || day.weather.recommendation) && (
                      <p className="text-sm text-muted-foreground">
                        {day.weatherNote || day.weather.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Start Time */}
            {day.startTime && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground pb-2 border-b">
                <Clock className="w-4 h-4" />
                <span>Day starts at <strong className="text-foreground">{day.startTime}</strong></span>
              </div>
            )}

            {/* Time Slots */}
            <TimeSlot
              icon={Sunrise}
              label="Morning"
              activities={day.morning}
              dayNumber={day.dayNumber}
              timeSlot="morning"
              onRemove={handleRemove}
              onSwap={handleSwap}
              onToggleMustDo={handleToggleMustDo}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onEdit={handleEdit}
              onAdd={handleAddMorning}
            />
            <TimeSlot
              icon={Sun}
              label="Afternoon"
              activities={day.afternoon}
              dayNumber={day.dayNumber}
              timeSlot="afternoon"
              onRemove={handleRemove}
              onSwap={handleSwap}
              onToggleMustDo={handleToggleMustDo}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onEdit={handleEdit}
              onAdd={handleAddAfternoon}
            />
            <TimeSlot
              icon={Sunset}
              label="Evening"
              activities={day.evening}
              dayNumber={day.dayNumber}
              timeSlot="evening"
              onRemove={handleRemove}
              onSwap={handleSwap}
              onToggleMustDo={handleToggleMustDo}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onEdit={handleEdit}
              onAdd={handleAddEvening}
            />
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
