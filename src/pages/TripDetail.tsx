import { useParams, useNavigate } from 'react-router-dom';
import { useItinerary, useUpdateItinerary, useDeleteItinerary } from '@/hooks/useItineraries';
import { format, addDays } from 'date-fns';
import { ArrowLeft, Calendar, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DayCard, DayData } from '@/components/trip/DayCard';
import { TripOverviewCard } from '@/components/trip/TripOverviewCard';
import { AddActivityDialog } from '@/components/trip/AddActivityDialog';
import { Activity } from '@/components/trip/ActivityCard';
import { useState, useCallback, useEffect } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const TripDetail = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { data: itinerary, isLoading } = useItinerary(tripId);
  const updateItinerary = useUpdateItinerary();
  const deleteItinerary = useDeleteItinerary();

  const [days, setDays] = useState<DayData[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogDay, setAddDialogDay] = useState(1);
  const [addDialogTimeSlot, setAddDialogTimeSlot] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [editActivity, setEditActivity] = useState<Activity | null>(null);

  // Convert itinerary items to DayData format
  useEffect(() => {
    if (!itinerary) return;
    const daysMap: Record<number, DayData> = {};
    for (let i = 1; i <= itinerary.num_days; i++) {
      const dayDate = itinerary.start_date ? addDays(new Date(itinerary.start_date), i - 1) : undefined;
      daysMap[i] = { dayNumber: i, title: `Day ${i}`, date: dayDate ? format(dayDate, 'MMM d') : undefined, morning: [], afternoon: [], evening: [] };
    }
    itinerary.itinerary_items?.forEach(item => {
      const day = daysMap[item.day_number];
      if (!day) return;
      const activity: Activity = { id: item.id, type: item.item_type as any, title: item.custom_title || 'Activity', description: item.custom_description || undefined, reasoning: item.notes || undefined };
      if (item.time_slot === 'morning') day.morning.push(activity);
      else if (item.time_slot === 'afternoon') day.afternoon.push(activity);
      else day.evening.push(activity);
    });
    Object.values(daysMap).forEach(day => {
      day.morning.sort((a, b) => a.id.localeCompare(b.id));
      day.afternoon.sort((a, b) => a.id.localeCompare(b.id));
      day.evening.sort((a, b) => a.id.localeCompare(b.id));
    });
    setDays(Object.values(daysMap).sort((a, b) => a.dayNumber - b.dayNumber));
  }, [itinerary]);

  const saveChanges = useCallback((newDays: DayData[]) => {
    if (!tripId) return;
    updateItinerary.mutate({ itineraryId: tripId, days: newDays });
  }, [tripId, updateItinerary]);

  const handleActivityRemove = useCallback((dayNumber: number, activityId: string) => {
    const newDays = days.map(day => day.dayNumber !== dayNumber ? day : { ...day, morning: day.morning.filter(a => a.id !== activityId), afternoon: day.afternoon.filter(a => a.id !== activityId), evening: day.evening.filter(a => a.id !== activityId) });
    setDays(newDays);
    saveChanges(newDays);
  }, [days, saveChanges]);

  const handleAddActivity = useCallback((dayNumber: number, timeSlot: 'morning' | 'afternoon' | 'evening') => {
    setEditActivity(null);
    setAddDialogDay(dayNumber);
    setAddDialogTimeSlot(timeSlot);
    setAddDialogOpen(true);
  }, []);

  const handleSaveActivity = useCallback((activityData: Omit<Activity, 'id'>) => {
    const newDays = days.map(day => {
      if (day.dayNumber !== addDialogDay) return day;
      const newActivity: Activity = { ...activityData, id: editActivity?.id || `custom-${Date.now()}` };
      if (editActivity) {
        return { ...day, morning: day.morning.map(a => a.id === editActivity.id ? newActivity : a), afternoon: day.afternoon.map(a => a.id === editActivity.id ? newActivity : a), evening: day.evening.map(a => a.id === editActivity.id ? newActivity : a) };
      }
      return { ...day, morning: addDialogTimeSlot === 'morning' ? [...day.morning, newActivity] : day.morning, afternoon: addDialogTimeSlot === 'afternoon' ? [...day.afternoon, newActivity] : day.afternoon, evening: addDialogTimeSlot === 'evening' ? [...day.evening, newActivity] : day.evening };
    });
    setDays(newDays);
    saveChanges(newDays);
  }, [days, addDialogDay, addDialogTimeSlot, editActivity, saveChanges]);

  const handleDelete = () => {
    if (!tripId) return;
    deleteItinerary.mutate(tripId, { onSuccess: () => navigate('/trips') });
  };

  if (isLoading) return <div className="min-h-screen py-8"><div className="container px-4 max-w-2xl mx-auto"><Card><CardContent className="py-12 text-center"><Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" /></CardContent></Card></div></div>;
  if (!itinerary) return <div className="min-h-screen py-8"><div className="container px-4"><p>Trip not found</p></div></div>;

  const startDate = itinerary.start_date ? new Date(itinerary.start_date) : null;
  const endDate = itinerary.end_date ? new Date(itinerary.end_date) : null;

  return (
    <div className="min-h-screen pb-12">
      <div className="container px-4 max-w-2xl mx-auto">
        <div className="py-6 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
          <div className="flex items-center justify-between mb-2">
            <Button variant="ghost" onClick={() => navigate('/trips')} className="-ml-2" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
            <AlertDialog><AlertDialogTrigger asChild><Button variant="outline" size="sm"><Trash2 className="w-4 h-4 text-destructive" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this trip?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
          </div>
          <h1 className="font-display text-2xl font-bold">{itinerary.cities?.name || 'Your Trip'}</h1>
          {startDate && endDate && <p className="text-sm text-muted-foreground flex items-center gap-1"><Calendar className="w-4 h-4" />{format(startDate, 'MMM d')} – {format(endDate, 'MMM d, yyyy')}</p>}
        </div>
        <div className="space-y-6">
          <TripOverviewCard cityName={itinerary.cities?.name || ''} countryName={itinerary.cities?.country || ''} numDays={itinerary.num_days} travelStyle={itinerary.travel_style || ''} pace={itinerary.pace || ''} budgetLevel={itinerary.budget_level || ''} summary="" />
          {days.map(day => <DayCard key={day.dayNumber} day={day} cityName={itinerary.cities?.name} onActivityRemove={handleActivityRemove} onAddActivity={handleAddActivity} />)}
        </div>
      </div>
      <AddActivityDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onSave={handleSaveActivity} dayNumber={addDialogDay} timeSlot={addDialogTimeSlot} editActivity={editActivity} />
    </div>
  );
};

export default TripDetail;
