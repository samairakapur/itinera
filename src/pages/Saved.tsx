import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/useFavorites';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import AttractionCard from '@/components/attractions/AttractionCard';
import RestaurantCard from '@/components/restaurants/RestaurantCard';
import { Heart, Landmark, UtensilsCrossed, Calendar } from 'lucide-react';

const Saved = () => {
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
                <Heart className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>Sign in to View Saved Items</CardTitle>
              <CardDescription>
                Save your favorite attractions and restaurants for easy access
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            My Saved Items
          </h1>
          <p className="text-muted-foreground">
            Your favorite attractions, restaurants, and trip plans
          </p>
        </div>

        <Tabs defaultValue="attractions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="attractions" className="flex items-center gap-2">
              <Landmark className="w-4 h-4" />
              Attractions
              {savedAttractions.length > 0 && (
                <span className="ml-1 text-xs bg-primary/10 px-2 py-0.5 rounded-full">
                  {savedAttractions.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="restaurants" className="flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4" />
              Restaurants
              {savedRestaurants.length > 0 && (
                <span className="ml-1 text-xs bg-primary/10 px-2 py-0.5 rounded-full">
                  {savedRestaurants.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="itineraries" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Itineraries
            </TabsTrigger>
          </TabsList>

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
                    Explore Destinations
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Itineraries Tab */}
          <TabsContent value="itineraries">
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">No itineraries yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first AI-powered travel itinerary!
                </p>
                <Button onClick={() => navigate('/planner')}>
                  Create Itinerary
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Saved;
