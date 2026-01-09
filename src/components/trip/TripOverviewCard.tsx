import { MapPin, Calendar, Users, DollarSign, Zap, Cloud, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TripOverviewCardProps {
  cityName: string;
  countryName: string;
  numDays: number;
  travelStyle: string;
  pace: string;
  budgetLevel: string;
  summary?: string;
  weatherSummary?: {
    temp: number;
    condition: string;
  };
}

const travelStyleLabels: Record<string, string> = {
  family: 'Family with Kids',
  adventure: 'Adventure Seekers',
  culture: 'Culture & History',
  food: 'Food & Culinary',
  relaxed: 'Relaxed & Easy-going',
};

const paceLabels: Record<string, string> = {
  light: 'Relaxed Pace',
  medium: 'Balanced Pace',
  full: 'Action-Packed',
};

const budgetLabels: Record<string, string> = {
  budget: 'Budget-Friendly',
  moderate: 'Moderate',
  upscale: 'Upscale',
  luxury: 'Luxury',
};

const weatherIcons: Record<string, string> = {
  sunny: '☀️',
  cloudy: '☁️',
  rainy: '🌧️',
  partlyCloudy: '⛅',
  stormy: '⛈️',
};

export const TripOverviewCard = ({
  cityName,
  countryName,
  numDays,
  travelStyle,
  pace,
  budgetLevel,
  summary,
  weatherSummary,
}: TripOverviewCardProps) => {
  return (
    <Card className="overflow-hidden border-0 shadow-card bg-gradient-to-br from-card to-muted/30">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="font-display text-2xl font-bold text-foreground mb-1">
                {cityName} Adventure
              </h2>
              <p className="text-muted-foreground flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {cityName}, {countryName}
              </p>
            </div>
            {weatherSummary && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-sky/10 text-sky-dark">
                <span className="text-xl">{weatherIcons[weatherSummary.condition] || '🌤️'}</span>
                <span className="font-semibold">{weatherSummary.temp}°C</span>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1.5 px-3 py-1">
              <Calendar className="w-3.5 h-3.5" />
              {numDays} {numDays === 1 ? 'Day' : 'Days'}
            </Badge>
            <Badge variant="secondary" className="gap-1.5 px-3 py-1">
              <Users className="w-3.5 h-3.5" />
              {travelStyleLabels[travelStyle] || travelStyle}
            </Badge>
            <Badge variant="secondary" className="gap-1.5 px-3 py-1">
              <Zap className="w-3.5 h-3.5" />
              {paceLabels[pace] || pace}
            </Badge>
            <Badge variant="secondary" className="gap-1.5 px-3 py-1">
              <DollarSign className="w-3.5 h-3.5" />
              {budgetLabels[budgetLevel] || budgetLevel}
            </Badge>
          </div>

          {/* Summary */}
          {summary && (
            <div className="flex gap-2 p-4 rounded-xl bg-primary/5 border border-primary/10">
              <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-foreground leading-relaxed">{summary}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
