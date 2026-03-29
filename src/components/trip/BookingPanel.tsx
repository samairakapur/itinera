import { useState, useEffect } from 'react';
import {
  ExternalLink,
  MapPin,
  Phone,
  Globe,
  Ticket,
  CheckCircle2,
  X,
  Loader2,
  Star,
  Clock,
  Users,
  DollarSign,
  Calendar,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Activity } from './ActivityCard';

// ---------------------------------------------------------------------------
// Region helpers (reuse same set as ActivityCard)
// ---------------------------------------------------------------------------
const OPENTABLE_CITIES = new Set([
  'new york', 'los angeles', 'chicago', 'san francisco', 'miami', 'boston',
  'washington', 'seattle', 'las vegas', 'houston', 'dallas', 'denver', 'atlanta',
  'toronto', 'vancouver', 'montreal',
  'london', 'manchester', 'edinburgh', 'birmingham', 'bristol',
  'paris', 'amsterdam', 'rome', 'barcelona', 'madrid', 'berlin', 'vienna',
  'lisbon', 'dublin', 'brussels', 'zurich', 'milan', 'florence', 'venice',
  'munich', 'hamburg', 'cologne', 'prague', 'budapest',
]);

function cityHasOpenTable(city?: string): boolean {
  if (!city) return false;
  const n = city.toLowerCase().trim();
  return [...OPENTABLE_CITIES].some(c => n.includes(c) || c.includes(n));
}

// ---------------------------------------------------------------------------
// Foursquare place details (fetched when restaurant panel opens)
// ---------------------------------------------------------------------------
interface FoursquarePlace {
  tel?: string;
  website?: string;
  hours?: { display?: string; is_open_now?: boolean };
  categories?: Array<{ name: string }>;
  location?: { address?: string; locality?: string };
}

const FSQ_KEY = import.meta.env.VITE_FOURSQUARE_API_KEY as string | undefined;

