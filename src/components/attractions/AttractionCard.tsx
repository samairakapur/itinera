import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  DollarSign, 
  Heart, 
  MapPin, 
  Star, 
  Users, 
  Home,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToggleFavorite, useIsFavorite } from '@/hooks/useFavorites';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Attraction } from '@/hooks/useAttractions';

// Default fallback image for attractions
const DEFAULT_ATTRACTION_IMAGE = 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600';

interface AttractionCardProps {
  attraction: Attraction;
}

const AttractionCard = ({ attraction }: AttractionCardProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { user } = useAuth();
  const toggleFavorite = useToggleFavorite();
  const isFavorite = useIsFavorite(attraction.id);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please sign in to save favorites');
      return;
    }
    
    try {
      const result = await toggleFavorite.mutateAsync({ attractionId: attraction.id });
      toast.success(result.action === 'added' ? 'Added to favorites!' : 'Removed from favorites');
    } catch (error) {
      toast.error('Failed to update favorites');
    }
  };

  const formatPrice = (price: number | null) => {
    if (price === null || price === 0) return 'Free';
    return `$${price}`;
  };

  const imageUrl = imageError || !attraction.image_url ? DEFAULT_ATTRACTION_IMAGE : attraction.image_url;

  return (
    <Card className="group overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-300">
      <div className="relative aspect-video overflow-hidden bg-muted">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center animate-pulse">
            <MapPin className="w-8 h-8 text-primary/40" />
          </div>
        )}
        <img
          src={imageUrl}
          alt={attraction.name}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(true);
          }}
          loading="lazy"
        />
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background",
            isFavorite && "text-red-500"
          )}
          onClick={handleFavoriteClick}
        >
          <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
        </Button>
        {attraction.category && (
          <Badge className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm text-foreground">
            {attraction.category}
          </Badge>
        )}
      </div>
      
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-1">{attraction.name}</CardTitle>
          {attraction.rating && (
            <div className="flex items-center gap-1 text-sm shrink-0">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{attraction.rating}</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {attraction.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {attraction.description}
          </p>
        )}
        
        <div className="flex flex-wrap gap-2 text-sm">
          {attraction.duration_minutes && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3 h-3" />
              {attraction.duration_minutes >= 60 
                ? `${Math.floor(attraction.duration_minutes / 60)}h ${attraction.duration_minutes % 60}m`
                : `${attraction.duration_minutes}m`
              }
            </div>
          )}
          
          <div className="flex items-center gap-1 text-muted-foreground">
            <DollarSign className="w-3 h-3" />
            {formatPrice(attraction.price_adult)}
            {attraction.price_child !== null && attraction.price_child !== attraction.price_adult && (
              <span className="text-xs">(child: {formatPrice(attraction.price_child)})</span>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1.5">
          {attraction.is_family_friendly && (
            <Badge variant="secondary" className="text-xs">
              <Users className="w-3 h-3 mr-1" />
              Family-Friendly
            </Badge>
          )}
          {attraction.is_indoor && (
            <Badge variant="outline" className="text-xs">
              <Home className="w-3 h-3 mr-1" />
              Indoor
            </Badge>
          )}
        </div>
        
        {attraction.ticket_online_url && (
          <Button variant="outline" size="sm" className="w-full mt-2" asChild>
            <a href={attraction.ticket_online_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3 h-3 mr-2" />
              Buy Tickets Online
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default AttractionCard;
