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
  Landmark
} from 'lucide-react';

export interface NearbyPlace {
  id: string;
  name: string;
  type: 'attraction' | 'cafe' | 'restaurant';
  description: string;
  distance: string;
  rating: number;
  priceLevel?: number;
  openNow?: boolean;
  address: string;
  imageUrl?: string;
  matchReason: string;
  cuisine?: string;
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

export const NearbyCard = ({ place }: NearbyCardProps) => {
  const Icon = typeIcons[place.type];

  const handleDirections = () => {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`,
      '_blank'
    );
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {place.imageUrl && (
        <div className="aspect-video relative overflow-hidden">
          <img
            src={place.imageUrl}
            alt={place.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2">
            <Badge className={typeColors[place.type]}>
              <Icon className="w-3 h-3 mr-1" />
              {place.type.charAt(0).toUpperCase() + place.type.slice(1)}
            </Badge>
          </div>
        </div>
      )}
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

        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Navigation className="w-3.5 h-3.5" />
            <span>{place.distance}</span>
          </div>
          {place.openNow !== undefined && (
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span className={place.openNow ? 'text-green-600' : 'text-red-500'}>
                {place.openNow ? 'Open now' : 'Closed'}
              </span>
            </div>
          )}
          {place.priceLevel && (
            <span className="font-medium">
              {'€'.repeat(place.priceLevel)}
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
          <span className="line-clamp-1">{place.address}</span>
        </div>

        <Button onClick={handleDirections} variant="outline" size="sm" className="w-full gap-2">
          <ExternalLink className="w-4 h-4" />
          Get Directions
        </Button>
      </CardContent>
    </Card>
  );
};
