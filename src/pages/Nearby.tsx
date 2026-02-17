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
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
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

// Haversine distance in km
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

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
  const [radiusKm, setRadiusKm] = useState(10);

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
              content: `You are a local recommendations expert. Generate nearby place recommendations that are ACTUALLY near the given GPS coordinates. Return ONLY valid JSON, no markdown.

${preferencesContext}

CRITICAL RULES:
- Every place MUST be a REAL place that exists near these exact coordinates
- Every place MUST include realistic latitude and longitude fields that are within ${radiusKm}km of the user
- Do NOT invent places in other countries or far-away cities
- Calculate realistic distances based on the coordinates
- Include "typicalTimeSpent" for each place (e.g. "1.5 – 2 hrs", "30 – 45 min")

Output format (return exactly 9 places - 3 attractions, 3 cafes, 3 restaurants):
{
  "places": [
    {
      "id": "unique-id",
      "name": "Place Name",
      "type": "attraction|cafe|restaurant",
      "description": "Brief description (1-2 sentences)",
      "latitude": 1.2345,
      "longitude": 103.8765,
      "rating": 4.5,
      "priceLevel": 2,
      "openNow": true,
      "address": "Full address including city/country",
      "imageUrl": "https://images.unsplash.com/photo-XXXXX?w=400&h=300&fit=crop",
      "matchReason": "Why this matches user preferences",
      "cuisine": "Italian",
      "typicalTimeSpent": "1 – 1.5 hrs"
    }
  ]
}`
            },
            {
              role: 'user',
              content: `Find nearby recommendations within ${radiusKm}km of: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            }
          ]
        }
      });

      if (error) {
        // Check for credit exhaustion (402) from the edge function
        if (error.message?.includes('non-2xx') || error.context?.status === 402) {
          toast.error('AI credits exhausted. Please add credits in Settings → Workspace → Usage.');
          setPlaces([]);
          setLoading(false);
          return;
        }
        throw error;
      }

      const content = data.choices?.[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.places && parsed.places.length > 0) {
          // Filter and compute real distances using haversine
          const filteredPlaces: NearbyPlace[] = parsed.places
            .map((p: any) => {
              const dist = p.latitude && p.longitude
                ? haversineDistance(latitude, longitude, p.latitude, p.longitude)
                : null;
              return {
                ...p,
                distanceKm: dist,
                distance: dist !== null ? (dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)} km`) : p.distance || 'Unknown',
              };
            })
            .filter((p: NearbyPlace) => {
              // Only keep places within radius
              if (p.distanceKm === undefined || p.distanceKm === null) return true; // keep if no coords
              return p.distanceKm <= radiusKm;
            })
            .sort((a: NearbyPlace, b: NearbyPlace) => (a.distanceKm || 99) - (b.distanceKm || 99));

          setPlaces(filteredPlaces);
          if (filteredPlaces.length === 0) {
            toast.info('No places found within radius. Try increasing the distance.');
          }
          return;
        }
      }
      throw new Error('No places in response');
    } catch (err) {
      console.error('Error fetching nearby places:', err);
      setPlaces([]);
      toast.error('Could not load nearby recommendations. Try again.');
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude, preferences, radiusKm]);

  useEffect(() => {
    if (latitude && longitude && places.length === 0 && !loading) {
      fetchNearbyPlaces();
    }
  }, [latitude, longitude, fetchNearbyPlaces, places.length, loading]);

  const handleManualLocationSet = (lat: number, lng: number, name?: string) => {
    setManualLocation(lat, lng);
    setLocationName(name || null);
    setPlaces([]);
    toast.success(`Location set to ${name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`}`);
  };

  const handleRefresh = () => {
    setPlaces([]);
    if (isPermissionDenied && !locationName) {
      setManualDialogOpen(true);
    } else {
      fetchNearbyPlaces();
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

  // Loading state
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

  // Location denied or error
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

        {/* Radius Slider */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Search radius</Label>
              <span className="text-sm text-muted-foreground font-medium">{radiusKm} km</span>
            </div>
            <Slider
              value={[radiusKm]}
              onValueChange={([v]) => setRadiusKm(v)}
              min={1}
              max={25}
              step={1}
              className="w-full"
            />
          </CardContent>
        </Card>

        {preferences && (
          <Card className="mb-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="py-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Personalized for you</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {preferences.interests?.slice(0, 3).map((interest: string) => (
                  <Badge key={interest} variant="secondary" className="text-xs">
                    {interest}
                  </Badge>
                ))}
                {preferences.preferredCuisines?.slice(0, 2).map((cuisine: string) => (
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
                  <h3 className="font-display text-lg font-semibold mb-2">No recommendations yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Tap refresh to discover places near your current location.
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

export default Nearby;
