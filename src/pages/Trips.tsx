import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/useFavorites';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import AttractionCard from '@/components/attractions/AttractionCard';
import RestaurantCard from '@/components/restaurants/RestaurantCard';
import { 
  Heart, 
  Landmark, 
  UtensilsCrossed, 
  Calendar, 
  Plus,
  MapPin,
  Sparkles
} from 'lucide-react';

const Trips = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: favorites, isLoading } = useFavorites();

  const savedAttractions = favorites?.filter(f => f.attractions) || [];
  const savedRestaurants = favorites?.filter(f => f.restaurants) || [];

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

  return (
    <div className="min-h-screen py-8">
      <div className="container px-4">
        {/* Header with New Trip Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              My Trips
            </h1>
            <p className="text-muted-foreground">
              Plan new adventures and manage your saved places
            </p>
          </div>
          <Button 
            size="lg" 
            onClick={() => navigate('/planner/new')}
            className="gap-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Plan New Trip
          </Button>
        </div>

        <Tabs defaultValue="itineraries" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="itineraries" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Itineraries</span>
              <span className="sm:hidden">Trips</span>
            </TabsTrigger>
            <TabsTrigger value="attractions" className="flex items-center gap-2">
              <Landmark className="w-4 h-4" />
              <span className="hidden sm:inline">Attractions</span>
              <span className="sm:hidden">Places</span>
              {savedAttractions.length > 0 && (
                <span className="ml-1 text-xs bg-primary/10 px-2 py-0.5 rounded-full">
                  {savedAttractions.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="restaurants" className="flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4" />
              <span className="hidden sm:inline">Restaurants</span>
              <span className="sm:hidden">Food</span>
              {savedRestaurants.length > 0 && (
                <span className="ml-1 text-xs bg-primary/10 px-2 py-0.5 rounded-full">
                  {savedRestaurants.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Itineraries Tab */}
          <TabsContent value="itineraries">
            <div className="grid gap-6">
              {/* Empty State with prominent CTA */}
              <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
                <CardContent className="p-8 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-2">
                    Create Your First Itinerary
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Our AI creates personalized travel plans based on your preferences, 
                    with real-time weather data and local insights.
                  </p>
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/planner/new')}
                    className="gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Plan a Trip
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Attractions Tab */}
          <TabsContent value="attractions">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="overflow-hidden animate-pulse">
                    <div className="aspect-video bg-muted" />
                    <CardContent className="p-4">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : savedAttractions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedAttractions.map((fav) => (
                  fav.attractions && (
                    <AttractionCard key={fav.id} attraction={fav.attractions as any} />
                  )
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <Landmark className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2">No saved attractions yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Explore cities and save attractions you want to visit!
                  </p>
                  <Button variant="outline" onClick={() => navigate('/destinations')}>
                    <MapPin className="w-4 h-4 mr-2" />
                    Explore Destinations
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Restaurants Tab */}
          <TabsContent value="restaurants">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="overflow-hidden animate-pulse">
                    <div className="aspect-video bg-muted" />
                    <CardContent className="p-4">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : savedRestaurants.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedRestaurants.map((fav) => (
                  fav.restaurants && (
                    <RestaurantCard key={fav.id} restaurant={fav.restaurants as any} />
                  )
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <UtensilsCrossed className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2">No saved restaurants yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Discover family-friendly restaurants in your favorite cities!
                  </p>
                  <Button variant="outline" onClick={() => navigate('/destinations')}>
                    <MapPin className="w-4 h-4 mr-2" />
                    Explore Destinations
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Trips;
