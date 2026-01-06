import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCities } from '@/hooks/useCities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, DollarSign, Zap, Utensils, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const Planner = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: cities, isLoading: citiesLoading } = useCities();
  
  const [selectedCity, setSelectedCity] = useState('');
  const [numDays, setNumDays] = useState(3);
  const [travelStyle, setTravelStyle] = useState('family');
  const [budgetLevel, setBudgetLevel] = useState('moderate');
  const [pace, setPace] = useState('medium');
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

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

    setIsGenerating(true);
    
    // For now, just show a toast - we'll implement the full AI generation later
    toast.success('Itinerary generation coming soon! This feature will use AI to create personalized travel plans.');
    
    setIsGenerating(false);
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
                Create personalized itineraries and save them for your family adventures
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
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Plan Your Family Trip
            </h1>
            <p className="text-muted-foreground">
              Let our AI create the perfect itinerary based on your preferences
            </p>
          </div>

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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Planner;
