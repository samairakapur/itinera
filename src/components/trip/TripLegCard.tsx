import { MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';
import { DayCard, DayData } from './DayCard';
import { Activity } from './ActivityCard';

interface TripLegCardProps {
  legNumber: number;
  cityName: string;
  countryName: string;
  imageUrl?: string | null;
  days: DayData[];
  startDate?: Date;
  showCheckIn?: boolean;
  completedActivityIds?: Set<string>;
  onActivityRemove?: (dayNumber: number, activityId: string) => void;
  onActivityToggleMustDo?: (dayNumber: number, activityId: string) => void;
  onActivityEdit?: (dayNumber: number, activityId: string) => void;
  onAddActivity?: (dayNumber: number, timeSlot: 'morning' | 'afternoon' | 'evening') => void;
  onToggleActivityComplete?: (dayNumber: number, activityId: string) => void;
  onCarryOverActivities?: (fromDay: number, activityIds: string[]) => void;
}

export const TripLegCard = ({
  legNumber,
  cityName,
  countryName,
  imageUrl,
  days,
  startDate,
  showCheckIn,
  completedActivityIds,
  onActivityRemove,
  onActivityToggleMustDo,
  onActivityEdit,
  onAddActivity,
  onToggleActivityComplete,
  onCarryOverActivities,
}: TripLegCardProps) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="space-y-4">
      {/* Leg Header */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="overflow-hidden border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-primary/5 transition-colors py-4">
              <div className="flex items-center gap-4">
                {/* City Image */}
                <div className="relative h-16 w-16 rounded-lg overflow-hidden shrink-0">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={cityName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-primary/50" />
                    </div>
                  )}
                </div>
                
                {/* City Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs">
                      Leg {legNumber}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {days.length} {days.length === 1 ? 'day' : 'days'}
                    </span>
                  </div>
                  <CardTitle className="text-lg font-display">{cityName}</CardTitle>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {countryName}
                  </p>
                </div>

                {/* Expand/Collapse */}
                <Button variant="ghost" size="icon" className="shrink-0">
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              {days.map((day) => (
                <DayCard
                  key={`leg-${legNumber}-day-${day.dayNumber}`}
                  day={day}
                  cityName={cityName}
                  startDate={startDate}
                  showCheckIn={showCheckIn}
                  completedActivityIds={completedActivityIds}
                  onActivityRemove={onActivityRemove}
                  onActivityToggleMustDo={onActivityToggleMustDo}
                  onActivityEdit={onActivityEdit}
                  onAddActivity={onAddActivity}
                  onToggleActivityComplete={onToggleActivityComplete}
                  onCarryOverActivities={onCarryOverActivities}
                />
              ))}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};
