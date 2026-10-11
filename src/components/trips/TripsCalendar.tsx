/**
 * TripsCalendar — lightweight monthly calendar view for My Trips.
 *
 * Shows trips as coloured pills on each day they span. Supports drag-and-drop
 * rescheduling with a 5-second undo window.
 *
 * No external calendar library — built with a simple grid.
 */
import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
  differenceInDays,
  addDays,
  parseISO,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Trip {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  cities?: { name: string } | null;
}

interface TripsCalendarProps {
  trips: Trip[];
  onTripsUpdated: () => void;
}

// Stable colour palette for trip pills — cycles through when there are many trips
const PILL_COLOURS = [
  'bg-primary text-primary-foreground',
  'bg-secondary text-secondary-foreground',
  'bg-accent text-accent-foreground',
  'bg-blue-500 text-white',
  'bg-purple-500 text-white',
  'bg-pink-500 text-white',
  'bg-teal-500 text-white',
];

function tripColour(index: number) {
  return PILL_COLOURS[index % PILL_COLOURS.length];
}

/** Returns the trips that are active (span) on a given day */
function tripsOnDay(trips: Trip[], day: Date): Array<{ trip: Trip; index: number }> {
  return trips
    .map((trip, index) => ({ trip, index }))
    .filter(({ trip }) => {
      if (!trip.start_date || !trip.end_date) return false;
      const start = parseISO(trip.start_date);
      const end = parseISO(trip.end_date);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return day >= start && day <= end;
    });
}

