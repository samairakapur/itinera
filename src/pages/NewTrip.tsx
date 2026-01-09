import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCities } from '@/hooks/useCities';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, MapPin, Users, DollarSign, Zap, Utensils, Sparkles, Cloud, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

const ITINERARY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-itinerary`;

const NewTrip = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: cities } = useCities();
  const { data: profile } = useProfile();
  
  const [selectedCity, setSelectedCity] = useState('');
  const [numDays, setNumDays] = useState(3);
  const [travelStyle, setTravelStyle] = useState('family');
  const [budgetLevel, setBudgetLevel] = useState('moderate');
  const [pace, setPace] = useState('medium');
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedItinerary, setGeneratedItinerary] = useState('');
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Pre-fill from user preferences
  useEffect(() => {
    if (profile?.travel_preferences) {
      const prefs = profile.travel_preferences;
      
      if (prefs.dietaryRestrictions?.length) {
        setDietaryPreferences(prefs.dietaryRestrictions);
      }
      
      if (prefs.pacePreference) {
        const paceMap: Record<string, string> = {
          'Fast-paced': 'full',
          'Balanced': 'medium',
          'Relaxed': 'light',
        };
        setPace(paceMap[prefs.pacePreference] || 'medium');
      }
      
      if (prefs.dailyBudget) {
        const budgetMap: Record<string, string> = {
          'Budget': 'budget',
          'Mid-range': 'moderate',
          'Premium': 'upscale',
        };
        setBudgetLevel(budgetMap[prefs.dailyBudget] || 'moderate');
      }
    }
  }, [profile]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [generatedItinerary]);

  const dietaryOptions = [
    'Vegetarian',
    'Vegan',
    'Halal',
    'Kosher',
    'Gluten-Free',
    'Dairy-Free',
    'Nut-Free',
  ];

  const toggleDietary = (option: string) => {
    setDietaryPreferences(prev =>
      prev.includes(option)
        ? prev.filter(d => d !== option)
        : [...prev, option]
    );
  };

  const handleGenerate = async () => {
    if (!user) {
      toast.error('Please sign in to create an itinerary');
      navigate('/auth');
      return;
    }

    if (!selectedCity) {
      toast.error('Please select a city');
      return;
    }

    const city = cities?.find(c => c.id === selectedCity);
    if (!city) {
      toast.error('City not found');
      return;
    }

    setIsGenerating(true);
    setGeneratedItinerary('');

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
          travelStyle,
          budgetLevel,
          pace,
          dietaryPreferences,
          userPreferences: profile?.travel_preferences || null,
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
              setGeneratedItinerary(prev => prev + content);
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

  if (!user) {
    return (
      <div className="min-h-screen py-8">
        <div className="container px-4">
          <Card className="max-w-lg mx-auto">
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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/trips')}
              className="mb-4 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Trips
            </Button>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Plan Your Family Trip
            </h1>
            <p className="text-muted-foreground">
              Our AI creates personalized itineraries based on your preferences and real-time weather
            </p>
            {profile?.travel_preferences && (
              <p className="text-sm text-primary mt-2 flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                Using your saved travel preferences
              </p>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Form */}
            <Card>
              <CardContent className="p-6 space-y-6">
                {/* City Selection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Destination
                  </Label>
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a city" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities?.map((city) => (
                        <SelectItem key={city.id} value={city.id}>
                          {city.name}, {city.country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Number of Days */}
                <div className="space-y-4">
                  <Label className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Trip Duration: {numDays} {numDays === 1 ? 'day' : 'days'}
                  </Label>
                  <Slider
                    value={[numDays]}
                    onValueChange={([value]) => setNumDays(value)}
                    min={1}
                    max={14}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1 day</span>
                    <span>14 days</span>
                  </div>
                </div>

                {/* Travel Style */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Travel Style
                  </Label>
                  <Select value={travelStyle} onValueChange={setTravelStyle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="family">Family with Kids</SelectItem>
                      <SelectItem value="adventure">Adventure Seekers</SelectItem>
                      <SelectItem value="culture">Culture & History</SelectItem>
                      <SelectItem value="food">Food & Culinary</SelectItem>
                      <SelectItem value="relaxed">Relaxed & Easy-going</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Budget Level */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Budget Level
                  </Label>
                  <Select value={budgetLevel} onValueChange={setBudgetLevel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="budget">Budget-Friendly ($)</SelectItem>
                      <SelectItem value="moderate">Moderate ($$)</SelectItem>
                      <SelectItem value="upscale">Upscale ($$$)</SelectItem>
                      <SelectItem value="luxury">Luxury ($$$$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Pace */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Daily Pace
                  </Label>
                  <Select value={pace} onValueChange={setPace}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light (2-3 activities/day)</SelectItem>
                      <SelectItem value="medium">Medium (4-5 activities/day)</SelectItem>
                      <SelectItem value="full">Full (6+ activities/day)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Dietary Preferences */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Utensils className="w-4 h-4" />
                    Dietary Preferences (optional)
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {dietaryOptions.map((option) => (
                      <Badge
                        key={option}
                        variant={dietaryPreferences.includes(option) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleDietary(option)}
                      >
                        {option}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleGenerate}
                  disabled={isGenerating || !selectedCity}
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Itinerary
                    </>
                  )}
                </Button>

                {profile?.travel_preferences && (
                  <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                    <Cloud className="w-3 h-3" />
                    Includes real-time weather data
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Generated Itinerary */}
            <Card className={generatedItinerary ? '' : 'hidden lg:block'}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Your Itinerary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {generatedItinerary ? (
                  <ScrollArea className="h-[500px] pr-4" ref={scrollRef}>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {generatedItinerary}
                      </div>
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="h-[500px] flex items-center justify-center text-center">
                    <div className="text-muted-foreground">
                      <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p>Your personalized itinerary will appear here</p>
                      <p className="text-sm mt-1">Select a city and click generate</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewTrip;
