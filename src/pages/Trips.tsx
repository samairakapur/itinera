import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useItineraries, useDeleteItinerary } from '@/hooks/useItineraries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SavedTripCard } from '@/components/trip/SavedTripCard';
import { 
  Calendar, 
  Plus,
  Sparkles,
  History,
  Plane
} from 'lucide-react';

const Trips = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: itineraries, isLoading: itinerariesLoading } = useItineraries();
  const deleteItinerary = useDeleteItinerary();
  const [activeTab, setActiveTab] = useState('upcoming');

  // Separate trips into upcoming/current and past
  const { upcomingTrips, pastTrips } = useMemo(() => {
    if (!itineraries) return { upcomingTrips: [], pastTrips: [] };

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const upcoming: typeof itineraries = [];
    const past: typeof itineraries = [];

    itineraries.forEach(trip => {
      const endDate = trip.end_date ? new Date(trip.end_date) : null;
      
      if (endDate && endDate < now) {
        past.push(trip);
      } else {
        upcoming.push(trip);
      }
    });

    // Sort upcoming by start date ascending
    upcoming.sort((a, b) => {
      const dateA = a.start_date ? new Date(a.start_date).getTime() : Infinity;
      const dateB = b.start_date ? new Date(b.start_date).getTime() : Infinity;
      return dateA - dateB;
    });

    // Sort past by end date descending (most recent first)
    past.sort((a, b) => {
      const dateA = a.end_date ? new Date(a.end_date).getTime() : 0;
      const dateB = b.end_date ? new Date(b.end_date).getTime() : 0;
      return dateB - dateA;
    });

    return { upcomingTrips: upcoming, pastTrips: past };
  }, [itineraries]);

  if (!user) {
    return (
      <div className="min-h-screen py-8">
        <div className="container px-4">
          <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>Sign in to View Your Trips</CardTitle>
              <CardDescription>
                Plan trips and save your favorite places for easy access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => navigate('/auth')}>
                Sign In to Continue
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const renderTripGrid = (trips: typeof itineraries) => {
    if (!trips || trips.length === 0) {
      return (
        <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-2">
              {activeTab === 'upcoming' ? 'No Upcoming Trips' : 'No Past Trips'}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {activeTab === 'upcoming' 
                ? 'Start planning your next adventure with our AI-powered trip planner.'
                : 'Your completed trips will appear here for future reference.'}
            </p>
            {activeTab === 'upcoming' && (
              <Button size="lg" onClick={() => navigate('/planner/new')} className="gap-2">
                <Plus className="w-5 h-5" />
                Plan a Trip
              </Button>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips.map((trip) => (
          <SavedTripCard
            key={trip.id}
            trip={trip}
            onDelete={(id) => deleteItinerary.mutate(id)}
            isDeleting={deleteItinerary.isPending}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">My Trips</h1>
            <p className="text-muted-foreground">Your personalized travel itineraries</p>
          </div>
          <Button size="lg" onClick={() => navigate('/planner/new')} className="gap-2 shadow-lg">
            <Plus className="w-5 h-5" />
            Plan New Trip
          </Button>
        </div>

        {itinerariesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <div className="h-32 bg-muted" />
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
              <TabsTrigger value="upcoming" className="gap-2">
                <Plane className="w-4 h-4" />
                Upcoming
                {upcomingTrips.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                    {upcomingTrips.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="past" className="gap-2">
                <History className="w-4 h-4" />
                Past Trips
                {pastTrips.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-muted">
                    {pastTrips.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="mt-0">
              {renderTripGrid(upcomingTrips)}
            </TabsContent>

            <TabsContent value="past" className="mt-0">
              {renderTripGrid(pastTrips)}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Trips;
