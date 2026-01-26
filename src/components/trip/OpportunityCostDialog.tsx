import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, ArrowRight, Calendar } from 'lucide-react';
import { Activity } from './ActivityCard';

interface OpportunityCostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  affectedActivities: Activity[];
  newStartTime: string;
  dayNumber: number;
  totalDays: number;
  onConfirmCompress: () => void;
  onConfirmMoveToNextDay: () => void;
  onConfirmReschedule: (dayNumber: number) => void;
  onCancel: () => void;
}

export const OpportunityCostDialog = ({
  open,
  onOpenChange,
  affectedActivities,
  newStartTime,
  dayNumber,
  totalDays,
  onConfirmCompress,
  onConfirmMoveToNextDay,
  onConfirmReschedule,
  onCancel,
}: OpportunityCostDialogProps) => {
  const hasNextDay = dayNumber < totalDays;
  const availableDays = Array.from({ length: totalDays }, (_, i) => i + 1).filter(d => d !== dayNumber);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-warning">
            <AlertTriangle className="w-5 h-5" />
            Schedule Conflict
          </DialogTitle>
          <DialogDescription className="text-left">
            Starting Day {dayNumber} at {newStartTime.slice(0, 5)} reduces your available time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-sm font-medium mb-2">
              These activities may not fit:
            </p>
            <ul className="space-y-2">
              {affectedActivities.map((activity) => (
                <li key={activity.id} className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{activity.title}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">What would you like to do?</p>
            <p>Choose how to handle these activities:</p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={onConfirmCompress}
          >
            <Clock className="w-4 h-4" />
            Keep all & compress schedule
            <span className="text-xs text-muted-foreground ml-auto">Less time per activity</span>
          </Button>

          {hasNextDay && (
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={onConfirmMoveToNextDay}
            >
              <ArrowRight className="w-4 h-4" />
              Move to Day {dayNumber + 1}
              <span className="text-xs text-muted-foreground ml-auto">Auto-reschedule</span>
            </Button>
          )}

          {availableDays.length > 0 && (
            <div className="w-full">
              <p className="text-xs text-muted-foreground mb-1">Or pick a specific day:</p>
              <div className="flex flex-wrap gap-1">
                {availableDays.slice(0, 6).map((day) => (
                  <Button
                    key={day}
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => onConfirmReschedule(day)}
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    Day {day}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            className="w-full"
            onClick={onCancel}
          >
            Cancel & keep original time
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
