import { useState } from 'react';
import { format } from 'date-fns';
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
  CheckCircle2,
  Timer,
  Edit3,
  Settings2
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ActivityCard, Activity } from './ActivityCard';
import { DayCheckInDialog } from './DayCheckInDialog';
import { TravelTimeCard } from './TravelTimeCard';
import { FlightConstraintBanner } from './FlightConstraintBanner';
import { DayEditorDialog } from './DayEditorDialog';
import { DayConstraints, estimateTravelTime, formatAvailableTime } from '@/hooks/useSmartScheduling';
import { cn } from '@/lib/utils';

export interface DayWeather {
  date: string;
  condition: string;
  tempMin: number;
  tempMax: number;
  precipChance: number;
  recommendation: string;
}

export interface DayData {
  dayNumber: number;
  title: string;
  date?: string;
  actualDate?: Date;
  startTime?: string;
  weather?: DayWeather;
  weatherNote?: string;
  cityName?: string;
  countryName?: string;
  morning: Activity[];
  afternoon: Activity[];
  evening: Activity[];
}

interface DayCardProps {
  day: DayData;
  cityName?: string;
  startDate?: Date;
  defaultOpen?: boolean;
  showCheckIn?: boolean;
  completedActivityIds?: Set<string>;
  itineraryId?: string;
  totalDays?: number;
  constraints?: DayConstraints;
  onActivityRemove?: (dayNumber: number, activityId: string) => void;
  onActivitySwap?: (dayNumber: number, activityId: string) => void;
  onActivityToggleMustDo?: (dayNumber: number, activityId: string) => void;
  onActivityMove?: (dayNumber: number, activityId: string, direction: 'up' | 'down') => void;
  onActivityEdit?: (dayNumber: number, activityId: string) => void;
  onAddActivity?: (dayNumber: number, timeSlot: 'morning' | 'afternoon' | 'evening') => void;
  onToggleActivityComplete?: (dayNumber: number, activityId: string) => void;
  onCarryOverActivities?: (fromDay: number, activityIds: string[]) => void;
  onStartTimeChange?: (dayNumber: number, newTime: string, affectedActivities: Activity[]) => void;
  onDayEditorSave?: (dayNumber: number, config: { startTime: string; pace: string; activitiesToMove: string[]; targetDay: number }) => void;
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
  cityName,
  completedIds,
  onRemove,
  onSwap,
  onToggleMustDo,
  onMoveUp,
  onMoveDown,
  onEdit,
  onAdd,
  onToggleComplete,
}: {
  icon: React.ElementType;
  label: string;
  activities: Activity[];
  dayNumber: number;
  timeSlot: 'morning' | 'afternoon' | 'evening';
  cityName?: string;
  completedIds?: Set<string>;
  onRemove?: (id: string) => void;
  onSwap?: (id: string) => void;
  onToggleMustDo?: (id: string) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  onEdit?: (id: string) => void;
  onAdd?: () => void;
  onToggleComplete?: (id: string) => void;
}) => {
  // Calculate travel time between consecutive activities
  const getTravelInfo = (index: number): { minutes: number; mode: 'walk' | 'metro' | 'taxi' | 'bus'; fromTitle: string; toTitle: string } | null => {
    if (index === 0) return null;
    const prev = activities[index - 1];
    const curr = activities[index];
    
    // Use estimateTravelTime from useSmartScheduling
    const travelInfo = estimateTravelTime(prev, curr);
    return {
      ...travelInfo,
      fromTitle: prev.title,
      toTitle: curr.title,
    };
  };

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
          activities.map((activity, index) => {
            const travelInfo = getTravelInfo(index);
            return (
              <div key={activity.id} className="space-y-0">
                {/* Travel time card between activities */}
                {travelInfo && (
                  <TravelTimeCard
                    fromTitle={travelInfo.fromTitle}
                    toTitle={travelInfo.toTitle}
                    minutes={travelInfo.minutes}
                    mode={travelInfo.mode}
                    compact
                  />
                )}
                <ActivityCard
                  activity={activity}
                  cityName={cityName}
                isCompleted={completedIds?.has(activity.id)}
                onRemove={onRemove}
                onSwap={onSwap}
                onToggleMustDo={onToggleMustDo}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
                  onEdit={onEdit}
                  onToggleComplete={onToggleComplete}
                  isFirst={index === 0}
                  isLast={index === activities.length - 1}
                />
              </div>
            );
          })
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
  cityName,
  startDate,
  defaultOpen = false,
  showCheckIn = false,
  completedActivityIds = new Set(),
  itineraryId,
  totalDays = 1,
  constraints,
  onActivityRemove,
  onActivitySwap,
  onActivityToggleMustDo,
  onActivityMove,
  onActivityEdit,
  onAddActivity,
  onToggleActivityComplete,
  onCarryOverActivities,
  onStartTimeChange,
  onDayEditorSave,
}: DayCardProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [dayEditorOpen, setDayEditorOpen] = useState(false);

  const allActivities = [...day.morning, ...day.afternoon, ...day.evening];
  const totalActivities = allActivities.length;
  const completedCount = allActivities.filter(a => completedActivityIds.has(a.id)).length;

  // Calculate actual date from start date
  const actualDate = startDate 
    ? new Date(startDate.getTime() + (day.dayNumber - 1) * 24 * 60 * 60 * 1000)
    : day.actualDate;
  
  const formattedDate = actualDate ? format(actualDate, 'MMM d') : day.date;
  const dayOfWeek = actualDate ? format(actualDate, 'EEE') : '';

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
  const handleToggleComplete = onToggleActivityComplete
    ? (id: string) => onToggleActivityComplete(day.dayNumber, id)
    : undefined;

  const handleCarryOver = (activityIds: string[]) => {
    if (onCarryOverActivities) {
      onCarryOverActivities(day.dayNumber, activityIds);
    }
  };

  const handleStartTimeChange = (newTime: string, affectedActivities: Activity[]) => {
    if (onStartTimeChange) {
      onStartTimeChange(day.dayNumber, newTime, affectedActivities);
    }
  };

  const WeatherIcon = day.weather ? getWeatherIcon(day.weather.condition) : Sun;

  // Clean title
  const cleanTitle = day.title && !day.title.toLowerCase().startsWith('day') 
    ? day.title 
    : day.title.replace(/^day\s*\d+\s*[-–—:\s]*/i, '').trim() || 'Exploring';

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="border shadow-sm overflow-hidden">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-primary flex flex-col items-center justify-center text-primary-foreground">
                    {formattedDate ? (
                      <>
                        <span className="text-xs font-medium leading-none">{dayOfWeek}</span>
                        <span className="text-sm font-bold leading-tight">{formattedDate.split(' ')[1]}</span>
                      </>
                    ) : (
                      <span className="font-bold text-lg">{day.dayNumber}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground">
                      {formattedDate ? `${formattedDate} – ${cleanTitle}` : `Day ${day.dayNumber} – ${cleanTitle}`}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                      <span>{totalActivities} {totalActivities === 1 ? 'activity' : 'activities'}</span>
                      {showCheckIn && completedCount > 0 && (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {completedCount}/{totalActivities}
                        </Badge>
                      )}
                      {(day.startTime || itineraryId) && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Starts {constraints?.isArrivalDay ? constraints.earliestStart : (day.startTime || '09:00')}
                        </span>
                      )}
                      {constraints?.isDepartureDay && (
                        <span className="flex items-center gap-1">
                          <Timer className="w-3 h-3" />
                          Until {constraints.latestEnd}
                        </span>
                      )}
                    </div>
                    {/* City Tag – always visible */}
                    {(day.cityName || cityName) && (
                      <Badge variant="outline" className="mt-1.5 text-xs bg-primary/10 text-primary border-primary/30 gap-1">
                        📍 {day.cityName || cityName}
                      </Badge>
                    )}
                  </div>
                </div>
                {/* Edit Day Button - replaces DayStartTimeSelector */}
                {itineraryId && onDayEditorSave && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-8 px-3 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDayEditorOpen(true);
                    }}
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    Edit Day
                  </Button>
                )}
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

              {/* Start Time - flight-aware */}
              {(day.startTime || constraints) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground pb-2 border-b">
                  <Clock className="w-4 h-4" />
                  <span>Day starts at <strong className="text-foreground">
                    {constraints?.isArrivalDay ? constraints.earliestStart : (day.startTime || '09:00')}
                  </strong></span>
                  {constraints?.isArrivalDay && (
                    <Badge variant="outline" className="text-xs ml-auto">Flight adjusted</Badge>
                  )}
                  {constraints?.isDepartureDay && (
                    <span className="ml-auto text-xs">Activities until <strong>{constraints.latestEnd}</strong></span>
                  )}
                </div>
              )}

              {/* Time Slots */}
              <TimeSlot
                icon={Sunrise}
                label="Morning"
                activities={day.morning}
                dayNumber={day.dayNumber}
                timeSlot="morning"
                cityName={cityName}
                completedIds={completedActivityIds}
                onRemove={handleRemove}
                onSwap={handleSwap}
                onToggleMustDo={handleToggleMustDo}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                onEdit={handleEdit}
                onAdd={handleAddMorning}
                onToggleComplete={handleToggleComplete}
              />
              <TimeSlot
                icon={Sun}
                label="Afternoon"
                activities={day.afternoon}
                dayNumber={day.dayNumber}
                timeSlot="afternoon"
                cityName={cityName}
                completedIds={completedActivityIds}
                onRemove={handleRemove}
                onSwap={handleSwap}
                onToggleMustDo={handleToggleMustDo}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                onEdit={handleEdit}
                onAdd={handleAddAfternoon}
                onToggleComplete={handleToggleComplete}
              />
              <TimeSlot
                icon={Sunset}
                label="Evening"
                activities={day.evening}
                dayNumber={day.dayNumber}
                timeSlot="evening"
                cityName={cityName}
                completedIds={completedActivityIds}
                onRemove={handleRemove}
                onSwap={handleSwap}
                onToggleMustDo={handleToggleMustDo}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                onEdit={handleEdit}
                onAdd={handleAddEvening}
                onToggleComplete={handleToggleComplete}
              />

              {/* Check-in Button */}
              {showCheckIn && (
                <Button
                  variant="outline"
                  className="w-full mt-4 gap-2"
                  onClick={() => setCheckInOpen(true)}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  End Day Check-In
                </Button>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Check-in Dialog */}
      <DayCheckInDialog
        open={checkInOpen}
        onOpenChange={setCheckInOpen}
        dayNumber={day.dayNumber}
        dayDate={formattedDate}
        activities={allActivities}
        completedIds={completedActivityIds}
        onToggleActivity={(id) => handleToggleComplete?.(id)}
        onCarryOver={handleCarryOver}
        onComplete={() => setCheckInOpen(false)}
      />

      {/* Day Editor Dialog */}
      {constraints && onDayEditorSave && (
        <DayEditorDialog
          open={dayEditorOpen}
          onOpenChange={setDayEditorOpen}
          dayNumber={day.dayNumber}
          dayLabel={cleanTitle}
          currentStartTime={day.startTime || '09:00'}
          constraints={constraints}
          activities={allActivities}
          totalDays={totalDays}
          onSave={(config) => onDayEditorSave(day.dayNumber, config)}
        />
      )}
    </>
  );
};
