import { useParams, useNavigate } from 'react-router-dom';
import { useItinerary, useUpdateItinerary, useDeleteItinerary } from '@/hooks/useItineraries';
import { useDayPreferences, getStartTimeForDay, useUpsertDayPreference } from '@/hooks/useDayPreferences';
import { useFlightDetails } from '@/hooks/useFlightDetails';
import { useTripLegs, getCityForDay } from '@/hooks/useTripLegs';
import { useDayConstraints, calculateDayConstraints, timeToMinutes } from '@/hooks/useSmartScheduling';
import { format, addDays, isSameDay } from 'date-fns';
import { ArrowLeft, Calendar, Loader2, Trash2, Save, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DayCard, DayData } from '@/components/trip/DayCard';
import { TripOverviewCard } from '@/components/trip/TripOverviewCard';
import { AddActivityDialog } from '@/components/trip/AddActivityDialog';
import { FlightDetailsDialog } from '@/components/trip/FlightDetailsDialog';
import { FlightCard } from '@/components/trip/FlightCard';
import { FlightPromptBanner } from '@/components/trip/FlightPromptBanner';
import { FlightConstraintBanner } from '@/components/trip/FlightConstraintBanner';
import { InviteCollaboratorDialog } from '@/components/trip/InviteCollaboratorDialog';
import { CityDayBadge } from '@/components/trip/CityDayBadge';
import { TravelTips } from '@/components/trip/TravelTips';
import { Activity } from '@/components/trip/ActivityCard';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const TripDetail = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { data: itinerary, isLoading } = useItinerary(tripId);
  const { data: dayPreferences = [] } = useDayPreferences(tripId);
  const { data: flights = [] } = useFlightDetails(tripId);
  const { data: tripLegs = [] } = useTripLegs(tripId);
  const updateItinerary = useUpdateItinerary();
  const deleteItinerary = useDeleteItinerary();
  const upsertDayPreference = useUpsertDayPreference();

  const [days, setDays] = useState<DayData[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogDay, setAddDialogDay] = useState(1);
  const [addDialogTimeSlot, setAddDialogTimeSlot] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [editActivity, setEditActivity] = useState<Activity | null>(null);
  const [completedActivityIds, setCompletedActivityIds] = useState<Set<string>>(new Set());

  // Calculate flight-aware constraints for each day
  const startDate = itinerary?.start_date ? new Date(itinerary.start_date) : undefined;
  const dayConstraints = useDayConstraints(
    itinerary?.num_days || 0,
    startDate,
    flights,
    dayPreferences
  );

  // Convert itinerary items to DayData format with actual dates
  // Flight constraints override default start times
  useEffect(() => {
    if (!itinerary) return;
    const daysMap: Record<number, DayData> = {};
    const itineraryStartDate = itinerary.start_date ? new Date(itinerary.start_date) : undefined;
    
    for (let i = 1; i <= itinerary.num_days; i++) {
      const dayDate = itineraryStartDate ? addDays(itineraryStartDate, i - 1) : undefined;
      const userStartTime = getStartTimeForDay(i, dayPreferences);
      
      // Use flight constraint to override start time on arrival/departure days
      const constraint = dayConstraints[i - 1];
      let effectiveStartTime = userStartTime.slice(0, 5);
      
      if (constraint) {
        // On arrival days, flight constraint's earliestStart takes priority
        // unless user explicitly set a later time
        if (constraint.isArrivalDay) {
          const constraintMinutes = timeToMinutes(constraint.earliestStart);
          const userMinutes = timeToMinutes(effectiveStartTime);
          // Flight constraint always wins if it's later than user preference
          if (constraintMinutes > userMinutes) {
            effectiveStartTime = constraint.earliestStart;
          }
        }
      }
      
      daysMap[i] = { 
        dayNumber: i, 
        title: `Day ${i}`, 
        date: dayDate ? format(dayDate, 'MMM d') : undefined,
        actualDate: dayDate,
        startTime: effectiveStartTime,
        morning: [], 
        afternoon: [], 
        evening: [] 
      };
    }
    
    itinerary.itinerary_items?.forEach(item => {
      const day = daysMap[item.day_number];
      if (!day) return;
      const activity: Activity = { 
        id: item.id, 
        type: item.item_type as any, 
        title: item.custom_title || 'Activity', 
        description: item.custom_description || undefined, 
        reasoning: item.notes || undefined,
        time: (item as any).scheduled_time || undefined,
      };
      if (item.time_slot === 'morning') day.morning.push(activity);
      else if (item.time_slot === 'afternoon') day.afternoon.push(activity);
      else day.evening.push(activity);
      
      // Track completed activities
      if ((item as any).is_completed) {
        setCompletedActivityIds(prev => new Set([...prev, item.id]));
      }
    });
    
    Object.values(daysMap).forEach(day => {
      day.morning.sort((a, b) => a.id.localeCompare(b.id));
      day.afternoon.sort((a, b) => a.id.localeCompare(b.id));
      day.evening.sort((a, b) => a.id.localeCompare(b.id));
    });
    setDays(Object.values(daysMap).sort((a, b) => a.dayNumber - b.dayNumber));
  }, [itinerary, dayPreferences, dayConstraints]);

  const saveChanges = useCallback((newDays: DayData[], showToast = true) => {
    if (!tripId) return;
    updateItinerary.mutate({ itineraryId: tripId, days: newDays }, {
      onSuccess: () => {
        setHasUnsavedChanges(false);
        if (showToast) toast.success('Changes saved!');
      }
    });
  }, [tripId, updateItinerary]);

  const handleManualSave = useCallback(() => {
    saveChanges(days);
  }, [days, saveChanges]);

  const handleActivityRemove = useCallback((dayNumber: number, activityId: string) => {
    const newDays = days.map(day => day.dayNumber !== dayNumber ? day : { ...day, morning: day.morning.filter(a => a.id !== activityId), afternoon: day.afternoon.filter(a => a.id !== activityId), evening: day.evening.filter(a => a.id !== activityId) });
    setDays(newDays);
    setHasUnsavedChanges(true);
    saveChanges(newDays, false);
  }, [days, saveChanges]);

  const handleAddActivity = useCallback((dayNumber: number, timeSlot: 'morning' | 'afternoon' | 'evening') => {
    setEditActivity(null);
    setAddDialogDay(dayNumber);
    setAddDialogTimeSlot(timeSlot);
    setAddDialogOpen(true);
  }, []);

  const handleActivityEdit = useCallback((dayNumber: number, activityId: string) => {
    const day = days.find(d => d.dayNumber === dayNumber);
    if (!day) return;
    
    const activity = [...day.morning, ...day.afternoon, ...day.evening].find(a => a.id === activityId);
    if (!activity) return;
    
    let timeSlot: 'morning' | 'afternoon' | 'evening' = 'morning';
    if (day.afternoon.some(a => a.id === activityId)) timeSlot = 'afternoon';
    if (day.evening.some(a => a.id === activityId)) timeSlot = 'evening';
    
    setEditActivity(activity);
    setAddDialogDay(dayNumber);
    setAddDialogTimeSlot(timeSlot);
    setAddDialogOpen(true);
  }, [days]);

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

  const handleToggleActivityComplete = useCallback((dayNumber: number, activityId: string) => {
    setCompletedActivityIds(prev => {
      const next = new Set(prev);
      if (next.has(activityId)) {
        next.delete(activityId);
      } else {
        next.add(activityId);
      }
      return next;
    });
    toast.success('Activity updated');
  }, []);

  const handleStartTimeChange = useCallback((dayNumber: number, newTime: string, affectedActivities: Activity[]) => {
    // If activities need to be moved to next day
    if (affectedActivities.length > 0) {
      const activityIds = affectedActivities.map(a => a.id);
      const nextDayNumber = dayNumber + 1;
      
      if (nextDayNumber <= days.length) {
        const newDays = days.map(day => {
          if (day.dayNumber === dayNumber) {
            return {
              ...day,
              startTime: newTime.slice(0, 5),
              morning: day.morning.filter(a => !activityIds.includes(a.id)),
              afternoon: day.afternoon.filter(a => !activityIds.includes(a.id)),
              evening: day.evening.filter(a => !activityIds.includes(a.id)),
            };
          }
          if (day.dayNumber === nextDayNumber) {
            return {
              ...day,
              morning: [...affectedActivities.map(a => ({ ...a, id: `moved-${a.id}` })), ...day.morning],
            };
          }
          return day;
        });
        setDays(newDays);
        saveChanges(newDays);
        toast.success(`Start time updated. ${affectedActivities.length} activities moved to Day ${nextDayNumber}`);
      }
    } else {
      // Just update the start time display
      const newDays = days.map(day => 
        day.dayNumber === dayNumber 
          ? { ...day, startTime: newTime.slice(0, 5) }
          : day
      );
      setDays(newDays);
      toast.success('Start time updated');
    }
  }, [days, saveChanges]);

  const handleCarryOverActivities = useCallback((fromDay: number, activityIds: string[]) => {
    const nextDayNumber = fromDay + 1;
    if (nextDayNumber > days.length) {
      toast.error('No next day to carry activities to');
      return;
    }

    const newDays = days.map(day => {
      if (day.dayNumber === fromDay) {
        // Remove carried activities from current day
        return {
          ...day,
          morning: day.morning.filter(a => !activityIds.includes(a.id)),
          afternoon: day.afternoon.filter(a => !activityIds.includes(a.id)),
          evening: day.evening.filter(a => !activityIds.includes(a.id)),
        };
      }
      if (day.dayNumber === nextDayNumber) {
        // Find activities to carry over from original day
        const fromDayData = days.find(d => d.dayNumber === fromDay);
        if (!fromDayData) return day;
        
        const activitiesToCarry = [
          ...fromDayData.morning,
          ...fromDayData.afternoon,
          ...fromDayData.evening,
        ].filter(a => activityIds.includes(a.id));

        // Add to morning of next day
        return {
          ...day,
          morning: [...activitiesToCarry.map(a => ({ ...a, id: `carried-${a.id}` })), ...day.morning],
        };
      }
      return day;
    });

    setDays(newDays);
    saveChanges(newDays);
    toast.success(`${activityIds.length} activities carried to Day ${nextDayNumber}`);
  }, [days, saveChanges]);

  // Handle Day Editor save (unified start time + activity move)
  const handleDayEditorSave = useCallback((
    dayNumber: number,
    config: { startTime: string; pace: string; activitiesToMove: string[]; targetDay: number }
  ) => {
    // Update start time in day preferences
    if (tripId) {
      upsertDayPreference.mutate({
        itinerary_id: tripId,
        day_number: dayNumber,
        start_time: config.startTime,
      });
    }

    // Move selected activities to target day
    if (config.activitiesToMove.length > 0) {
      const activityIds = config.activitiesToMove;
      const targetDayNumber = config.targetDay;

      const newDays = days.map(day => {
        if (day.dayNumber === dayNumber) {
          return {
            ...day,
            startTime: config.startTime.slice(0, 5),
            morning: day.morning.filter(a => !activityIds.includes(a.id)),
            afternoon: day.afternoon.filter(a => !activityIds.includes(a.id)),
            evening: day.evening.filter(a => !activityIds.includes(a.id)),
          };
        }
        if (day.dayNumber === targetDayNumber) {
          const sourceDayData = days.find(d => d.dayNumber === dayNumber);
          if (!sourceDayData) return day;

          const activitiesToMove = [
            ...sourceDayData.morning,
            ...sourceDayData.afternoon,
            ...sourceDayData.evening,
          ].filter(a => activityIds.includes(a.id));

          return {
            ...day,
            morning: [...activitiesToMove.map(a => ({ ...a, id: `moved-${a.id}` })), ...day.morning],
          };
        }
        return day;
      });

      setDays(newDays);
      saveChanges(newDays);
      toast.success(`Day ${dayNumber} updated. ${activityIds.length} activities moved to Day ${targetDayNumber}`);
    } else {
      // Just update start time
      const newDays = days.map(day => 
        day.dayNumber === dayNumber 
          ? { ...day, startTime: config.startTime.slice(0, 5) }
          : day
      );
      setDays(newDays);
      toast.success(`Day ${dayNumber} start time updated to ${config.startTime.slice(0, 5)}`);
    }
  }, [tripId, days, saveChanges, upsertDayPreference]);

  const handleDelete = () => {
    if (!tripId) return;
    deleteItinerary.mutate(tripId, { onSuccess: () => navigate('/trips') });
  };

  // Generate engaging day titles based on activities - must be before early returns
  const getDayTitle = useCallback((day: DayData): string => {
    const allActivities = [...day.morning, ...day.afternoon, ...day.evening];
    if (allActivities.length === 0) return 'Free Day';
    
    // Find highlights by type
    const attractions = allActivities.filter(a => a.type === 'attraction');
    const restaurants = allActivities.filter(a => a.type === 'restaurant');
    
    if (attractions.length >= 2) return 'Cultural Discovery';
    if (restaurants.length >= 2) return 'Culinary Journey';
    if (attractions.length >= 1 && restaurants.length >= 1) return 'City Highlights';
    if (allActivities.length >= 4) return 'Full Day Adventure';
    
    // Use first activity as inspiration
    const mainActivity = allActivities[0];
    if (mainActivity.type === 'attraction') return 'Sightseeing';
    if (mainActivity.type === 'restaurant') return 'Local Flavors';
    if (mainActivity.type === 'prebooked') return 'Special Experience';
    
    return 'Exploring';
  }, []);

  if (isLoading) return <div className="min-h-screen py-8"><div className="container px-4 max-w-2xl mx-auto"><Card><CardContent className="py-12 text-center"><Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" /></CardContent></Card></div></div>;
  if (!itinerary) return <div className="min-h-screen py-8"><div className="container px-4"><p>Trip not found</p></div></div>;

  const tripStartDate = itinerary.start_date ? new Date(itinerary.start_date) : null;
  const endDate = itinerary.end_date ? new Date(itinerary.end_date) : null;
  
  // Check if trip is ongoing (for showing check-in buttons)
  const now = new Date();
  const isOngoing = tripStartDate && endDate && tripStartDate <= now && endDate >= now;

  return (
    <div className="min-h-screen pb-12">
      <div className="container px-4 max-w-2xl mx-auto">
        <div className="py-6 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
          <div className="flex items-center justify-between mb-2">
            <Button variant="ghost" onClick={() => navigate('/trips')} className="-ml-2" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to My Trips
            </Button>
            <div className="flex items-center gap-2">
              {hasUnsavedChanges && (
                <Button 
                  size="sm" 
                  onClick={handleManualSave} 
                  disabled={updateItinerary.isPending}
                  className="gap-2"
                >
                  {updateItinerary.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save
                </Button>
              )}
              {tripId && <InviteCollaboratorDialog itineraryId={tripId} tripName={itinerary.cities?.name} />}
              {tripId && <FlightDetailsDialog itineraryId={tripId} tripName={itinerary.cities?.name} />}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this trip?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          <h1 className="font-display text-2xl font-bold">{itinerary.cities?.name || 'Your Trip'}</h1>
          {tripStartDate && endDate && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {format(tripStartDate, 'MMM d')} – {format(endDate, 'MMM d, yyyy')}
            </p>
          )}
        </div>
        
        <div className="space-y-6">
          <TripOverviewCard 
            cityName={itinerary.cities?.name || ''} 
            countryName={itinerary.cities?.country || ''} 
            numDays={itinerary.num_days} 
            travelStyle={itinerary.travel_style || ''} 
            pace={itinerary.pace || ''} 
            budgetLevel={itinerary.budget_level || ''} 
            summary="" 
          />

          {/* Flight Prompt Banner */}
          {tripId && (
            <FlightPromptBanner 
              itineraryId={tripId} 
              tripName={itinerary.cities?.name}
              hasFlights={flights.length > 0}
            />
          )}
          
          {/* Travel Tips for all days */}
          <TravelTips 
            packingTips={[
              'Check weather forecast for all trip days',
              'Pack layers for variable conditions',
              'Comfortable walking shoes recommended',
            ]}
            transportTips={[
              'Consider getting a multi-day transit pass',
              'Download offline maps for navigation',
            ]}
            weatherNotes={tripStartDate && endDate 
              ? `Weather guidance for ${format(tripStartDate, 'MMM d')} - ${format(endDate, 'MMM d')}`
              : undefined
            }
          />
          
          {days.map((day, index) => {
            const dayDate = startDate ? addDays(startDate, day.dayNumber - 1) : undefined;
            const dayConstraint = dayConstraints[index];
            
            // Check for flights on this day
            const departureFlights = flights.filter(f => 
              dayDate && isSameDay(new Date(f.departure_date), dayDate)
            );
            const arrivalFlights = flights.filter(f => 
              dayDate && isSameDay(new Date(f.arrival_date), dayDate)
            );
            
            // Get city for this day (for multi-city trips)
            const legForDay = getCityForDay(day.dayNumber, tripLegs);
            const cityForDay = legForDay?.city?.name || itinerary.cities?.name;
            const countryForDay = legForDay?.city?.country || itinerary.cities?.country;
            const isFirstDayOfLeg = legForDay?.start_day === day.dayNumber;
            const isLastDayOfLeg = legForDay?.end_day === day.dayNumber;
            
            // Generate engaging title
            const engagingTitle = getDayTitle(day);
            const dayWithTitle = { 
              ...day, 
              title: engagingTitle 
            };

            return (
              <div key={day.dayNumber} className="space-y-3">
                {/* City badge for multi-city trips */}
                {tripLegs.length > 0 && isFirstDayOfLeg && (
                  <CityDayBadge
                    cityName={cityForDay || ''}
                    countryName={countryForDay}
                    legNumber={legForDay?.leg_number || 1}
                    isFirstDayOfLeg={isFirstDayOfLeg}
                    isLastDayOfLeg={isLastDayOfLeg}
                  />
                )}
                
                {/* Flight Constraint Banner for arrival/departure days */}
                {dayConstraint && (dayConstraint.isArrivalDay || dayConstraint.isDepartureDay) && (
                  <FlightConstraintBanner constraints={dayConstraint} />
                )}
                
                {/* Arrival flights at start of day */}
                {arrivalFlights.map(flight => (
                  <FlightCard key={`arrival-${flight.id}`} flight={flight} type="arrival" />
                ))}
                
                <DayCard 
                  day={dayWithTitle} 
                  cityName={cityForDay}
                  startDate={startDate || undefined}
                  showCheckIn={isOngoing}
                  completedActivityIds={completedActivityIds}
                  itineraryId={tripId}
                  totalDays={itinerary.num_days}
                  constraints={dayConstraint}
                  onActivityRemove={handleActivityRemove} 
                  onActivityEdit={handleActivityEdit}
                  onAddActivity={handleAddActivity}
                  onToggleActivityComplete={handleToggleActivityComplete}
                  onCarryOverActivities={handleCarryOverActivities}
                  onStartTimeChange={handleStartTimeChange}
                  onDayEditorSave={handleDayEditorSave}
                />

                {/* Departure flights at end of day */}
                {departureFlights.map(flight => (
                  <FlightCard key={`departure-${flight.id}`} flight={flight} type="departure" />
                ))}
              </div>
            );
          })}
        </div>
      </div>
      <AddActivityDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onSave={handleSaveActivity} dayNumber={addDialogDay} timeSlot={addDialogTimeSlot} editActivity={editActivity} />
    </div>
  );
};

export default TripDetail;
