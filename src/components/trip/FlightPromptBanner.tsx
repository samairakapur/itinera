import { Plane, ArrowRight, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FlightDetailsDialog } from './FlightDetailsDialog';

interface FlightPromptBannerProps {
  itineraryId: string;
  tripName?: string;
  hasFlights: boolean;
}

export const FlightPromptBanner = ({ itineraryId, tripName, hasFlights }: FlightPromptBannerProps) => {
  const [dismissed, setDismissed] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Don't show if already has flights or dismissed
  if (hasFlights || dismissed) return null;

  return (
    <>
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-background to-sky/5 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Plane className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-foreground mb-1">Add your flight details</h4>
              <p className="text-sm text-muted-foreground mb-3">
                We'll automatically adjust your schedule based on arrival and departure times — 
                no more rushing on travel days!
              </p>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  className="gap-2"
                  onClick={() => setDialogOpen(true)}
                >
                  <Plane className="w-4 h-4" />
                  Add Flights
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => setDismissed(true)}
                >
                  Maybe later
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setDismissed(true)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <FlightDetailsDialog
        itineraryId={itineraryId}
        tripName={tripName}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
};
