import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Star,
  Clock,
  ExternalLink,
  Navigation,
  Coffee,
  Utensils,
  Landmark,
  CalendarPlus,
  Timer
} from 'lucide-react';
import { AddToItineraryDialog } from './AddToItineraryDialog';

export interface NearbyPlace {
  id: string;
  name: string;
  type: 'attraction' | 'cafe' | 'restaurant';
  description: string;
  distance: string;
  distanceKm?: number;
  rating: number;
  priceLevel?: number;
  openNow?: boolean;
  address: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string | null;
  matchReason: string;
  cuisine?: string;
  typicalTimeSpent?: string;
  /** Populated after OSRM enrichment */
  transportMode?: {
    mode: 'walk' | 'cycle' | 'transit' | 'car';
    emoji: string;
    label: string;
    estimatedMins: number;
  };
}

interface NearbyCardProps {
  place: NearbyPlace;
}

const typeIcons = {
  attraction: Landmark,
  cafe: Coffee,
  restaurant: Utensils,
};

const typeColors = {
  attraction: 'bg-blue-500/10 text-blue-600',
  cafe: 'bg-amber-500/10 text-amber-600',
  restaurant: 'bg-green-500/10 text-green-600',
};

// Gradient backgrounds for the image placeholder
const typePlaceholderGradient = {
  attraction: 'from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30',
  cafe: 'from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/30',
  restaurant: 'from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30',
};

const DEFAULT_TIME_SPENT: Record<string, string> = {
  attraction: '1.5 – 2 hrs',
  cafe: '30 – 45 min',
  restaurant: '1 – 1.5 hrs',
};

export const NearbyCard = ({ place }: NearbyCardProps) => {
  const Icon = typeIcons[place.type];
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleDirections = () => {
    if (place.latitude && place.longitude) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`,
        '_blank'
      );
    } else {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ', ' + place.address)}`,
        '_blank'
      );
    }
  };

  const timeSpent = place.typicalTimeSpent || DEFAULT_TIME_SPENT[place.type] || '1 hr';
  const showImage = place.imageUrl && !imgError;

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        {/* Image — always rendered; falls back to gradient + icon placeholder */}
        <div className="aspect-video relative overflow-hidden">
          {showImage ? (
            <img
              src={place.imageUrl!}
              alt={place.name}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${typePlaceholderGradient[place.type]}`}
            >
              <Icon className="w-14 h-14 opacity-15" />
            </div>
          )}

          {/* Type badge — top right */}
          <div className="absolute top-2 right-2">
            <Badge className={`${typeColors[place.type]} backdrop-blur-sm`}>
              <Icon className="w-3 h-3 mr-1" />
              {place.type.charAt(0).toUpperCase() + place.type.slice(1)}
            </Badge>
          </div>

          {/* Transport badge — bottom left (shown after OSRM enrichment) */}
          {place.transportMode && (
            <div className="absolute bottom-2 left-2">
              <Badge
                variant="secondary"
                className="text-xs font-medium bg-black/60 text-white border-0 backdrop-blur-sm"
              >
                {place.transportMode.emoji} {place.transportMode.label} · ~{place.transportMode.estimatedMins} min
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-display font-semibold text-lg line-clamp-1">{place.name}</h3>
            {place.rating > 0 && (
              <div className="flex items-center gap-1 text-sm shrink-0">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{place.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3 flex-wrap">
            <div className="flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5" />
              <span>{place.distance}</span>
              {/* Label road vs straight-line once OSRM enrichment is available */}
              {place.transportMode && (
                <span className="text-xs text-muted-foreground/60">(road)</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Timer className="w-3.5 h-3.5" />
              <span>{timeSpent}</span>
            </div>
            {place.openNow !== undefined && place.openNow !== null && (
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span className={place.openNow ? 'text-green-600' : 'text-red-500'}>
                  {place.openNow ? 'Open now' : 'Closed'}
                </span>
              </div>
            )}
            {place.priceLevel && (
              <span className="font-medium">
                {'$'.repeat(place.priceLevel)}
              </span>
            )}
          </div>

          {place.cuisine && (
            <Badge variant="secondary" className="mb-3">
              {place.cuisine}
            </Badge>
          )}

          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {place.description}
          </p>

          <div className="bg-primary/5 rounded-lg p-2 mb-4">
            <p className="text-xs text-primary">
              <span className="font-medium">Why this?</span> {place.matchReason}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="line-clamp-1">{place.address || 'Address not available'}</span>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleDirections} variant="outline" size="sm" className="flex-1 gap-2">
              <ExternalLink className="w-4 h-4" />
              Directions
            </Button>
            <Button onClick={() => setAddDialogOpen(true)} variant="default" size="sm" className="flex-1 gap-2">
              <CalendarPlus className="w-4 h-4" />
              Add to Trip
            </Button>
          </div>
        </CardContent>
      </Card>

      <AddToItineraryDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        place={place}
      />
    </>
  );
};
