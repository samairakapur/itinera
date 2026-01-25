import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TripPreferences } from '../TripPreferencesForm';
import { GuidedStepCard } from './GuidedStepCard';
import { GuidedProgressBar } from './GuidedProgressBar';
import { CitySearchStep } from '../CitySearchStep';

interface City {
  id: string;
  name: string;
  country: string;
  tags?: string[] | null;
  image_url?: string | null;
}

interface TravelPreferences {
  interests?: string[];
  travelStyle?: string;
  pacePreference?: string;
}

interface GuidedTripFormProps {
  cities: City[];
  preferences: TripPreferences;
  userTravelPreferences?: TravelPreferences | null;
  onPreferencesChange: (prefs: TripPreferences) => void;
  onSubmit: () => void;
}

interface StepOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
}

interface StepDefinition {
  id: number;
  key: string;
  question: string;
  helper: string;
  type: 'single' | 'multi' | 'search';
  options?: StepOption[];
}

const STEPS: StepDefinition[] = [
  {
    id: 1,
    key: 'destination',
    question: 'Where would you like to go?',
    helper: 'Search or pick from recommendations',
    type: 'search',
  },
  {
    id: 2,
    key: 'tripLength',
    question: 'How long is your trip?',
    helper: 'This helps us plan the perfect amount of activities',
    type: 'single',
    options: [
      { value: '1', label: '1 day', icon: '📅' },
      { value: '2-3', label: '2–3 days', icon: '🗓️' },
      { value: '4-5', label: '4–5 days', icon: '📆' },
      { value: '6-7', label: '6–7 days', icon: '🗓️' },
      { value: '8-10', label: '8–10 days', icon: '📆' },
      { value: '11+', label: '11+ days', icon: '🌍' },
    ],
  },
  {
    id: 3,
    key: 'travelGroup',
    question: 'What kind of trip are you planning?',
    helper: 'This helps us personalize your itinerary pacing',
    type: 'single',
    options: [
      { value: 'family-young', label: 'Family Trip', icon: '👨‍👩‍👧' },
      { value: 'couple', label: 'Couple Getaway', icon: '💑' },
      { value: 'friends', label: 'Friends', icon: '👯' },
      { value: 'solo', label: 'Solo Travel', icon: '🧍' },
      { value: 'family-teens', label: 'Family with Teens', icon: '👨‍👩‍👧‍👦' },
      { value: 'multi-gen', label: 'Multi-generation', icon: '👴👶' },
    ],
  },
  {
    id: 4,
    key: 'dailyPace',
    question: "What's your ideal pace?",
    helper: 'How packed do you want each day to be?',
    type: 'single',
    options: [
      { value: 'relaxed', label: 'Relaxed', description: '2–3 activities/day', icon: '🌿' },
      { value: 'balanced', label: 'Balanced', description: '4–5 activities/day', icon: '⚖️' },
      { value: 'fast', label: 'Fast-paced', description: '6+ activities/day', icon: '⚡' },
    ],
  },
  {
    id: 5,
    key: 'mainInterests',
    question: 'What interests you most?',
    helper: 'Select all that apply — no limits!',
    type: 'multi',
    options: [
      { value: 'food', label: 'Food & Cafés', icon: '🍽️' },
      { value: 'culture', label: 'Culture & History', icon: '🏛️' },
      { value: 'nature', label: 'Nature & Outdoors', icon: '🌲' },
      { value: 'shopping', label: 'Shopping', icon: '🛍️' },
      { value: 'art', label: 'Art & Museums', icon: '🎨' },
      { value: 'theme-parks', label: 'Theme Parks', icon: '🎢' },
      { value: 'nightlife', label: 'Nightlife', icon: '🌙' },
      { value: 'hidden-gems', label: 'Hidden Gems', icon: '💎' },
      { value: 'highlights', label: 'City Highlights', icon: '⭐' },
    ],
  },
  {
    id: 6,
    key: 'budgetStyle',
    question: "What's your budget style?",
    helper: "We'll match recommendations to your comfort zone",
    type: 'single',
    options: [
      { value: 'budget', label: 'Budget-friendly', description: 'Great value finds', icon: '💵' },
      { value: 'mid-range', label: 'Mid-range', description: 'Balance of quality & value', icon: '💰' },
      { value: 'luxury', label: 'Upscale', description: 'Premium experiences', icon: '💎' },
    ],
  },
  {
    id: 7,
    key: 'dietaryPreferences',
    question: 'Any dietary preferences?',
    helper: 'Select all that apply',
    type: 'multi',
    options: [
      { value: 'none', label: 'No Preference', icon: '🍽️' },
      { value: 'vegetarian', label: 'Vegetarian', icon: '🥗' },
      { value: 'vegan', label: 'Vegan', icon: '🌱' },
      { value: 'halal', label: 'Halal', icon: '🍖' },
      { value: 'kosher', label: 'Kosher', icon: '✡️' },
      { value: 'gluten-free', label: 'Gluten-free', icon: '🌾' },
      { value: 'dairy-free', label: 'Dairy-free', icon: '🥛' },
    ],
  },
  {
    id: 8,
    key: 'tripVibe',
    question: 'What vibe are you going for?',
    helper: 'Select all that match your mood — unlimited!',
    type: 'multi',
    options: [
      { value: 'cozy', label: 'Cozy & Relaxed', icon: '☕' },
      { value: 'adventurous', label: 'Adventurous', icon: '🏔️' },
      { value: 'iconic', label: 'Iconic Highlights', icon: '📸' },
      { value: 'local', label: 'Local & Authentic', icon: '🗺️' },
      { value: 'food-focused', label: 'Food-focused', icon: '🍜' },
    ],
  },
];

