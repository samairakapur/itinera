/**
 * OnboardingWalkthrough — 7-step modal guide for new users.
 * Persisted via localStorage ('itinera_onboarding_done').
 * Shown automatically on first visit to the home/trips page.
 */
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  Map,
  MapPin,
  Navigation,
  Sun,
  Heart,
  Users,
  X,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_KEY = 'itinera_onboarding_done';

interface Step {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
}

const STEPS: Step[] = [
  {
    icon: Sparkles,
    title: 'Welcome to Itinera',
    description:
      'Your AI travel companion that builds day-by-day itineraries tailored to your preferences — in seconds.',
    gradient: 'from-primary/20 to-primary/5',
  },
  {
    icon: Map,
    title: 'Plan Your Trip',
    description:
      'Tell us your destination, dates, and travel style. Our AI creates a personalised itinerary with timings, restaurants, and attractions.',
    gradient: 'from-blue-500/20 to-blue-500/5',
  },
  {
    icon: MapPin,
    title: 'Explore Destinations',
    description:
      'Browse curated cities with top attractions, dining, and local tips. Chat with Kiko, our destination expert, for tailored advice.',
    gradient: 'from-amber-500/20 to-amber-500/5',
  },
  {
    icon: Navigation,
    title: 'Nearby Places',
    description:
      'Discover attractions, cafés, and restaurants close to where you are right now — sorted by distance and matched to your interests.',
    gradient: 'from-green-500/20 to-green-500/5',
  },
  {
    icon: Sun,
    title: 'Day Mode',
    description:
      'While you\'re travelling, Day Mode guides you through each activity with real-time progress tracking and smart suggestions if you\'re running late.',
    gradient: 'from-orange-500/20 to-orange-500/5',
  },
  {
    icon: Heart,
    title: 'Save Your Favourites',
    description:
      'Heart any attraction, restaurant, or café to add it to your wishlist. Find everything you\'ve saved in your Profile → Saved tab.',
    gradient: 'from-red-500/20 to-red-500/5',
  },
  {
    icon: Users,
    title: 'Plan with Friends',
    description:
      'Invite collaborators to your trip and vote on activities together. Group trips made easy — everyone gets a say.',
    gradient: 'from-purple-500/20 to-purple-500/5',
  },
];

export function useOnboarding() {
  const [shouldShow, setShouldShow] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) setShouldShow(true);
  }, [user]);

  const markDone = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setShouldShow(false);
  };

  return { shouldShow, markDone };
}

interface OnboardingWalkthroughProps {
  onDone: () => void;
}

export function OnboardingWalkthrough({ onDone }: OnboardingWalkthroughProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  const next = () => {
    if (isLast) { onDone(); return; }
    setStep(s => s + 1);
  };
  const prev = () => setStep(s => Math.max(0, s - 1));

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Dismiss */}
        <button
          onClick={onDone}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground"
          aria-label="Skip onboarding"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Gradient illustration area */}
        <div className={cn('w-full h-36 flex items-center justify-center bg-gradient-to-br', current.gradient)}>
          <div className="w-20 h-20 rounded-2xl bg-background/80 flex items-center justify-center shadow-lg">
            <Icon className="w-10 h-10 text-primary" />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pb-4">
          <h2 className="font-display text-2xl font-semibold text-foreground mb-2">
            {current.title}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {current.description}
          </p>
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-1.5 py-3">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === step ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30',
              )}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-6 pb-6 gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={prev}
            disabled={step === 0}
            className="gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          <Button size="sm" onClick={next} className="gap-1.5 flex-1">
            {isLast ? 'Get Started' : 'Next'}
            {!isLast && <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
