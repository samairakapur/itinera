/**
 * OnboardingWalkthrough — two-part DB-persisted walkthrough.
 *
 * Walkthrough 1 (7 steps): shown to new users on first sign-up.
 *   Trigger: profiles.has_completed_onboarding_1 === false
 *   Rendered by: Layout.tsx
 *
 * Walkthrough 2 (5 steps): shown on first trip detail page view.
 *   Trigger: profiles.has_completed_onboarding_2 === false, fires 2s after mount.
 *   Rendered by: TripDetail.tsx
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
  MessageCircle,
  UserPlus,
  CalendarDays,
  LayoutList,
} from 'lucide-react';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

interface Step {
  icon: React.ElementType;
  title: string;
  description: string;
  accent: string; // Tailwind bg gradient classes
}

const STEPS_1: Step[] = [
  {
    icon: Sparkles,
    title: 'Welcome to Itinera',
    description:
      'Your AI travel companion that builds day-by-day itineraries tailored to your preferences — in seconds.',
    accent: 'from-primary/20 to-primary/5',
  },
  {
    icon: Map,
    title: 'Plan Your Trip',
    description:
      'Tell us your destination, dates, and travel style. Our AI creates a personalised itinerary with timings, restaurants, and attractions.',
    accent: 'from-blue-500/20 to-blue-500/5',
  },
  {
    icon: MapPin,
    title: 'Explore Destinations',
    description:
      'Browse curated cities with top attractions, dining, and local tips. Chat with Kiko, our destination expert, for tailored advice.',
    accent: 'from-amber-500/20 to-amber-500/5',
  },
  {
    icon: Navigation,
    title: 'Nearby Places',
    description:
      'Discover attractions, cafés, and restaurants close to where you are right now — sorted by distance and matched to your interests.',
    accent: 'from-green-500/20 to-green-500/5',
  },
  {
    icon: Sun,
    title: 'Day Mode',
    description:
      "While you're travelling, Day Mode guides you through each activity with real-time progress tracking and smart suggestions if you're running late.",
    accent: 'from-orange-500/20 to-orange-500/5',
  },
  {
    icon: Heart,
    title: 'Save Your Favourites',
    description:
      "Heart any attraction, restaurant, or café to add it to your wishlist. Find everything you've saved in your Profile → Saved tab.",
    accent: 'from-red-500/20 to-red-500/5',
  },
  {
    icon: Users,
    title: 'Plan with Friends',
    description:
      "Invite collaborators to your trip and vote on activities together. Group trips made easy — everyone gets a say.",
    accent: 'from-purple-500/20 to-purple-500/5',
  },
];

const STEPS_2: Step[] = [
  {
    icon: LayoutList,
    title: 'Your Trip at a Glance',
    description:
      'The overview card shows destination, dates, weather, and budget. Tap the pencil to edit any detail at any time.',
    accent: 'from-primary/20 to-primary/5',
  },
  {
    icon: CalendarDays,
    title: 'Day by Day',
    description:
      'Each day is a collapsible card. Drag activities to reorder them, tap to edit, or add new ones with the + button.',
    accent: 'from-blue-500/20 to-blue-500/5',
  },
  {
    icon: MessageCircle,
    title: 'Chat with Aria',
    description:
      'Aria is your AI trip concierge. Ask her to swap a restaurant, add a backup rainy-day plan, or recalculate your schedule.',
    accent: 'from-violet-500/20 to-violet-500/5',
  },
  {
    icon: UserPlus,
    title: 'Invite Your Crew',
    description:
      'Tap the Invite button to share a link with friends. Collaborators can vote on activities and chat in real time.',
    accent: 'from-green-500/20 to-green-500/5',
  },
  {
    icon: Sun,
    title: 'Hit the Road',
    description:
      "When travel day arrives, tap \"Day Mode\" to get a live guide — tick off activities as you go and see your day unfold.",
    accent: 'from-orange-500/20 to-orange-500/5',
  },
];

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** Walkthrough 1 — shown to new users on first sign-up */
export function useOnboarding() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  // Respect the legacy localStorage flag so existing users don't see it again
  const alreadySeenLocally =
    typeof window !== 'undefined' &&
    localStorage.getItem('itinera_onboarding_done') === '1';

  // Show when:
  //  • profile loaded
  //  • DB column is explicitly false (not undefined from missing column)
  //  • user hasn't dismissed via old localStorage version
  const shouldShow =
    !isLoading &&
    profile != null &&
    profile.has_completed_onboarding_1 === false &&
    !alreadySeenLocally;

  const markDone = () => {
    // Keep legacy key in sync so the flag survives a DB column not yet existing
    localStorage.setItem('itinera_onboarding_done', '1');
    updateProfile.mutate({ has_completed_onboarding_1: true });
  };

  return { shouldShow, markDone };
}

/** Walkthrough 2 — shown on first trip detail view, fires 2 s after mount */
export function useOnboarding2() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (isLoading || !profile) return;
    if (profile.has_completed_onboarding_2 === false) {
      const t = setTimeout(() => setShouldShow(true), 2000);
      return () => clearTimeout(t);
    }
  }, [isLoading, profile]);

  const markDone = () => {
    setShouldShow(false);
    updateProfile.mutate({ has_completed_onboarding_2: true });
  };

  return { shouldShow, markDone };
}

// ---------------------------------------------------------------------------
// Shared modal UI
// ---------------------------------------------------------------------------

interface WalkthroughModalProps {
  steps: Step[];
  onDone: () => void;
}

function WalkthroughModal({ steps, onDone }: WalkthroughModalProps) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  const next = () => {
    if (isLast) { onDone(); return; }
    setStep(s => s + 1);
  };
  const prev = () => setStep(s => Math.max(0, s - 1));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Dismiss / Skip */}
        <button
          onClick={onDone}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground z-10"
          aria-label="Skip walkthrough"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Illustration area */}
        <div className={cn('w-full h-36 flex items-center justify-center bg-gradient-to-br', current.accent)}>
          <div className="w-20 h-20 rounded-2xl bg-background/80 flex items-center justify-center shadow-lg">
            <Icon className="w-10 h-10 text-primary" />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pt-5 pb-3">
          <h2 className="font-display text-2xl font-semibold text-foreground mb-2">
            {current.title}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {current.description}
          </p>
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-1.5 py-3">
          {steps.map((_, i) => (
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

// ---------------------------------------------------------------------------
// Public components
// ---------------------------------------------------------------------------

interface OnboardingWalkthroughProps {
  onDone: () => void;
}

/** Walkthrough 1 — 7-step welcome guide for new sign-ups */
export function OnboardingWalkthrough({ onDone }: OnboardingWalkthroughProps) {
  return <WalkthroughModal steps={STEPS_1} onDone={onDone} />;
}

/** Walkthrough 2 — 5-step guide on first trip detail view */
export function OnboardingWalkthrough2({ onDone }: OnboardingWalkthroughProps) {
  return <WalkthroughModal steps={STEPS_2} onDone={onDone} />;
}
