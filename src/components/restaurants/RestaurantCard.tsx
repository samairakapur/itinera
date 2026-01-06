import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  MapPin, 
  Star, 
  Users, 
  Leaf,
  Phone,
  Globe,
  DollarSign
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToggleFavorite, useIsFavorite } from '@/hooks/useFavorites';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Restaurant } from '@/hooks/useRestaurants';

interface RestaurantCardProps {
  restaurant: Restaurant;
}

const RestaurantCard = ({ restaurant }: RestaurantCardProps) => {
  const { user } = useAuth();
  const toggleFavorite = useToggleFavorite();
  const isFavorite = useIsFavorite(undefined, restaurant.id);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please sign in to save favorites');
      return;
    }
    
    try {
      const result = await toggleFavorite.mutateAsync({ restaurantId: restaurant.id });
      toast.success(result.action === 'added' ? 'Added to favorites!' : 'Removed from favorites');
    } catch (error) {
      toast.error('Failed to update favorites');
    }
  };

  const getPriceLevel = (level: number | null) => {
    if (!level) return null;
    return '$'.repeat(level);
  };

  return (
    <Card className="group overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-300">
      <div className="relative aspect-video overflow-hidden">
        {restaurant.image_url ? (
          <img
            src={restaurant.image_url}
            alt={restaurant.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-secondary/10 to-accent/10 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-secondary/40" />
          </div>
        )}
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
        {restaurant.cuisine && (
          <Badge className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm text-foreground">
            {restaurant.cuisine}
          </Badge>
        )}
      </div>
      
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-1">{restaurant.name}</CardTitle>
          <div className="flex items-center gap-2 shrink-0">
            {restaurant.rating && (
              <div className="flex items-center gap-1 text-sm">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{restaurant.rating}</span>
              </div>
            )}
            {restaurant.price_level && (
              <span className="text-sm text-muted-foreground font-medium">
                {getPriceLevel(restaurant.price_level)}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {restaurant.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {restaurant.description}
          </p>
        )}
        
        {restaurant.address && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
            <span className="line-clamp-1">{restaurant.address}</span>
          </div>
        )}
        
        <div className="flex flex-wrap gap-1.5">
          {restaurant.is_family_friendly && (
            <Badge variant="secondary" className="text-xs">
              <Users className="w-3 h-3 mr-1" />
              Family-Friendly
            </Badge>
          )}
          {restaurant.has_kids_menu && (
            <Badge variant="outline" className="text-xs">
              Kids Menu
            </Badge>
          )}
          {restaurant.is_vegetarian_friendly && (
            <Badge variant="outline" className="text-xs">
              <Leaf className="w-3 h-3 mr-1" />
              Vegetarian
            </Badge>
          )}
          {restaurant.is_vegan_friendly && (
            <Badge variant="outline" className="text-xs">
              <Leaf className="w-3 h-3 mr-1" />
              Vegan
            </Badge>
          )}
          {restaurant.is_halal && (
            <Badge variant="outline" className="text-xs">
              Halal
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2 pt-2">
          {restaurant.phone && (
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <a href={`tel:${restaurant.phone}`}>
                <Phone className="w-3 h-3 mr-2" />
                Call
              </a>
            </Button>
          )}
          {restaurant.website && (
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <a href={restaurant.website} target="_blank" rel="noopener noreferrer">
                <Globe className="w-3 h-3 mr-2" />
                Website
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RestaurantCard;
