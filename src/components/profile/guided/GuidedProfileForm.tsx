import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { GuidedStepCard, GuidedProgressBar } from '@/components/trip/guided';

interface ProfilePreferences {
  ageRange: string;
  fitnessLevel: string;
  walkingTolerance: string;
  crowdComfort: string;
  pacePreference: string;
  indoorOutdoor: string;
  interests: string[];
  scheduleFlexibility: string;
  dailyBudget: string;
  valuePremiumSlider: number;
  diningSpendLevel: string;
  preferredCuisines: string[];
  dietaryRestrictions: string[];
  willingnessToTryNew: string;
  diningStyle: string[];
}

interface GuidedProfileFormProps {
  onComplete: (preferences: ProfilePreferences) => void;
  isSubmitting?: boolean;
}

interface StepOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
}

interface StepDefinition {
  id: number;
  key: keyof ProfilePreferences;
  question: string;
  helper: string;
  type: 'single' | 'multi' | 'slider';
  maxSelect?: number;
  options?: StepOption[];
  sliderConfig?: {
    min: number;
    max: number;
    step: number;
    labels: string[];
  };
}

const STEPS: StepDefinition[] = [
  {
    id: 1,
    key: 'ageRange',
    question: "What's your age range?",
    helper: 'This helps us suggest age-appropriate activities',
    type: 'single',
    options: [
      { value: '13–15', label: '13–15', icon: '🎒' },
      { value: '16–18', label: '16–18', icon: '🎓' },
      { value: '19–21', label: '19–21', icon: '🎉' },
      { value: '22–24', label: '22–24', icon: '🌟' },
      { value: '25–29', label: '25–29', icon: '💼' },
      { value: '30–34', label: '30–34', icon: '🏠' },
      { value: '35–39', label: '35–39', icon: '✨' },
      { value: '40–44', label: '40–44', icon: '🌿' },
      { value: '45–49', label: '45–49', icon: '🍷' },
      { value: '50–54', label: '50–54', icon: '🌅' },
      { value: '55–59', label: '55–59', icon: '🌴' },
      { value: '60–64', label: '60–64', icon: '🎭' },
      { value: '65+', label: '65+', icon: '🏆' },
    ],
  },
  {
    id: 3,
    key: 'fitnessLevel',
    question: "What's your fitness level?",
    helper: "We'll match activity intensity to your comfort",
    type: 'single',
    options: [
      { value: 'Low', label: 'Low', description: 'Prefer minimal physical activity', icon: '🛋️' },
      { value: 'Medium', label: 'Medium', description: 'Comfortable with moderate activity', icon: '🚶' },
      { value: 'High', label: 'High', description: 'Love active adventures', icon: '🏃' },
    ],
  },
  {
    id: 4,
    key: 'walkingTolerance',
    question: 'How much walking are you comfortable with?',
    helper: 'Daily walking distance preference',
    type: 'single',
    options: [
      { value: '0–2 km/day', label: '0–2 km/day', description: 'Minimal walking', icon: '🚗' },
      { value: '2–5 km/day', label: '2–5 km/day', description: 'Light walking', icon: '🚶' },
      { value: '5–10 km/day', label: '5–10 km/day', description: 'Moderate walking', icon: '🥾' },
      { value: '10+ km/day', label: '10+ km/day', description: 'Lots of walking', icon: '🏃' },
    ],
  },
  {
    id: 5,
    key: 'crowdComfort',
    question: 'How do you feel about crowds?',
    helper: "We'll plan around busy times accordingly",
    type: 'single',
    options: [
      { value: 'Avoid crowds', label: 'Avoid Crowds', description: 'Prefer quieter spots', icon: '🏞️' },
      { value: 'Neutral', label: 'Neutral', description: "Doesn't bother me", icon: '😐' },
      { value: 'Comfortable', label: 'Comfortable', description: 'Fine with busy places', icon: '🎉' },
    ],
  },
  {
    id: 6,
    key: 'pacePreference',
    question: "What's your ideal travel pace?",
    helper: 'How packed should each day be?',
    type: 'single',
    options: [
      { value: 'Relaxed', label: 'Relaxed', description: 'Take it slow, enjoy the moment', icon: '🌿' },
      { value: 'Balanced', label: 'Balanced', description: 'Mix of activity and rest', icon: '⚖️' },
      { value: 'Fast-paced', label: 'Fast-paced', description: 'See and do as much as possible', icon: '⚡' },
    ],
  },
  {
    id: 7,
    key: 'indoorOutdoor',
    question: 'Indoor or outdoor activities?',
    helper: 'Your preference for activity settings',
    type: 'single',
    options: [
      { value: 'Mostly indoor', label: 'Mostly Indoor', description: 'Museums, galleries, cafés', icon: '🏛️' },
      { value: 'Balanced', label: 'Balanced', description: 'Mix of both', icon: '⚖️' },
      { value: 'Mostly outdoor', label: 'Mostly Outdoor', description: 'Parks, nature, walks', icon: '🌲' },
    ],
  },
  {
    id: 8,
    key: 'interests',
    question: 'What interests you most?',
    helper: 'Select up to 3 priorities',
    type: 'multi',
    maxSelect: 3,
    options: [
      { value: 'Culture', label: 'Culture & History', icon: '🏛️' },
      { value: 'Food', label: 'Food & Dining', icon: '🍽️' },
      { value: 'Nature', label: 'Nature & Outdoors', icon: '🌲' },
      { value: 'Nightlife', label: 'Nightlife', icon: '🌙' },
      { value: 'Shopping', label: 'Shopping', icon: '🛍️' },
    ],
  },
  {
    id: 9,
    key: 'dailyBudget',
    question: "What's your budget style?",
    helper: "We'll match recommendations accordingly",
    type: 'single',
    options: [
      { value: 'Budget', label: 'Budget', description: 'Great value finds', icon: '💵' },
      { value: 'Mid-range', label: 'Mid-range', description: 'Balance of quality & value', icon: '💰' },
      { value: 'Premium', label: 'Premium', description: 'Premium experiences', icon: '💎' },
    ],
  },
  {
    id: 10,
    key: 'preferredCuisines',
    question: 'Which cuisines do you love?',
    helper: 'Pick your favourites — select up to 6',
    type: 'multi',
    maxSelect: 6,
    options: [
      { value: 'Japanese', label: 'Japanese', icon: '🍣' },
      { value: 'Italian', label: 'Italian', icon: '🍝' },
      { value: 'Mexican', label: 'Mexican', icon: '🌮' },
      { value: 'Indian', label: 'Indian', icon: '🍛' },
      { value: 'Thai', label: 'Thai', icon: '🍜' },
      { value: 'Chinese', label: 'Chinese', icon: '🥟' },
      { value: 'Korean', label: 'Korean', icon: '🫕' },
      { value: 'Vietnamese', label: 'Vietnamese', icon: '🍲' },
      { value: 'French', label: 'French', icon: '🥐' },
      { value: 'American', label: 'American', icon: '🍔' },
      { value: 'Mediterranean', label: 'Mediterranean', icon: '🫒' },
      { value: 'Middle Eastern', label: 'Middle Eastern', icon: '🥙' },
      { value: 'Greek', label: 'Greek', icon: '🍋' },
      { value: 'Spanish / Tapas', label: 'Spanish / Tapas', icon: '🥘' },
      { value: 'Turkish', label: 'Turkish', icon: '🧆' },
      { value: 'Latin American', label: 'Latin American', icon: '🫔' },
      { value: 'African', label: 'African', icon: '🫙' },
      { value: 'Caribbean', label: 'Caribbean', icon: '🌴' },
      { value: 'British / Pub Food', label: 'British / Pub Food', icon: '🍺' },
      { value: 'Seafood', label: 'Seafood', icon: '🦞' },
      { value: 'BBQ / Grill', label: 'BBQ / Grill', icon: '🥩' },
    ],
  },
  {
    id: 11,
    key: 'dietaryRestrictions',
    question: 'Any dietary requirements?',
    helper: "We'll make sure restaurants can accommodate you",
    type: 'multi',
    maxSelect: 4,
    options: [
      { value: 'None', label: 'No restrictions', icon: '✅' },
      { value: 'Vegetarian', label: 'Vegetarian', icon: '🥗' },
      { value: 'Vegan', label: 'Vegan', icon: '🌱' },
      { value: 'Pescatarian', label: 'Pescatarian', icon: '🐟' },
      { value: 'Halal', label: 'Halal', icon: '🌙' },
      { value: 'Kosher', label: 'Kosher', icon: '✡️' },
      { value: 'Gluten-Free', label: 'Gluten-Free', icon: '🌾' },
      { value: 'Dairy-Free', label: 'Dairy-Free', icon: '🥛' },
    ],
  },
  {
    id: 12,
    key: 'willingnessToTryNew',
    question: 'Open to trying new foods?',
    helper: 'Your adventurousness with cuisine',
    type: 'single',
    options: [
      { value: 'No', label: 'Stick to Familiar', description: 'I know what I like', icon: '🏠' },
      { value: 'Sometimes', label: 'Sometimes', description: 'Open to suggestions', icon: '🤔' },
      { value: 'Yes', label: 'Adventurous', description: 'Love trying new things!', icon: '🌍' },
    ],
  },
  {
    id: 13,
    key: 'diningStyle',
    question: 'How do you like to eat?',
    helper: 'Select all that apply (up to 3)',
    type: 'multi',
    maxSelect: 3,
    options: [
      { value: 'Street Food & Markets', label: 'Street Food & Markets', description: 'Night markets, food stalls', icon: '🥡' },
      { value: 'Casual / Bistro', label: 'Casual / Bistro', description: 'Relaxed, laid-back vibes', icon: '🍕' },
      { value: 'Fine Dining', label: 'Fine Dining', description: 'Special occasions & elegance', icon: '🥂' },
      { value: 'Cafés & Brunch', label: 'Cafés & Brunch', description: 'Coffee culture, lazy mornings', icon: '☕' },
      { value: 'Local / Hole-in-the-Wall', label: 'Local / Hidden Gems', description: 'Where locals actually eat', icon: '🔍' },
      { value: 'Food Tours & Experiences', label: 'Food Tours & Experiences', description: 'Tastings, cooking classes', icon: '🎟️' },
    ],
  },
];

