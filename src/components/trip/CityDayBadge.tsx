import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CityDayBadgeProps {
  cityName: string;
  countryName?: string;
  legNumber: number;
  isFirstDayOfLeg?: boolean;
  isLastDayOfLeg?: boolean;
}

export const CityDayBadge = ({ 
  cityName, 
  countryName, 
  legNumber, 
  isFirstDayOfLeg,
  isLastDayOfLeg 
}: CityDayBadgeProps) => {
  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant="outline" 
        className="gap-1.5 px-2.5 py-1 bg-primary/5 border-primary/20 text-primary"
      >
        <MapPin className="w-3 h-3" />
        <span className="font-medium">{cityName}</span>
        {countryName && (
          <span className="text-primary/60">{countryName}</span>
        )}
      </Badge>
      {isFirstDayOfLeg && legNumber > 1 && (
        <Badge variant="secondary" className="text-xs">
          Leg {legNumber} starts
        </Badge>
      )}
      {isLastDayOfLeg && (
        <Badge variant="secondary" className="text-xs bg-muted/50">
          Last day here
        </Badge>
      )}
    </div>
  );
};
