import { useParams } from 'react-router-dom';
import { useCity } from '@/hooks/useCities';
import { usePersonalizedAttractions } from '@/hooks/usePersonalizedAttractions';
import { usePersonalizedRestaurants } from '@/hooks/usePersonalizedRestaurants';
import { useTransport } from '@/hooks/useTransport';
import { useNeighborhoods } from '@/hooks/useNeighborhoods';
import { useProfile } from '@/hooks/useProfile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import AttractionCard from '@/components/attractions/AttractionCard';
import RestaurantCard from '@/components/restaurants/RestaurantCard';
import CityAdvisor from '@/components/advisor/CityAdvisor';
import WeatherForecast from '@/components/weather/WeatherForecast';
import { 
  MapPin, 
  Info, 
  Cloud, 
  Bus, 
  Landmark, 
  UtensilsCrossed,
  Bot,
  Clock,
  DollarSign,
  Shield,
  Users,
  Plane,
  Car,
  Train,
  Sparkles
} from 'lucide-react';

const CityDetail = () => {
  const { cityId } = useParams<{ cityId: string }>();
  const { data: city, isLoading: cityLoading } = useCity(cityId);
  const { data: attractions, isLoading: attractionsLoading } = usePersonalizedAttractions(cityId);
  const { data: restaurants, isLoading: restaurantsLoading } = usePersonalizedRestaurants(cityId);
  const { data: transport, isLoading: transportLoading } = useTransport(cityId);
  const { data: neighborhoods, isLoading: neighborhoodsLoading } = useNeighborhoods(cityId);
  const { data: profile } = useProfile();

  if (cityLoading) {
    return (
      <div className="min-h-screen">
        <div className="h-64 md:h-80 bg-muted animate-pulse" />
        <div className="container px-4 py-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>
    );
  }

  if (!city) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="font-display text-xl font-semibold mb-2">City not found</h2>
          <p className="text-muted-foreground">The city you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const airportOptions = transport?.airport_transfer_options as Array<{ method: string; duration: string; cost: string }> || [];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        {city.hero_image_url || city.image_url ? (
          <img
            src={city.hero_image_url || city.image_url || ''}
            alt={city.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="container">
            <div className="flex items-center gap-2 text-white/80 text-sm mb-2">
              <MapPin className="w-4 h-4" />
              {city.country}
            </div>
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3">
              {city.name}
            </h1>
            {city.tags && city.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {city.tags.slice(0, 5).map((tag) => (
                  <Badge key={tag} variant="secondary" className="bg-white/20 text-white border-0">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="w-full flex-wrap h-auto gap-2 bg-muted/50 p-2">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="weather" className="flex items-center gap-2">
              <Cloud className="w-4 h-4" />
              <span className="hidden sm:inline">Weather</span>
            </TabsTrigger>
            <TabsTrigger value="transport" className="flex items-center gap-2">
              <Bus className="w-4 h-4" />
              <span className="hidden sm:inline">Getting Around</span>
            </TabsTrigger>
            <TabsTrigger value="attractions" className="flex items-center gap-2">
              <Landmark className="w-4 h-4" />
              <span className="hidden sm:inline">Attractions</span>
            </TabsTrigger>
            <TabsTrigger value="restaurants" className="flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4" />
              <span className="hidden sm:inline">Restaurants</span>
            </TabsTrigger>
            <TabsTrigger value="advisor" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">AI Advisor</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {city.description && (
                  <Card>
                    <CardHeader>
                      <CardTitle>About {city.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">{city.description}</p>
                    </CardContent>
                  </Card>
                )}

                {city.family_tips && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        Family Travel Tips
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">{city.family_tips}</p>
                    </CardContent>
                  </Card>
                )}

                {neighborhoods && neighborhoods.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Neighborhoods</CardTitle>
                      <CardDescription>Best areas for families to explore</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {neighborhoods.map((neighborhood) => (
                          <div key={neighborhood.id} className="p-4 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{neighborhood.name}</h4>
                              {neighborhood.is_family_friendly && (
                                <Badge variant="secondary" className="text-xs">Family-Friendly</Badge>
                              )}
                            </div>
                            {neighborhood.description && (
                              <p className="text-sm text-muted-foreground">{neighborhood.description}</p>
                            )}
                            {neighborhood.highlight && (
                              <p className="text-sm text-primary mt-2">✨ {neighborhood.highlight}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Quick Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {city.currency && (
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Currency</p>
                          <p className="text-sm text-muted-foreground">{city.currency}</p>
                        </div>
                      </div>
                    )}
                    {city.language && (
                      <div className="flex items-center gap-3">
                        <Info className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Language</p>
                          <p className="text-sm text-muted-foreground">{city.language}</p>
                        </div>
                      </div>
                    )}
                    {city.timezone && (
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Timezone</p>
                          <p className="text-sm text-muted-foreground">{city.timezone}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {city.best_time_to_visit && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Cloud className="w-4 h-4" />
                        Best Time to Visit
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{city.best_time_to_visit}</p>
                    </CardContent>
                  </Card>
                )}

                {city.safety_notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Safety Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{city.safety_notes}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Weather Tab */}
          <TabsContent value="weather">
            <WeatherForecast cityName={city.name} country={city.country} />
          </TabsContent>

          {/* Transport Tab */}
          <TabsContent value="transport" className="space-y-6">
            {transportLoading ? (
              <Card>
                <CardContent className="p-8">
                  <Skeleton className="h-4 w-full mb-4" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ) : transport ? (
              <>
                {transport.public_transport_overview && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bus className="w-5 h-5 text-primary" />
                        Public Transport Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{transport.public_transport_overview}</p>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {transport.metro_info && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Train className="w-4 h-4" />
                          Metro/Subway
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{transport.metro_info}</p>
                      </CardContent>
                    </Card>
                  )}

                  {transport.bus_info && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Bus className="w-4 h-4" />
                          Bus System
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{transport.bus_info}</p>
                      </CardContent>
                    </Card>
                  )}

                  {transport.ticket_options && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Ticket Options
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{transport.ticket_options}</p>
                      </CardContent>
                    </Card>
                  )}

                  {transport.family_pass_info && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Family Passes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{transport.family_pass_info}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {airportOptions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Plane className="w-5 h-5" />
                        Airport Transfers
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {airportOptions.map((option, index) => (
                          <div key={index} className="p-4 rounded-lg bg-muted/50">
                            <p className="font-medium">{option.method}</p>
                            <p className="text-sm text-muted-foreground">{option.duration}</p>
                            <p className="text-sm text-primary font-medium">{option.cost}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {(transport.car_rental_daily_cost || transport.parking_notes) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Car className="w-5 h-5" />
                        Driving
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {transport.car_rental_daily_cost && (
                        <div>
                          <p className="font-medium text-sm">Car Rental</p>
                          <p className="text-sm text-muted-foreground">{transport.car_rental_daily_cost}</p>
                        </div>
                      )}
                      {transport.parking_notes && (
                        <div>
                          <p className="font-medium text-sm">Parking</p>
                          <p className="text-sm text-muted-foreground">{transport.parking_notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bus className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Transport information not available for this city.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Attractions Tab */}
          <TabsContent value="attractions" className="space-y-4">
            {profile?.travel_preferences && (
              <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 px-4 py-2 rounded-lg">
                <Sparkles className="w-4 h-4" />
                <span>Personalized recommendations based on your preferences</span>
              </div>
            )}
            {attractionsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="overflow-hidden animate-pulse">
                    <div className="aspect-video bg-muted" />
                    <CardContent className="p-4">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : attractions && attractions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {attractions.map((attraction, index) => (
                  <div key={attraction.id} className="relative">
                    {index < 3 && profile?.travel_preferences && (
                      <Badge className="absolute -top-2 -right-2 z-10 bg-primary text-primary-foreground">
                        Top Pick
                      </Badge>
                    )}
                    <AttractionCard attraction={attraction} />
                  </div>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Landmark className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No attractions found for this city.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Restaurants Tab */}
          <TabsContent value="restaurants" className="space-y-4">
            {profile?.travel_preferences && (
              <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 px-4 py-2 rounded-lg">
                <Sparkles className="w-4 h-4" />
                <span>Personalized recommendations based on your cuisine preferences</span>
              </div>
            )}
            {restaurantsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="overflow-hidden animate-pulse">
                    <div className="aspect-video bg-muted" />
                    <CardContent className="p-4">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : restaurants && restaurants.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {restaurants.map((restaurant, index) => (
                  <div key={restaurant.id} className="relative">
                    {index < 3 && profile?.travel_preferences && (
                      <Badge className="absolute -top-2 -right-2 z-10 bg-primary text-primary-foreground">
                        Top Pick
                      </Badge>
                    )}
                    <RestaurantCard restaurant={restaurant} />
                  </div>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No restaurants found for this city.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* AI Advisor Tab */}
          <TabsContent value="advisor">
            <CityAdvisor city={city} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CityDetail;
