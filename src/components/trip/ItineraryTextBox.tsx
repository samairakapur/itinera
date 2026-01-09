import { Card } from '@/components/ui/card';
import { Activity } from './ActivityCard';

export interface DayData {
  dayNumber: number;
  title: string;
  date?: string;
  weather?: {
    temp: number;
    condition: string;
  };
  morning: Activity[];
  afternoon: Activity[];
  evening: Activity[];
}

interface ItineraryTextBoxProps {
  days: DayData[];
}

export const ItineraryTextBox = ({ days }: ItineraryTextBoxProps) => {
  if (days.length === 0) return null;

  return (
    <Card className="border-0 shadow-card overflow-hidden">
      <div className="p-6">
        <h2 className="font-display text-xl font-bold text-foreground mb-4">
          Your Itinerary
        </h2>
        
        <div className="bg-muted/30 rounded-xl p-5 font-mono text-sm leading-relaxed whitespace-pre-wrap">
          {days.map((day, dayIndex) => {
            const totalActivities = day.morning.length + day.afternoon.length + day.evening.length;
            
            return (
              <div key={day.dayNumber} className={dayIndex > 0 ? "mt-6 pt-6 border-t border-border" : ""}>
                <div className="font-bold text-foreground text-base mb-3">
                  Day {day.dayNumber} — {day.title}
                  {day.date && <span className="font-normal text-muted-foreground ml-2">({day.date})</span>}
                </div>
                
                {day.morning.length > 0 && (
                  <div className="mb-3">
                    <div className="text-primary font-semibold mb-1">☀️ Morning</div>
                    {day.morning.map((activity, idx) => (
                      <div key={activity.id} className="pl-6 text-foreground">
                        • {activity.title}
                        {activity.description && (
                          <span className="text-muted-foreground"> — {activity.description}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {day.afternoon.length > 0 && (
                  <div className="mb-3">
                    <div className="text-primary font-semibold mb-1">🌤️ Afternoon</div>
                    {day.afternoon.map((activity, idx) => (
                      <div key={activity.id} className="pl-6 text-foreground">
                        • {activity.title}
                        {activity.description && (
                          <span className="text-muted-foreground"> — {activity.description}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {day.evening.length > 0 && (
                  <div className="mb-3">
                    <div className="text-primary font-semibold mb-1">🌙 Evening</div>
                    {day.evening.map((activity, idx) => (
                      <div key={activity.id} className="pl-6 text-foreground">
                        • {activity.title}
                        {activity.description && (
                          <span className="text-muted-foreground"> — {activity.description}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {totalActivities === 0 && (
                  <div className="text-muted-foreground italic pl-2">No activities planned</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
