import { useParams, useNavigate } from 'react-router-dom';
import { useItinerary } from '@/hooks/useItineraries';
import { useFlightDetails } from '@/hooks/useFlightDetails';
import { useState, useMemo, useEffect, useRef } from 'react';
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
  Clock,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { TripConcierge } from '@/components/trip/TripConcierge';

// ── Circular progress ring ────────────────────────────────────────────────────
const CircleRing = ({ pct, size = 96 }: { pct: number; size?: number }) => {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(pct, 100) / 100) * circ;
  // Colour: terracotta/orange below 50%, green at 50%+
  const progressColour = pct >= 50 ? '#22C55E' : '#C2410C';
  return (
    <svg width={size} height={size} className="-rotate-90">
      {/* Track */}
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#D1D5DB" strokeWidth={7} />
      {/* Progress */}
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={progressColour} strokeWidth={7}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.4s ease' }}
      />
    </svg>
  );
};

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
  scheduledTime: string;   // e.g. "9:00 AM"
  estimatedMinutes: number;
  status: ActivityStatus;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'restaurant': return Utensils;
    case 'attraction': return Landmark;
    case 'transport': return Navigation;
    case 'prebooked': return Ticket;
    case 'flex': return Sparkles;
    default: return Zap;
  }
};

const SLOT_ORDER: TimeSlot[] = ['morning', 'afternoon', 'evening'];

const SLOT_LABELS: Record<TimeSlot, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
};

// Slot start times (hours in 24h)
const SLOT_START_H: Record<TimeSlot, number> = {
  morning: 8.5,    // 8:30 AM
  afternoon: 13.0, // 1:00 PM
  evening: 18.5,   // 6:30 PM
};

/** Estimated minutes per activity type */
function estimatedMinutesForType(type: string, title: string): number {
  const t = title.toLowerCase();
  if (type === 'transport') return 20;
  if (type === 'restaurant') {
    if (t.includes('breakfast') || t.includes('coffee') || t.includes('café') || t.includes('cafe')) return 45;
    if (t.includes('lunch')) return 60;
    return 75; // dinner
  }
  if (type === 'flex') return 60;
  if (t.includes('museum') || t.includes('gallery') || t.includes('palace')) return 120;
  if (t.includes('park') || t.includes('garden')) return 60;
  return 90; // default attraction
}

/** Compute a display time string for an activity based on slot + order */
function computeScheduledTime(slot: TimeSlot, orderIndex: number, activities: { type: string; title: string }[]): string {
  let minutesFromStart = 0;
  for (let i = 0; i < orderIndex; i++) {
    const a = activities[i];
    minutesFromStart += estimatedMinutesForType(a.type, a.title);
    minutesFromStart += 10; // 10 min buffer between activities
  }
  const startH = SLOT_START_H[slot];
  const totalMinutes = startH * 60 + minutesFromStart;
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = Math.round(totalMinutes % 60);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayH}:${m.toString().padStart(2, '0')} ${ampm}`;
}

const getCurrentSlot = (): TimeSlot => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
};

/** Format minutes as human-friendly string */
function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

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
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-semibold text-base leading-snug">{activity.title}</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Clock className="w-3 h-3" />
              <span>{activity.scheduledTime}</span>
              <span>·</span>
              <span>{formatMinutes(activity.estimatedMinutes)}</span>
            </div>
            {activity.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
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
    <div className="flex gap-3">
      {/* Time column */}
      <div className="shrink-0 w-14 pt-2.5 text-right">
        <span className="text-xs text-muted-foreground leading-none">
          {activity.scheduledTime}
        </span>
      </div>

      {/* Timeline line + dot */}
      <div className="flex flex-col items-center shrink-0">
        <div
          className={cn(
            'w-2.5 h-2.5 rounded-full mt-2.5 shrink-0 z-10',
            isDone
              ? 'bg-green-500'
              : isSkipped || isPushed
              ? 'bg-muted-foreground/30'
              : isNextUp
              ? 'bg-primary ring-2 ring-primary/30'
              : 'bg-muted-foreground/40',
          )}
        />
        <div className="w-px flex-1 bg-border mt-1" />
      </div>

      {/* Card */}
      <div className="flex-1 pb-3">
        <Card
          className={cn(
            'transition-all',
            isDone && 'opacity-60',
            (isSkipped || isPushed) && 'opacity-40',
            isNextUp && !isCompleted && 'ring-1 ring-primary/30',
          )}
        >
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
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
                {!isCompleted && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatMinutes(activity.estimatedMinutes)}
                  </p>
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
      </div>
    </div>
  );
};

// ── Smart Suggestion ─────────────────────────────────────────────────────────

interface SmartSuggestion {
  message: string;
  suggestedSkipActivity?: DayActivity;
}

function computeSmartSuggestion(
  activities: DayActivity[],
  completionTimestamps: Record<string, Date>,
  currentSlot: TimeSlot,
): SmartSuggestion | null {
  const now = new Date();
  const currentH = now.getHours() + now.getMinutes() / 60;

  // Look at activities already done in the current slot
  const slotActivities = activities.filter((a) => a.timeSlot === currentSlot);
  const doneInSlot = slotActivities.filter((a) => a.status === 'done');
  const pendingInSlot = slotActivities.filter((a) => a.status === 'pending');

  if (doneInSlot.length === 0 || pendingInSlot.length === 0) return null;

  // Compute how long was actually spent on done activities
  const slotStartH = SLOT_START_H[currentSlot];
  const expectedDoneMinutes = doneInSlot.reduce(
    (sum, a) => sum + a.estimatedMinutes + 10,
    0,
  );
  const actualElapsedMinutes = (currentH - slotStartH) * 60;

  // Only suggest if we're at least 30 minutes behind
  const overrunMinutes = Math.round(actualElapsedMinutes - expectedDoneMinutes);
  if (overrunMinutes < 30) return null;

  // Suggest skipping the next pending activity if it's non-essential
  // (prefer to suggest skipping transport or low-priority items first)
  const skipCandidate =
    pendingInSlot.find((a) => a.type === 'transport') ||
    pendingInSlot[0];

  if (!skipCandidate) return null;

  const lastDone = doneInSlot[doneInSlot.length - 1];
  return {
    message: `You've spent ~${formatMinutes(overrunMinutes)} longer than expected on ${lastDone.title} — consider skipping ahead.`,
    suggestedSkipActivity: skipCandidate,
  };
}

