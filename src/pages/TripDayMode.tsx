import { useParams, useNavigate } from 'react-router-dom';
import { useItinerary } from '@/hooks/useItineraries';
import { useFlightDetails } from '@/hooks/useFlightDetails';
import { useState, useMemo } from 'react';
import { differenceInDays, format } from 'date-fns';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  SkipForward,
  Calendar,
  Loader2,
  Sparkles,
  Utensils,
  Landmark,
  Navigation,
  Zap,
  Ticket,
  Sun,
  Moon,
  Trophy,
  ArrowRight,
  Plane,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ── Types ────────────────────────────────────────────────────────────────────

type ActivityStatus = 'pending' | 'done' | 'skipped' | 'pushed';
type TimeSlot = 'morning' | 'afternoon' | 'evening';

interface DayActivity {
  id: string;
  title: string;
  description?: string;
  type: string;
  timeSlot: TimeSlot;
  orderIndex: number;
  status: ActivityStatus;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'restaurant': return Utensils;
    case 'attraction': return Landmark;
    case 'transport': return Navigation;
    case 'prebooked': return Ticket;
    default: return Zap;
  }
};

const SLOT_ORDER: TimeSlot[] = ['morning', 'afternoon', 'evening'];

const SLOT_LABELS: Record<TimeSlot, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
};

const getCurrentSlot = (): TimeSlot => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
};

// ── Sub-components ───────────────────────────────────────────────────────────

const SlotIcon = ({ slot }: { slot: TimeSlot }) => {
  if (slot === 'morning')
    return <Sun className="w-3.5 h-3.5 text-amber-400" />;
  if (slot === 'afternoon')
    return <Sun className="w-3.5 h-3.5 text-orange-500" />;
  return <Moon className="w-3.5 h-3.5 text-indigo-400" />;
};

