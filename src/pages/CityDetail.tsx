import { useParams } from 'react-router-dom';
import { useCity } from '@/hooks/useCities';
import { usePersonalizedAttractions } from '@/hooks/usePersonalizedAttractions';
import { usePersonalizedRestaurants } from '@/hooks/usePersonalizedRestaurants';
import { useTransport } from '@/hooks/useTransport';
import { useProfile } from '@/hooks/useProfile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import AttractionCard from '@/components/attractions/AttractionCard';
import RestaurantCard from '@/components/restaurants/RestaurantCard';
import CityAdvisor from '@/components/advisor/CityAdvisor';
import WeatherForecast from '@/components/weather/WeatherForecast';
import MonthlyClimateSummary from '@/components/weather/MonthlyClimateSummary';
import PersonalizedTransportRecommendation from '@/components/transport/PersonalizedTransportRecommendation';
import PersonalizedInsiderTips from '@/components/overview/PersonalizedInsiderTips';
import { CommunityTipsDialog } from '@/components/community/CommunityTipsDialog';
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
  Plane,
  Car,
  Train,
  Sparkles,
  Users
} from 'lucide-react';

const CityDetail = () => {
  const { cityId } = useParams<{ cityId: string }>();
  const { data: city, isLoading: cityLoading } = useCity(cityId);
  const { data: attractions, isLoading: attractionsLoading } = usePersonalizedAttractions(cityId);
  const { data: restaurants, isLoading: restaurantsLoading } = usePersonalizedRestaurants(cityId);
  const { data: transport, isLoading: transportLoading } = useTransport(cityId);
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

  // Parse content into bullet points
  const parseIntoBullets = (text: string): string[] => {
    // Split by common separators: periods followed by space/capital, semicolons, or existing bullets
    const parts = text
      .split(/(?<=[.!?])\s+(?=[A-Z])|;\s*|•\s*/)
      .map(s => s.trim())
      .filter(s => s.length > 10);
    return parts.length > 0 ? parts : [text];
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative h-72 md:h-[50vh] overflow-hidden">
        {city.hero_image_url || city.image_url ? (
          <img
            src={city.hero_image_url || city.image_url || ''}
            alt={city.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
          <div className="container">
            <div className="flex items-center gap-2 text-white/80 text-sm mb-2">
              <MapPin className="w-4 h-4" />
              {city.country}
            </div>
            <h1 className="font-display text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-3">
              {city.name}
            </h1>
            {city.tags && city.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {city.tags.slice(0, 5).map((tag) => (
                  <Badge key={tag} variant="secondary" className="bg-white/20 text-white border-0 text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container px-4 py-6 md:py-8">
        <Tabs defaultValue="overview" className="space-y-6 md:space-y-8">
          {/* Mobile-friendly tabs with icons AND text */}
          <TabsList className="w-full grid grid-cols-3 md:grid-cols-6 h-auto gap-1 bg-muted/30 p-1 border border-white/5">
            <TabsTrigger value="overview" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-2 px-2 text-xs md:text-sm">
              <Info className="w-4 h-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="weather" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-2 px-2 text-xs md:text-sm">
              <Cloud className="w-4 h-4" />
              <span>Weather</span>
            </TabsTrigger>
            <TabsTrigger value="transport" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-2 px-2 text-xs md:text-sm">
              <Bus className="w-4 h-4" />
              <span className="hidden xs:inline">Getting Around</span>
              <span className="xs:hidden">Transport</span>
            </TabsTrigger>
            <TabsTrigger value="attractions" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-2 px-2 text-xs md:text-sm">
              <Landmark className="w-4 h-4" />
              <span>Attractions</span>
            </TabsTrigger>
            <TabsTrigger value="restaurants" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-2 px-2 text-xs md:text-sm">
              <UtensilsCrossed className="w-4 h-4" />
              <span>Restaurants</span>
            </TabsTrigger>
            <TabsTrigger value="advisor" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-2 px-2 text-xs md:text-sm">
              <Bot className="w-4 h-4" />
              <span className="hidden xs:inline">AI Advisor</span>
              <span className="xs:hidden">Advisor</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab - Restructured */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="lg:col-span-2 space-y-4 md:space-y-6">
                {/* About Section */}
                {city.description && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">About {city.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                        {city.description}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Personalized Insider Tips */}
                <PersonalizedInsiderTips 
                  city={city} 
                  preferences={profile?.travel_preferences} 
                />
              </div>

              <div className="space-y-4">
                {/* Quick Info - Bullet format */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Quick Info</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {city.currency && (
                        <li className="flex items-start gap-3">
                          <DollarSign className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <span className="font-medium">Currency:</span>{' '}
                            <span className="text-muted-foreground">{city.currency}</span>
                          </div>
                        </li>
                      )}
                      {city.language && (
                        <li className="flex items-start gap-3">
                          <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <span className="font-medium">Language:</span>{' '}
                            <span className="text-muted-foreground">{city.language}</span>
                          </div>
                        </li>
                      )}
                      {city.timezone && (
                        <li className="flex items-start gap-3">
                          <Clock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <span className="font-medium">Timezone:</span>{' '}
                            <span className="text-muted-foreground">{city.timezone}</span>
                          </div>
                        </li>
                      )}
                    </ul>
                  </CardContent>
                </Card>

                {/* Best Time to Visit - Bullet format */}
                {city.best_time_to_visit && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Cloud className="w-4 h-4 text-primary" />
                        Best Time to Visit
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {parseIntoBullets(city.best_time_to_visit).map((point, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <span className="text-primary font-bold mt-0.5">•</span>
                            <span className="text-muted-foreground">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Safety Notes - Bullet format */}
                {city.safety_notes && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        Safety Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {parseIntoBullets(city.safety_notes).map((point, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <span className="text-primary font-bold mt-0.5">•</span>
                            <span className="text-muted-foreground">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Weather Tab - Enhanced with Monthly Climate */}
          <TabsContent value="weather" className="space-y-6">
            <WeatherForecast cityName={city.name} country={city.country} />
            <MonthlyClimateSummary cityName={city.name} />
          </TabsContent>

          {/* Transport Tab */}
          <TabsContent value="transport" className="space-y-4 md:space-y-6">
            {/* Personalized Transport Recommendation */}
            <PersonalizedTransportRecommendation 
              transport={transport}
              preferences={profile?.travel_preferences}
              cityName={city.name}
            />

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
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                        <Bus className="w-5 h-5 text-primary" />
                        Public Transport Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm md:text-base">{transport.public_transport_overview}</p>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {transport.metro_info && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Train className="w-4 h-4 text-primary" />
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
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Bus className="w-4 h-4 text-primary" />
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
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-primary" />
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
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-primary" />
                          Group & Multi-Day Passes
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
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                        <Plane className="w-5 h-5 text-primary" />
                        Airport Transfers
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                        {airportOptions.map((option, index) => (
                          <div key={index} className="p-3 md:p-4 rounded-lg bg-muted/50">
                            <p className="font-medium text-sm md:text-base">{option.method}</p>
                            <p className="text-xs md:text-sm text-muted-foreground">{option.duration}</p>
                            <p className="text-xs md:text-sm text-primary font-medium">{option.cost}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {(transport.car_rental_daily_cost || transport.parking_notes) && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                        <Car className="w-5 h-5 text-primary" />
                        Driving
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 md:space-y-4">
                      {transport.car_rental_daily_cost && (
                        <div>
                          <p className="font-medium text-sm">Car Rental</p>
                          <p className="text-xs md:text-sm text-muted-foreground">{transport.car_rental_daily_cost}</p>
                        </div>
                      )}
                      {transport.parking_notes && (
                        <div>
                          <p className="font-medium text-sm">Parking</p>
                          <p className="text-xs md:text-sm text-muted-foreground">{transport.parking_notes}</p>
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {profile?.travel_preferences && (
                <div className="flex items-center gap-2 text-xs md:text-sm text-primary bg-primary/10 px-3 md:px-4 py-2 rounded-lg">
                  <Sparkles className="w-4 h-4 flex-shrink-0" />
                  <span>Personalized recommendations based on your preferences</span>
                </div>
              )}
              <CommunityTipsDialog
                cityId={city.id}
                cityName={city.name}
                category="attraction"
              />
            </div>
            {attractionsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {attractions.map((attraction, index) => (
                  <div key={attraction.id} className="relative">
                    {index < 3 && profile?.travel_preferences && (
                      <Badge className="absolute -top-2 -right-2 z-10 bg-primary text-primary-foreground text-xs">
                        Top Pick
                      </Badge>
                    )}
                    <AttractionCard attraction={attraction} cityName={city.name} />
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {profile?.travel_preferences && (
                <div className="flex items-center gap-2 text-xs md:text-sm text-primary bg-primary/10 px-3 md:px-4 py-2 rounded-lg">
                  <Sparkles className="w-4 h-4 flex-shrink-0" />
                  <span>Personalized recommendations based on your cuisine preferences</span>
                </div>
              )}
              <CommunityTipsDialog
                cityId={city.id}
                cityName={city.name}
                category="restaurant"
              />
            </div>
            {restaurantsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {restaurants.map((restaurant, index) => (
                  <div key={restaurant.id} className="relative">
                    {index < 3 && profile?.travel_preferences && (
                      <Badge className="absolute -top-2 -right-2 z-10 bg-primary text-primary-foreground text-xs">
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
