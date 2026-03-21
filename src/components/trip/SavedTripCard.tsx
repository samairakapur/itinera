import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, Trash2, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { SavedItinerary } from '@/hooks/useItineraries';

interface SavedTripCardProps {
  trip: SavedItinerary;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export const SavedTripCard = ({ trip, onDelete, isDeleting }: SavedTripCardProps) => {
  const navigate = useNavigate();

  const startDate = trip.start_date ? new Date(trip.start_date) : null;
  const endDate = trip.end_date ? new Date(trip.end_date) : null;

  const isUpcoming = startDate && startDate > new Date();
  const isOngoing = startDate && endDate && startDate <= new Date() && endDate >= new Date();

  return (
    <Card className="overflow-hidden hover:shadow-glow transition-all duration-300 group border-white/5 hover:border-primary/20">
      <div className="relative h-32 overflow-hidden">
        {trip.cities?.image_url ? (
          <img
            src={trip.cities.image_url}
            alt={trip.cities.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          {isOngoing ? (
            <Badge className="bg-primary/90 text-primary-foreground text-xs uppercase tracking-widest">Ongoing</Badge>
          ) : isUpcoming ? (
            <Badge variant="outline" className="border-primary/30 text-primary/80 text-xs uppercase tracking-widest bg-black/50">Upcoming</Badge>
          ) : (
            <Badge variant="outline" className="border-white/20 text-white/60 text-xs uppercase tracking-widest bg-black/50">Past</Badge>
          )}
        </div>

        {/* City Name */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="font-display text-lg font-bold text-white drop-shadow-lg">
            {trip.cities?.name || 'Unknown City'}
          </h3>
          {trip.cities?.country && (
            <p className="text-white/80 text-sm flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {trip.cities.country}
            </p>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {startDate && endDate && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {format(startDate, "MMM d")} – {format(endDate, "MMM d, yyyy")}
              </span>
            )}
          </div>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            {trip.num_days} days
          </span>
        </div>

        {/* Trip Name */}
        <p className="text-sm font-medium text-foreground mb-4 line-clamp-1">
          {trip.name}
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="default"
            className="flex-1"
            onClick={() => navigate(`/trips/${trip.id}`)}
          >
            View Trip
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon" disabled={isDeleting}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this trip?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your trip to {trip.cities?.name}. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(trip.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};
