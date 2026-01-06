import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import type { City } from '@/hooks/useCities';

interface CityCardProps {
  city: City;
}

const CityCard = ({ city }: CityCardProps) => {
  const tags = city.tags?.slice(0, 3) || [];
  
  return (
    <Link to={`/city/${city.id}`}>
      <Card className="group overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-elegant">
        <div className="relative aspect-[4/3] overflow-hidden">
          {city.image_url ? (
            <img
              src={city.image_url}
              alt={city.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <MapPin className="w-12 h-12 text-primary/50" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-display text-xl font-bold text-white mb-1">
              {city.name}
            </h3>
            <div className="flex items-center gap-1 text-white/80 text-sm">
              <MapPin className="w-3 h-3" />
              {city.country}
            </div>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge 
                key={tag} 
                variant="secondary" 
                className="text-xs font-normal"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default CityCard;
