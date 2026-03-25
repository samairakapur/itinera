import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TripPreferences } from '../TripPreferencesForm';
import { GuidedStepCard } from './GuidedStepCard';
import { GuidedProgressBar } from './GuidedProgressBar';
import { MultiCitySelector } from '../MultiCitySelector';

interface City {
  id: string;
  name: string;
  country: string;
  tags?: string[] | null;
  image_url?: string | null;
}

interface SelectedCity {
  cityId: string;
  daysToSpend: number;
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
  onSelectedCitiesChange: (cities: SelectedCity[]) => void;
  selectedCities: SelectedCity[];
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
  type: 'single' | 'multi' | 'multi-city' | 'group-setup';
  options?: StepOption[];
}

// Index 0: planType (always shown)
// Index 1: groupSetup (only shown if planType === 'group')
// Index 2+: existing preference steps
const ALL_STEPS: StepDefinition[] = [
  {
    id: 0,
    key: 'planType',
    question: 'Who are you planning this trip for?',
    helper: "We'll tailor the experience accordingly",
    type: 'single',
    options: [
      { value: 'solo', label: 'Just me', description: 'Personal itinerary, all your choices', icon: '🧍' },
      { value: 'group', label: 'With a group', description: '2–10 people, one organiser or democratic', icon: '👥' },
    ],
  },
  {
    id: -1,
    key: 'groupSetup',
    question: 'Set up your group',
    helper: 'Tell us about your travel party',
    type: 'group-setup',
  },
  {
    id: 1,
    key: 'destinations',
    question: 'Where would you like to go?',
    helper: 'Add one or more cities to your trip. Adjust days per city.',
    type: 'multi-city',
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

type ExtendedPreferences = TripPreferences & { [key: string]: string | string[] };

export const GuidedTripForm = ({
  cities,
  preferences,
  userTravelPreferences,
  onPreferencesChange,
  onSelectedCitiesChange,
  selectedCities,
  onSubmit,
}: GuidedTripFormProps) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const [extendedPrefs, setExtendedPrefs] = useState<ExtendedPreferences>({
    ...preferences,
  });

  useEffect(() => {
    onPreferencesChange(extendedPrefs as TripPreferences);
  }, [extendedPrefs, onPreferencesChange]);

  // Skip groupSetup (index 1) when planning solo
  const isSolo = extendedPrefs.planType === 'solo';
  const skipSet = isSolo ? new Set([1]) : new Set<number>();

  const getNextIndex = (current: number): number => {
    let next = current + 1;
    while (skipSet.has(next) && next < ALL_STEPS.length) next++;
    return next;
  };

  const getPrevIndex = (current: number): number => {
    let prev = current - 1;
    while (skipSet.has(prev) && prev >= 0) prev--;
    return prev;
  };

  const visibleTotalSteps = ALL_STEPS.length - skipSet.size;
  const visibleStepNumber = ALL_STEPS.slice(0, stepIndex + 1)
    .filter((_, i) => !skipSet.has(i)).length;

  const currentStepData = ALL_STEPS[stepIndex];
  const isLastStep = getNextIndex(stepIndex) >= ALL_STEPS.length;

  const updatePreference = (key: string, value: string | string[]) => {
    setExtendedPrefs(prev => ({ ...prev, [key]: value }));
  };

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
    if (currentStepData.type === 'multi-city') return selectedCities.length > 0 ? 'has-cities' : '';
    if (currentStepData.type === 'group-setup') {
      return extendedPrefs.groupSize && extendedPrefs.tripMode ? 'done' : '';
    }
    return extendedPrefs[key] || (currentStepData.type === 'multi' ? [] : '');
  };

  const canProceed = (): boolean => {
    if (currentStepData.type === 'multi-city') return selectedCities.length > 0;
    if (currentStepData.type === 'group-setup') {
      return !!(extendedPrefs.groupSize && extendedPrefs.tripMode);
    }
    const value = getStepValue();
    if (currentStepData.type === 'multi') return (value as string[]).length > 0;
    return !!value;
  };

  const handleNext = () => {
    if (!isLastStep) {
      setDirection(1);
      setStepIndex(getNextIndex(stepIndex));
    } else {
      onSubmit();
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setDirection(-1);
      setStepIndex(getPrevIndex(stepIndex));
    }
  };

  const handleSelect = (value: string) => {
    if (currentStepData.type === 'multi') {
      toggleMultiSelect(currentStepData.key, value);
    } else {
      updatePreference(currentStepData.key, value);
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
  };

  return (
    <div className="min-h-[80vh] flex flex-col bg-background">
      <GuidedProgressBar currentStep={visibleStepNumber} totalSteps={visibleTotalSteps} />

      <div className="flex-1 flex flex-col justify-center px-4 py-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={stepIndex}
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
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">
                {currentStepData.question}
              </h2>
              <p className="text-muted-foreground">{currentStepData.helper}</p>
            </div>

            {/* Multi-city destination selector */}
            {currentStepData.type === 'multi-city' && (
              <MultiCitySelector
                cities={cities}
                userPreferences={userTravelPreferences}
                selectedCities={selectedCities}
                onSelectionChange={onSelectedCitiesChange}
              />
            )}

            {/* Group setup step */}
            {currentStepData.type === 'group-setup' && (
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium text-foreground mb-3">How many people are travelling?</p>
                  <div className="flex gap-2 flex-wrap">
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <button
                        key={n}
                        onClick={() => updatePreference('groupSize', String(n))}
                        className={cn(
                          'w-12 h-12 rounded-xl border-2 font-semibold text-sm transition-all',
                          extendedPrefs.groupSize === String(n)
                            ? 'border-primary bg-primary/10 text-primary shadow-md'
                            : 'border-border bg-card text-foreground hover:border-primary/50'
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-3">How do you make decisions?</p>
                  <div className="space-y-3">
                    <GuidedStepCard
                      icon="👑"
                      label="One person organises"
                      description="You plan everything, others just show up"
                      selected={extendedPrefs.tripMode === 'organizer'}
                      onClick={() => updatePreference('tripMode', 'organizer')}
                    />
                    <GuidedStepCard
                      icon="🗳️"
                      label="We vote on big decisions"
                      description="Democratic — every member gets a say"
                      selected={extendedPrefs.tripMode === 'democratic'}
                      onClick={() => updatePreference('tripMode', 'democratic')}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Standard single / multi select */}
            {(currentStepData.type === 'single' || currentStepData.type === 'multi') && (
              <>
                <div className="space-y-3">
                  {(currentStepData.options || []).map((option) => (
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
      <div className="sticky bottom-16 md:bottom-0 bg-background/95 backdrop-blur-sm border-t px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={stepIndex === 0}
            className={cn('gap-2 transition-opacity', stepIndex === 0 && 'opacity-0 pointer-events-none')}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          {!isLastStep ? (
            <Button onClick={handleNext} disabled={!canProceed()} className="gap-2 min-w-[120px]">
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
