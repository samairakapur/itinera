import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import { getCityImage } from '@/lib/imageUtils';
import type { City } from '@/hooks/useCities';

interface CityCardProps {
  city: City;
}

const CityCard = ({ city }: CityCardProps) => {
  const tags = city.tags?.slice(0, 2) || [];
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const imageUrl = imageError || !city.image_url
    ? getCityImage(city.name, city.country)
    : city.image_url;

  return (
    <Link to={`/city/${city.id}`} className="group block">
      <div className="rounded-sm overflow-hidden bg-card border border-border shadow-card hover:shadow-glow hover:border-primary/30 hover:-translate-y-1 transition-all duration-300">

        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-muted flex items-center justify-center animate-pulse">
              <MapPin className="w-10 h-10 text-muted-foreground/25" />
            </div>
          )}
          <img
            src={imageUrl}
            alt={city.name}
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
          {/* Subtle warm gradient overlay at bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* City name on image */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-display text-2xl font-semibold tracking-wide text-white leading-snug">{city.name}</h3>
            <div className="flex items-center gap-1 text-white/75 text-xs mt-0.5">
              <MapPin className="w-3 h-3" />
              {city.country}
            </div>
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="px-4 py-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs font-normal border-white/15 text-white/50 bg-transparent capitalize"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
};

export default CityCard;
