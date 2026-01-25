import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Switch } from '@/components/ui/switch';
import { Activity } from './ActivityCard';
import { Landmark, Utensils, MapPin, Star, Ticket } from 'lucide-react';

interface AddActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (activity: Omit<Activity, 'id'>) => void;
  dayNumber: number;
  timeSlot: 'morning' | 'afternoon' | 'evening';
  editActivity?: Activity | null;
}

const activityTypes = [
  { value: 'attraction', label: 'Attraction', icon: Landmark },
  { value: 'restaurant', label: 'Restaurant', icon: Utensils },
  { value: 'custom', label: 'Custom Activity', icon: Star },
  { value: 'prebooked', label: 'Pre-booked (Tour/Event)', icon: Ticket },
] as const;

export const AddActivityDialog = ({
  open,
  onOpenChange,
  onSave,
  dayNumber,
  timeSlot,
  editActivity,
}: AddActivityDialogProps) => {
  const [title, setTitle] = useState(editActivity?.title || '');
  const [type, setType] = useState<Activity['type']>(editActivity?.type || 'attraction');
  const [description, setDescription] = useState(editActivity?.description || '');
  const [duration, setDuration] = useState(editActivity?.duration || '');
  const [time, setTime] = useState(editActivity?.time || '');
  const [location, setLocation] = useState(editActivity?.location || '');
  const [isPrebooked, setIsPrebooked] = useState(editActivity?.isPrebooked || false);
  const [bookingReference, setBookingReference] = useState(editActivity?.bookingReference || '');
  const [mustDo, setMustDo] = useState(editActivity?.mustDo || false);

  const handleSave = () => {
    if (!title.trim()) return;

    onSave({
      type: isPrebooked ? 'prebooked' : type,
      title: title.trim(),
      description: description.trim() || undefined,
      duration: duration.trim() || undefined,
      time: time.trim() || undefined,
      location: location.trim() || undefined,
      isPrebooked,
      bookingReference: isPrebooked ? bookingReference.trim() || undefined : undefined,
      mustDo,
    });

    // Reset form
    setTitle('');
    setType('attraction');
    setDescription('');
    setDuration('');
    setTime('');
    setLocation('');
    setIsPrebooked(false);
    setBookingReference('');
    setMustDo(false);
    onOpenChange(false);
  };

  const timeSlotLabel = timeSlot.charAt(0).toUpperCase() + timeSlot.slice(1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editActivity ? 'Edit Activity' : 'Add Activity'}
          </DialogTitle>
          <DialogDescription>
            Day {dayNumber} • {timeSlotLabel}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Activity Name *</Label>
            <Input
              id="title"
              placeholder="e.g., British Museum, Tower of London"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as Activity['type'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {activityTypes.map(({ value, label, icon: Icon }) => (
                  <SelectItem key={value} value={value}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pre-booked toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="prebooked">Pre-booked</Label>
              <p className="text-sm text-muted-foreground">
                Already have a reservation or ticket?
              </p>
            </div>
            <Switch
              id="prebooked"
              checked={isPrebooked}
              onCheckedChange={setIsPrebooked}
            />
          </div>

          {/* Booking Reference (if pre-booked) */}
          {isPrebooked && (
            <div className="space-y-2">
              <Label htmlFor="booking">Booking Reference</Label>
              <Input
                id="booking"
                placeholder="e.g., CONF-12345"
                value={bookingReference}
                onChange={(e) => setBookingReference(e.target.value)}
              />
            </div>
          )}

          {/* Time and Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="time">Scheduled Time</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Leave empty for flexible timing</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="e.g., 120"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location / Address</Label>
            <Input
              id="location"
              placeholder="e.g., Great Russell St, London"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Notes (optional)</Label>
            <Textarea
              id="description"
              placeholder="Any additional details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Must-Do toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="mustdo">Must-Do</Label>
              <p className="text-sm text-muted-foreground">
                Mark as a priority activity
              </p>
            </div>
            <Switch
              id="mustdo"
              checked={mustDo}
              onCheckedChange={setMustDo}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim()}>
            {editActivity ? 'Save Changes' : 'Add Activity'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
