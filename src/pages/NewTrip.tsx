import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCities } from '@/hooks/useCities';
import { useProfile } from '@/hooks/useProfile';
import { useCreateItinerary } from '@/hooks/useItineraries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ArrowLeft, Sparkles, RefreshCw, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { TripPreferences } from '@/components/trip/TripPreferencesForm';
import { GuidedTripForm } from '@/components/trip/guided';
import { TripOverviewCard } from '@/components/trip/TripOverviewCard';
import { DayCard, DayData, DayWeather } from '@/components/trip/DayCard';
import { TravelTips } from '@/components/trip/TravelTips';
import { Activity } from '@/components/trip/ActivityCard';
import { AddActivityDialog } from '@/components/trip/AddActivityDialog';
import { DateSelectionStep } from '@/components/trip/DateSelectionStep';

const ITINERARY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-itinerary`;

interface ParsedItinerary {
  summary: string;
  days: DayData[];
  packingTips: string[];
  transportTips: string[];
  weatherNotes: string;
}

const parseItineraryText = (text: string, numDays: number, weatherData?: DayWeather[]): ParsedItinerary => {
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
    
    // Get weather for this day from API data
    const dayWeatherData = weatherData?.[i];
    
    const dayData: DayData = {
      dayNumber,
      title: daySection?.title || `Exploring Day ${dayNumber}`,
      startTime: '9:00 AM', // Default, will be overridden if found
      weather: dayWeatherData ? {
        date: dayWeatherData.date,
        condition: dayWeatherData.condition,
        tempMin: dayWeatherData.tempMin,
        tempMax: dayWeatherData.tempMax,
        precipChance: dayWeatherData.precipChance,
        recommendation: '',
      } : undefined,
      morning: [],
      afternoon: [],
      evening: [],
    };

    // Clean up the title
    if (dayData.title.toLowerCase().startsWith('day')) {
      dayData.title = dayData.title.replace(/^day\s*\d+\s*[-–—:\s]*/i, '').trim();
    }
    if (!dayData.title || dayData.title.length < 3) {
      dayData.title = `Exploring ${dayNumber === 1 ? 'the City' : 'More Attractions'}`;
    }

    if (daySection) {
      const nextDayIndex = daySections.find(d => d.dayNumber === dayNumber + 1)?.startIndex;
      const endOfDays = text.search(/##\s*(Packing|Transport|Tips)/i);
      const endIndex = nextDayIndex ?? (endOfDays > 0 ? endOfDays : text.length);
      const dayContent = text.slice(daySection.startIndex, endIndex);

      // Extract start time
      const startTimeMatch = dayContent.match(/###?\s*Start\s*Time[:\s]*([^\n]+)/i);
      if (startTimeMatch) {
        dayData.startTime = startTimeMatch[1].trim();
      }

      // Extract weather note/recommendation from the day
      const weatherNoteMatch = dayContent.match(/Note:\s*([^\n]+)/i);
      if (weatherNoteMatch && dayData.weather) {
        dayData.weather.recommendation = weatherNoteMatch[1].trim();
        dayData.weatherNote = weatherNoteMatch[1].trim();
      }

      // Parse weather section if present (for conditions not from API)
      const weatherMatch = dayContent.match(/###?\s*Weather\s*\n([\s\S]*?)(?=###|$)/i);
      if (weatherMatch && !dayData.weather) {
        const weatherSection = weatherMatch[1];
        const conditionMatch = weatherSection.match(/Condition:\s*([^\n]+)/i);
        const tempMatch = weatherSection.match(/Temperature:\s*([^\n]+)/i);
        const rainMatch = weatherSection.match(/Rain:\s*(\d+)/i);
        const noteMatch = weatherSection.match(/Note:\s*([^\n]+)/i);

        if (conditionMatch || tempMatch) {
          const tempRange = tempMatch?.[1]?.match(/(-?\d+)[°\s]*[-–—]\s*(-?\d+)/);
          dayData.weather = {
            date: '',
            condition: conditionMatch?.[1]?.trim() || 'Variable',
            tempMin: tempRange ? parseInt(tempRange[1]) : 10,
            tempMax: tempRange ? parseInt(tempRange[2]) : 20,
            precipChance: rainMatch ? parseInt(rainMatch[1]) : 0,
            recommendation: noteMatch?.[1]?.trim() || '',
          };
          dayData.weatherNote = noteMatch?.[1]?.trim();
        }
      }

      // Parse activities with reasoning
      const parseTimeSlot = (content: string, slotName: string): Activity[] => {
        const activities: Activity[] = [];
        
        const slotRegex = new RegExp(`###?\\s*${slotName}\\s*\\n([\\s\\S]*?)(?=###|##|$)`, 'i');
        const slotMatch = content.match(slotRegex);
        
        if (!slotMatch) return activities;
        
        const slotContent = slotMatch[1];
        
        // Parse activities: **Name** | type | duration | time
        // Followed by description line and Why: reasoning
        const activityBlocks = slotContent.split(/(?=[-•]\s*\*\*)/);
        
        activityBlocks.forEach((block, idx) => {
          if (!block.trim()) return;
          
          // Match the header line: - **Name** | type | duration | time
          const headerMatch = block.match(/[-•]\s*\*\*([^*]+)\*\*\s*\|?\s*([^|\n]*?)\|?\s*([^|\n]*?)\|?\s*([^|\n]*?)$/m);
          
          if (!headerMatch) {
            // Try simpler pattern
            const simpleMatch = block.match(/[-•]\s*\*\*([^*]+)\*\*/);
            if (simpleMatch) {
              const title = simpleMatch[1].trim();
              if (title.length > 2) {
                const descMatch = block.match(/\*\*[^*]+\*\*[^\n]*\n\s*([^\n]+)/);
                const whyMatch = block.match(/Why:\s*([^\n]+)/i);
                
                const isRestaurant = title.toLowerCase().includes('lunch') ||
                                    title.toLowerCase().includes('dinner') ||
                                    title.toLowerCase().includes('restaurant') ||
                                    title.toLowerCase().includes('café');
                
                activities.push({
                  id: `day${dayNumber}-${slotName.toLowerCase()}-${idx}`,
                  type: isRestaurant ? 'restaurant' : 'attraction',
                  title: title.replace(/^(Lunch|Dinner|Breakfast):\s*/i, ''),
                  description: descMatch?.[1]?.trim().replace(/^Why:.*$/i, '').trim() || undefined,
                  reasoning: whyMatch?.[1]?.trim(),
                });
              }
            }
            return;
          }
          
          const title = headerMatch[1].trim();
          const typeHint = headerMatch[2]?.trim().toLowerCase() || '';
          const duration = headerMatch[3]?.trim() || '';
          const time = headerMatch[4]?.trim() || '';
          
          // Get description (line after header, before Why:)
          const restOfBlock = block.slice(block.indexOf(headerMatch[0]) + headerMatch[0].length);
          const descMatch = restOfBlock.match(/^\s*\n?\s*([^\n]+?)(?:\s*\n\s*Why:|$)/);
          const whyMatch = restOfBlock.match(/Why:\s*([^\n]+)/i);
          
          if (title && title.length > 2) {
            const isRestaurant = typeHint.includes('restaurant') || 
                                title.toLowerCase().includes('lunch') ||
                                title.toLowerCase().includes('dinner') ||
                                title.toLowerCase().includes('breakfast') ||
                                title.toLowerCase().includes('café') ||
                                title.toLowerCase().includes('cafe');
            
            activities.push({
              id: `day${dayNumber}-${slotName.toLowerCase()}-${idx}`,
              type: isRestaurant ? 'restaurant' : 'attraction',
              title: title.replace(/^(Lunch|Dinner|Breakfast):\s*/i, ''),
              description: descMatch?.[1]?.trim() || undefined,
              duration: duration || undefined,
              time: time || undefined,
              reasoning: whyMatch?.[1]?.trim(),
            });
          }
        });
        
        // Fallback: try simpler bullet point parsing
        if (activities.length === 0) {
          const simpleBulletRegex = /[-•]\s*\*?\*?([^*\n]+)\*?\*?[:\s]*([^\n]*)/g;
          let simpleMatch;
          
          while ((simpleMatch = simpleBulletRegex.exec(slotContent)) !== null) {
            const title = simpleMatch[1].trim().replace(/\*+/g, '').replace(/\|.*$/, '').trim();
            const rest = simpleMatch[2]?.trim() || '';
            
            if (title && title.length > 3 && 
                !title.toLowerCase().includes('weather') &&
                !title.toLowerCase().includes('note') &&
                !title.toLowerCase().includes('why')) {
              const isRestaurant = title.toLowerCase().includes('lunch') ||
                                  title.toLowerCase().includes('dinner') ||
                                  title.toLowerCase().includes('restaurant');
              
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

      // If still no activities, extract all bolded items
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
        
        // Distribute across time slots
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

  // Extract first weather note for overall summary
  const weatherNotes: string[] = [];
  result.days.forEach(day => {
    if (day.weatherNote) {
      weatherNotes.push(`Day ${day.dayNumber}: ${day.weatherNote}`);
    }
  });
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
    'multi-gen': 'multi-generational group',
  };
  return map[group] || 'group';
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

type ViewMode = 'form' | 'itinerary' | 'dates';

const NewTrip = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: cities } = useCities();
  const { data: profile } = useProfile();
  const createItinerary = useCreateItinerary();

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
  
  // Multi-city selection state
  const [selectedCities, setSelectedCities] = useState<{ cityId: string; daysToSpend: number }[]>([]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [rawItinerary, setRawItinerary] = useState('');
  const [parsedItinerary, setParsedItinerary] = useState<ParsedItinerary | null>(null);
  const [weatherData, setWeatherData] = useState<DayWeather[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('form');

  // Add activity dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogDay, setAddDialogDay] = useState(1);
  const [addDialogTimeSlot, setAddDialogTimeSlot] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [editActivity, setEditActivity] = useState<Activity | null>(null);

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

  // Calculate total days from selected cities
  const numDays = selectedCities.reduce((sum, sc) => sum + sc.daysToSpend, 0) || tripLengthToNumDays(preferences.tripLength);

  // Parse itinerary when raw text changes
  useEffect(() => {
    if (rawItinerary && rawItinerary.length > 100) {
      const parsed = parseItineraryText(rawItinerary, numDays, weatherData);
      setParsedItinerary(parsed);
      setViewMode('itinerary');
    }
  }, [rawItinerary, numDays, weatherData]);

  const handleGenerate = async () => {
    if (!user) {
      toast.error('Please sign in to create an itinerary');
      navigate('/auth');
      return;
    }

    if (selectedCities.length === 0) {
      toast.error('Please select at least one city');
      return;
    }

    // Get city data for all selected cities
    const cityData = selectedCities.map(sc => ({
      ...sc,
      city: cities?.find(c => c.id === sc.cityId),
    })).filter(cd => cd.city);

    if (cityData.length === 0) {
      toast.error('City not found');
      return;
    }

    setIsGenerating(true);
    setRawItinerary('');
    setParsedItinerary(null);
    setWeatherData([]);
    setViewMode('itinerary');

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        toast.error('Session expired. Please sign in again.');
        navigate('/auth');
        return;
      }

      // Build multi-city request
      const citiesForRequest = cityData.map(cd => ({
        cityId: cd.cityId,
        cityName: cd.city!.name,
        countryName: cd.city!.country,
        daysToSpend: cd.daysToSpend,
        cityDescription: cd.city!.description,
      }));

      // Use today as a provisional start date so Claude can use real calendar
      // dates in day headings. The user will confirm (or change) the actual
      // start date in the DateSelectionStep before saving the trip.
      const provisionalStartDate = new Date().toISOString().split('T')[0];

      const response = await fetch(ITINERARY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          // Multi-city array (primary)
          cities: citiesForRequest,
          // Legacy single-city fields (fallback)
          cityName: citiesForRequest[0].cityName,
          countryName: citiesForRequest[0].countryName,
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
          cityDescription: citiesForRequest[0].cityDescription,
          // Provisional start date — Claude uses this for real calendar dates.
          // The user will confirm / adjust in the date-selection step.
          startDate: provisionalStartDate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData.error || '';
        // Provide helpful, specific messages for known error cases
        if (response.status === 429) {
          throw new Error('The AI is a little busy right now. Please wait a few seconds and try again.');
        }
        if (response.status === 503) {
          throw new Error('The AI service is temporarily overloaded. Please try again in a moment.');
        }
        if (response.status === 401) {
          throw new Error('Unable to authenticate with the AI service. Please sign out and back in.');
        }
        throw new Error(msg || 'Failed to generate itinerary. Please try again.');
      }

      // Extract weather data from header if present
      const weatherHeader = response.headers.get('X-Weather-Data');
      if (weatherHeader) {
        try {
          const weather = JSON.parse(weatherHeader);
          setWeatherData(weather);
        } catch (e) {
          console.warn('Failed to parse weather data from header');
        }
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
            // Anthropic streaming format: content_block_delta events carry text
            let content: string | undefined;
            if (
              parsed.type === 'content_block_delta' &&
              parsed.delta?.type === 'text_delta'
            ) {
              content = parsed.delta.text;
            } else if (parsed.choices?.[0]?.delta?.content) {
              // Legacy OpenAI / Lovable gateway format (kept for backward compat)
              content = parsed.choices[0].delta.content;
            }
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
      setViewMode('form');
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

  const handleActivityEdit = useCallback((dayNumber: number, activityId: string) => {
    if (!parsedItinerary) return;
    
    const day = parsedItinerary.days.find(d => d.dayNumber === dayNumber);
    if (!day) return;
    
    const activity = [...day.morning, ...day.afternoon, ...day.evening].find(a => a.id === activityId);
    if (!activity) return;
    
    // Determine which time slot
    let timeSlot: 'morning' | 'afternoon' | 'evening' = 'morning';
    if (day.afternoon.some(a => a.id === activityId)) timeSlot = 'afternoon';
    if (day.evening.some(a => a.id === activityId)) timeSlot = 'evening';
    
    setEditActivity(activity);
    setAddDialogDay(dayNumber);
    setAddDialogTimeSlot(timeSlot);
    setAddDialogOpen(true);
  }, [parsedItinerary]);

  const handleAddActivity = useCallback((dayNumber: number, timeSlot: 'morning' | 'afternoon' | 'evening') => {
    setEditActivity(null);
    setAddDialogDay(dayNumber);
    setAddDialogTimeSlot(timeSlot);
    setAddDialogOpen(true);
  }, []);

  const handleSaveActivity = useCallback((activityData: Omit<Activity, 'id'>) => {
    if (!parsedItinerary) return;
    
    setParsedItinerary(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        days: prev.days.map(day => {
          if (day.dayNumber !== addDialogDay) return day;
          
          const newActivity: Activity = {
            ...activityData,
            id: editActivity?.id || `day${addDialogDay}-${addDialogTimeSlot}-custom-${Date.now()}`,
          };
          
          // If editing, replace the activity
          if (editActivity) {
            const replaceActivity = (activities: Activity[]) =>
              activities.map(a => a.id === editActivity.id ? newActivity : a);
            return {
              ...day,
              morning: replaceActivity(day.morning),
              afternoon: replaceActivity(day.afternoon),
              evening: replaceActivity(day.evening),
            };
          }
          
          // If adding new, append to the correct time slot
          return {
            ...day,
            morning: addDialogTimeSlot === 'morning' ? [...day.morning, newActivity] : day.morning,
            afternoon: addDialogTimeSlot === 'afternoon' ? [...day.afternoon, newActivity] : day.afternoon,
            evening: addDialogTimeSlot === 'evening' ? [...day.evening, newActivity] : day.evening,
          };
        }),
      };
    });
    
    toast.success(editActivity ? 'Activity updated' : 'Activity added');
  }, [parsedItinerary, addDialogDay, addDialogTimeSlot, editActivity]);

  const handleProceedToDates = () => {
    setViewMode('dates');
  };

  const handleSaveTrip = async (startDate: Date, endDate: Date) => {
    if (!parsedItinerary || selectedCities.length === 0) return;

    // Use first city as primary for the itinerary
    const primaryCity = cities?.find(c => c.id === selectedCities[0].cityId);
    if (!primaryCity) return;

    // Create trip name based on cities
    const cityNames = selectedCities
      .map(sc => cities?.find(c => c.id === sc.cityId)?.name)
      .filter(Boolean);
    const tripName = cityNames.length > 1 
      ? `${cityNames.join(' → ')} Adventure`
      : `${cityNames[0]} Adventure`;

    // Build enriched selectedCities for multi-city leg creation
    const enrichedCities = selectedCities.map(sc => ({
      cityId: sc.cityId,
      cityName: cities?.find(c => c.id === sc.cityId)?.name,
      daysToSpend: sc.daysToSpend,
    }));

    try {
      await createItinerary.mutateAsync({
        cityId: selectedCities[0].cityId,
        name: tripName,
        numDays,
        startDate,
        endDate,
        budgetLevel: mapBudgetStyle(preferences.budgetStyle),
        pace: mapDailyPace(preferences.dailyPace),
        travelStyle: mapTravelGroup(preferences.travelGroup),
        dietaryPreferences: preferences.dietaryPreferences.filter(d => d !== 'none'),
        days: parsedItinerary.days,
        summary: parsedItinerary.summary,
        selectedCities: enrichedCities,
      });
      navigate('/trips');
    } catch (err) {
      // Error toast already shown in mutation onError
      console.error('[handleSaveTrip] failed', err);
    }
  };

  // Get data for display
  const primaryCityData = selectedCities.length > 0 
    ? cities?.find(c => c.id === selectedCities[0].cityId) 
    : null;

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
                Create personalized itineraries for your next adventure
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
  if (viewMode === 'form' && !isGenerating) {
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
          userTravelPreferences={profile?.travel_preferences as any}
          onPreferencesChange={setPreferences}
          selectedCities={selectedCities}
          onSelectedCitiesChange={setSelectedCities}
          onSubmit={handleGenerate}
        />
      </div>
    );
  }

  // Date selection view
  if (viewMode === 'dates' && primaryCityData) {
    // Build display name for multi-city trips
    const cityNames = selectedCities
      .map(sc => cities?.find(c => c.id === sc.cityId)?.name)
      .filter(Boolean);
    const displayName = cityNames.length > 1 
      ? cityNames.join(' → ')
      : primaryCityData.name;
      
    return (
      <div className="min-h-screen py-8" ref={contentRef}>
        <div className="container px-4 max-w-lg mx-auto">
          <DateSelectionStep
            cityName={displayName}
            numDays={numDays}
            onBack={() => setViewMode('itinerary')}
            onSave={handleSaveTrip}
            isSaving={createItinerary.isPending}
          />
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
            {selectedCities.length > 1 
              ? `Your Multi-City Trip`
              : `Your Trip to ${primaryCityData?.name}`}
          </h1>
          {selectedCities.length > 1 && (
            <p className="text-muted-foreground text-sm">
              {selectedCities.map(sc => cities?.find(c => c.id === sc.cityId)?.name).filter(Boolean).join(' → ')}
            </p>
          )}
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
          {parsedItinerary && primaryCityData && (
            <>
              {/* Overview Card */}
              <TripOverviewCard
                cityName={selectedCities.length > 1 
                  ? selectedCities.map(sc => cities?.find(c => c.id === sc.cityId)?.name).filter(Boolean).join(' → ')
                  : primaryCityData.name}
                countryName={selectedCities.length > 1 
                  ? [...new Set(selectedCities.map(sc => cities?.find(c => c.id === sc.cityId)?.country).filter(Boolean))].join(', ')
                  : primaryCityData.country}
                numDays={numDays}
                travelStyle={mapTravelGroup(preferences.travelGroup)}
                pace={mapDailyPace(preferences.dailyPace)}
                budgetLevel={mapBudgetStyle(preferences.budgetStyle)}
                summary={parsedItinerary.summary}
              />

              {/* Action Buttons – No duplicate "Next" button here */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setParsedItinerary(null);
                    setRawItinerary('');
                    setWeatherData([]);
                    setViewMode('form');
                  }}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Edit Preferences
                </Button>
                <Button
                  variant="outline"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Day Cards with city tags for multi-city trips */}
              {parsedItinerary.days.map((day) => {
                // Derive cityName for this day based on selectedCities leg ranges
                let cityNameForDay: string | undefined;
                let runningDay = 1;
                for (const sc of selectedCities) {
                  const cityEndDay = runningDay + sc.daysToSpend - 1;
                  if (day.dayNumber >= runningDay && day.dayNumber <= cityEndDay) {
                    cityNameForDay = cities?.find(c => c.id === sc.cityId)?.name;
                    break;
                  }
                  runningDay = cityEndDay + 1;
                }
                const dayWithCity = { ...day, cityName: cityNameForDay };
                return (
                  <DayCard
                    key={day.dayNumber}
                    day={dayWithCity}
                    cityName={cityNameForDay}
                    onActivityRemove={handleActivityRemove}
                    onActivityToggleMustDo={handleActivityToggleMustDo}
                    onActivityEdit={handleActivityEdit}
                    onAddActivity={handleAddActivity}
                  />
                );
              })}

              {/* Travel Tips */}
              <TravelTips
                packingTips={parsedItinerary.packingTips}
                transportTips={parsedItinerary.transportTips}
                weatherNotes={parsedItinerary.weatherNotes}
              />

              {/* Bottom Save Button */}
              <Button
                size="lg"
                className="w-full"
                onClick={handleProceedToDates}
              >
                Select Dates & Save Trip
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Activity Dialog */}
      <AddActivityDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSave={handleSaveActivity}
        dayNumber={addDialogDay}
        timeSlot={addDialogTimeSlot}
        editActivity={editActivity}
      />
    </div>
  );
};

export default NewTrip;