// ── Main Component ────────────────────────────────────────────────────────────

const TripDayMode = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { data: itinerary, isLoading } = useItinerary(tripId);
  const { data: flights = [] } = useFlightDetails(tripId);

  const [activityStatuses, setActivityStatuses] = useState<
    Record<string, ActivityStatus>
  >({});
  const [completionTimestamps, setCompletionTimestamps] = useState<
    Record<string, Date>
  >({});
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);
  const reflectionShownRef = useRef(false);
  const [ariaReflectionMessage, setAriaReflectionMessage] = useState<string | null>(null);

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

    const rawItems = (itinerary.itinerary_items || [])
      .filter((item) => item.day_number === dayNum)
      .sort((a, b) => {
        const slotOrderMap: Record<string, number> = { morning: 0, afternoon: 1, evening: 2 };
        const diff =
          (slotOrderMap[a.time_slot] ?? 0) - (slotOrderMap[b.time_slot] ?? 0);
        return diff !== 0 ? diff : (a.order_index ?? 0) - (b.order_index ?? 0);
      });

    // Build per-slot activity lists for time computation
    const bySlot: Record<TimeSlot, { type: string; title: string }[]> = {
      morning: [], afternoon: [], evening: [],
    };
    rawItems.forEach((item) => {
      const slot = (item.time_slot as TimeSlot) || 'morning';
      bySlot[slot].push({
        type: item.item_type || 'custom',
        title: item.custom_title || 'Activity',
      });
    });

    // Track per-slot counters for orderIndex within slot
    const slotCounters: Record<string, number> = { morning: 0, afternoon: 0, evening: 0 };

    const items: DayActivity[] = rawItems.map((item) => {
      const slot: TimeSlot = (item.time_slot as TimeSlot) || 'morning';
      const orderInSlot = slotCounters[slot]++;
      const type = item.item_type || 'custom';
      const title = item.custom_title || 'Activity';

      return {
        id: item.id,
        title,
        description: item.custom_description || undefined,
        type,
        timeSlot: slot,
        orderIndex: orderInSlot,
        scheduledTime: computeScheduledTime(slot, orderInSlot, bySlot[slot]),
        estimatedMinutes: estimatedMinutesForType(type, title),
        status: 'pending' as ActivityStatus,
      };
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

  // End-of-day reflection — fires once when 80%+ done or when hour ≥ 20 (8pm)
  // Opens Aria directly with a pre-filled reflection message
  useEffect(() => {
    if (!isOnTrip || reflectionShownRef.current) return;
    const isEveningHour = new Date().getHours() >= 20;
    if (progressPct >= 80 || (isEveningHour && doneCount > 0)) {
      reflectionShownRef.current = true;
      setTimeout(() => {
        const msg = progressPct >= 100
          ? `Hey! You've completed all ${activeCount} activities today ✨ What a day! Any highlights or things that didn't go as planned? I'd love to hear how it went.`
          : `Hey! You've done ${doneCount} of ${activeCount} activities today ✨ How's it going? Any highlights or things that didn't go as planned?`;
        setAriaReflectionMessage(msg);
      }, 1500);
    }
  }, [progressPct, doneCount, activeCount, isOnTrip]);

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

  // Smart suggestion
  const smartSuggestion = useMemo(() => {
    if (suggestionDismissed) return null;
    return computeSmartSuggestion(activities, completionTimestamps, currentSlot);
  }, [activities, completionTimestamps, currentSlot, suggestionDismissed]);

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
    if (status === 'done') {
      setCompletionTimestamps((prev) => ({ ...prev, [id]: new Date() }));
      setSuggestionDismissed(false); // re-evaluate suggestion after each completion
      toast.success('Marked as done ✓');
    }
    if (status === 'pushed') toast('Pushed to tomorrow', { icon: '→' });
    if (status === 'skipped') toast('Skipped', { icon: '⏭' });
    if (status === 'pending') {
      setCompletionTimestamps((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      toast('Restored to pending');
    }
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
          <div className="flex items-center justify-between py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/trips/${tripId}`)}
              className="-ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {tripTitle}
            </Button>

            {/* Circular progress ring */}
            <div className="relative w-24 h-24 flex items-center justify-center">
              <CircleRing pct={progressPct} size={96} />
              <span className="absolute text-base font-bold leading-none text-foreground">
                {progressPct >= 100 ? '✓' : `${Math.round(progressPct)}%`}
              </span>
            </div>

            <div className="flex flex-col items-end gap-0.5">
              <Badge variant="secondary" className="text-xs">
                Day {dayNumber}/{itinerary.num_days}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {format(today, 'EEE, MMM d')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 max-w-lg mx-auto space-y-5 pt-5">
        {/* Status label */}
        <p className="text-sm font-medium text-muted-foreground">
          {activeCount === 0
            ? 'No activities scheduled'
            : allDone
            ? "All done today! 🎉"
            : doneCount === 0
            ? 'Ready to explore!'
            : `${doneCount} of ${activeCount} activities done`}
        </p>

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

        {/* Smart suggestion */}
        {smartSuggestion && !allDone && (
          <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                    {smartSuggestion.message}
                  </p>
                  {smartSuggestion.suggestedSkipActivity && (
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-amber-300 text-amber-800 dark:text-amber-200"
                        onClick={() => {
                          updateStatus(smartSuggestion.suggestedSkipActivity!.id, 'skipped');
                          setSuggestionDismissed(true);
                        }}
                      >
                        <SkipForward className="w-3 h-3 mr-1" />
                        Skip "{smartSuggestion.suggestedSkipActivity.title}"
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-amber-700 dark:text-amber-400"
                        onClick={() => setSuggestionDismissed(true)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Behind schedule warning */}
        {behindSchedule && !smartSuggestion && (
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

        {/* Activity timeline — slot sections */}
        {SLOT_ORDER.map((slot) => {
          const slotActivities = bySlot[slot];
          if (slotActivities.length === 0) return null;

          const slotDone = slotActivities.filter((a) => a.status === 'done').length;
          const slotActive = slotActivities.filter(
            (a) => a.status !== 'skipped' && a.status !== 'pushed',
          ).length;

          return (
            <div key={slot} className="space-y-0">
              {/* Slot header */}
              <div className="flex items-center gap-2 mb-2 ml-17">
                <div className="w-14 shrink-0" />
                <div className="w-px h-0 shrink-0" />
                <div className="flex items-center gap-2 flex-1">
                  <SlotIcon slot={slot} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {SLOT_LABELS[slot]}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">
                    {slotDone}/{slotActive}
                  </span>
                </div>
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

      {/* Aria concierge — floats over Day Mode, auto-opens for reflection */}
      {tripId && (
        <TripConcierge
          tripId={tripId}
          tripName={tripTitle}
          initialOpen={!!ariaReflectionMessage}
          initialMessage={ariaReflectionMessage ?? undefined}
        />
      )}
    </div>
  );
};

export default TripDayMode;
