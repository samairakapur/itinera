/**
 * PublicTripView — read-only itinerary page accessible without auth.
 *
 * Route: /trip/share/:publicLinkId
 *
 * Fetches the itinerary via the public_link_id column (no auth token needed;
 * the Supabase anon RLS policy allows SELECT on itineraries where
 * is_link_shared = true).  Shows all days and activities in read-only mode,
 * with a CTA to sign up and become a collaborator.
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DayCard, DayData } from '@/components/trip/DayCard';
import { TripOverviewCard } from '@/components/trip/TripOverviewCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, MapPin, Plane, Sparkles, UserPlus } from 'lucide-react';

interface PublicItinerary {
  id: string;
  name: string;
  num_days: number;
  start_date: string | null;
  end_date: string | null;
  travel_style: string | null;
  pace: string | null;
  budget_level: string | null;
  cities: {
    name: string;
    country: string;
    image_url: string | null;
  } | null;
  itinerary_items: {
    id: string;
    day_number: number;
    time_slot: string;
    order_index: number;
    item_type: string;
    custom_title: string | null;
    custom_description: string | null;
    notes: string | null;
  }[];
}

const PublicTripView = () => {
  const { publicLinkId } = useParams<{ publicLinkId: string }>();
  const [itinerary, setItinerary] = useState<PublicItinerary | null>(null);
  const [days, setDays] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!publicLinkId) return;

    const fetchItinerary = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('itineraries')
          .select(`
            id, name, num_days, start_date, end_date,
            travel_style, pace, budget_level,
            cities (name, country, image_url),
            itinerary_items (
              id, day_number, time_slot, order_index,
              item_type, custom_title, custom_description, notes
            )
          `)
          .eq('public_link_id', publicLinkId)
          .eq('is_link_shared', true)
          .single();

        if (error || !data) {
          setNotFound(true);
          return;
        }

        setItinerary(data as unknown as PublicItinerary);

        // Build DayData[] from itinerary_items
        const daysMap: Record<number, DayData> = {};
        for (let i = 1; i <= data.num_days; i++) {
          daysMap[i] = {
            dayNumber: i,
            title: `Day ${i}`,
            startTime: '9:00 AM',
            morning: [],
            afternoon: [],
            evening: [],
          };
        }

        const items = (data.itinerary_items || []) as PublicItinerary['itinerary_items'];
        items.sort((a, b) => a.order_index - b.order_index);

        items.forEach(item => {
          const day = daysMap[item.day_number];
          if (!day) return;
          const activity = {
            id: item.id,
            type: item.item_type as 'attraction' | 'restaurant' | 'transport',
            title: item.custom_title || 'Activity',
            description: item.custom_description || undefined,
            reasoning: item.notes || undefined,
          };
          if (item.time_slot === 'morning') day.morning.push(activity);
          else if (item.time_slot === 'afternoon') day.afternoon.push(activity);
          else if (item.time_slot === 'evening') day.evening.push(activity);
        });

        setDays(Object.values(daysMap).sort((a, b) => a.dayNumber - b.dayNumber));
      } catch (err) {
        console.error('PublicTripView fetch error:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchItinerary();
  }, [publicLinkId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading itinerary…</p>
        </div>
      </div>
    );
  }

  if (notFound || !itinerary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-sm mx-auto border-0 shadow-card">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-muted flex items-center justify-center">
              <MapPin className="w-7 h-7 text-muted-foreground" />
            </div>
            <h2 className="font-display text-xl font-bold">Trip not found</h2>
            <p className="text-muted-foreground text-sm">
              This link may have been disabled or doesn't exist.
            </p>
            <Button asChild className="w-full">
              <Link to="/">Plan your own trip</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cityName = itinerary.cities?.name || 'Unknown City';
  const countryName = itinerary.cities?.country || '';

  return (
    <div className="min-h-screen pb-16">
      {/* ── Sign-up CTA banner ── */}
      <div className="sticky top-0 z-20 bg-primary text-primary-foreground px-4 py-2.5">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>You're viewing a shared trip — <strong>sign up free</strong> to build your own!</span>
          </div>
          <Button size="sm" variant="secondary" asChild className="shrink-0 gap-1.5">
            <Link to="/auth">
              <UserPlus className="w-3.5 h-3.5" />
              Sign Up
            </Link>
          </Button>
        </div>
      </div>

      <div className="container px-4 max-w-2xl mx-auto pt-6 space-y-6">
        {/* Trip header */}
        <div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Plane className="w-4 h-4" />
            <span>Shared itinerary</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">{itinerary.name}</h1>
          <p className="text-muted-foreground mt-1">
            {cityName}, {countryName} · {itinerary.num_days} day{itinerary.num_days !== 1 ? 's' : ''}
            {itinerary.start_date && ` · ${new Date(itinerary.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
          </p>
        </div>

        {/* Trip overview */}
        <TripOverviewCard
          cityName={cityName}
          countryName={countryName}
          numDays={itinerary.num_days}
          travelStyle={itinerary.travel_style || ''}
          pace={itinerary.pace || ''}
          budgetLevel={itinerary.budget_level || ''}
          summary=""
        />

        {/* Read-only note */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          This is a read-only view. Sign in to collaborate on or save your own copy.
        </div>

        {/* Day cards — read-only: no edit handlers passed, so controls are hidden */}
        {days.map(day => (
          <DayCard
            key={day.dayNumber}
            day={day}
          />
        ))}

        {/* Bottom CTA */}
        <Card className="border-0 bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="p-6 text-center space-y-3">
            <Sparkles className="w-8 h-8 text-primary mx-auto" />
            <h3 className="font-display font-bold text-lg">Love this trip?</h3>
            <p className="text-muted-foreground text-sm">
              Create your free account to plan your own itinerary or collaborate on this one.
            </p>
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to="/auth">Get Started — It's Free</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicTripView;
