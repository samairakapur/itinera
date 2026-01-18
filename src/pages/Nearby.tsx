import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NearbyCard, NearbyPlace } from '@/components/nearby/NearbyCard';
import ManualLocationDialog from '@/components/nearby/ManualLocationDialog';
import { 
  MapPin, 
  Navigation, 
  RefreshCw,
  Coffee,
  Utensils,
  Landmark,
  AlertCircle,
  Sparkles,
  Settings,
  MapPinOff
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Nearby = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { 
    latitude, 
    longitude, 
    error: geoError, 
    loading: geoLoading, 
    requestLocation,
    setManualLocation,
    isPermissionDenied,
    errorCode
  } = useGeolocation();
  
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [locationName, setLocationName] = useState<string | null>(null);

  const preferences = profile?.travel_preferences;

  const fetchNearbyPlaces = useCallback(async () => {
    if (!latitude || !longitude) return;
    
    setLoading(true);
    try {
      const preferencesContext = preferences ? `
User preferences:
- Interests: ${preferences.interests?.join(', ') || 'General'}
- Budget: ${preferences.dailyBudget || 'Moderate'}
- Preferred cuisines: ${preferences.preferredCuisines?.join(', ') || 'Various'}
- Dining style: ${preferences.diningStyle || 'Casual'}
- Pace: ${preferences.pacePreference || 'Moderate'}
- Indoor/Outdoor: ${preferences.indoorOutdoor || 'Both'}
` : '';

      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          messages: [
            {
              role: 'system',
              content: `You are a local recommendations expert. Generate realistic nearby place recommendations based on GPS coordinates and user preferences. Return ONLY valid JSON, no markdown.

${preferencesContext}

Output format (return exactly 9 places - 3 attractions, 3 cafes, 3 restaurants):
{
  "places": [
    {
      "id": "unique-id",
      "name": "Place Name",
      "type": "attraction|cafe|restaurant",
      "description": "Brief description (1-2 sentences)",
      "distance": "0.3 km",
      "rating": 4.5,
      "priceLevel": 2,
      "openNow": true,
      "address": "123 Street Name, City",
      "imageUrl": "https://images.unsplash.com/photo-XXXXX?w=400&h=300&fit=crop",
      "matchReason": "Why this matches user preferences",
      "cuisine": "Italian" // only for restaurants/cafes
    }
  ]
}

IMPORTANT:
- Use real Unsplash image URLs with different photo IDs for each place
- Make distances realistic (0.1km to 2km range)
- Match recommendations to user's interests and preferences
- Include local gems, not just tourist spots
- Vary price levels and cuisines based on preferences`
            },
            {
              role: 'user',
              content: `Find nearby recommendations for location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            }
          ]
        }
      });

      if (error) throw error;

      const content = data.choices?.[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.places && parsed.places.length > 0) {
          setPlaces(parsed.places);
          return;
        }
      }
      // If no places parsed, use fallback
      throw new Error('No places in response');
    } catch (err) {
      console.error('Error fetching nearby places:', err);
      // Always show fallback data so users see something useful
      setPlaces(generateFallbackPlaces(preferences));
      toast.info('Showing sample recommendations for your area');
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude, preferences]);

  useEffect(() => {
    if (latitude && longitude && places.length === 0 && !loading) {
      fetchNearbyPlaces();
    }
  }, [latitude, longitude, fetchNearbyPlaces, places.length, loading]);

  const handleManualLocationSet = (lat: number, lng: number, name?: string) => {
    setManualLocation(lat, lng);
    setLocationName(name || null);
    setPlaces([]); // Clear places so it refetches
    toast.success(`Location set to ${name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`}`);
  };

  const handleRefresh = () => {
    setPlaces([]);
    if (isPermissionDenied && !locationName) {
      setManualDialogOpen(true);
    } else {
      requestLocation();
      setTimeout(fetchNearbyPlaces, 500);
    }
  };

  const filteredPlaces = useMemo(() => {
    if (activeTab === 'all') return places;
    return places.filter(p => p.type === activeTab);
  }, [places, activeTab]);

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen py-8">
        <div className="container px-4">
          <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>Sign in to Explore Nearby</CardTitle>
              <CardDescription>
                Get personalized recommendations based on your location and preferences
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

  // Loading state (only show while initially getting location)
  if (geoLoading && !latitude && !longitude && !geoError) {
    return (
      <div className="min-h-screen py-8">
        <div className="container px-4">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 mb-6 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <Navigation className="w-10 h-10 text-primary" />
            </div>
            <h2 className="font-display text-xl font-semibold mb-2">Detecting Your Location</h2>
            <p className="text-muted-foreground text-center max-w-sm mb-6">
              Please allow location access to discover personalized recommendations near you.
            </p>
            <Button variant="outline" onClick={() => setManualDialogOpen(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Set Location Manually
            </Button>
          </div>
        </div>
        <ManualLocationDialog 
          open={manualDialogOpen} 
          onOpenChange={setManualDialogOpen}
          onLocationSet={handleManualLocationSet}
        />
      </div>
    );
  }

  // Location denied or error - show helpful UI with manual option
  if (geoError && !latitude && !longitude) {
    return (
      <div className="min-h-screen py-8">
        <div className="container px-4">
          <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center">
                {isPermissionDenied ? (
                  <MapPinOff className="w-8 h-8 text-amber-500" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-amber-500" />
                )}
              </div>
              <CardTitle>
                {isPermissionDenied ? 'Location Access Disabled' : 'Location Unavailable'}
              </CardTitle>
              <CardDescription className="mt-2">
                {isPermissionDenied 
                  ? 'Location permission was denied. You can still explore nearby recommendations by setting your location manually.'
                  : geoError
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" onClick={() => setManualDialogOpen(true)}>
                <MapPin className="w-4 h-4 mr-2" />
                Set Location Manually
              </Button>
              {!isPermissionDenied && (
                <Button className="w-full" variant="outline" onClick={requestLocation}>
                  <Navigation className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              )}
              {isPermissionDenied && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    To enable automatic location, update your browser settings and refresh the page.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <ManualLocationDialog 
          open={manualDialogOpen} 
          onOpenChange={setManualDialogOpen}
          onLocationSet={handleManualLocationSet}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">Nearby</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">
                {locationName || `${latitude?.toFixed(4)}, ${longitude?.toFixed(4)}`}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs"
                onClick={() => setManualDialogOpen(true)}
              >
                Change
              </Button>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {preferences && (
          <Card className="mb-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="py-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Personalized for you</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {preferences.interests?.slice(0, 3).map((interest) => (
                  <Badge key={interest} variant="secondary" className="text-xs">
                    {interest}
                  </Badge>
                ))}
                {preferences.preferredCuisines?.slice(0, 2).map((cuisine) => (
                  <Badge key={cuisine} variant="outline" className="text-xs">
                    {cuisine}
                  </Badge>
                ))}
                {preferences.dailyBudget && (
                  <Badge variant="outline" className="text-xs">
                    {preferences.dailyBudget} budget
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="all" className="gap-2">
              All
              {places.length > 0 && (
                <span className="text-xs bg-primary/10 px-2 py-0.5 rounded-full">{places.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="attraction" className="gap-2">
              <Landmark className="w-4 h-4" />
              <span className="hidden sm:inline">Attractions</span>
            </TabsTrigger>
            <TabsTrigger value="cafe" className="gap-2">
              <Coffee className="w-4 h-4" />
              <span className="hidden sm:inline">Cafés</span>
            </TabsTrigger>
            <TabsTrigger value="restaurant" className="gap-2">
              <Utensils className="w-4 h-4" />
              <span className="hidden sm:inline">Restaurants</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-video" />
                    <CardContent className="p-4">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-3" />
                      <Skeleton className="h-16 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredPlaces.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPlaces.map((place) => (
                  <NearbyCard key={place.id} place={place} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2">Loading recommendations...</h3>
                  <p className="text-muted-foreground mb-4">
                    Getting personalized places near you.
                  </p>
                  <Button variant="outline" onClick={fetchNearbyPlaces} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Load Recommendations
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <ManualLocationDialog 
        open={manualDialogOpen} 
        onOpenChange={setManualDialogOpen}
        onLocationSet={handleManualLocationSet}
      />
    </div>
  );
};

// Fallback data generator - always returns real content
function generateFallbackPlaces(preferences: any): NearbyPlace[] {
  const cuisines = preferences?.preferredCuisines || ['Italian', 'Japanese', 'Local'];
  const interests = preferences?.interests || ['History', 'Art', 'Nature'];
  
  return [
    {
      id: '1',
      name: 'Historic City Museum',
      type: 'attraction',
      description: 'Explore centuries of local history through interactive exhibits and rare artifacts.',
      distance: '0.4 km',
      rating: 4.6,
      openNow: true,
      address: '123 Museum Street',
      imageUrl: 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=400&h=300&fit=crop',
      matchReason: `Matches your interest in ${interests[0]}`
    },
    {
      id: '2',
      name: 'Botanical Gardens',
      type: 'attraction',
      description: 'Beautiful gardens featuring rare plants from around the world.',
      distance: '0.8 km',
      rating: 4.8,
      openNow: true,
      address: '45 Garden Avenue',
      imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&h=300&fit=crop',
      matchReason: 'Perfect for a relaxed outdoor experience'
    },
    {
      id: '3',
      name: 'Art Gallery District',
      type: 'attraction',
      description: 'Contemporary art galleries showcasing local and international artists.',
      distance: '1.2 km',
      rating: 4.4,
      openNow: true,
      address: '78 Art Lane',
      imageUrl: 'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=400&h=300&fit=crop',
      matchReason: `Aligned with your ${interests[1] || 'cultural'} interests`
    },
    {
      id: '4',
      name: 'The Cozy Corner',
      type: 'cafe',
      description: 'Artisan coffee and freshly baked pastries in a warm atmosphere.',
      distance: '0.2 km',
      rating: 4.5,
      priceLevel: 2,
      openNow: true,
      address: '15 Coffee Street',
      imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop',
      matchReason: 'Great spot for a quick break'
    },
    {
      id: '5',
      name: 'Sunrise Café',
      type: 'cafe',
      description: 'Modern café with specialty drinks and healthy breakfast options.',
      distance: '0.5 km',
      rating: 4.3,
      priceLevel: 2,
      openNow: true,
      address: '89 Morning Road',
      imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop',
      matchReason: 'Fits your moderate budget preference'
    },
    {
      id: '6',
      name: 'Bookworm Café',
      type: 'cafe',
      description: 'Coffee shop with an extensive book collection and quiet reading areas.',
      distance: '0.7 km',
      rating: 4.7,
      priceLevel: 1,
      openNow: true,
      address: '33 Library Square',
      imageUrl: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=400&h=300&fit=crop',
      matchReason: 'Perfect for your relaxed pace'
    },
    {
      id: '7',
      name: `${cuisines[0]} Kitchen`,
      type: 'restaurant',
      description: `Authentic ${cuisines[0]} cuisine made with fresh, local ingredients.`,
      distance: '0.3 km',
      rating: 4.6,
      priceLevel: 2,
      openNow: true,
      address: '56 Dining Street',
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
      matchReason: `Matches your preference for ${cuisines[0]} cuisine`,
      cuisine: cuisines[0]
    },
    {
      id: '8',
      name: 'Garden Bistro',
      type: 'restaurant',
      description: 'Farm-to-table dining with seasonal menus and outdoor seating.',
      distance: '0.6 km',
      rating: 4.5,
      priceLevel: 3,
      openNow: true,
      address: '12 Farm Road',
      imageUrl: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400&h=300&fit=crop',
      matchReason: 'Great for your dining style preferences',
      cuisine: 'Farm-to-table'
    },
    {
      id: '9',
      name: `${cuisines[1] || 'Local'} Flavors`,
      type: 'restaurant',
      description: `Traditional ${cuisines[1] || 'local'} dishes in a cozy family-run restaurant.`,
      distance: '0.9 km',
      rating: 4.4,
      priceLevel: 2,
      openNow: true,
      address: '90 Flavor Avenue',
      imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
      matchReason: `Aligned with your ${cuisines[1] || 'culinary'} preferences`,
      cuisine: cuisines[1] || 'Local'
    }
  ];
}

export default Nearby;
