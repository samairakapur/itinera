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
import { Activity } from './ActivityCard';

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
// Viator result type (from search-attractions edge function)
// ---------------------------------------------------------------------------
interface ViatorProduct {
  productCode: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  rating?: number;
  reviewCount?: number;
  durationMinutes?: number;
  priceFrom?: number;
  currency?: string;
  bookingUrl: string;
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
  onBookingConfirmed,
}: BookingPanelProps) => {
  const [step, setStep] = useState<'browse' | 'confirm'>('browse');
  const [viatorResults, setViatorResults] = useState<ViatorProduct[]>([]);
  const [viatorLoading, setViatorLoading] = useState(false);
  const [bookingRef, setBookingRef] = useState('');
  const [confirming, setConfirming] = useState(false);

  const isRestaurant = activity.type === 'restaurant';
  const isAttraction = activity.type === 'attraction' || activity.type === 'prebooked';
  const hasOpenTable = cityHasOpenTable(activity.cityName || cityName);

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
              searchTerm: `${activity.title} ${cityName ?? ''}`.trim(),
              city: cityName,
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

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep('browse');
      setBookingRef('');
    }
  }, [open]);

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
                {hasOpenTable ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Reserve a table via OpenTable — party size and date are pre-filled.
                    </p>
                    <Button
                      className="w-full gap-2"
                      onClick={() => window.open(openTableUrl, '_blank', 'noopener,noreferrer')}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Reserve on OpenTable
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      OpenTable doesn't cover this city. Use Google Maps to find the restaurant and call to reserve.
                    </p>
                    <Button
                      className="w-full gap-2"
                      onClick={() => window.open(googleMapsUrl, '_blank', 'noopener,noreferrer')}
                    >
                      <MapPin className="w-4 h-4" />
                      Find on Google Maps
                    </Button>
                    {activity.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span>{activity.location}</span>
                      </div>
                    )}
                  </>
                )}

                <div className="border-t border-border/50 pt-3 mt-2">
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => setStep('confirm')}
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
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
                          onBook={() => {
                            window.open(product.bookingUrl, '_blank', 'noopener,noreferrer');
                            setStep('confirm');
                          }}
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
                <p className="text-sm font-medium">Booking confirmed?</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Confirming will lock this activity in your itinerary.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="booking-ref" className="text-sm">
                Booking reference <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="booking-ref"
                placeholder="e.g. OT-12345 or Viator order ID"
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
  onBook,
}: {
  product: ViatorProduct;
  groupSize: number;
  onBook: () => void;
}) => {
  const totalPrice = product.priceFrom ? product.priceFrom * groupSize : undefined;

  return (
    <div className="border border-border/60 rounded-xl overflow-hidden bg-card">
      {product.thumbnailUrl && (
        <img
          src={product.thumbnailUrl}
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
          {product.priceFrom !== undefined && (
            <span className="flex items-center gap-1 text-foreground font-medium">
              <DollarSign className="w-3 h-3" />
              {product.currency ?? ''}
              {product.priceFrom.toFixed(0)}/person
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

        <Button size="sm" className="w-full gap-2 mt-1" onClick={onBook}>
          <ExternalLink className="w-3.5 h-3.5" />
          Book on Viator
        </Button>
      </div>
    </div>
  );
};