const NextUpCard = ({
  activity,
  onDone,
  onSkip,
}: {
  activity: DayActivity;
  onDone: () => void;
  onSkip: () => void;
}) => {
  const Icon = getActivityIcon(activity.type);
  return (
    <Card className="border-primary/30 bg-primary/5 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base leading-snug">{activity.title}</p>
            {activity.description && (
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                {activity.description}
              </p>
            )}
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={onDone} className="gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Done
              </Button>
              <Button size="sm" variant="outline" onClick={onSkip} className="gap-1.5">
                <SkipForward className="w-4 h-4" />
                Skip
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ActivityRow = ({
  activity,
  isNextUp,
  onDone,
  onSkip,
  onPush,
  onUndo,
}: {
  activity: DayActivity;
  isNextUp: boolean;
  onDone: () => void;
  onSkip: () => void;
  onPush: () => void;
  onUndo: () => void;
}) => {
  const Icon = getActivityIcon(activity.type);
  const isDone = activity.status === 'done';
  const isSkipped = activity.status === 'skipped';
  const isPushed = activity.status === 'pushed';
  const isCompleted = isDone || isSkipped || isPushed;

  return (
    <Card
      className={cn(
        'transition-all',
        isDone && 'opacity-60',
        (isSkipped || isPushed) && 'opacity-40',
        isNextUp && !isCompleted && 'ring-1 ring-primary/30',
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          {/* Checkbox */}
          <button
            onClick={isDone ? onUndo : onDone}
            className="shrink-0 transition-transform active:scale-90"
            aria-label={isDone ? 'Mark undone' : 'Mark done'}
          >
            {isDone ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <Circle
                className={cn(
                  'w-5 h-5',
                  isNextUp ? 'text-primary' : 'text-muted-foreground/50',
                )}
              />
            )}
          </button>

          {/* Icon */}
          <div className="shrink-0 w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
            <Icon className="w-3.5 h-3.5 text-muted-foreground" />
          </div>

          {/* Title & status */}
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                'text-sm font-medium leading-snug',
                (isDone || isSkipped || isPushed) &&
                  'line-through text-muted-foreground',
              )}
            >
              {activity.title}
            </p>
            {isPushed && (
              <p className="text-xs text-muted-foreground mt-0.5">
                → Pushed to tomorrow
              </p>
            )}
            {isSkipped && (
              <p className="text-xs text-muted-foreground mt-0.5">Skipped</p>
            )}
          </div>

          {/* Actions */}
          <div className="shrink-0 flex items-center gap-0.5">
            {isCompleted ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={onUndo}
                className="h-7 px-2 text-xs text-muted-foreground"
              >
                Undo
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onSkip}
                  className="h-7 w-7 p-0"
                  title="Skip this activity"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onPush}
                  className="h-7 w-7 p-0"
                  title="Push to tomorrow"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const TripDayMode = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { data: itinerary, isLoading } = useItinerary(tripId);
  const { data: flights = [] } = useFlightDetails(tripId);

  const [activityStatuses, setActivityStatuses] = useState<
    Record<string, ActivityStatus>
  >({});

  const today = useMemo(() => new Date(), []);

  // ── Derive today's activities ────────────────────────────────────────────

  const { dayNumber, todayActivities, isOnTrip } = useMemo(() => {
    if (!itinerary?.start_date) {
      return { dayNumber: 0, todayActivities: [], isOnTrip: false };
    }

    const startDate = new Date(itinerary.start_date);
    const dayNum = differenceInDays(today, startDate) + 1;

    if (dayNum < 1 || dayNum > itinerary.num_days) {
      return { dayNumber: dayNum, todayActivities: [], isOnTrip: false };
    }

    const items: DayActivity[] = (itinerary.itinerary_items || [])
      .filter((item) => item.day_number === dayNum)
      .map((item) => ({
        id: item.id,
        title: item.custom_title || 'Activity',
        description: item.custom_description || undefined,
        type: item.item_type || 'custom',
        timeSlot: (item.time_slot as TimeSlot) || 'morning',
        orderIndex: item.order_index || 0,
        status: 'pending' as ActivityStatus,
      }))
      .sort((a, b) => {
        const slotOrderMap = { morning: 0, afternoon: 1, evening: 2 };
        const diff =
          slotOrderMap[a.timeSlot] - slotOrderMap[b.timeSlot];
        return diff !== 0 ? diff : a.orderIndex - b.orderIndex;
      });

    return { dayNumber: dayNum, todayActivities: items, isOnTrip: true };
  }, [itinerary, today]);

  // Merge with local status overrides
  const activities = useMemo(
    () =>
      todayActivities.map((a) => ({
        ...a,
        status: activityStatuses[a.id] ?? 'pending',
      })),
    [todayActivities, activityStatuses],
  );

  const currentSlot = getCurrentSlot();

  // Progress stats (exclude skipped/pushed from denominator)
  const doneCount = activities.filter((a) => a.status === 'done').length;
  const activeCount = activities.filter(
    (a) => a.status !== 'skipped' && a.status !== 'pushed',
  ).length;
  const progressPct = activeCount > 0 ? (doneCount / activeCount) * 100 : 0;
  const allDone = activeCount > 0 && doneCount === activeCount;

  // "Next Up" = first pending activity in current or future slot
  const nextUp = useMemo(() => {
    const currentSlotIdx = SLOT_ORDER.indexOf(currentSlot);
    for (let i = currentSlotIdx; i < SLOT_ORDER.length; i++) {
      const pending = activities.find(
        (a) => a.timeSlot === SLOT_ORDER[i] && a.status === 'pending',
      );
      if (pending) return pending;
    }
    return null;
  }, [activities, currentSlot]);

  // Behind schedule: afternoon/evening with several morning activities still pending
  const behindSchedule = useMemo(() => {
    if (currentSlot === 'morning') return false;
    const morningPending = activities.filter(
      (a) => a.timeSlot === 'morning' && a.status === 'pending',
    );
    return morningPending.length >= 2;
  }, [activities, currentSlot]);

  // Group by slot
  const bySlot = useMemo(() => {
    const slots: Record<TimeSlot, DayActivity[]> = {
      morning: [],
      afternoon: [],
      evening: [],
    };
    activities.forEach((a) => slots[a.timeSlot].push(a));
    return slots;
  }, [activities]);

  const updateStatus = (id: string, status: ActivityStatus) => {
    setActivityStatuses((prev) => ({ ...prev, [id]: status }));
    if (status === 'done') toast.success('Marked as done ✓');
    if (status === 'pushed') toast('Pushed to tomorrow', { icon: '→' });
    if (status === 'skipped') toast('Skipped', { icon: '⏭' });
    if (status === 'pending') toast('Restored to pending');
  };

  const tripTitle = itinerary?.cities?.name || 'Your Trip';
  const startDate = itinerary?.start_date ? new Date(itinerary.start_date) : null;

  // ── Today's flights on this day ─────────────────────────────────────────

  const todaysFlights = useMemo(() => {
    if (!startDate) return [];
    return flights.filter((f) => {
      const arrDay = differenceInDays(new Date(f.arrival_date), startDate) + 1;
      const depDay = differenceInDays(new Date(f.departure_date), startDate) + 1;
      return arrDay === dayNumber || depDay === dayNumber;
    });
  }, [flights, startDate, dayNumber]);

  // ── Loading / not found ─────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-muted-foreground">Trip not found.</p>
        <Button variant="ghost" onClick={() => navigate('/trips')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Trips
        </Button>
      </div>
    );
  }

  // ── Not currently on trip ───────────────────────────────────────────────

  if (!isOnTrip) {
    const isPast = dayNumber > itinerary.num_days;
    const daysUntil =
      !isPast && startDate ? differenceInDays(startDate, today) : 0;

    return (
      <div className="min-h-screen pb-12">
        <div className="container px-4 max-w-lg mx-auto py-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/trips/${tripId}`)}
            className="-ml-2 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Trip
          </Button>
          <Card>
            <CardContent className="py-14 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold mb-2">
                  {tripTitle}
                </h2>
                {isPast ? (
                  <p className="text-muted-foreground">
                    This trip has ended. Hope you had an amazing time! 🎉
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    Trip Day Mode activates while you're travelling.
                    {daysUntil > 0 && (
                      <span className="block mt-2 text-primary font-medium text-lg">
                        {daysUntil} day{daysUntil !== 1 ? 's' : ''} to go!
                      </span>
                    )}
                  </p>
                )}
              </div>
              <Button onClick={() => navigate(`/trips/${tripId}`)}>
                View Full Itinerary
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Main Day Mode UI ────────────────────────────────────────────────────

  return (
    <div className="min-h-screen pb-16 bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b">
        <div className="container px-4 max-w-lg mx-auto">
          <div className="flex items-center justify-between py-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/trips/${tripId}`)}
              className="-ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {tripTitle}
            </Button>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Day {dayNumber}/{itinerary.num_days}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {format(today, 'EEE, MMM d')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 max-w-lg mx-auto space-y-5 pt-5">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-medium">
              {activeCount === 0
                ? 'No activities scheduled'
                : allDone
                ? "All done today! 🎉"
                : doneCount === 0
                ? 'Ready to explore!'
                : `${doneCount} of ${activeCount} done`}
            </span>
            <span className="text-xs text-muted-foreground">
              {Math.round(progressPct)}%
            </span>
          </div>
          <Progress value={progressPct} className="h-1.5" />
        </div>

        {/* Flight pill(s) for today */}
        {todaysFlights.map((flight) => {
          const isArrival =
            differenceInDays(new Date(flight.arrival_date), startDate!) + 1 ===
            dayNumber;
          return (
            <div
              key={flight.id}
              className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm"
            >
              <Plane className="w-4 h-4 text-primary shrink-0" />
              <span>
                {isArrival ? (
                  <>
                    <span className="font-medium">Arrival</span>{' '}
                    {flight.arrival_time
                      ? `at ${flight.arrival_time.slice(0, 5)}`
                      : ''}{' '}
                    {flight.flight_number && `· ${flight.flight_number}`}
                  </>
                ) : (
                  <>
                    <span className="font-medium">Departure</span>{' '}
                    {flight.departure_time
                      ? `at ${flight.departure_time.slice(0, 5)}`
                      : ''}{' '}
                    {flight.flight_number && `· ${flight.flight_number}`}
                  </>
                )}
              </span>
            </div>
          );
        })}

        {/* Behind schedule warning */}
        {behindSchedule && (
          <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20">
            <CardContent className="p-3">
              <p className="text-sm text-orange-800 dark:text-orange-200 font-medium">
                ⚡ You still have morning activities pending — skip or push any
                that won't fit today.
              </p>
            </CardContent>
          </Card>
        )}

        {/* All done celebration */}
        {allDone && (
          <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
            <CardContent className="py-8 text-center space-y-3">
              <Trophy className="w-10 h-10 text-green-500 mx-auto" />
              <div>
                <p className="font-semibold text-green-800 dark:text-green-200">
                  Amazing day!
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  You completed all planned activities.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Up hero card */}
        {nextUp && !allDone && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Next Up
            </p>
            <NextUpCard
              activity={nextUp}
              onDone={() => updateStatus(nextUp.id, 'done')}
              onSkip={() => updateStatus(nextUp.id, 'skipped')}
            />
          </div>
        )}

        {/* Activity timeline */}
        {SLOT_ORDER.map((slot) => {
          const slotActivities = bySlot[slot];
          if (slotActivities.length === 0) return null;

          const slotDone = slotActivities.filter((a) => a.status === 'done').length;
          const slotActive = slotActivities.filter(
            (a) => a.status !== 'skipped' && a.status !== 'pushed',
          ).length;

          return (
            <div key={slot} className="space-y-2">
              {/* Slot header */}
              <div className="flex items-center gap-2">
                <SlotIcon slot={slot} />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {SLOT_LABELS[slot]}
                </span>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">
                  {slotDone}/{slotActive}
                </span>
              </div>

              {slotActivities.map((activity) => (
                <ActivityRow
                  key={activity.id}
                  activity={activity}
                  isNextUp={nextUp?.id === activity.id}
                  onDone={() => updateStatus(activity.id, 'done')}
                  onSkip={() => updateStatus(activity.id, 'skipped')}
                  onPush={() => updateStatus(activity.id, 'pushed')}
                  onUndo={() => updateStatus(activity.id, 'pending')}
                />
              ))}
            </div>
          );
        })}

        {/* Empty state */}
        {activities.length === 0 && (
          <Card>
            <CardContent className="py-14 text-center space-y-3">
              <Sparkles className="w-10 h-10 text-muted-foreground mx-auto" />
              <div>
                <p className="font-medium">No activities scheduled for today</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Head back to your itinerary to add some.
                </p>
              </div>
              <Button onClick={() => navigate(`/trips/${tripId}`)}>
                View Full Itinerary
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TripDayMode;
