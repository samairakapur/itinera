import { useState, lazy, Suspense } from 'react';
const BookingPanel = lazy(() => import('./BookingPanel').then(m => ({ default: m.BookingPanel })));
import {
  Utensils,
  Landmark,
  MapPin,
  Clock,
  Timer,
  Star,
  MoreHorizontal,
  ArrowUpDown,
  Trash2,
  RefreshCw,
  Bookmark,
  Lightbulb,
  Edit,
  Ticket,
  Navigation,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  Circle,
  ChevronDown,
  Sparkles,
  AlertTriangle,
  Lock,
  Vote,
  MessageSquarePlus,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface Activity {
  id: string;
  type: 'attraction' | 'restaurant' | 'transport' | 'custom' | 'prebooked' | 'flex';
  title: string;
  description?: string;
  time?: string;
  duration?: string;
  location?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  cityName?: string;
  mustDo?: boolean;
  reasoning?: string;
  isPrebooked?: boolean;
  bookingReference?: string;
  travelTimeMinutes?: number;
  /** Scheduling flexibility: firm = fixed time, soft = approximate, flex = fill-in */
  flexibility?: 'firm' | 'soft' | 'flex';
  /** Price tier indicator */
  priceTier?: '€' | '€€' | '€€€' | '€€€€' | '$' | '$$' | '$$$' | '$$$$';
  /** Viator pre-selected tour — populated after itinerary save via enrichActivitiesWithViator */
  viatorProductCode?: string;
  viatorBookingUrl?: string;
  viatorProductTitle?: string;
  viatorPricePerPerson?: number;
  viatorRating?: number;
  viatorDurationMinutes?: number;
  viatorImageUrl?: string;
}

interface ActivityCardProps {
  activity: Activity;
  cityName?: string;
  isCompleted?: boolean;
  onRemove?: (id: string) => void;
  onSwap?: (id: string) => void;
  onToggleMustDo?: (id: string) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  onEdit?: (id: string) => void;
  onToggleComplete?: (id: string) => void;
  isFirst?: boolean;
  isLast?: boolean;
  /** Computed by the reflow engine — overrides activity.time when present */
  computedStartTime?: string;
  /** True when this activity overflows the day's flight-constraint window */
  isScheduleOverflow?: boolean;
  /** Group size — enables booking CTAs and group-size warnings */
  groupSize?: number;
  /** Trip start date for booking links */
  tripDate?: string;
  /** Trip ID — used to record bookings in the DB */
  tripId?: string;
  /** Called after user confirms a booking */
  onBookingConfirmed?: (activityId: string, ref?: string) => void;
  /** When true, destructive actions (remove/swap) route through proposal flow */
  isDemocratic?: boolean;
  /** Called instead of onRemove when isDemocratic is true */
  onProposeRemove?: (id: string) => void;
  /** Called instead of onSwap when isDemocratic is true */
  onProposeSwap?: (id: string) => void;
}

const typeIcons = {
  attraction: Landmark,
  restaurant: Utensils,
  transport: MapPin,
  custom: Star,
  prebooked: Ticket,
  flex: Sparkles,
};

// Cities with confirmed OpenTable restaurant coverage
const OPENTABLE_CITIES = new Set([
  // North America
  'new york', 'los angeles', 'chicago', 'san francisco', 'miami', 'boston',
  'washington', 'seattle', 'las vegas', 'houston', 'dallas', 'denver', 'atlanta',
  'toronto', 'vancouver', 'montreal',
  // UK
  'london', 'manchester', 'edinburgh', 'birmingham', 'bristol',
  // Core Europe (confirmed coverage)
  'paris', 'amsterdam', 'rome', 'barcelona', 'madrid', 'berlin', 'milan', 'munich',
  // Asia-Pacific
  'tokyo', 'hong kong', 'sydney', 'melbourne',
]);

// Cities where Chope has restaurant reservation coverage (SE Asia)
const CHOPE_CITY_SLUGS: Record<string, string> = {
  'singapore': 'singapore',
  'bangkok':   'bangkok',
  'phuket':    'phuket',
  'bali':      'bali',
  'jakarta':   'jakarta',
  'hong kong': 'hong-kong',
  'shanghai':  'shanghai',
};

/** Returns true if the city has substantial OpenTable restaurant coverage */
function cityHasOpenTable(city?: string): boolean {
  if (!city) return false;
  const normalized = city.toLowerCase().trim();
  return [...OPENTABLE_CITIES].some(c => normalized.includes(c) || c.includes(normalized));
}

/** Returns true if the city has Chope restaurant reservation coverage */
function cityHasChope(city?: string): boolean {
  if (!city) return false;
  const normalized = city.toLowerCase().trim();
  return Object.keys(CHOPE_CITY_SLUGS).some(c => normalized.includes(c) || c.includes(normalized));
}

/** Chope slug for a city name, or null if not covered */
function chopeSlug(city?: string): string | null {
  if (!city) return null;
  const normalized = city.toLowerCase().trim();
  const key = Object.keys(CHOPE_CITY_SLUGS).find(c => normalized.includes(c) || c.includes(normalized));
  return key ? CHOPE_CITY_SLUGS[key] : null;
}

const typeColors = {
  attraction: 'bg-primary/8 text-primary border-primary/15',
  restaurant: 'bg-white/5 text-foreground/70 border-white/10',
  transport: 'bg-white/5 text-muted-foreground border-white/10',
  custom: 'bg-white/5 text-muted-foreground border-white/10',
  prebooked: 'bg-primary/8 text-primary border-primary/15',
  flex: 'bg-white/5 text-muted-foreground border-white/10',
};

export const ActivityCard = ({
  activity,
  cityName,
  isCompleted = false,
  onRemove,
  onSwap,
  onToggleMustDo,
  onMoveUp,
  onMoveDown,
  onEdit,
  onToggleComplete,
  isFirst,
  isLast,
  computedStartTime,
  isScheduleOverflow = false,
  groupSize,
  tripDate,
  isDemocratic = false,
  onProposeRemove,
  onProposeSwap,
  tripId,
  onBookingConfirmed,
}: ActivityCardProps) => {
  const [showReasoning, setShowReasoning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [bookingPanelOpen, setBookingPanelOpen] = useState(false);
  const Icon = typeIcons[activity.type] || Star;
  const colorClass = typeColors[activity.type] || typeColors.custom;

  // ── Type flags — declared first so all downstream consts can reference them ──
  // Supplement the `type` field with a title-based heuristic: the AI sometimes
  // assigns type='attraction' to breakfast/lunch/dinner entries. Catch those here
  // so they get restaurant booking CTAs instead of a Viator "Find tours" button.
  const MEAL_KEYWORDS = ['breakfast', 'lunch', 'dinner', 'brunch', 'café', 'cafe', 'bistro', 'brasserie', 'restaurant'];
  const titleIsMeal = MEAL_KEYWORDS.some(k => activity.title.toLowerCase().includes(k));
  const isRestaurant = activity.type === 'restaurant' || titleIsMeal;
  const isAttraction = (activity.type === 'attraction' || activity.type === 'prebooked') && !isRestaurant;

  // priceTier: use stored value or fall back to a sensible default per type
  // (existing trips pre-date the price_tier column — always show something)
  const priceTier: Activity['priceTier'] = activity.priceTier ?? (
    activity.type === 'transport' || activity.type === 'flex' ? '€' :
    activity.type === 'restaurant' ? '€€' :
    '€€'
  );

  const getGoogleMapsUrl = () => {
    if (activity.latitude && activity.longitude) {
      return `https://www.google.com/maps/dir/?api=1&destination=${activity.latitude},${activity.longitude}&destination_place_id=`;
    }
    
    const parts: string[] = [];
    if (activity.title) parts.push(activity.title);
    if (activity.address) parts.push(activity.address);
    else if (activity.location) parts.push(activity.location);
    
    const city = activity.cityName || cityName;
    if (city && !parts.some(p => p.toLowerCase().includes(city.toLowerCase()))) {
      parts.push(city);
    }
    
    const query = encodeURIComponent(parts.join(', '));
    return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
  };

  const getMapsQuery = () => {
    const parts: string[] = [];
    if (activity.title) parts.push(activity.title);
    if (activity.address) parts.push(activity.address);
    else if (activity.location) parts.push(activity.location);
    const city = activity.cityName || cityName;
    if (city) parts.push(city);
    return parts.join(', ');
  };

  const handleCopyQuery = async () => {
    const query = getMapsQuery();
    try {
      await navigator.clipboard.writeText(query);
      setCopied(true);
      toast.success('Location copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleOpenMaps = () => {
    window.open(getGoogleMapsUrl(), '_blank', 'noopener,noreferrer');
  };

  // OpenTable deep-link: search by name + city, pre-fill party size
  // Format: /s?term=...&covers=...&dateTime=YYYY-MM-DDTHH:MM
  const getOpenTableUrl = () => {
    const term = encodeURIComponent(activity.title + (cityName ? ` ${cityName}` : ''));
    const covers = groupSize ?? 2;
    const dateStr = tripDate ? tripDate : new Date().toISOString().split('T')[0];
    const dateTime = encodeURIComponent(`${dateStr}T19:00`);
    return `https://www.opentable.com/s?term=${term}&covers=${covers}&dateTime=${dateTime}`;
  };

  // Chope deep-link: search by restaurant name in the city (SE Asia)
  // Format: chope.co/{city}-restaurants?keyword={name}&date={date}&time={time}&pax={n}
  const getChopeUrl = () => {
    const city = activity.cityName || cityName || '';
    const slug = chopeSlug(city);
    if (!slug) return '#';
    const keyword = encodeURIComponent(activity.title);
    const dateStr = tripDate ?? new Date().toISOString().split('T')[0];
    const pax = groupSize ?? 2;
    return `https://www.chope.co/${slug}-restaurants?keyword=${keyword}&date=${dateStr}&time=19%3A00&pax=${pax}`;
  };

  // Google Maps restaurant search — works globally
  const getGoogleMapsRestaurantUrl = () => {
    const parts = [activity.title];
    if (cityName) parts.push(cityName);
    return `https://www.google.com/maps/search/${encodeURIComponent(parts.join(' '))}`;
  };

  const showOpenTable = isRestaurant && cityHasOpenTable(activity.cityName || cityName);
  const showChope = isRestaurant && !showOpenTable && cityHasChope(activity.cityName || cityName);

  // Viator affiliate search link — /searchResults/all avoids 404, mcid is our partner tracking ID
  const getViatorUrl = () => {
    const q = encodeURIComponent((activity.title + (cityName ? ` ${cityName}` : '')).trim());
    const pax = groupSize ? `&pax=${groupSize}` : '';
    return `https://www.viator.com/searchResults/all?text=${q}${pax}&mcid=P00294080`;
  };

  const showGroupWarning = isRestaurant && groupSize && groupSize >= 7;
  const showCallWarning = isRestaurant && groupSize && groupSize >= 9;

  // Split description and booking warning (⚠️ line)
  const rawDesc = activity.description || '';
  const bookingWarningIdx = rawDesc.indexOf('\n⚠️');
  const mainDescription = bookingWarningIdx >= 0 ? rawDesc.slice(0, bookingWarningIdx).trim() : rawDesc;
  const bookingWarning = bookingWarningIdx >= 0 ? rawDesc.slice(bookingWarningIdx + 1).trim() : undefined;

  const isFlexActivity = activity.type === 'flex';

  return (
    <>
    <Card className={cn(
      "border shadow-sm hover:shadow-md transition-all duration-200",
      isFlexActivity && "border-white/10",
      activity.mustDo && "ring-1 ring-primary/40",
      activity.isPrebooked && "ring-1 ring-primary/30",
      isCompleted && "opacity-60 bg-muted/50",
      isScheduleOverflow && "border-l-4 border-l-destructive/70",
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Completion Toggle */}
          {onToggleComplete && (
            <button
              onClick={() => onToggleComplete(activity.id)}
              className="mt-1 shrink-0"
            >
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
              )}
            </button>
          )}

          {/* Icon */}
          <div className={cn("p-2.5 rounded-xl shrink-0 border", colorClass)}>
            <Icon className="w-4 h-4" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className={cn(
                    "font-semibold text-foreground",
                    isCompleted && "line-through"
                  )}>
                    {activity.title}
                  </h4>
                  {isFlexActivity && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5 border-primary/30 text-primary bg-transparent">
                      Free time
                    </Badge>
                  )}
                  {activity.mustDo && (
                    <Badge variant="default" className="text-xs px-2 py-0.5">
                      Must-Do
                    </Badge>
                  )}
                  {activity.isPrebooked && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5 bg-primary/10 text-primary border-primary/20">
                      <Ticket className="w-3 h-3 mr-1" />
                      Pre-booked
                    </Badge>
                  )}
                  {activity.flexibility === 'firm' && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5 bg-amber-500/10 text-amber-600 border-amber-500/20">
                      <Lock className="w-3 h-3 mr-1" />
                      Firm
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs px-2 py-0.5 border-white/15 text-muted-foreground bg-transparent font-mono">
                    {priceTier}
                  </Badge>
                </div>
                {mainDescription && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {mainDescription}
                  </p>
                )}
                {/* Booking warning pill */}
                {bookingWarning && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground bg-white/5 border border-white/10 rounded-sm px-2 py-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{bookingWarning.replace(/^⚠️\s*/, '')}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(activity.id)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Activity
                    </DropdownMenuItem>
                  )}
                  {onToggleMustDo && (
                    <DropdownMenuItem onClick={() => onToggleMustDo(activity.id)}>
                      <Bookmark className="w-4 h-4 mr-2" />
                      {activity.mustDo ? 'Remove Must-Do' : 'Mark as Must-Do'}
                    </DropdownMenuItem>
                  )}
                  {/* Swap: democratic → propose, otherwise direct */}
                  {isDemocratic && onProposeSwap ? (
                    <DropdownMenuItem onClick={() => onProposeSwap(activity.id)}>
                      <Vote className="w-4 h-4 mr-2 text-primary" />
                      Propose: Swap
                    </DropdownMenuItem>
                  ) : onSwap ? (
                    <DropdownMenuItem onClick={() => onSwap(activity.id)}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Swap Activity
                    </DropdownMenuItem>
                  ) : null}
                  {(onMoveUp || onMoveDown) && <DropdownMenuSeparator />}
                  {onMoveUp && !isFirst && (
                    <DropdownMenuItem onClick={() => onMoveUp(activity.id)}>
                      <ArrowUpDown className="w-4 h-4 mr-2" />
                      Move Up
                    </DropdownMenuItem>
                  )}
                  {onMoveDown && !isLast && (
                    <DropdownMenuItem onClick={() => onMoveDown(activity.id)}>
                      <ArrowUpDown className="w-4 h-4 mr-2" />
                      Move Down
                    </DropdownMenuItem>
                  )}
                  {/* Remove: democratic → propose, otherwise direct */}
                  {isDemocratic && onProposeRemove ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onProposeRemove(activity.id)}
                        className="text-primary focus:text-primary"
                      >
                        <Vote className="w-4 h-4 mr-2" />
                        Propose: Remove
                      </DropdownMenuItem>
                    </>
                  ) : onRemove ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onRemove(activity.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </>
                  ) : null}
                  {/* Suggest to organiser — shown in organiser-mode trips for non-owners */}
                  {!isDemocratic && onProposeRemove && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onProposeRemove(activity.id)}>
                        <MessageSquarePlus className="w-4 h-4 mr-2 text-muted-foreground" />
                        Suggest to organiser
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Meta */}
            {(computedStartTime || activity.time || activity.duration || activity.location) && (
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                {/* Reflow-computed start time — shown in red when activity overflows day window */}
                {computedStartTime ? (
                  <span className={cn(
                    "flex items-center gap-1 font-medium",
                    isScheduleOverflow
                      ? "text-destructive"
                      : "text-foreground"
                  )}>
                    <Clock className="w-3 h-3" />
                    {computedStartTime}
                    {isScheduleOverflow && (
                      <span className="ml-0.5 text-destructive font-normal">(over limit)</span>
                    )}
                  </span>
                ) : activity.time ? (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {activity.time}
                  </span>
                ) : null}
                {activity.duration && (
                  <span className="flex items-center gap-1">
                    <Timer className="w-3 h-3" />
                    {activity.duration}
                  </span>
                )}
                {activity.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {activity.location}
                  </span>
                )}
              </div>
            )}

            {/* Booking CTAs */}
            {isRestaurant && (
              <div className="mt-3 space-y-2">
                {showGroupWarning && (
                  <div className={cn(
                    'flex items-start gap-1.5 text-xs rounded-sm px-2 py-1.5 border',
                    showCallWarning
                      ? 'bg-destructive/10 border-destructive/20 text-destructive'
                      : 'bg-amber-500/10 border-amber-500/20 text-amber-600'
                  )}>
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
                    <span>
                      {showCallWarning
                        ? `Group of ${groupSize} — call the restaurant directly to confirm availability`
                        : `Group of ${groupSize} — contact restaurant to ensure they can accommodate`}
                    </span>
                  </div>
                )}
                {showOpenTable ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5 bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                    onClick={() => window.open(getOpenTableUrl(), '_blank', 'noopener,noreferrer')}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Reserve on OpenTable
                  </Button>
                ) : showChope ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5 bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                    onClick={() => window.open(getChopeUrl(), '_blank', 'noopener,noreferrer')}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Reserve on Chope
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5 bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                    onClick={() => window.open(getGoogleMapsRestaurantUrl(), '_blank', 'noopener,noreferrer')}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    Find on Google Maps
                  </Button>
                )}
              </div>
            )}
            {isAttraction && !activity.isPrebooked && (
              <div className="mt-3 space-y-2">
                {/* Viator pre-selected tour chip */}
                {activity.viatorProductCode ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/8 border border-primary/15 rounded-lg px-2.5 py-1.5">
                    <Sparkles className="w-3 h-3 text-primary shrink-0" />
                    <span className="text-primary font-medium">Tour found</span>
                    {activity.viatorRating !== undefined && (
                      <span className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        {activity.viatorRating.toFixed(1)}
                      </span>
                    )}
                    {activity.viatorPricePerPerson !== undefined && (
                      <span className="text-foreground font-medium">
                        · from ${activity.viatorPricePerPerson.toFixed(0)}/pp
                      </span>
                    )}
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5 bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                    onClick={() => window.open(getViatorUrl(), '_blank', 'noopener,noreferrer')}
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    Find tours on Viator
                  </Button>
                )}
              </div>
            )}

            {/* How to get there */}
            {activity.type !== 'transport' && activity.type !== 'flex' && (
              <div className="mt-3 flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 text-xs gap-1.5 bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      How to get there
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3" align="start">
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        Get directions from your current location
                      </p>
                      <Button 
                        onClick={handleOpenMaps}
                        className="w-full gap-2"
                        size="sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open in Google Maps
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCopyQuery}
                        className="w-full gap-2"
                        size="sm"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy location
                          </>
                        )}
                      </Button>
                      <p className="text-[10px] text-muted-foreground pt-1 border-t">
                        {getMapsQuery()}
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Booking Reference */}
            {activity.bookingReference && (
              <div className="mt-2 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded inline-block">
                Ref: {activity.bookingReference}
              </div>
            )}

            {/* Reasoning - Enhanced visibility with always-visible indicator */}
            {activity.reasoning && (
              <Collapsible open={showReasoning} onOpenChange={setShowReasoning}>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn(
                      "mt-2 h-8 px-3 text-xs gap-2 border",
                      showReasoning 
                        ? "bg-primary/10 border-primary/20 text-primary" 
                        : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                    )}
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>{showReasoning ? 'Hide recommendation' : 'Why this?'}</span>
                    <ChevronDown className={cn(
                      "w-3 h-3 transition-transform",
                      showReasoning && "rotate-180"
                    )} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 p-3 rounded-sm bg-muted border border-white/10 text-sm text-foreground/80">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <p>{activity.reasoning}</p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </div>
      </CardContent>

      {/* Book CTA — shown for restaurants and bookable attractions */}
      {(isRestaurant || (isAttraction && !activity.isPrebooked)) && (
        <div className="px-4 pb-4 pt-0">
          <Button
            size="sm"
            className="w-full h-8 text-xs gap-1.5"
            onClick={() => setBookingPanelOpen(true)}
          >
            <Ticket className="w-3.5 h-3.5" />
            {activity.flexibility === 'firm' ? 'Booked ✓' : 'Book this'}
          </Button>
        </div>
      )}
    </Card>

    {/* Booking Panel (lazy-loaded bottom sheet) */}
    <Suspense fallback={null}>
      <BookingPanel
        open={bookingPanelOpen}
        onOpenChange={setBookingPanelOpen}
        activity={activity}
        cityName={cityName}
        groupSize={groupSize}
        tripDate={tripDate}
        tripId={tripId}
        onBookingConfirmed={onBookingConfirmed}
      />
    </Suspense>
    </>
  );
};