export const TripsCalendar = ({ trips, onTripsUpdated }: TripsCalendarProps) => {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Drag state
  const [draggingTripId, setDraggingTripId] = useState<string | null>(null);
  const dragStartDate = useRef<Date | null>(null); // the day the pill was dragged from
  const dragOriginalStart = useRef<string | null>(null);
  const dragOriginalEnd = useRef<string | null>(null);

  // Undo state
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [undoInfo, setUndoInfo] = useState<{
    tripId: string;
    tripName: string;
    oldStart: string;
    oldEnd: string;
    newStart: string;
    newEnd: string;
  } | null>(null);

  // Show 2 months
  const months = [currentMonth, addMonths(currentMonth, 1)];

  const handleDragStart = useCallback(
    (e: React.DragEvent, trip: Trip, day: Date) => {
      setDraggingTripId(trip.id);
      dragStartDate.current = day;
      dragOriginalStart.current = trip.start_date;
      dragOriginalEnd.current = trip.end_date;
      e.dataTransfer.effectAllowed = 'move';
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, dropDay: Date) => {
      e.preventDefault();
      if (!draggingTripId || !dragStartDate.current) return;

      const trip = trips.find(t => t.id === draggingTripId);
      if (!trip || !trip.start_date || !trip.end_date) return;

      const tripLength = differenceInDays(
        parseISO(trip.end_date),
        parseISO(trip.start_date)
      );

      // Offset: how many days from trip start was the pill that was dragged
      const offset = differenceInDays(dropDay, dragStartDate.current!);
      const oldStart = parseISO(trip.start_date);
      const oldEnd = parseISO(trip.end_date);
      const newStart = addDays(oldStart, offset);
      const newEnd = addDays(oldEnd, offset);

      const newStartStr = format(newStart, 'yyyy-MM-dd');
      const newEndStr = format(newEnd, 'yyyy-MM-dd');

      if (newStartStr === trip.start_date) {
        setDraggingTripId(null);
        return; // No change
      }

      // Optimistic update via mutation
      const { error } = await supabase
        .from('itineraries')
        .update({ start_date: newStartStr, end_date: newEndStr })
        .eq('id', draggingTripId);

      setDraggingTripId(null);

      if (error) {
        toast.error('Failed to reschedule trip. Please try again.');
        return;
      }

      onTripsUpdated();

      // Clear any existing undo timer
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

      const tripName = trip.name || trip.cities?.name || 'Trip';
      const formattedNew = `${format(newStart, 'MMM d')} – ${format(newEnd, 'MMM d, yyyy')}`;

      setUndoInfo({
        tripId: draggingTripId,
        tripName,
        oldStart: trip.start_date,
        oldEnd: trip.end_date,
        newStart: newStartStr,
        newEnd: newEndStr,
      });

      toast(`${tripName} moved to ${formattedNew}.`, {
        action: {
          label: 'Undo',
          onClick: async () => {
            if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
            await supabase
              .from('itineraries')
              .update({ start_date: trip.start_date, end_date: trip.end_date })
              .eq('id', trip.id);
            onTripsUpdated();
            setUndoInfo(null);
            toast.success('Dates reverted.');
          },
        },
        duration: 5000,
      });

      // Nudge user to update day dates via Aria (single clean toast — no second popup)
      const rescheduledTripId = trip.id;
      setTimeout(() => {
        toast('Trip rescheduled! Open Aria to update day dates.', {
          action: {
            label: 'Open Aria',
            onClick: () => navigate(`/trips/${rescheduledTripId}`),
          },
          duration: 7000,
        });
      }, 1000);

      // Auto-clear undo after 5 seconds
      undoTimerRef.current = setTimeout(() => setUndoInfo(null), 5000);
    },
    [draggingTripId, trips, onTripsUpdated]
  );

  return (
    <div className="space-y-6">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium text-muted-foreground">
          {format(months[0], 'MMMM yyyy')} – {format(months[1], 'MMMM yyyy')}
        </span>
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Two-month grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {months.map((month) => {
          const monthStart = startOfMonth(month);
          const monthEnd = endOfMonth(month);
          const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
          const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
          const days = eachDayOfInterval({ start: calStart, end: calEnd });

          return (
            <div key={month.toISOString()}>
              <h3 className="text-center font-semibold text-foreground mb-3">
                {format(month, 'MMMM yyyy')}
              </h3>

              {/* Day-of-week headers */}
              <div className="grid grid-cols-7 mb-1">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-px">
                {days.map((day) => {
                  const inMonth = isSameMonth(day, month);
                  const isToday = isSameDay(day, new Date());
                  const dayTrips = tripsOnDay(trips, day);

                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        'min-h-[60px] p-1 rounded-sm border border-transparent transition-colors',
                        inMonth ? 'bg-card hover:bg-muted/40' : 'bg-muted/20 opacity-40',
                        'drop-target'
                      )}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, day)}
                    >
                      <div
                        className={cn(
                          'text-xs font-medium mb-0.5 w-6 h-6 flex items-center justify-center rounded-full',
                          isToday
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground'
                        )}
                      >
                        {format(day, 'd')}
                      </div>

                      {/* Trip pills */}
                      <div className="space-y-0.5">
                        {dayTrips.slice(0, 2).map(({ trip, index }) => (
                          <div
                            key={trip.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, trip, day)}
                            onClick={() => navigate(`/trip/${trip.id}`)}
                            className={cn(
                              'text-[10px] leading-none px-1 py-0.5 rounded truncate cursor-pointer',
                              'select-none hover:opacity-90 active:opacity-75 transition-opacity',
                              tripColour(index),
                              draggingTripId === trip.id && 'opacity-50'
                            )}
                            title={trip.name || trip.cities?.name || 'Trip'}
                          >
                            {trip.name || trip.cities?.name || 'Trip'}
                          </div>
                        ))}
                        {dayTrips.length > 2 && (
                          <div className="text-[9px] text-muted-foreground px-1">
                            +{dayTrips.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {trips.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {trips.slice(0, 8).map((trip, index) => (
            <div key={trip.id} className="flex items-center gap-1.5">
              <div className={cn('w-3 h-3 rounded-sm', PILL_COLOURS[index % PILL_COLOURS.length].split(' ')[0])} />
              <span className="text-xs text-muted-foreground">
                {trip.name || trip.cities?.name || 'Trip'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
