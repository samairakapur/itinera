import { useState } from 'react';
import { MapPin, Calendar, Users, Zap, Heart, DollarSign, Utensils, Accessibility, Sparkles, PartyPopper, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface City {
  id: string;
  name: string;
  country: string;
}

export interface TripPreferences {
  destination: string;
  tripLength: string;
  travelGroup: string;
  dailyPace: string;
  mainInterests: string[];
  budgetStyle: string;
  dietaryPreferences: string[];
  comfortPreferences: string[];
  tripVibe: string;
  specialOccasion: string;
}

interface TripPreferencesFormProps {
  cities: City[];
  preferences: TripPreferences;
  onPreferencesChange: (prefs: TripPreferences) => void;
  onSubmit: () => void;
  isCollapsed?: boolean;
  onToggleCollapsed?: () => void;
  hasItinerary?: boolean;
}

const TRIP_LENGTHS = [
  { value: '1', label: '1 day' },
  { value: '2-3', label: '2–3 days' },
  { value: '4-5', label: '4–5 days' },
  { value: '6-7', label: '6–7 days' },
  { value: '8-10', label: '8–10 days' },
  { value: '11+', label: '11+ days' },
];

const TRAVEL_GROUPS = [
  { value: 'solo', label: 'Solo', icon: '🧍' },
  { value: 'couple', label: 'Couple', icon: '💑' },
  { value: 'family-young', label: 'Family with young kids', icon: '👨‍👩‍👧' },
  { value: 'family-teens', label: 'Family with teens', icon: '👨‍👩‍👧‍👦' },
  { value: 'friends', label: 'Friends group', icon: '👯' },
  { value: 'multi-gen', label: 'Multi-generation', icon: '👴👶' },
];

const DAILY_PACES = [
  { value: 'relaxed', label: 'Relaxed', description: '2–3 activities/day', icon: '🌿' },
  { value: 'balanced', label: 'Balanced', description: '4–5 activities/day', icon: '⚖️' },
  { value: 'fast', label: 'Fast-paced', description: '6+ activities/day', icon: '⚡' },
];

const MAIN_INTERESTS = [
  { value: 'food', label: 'Food & cafés', icon: '🍽️' },
  { value: 'culture', label: 'Culture & history', icon: '🏛️' },
  { value: 'nature', label: 'Nature & outdoors', icon: '🌲' },
  { value: 'shopping', label: 'Shopping', icon: '🛍️' },
  { value: 'art', label: 'Art & museums', icon: '🎨' },
  { value: 'theme-parks', label: 'Theme parks', icon: '🎢' },
  { value: 'nightlife', label: 'Nightlife', icon: '🌙' },
  { value: 'hidden-gems', label: 'Hidden gems', icon: '💎' },
  { value: 'highlights', label: 'City highlights', icon: '⭐' },
];

const BUDGET_STYLES = [
  { value: 'budget', label: 'Budget', icon: '💵' },
  { value: 'mid-range', label: 'Mid-range', icon: '💰' },
  { value: 'luxury', label: 'Upscale / Luxury', icon: '💎' },
];

const DIETARY_OPTIONS = [
  { value: 'none', label: 'No preference' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'halal', label: 'Halal' },
  { value: 'kosher', label: 'Kosher' },
  { value: 'gluten-free', label: 'Gluten-free' },
  { value: 'dairy-free', label: 'Dairy-free' },
];

const COMFORT_OPTIONS = [
  { value: 'none', label: 'No special considerations' },
  { value: 'avoid-walks', label: 'Avoid long walks' },
  { value: 'indoor', label: 'Prefer indoor activities' },
  { value: 'stroller', label: 'Stroller-friendly' },
  { value: 'wheelchair', label: 'Wheelchair-accessible' },
];

const TRIP_VIBES = [
  { value: 'cozy', label: 'Cozy & relaxed', icon: '☕' },
  { value: 'adventurous', label: 'Adventurous', icon: '🏔️' },
  { value: 'iconic', label: 'Iconic highlights', icon: '📸' },
  { value: 'local', label: 'Local & off-the-beaten-path', icon: '🗺️' },
  { value: 'food-focused', label: 'Food-focused', icon: '🍜' },
];

const SPECIAL_OCCASIONS = [
  { value: 'none', label: 'None' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'anniversary', label: 'Anniversary' },
  { value: 'honeymoon', label: 'Honeymoon' },
  { value: 'graduation', label: 'Graduation' },
  { value: 'celebration', label: 'Family celebration' },
];

const STEPS = [
  { id: 1, title: 'Trip Details', description: 'Where & when' },
  { id: 2, title: 'Travel Style', description: 'Your preferences' },
  { id: 3, title: 'Personalization', description: 'Optional extras' },
];

export const TripPreferencesForm = ({
  cities,
  preferences,
  onPreferencesChange,
  onSubmit,
  isCollapsed = false,
  onToggleCollapsed,
  hasItinerary = false,
}: TripPreferencesFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showOptional, setShowOptional] = useState(false);

  const updatePreference = <K extends keyof TripPreferences>(key: K, value: TripPreferences[K]) => {
    onPreferencesChange({ ...preferences, [key]: value });
  };

  const toggleArrayPreference = (key: 'mainInterests' | 'dietaryPreferences' | 'comfortPreferences', value: string, maxItems?: number) => {
    const currentArray = preferences[key];
    if (currentArray.includes(value)) {
      updatePreference(key, currentArray.filter(v => v !== value));
    } else {
      if (maxItems && currentArray.length >= maxItems) {
        updatePreference(key, [...currentArray.slice(1), value]);
      } else {
        updatePreference(key, [...currentArray, value]);
      }
    }
  };

  /**
   * Dietary selection with mutual-exclusivity for "No preference" (value='none'):
   * - Selecting 'none' clears all specific restrictions
   * - Selecting any specific restriction clears 'none'
   */
  const handleDietarySelect = (value: string) => {
    if (value === 'none') {
      // "No preference" is exclusive — clear all other selections
      updatePreference('dietaryPreferences', ['none']);
    } else {
      // Any specific restriction clears 'none', then toggles the chosen option
      const without = preferences.dietaryPreferences.filter(d => d !== 'none');
      if (without.includes(value)) {
        updatePreference('dietaryPreferences', without.filter(d => d !== value));
      } else {
        updatePreference('dietaryPreferences', [...without, value]);
      }
    }
  };

  const canProceed = () => {
    if (currentStep === 1) {
      return preferences.destination && preferences.tripLength && preferences.travelGroup;
    }
    if (currentStep === 2) {
      return preferences.dailyPace && preferences.mainInterests.length > 0 && preferences.budgetStyle;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      onSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Collapsed state after itinerary is generated
  if (hasItinerary && isCollapsed) {
    return (
      <Card className="border shadow-sm">
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-medium">Trip Preferences</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {cities.find(c => c.id === preferences.destination)?.name} • {preferences.tripLength} days • {TRAVEL_GROUPS.find(g => g.value === preferences.travelGroup)?.label}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={onToggleCollapsed}>
              Edit Preferences
            </Button>
          </div>
        </CardHeader>
      </Card>
    );
  }

  // Expanded form when editing after itinerary generation
  if (hasItinerary) {
    return (
      <Collapsible open={!isCollapsed} onOpenChange={() => onToggleCollapsed?.()}>
        <Card className="border shadow-sm overflow-hidden">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">Trip Preferences</CardTitle>
                <Button variant="ghost" size="sm">
                  {isCollapsed ? 'Expand' : 'Collapse'}
                </Button>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="p-4 pt-0">
              <StepContent
                step={1}
                cities={cities}
                preferences={preferences}
                updatePreference={updatePreference}
                toggleArrayPreference={toggleArrayPreference}
              />
              <div className="border-t my-4" />
              <StepContent
                step={2}
                cities={cities}
                preferences={preferences}
                updatePreference={updatePreference}
                toggleArrayPreference={toggleArrayPreference}
              />
              <Button
                variant="link"
                className="mt-4 p-0 h-auto"
                onClick={() => setShowOptional(!showOptional)}
              >
                {showOptional ? 'Hide' : 'Show'} personalization options
              </Button>
              {showOptional && (
                <>
                  <div className="border-t my-4" />
                  <StepContent
                    step={3}
                    cities={cities}
                    preferences={preferences}
                    updatePreference={updatePreference}
                    toggleArrayPreference={toggleArrayPreference}
                  />
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  // Initial step-based flow
  return (
    <Card className="border-0 shadow-card overflow-hidden">
      {/* Progress Indicator */}
      <div className="bg-muted/30 px-4 py-3 border-b">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    currentStep > step.id
                      ? "bg-primary text-primary-foreground"
                      : currentStep === step.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
                </div>
                <div className="hidden sm:block">
                  <p className={cn(
                    "text-sm font-medium",
                    currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-3",
                    currentStep > step.id ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground sm:hidden text-center">
          Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title}
        </p>
      </div>

      {/* Scrollable form content — pb-28 so content never hides behind the pinned nav bar */}
      <CardContent className="p-5 sm:p-6 overflow-y-auto pb-28 sm:pb-6">
        <StepContent
          step={currentStep}
          cities={cities}
          preferences={preferences}
          updatePreference={updatePreference}
          toggleArrayPreference={toggleArrayPreference}
        />

        {currentStep === 3 && (
          <p className="text-xs text-muted-foreground text-center mt-3">
            Step 3 is optional — feel free to skip and generate!
          </p>
        )}
      </CardContent>

      {/* Navigation — sticky at bottom so it's always visible on mobile */}
      <div className="sticky bottom-0 left-0 right-0 flex items-center justify-between px-5 py-4 bg-card border-t safe-area-pb">
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={currentStep === 1}
          className={cn(currentStep === 1 && "invisible")}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>

        {currentStep < 3 ? (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleNext} className="gap-2">
            <Sparkles className="w-4 h-4" />
            Generate Itinerary
          </Button>
        )}
      </div>
    </Card>
  );
};

interface StepContentProps {
  step: number;
  cities: City[];
  preferences: TripPreferences;
  updatePreference: <K extends keyof TripPreferences>(key: K, value: TripPreferences[K]) => void;
  toggleArrayPreference: (key: 'mainInterests' | 'dietaryPreferences' | 'comfortPreferences', value: string, maxItems?: number) => void;
}

const StepContent = ({ step, cities, preferences, updatePreference, toggleArrayPreference }: StepContentProps) => {
  if (step === 1) {
    return (
      <div className="space-y-6">
        {/* Destination */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="font-medium">Where are you traveling?</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {cities?.map((city) => (
              <button
                key={city.id}
                onClick={() => updatePreference('destination', city.id)}
                className={cn(
                  "p-3 rounded-xl border-2 text-left transition-all hover:border-primary/50",
                  preferences.destination === city.id
                    ? "border-primary bg-primary/5"
                    : "border-muted"
                )}
              >
                <p className="font-medium text-sm">{city.name}</p>
                <p className="text-xs text-muted-foreground">{city.country}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Trip Length */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="font-medium">How long is your trip?</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {TRIP_LENGTHS.map((length) => (
              <Badge
                key={length.value}
                variant={preferences.tripLength === length.value ? 'default' : 'outline'}
                className={cn(
                  "cursor-pointer px-4 py-2 text-sm transition-all",
                  preferences.tripLength === length.value
                    ? "bg-primary hover:bg-primary/90"
                    : "hover:bg-muted"
                )}
                onClick={() => updatePreference('tripLength', length.value)}
              >
                {length.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Travel Group */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="font-medium">Who is going on this trip?</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {TRAVEL_GROUPS.map((group) => (
              <button
                key={group.value}
                onClick={() => updatePreference('travelGroup', group.value)}
                className={cn(
                  "p-3 rounded-xl border-2 text-left transition-all hover:border-primary/50 flex items-center gap-3",
                  preferences.travelGroup === group.value
                    ? "border-primary bg-primary/5"
                    : "border-muted"
                )}
              >
                <span className="text-xl">{group.icon}</span>
                <span className="font-medium text-sm">{group.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="space-y-6">
        {/* Daily Pace */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="font-medium">How packed do you want each day to be?</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {DAILY_PACES.map((pace) => (
              <button
                key={pace.value}
                onClick={() => updatePreference('dailyPace', pace.value)}
                className={cn(
                  "p-4 rounded-xl border-2 text-center transition-all hover:border-primary/50",
                  preferences.dailyPace === pace.value
                    ? "border-primary bg-primary/5"
                    : "border-muted"
                )}
              >
                <span className="text-2xl block mb-1">{pace.icon}</span>
                <p className="font-medium text-sm">{pace.label}</p>
                <p className="text-xs text-muted-foreground">{pace.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Main Interests */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary" />
            <span className="font-medium">What do you want to focus on?</span>
            <span className="text-xs text-muted-foreground">(Select up to 3)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {MAIN_INTERESTS.map((interest) => (
              <Badge
                key={interest.value}
                variant={preferences.mainInterests.includes(interest.value) ? 'default' : 'outline'}
                className={cn(
                  "cursor-pointer px-3 py-2 text-sm transition-all gap-1.5",
                  preferences.mainInterests.includes(interest.value)
                    ? "bg-primary hover:bg-primary/90"
                    : "hover:bg-muted"
                )}
                onClick={() => toggleArrayPreference('mainInterests', interest.value, 3)}
              >
                <span>{interest.icon}</span>
                {interest.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Budget Style */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="font-medium">What's your travel style?</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {BUDGET_STYLES.map((budget) => (
              <button
                key={budget.value}
                onClick={() => updatePreference('budgetStyle', budget.value)}
                className={cn(
                  "p-4 rounded-xl border-2 text-center transition-all hover:border-primary/50",
                  preferences.budgetStyle === budget.value
                    ? "border-primary bg-primary/5"
                    : "border-muted"
                )}
              >
                <span className="text-2xl block mb-1">{budget.icon}</span>
                <p className="font-medium text-sm">{budget.label}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Optional personalization
  return (
    <div className="space-y-6">
      {/* Dietary Preferences */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Utensils className="w-4 h-4 text-primary" />
          <span className="font-medium">Any dietary preferences?</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {DIETARY_OPTIONS.map((option) => {
            const isSelected = preferences.dietaryPreferences.includes(option.value);
            // Non-'none' options are disabled when 'none' is selected
            const isDisabled = option.value !== 'none' && preferences.dietaryPreferences.includes('none');
            return (
              <Badge
                key={option.value}
                variant={isSelected ? 'default' : 'outline'}
                className={cn(
                  "px-3 py-2 text-sm transition-all",
                  isDisabled
                    ? "cursor-not-allowed opacity-50 pointer-events-none"
                    : "cursor-pointer",
                  isSelected
                    ? "bg-primary hover:bg-primary/90"
                    : !isDisabled && "hover:bg-muted"
                )}
                onClick={() => !isDisabled && handleDietarySelect(option.value)}
              >
                {option.label}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Comfort Preferences */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Accessibility className="w-4 h-4 text-primary" />
          <span className="font-medium">Any comfort considerations?</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {COMFORT_OPTIONS.map((option) => (
            <Badge
              key={option.value}
              variant={preferences.comfortPreferences.includes(option.value) ? 'default' : 'outline'}
              className={cn(
                "cursor-pointer px-3 py-2 text-sm transition-all",
                preferences.comfortPreferences.includes(option.value)
                  ? "bg-primary hover:bg-primary/90"
                  : "hover:bg-muted"
              )}
              onClick={() => toggleArrayPreference('comfortPreferences', option.value)}
            >
              {option.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Trip Vibe */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-medium">What do you want this trip to feel like?</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {TRIP_VIBES.map((vibe) => (
            <Badge
              key={vibe.value}
              variant={preferences.tripVibe === vibe.value ? 'default' : 'outline'}
              className={cn(
                "cursor-pointer px-3 py-2 text-sm transition-all gap-1.5",
                preferences.tripVibe === vibe.value
                  ? "bg-primary hover:bg-primary/90"
                  : "hover:bg-muted"
              )}
              onClick={() => updatePreference('tripVibe', vibe.value)}
            >
              <span>{vibe.icon}</span>
              {vibe.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Special Occasion */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <PartyPopper className="w-4 h-4 text-primary" />
          <span className="font-medium">Is this trip for a special occasion?</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SPECIAL_OCCASIONS.map((occasion) => (
            <Badge
              key={occasion.value}
              variant={preferences.specialOccasion === occasion.value ? 'default' : 'outline'}
              className={cn(
                "cursor-pointer px-3 py-2 text-sm transition-all",
                preferences.specialOccasion === occasion.value
                  ? "bg-primary hover:bg-primary/90"
                  : "hover:bg-muted"
              )}
              onClick={() => updatePreference('specialOccasion', occasion.value)}
            >
              {occasion.label}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};
