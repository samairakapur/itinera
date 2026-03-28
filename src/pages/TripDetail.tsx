import { useParams, useNavigate } from 'react-router-dom';
import { useItinerary, useUpdateItinerary, useDeleteItinerary } from '@/hooks/useItineraries';
import { useDayPreferences, getStartTimeForDay, useUpsertDayPreference } from '@/hooks/useDayPreferences';
import { useFlightDetails } from '@/hooks/useFlightDetails';
import { useTripLegs, getCityForDay } from '@/hooks/useTripLegs';
import { useDayConstraints, calculateDayConstraints, timeToMinutes } from '@/hooks/useSmartScheduling';
import { useRegenerateItinerary } from '@/hooks/useRegenerateItinerary';
import { useGroupTrip, Proposal } from '@/hooks/useGroupTrip';
import { useAuth } from '@/contexts/AuthContext';
import { format, addDays, isSameDay, differenceInDays } from 'date-fns';
import { ArrowLeft, Calendar, Loader2, Trash2, Save, Check, RefreshCw, Plane, Sparkles, Zap, Users, Activity as ActivityIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TripActivityFeed } from '@/components/group/TripActivityFeed';
import { VotingPanel } from '@/components/group/VotingPanel';
import { GroupChat } from '@/components/group/GroupChat';
import { ProposeChangeDialog } from '@/components/group/ProposeChangeDialog';
import { TripConcierge } from '@/components/trip/TripConcierge';
import { DayCard, DayData } from '@/components/trip/DayCard';
import { TripOverviewCard } from '@/components/trip/TripOverviewCard';
import { AddActivityDialog } from '@/components/trip/AddActivityDialog';
import { FlightDetailsDialog } from '@/components/trip/FlightDetailsDialog';
import { FlightCard } from '@/components/trip/FlightCard';
import { FlightPromptBanner } from '@/components/trip/FlightPromptBanner';
import { FlightConstraintBanner } from '@/components/trip/FlightConstraintBanner';
import { InviteCollaboratorDialog } from '@/components/trip/InviteCollaboratorDialog';
import { CityDayBadge } from '@/components/trip/CityDayBadge';
import { TransitionDayCard } from '@/components/trip/TransitionDayCard';
import { TravelTips } from '@/components/trip/TravelTips';
import { Activity } from '@/components/trip/ActivityCard';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const TripDetail = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: itinerary, isLoading } = useItinerary(tripId);
  const { data: dayPreferences = [] } = useDayPreferences(tripId);
  const { data: flights = [] } = useFlightDetails(tripId);
  const { data: tripLegs = [] } = useTripLegs(tripId);
  const updateItinerary = useUpdateItinerary();
  const deleteItinerary = useDeleteItinerary();
  const upsertDayPreference = useUpsertDayPreference();
  const regenerateItinerary = useRegenerateItinerary();
  const {
    activityFeed,
    proposals,
    isLoading: groupLoading,
    unreadCount,
    approvedProposals,
    castVote,
    createProposal,
    dismissApprovedProposal,
    logFeedEvent,
    myVoteFor,
    voteCounts,
  } = useGroupTrip(tripId);

  const [days, setDays] = useState<DayData[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [groupTab, setGroupTab] = useState<'votes' | 'activity' | 'chat'>('votes');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogDay, setAddDialogDay] = useState(1);
  const [addDialogTimeSlot, setAddDialogTimeSlot] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [editActivity, setEditActivity] = useState<Activity | null>(null);
  const [completedActivityIds, setCompletedActivityIds] = useState<Set<string>>(new Set());
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);
  const [flightJustSaved, setFlightJustSaved] = useState(false);
  // Proposal creation dialog state
  const [proposalDialog, setProposalDialog] = useState<{
    open: boolean;
    type: Proposal['proposal_type'];
    activityTitle?: string;
    activityId?: string;
    dayNumber?: number;
    dayLabel?: string;
    currentTime?: string;
  }>({ open: false, type: 'add_activity' });

  // Memoize startDate so useDayConstraints doesn't see a new Date object on every render.
  // Without this, useDayConstraints returns a new array reference every render, which triggers
  // the itinerary-parsing useEffect, which calls setDays(), which re-renders — infinite loop.
  const startDate = useMemo(
    () => itinerary?.start_date ? new Date(itinerary.start_date) : undefined,
    [itinerary?.start_date]
  );
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
        priceTier: (item.price_tier as Activity['priceTier']) || undefined,
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
    const day = days.find(d => d.dayNumber === dayNumber);
    const removed = day ? [...day.morning, ...day.afternoon, ...day.evening].find(a => a.id === activityId) : null;
    const newDays = days.map(day => day.dayNumber !== dayNumber ? day : { ...day, morning: day.morning.filter(a => a.id !== activityId), afternoon: day.afternoon.filter(a => a.id !== activityId), evening: day.evening.filter(a => a.id !== activityId) });
    setDays(newDays);
    setHasUnsavedChanges(true);
    saveChanges(newDays, false);
    if (removed) {
      logFeedEvent('activity_removed', { title: removed.title, day_number: dayNumber, user_name: user?.email?.split('@')[0] });
    }
  }, [days, saveChanges, logFeedEvent, user]);

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
    const isNew = !editActivity;
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
    if (isNew) {
      logFeedEvent('activity_added', { title: activityData.title, day_number: addDialogDay, time_slot: addDialogTimeSlot, user_name: user?.email?.split('@')[0] });
    }
  }, [days, addDialogDay, addDialogTimeSlot, editActivity, saveChanges, logFeedEvent, user]);

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
    logFeedEvent('schedule_changed', { day_number: dayNumber, new_time: newTime, user_name: user?.email?.split('@')[0] });
  }, [days, saveChanges, logFeedEvent, user]);

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

  // ── getDayTitle must be defined BEFORE proposal handlers that use it ──────
  const getDayTitle = useCallback((day: DayData): string => {
    const allActivities = [...day.morning, ...day.afternoon, ...day.evening];
    if (allActivities.length === 0) return 'Free Day';
    const attractions = allActivities.filter(a => a.type === 'attraction');
    const restaurants = allActivities.filter(a => a.type === 'restaurant');
    if (attractions.length >= 2) return 'Cultural Discovery';
    if (restaurants.length >= 2) return 'Culinary Journey';
    if (attractions.length >= 1 && restaurants.length >= 1) return 'City Highlights';
    if (allActivities.length >= 4) return 'Full Day Adventure';
    const mainActivity = allActivities[0];
    if (mainActivity.type === 'attraction') return 'Sightseeing';
    if (mainActivity.type === 'restaurant') return 'Local Flavors';
    if (mainActivity.type === 'prebooked') return 'Special Experience';
    return 'Exploring';
  }, []);

  // ── Proposal creation handlers ───────────────────────────────────────────

  const handleProposeRemove = useCallback((dayNumber: number, activityId: string) => {
    const day = days.find(d => d.dayNumber === dayNumber);
    const activity = day
      ? [...day.morning, ...day.afternoon, ...day.evening].find(a => a.id === activityId)
      : null;
    setProposalDialog({
      open: true,
      type: 'remove_activity',
      activityTitle: activity?.title,
      activityId,
      dayNumber,
    });
  }, [days]);

  const handleProposeSwap = useCallback((dayNumber: number, activityId: string) => {
    const day = days.find(d => d.dayNumber === dayNumber);
    const activity = day
      ? [...day.morning, ...day.afternoon, ...day.evening].find(a => a.id === activityId)
      : null;
    setProposalDialog({
      open: true,
      type: 'swap_activity',
      activityTitle: activity?.title,
      activityId,
      dayNumber,
    });
  }, [days]);

  const handleProposeTimeChange = useCallback((dayNumber: number) => {
    const day = days.find(d => d.dayNumber === dayNumber);
    setProposalDialog({
      open: true,
      type: 'change_time',
      dayNumber,
      dayLabel: day ? getDayTitle(day) : undefined,
      currentTime: day?.startTime,
    });
  // getDayTitle is stable (useCallback with [] deps) so no need in deps array
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const handleProposalSubmit = useCallback(async (
    type: Proposal['proposal_type'],
    data: Record<string, unknown>,
    deadlineHours: number
  ) => {
    const error = await createProposal(type, data, deadlineHours);
    if (!error) {
      toast.success('Proposal created! Your group can now vote.');
      setGroupTab('votes');
    } else {
      toast.error('Failed to create proposal. Please try again.');
      throw error; // Re-throw so the dialog stays open
    }
  }, [createProposal]);

  // ── Auto-apply approved proposals ───────────────────────────────────────
  useEffect(() => {
    if (approvedProposals.length === 0) return;

    approvedProposals.forEach(proposal => {
      const d = proposal.proposal_data as Record<string, unknown>;

      if (proposal.proposal_type === 'add_activity' && d.title && d.dayNumber) {
        const dayNum = Number(d.dayNumber);
        const slot = (d.timeSlot as string) || 'morning';
        const newActivity: Activity = {
          id: `proposed-${proposal.id}`,
          type: 'custom',
          title: String(d.title),
          description: d.reason ? String(d.reason) : undefined,
        };
        setDays(prev => {
          const updated = prev.map(day => {
            if (day.dayNumber !== dayNum) return day;
            return {
              ...day,
              morning: slot === 'morning' ? [...day.morning, newActivity] : day.morning,
              afternoon: slot === 'afternoon' ? [...day.afternoon, newActivity] : day.afternoon,
              evening: slot === 'evening' ? [...day.evening, newActivity] : day.evening,
            };
          });
          saveChanges(updated, false);
          return updated;
        });
        toast.success(`"${d.title}" was approved and added to Day ${dayNum}!`);

      } else if (proposal.proposal_type === 'remove_activity' && d.activityId) {
        const actId = String(d.activityId);
        setDays(prev => {
          const updated = prev.map(day => ({
            ...day,
            morning: day.morning.filter(a => a.id !== actId),
            afternoon: day.afternoon.filter(a => a.id !== actId),
            evening: day.evening.filter(a => a.id !== actId),
          }));
          saveChanges(updated, false);
          return updated;
        });
        toast.success(`Removal of "${d.title || 'activity'}" approved and applied.`);

      } else if (proposal.proposal_type === 'swap_activity' && d.activityId && d.newTitle) {
        const actId = String(d.activityId);
        const replacement: Activity = {
          id: `proposed-${proposal.id}`,
          type: 'custom',
          title: String(d.newTitle),
        };
        setDays(prev => {
          const updated = prev.map(day => ({
            ...day,
            morning: day.morning.map(a => a.id === actId ? replacement : a),
            afternoon: day.afternoon.map(a => a.id === actId ? replacement : a),
            evening: day.evening.map(a => a.id === actId ? replacement : a),
          }));
          saveChanges(updated, false);
          return updated;
        });
        toast.success(`Swapped "${d.title}" → "${d.newTitle}"`);

      } else if (
        (proposal.proposal_type === 'change_time' || proposal.proposal_type === 'change_day_start')
        && d.dayNumber && d.newTime
      ) {
        const dayNum = Number(d.dayNumber);
        const newTime = String(d.newTime);
        if (tripId) {
          upsertDayPreference.mutate({ itinerary_id: tripId, day_number: dayNum, start_time: newTime });
        }
        setDays(prev =>
          prev.map(day => day.dayNumber === dayNum ? { ...day, startTime: newTime } : day)
        );
        toast.success(`Day ${dayNum} start time updated to ${newTime}`);
      }

      // Log the resolution to the activity feed
      logFeedEvent('vote_resolved', {
        proposal_type: proposal.proposal_type,
        ...d,
        user_name: user?.email?.split('@')[0],
      });

      dismissApprovedProposal(proposal.id);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approvedProposals]);

  if (isLoading) return <div className="min-h-screen py-8"><div className="container px-4 max-w-2xl mx-auto"><Card><CardContent className="py-12 text-center"><Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" /></CardContent></Card></div></div>;
  if (!itinerary) return <div className="min-h-screen py-8"><div className="container px-4"><p>Trip not found</p></div></div>;

  // Group trip mode detection
  const tripMode = (itinerary as any).trip_mode as string | null;
  const isDemocratic = tripMode === 'democratic';
  const isOwner = (itinerary as any).user_id === user?.id;
  // Non-owners in organiser-mode trips get a "Suggest to organiser" flow (also uses proposals)
  const showSuggestToOrganiser = tripMode === 'organizer' && !isOwner;

  const tripStartDate = itinerary.start_date ? new Date(itinerary.start_date) : null;
  const endDate = itinerary.end_date ? new Date(itinerary.end_date) : null;
  
  // Check if trip is ongoing (for showing check-in buttons)
  const now = new Date();
  const isOngoing = tripStartDate && endDate && tripStartDate <= now && endDate >= now;

  return (
    <div className="min-h-screen pb-12">
      <div className="container px-4 max-w-2xl mx-auto">
        <div className="py-4 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2 mb-2 min-w-0">
            <Button variant="ghost" onClick={() => navigate('/trips')} className="-ml-2 shrink-0 gap-1" size="sm">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to My Trips</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <div className="flex-1 min-w-0" />
            <div className="flex items-center gap-1.5 shrink-0">
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
              {/* Only show Share once the trip is confirmed saved in the user's profile */}
              {tripId && itinerary && (
                <InviteCollaboratorDialog
                  itineraryId={tripId}
                  tripName={itinerary.name || itinerary.cities?.name}
                  cityName={[itinerary.cities?.name, itinerary.cities?.country].filter(Boolean).join(', ')}
                  inviteToken={(itinerary as any).invite_token || undefined}
                />
              )}
              {tripId && (
                <FlightDetailsDialog
                  itineraryId={tripId}
                  tripName={itinerary.cities?.name}
                  tripDestinationCity={itinerary.cities?.name}
                  tripStartDate={itinerary.start_date || undefined}
                  onFlightSaved={() => setFlightJustSaved(true)}
                />
              )}
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

          {/* Group panel — shown for group trips OR any trip with proposals/activity */}
          {((itinerary as any).trip_mode || proposals.length > 0 || activityFeed.length > 0) && (
            <Card>
              <CardHeader className="pb-3 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="w-4 h-4 text-primary" />
                    Group
                    {unreadCount > 0 && (
                      <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant={groupTab === 'votes' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-7 px-3 text-xs gap-1.5"
                      onClick={() => setGroupTab('votes')}
                    >
                      Votes {proposals.length > 0 && `(${proposals.length})`}
                    </Button>
                    <Button
                      variant={groupTab === 'chat' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-7 px-3 text-xs gap-1.5"
                      onClick={() => setGroupTab('chat')}
                    >
                      Chat
                    </Button>
                    <Button
                      variant={groupTab === 'activity' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-7 px-3 text-xs gap-1.5"
                      onClick={() => setGroupTab('activity')}
                    >
                      <ActivityIcon className="w-3 h-3" />
                      Log
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {groupTab === 'votes' ? (
                  <VotingPanel
                    proposals={proposals}
                    myVoteFor={myVoteFor}
                    voteCounts={voteCounts}
                    onVote={castVote}
                    isLoading={groupLoading}
                    onCreateProposal={isDemocratic ? () => setProposalDialog({ open: true, type: 'add_activity' }) : undefined}
                  />
                ) : groupTab === 'chat' ? (
                  <GroupChat tripId={tripId!} />
                ) : (
                  <TripActivityFeed feed={activityFeed} isLoading={groupLoading} />
                )}
              </CardContent>
            </Card>
          )}

          {/* Active-trip banner — shows when today falls within the trip dates */}
          {isOngoing && tripStartDate && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="shrink-0 w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-snug">
                      You're on Day {differenceInDays(new Date(), tripStartDate) + 1} of your trip!
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Switch to Day Mode for a live, checkable view of today's plan.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/trips/${tripId}/day`)}
                    className="shrink-0 gap-1.5"
                  >
                    Day Mode
                    <Zap className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Flight Prompt Banner */}
          {tripId && (
            <FlightPromptBanner
              itineraryId={tripId}
              tripName={itinerary.cities?.name}
              hasFlights={flights.length > 0}
            />
          )}

          {/* Regeneration Banner — shows when flights exist but itinerary hasn't been regenerated */}
          {flights.length > 0 && !itinerary.is_flight_aware && (
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    <Plane className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                      Your flights haven't been applied to the itinerary yet
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Regenerate your itinerary so activities are scheduled around your flight times —
                      arrival days will start later, departure days will end earlier, and the AI will
                      plan accordingly.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                      onClick={() => setShowRegenConfirm(true)}
                      disabled={regenerateItinerary.isPending}
                    >
                      {regenerateItinerary.isPending ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Regenerating…
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3.5 h-3.5" />
                          Regenerate Itinerary
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Also show banner right after saving a new flight */}
          {flightJustSaved && itinerary.is_flight_aware && flights.length > 0 && (
            <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                      New flight added — want to update your itinerary?
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-400">
                      Your new flight may change the available time on some days. Regenerate to adjust.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 border-blue-300 dark:border-blue-700"
                        onClick={() => setShowRegenConfirm(true)}
                        disabled={regenerateItinerary.isPending}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Regenerate
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setFlightJustSaved(false)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Regeneration loading overlay */}
          {regenerateItinerary.isPending && (
            <Card className="border-0 shadow-card">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <p className="text-muted-foreground font-medium">
                  Regenerating your itinerary with flight times…
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Activities will be scheduled around your flights
                </p>
              </CardContent>
            </Card>
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
                  isDemocratic={isDemocratic}
                  onProposeTimeChange={isDemocratic ? handleProposeTimeChange : undefined}
                  onProposeRemove={(isDemocratic || showSuggestToOrganiser) ? handleProposeRemove : undefined}
                  onProposeSwap={(isDemocratic || showSuggestToOrganiser) ? handleProposeSwap : undefined}
                />

                {/* Departure flights at end of day */}
                {departureFlights.map(flight => (
                  <FlightCard key={`departure-${flight.id}`} flight={flight} type="departure" />
                ))}

                {/* TransitionDayCard — shown after the last day of every leg except the final one */}
                {tripLegs.length > 1 && isLastDayOfLeg && legForDay && (
                  (() => {
                    const nextLeg = tripLegs.find(l => l.leg_number === (legForDay.leg_number ?? 0) + 1);
                    if (!nextLeg) return null;

                    // Flights connecting this leg to the next (departure or arrival on the gap date)
                    const nextArrivalDay = nextLeg.start_day;
                    const nextArrivalDate = startDate ? addDays(startDate, nextArrivalDay - 1) : undefined;
                    const connectingFlights = nextArrivalDate
                      ? flights.filter(f =>
                          isSameDay(new Date(f.departure_date), dayDate || new Date()) ||
                          isSameDay(new Date(f.arrival_date), nextArrivalDate)
                        )
                      : [];

                    // Constraint for the arrival day (first day of next leg)
                    const arrivalConstraint = dayConstraints[nextArrivalDay - 1];

                    return (
                      <TransitionDayCard
                        key={`transition-${legForDay.leg_number}`}
                        fromLeg={legForDay}
                        toLeg={nextLeg}
                        connectingFlights={connectingFlights}
                        arrivalDayStart={arrivalConstraint?.earliestStart}
                        arrivalDayNumber={nextArrivalDay}
                      />
                    );
                  })()
                )}
              </div>
            );
          })}
        </div>
      </div>
      <AddActivityDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onSave={handleSaveActivity} dayNumber={addDialogDay} timeSlot={addDialogTimeSlot} editActivity={editActivity} />

      {/* Proposal creation dialog — democratic mode */}
      <ProposeChangeDialog
        open={proposalDialog.open}
        onOpenChange={(open) => setProposalDialog(prev => ({ ...prev, open }))}
        proposalType={proposalDialog.type}
        activityTitle={proposalDialog.activityTitle}
        activityId={proposalDialog.activityId}
        dayNumber={proposalDialog.dayNumber}
        dayLabel={proposalDialog.dayLabel}
        currentTime={proposalDialog.currentTime}
        totalDays={itinerary.num_days}
        onSubmit={handleProposalSubmit}
      />

      {/* Regeneration confirmation dialog */}
      <AlertDialog open={showRegenConfirm} onOpenChange={setShowRegenConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Regenerate Itinerary?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will replace your current itinerary with a new AI-generated one that
              accounts for your flight times. Arrival days will start later, departure
              days will end earlier, and activities will be rescheduled accordingly.
              <br /><br />
              <strong>Any manual edits to activities will be lost.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!tripId || !itinerary) return;
                setFlightJustSaved(false);
                regenerateItinerary.mutate({
                  itineraryId: tripId,
                  itinerary,
                  flights,
                });
              }}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Trip Concierge — floating AI assistant */}
      {tripId && (
        <TripConcierge
          tripId={tripId}
          tripName={itinerary.name || itinerary.cities?.name}
        />
      )}
    </div>
  );
};

export default TripDetail;
