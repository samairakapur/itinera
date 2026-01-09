import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCities } from '@/hooks/useCities';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ArrowLeft, Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { TripPreferencesForm, TripPreferences } from '@/components/trip/TripPreferencesForm';
import { TripOverviewCard } from '@/components/trip/TripOverviewCard';
import { DayCard, DayData } from '@/components/trip/DayCard';
import { TravelTips } from '@/components/trip/TravelTips';
import { Activity } from '@/components/trip/ActivityCard';

const ITINERARY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-itinerary`;

interface ParsedItinerary {
  summary: string;
  days: DayData[];
  packingTips: string[];
  transportTips: string[];
  weatherNotes: string;
}

const parseItineraryText = (text: string, numDays: number): ParsedItinerary => {
  const result: ParsedItinerary = {
    summary: '',
    days: [],
    packingTips: [],
    transportTips: [],
    weatherNotes: '',
  };

  // Extract summary (first paragraph or intro)
  const summaryMatch = text.match(/^([^#\n*-]+(?:\n[^#\n*-]+)*)/);
  if (summaryMatch) {
    result.summary = summaryMatch[1].trim().substring(0, 200);
  }

  // Parse days
  const dayRegex = /(?:^|\n)(?:##?\s*)?(?:Day\s*(\d+)|(\d+)\s*[-–—]\s*)/gi;
  const dayMatches = [...text.matchAll(dayRegex)];

  for (let i = 0; i < numDays; i++) {
    const dayNumber = i + 1;
    const dayData: DayData = {
      dayNumber,
      title: `Day ${dayNumber}`,
      morning: [],
      afternoon: [],
      evening: [],
    };

    // Find day section
    const dayMatch = dayMatches.find(m => {
      const num = parseInt(m[1] || m[2]);
      return num === dayNumber;
    });

    if (dayMatch) {
      // Extract title from the day header
      const titleMatch = text.slice(dayMatch.index || 0, (dayMatch.index || 0) + 100)
        .match(/Day\s*\d+\s*[-–—:]\s*([^\n]+)/i);
      if (titleMatch) {
        dayData.title = titleMatch[1].trim();
      }

      // Get the content for this day
      const startIdx = dayMatch.index || 0;
      const nextDayMatch = dayMatches.find(m => {
        const num = parseInt(m[1] || m[2]);
        return num === dayNumber + 1;
      });
      const endIdx = nextDayMatch?.index || text.length;
      const dayContent = text.slice(startIdx, endIdx);

      // Parse activities by time of day
      const parseActivities = (content: string, timeLabel: string): Activity[] => {
        const activities: Activity[] = [];
        const timeRegex = new RegExp(`(?:${timeLabel})[:\\s]*([\\s\\S]*?)(?=(?:Morning|Afternoon|Evening|Night|Day\\s*\\d|$))`, 'i');
        const timeMatch = content.match(timeRegex);
        
        if (timeMatch) {
          const timeContent = timeMatch[1];
          // Extract bullet points or numbered items
          const itemRegex = /(?:^|\n)\s*(?:[-•*]|\d+[.)]\s*)\s*\*?\*?([^*\n]+)\*?\*?(?:\s*[-–—:]\s*([^\n]+))?/g;
          const items = [...timeContent.matchAll(itemRegex)];
          
          items.forEach((item, idx) => {
            const title = item[1].trim().replace(/\*+/g, '');
            const description = item[2]?.trim().replace(/\*+/g, '');
            
            if (title && title.length > 2) {
              const type = title.toLowerCase().includes('restaurant') || 
                          title.toLowerCase().includes('lunch') || 
                          title.toLowerCase().includes('dinner') ||
                          title.toLowerCase().includes('breakfast') ||
                          title.toLowerCase().includes('café') ||
                          title.toLowerCase().includes('cafe') ||
                          title.toLowerCase().includes('eat')
                ? 'restaurant' 
                : 'attraction';
              
              activities.push({
                id: `day${dayNumber}-${timeLabel}-${idx}`,
                type,
                title,
                description,
              });
            }
          });
        }
        
        // Fallback: parse any bolded items
        if (activities.length === 0) {
          const boldRegex = /\*\*([^*]+)\*\*/g;
          const boldMatches = [...content.matchAll(boldRegex)];
          boldMatches.forEach((match, idx) => {
            const title = match[1].trim();
            if (title.length > 2 && !title.toLowerCase().startsWith('day') && !title.toLowerCase().includes('morning') && !title.toLowerCase().includes('afternoon') && !title.toLowerCase().includes('evening')) {
              activities.push({
                id: `day${dayNumber}-bold-${idx}`,
                type: 'attraction',
                title,
              });
            }
          });
        }
        
        return activities;
      };

      dayData.morning = parseActivities(dayContent, 'Morning');
      dayData.afternoon = parseActivities(dayContent, 'Afternoon');
      dayData.evening = parseActivities(dayContent, 'Evening');

      // If no time-based activities found, try to distribute all activities
      if (dayData.morning.length === 0 && dayData.afternoon.length === 0 && dayData.evening.length === 0) {
        const allActivities: Activity[] = [];
        const bulletRegex = /(?:^|\n)\s*(?:[-•*]|\d+[.)]\s*)\s*\*?\*?([^*\n]+)\*?\*?(?:[:\s]*([^\n]+))?/g;
        const bullets = [...dayContent.matchAll(bulletRegex)];
        
        bullets.forEach((item, idx) => {
          const title = item[1].trim().replace(/\*+/g, '');
          const description = item[2]?.trim().replace(/\*+/g, '');
          
          if (title && title.length > 3 && !title.toLowerCase().startsWith('day')) {
            const type = title.toLowerCase().includes('restaurant') || 
                        title.toLowerCase().includes('lunch') || 
                        title.toLowerCase().includes('dinner') ||
                        title.toLowerCase().includes('breakfast')
              ? 'restaurant' 
              : 'attraction';
            
            allActivities.push({
              id: `day${dayNumber}-item-${idx}`,
              type,
              title,
              description,
            });
          }
        });

        // Distribute among time slots
        const third = Math.ceil(allActivities.length / 3);
        dayData.morning = allActivities.slice(0, third);
        dayData.afternoon = allActivities.slice(third, third * 2);
        dayData.evening = allActivities.slice(third * 2);
      }
    }

    result.days.push(dayData);
  }

  // Parse tips sections
  const packingMatch = text.match(/(?:Packing|What to Pack)[^:]*:([\s\S]*?)(?=(?:Transport|Getting Around|Weather|$))/i);
  if (packingMatch) {
    const tips = packingMatch[1].match(/[-•*]\s*([^\n]+)/g);
    if (tips) {
      result.packingTips = tips.map(t => t.replace(/^[-•*]\s*/, '').trim()).filter(t => t.length > 2);
    }
  }

  const transportMatch = text.match(/(?:Transport|Getting Around)[^:]*:([\s\S]*?)(?=(?:Packing|Weather|Tips|$))/i);
  if (transportMatch) {
    const tips = transportMatch[1].match(/[-•*]\s*([^\n]+)/g);
    if (tips) {
      result.transportTips = tips.map(t => t.replace(/^[-•*]\s*/, '').trim()).filter(t => t.length > 2);
    }
  }

  const weatherMatch = text.match(/(?:Weather)[^:]*:\s*([^\n]+)/i);
  if (weatherMatch) {
    result.weatherNotes = weatherMatch[1].trim();
  }

  return result;
};

// Helper to convert trip length string to number
const tripLengthToNumDays = (tripLength: string): number => {
  switch (tripLength) {
    case '1': return 1;
    case '2-3': return 3;
    case '4-5': return 5;
    case '6-7': return 7;
    case '8-10': return 10;
    case '11+': return 14;
    default: return 3;
  }
};

// Helper to map preferences for API
const mapTravelGroup = (group: string): string => {
  const map: Record<string, string> = {
    'solo': 'solo traveler',
    'couple': 'couple',
    'family-young': 'family with young children',
    'family-teens': 'family with teenagers',
    'friends': 'group of friends',
    'multi-gen': 'multi-generational family',
  };
  return map[group] || 'family';
};

const mapDailyPace = (pace: string): string => {
  const map: Record<string, string> = {
    'relaxed': 'light',
    'balanced': 'medium',
    'fast': 'full',
  };
  return map[pace] || 'medium';
};

const mapBudgetStyle = (budget: string): string => {
  const map: Record<string, string> = {
    'budget': 'budget',
    'mid-range': 'moderate',
    'luxury': 'upscale',
  };
  return map[budget] || 'moderate';
};

const NewTrip = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: cities } = useCities();
  const { data: profile } = useProfile();

  const [preferences, setPreferences] = useState<TripPreferences>({
    destination: '',
    tripLength: '',
    travelGroup: '',
    dailyPace: '',
    mainInterests: [],
    budgetStyle: '',
    dietaryPreferences: [],
    comfortPreferences: [],
    tripVibe: '',
    specialOccasion: 'none',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [rawItinerary, setRawItinerary] = useState('');
  const [parsedItinerary, setParsedItinerary] = useState<ParsedItinerary | null>(null);
  const [preferencesCollapsed, setPreferencesCollapsed] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);

  // Pre-fill from user profile preferences
  useEffect(() => {
    if (profile?.travel_preferences) {
      const prefs = profile.travel_preferences;
      setPreferences(prev => ({
        ...prev,
        dietaryPreferences: prefs.dietaryRestrictions || [],
        dailyPace: prefs.pacePreference === 'Fast-paced' ? 'fast' :
                   prefs.pacePreference === 'Relaxed' ? 'relaxed' : 
                   prefs.pacePreference === 'Balanced' ? 'balanced' : prev.dailyPace,
        budgetStyle: prefs.dailyBudget === 'Budget' ? 'budget' :
                     prefs.dailyBudget === 'Mid-range' ? 'mid-range' :
                     prefs.dailyBudget === 'Premium' ? 'luxury' : prev.budgetStyle,
      }));
    }
  }, [profile]);

  const numDays = tripLengthToNumDays(preferences.tripLength);

  // Parse itinerary when raw text changes
  useEffect(() => {
    if (rawItinerary && rawItinerary.length > 100) {
      const parsed = parseItineraryText(rawItinerary, numDays);
      setParsedItinerary(parsed);
    }
  }, [rawItinerary, numDays]);

  const handleGenerate = async () => {
    if (!user) {
      toast.error('Please sign in to create an itinerary');
      navigate('/auth');
      return;
    }

    if (!preferences.destination) {
      toast.error('Please select a destination');
      return;
    }

    const city = cities?.find(c => c.id === preferences.destination);
    if (!city) {
      toast.error('City not found');
      return;
    }

    setIsGenerating(true);
    setRawItinerary('');
    setParsedItinerary(null);
    setPreferencesCollapsed(true);

    try {
      const response = await fetch(ITINERARY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          cityName: city.name,
          countryName: city.country,
          numDays,
          travelStyle: mapTravelGroup(preferences.travelGroup),
          budgetLevel: mapBudgetStyle(preferences.budgetStyle),
          pace: mapDailyPace(preferences.dailyPace),
          dietaryPreferences: preferences.dietaryPreferences.filter(d => d !== 'none'),
          userPreferences: {
            ...profile?.travel_preferences,
            mainInterests: preferences.mainInterests,
            comfortPreferences: preferences.comfortPreferences,
            tripVibe: preferences.tripVibe,
            specialOccasion: preferences.specialOccasion,
          },
          cityDescription: city.description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate itinerary');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              setRawItinerary(prev => prev + content);
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      toast.success('Itinerary generated!');
    } catch (error) {
      console.error('Error generating itinerary:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate itinerary');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleActivityRemove = useCallback((dayNumber: number, activityId: string) => {
    if (!parsedItinerary) return;
    
    setParsedItinerary(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        days: prev.days.map(day => {
          if (day.dayNumber !== dayNumber) return day;
          return {
            ...day,
            morning: day.morning.filter(a => a.id !== activityId),
            afternoon: day.afternoon.filter(a => a.id !== activityId),
            evening: day.evening.filter(a => a.id !== activityId),
          };
        }),
      };
    });
    toast.success('Activity removed');
  }, [parsedItinerary]);

  const handleActivityToggleMustDo = useCallback((dayNumber: number, activityId: string) => {
    if (!parsedItinerary) return;
    
    setParsedItinerary(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        days: prev.days.map(day => {
          if (day.dayNumber !== dayNumber) return day;
          const toggleMustDo = (activities: Activity[]) =>
            activities.map(a => a.id === activityId ? { ...a, mustDo: !a.mustDo } : a);
          return {
            ...day,
            morning: toggleMustDo(day.morning),
            afternoon: toggleMustDo(day.afternoon),
            evening: toggleMustDo(day.evening),
          };
        }),
      };
    });
  }, [parsedItinerary]);

  const selectedCityData = cities?.find(c => c.id === preferences.destination);

  if (!user) {
    return (
      <div className="min-h-screen py-8">
        <div className="container px-4">
          <Card className="max-w-lg mx-auto border-0 shadow-card">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>Sign in to Plan Your Trip</CardTitle>
              <CardDescription>
                Create personalized itineraries for your family adventures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="lg" onClick={() => navigate('/auth')}>
                Sign In to Continue
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12" ref={contentRef}>
      <div className="container px-4 max-w-2xl mx-auto">
        {/* Header */}
        <div className="py-6 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
          <Button
            variant="ghost"
            onClick={() => navigate('/trips')}
            className="-ml-2 mb-2"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Trips
          </Button>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            Plan Your Family Trip
          </h1>
          {profile?.travel_preferences && (
            <p className="text-sm text-primary mt-1 flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              Using your saved preferences & real-time weather
            </p>
          )}
        </div>

        <div className="space-y-6">
          {/* Preferences Form */}
          <TripPreferencesForm
            cities={cities || []}
            preferences={preferences}
            onPreferencesChange={setPreferences}
            onSubmit={handleGenerate}
            isCollapsed={preferencesCollapsed}
            onToggleCollapsed={() => setPreferencesCollapsed(!preferencesCollapsed)}
            hasItinerary={!!parsedItinerary}
          />

          {/* Loading State */}
          {isGenerating && !parsedItinerary && (
            <Card className="border-0 shadow-card">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <p className="text-muted-foreground">
                  Crafting your personalized adventure...
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  This usually takes 10-20 seconds
                </p>
              </CardContent>
            </Card>
          )}

          {/* Generated Itinerary */}
          {parsedItinerary && selectedCityData && (
            <>
              {/* Overview Card */}
              <TripOverviewCard
                cityName={selectedCityData.name}
                countryName={selectedCityData.country}
                numDays={numDays}
                travelStyle={mapTravelGroup(preferences.travelGroup)}
                pace={mapDailyPace(preferences.dailyPace)}
                budgetLevel={mapBudgetStyle(preferences.budgetStyle)}
                summary={parsedItinerary.summary}
              />

              {/* Regenerate Button (when collapsed) */}
              {preferencesCollapsed && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate Itinerary
                    </>
                  )}
                </Button>
              )}

              {/* Travel Tips */}
              <TravelTips
                packingTips={parsedItinerary.packingTips}
                transportTips={parsedItinerary.transportTips}
                weatherNotes={parsedItinerary.weatherNotes}
              />
            </>
          )}

          {/* Empty State */}
          {!parsedItinerary && !isGenerating && (
            <Card className="border-0 shadow-sm bg-muted/30">
              <CardContent className="py-16 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                  <Calendar className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  Ready to plan your trip?
                </h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Fill in your trip details above and let our AI create the perfect itinerary for you.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewTrip;
