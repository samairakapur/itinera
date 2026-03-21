import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import { getCityImage } from '@/lib/imageUtils';
import type { City } from '@/hooks/useCities';

interface CityCardProps {
  city: City;
}

const CityCard = ({ city }: CityCardProps) => {
  const tags = city.tags?.slice(0, 3) || [];
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const imageUrl = imageError || !city.image_url
    ? getCityImage(city.name, city.country)
    : city.image_url;

  return (
    <Link to={`/city/${city.id}`}>
      <Card className="group overflow-hidden border-white/5 hover:border-primary/30 transition-all duration-500 hover:shadow-glow bg-card">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {/* Placeholder while loading */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-muted flex items-center justify-center animate-pulse">
              <MapPin className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}
          <img
            src={imageUrl}
            alt={city.name}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
              setImageLoaded(true);
            }}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-display text-2xl font-semibold text-white mb-1 tracking-wide">
              {city.name}
            </h3>
            <div className="flex items-center gap-1 text-white/70 text-sm">
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
                variant="outline"
                className="text-xs font-normal border-white/15 text-white/50 bg-transparent"
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