const TOTAL_STEPS = STEPS.length;

type ExtendedPreferences = TripPreferences & { [key: string]: string | string[] };

export const GuidedTripForm = ({
  cities,
  preferences,
  userTravelPreferences,
  onPreferencesChange,
  onSubmit,
}: GuidedTripFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);

  const [extendedPrefs, setExtendedPrefs] = useState<ExtendedPreferences>({
    ...preferences,
  });

  useEffect(() => {
    onPreferencesChange(extendedPrefs as TripPreferences);
  }, [extendedPrefs, onPreferencesChange]);

  const currentStepData = STEPS[currentStep - 1];

  const updatePreference = (key: string, value: string | string[]) => {
    setExtendedPrefs(prev => ({ ...prev, [key]: value }));
  };

  // Unlimited multi-select (no maxItems limit)
  const toggleMultiSelect = (key: string, value: string) => {
    setExtendedPrefs(prev => {
      const currentArray = (prev[key] as string[]) || [];
      if (currentArray.includes(value)) {
        return { ...prev, [key]: currentArray.filter(v => v !== value) };
      } else {
        return { ...prev, [key]: [...currentArray, value] };
      }
    });
  };

  const getStepValue = (): string | string[] => {
    const key = currentStepData.key;
    return extendedPrefs[key] || (currentStepData.type === 'multi' ? [] : '');
  };

  const canProceed = (): boolean => {
    const value = getStepValue();
    if (currentStepData.type === 'multi') {
      return (value as string[]).length > 0;
    }
    return !!value;
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
    } else {
      onSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSelect = (value: string) => {
    if (currentStepData.type === 'multi') {
      toggleMultiSelect(currentStepData.key, value);
    } else {
      updatePreference(currentStepData.key, value);
    }
  };

  const getOptions = (): StepOption[] => {
    return currentStepData.options || [];
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <div className="min-h-[80vh] flex flex-col bg-background">
      {/* Progress Bar */}
      <GuidedProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center px-4 py-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="max-w-lg mx-auto w-full"
          >
            {/* Question */}
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">
                {currentStepData.question}
              </h2>
              <p className="text-muted-foreground">
                {currentStepData.helper}
              </p>
            </div>

            {/* Step Content */}
            {currentStepData.type === 'search' ? (
              <CitySearchStep
                cities={cities}
                userPreferences={userTravelPreferences}
                selectedCityId={extendedPrefs.destination as string}
                onSelect={(cityId) => updatePreference('destination', cityId)}
              />
            ) : (
              <>
                {/* Options */}
                <div className="space-y-3">
                  {getOptions().map((option) => (
                    <GuidedStepCard
                      key={option.value}
                      label={option.label}
                      description={option.description}
                      icon={option.icon}
                      selected={
                        currentStepData.type === 'multi'
                          ? (getStepValue() as string[]).includes(option.value)
                          : getStepValue() === option.value
                      }
                      onClick={() => handleSelect(option.value)}
                    />
                  ))}
                </div>

                {currentStepData.type === 'multi' && (
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    {(getStepValue() as string[]).length} selected
                  </p>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
            className={cn(
              'gap-2 transition-opacity',
              currentStep === 1 && 'opacity-0 pointer-events-none'
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          {currentStep < TOTAL_STEPS ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="gap-2 min-w-[120px]"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="gap-2 min-w-[160px] bg-gradient-primary hover:opacity-90"
            >
              <Sparkles className="w-4 h-4" />
              Generate Itinerary
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
