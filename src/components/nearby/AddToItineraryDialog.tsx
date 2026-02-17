import { useState, useEffect } from 'react';
import { CalendarPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useItineraries } from '@/hooks/useItineraries';
import { useUpdateItinerary } from '@/hooks/useItineraries';
import { useItinerary } from '@/hooks/useItineraries';
import { toast } from 'sonner';
import type { NearbyPlace } from './NearbyCard';

interface AddToItineraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  place: NearbyPlace;
  onAdded?: () => void;
}

export const AddToItineraryDialog = ({ open, onOpenChange, place, onAdded }: AddToItineraryDialogProps) => {
  const { data: itineraries = [] } = useItineraries();
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('morning');
  const [saving, setSaving] = useState(false);

  const { data: selectedTrip } = useItinerary(selectedTripId || undefined);
  const updateItinerary = useUpdateItinerary();

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedTripId('');
      setSelectedDay('');
      setSelectedSlot('morning');
    }
  }, [open]);

  const handleSave = async () => {
    if (!selectedTripId || !selectedDay || !selectedTrip) return;
    
    setSaving(true);
    try {
      const dayNumber = parseInt(selectedDay);
      
      // Build days from existing items
      const daysMap: Record<number, { dayNumber: number; title: string; morning: any[]; afternoon: any[]; evening: any[] }> = {};
      for (let i = 1; i <= selectedTrip.num_days; i++) {
        daysMap[i] = { dayNumber: i, title: `Day ${i}`, morning: [], afternoon: [], evening: [] };
      }

      selectedTrip.itinerary_items?.forEach(item => {
        const day = daysMap[item.day_number];
        if (!day) return;
        const activity = {
          id: item.id,
          type: item.item_type as any,
          title: item.custom_title || 'Activity',
          description: item.custom_description || undefined,
          reasoning: item.notes || undefined,
        };
        if (item.time_slot === 'morning') day.morning.push(activity);
        else if (item.time_slot === 'afternoon') day.afternoon.push(activity);
        else day.evening.push(activity);
      });

      // Add the nearby place
      const newActivity = {
        id: `nearby-${Date.now()}`,
        type: place.type === 'cafe' ? 'restaurant' as const : place.type === 'attraction' ? 'attraction' as const : 'restaurant' as const,
        title: place.name,
        description: place.description,
        reasoning: `Added from Nearby: ${place.matchReason}`,
      };

      const targetDay = daysMap[dayNumber];
      if (!targetDay) throw new Error('Invalid day');

      if (selectedSlot === 'morning') targetDay.morning.push(newActivity);
      else if (selectedSlot === 'afternoon') targetDay.afternoon.push(newActivity);
      else targetDay.evening.push(newActivity);

      await updateItinerary.mutateAsync({
        itineraryId: selectedTripId,
        days: Object.values(daysMap) as any,
      });

      toast.success(`"${place.name}" added to Day ${dayNumber}!`);
      onOpenChange(false);
      onAdded?.();
    } catch (err) {
      console.error('Error adding to itinerary:', err);
      toast.error('Failed to add to itinerary');
    } finally {
      setSaving(false);
    }
  };

  const activeTrips = itineraries.filter(t => t.start_date && t.end_date);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="w-5 h-5" />
            Add to Itinerary
          </DialogTitle>
          <DialogDescription>
            Add "{place.name}" to one of your trips.
          </DialogDescription>
        </DialogHeader>

        {activeTrips.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No active trips found. Create a trip first!
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Trip</Label>
              <Select value={selectedTripId} onValueChange={setSelectedTripId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a trip" />
                </SelectTrigger>
                <SelectContent>
                  {activeTrips.map(trip => (
                    <SelectItem key={trip.id} value={trip.id}>
                      {trip.cities?.name || trip.name} ({trip.num_days} days)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTrip && (
              <>
                <div className="space-y-2">
                  <Label>Day</Label>
                  <Select value={selectedDay} onValueChange={setSelectedDay}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a day" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: selectedTrip.num_days }, (_, i) => i + 1).map(day => (
                        <SelectItem key={day} value={String(day)}>
                          Day {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Time Slot</Label>
                  <Select value={selectedSlot} onValueChange={setSelectedSlot}>
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
              </>
            )}

            <Button
              className="w-full"
              onClick={handleSave}
              disabled={!selectedTripId || !selectedDay || saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <CalendarPlus className="w-4 h-4 mr-2" />
                  Add to Day {selectedDay || '...'}
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
