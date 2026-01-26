import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Clock, AlertTriangle } from 'lucide-react';
import { useUpsertDayPreference, calculateAvailableMinutes, estimateActivityDuration } from '@/hooks/useDayPreferences';
import { Activity } from './ActivityCard';

interface DayStartTimeSelectorProps {
  itineraryId: string;
  dayNumber: number;
  currentStartTime: string;
  activities: Activity[];
  onStartTimeChange?: (newTime: string, affectedActivities: Activity[]) => void;
}

export const DayStartTimeSelector = ({
  itineraryId,
  dayNumber,
  currentStartTime,
  activities,
  onStartTimeChange,
}: DayStartTimeSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState(currentStartTime);
  const [showWarning, setShowWarning] = useState(false);
  const [affectedActivities, setAffectedActivities] = useState<Activity[]>([]);

  const upsertPreference = useUpsertDayPreference();

  useEffect(() => {
    setSelectedTime(currentStartTime);
  }, [currentStartTime]);

  const calculateImpact = (newTime: string) => {
    const availableMinutes = calculateAvailableMinutes(newTime);
    const currentAvailable = calculateAvailableMinutes(currentStartTime);
    
    if (availableMinutes >= currentAvailable) {
      return { hasImpact: false, affected: [] };
    }

    // Calculate total time needed for all activities
    let totalNeeded = 0;
    const affected: Activity[] = [];
    
    activities.forEach(activity => {
      const duration = estimateActivityDuration(activity.type);
      totalNeeded += duration + 30; // Add 30min buffer between activities
    });

    if (totalNeeded > availableMinutes) {
      // Find activities that might not fit
      let timeUsed = 0;
      activities.forEach(activity => {
        const duration = estimateActivityDuration(activity.type);
        timeUsed += duration + 30;
        if (timeUsed > availableMinutes) {
          affected.push(activity);
        }
      });
    }

    return { hasImpact: affected.length > 0, affected };
  };

  const handleTimeChange = (newTime: string) => {
    setSelectedTime(newTime);
    const impact = calculateImpact(newTime);
    setShowWarning(impact.hasImpact);
    setAffectedActivities(impact.affected);
  };

  const handleConfirm = async (moveToNextDay: boolean = false) => {
    await upsertPreference.mutateAsync({
      itinerary_id: itineraryId,
      day_number: dayNumber,
      start_time: selectedTime,
    });

    if (onStartTimeChange) {
      onStartTimeChange(selectedTime, moveToNextDay ? affectedActivities : []);
    }

    setOpen(false);
    setShowWarning(false);
  };

  const handleCancel = () => {
    setSelectedTime(currentStartTime);
    setShowWarning(false);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 h-7 px-2 text-xs">
          <Clock className="w-3.5 h-3.5" />
          {currentStartTime.slice(0, 5)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Day {dayNumber} Start Time</Label>
            <Input
              type="time"
              value={selectedTime}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Activities will be scheduled starting from this time.
            </p>
          </div>

          {showWarning && affectedActivities.length > 0 && (
            <div className="rounded-lg border border-warning bg-warning/10 p-3 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-warning">Schedule Impact</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Starting at {selectedTime.slice(0, 5)} may not leave enough time for:
                  </p>
                </div>
              </div>
              <ul className="text-xs space-y-1 ml-6">
                {affectedActivities.map((activity, i) => (
                  <li key={activity.id} className="text-muted-foreground">
                    • {activity.title}
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                  onClick={() => handleConfirm(true)}
                >
                  Move affected to next day
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full text-xs"
                  onClick={() => handleConfirm(false)}
                >
                  Keep all & compress schedule
                </Button>
              </div>
            </div>
          )}

          {!showWarning && (
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => handleConfirm(false)}>
                Apply
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
