import { Card, CardContent } from '@/components/ui/card';
import { Plane } from 'lucide-react';
import { format } from 'date-fns';
import { FlightDetail } from '@/hooks/useFlightDetails';

interface FlightCardProps {
  flight: FlightDetail;
  type: 'departure' | 'arrival';
}

export const FlightCard = ({ flight, type }: FlightCardProps) => {
  const isDeparture = type === 'departure';
  const date = isDeparture ? flight.departure_date : flight.arrival_date;
  const time = isDeparture ? flight.departure_time : flight.arrival_time;
  const city = isDeparture ? flight.departure_city : flight.arrival_city;
  const otherCity = isDeparture ? flight.arrival_city : flight.departure_city;

  return (
    <Card className="border-dashed border-primary/30 bg-primary/5">
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Plane className={`w-5 h-5 text-primary ${isDeparture ? '' : 'rotate-90'}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {isDeparture ? 'Depart' : 'Arrive'} {city}
              </span>
              {flight.airline && flight.flight_number && (
                <span className="text-xs text-muted-foreground">
                  • {flight.airline} {flight.flight_number}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {time && <span>{time.slice(0, 5)}</span>}
              <span>•</span>
              <span className="flex items-center gap-1">
                {isDeparture ? 'To' : 'From'} {otherCity}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
