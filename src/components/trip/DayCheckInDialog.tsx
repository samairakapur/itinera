import { useState } from 'react';
import { CheckCircle, XCircle, ArrowRight, Clock, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Activity } from './ActivityCard';

interface DayCheckInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayNumber: number;
  dayDate?: string;
  activities: Activity[];
  completedIds: Set<string>;
  onToggleActivity: (id: string) => void;
  onCarryOver: (activityIds: string[]) => void;
  onComplete: () => void;
}

export const DayCheckInDialog = ({
  open,
  onOpenChange,
  dayNumber,
  dayDate,
  activities,
  completedIds,
  onToggleActivity,
  onCarryOver,
  onComplete,
}: DayCheckInDialogProps) => {
  const [selectedForCarryOver, setSelectedForCarryOver] = useState<Set<string>>(new Set());

  const incompleteActivities = activities.filter(a => !completedIds.has(a.id));
  const completedActivities = activities.filter(a => completedIds.has(a.id));
  const allComplete = incompleteActivities.length === 0;

  const toggleCarryOver = (id: string) => {
    setSelectedForCarryOver(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCarryOver = () => {
    onCarryOver(Array.from(selectedForCarryOver));
    setSelectedForCarryOver(new Set());
    onComplete();
  };

  const handleFinishDay = () => {
    onComplete();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Day {dayNumber} Check-In
          </DialogTitle>
          <DialogDescription>
            {dayDate && <span>{dayDate} • </span>}
            Review your activities and mark what you completed
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Completed Activities */}
          {completedActivities.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>Completed ({completedActivities.length})</span>
              </div>
              <div className="space-y-2">
                {completedActivities.map(activity => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200"
                  >
                    <Checkbox
                      checked={true}
                      onCheckedChange={() => onToggleActivity(activity.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground line-through opacity-70">
                        {activity.title}
                      </p>
                      {activity.time && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {activity.time}
                        </p>
                      )}
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Incomplete Activities */}
          {incompleteActivities.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <XCircle className="w-4 h-4" />
                <span>Not Completed ({incompleteActivities.length})</span>
              </div>
              <div className="space-y-2">
                {incompleteActivities.map(activity => (
                  <div
                    key={activity.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                      selectedForCarryOver.has(activity.id)
                        ? "bg-primary/5 border-primary"
                        : "bg-muted/50 border-muted"
                    )}
                  >
                    <Checkbox
                      checked={completedIds.has(activity.id)}
                      onCheckedChange={() => onToggleActivity(activity.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{activity.title}</p>
                      {activity.time && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {activity.time}
                        </p>
                      )}
                    </div>
                    <Button
                      variant={selectedForCarryOver.has(activity.id) ? "default" : "outline"}
                      size="sm"
                      className="shrink-0 h-8 text-xs"
                      onClick={() => toggleCarryOver(activity.id)}
                    >
                      <ArrowRight className="w-3 h-3 mr-1" />
                      {selectedForCarryOver.has(activity.id) ? 'Carrying' : 'Carry Over'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Complete Message */}
          {allComplete && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                All Done! 🎉
              </h3>
              <p className="text-muted-foreground">
                You completed all activities for Day {dayNumber}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {incompleteActivities.length > 0 && selectedForCarryOver.size > 0 && (
            <Badge variant="secondary" className="mr-auto">
              {selectedForCarryOver.size} to carry over
            </Badge>
          )}
          
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          
          {selectedForCarryOver.size > 0 ? (
            <Button onClick={handleCarryOver}>
              Carry Over & Complete Day
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleFinishDay}>
              {allComplete ? 'Close' : 'Finish Day Anyway'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
