import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCities } from '@/hooks/useCities';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ArrowLeft, Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { TripPreferences } from '@/components/trip/TripPreferencesForm';
import { GuidedTripForm } from '@/components/trip/guided';
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

  // Extract summary from ## Summary section or first paragraph
  const summaryMatch = text.match(/##\s*Summary\s*\n([\s\S]*?)(?=##|$)/i);
  if (summaryMatch) {
    result.summary = summaryMatch[1].trim().substring(0, 300);
  } else {
    // Fallback: first paragraph before any headers
    const firstPara = text.match(/^([^#\n*-]+(?:\n[^#\n*-]+)*)/);
    if (firstPara) {
      result.summary = firstPara[1].trim().substring(0, 200);
    }
  }

  // Find all day sections using ## Day N pattern
  const daySectionRegex = /##\s*Day\s*(\d+)[:\s]*([^\n]*)/gi;
  const daySections: { dayNumber: number; title: string; startIndex: number }[] = [];
  let match;
  
  while ((match = daySectionRegex.exec(text)) !== null) {
    daySections.push({
      dayNumber: parseInt(match[1]),
      title: match[2].trim().replace(/^[-–—:\s]+/, '').trim(),
      startIndex: match.index,
    });
  }

  // Parse each day
  for (let i = 0; i < numDays; i++) {
    const dayNumber = i + 1;
    const daySection = daySections.find(d => d.dayNumber === dayNumber);
    
    const dayData: DayData = {
      dayNumber,
      title: daySection?.title || `Exploring Day ${dayNumber}`,
      morning: [],
      afternoon: [],
      evening: [],
    };

    // Clean up the title - remove "Day X" if it appears in the title
    if (dayData.title.toLowerCase().startsWith('day')) {
      dayData.title = dayData.title.replace(/^day\s*\d+\s*[-–—:\s]*/i, '').trim();
    }
    // Default title if empty
    if (!dayData.title || dayData.title.length < 3) {
      dayData.title = `Exploring ${dayNumber === 1 ? 'the City' : 'More Attractions'}`;
    }

    if (daySection) {
      // Get content between this day and the next day (or end of days section)
      const nextDayIndex = daySections.find(d => d.dayNumber === dayNumber + 1)?.startIndex;
      const endOfDays = text.search(/##\s*(Packing|Transport|Tips)/i);
      const endIndex = nextDayIndex ?? (endOfDays > 0 ? endOfDays : text.length);
      const dayContent = text.slice(daySection.startIndex, endIndex);

      // Parse activities from each time slot
      const parseTimeSlot = (content: string, slotName: string): Activity[] => {
        const activities: Activity[] = [];
        
        // Find the section for this time slot
        const slotRegex = new RegExp(`###?\\s*${slotName}\\s*\\n([\\s\\S]*?)(?=###|##|$)`, 'i');
        const slotMatch = content.match(slotRegex);
        
        if (!slotMatch) return activities;
        
        const slotContent = slotMatch[1];
        
        // Parse activities in format: - **Name** | type | duration
        const activityRegex = /[-•]\s*\*\*([^*]+)\*\*\s*\|?\s*([^|\n]*)\|?\s*([^|\n]*)?(?:\n\s*([^\n-•#]+))?/g;
        let activityMatch;
        let idx = 0;
        
        while ((activityMatch = activityRegex.exec(slotContent)) !== null) {
          const title = activityMatch[1].trim();
          const typeHint = activityMatch[2]?.trim().toLowerCase() || '';
          const duration = activityMatch[3]?.trim() || '';
          const description = activityMatch[4]?.trim() || '';
          
          if (title && title.length > 2) {
            // Determine type from the type field or title keywords
            const isRestaurant = typeHint.includes('restaurant') || 
                                title.toLowerCase().includes('lunch') ||
                                title.toLowerCase().includes('dinner') ||
                                title.toLowerCase().includes('breakfast') ||
                                title.toLowerCase().includes('café') ||
                                title.toLowerCase().includes('cafe') ||
                                title.toLowerCase().includes('restaurant');
            
            activities.push({
              id: `day${dayNumber}-${slotName.toLowerCase()}-${idx}`,
              type: isRestaurant ? 'restaurant' : 'attraction',
              title: title.replace(/^(Lunch|Dinner|Breakfast):\s*/i, ''),
              description: description || undefined,
              duration: duration || undefined,
            });
            idx++;
          }
        }
        
        // Fallback: try simpler bullet point parsing
        if (activities.length === 0) {
          const simpleBulletRegex = /[-•]\s*\*?\*?([^*\n]+)\*?\*?[:\s]*([^\n]*)/g;
          let simpleMatch;
          
          while ((simpleMatch = simpleBulletRegex.exec(slotContent)) !== null) {
            const title = simpleMatch[1].trim().replace(/\*+/g, '').replace(/\|.*$/, '').trim();
            const rest = simpleMatch[2]?.trim() || '';
            
            if (title && title.length > 3 && 
                !title.toLowerCase().includes('weather') &&
                !title.toLowerCase().includes('note')) {
              const isRestaurant = title.toLowerCase().includes('lunch') ||
                                  title.toLowerCase().includes('dinner') ||
                                  title.toLowerCase().includes('restaurant') ||
                                  title.toLowerCase().includes('café') ||
                                  title.toLowerCase().includes('cafe');
              
              activities.push({
                id: `day${dayNumber}-${slotName.toLowerCase()}-fallback-${activities.length}`,
                type: isRestaurant ? 'restaurant' : 'attraction',
                title,
                description: rest || undefined,
              });
            }
          }
        }
        
        return activities;
      };

      dayData.morning = parseTimeSlot(dayContent, 'Morning');
      dayData.afternoon = parseTimeSlot(dayContent, 'Afternoon');
      dayData.evening = parseTimeSlot(dayContent, 'Evening');

      // If still no activities found, try to extract all bolded items
      if (dayData.morning.length === 0 && dayData.afternoon.length === 0 && dayData.evening.length === 0) {
        const allActivities: Activity[] = [];
        const boldRegex = /\*\*([^*]+)\*\*/g;
        let boldMatch;
        
        while ((boldMatch = boldRegex.exec(dayContent)) !== null) {
          const title = boldMatch[1].trim();
          if (title.length > 3 && 
              !title.toLowerCase().startsWith('day') &&
              !title.toLowerCase().includes('morning') &&
              !title.toLowerCase().includes('afternoon') &&
              !title.toLowerCase().includes('evening') &&
              !title.toLowerCase().includes('weather')) {
            
            const isRestaurant = title.toLowerCase().includes('lunch') ||
                                title.toLowerCase().includes('dinner') ||
                                title.toLowerCase().includes('restaurant');
            
            allActivities.push({
              id: `day${dayNumber}-bold-${allActivities.length}`,
              type: isRestaurant ? 'restaurant' : 'attraction',
              title,
            });
          }
        }
        
        // Distribute activities across time slots
        const third = Math.ceil(allActivities.length / 3);
        dayData.morning = allActivities.slice(0, third);
        dayData.afternoon = allActivities.slice(third, third * 2);
        dayData.evening = allActivities.slice(third * 2);
      }
    }

    result.days.push(dayData);
  }

  // Parse packing tips
  const packingMatch = text.match(/##\s*Packing\s*Tips?\s*\n([\s\S]*?)(?=##|$)/i);
  if (packingMatch) {
    const tips = packingMatch[1].match(/[-•]\s*([^\n]+)/g);
    if (tips) {
      result.packingTips = tips.map(t => t.replace(/^[-•]\s*/, '').trim()).filter(t => t.length > 2);
    }
  }

  // Parse transport tips
  const transportMatch = text.match(/##\s*Transport\s*Tips?\s*\n([\s\S]*?)(?=##|$)/i);
  if (transportMatch) {
    const tips = transportMatch[1].match(/[-•]\s*([^\n]+)/g);
    if (tips) {
      result.transportTips = tips.map(t => t.replace(/^[-•]\s*/, '').trim()).filter(t => t.length > 2);
    }
  }

  // Extract weather notes from day sections
  const weatherNotes: string[] = [];
  const weatherNoteRegex = /###?\s*Weather\s*Note\s*\n([^\n#]+)/gi;
  let weatherMatch;
  while ((weatherMatch = weatherNoteRegex.exec(text)) !== null) {
    weatherNotes.push(weatherMatch[1].trim());
  }
  if (weatherNotes.length > 0) {
    result.weatherNotes = weatherNotes[0];
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
      // Get the user's session token for authentication
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        toast.error('Session expired. Please sign in again.');
        navigate('/auth');
        return;
      }

      const response = await fetch(ITINERARY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
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

  // Show guided form when no itinerary yet
  if (!parsedItinerary && !isGenerating) {
    return (
      <div className="min-h-screen" ref={contentRef}>
        {/* Back button */}
        <div className="absolute top-4 left-4 z-30">
          <Button
            variant="ghost"
            onClick={() => navigate('/trips')}
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        <GuidedTripForm
          cities={cities || []}
          preferences={preferences}
          onPreferencesChange={setPreferences}
          onSubmit={handleGenerate}
        />
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
            Your Trip to {selectedCityData?.name}
          </h1>
          {profile?.travel_preferences && (
            <p className="text-sm text-primary mt-1 flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              Personalized with your preferences
            </p>
          )}
        </div>

        <div className="space-y-6">
          {/* Loading State */}
          {isGenerating && (
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

              {/* Regenerate Button */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setParsedItinerary(null);
                    setRawItinerary('');
                  }}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Edit Preferences
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
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
                      Regenerate
                    </>
                  )}
                </Button>
              </div>

              {/* Day Cards */}
              {parsedItinerary.days.map((day) => (
                <DayCard
                  key={day.dayNumber}
                  day={day}
                  onActivityRemove={handleActivityRemove}
                  onActivityToggleMustDo={handleActivityToggleMustDo}
                />
              ))}

              {/* Travel Tips */}
              <TravelTips
                packingTips={parsedItinerary.packingTips}
                transportTips={parsedItinerary.transportTips}
                weatherNotes={parsedItinerary.weatherNotes}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewTrip;
