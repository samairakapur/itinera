import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  Gauge, 
  CheckCircle2,
  Circle,
  Star,
  Utensils,
  Landmark,
  MapPin
} from 'lucide-react';
import { Activity } from './ActivityCard';
import { DayConstraints, formatAvailableTime, estimateActivityDuration, calculateMinutesBetween } from '@/hooks/useSmartScheduling';
import { cn } from '@/lib/utils';

interface DayEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayNumber: number;
  dayLabel: string;
  currentStartTime: string;
  constraints: DayConstraints;
  activities: Activity[];
  totalDays: number;
  onSave: (config: {
    startTime: string;
    pace: 'relaxed' | 'moderate' | 'packed';
    activitiesToMove: string[];
    targetDay: number;
  }) => void;
}

type PaceLevel = 'relaxed' | 'moderate' | 'packed';

const paceConfig: Record<PaceLevel, { label: string; maxActivities: number; description: string }> = {
  relaxed: { label: 'Relaxed', maxActivities: 3, description: 'More time to explore each spot' },
  moderate: { label: 'Moderate', maxActivities: 5, description: 'Balanced mix of activities' },
  packed: { label: 'Packed', maxActivities: 8, description: 'See as much as possible' },
};

const typeIcons = {
  attraction: Landmark,
  restaurant: Utensils,
  transport: MapPin,
  custom: Star,
  prebooked: Star,
};

export const DayEditorDialog = ({
  open,
  onOpenChange,
  dayNumber,
  dayLabel,
  currentStartTime,
  constraints,
  activities,
  totalDays,
  onSave,
}: DayEditorDialogProps) => {
  const [startTime, setStartTime] = useState(currentStartTime);
  const [pace, setPace] = useState<PaceLevel>('moderate');
  const [selectedToMove, setSelectedToMove] = useState<Set<string>>(new Set());
  const [targetDay, setTargetDay] = useState(dayNumber + 1);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStartTime(currentStartTime);
      setSelectedToMove(new Set());
      setTargetDay(Math.min(dayNumber + 1, totalDays));
    }
  }, [open, currentStartTime, dayNumber, totalDays]);

  // Calculate if activities fit with new settings
  const scheduleAnalysis = useMemo(() => {
    const availableMinutes = calculateMinutesBetween(startTime, constraints.latestEnd);
    const BUFFER = 30;
    
    let totalNeeded = 0;
    const activityFitStatus: { activity: Activity; fits: boolean; cumulativeMinutes: number }[] = [];
    
    activities.forEach((activity, index) => {
      const duration = estimateActivityDuration(activity.type);
      const neededWithBuffer = duration + (index > 0 ? BUFFER : 0);
      totalNeeded += neededWithBuffer;
      
      activityFitStatus.push({
        activity,
        fits: totalNeeded <= availableMinutes,
        cumulativeMinutes: totalNeeded,
      });
    });

    const overflowActivities = activityFitStatus.filter(a => !a.fits).map(a => a.activity);
    const hasOverflow = overflowActivities.length > 0;
    
    return {
      availableMinutes,
      totalNeeded,
      hasOverflow,
      overflowActivities,
      activityFitStatus,
    };
  }, [startTime, constraints.latestEnd, activities]);

  const toggleActivity = (id: string) => {
    setSelectedToMove(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllOverflow = () => {
    setSelectedToMove(new Set(scheduleAnalysis.overflowActivities.map(a => a.id)));
  };

  const handleSave = () => {
    onSave({
      startTime,
      pace,
      activitiesToMove: Array.from(selectedToMove),
      targetDay,
    });
    onOpenChange(false);
  };

  const hasChanges = startTime !== currentStartTime || selectedToMove.size > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Edit Day {dayNumber}
            {constraints.isArrivalDay && (
              <Badge variant="secondary" className="ml-2">Arrival Day</Badge>
            )}
            {constraints.isDepartureDay && (
              <Badge variant="secondary" className="ml-2">Departure Day</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Flight Constraints Info */}
          {(constraints.isArrivalDay || constraints.isDepartureDay) && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 space-y-2">
                {constraints.arrivalFlight && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">✈️ Arrives:</span>
                    <span>{constraints.arrivalFlight.arrival_time?.slice(0, 5) || 'TBD'}</span>
                    <span className="text-muted-foreground">
                      → Activities from {constraints.earliestStart}
                    </span>
                  </div>
                )}
                {constraints.departureFlight && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">✈️ Departs:</span>
                    <span>{constraints.departureFlight.departure_time?.slice(0, 5) || 'TBD'}</span>
                    <span className="text-muted-foreground">
                      → Activities until {constraints.latestEnd}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Start Time */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Day Start Time</Label>
            <div className="flex items-center gap-4">
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-32"
                min={constraints.earliestStart}
              />
              <div className="flex-1 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {formatAvailableTime(scheduleAnalysis.availableMinutes)}
                </span>
                {' available today'}
              </div>
            </div>
            {constraints.isArrivalDay && startTime < constraints.earliestStart && (
              <p className="text-xs text-warning flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Start time is before flight arrival + buffer
              </p>
            )}
          </div>

          {/* Pace Selector */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Gauge className="w-4 h-4" />
              Day Pace
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(paceConfig) as PaceLevel[]).map((level) => (
                <Button
                  key={level}
                  variant={pace === level ? 'default' : 'outline'}
                  size="sm"
                  className="flex-col h-auto py-3"
                  onClick={() => setPace(level)}
                >
                  <span className="font-medium">{paceConfig[level].label}</span>
                  <span className="text-xs opacity-70">
                    ~{paceConfig[level].maxActivities} activities
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* Overflow Warning & Activity Selection */}
          {scheduleAnalysis.hasOverflow && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-warning">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium text-sm">Schedule Overflow</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllOverflow}
                  className="text-xs"
                >
                  Select all ({scheduleAnalysis.overflowActivities.length})
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground">
                These activities may not fit. Select which to move:
              </p>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {scheduleAnalysis.activityFitStatus.map(({ activity, fits }) => {
                  const Icon = typeIcons[activity.type] || Star;
                  const isSelected = selectedToMove.has(activity.id);
                  
                  return (
                    <button
                      key={activity.id}
                      onClick={() => toggleActivity(activity.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors",
                        isSelected 
                          ? "border-primary bg-primary/5" 
                          : fits 
                            ? "border-border bg-background hover:bg-muted/50"
                            : "border-warning/30 bg-warning/5 hover:bg-warning/10"
                      )}
                    >
                      <div className={cn(
                        "p-1.5 rounded",
                        fits ? "bg-muted" : "bg-warning/10"
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">
                          ~{estimateActivityDuration(activity.type)} min
                          {activity.mustDo && (
                            <Badge variant="outline" className="ml-2 text-[10px] py-0">
                              Must-Do
                            </Badge>
                          )}
                        </p>
                      </div>
                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Target Day Selector */}
              {selectedToMove.size > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Move to:</span>
                  <select
                    value={targetDay}
                    onChange={(e) => setTargetDay(Number(e.target.value))}
                    className="flex-1 h-8 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {Array.from({ length: totalDays }, (_, i) => i + 1)
                      .filter(d => d !== dayNumber)
                      .map(d => (
                        <option key={d} value={d}>Day {d}</option>
                      ))
                    }
                  </select>
                </div>
              )}
            </div>
          )}

          {/* All Fits Message */}
          {!scheduleAnalysis.hasOverflow && activities.length > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-teal/10 text-teal border border-teal/20">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm">All {activities.length} activities fit within the schedule</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges} className="flex-1">
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
