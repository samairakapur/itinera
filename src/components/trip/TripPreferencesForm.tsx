import { MapPin, Calendar, Users, DollarSign, Zap, Utensils, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface City {
  id: string;
  name: string;
  country: string;
}

interface TripPreferencesFormProps {
  cities: City[];
  selectedCity: string;
  onCityChange: (value: string) => void;
  numDays: number;
  onNumDaysChange: (value: number) => void;
  travelStyle: string;
  onTravelStyleChange: (value: string) => void;
  budgetLevel: string;
  onBudgetLevelChange: (value: string) => void;
  pace: string;
  onPaceChange: (value: string) => void;
  dietaryPreferences: string[];
  onDietaryToggle: (option: string) => void;
  isCollapsed?: boolean;
  onToggleCollapsed?: () => void;
  hasItinerary?: boolean;
}

const dietaryOptions = [
  'Vegetarian',
  'Vegan',
  'Halal',
  'Kosher',
  'Gluten-Free',
  'Dairy-Free',
  'Nut-Free',
];

export const TripPreferencesForm = ({
  cities,
  selectedCity,
  onCityChange,
  numDays,
  onNumDaysChange,
  travelStyle,
  onTravelStyleChange,
  budgetLevel,
  onBudgetLevelChange,
  pace,
  onPaceChange,
  dietaryPreferences,
  onDietaryToggle,
  isCollapsed = false,
  onToggleCollapsed,
  hasItinerary = false,
}: TripPreferencesFormProps) => {
  if (hasItinerary && isCollapsed) {
    return (
      <Card className="border shadow-sm">
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">Trip Preferences</CardTitle>
            <Button variant="outline" size="sm" onClick={onToggleCollapsed}>
              Edit Preferences
            </Button>
          </div>
        </CardHeader>
      </Card>
    );
  }

  const FormContent = () => (
    <div className="space-y-6">
      {/* City Selection */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <MapPin className="w-4 h-4 text-primary" />
          Destination
        </Label>
        <Select value={selectedCity} onValueChange={onCityChange}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Where do you want to go?" />
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
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Calendar className="w-4 h-4 text-primary" />
          Trip Duration: <span className="text-primary font-bold">{numDays} {numDays === 1 ? 'day' : 'days'}</span>
        </Label>
        <Slider
          value={[numDays]}
          onValueChange={([value]) => onNumDaysChange(value)}
          min={1}
          max={14}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1 day</span>
          <span>1 week</span>
          <span>2 weeks</span>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Travel Style */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Users className="w-4 h-4 text-primary" />
            Travel Style
          </Label>
          <Select value={travelStyle} onValueChange={onTravelStyleChange}>
            <SelectTrigger className="h-12">
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
          <Label className="flex items-center gap-2 text-sm font-medium">
            <DollarSign className="w-4 h-4 text-primary" />
            Budget Level
          </Label>
          <Select value={budgetLevel} onValueChange={onBudgetLevelChange}>
            <SelectTrigger className="h-12">
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
      </div>

      {/* Pace */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Zap className="w-4 h-4 text-primary" />
          Daily Pace
        </Label>
        <Select value={pace} onValueChange={onPaceChange}>
          <SelectTrigger className="h-12">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">Light – Take it easy (2-3 activities/day)</SelectItem>
            <SelectItem value="medium">Balanced – Best of both (4-5 activities/day)</SelectItem>
            <SelectItem value="full">Full – See it all (6+ activities/day)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Dietary Preferences */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Utensils className="w-4 h-4 text-primary" />
          Dietary Preferences
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <div className="flex flex-wrap gap-2">
          {dietaryOptions.map((option) => (
            <Badge
              key={option}
              variant={dietaryPreferences.includes(option) ? 'default' : 'outline'}
              className={cn(
                "cursor-pointer transition-all px-3 py-1.5",
                dietaryPreferences.includes(option) 
                  ? "bg-primary hover:bg-primary/90" 
                  : "hover:bg-muted"
              )}
              onClick={() => onDietaryToggle(option)}
            >
              {option}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );

  if (hasItinerary) {
    return (
      <Collapsible open={!isCollapsed} onOpenChange={() => onToggleCollapsed?.()}>
        <Card className="border shadow-sm">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">Trip Preferences</CardTitle>
                <ChevronDown className={cn(
                  "w-5 h-5 transition-transform",
                  !isCollapsed && "rotate-180"
                )} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="p-4 pt-0">
              <FormContent />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  return (
    <Card className="border-0 shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-xl">Plan Your Trip</CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-4">
        <FormContent />
      </CardContent>
    </Card>
  );
};