async function fetchFoursquareDetails(
  restaurantName: string,
  city?: string
): Promise<FoursquarePlace | null> {
  if (!FSQ_KEY) return null;
  try {
    const near = city ? `&near=${encodeURIComponent(city)}` : '';
    const url =
      `https://api.foursquare.com/v3/places/search` +
      `?query=${encodeURIComponent(restaurantName)}${near}&categories=13065&limit=1` +
      `&fields=name,tel,website,hours,location,categories`;
    const res = await fetch(url, {
      headers: { Authorization: FSQ_KEY, Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const place = data?.results?.[0];
    if (!place) return null;
    return {
      tel: place.tel,
      website: place.website,
      hours: place.hours,
      categories: place.categories,
      location: place.location,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Viator result type (from search-attractions edge function)
// ---------------------------------------------------------------------------
interface ViatorProduct {
  productCode: string;
  title: string;
  description?: string;
  imageUrl?: string;       // Edge function returns imageUrl
  thumbnailUrl?: string;   // legacy alias
  rating?: number;
  reviewCount?: number;
  durationMinutes?: number;
  fromPrice?: number;      // Edge function returns fromPrice
  priceFrom?: number;      // legacy alias
  currency?: string;
  bookingUrl: string;      // direct product URL with affiliate ID (or search fallback)
  webURL?: string;         // raw Viator webURL if available
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface BookingPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: Activity;
  cityName?: string;
  groupSize?: number;
  tripDate?: string;
  tripId?: string;
  /** Dietary preferences for all group members — used to show compatibility warnings */
  dietaryPreferences?: string[];
  /** Called when user confirms booking — marks activity as firm */
  onBookingConfirmed?: (activityId: string, bookingRef?: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const BookingPanel = ({
  open,
  onOpenChange,
  activity,
  cityName,
  groupSize = 2,
  tripDate,
  tripId,
  dietaryPreferences = [],
  onBookingConfirmed,
}: BookingPanelProps) => {
  const [step, setStep] = useState<'browse' | 'confirm'>('browse');
  const [viatorResults, setViatorResults] = useState<ViatorProduct[]>([]);
  const [viatorLoading, setViatorLoading] = useState(false);
  const [bookingRef, setBookingRef] = useState('');
  const [confirming, setConfirming] = useState(false);
  // Reservation tracker state
  const [reservationDate, setReservationDate] = useState(tripDate ?? new Date().toISOString().split('T')[0]);
  const [reservationTime, setReservationTime] = useState('');
  const [reservationPartySize, setReservationPartySize] = useState(String(groupSize));
  // Foursquare restaurant details
  const [fsqPlace, setFsqPlace] = useState<FoursquarePlace | null>(null);
  const [fsqLoading, setFsqLoading] = useState(false);

  const isRestaurant = activity.type === 'restaurant';
  const isAttraction = activity.type === 'attraction' || activity.type === 'prebooked';
  const hasOpenTable = cityHasOpenTable(activity.cityName || cityName);

  // Derive advisory signals for restaurants
  const isPopularRestaurant = activity.priceTier === '€€€' || activity.priceTier === '€€€€' ||
    activity.priceTier === '$$$' || activity.priceTier === '$$$$';
  const isLargeGroup = groupSize >= 6;
  const hasDietaryNeeds = dietaryPreferences.filter(d => d !== 'none' && d !== '').length > 0;
  const leadTimeDays = isPopularRestaurant ? 7 : 3;

  // Build booking URLs
  const openTableUrl = (() => {
    const term = encodeURIComponent(activity.title + (cityName ? ` ${cityName}` : ''));
    const covers = groupSize;
    const dateStr = tripDate ?? new Date().toISOString().split('T')[0];
    return `https://www.opentable.com/s?term=${term}&covers=${covers}&dateTime=${encodeURIComponent(`${dateStr}T19:00`)}`;
  })();

  const googleMapsUrl = (() => {
    const q = [activity.title, activity.address || activity.location, cityName]
      .filter(Boolean).join(', ');
    return `https://www.google.com/maps/search/${encodeURIComponent(q)}`;
  })();

  // Load Viator results when panel opens for attractions
  useEffect(() => {
    if (!open || !isAttraction || activity.isPrebooked) return;
    setViatorResults([]);
    setViatorLoading(true);

    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;

        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-attractions`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              // Edge function expects 'destination' (city) and 'query' (search term)
              destination: cityName ?? activity.cityName ?? '',
              query: activity.title,
              groupSize,
            }),
          }
        );
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.products)) setViatorResults(json.products);
        }
      } catch {
        // silently fail — fallback UI shown
      } finally {
        setViatorLoading(false);
      }
    };

    load();
  }, [open, activity.id, isAttraction, activity.isPrebooked, activity.title, cityName, groupSize]);

  // Load Foursquare details when restaurant panel opens
  useEffect(() => {
    if (!open || !isRestaurant) return;
    setFsqPlace(null);
    setFsqLoading(true);
    fetchFoursquareDetails(activity.title, cityName || activity.cityName)
      .then(place => setFsqPlace(place))
      .finally(() => setFsqLoading(false));
  }, [open, isRestaurant, activity.title, cityName, activity.cityName]);

  // Reset on close / pre-fill reservation fields on open
  useEffect(() => {
    if (!open) {
      setStep('browse');
      setBookingRef('');
      setFsqPlace(null);
    } else {
      setReservationDate(tripDate ?? new Date().toISOString().split('T')[0]);
      setReservationPartySize(String(groupSize));
      // Parse activity time to 24h for input[type=time], e.g. "7:30 PM" → "19:30"
      if (activity.time) {
        const m = activity.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (m) {
          let h = parseInt(m[1]);
          const min = m[2];
          const mer = m[3].toUpperCase();
          if (mer === 'PM' && h !== 12) h += 12;
          if (mer === 'AM' && h === 12) h = 0;
          setReservationTime(`${String(h).padStart(2, '0')}:${min}`);
        } else {
          setReservationTime('');
        }
      }
    }
  }, [open, tripDate, groupSize, activity.time]);

  const handleConfirmBooking = async () => {
    setConfirming(true);
    try {
      if (tripId && activity.id) {
        await supabase.from('bookings').insert({
          trip_id: tripId,
          day_item_id: activity.id,
          booking_type: isRestaurant ? 'restaurant' : 'attraction',
          provider: isRestaurant ? (hasOpenTable ? 'opentable' : 'manual') : 'viator',
          status: 'confirmed',
          group_size_at_booking: groupSize,
          booked_by: (await supabase.auth.getUser()).data.user?.id,
        });
      }
      onBookingConfirmed?.(activity.id, bookingRef || undefined);
      toast.success(`"${activity.title}" marked as booked!`);
      onOpenChange(false);
    } catch {
      toast.error('Could not save booking record. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[90vh] overflow-y-auto px-4 pb-8 pt-2"
      >
        {/* Drag handle */}
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <SheetHeader className="mb-4 text-left">
          <SheetTitle className="text-lg leading-tight">{activity.title}</SheetTitle>
          {cityName && (
            <SheetDescription className="flex items-center gap-1 text-sm">
              <MapPin className="w-3.5 h-3.5" />
              {cityName}
              {groupSize > 1 && (
                <span className="ml-2 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> {groupSize} people
                </span>
              )}
            </SheetDescription>
          )}
        </SheetHeader>

        {step === 'browse' ? (
          <>
            {/* ── Restaurant panel ──────────────────────────────────────── */}
            {isRestaurant && (
              <div className="space-y-3">
                {/* Restaurant meta row */}
                <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground">
                  {activity.priceTier && (
                    <Badge variant="outline" className="font-medium text-foreground">
                      {activity.priceTier}
                    </Badge>
                  )}
                  {activity.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {activity.location}
                    </span>
                  )}
                  {activity.duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      {activity.duration}
                    </span>
                  )}
                </div>

                {/* Foursquare details — phone, hours, website */}
                {(fsqLoading || fsqPlace) && (
                  <div className="space-y-1.5 text-sm">
                    {fsqLoading && !fsqPlace && (
                      <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Looking up restaurant details…</span>
                      </div>
                    )}
                    {fsqPlace?.tel && (
                      <a
                        href={`tel:${fsqPlace.tel.replace(/\s/g, '')}`}
                        className="flex items-center gap-2 text-sm hover:underline text-foreground"
                      >
                        <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span>{fsqPlace.tel}</span>
                      </a>
                    )}
                    {fsqPlace?.website && (
                      <a
                        href={fsqPlace.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm hover:underline text-primary truncate"
                      >
                        <Globe className="w-4 h-4 shrink-0" />
                        <span className="truncate">{fsqPlace.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                      </a>
                    )}
                    {fsqPlace?.hours?.display && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <span className={cn(
                            'text-xs font-medium mr-1.5',
                            fsqPlace.hours.is_open_now ? 'text-green-600' : 'text-red-500'
                          )}>
                            {fsqPlace.hours.is_open_now ? 'Open now' : 'Closed now'}
                          </span>
                          <span className="text-xs">{fsqPlace.hours.display}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Advisory banners */}
                <div className="space-y-2">
                  {isPopularRestaurant && (
                    <div className="flex items-start gap-2 text-xs bg-amber-50 border border-amber-200/60 rounded-lg px-3 py-2 text-amber-800">
                      <Calendar className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>Popular restaurant — book at least {leadTimeDays} days ahead to secure your table</span>
                    </div>
                  )}
                  {isLargeGroup && (
                    <div className="flex items-start gap-2 text-xs bg-blue-50 border border-blue-200/60 rounded-lg px-3 py-2 text-blue-800">
                      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>Group of {groupSize} — online reservations may be limited. Calling the restaurant directly is recommended.</span>
                    </div>
                  )}
                  {hasDietaryNeeds && (
                    <div className="flex items-start gap-2 text-xs bg-orange-50 border border-orange-200/60 rounded-lg px-3 py-2 text-orange-800">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>Dietary requirements in your group: <span className="font-medium">{dietaryPreferences.filter(d => d !== 'none' && d !== '').join(', ')}</span> — check the menu before booking.</span>
                    </div>
                  )}
                </div>

                {/* Booking links */}
                {hasOpenTable && (
                  <Button
                    className="w-full gap-2"
                    onClick={() => window.open(openTableUrl, '_blank', 'noopener,noreferrer')}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Reserve on OpenTable
                  </Button>
                )}
                <Button
                  variant={hasOpenTable ? 'outline' : 'default'}
                  className="w-full gap-2"
                  onClick={() => window.open(googleMapsUrl, '_blank', 'noopener,noreferrer')}
                >
                  <MapPin className="w-4 h-4" />
                  📍 Find on Google Maps
                </Button>

                {/* Reservation tracker */}
                <div className="border border-border/60 rounded-xl p-3 space-y-2.5 bg-muted/30">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Reservation Tracker</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="res-date" className="text-xs">Date</Label>
                      <Input
                        id="res-date"
                        type="date"
                        value={reservationDate}
                        onChange={e => setReservationDate(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="res-time" className="text-xs">Time</Label>
                      <Input
                        id="res-time"
                        type="time"
                        value={reservationTime}
                        onChange={e => setReservationTime(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="res-party" className="text-xs">Party size</Label>
                    <Input
                      id="res-party"
                      type="number"
                      min="1"
                      max="50"
                      value={reservationPartySize}
                      onChange={e => setReservationPartySize(e.target.value)}
                      className="h-8 text-xs w-24"
                    />
                  </div>
                  <Button
                    className="w-full gap-2"
                    size="sm"
                    onClick={() => setStep('confirm')}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    I've made my reservation
                  </Button>
                </div>
              </div>
            )}

            {/* ── Attraction panel ──────────────────────────────────────── */}
            {isAttraction && !activity.isPrebooked && (
              <div className="space-y-4">
                {viatorLoading ? (
                  <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-sm">Searching bookable tours…</span>
                  </div>
                ) : viatorResults.length > 0 ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Top tours and experiences from Viator:
                    </p>
                    <div className="space-y-3">
                      {viatorResults.map(product => (
                        <ViatorCard
                          key={product.productCode}
                          product={product}
                          groupSize={groupSize}
                          tripDate={tripDate}
                          onBook={() => setStep('confirm')}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Search for tours and experiences on Viator:
                    </p>
                    <Button
                      className="w-full gap-2"
                      onClick={() => {
                        const q = encodeURIComponent(`${activity.title} ${cityName ?? ''}`.trim());
                        window.open(
                          `https://www.viator.com/searchResults/all?text=${q}&pax=${groupSize}&mcid=P00294080`,
                          '_blank',
                          'noopener,noreferrer'
                        );
                      }}
                    >
                      <Ticket className="w-4 h-4" />
                      Search on Viator
                    </Button>
                  </>
                )}

                <div className="border-t border-border/50 pt-3">
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => setStep('confirm')}
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    I've completed my booking
                  </Button>
                </div>
              </div>
            )}

            {/* ── Pre-booked / custom / other ───────────────────────────── */}
            {(activity.isPrebooked || (!isRestaurant && !isAttraction)) && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Mark this activity as confirmed once you've arranged it.
                </p>
                {activity.location && (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => window.open(googleMapsUrl, '_blank', 'noopener,noreferrer')}
                  >
                    <MapPin className="w-4 h-4" />
                    View on Google Maps
                  </Button>
                )}
                <Button
                  className="w-full gap-2"
                  onClick={() => setStep('confirm')}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mark as booked
                </Button>
              </div>
            )}
          </>
        ) : (
          /* ── Confirm step ─────────────────────────────────────────────── */
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
              <div>
                <p className="text-sm font-medium">
                  {isRestaurant ? 'Reservation made?' : 'Booking completed?'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Confirming will lock this activity in your itinerary.
                </p>
              </div>
            </div>

            {/* Reservation summary for restaurants */}
            {isRestaurant && (reservationDate || reservationTime || reservationPartySize) && (
              <div className="bg-muted/40 rounded-xl px-4 py-3 text-sm space-y-1">
                <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-2">Reservation details</p>
                {reservationDate && <p>📅 {new Date(reservationDate + 'T12:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>}
                {reservationTime && <p>🕐 {reservationTime}</p>}
                {reservationPartySize && <p>👥 Party of {reservationPartySize}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="booking-ref" className="text-sm">
                {isRestaurant ? 'Reservation confirmation' : 'Booking reference'}{' '}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="booking-ref"
                placeholder={isRestaurant ? 'e.g. OT-12345 or confirmation email' : 'e.g. Viator order ID'}
                value={bookingRef}
                onChange={e => setBookingRef(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep('browse')}
              >
                <X className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handleConfirmBooking}
                disabled={confirming}
              >
                {confirming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Confirm booking
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

// ---------------------------------------------------------------------------
// ViatorCard — individual product listing
// ---------------------------------------------------------------------------
const ViatorCard = ({
  product,
  groupSize,
  tripDate,
  onBook,
}: {
  product: ViatorProduct;
  groupSize: number;
  tripDate?: string;
  onBook: () => void;
}) => {
  const price = product.fromPrice ?? product.priceFrom;
  const image = product.imageUrl ?? product.thumbnailUrl;
  const totalPrice = price ? price * groupSize : undefined;

  const handleBookClick = () => {
    // Enrich booking URL with date and group size parameters
    let url = product.bookingUrl;
    try {
      const u = new URL(url);
      if (tripDate) u.searchParams.set('date', tripDate);
      if (groupSize > 1) u.searchParams.set('pax', String(groupSize));
      url = u.toString();
    } catch {
      // URL parsing failed — use as-is
    }
    window.open(url, '_blank', 'noopener,noreferrer');
    onBook();
  };

  return (
    <div className="border border-border/60 rounded-xl overflow-hidden bg-card">
      {image && (
        <img
          src={image}
          alt={product.title}
          className="w-full h-36 object-cover"
        />
      )}
      <div className="p-3 space-y-2">
        <p className="text-sm font-medium leading-snug">{product.title}</p>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {product.rating !== undefined && (
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              {product.rating.toFixed(1)}
              {product.reviewCount && (
                <span className="text-muted-foreground/70">({product.reviewCount.toLocaleString()})</span>
              )}
            </span>
          )}
          {product.durationMinutes && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {product.durationMinutes >= 60
                ? `${Math.floor(product.durationMinutes / 60)}h${product.durationMinutes % 60 > 0 ? ` ${product.durationMinutes % 60}m` : ''}`
                : `${product.durationMinutes}m`}
            </span>
          )}
          {price !== undefined && (
            <span className="flex items-center gap-1 text-foreground font-medium">
              <DollarSign className="w-3 h-3" />
              {product.currency ?? ''}
              {price.toFixed(0)}/person
              {totalPrice && groupSize > 1 && (
                <span className="text-muted-foreground font-normal">
                  {' '}(total {product.currency ?? ''}{totalPrice.toFixed(0)})
                </span>
              )}
            </span>
          )}
        </div>

        {product.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
        )}

        <Button size="sm" className="w-full gap-2 mt-1" onClick={handleBookClick}>
          <ExternalLink className="w-3.5 h-3.5" />
          Book on Viator
        </Button>
      </div>
    </div>
  );
};