const TOTAL_STEPS = STEPS.length;

export const GuidedProfileForm = ({
  onComplete,
  isSubmitting = false,
}: GuidedProfileFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);

  const [preferences, setPreferences] = useState<ProfilePreferences>({
    ageRange: '',
    fitnessLevel: '',
    walkingTolerance: '',
    crowdComfort: '',
    pacePreference: '',
    indoorOutdoor: '',
    interests: [],
    scheduleFlexibility: 'Some flexibility',
    dailyBudget: '',
    valuePremiumSlider: 50,
    diningSpendLevel: 'Medium',
    preferredCuisines: [],
    dietaryRestrictions: [],
    willingnessToTryNew: '',
    diningStyle: [],
  });

  const currentStepData = STEPS[currentStep - 1];

  const updatePreference = (key: keyof ProfilePreferences, value: string | string[] | number) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const toggleMultiSelect = (key: keyof ProfilePreferences, value: string, maxItems: number = 3) => {
    setPreferences(prev => {
      const currentArray = (prev[key] as string[]) || [];
      if (currentArray.includes(value)) {
        return { ...prev, [key]: currentArray.filter(v => v !== value) };
      } else {
        if (currentArray.length >= maxItems) {
          return { ...prev, [key]: [...currentArray.slice(1), value] };
        }
        return { ...prev, [key]: [...currentArray, value] };
      }
    });
  };

  const getStepValue = (): string | string[] | number => {
    return preferences[currentStepData.key];
  };

  const canProceed = (): boolean => {
    const value = getStepValue();
    if (currentStepData.type === 'multi') {
      return (value as string[]).length > 0;
    }
    if (currentStepData.type === 'slider') {
      return true;
    }
    return !!value;
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete(preferences);
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
      toggleMultiSelect(currentStepData.key, value, currentStepData.maxSelect || 3);
    } else {
      updatePreference(currentStepData.key, value);
    }
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
    <div className="min-h-screen flex flex-col bg-background">
      {/* Progress Bar */}
      <GuidedProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />

      {/* Main Content — scrollable, padded so sticky nav never overlaps options */}
      {/* pb-36 on mobile ensures last items clear the sticky nav (h~80px) + MobileBottomNav (h-16) */}
      <div className="flex-1 overflow-y-auto px-4 py-8 pb-36 md:pb-8">
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

            {/* Options */}
            {currentStepData.type !== 'slider' && (
              <div className="space-y-3">
                {currentStepData.options?.map((option) => (
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
            )}

            {/* Slider for slider type */}
            {currentStepData.type === 'slider' && currentStepData.sliderConfig && (
              <div className="py-8 px-4">
                <div className="text-center mb-6">
                  <span className="text-4xl font-bold text-primary">
                    {getStepValue()}
                  </span>
                </div>
                <Slider
                  value={[getStepValue() as number]}
                  onValueChange={(vals) => updatePreference(currentStepData.key, vals[0])}
                  min={currentStepData.sliderConfig.min}
                  max={currentStepData.sliderConfig.max}
                  step={currentStepData.sliderConfig.step}
                  className="w-full"
                />
                {currentStepData.sliderConfig.labels.length > 0 && (
                  <div className="flex justify-between mt-4">
                    {currentStepData.sliderConfig.labels.map((label, i) => (
                      <span key={i} className="text-sm text-muted-foreground">{label}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {currentStepData.type === 'multi' && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                {(getStepValue() as string[]).length} of {currentStepData.maxSelect} selected
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation — fixed on mobile so it never scrolls away or overlaps content */}
      {/* bottom-16 clears the MobileBottomNav on mobile; md:sticky+bottom-0 on desktop */}
      <div className="fixed bottom-16 left-0 right-0 md:relative md:bottom-auto bg-background/95 backdrop-blur-sm border-t px-4 py-4 z-10">
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
              disabled={!canProceed() || isSubmitting}
              className="gap-2 min-w-[160px] bg-gradient-primary hover:opacity-90"
            >
              {isSubmitting ? (
                'Saving...'
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Complete Profile
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
