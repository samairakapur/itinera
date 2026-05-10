import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, RefreshCw, Clock, Users, Lightbulb } from 'lucide-react';
import { Proposal } from '@/hooks/useGroupTrip';

type ProposalType = Proposal['proposal_type'];

interface ProposeChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Which type of proposal to create */
  proposalType: ProposalType;
  /** Pre-filled context for remove/swap proposals */
  activityTitle?: string;
  activityId?: string;
  /** Day context */
  dayNumber?: number;
  dayLabel?: string;
  currentTime?: string;
  /** Total days in the trip (for add_activity day picker) */
  totalDays?: number;
  /** Called with (type, data, deadlineHours) when user submits */
  onSubmit: (
    type: ProposalType,
    data: Record<string, unknown>,
    deadlineHours: number
  ) => Promise<void>;
}

const TYPE_META: Record<ProposalType, { label: string; Icon: React.ElementType; hint: string }> = {
  add_activity: {
    label: 'Add activity',
    Icon: Plus,
    hint: 'Propose a new activity to add to the itinerary.',
  },
  remove_activity: {
    label: 'Remove activity',
    Icon: Trash2,
    hint: 'Ask the group to vote on removing this activity.',
  },
  swap_activity: {
    label: 'Swap activity',
    Icon: RefreshCw,
    hint: 'Suggest replacing this activity with something else.',
  },
  change_time: {
    label: 'Change day start time',
    Icon: Clock,
    hint: 'Propose a different start time for this day.',
  },
  change_restaurant: {
    label: 'Change restaurant',
    Icon: RefreshCw,
    hint: 'Suggest replacing this restaurant with another.',
  },
  change_day_start: {
    label: 'Change day start time',
    Icon: Clock,
    hint: 'Propose a different start time for this day.',
  },
};

export const ProposeChangeDialog = ({
  open,
  onOpenChange,
  proposalType,
  activityTitle,
  activityId,
  dayNumber,
  dayLabel,
  currentTime,
  totalDays = 1,
  onSubmit,
}: ProposeChangeDialogProps) => {
  const [title, setTitle] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [reason, setReason] = useState('');
  const [timeSlot, setTimeSlot] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [selectedDay, setSelectedDay] = useState(dayNumber ?? 1);
  const [newTime, setNewTime] = useState(currentTime ?? '09:00');
  const [deadlineHours, setDeadlineHours] = useState(24);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync defaults when dialog opens with new context
  useEffect(() => {
    if (open) {
      setSelectedDay(dayNumber ?? 1);
      setNewTime(currentTime ?? '09:00');
      setTitle('');
      setNewTitle('');
      setReason('');
      setDeadlineHours(24);
    }
  }, [open, dayNumber, currentTime]);

  const { label, Icon, hint } = TYPE_META[proposalType] ?? TYPE_META.add_activity;

  const isValid = (): boolean => {
    switch (proposalType) {
      case 'add_activity':
        return title.trim().length > 0;
      case 'remove_activity':
        return true; // Just needs confirmation
      case 'swap_activity':
      case 'change_restaurant':
        return newTitle.trim().length > 0;
      case 'change_time':
      case 'change_day_start':
        return newTime.length >= 4;
    }
  };

  const buildData = (): Record<string, unknown> => {
    switch (proposalType) {
      case 'add_activity':
        return { activityName: title.trim(), timeSlot, dayNumber: selectedDay, reason: reason.trim() };
      case 'remove_activity':
        return { title: activityTitle, activityId, dayNumber, reason: reason.trim() };
      case 'swap_activity':
      case 'change_restaurant':
        return {
          title: activityTitle,
          activityId,
          dayNumber,
          newTitle: newTitle.trim(),
          reason: reason.trim(),
        };
      case 'change_time':
      case 'change_day_start':
        return {
          dayNumber,
          dayLabel,
          currentTime,
          newTime,
          reason: reason.trim(),
        };
    }
  };

  const handleSubmit = async () => {
    if (!isValid()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(proposalType, buildData(), deadlineHours);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-3.5 h-3.5 text-primary" />
            </div>
            Propose: {label}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Hint */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2.5">
            <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
            <span>{hint} Your group will vote on this before it takes effect.</span>
          </div>

          {/* Context badges */}
          {(dayNumber || activityTitle) && (
            <div className="flex items-center gap-2 flex-wrap">
              {dayNumber && (
                <Badge variant="outline" className="text-xs gap-1">
                  Day {dayNumber}{dayLabel ? ` – ${dayLabel}` : ''}
                </Badge>
              )}
              {activityTitle && (
                <Badge variant="secondary" className="text-xs max-w-[200px] truncate">
                  {activityTitle}
                </Badge>
              )}
            </div>
          )}

          {/* ── add_activity fields ── */}
          {proposalType === 'add_activity' && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="prop-title">
                  Activity name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="prop-title"
                  placeholder="e.g. Shibuya Crossing at sunset"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Day</Label>
                  <Select
                    value={String(selectedDay)}
                    onValueChange={(v) => setSelectedDay(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: totalDays }, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          Day {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Time slot</Label>
                  <Select
                    value={timeSlot}
                    onValueChange={(v) => setTimeSlot(v as typeof timeSlot)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning</SelectItem>
                      <SelectItem value="afternoon">Afternoon</SelectItem>
                      <SelectItem value="evening">Evening</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {/* ── swap / change_restaurant: replacement name ── */}
          {(proposalType === 'swap_activity' || proposalType === 'change_restaurant') && (
            <div className="space-y-1.5">
              <Label htmlFor="prop-new-title">
                Replace with <span className="text-destructive">*</span>
              </Label>
              <Input
                id="prop-new-title"
                placeholder="Name of the replacement activity"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                autoFocus
              />
            </div>
          )}

          {/* ── change_time / change_day_start: time picker ── */}
          {(proposalType === 'change_time' || proposalType === 'change_day_start') && (
            <div className="space-y-1.5">
              <Label htmlFor="prop-time">
                New start time <span className="text-destructive">*</span>
              </Label>
              <Input
                id="prop-time"
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-36"
                autoFocus
              />
              {currentTime && (
                <p className="text-xs text-muted-foreground">
                  Currently: <strong>{currentTime}</strong>
                </p>
              )}
            </div>
          )}

          {/* Reason — optional */}
          <div className="space-y-1.5">
            <Label htmlFor="prop-reason">
              Reason{' '}
              <span className="text-muted-foreground text-xs font-normal">(optional)</span>
            </Label>
            <Textarea
              id="prop-reason"
              placeholder="Why are you proposing this change?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="resize-none h-20"
            />
          </div>

          {/* Voting deadline */}
          <div className="space-y-1.5">
            <Label>Voting deadline</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={deadlineHours === 24 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDeadlineHours(24)}
                className="flex-1"
              >
                24 hours
              </Button>
              <Button
                type="button"
                variant={deadlineHours === 1 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDeadlineHours(1)}
                className="flex-1"
              >
                ⚡ Quick — 1 hour
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid() || isSubmitting} className="gap-2">
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Users className="w-4 h-4" />
            )}
            Put to a vote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
