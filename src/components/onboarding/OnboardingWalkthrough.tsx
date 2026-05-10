/**
 * OnboardingWalkthrough — two-part DB-persisted spotlight walkthrough.
 *
 * Walkthrough 1 (7 steps): shown to new users on first sign-up.
 *   Trigger: profiles.has_completed_onboarding_1 === false
 *   Rendered by: Layout.tsx
 *
 * Walkthrough 2 (5 steps): shown on first trip detail page view.
 *   Trigger: profiles.has_completed_onboarding_2 === false, fires 2s after mount.
 *   Rendered by: TripDetail.tsx
 */
import { useState, useEffect, useCallback } from 'react';
import { ChevronRight } from 'lucide-react';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

interface SpotlightStep {
  /** CSS selector for the spotlight target. Undefined = centered modal (no cut-out). */
  targetSelector?: string;
  title: string;
  description: string;
}

const STEPS_1: SpotlightStep[] = [
  {
    title: 'Welcome to Itinera',
    description:
      "Plan smarter trips with AI. We'll show you around in under a minute.",
  },
  {
    targetSelector: '[data-tour="create-trip"]',
    title: 'Create your first trip',
    description:
      'Tap here to build a multi-city itinerary in minutes. Tell us your cities, dates, and travel style — the AI does the rest.',
  },
  {
    targetSelector: '[data-tour="nav-explore"]',
    title: 'Explore destinations',
    description:
      'Browse cities and chat with Kiko 🌍, your destination guide. Ask her anything about a city before you commit to going.',
  },
  {
    targetSelector: '[data-tour="nav-nearby"]',
    title: 'Nearby places',
    description:
      "When you're travelling, the Nearby tab shows you what's around you right now — restaurants, cafés, and attractions within walking distance.",
  },
  {
    targetSelector: '[data-tour="nav-profile"]',
    title: 'Save your favourites',
    description:
      'Heart any place to save it to your wishlist. Find everything you\'ve saved in Profile → Saved tab.',
  },
  {
    title: 'Day Mode',
    description:
      'During your trip, Day Mode keeps you on track — see what\'s next, check off activities, and track your daily progress.',
  },
  {
    title: "You're ready! 🌏",
    description:
      "That's the tour! Create your first trip when you're ready. Have a great adventure.",
  },
];

const STEPS_2: SpotlightStep[] = [
  {
    targetSelector: '[data-tour="aria-button"]',
    title: 'Meet Aria ✨',
    description:
      'This is Aria — your personal trip concierge. Ask her anything about your trip or the cities you\'re visiting. She can also update your itinerary based on your conversation.',
  },
  {
    targetSelector: '[data-tour="group-chat-tab"]',
    title: 'Group chat',
    description:
      'Use the Chat tab to talk with your travel group right inside the itinerary — no more switching to WhatsApp.',
  },
  {
    targetSelector: '[data-tour="votes-tab"]',
    title: 'Voting',
    description:
      'When someone proposes a change, it appears here. Vote yes or no — the majority decides. Changes only apply when 50%+ of the group approves.',
  },
  {
    targetSelector: '[data-tour="invite-button"]',
    title: 'Invite your crew',
    description:
      "Invite friends to join this trip and plan together. They'll get access to the itinerary, chat, and voting instantly.",
  },
  {
    title: 'You\'re set! 🗺️',
    description:
      'Your itinerary is ready. Aria is always here if you need help. Enjoy the trip!',
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
// useTargetRect — tracks the bounding rect of a target element
// ---------------------------------------------------------------------------

function useTargetRect(selector: string | undefined): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!selector) {
      setRect(null);
      return;
    }

    const update = () => {
      const el = document.querySelector(selector);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Small delay to let scroll settle before measuring
        const t = setTimeout(() => {
          const r = el.getBoundingClientRect();
          setRect(r);
        }, 300);
        return t;
      } else {
        setRect(null);
        return undefined;
      }
    };

    const timer = update();
    return () => {
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [selector]);

  return rect;
}

// ---------------------------------------------------------------------------
// useWindowSize — responsive overlay dimensions
// ---------------------------------------------------------------------------

function useWindowSize() {
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 375,
    height: typeof window !== 'undefined' ? window.innerHeight : 812,
  });

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    });
    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, []);

  return size;
}

// ---------------------------------------------------------------------------
// SpotlightOverlay — SVG with mask cut-out
// ---------------------------------------------------------------------------

interface SpotlightOverlayProps {
  rect: DOMRect | null;
  padding?: number;
  vw: number;
  vh: number;
}

function SpotlightOverlay({ rect, padding = 10, vw, vh }: SpotlightOverlayProps) {
  if (!rect) {
    return (
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm"
        style={{ zIndex: 49 }}
      />
    );
  }

  const x = Math.max(0, rect.left - padding);
  const y = Math.max(0, rect.top - padding);
  const w = rect.width + padding * 2;
  const h = rect.height + padding * 2;
  const r = 12;

  return (
    <svg
      className="fixed inset-0 pointer-events-none w-screen h-screen"
      style={{ zIndex: 49 }}
      viewBox={`0 0 ${vw} ${vh}`}
      preserveAspectRatio="none"
    >
      <defs>
        <mask id="spotlight-mask">
          <rect width={vw} height={vh} fill="white" />
          <rect x={x} y={y} width={w} height={h} rx={r} ry={r} fill="black" />
        </mask>
      </defs>
      {/* Dark backdrop with hole */}
      <rect
        width={vw}
        height={vh}
        fill="rgba(0,0,0,0.75)"
        mask="url(#spotlight-mask)"
      />
      {/* Glow ring around the cut-out */}
      <rect
        x={x - 2}
        y={y - 2}
        width={w + 4}
        height={h + 4}
        rx={r + 2}
        ry={r + 2}
        fill="none"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="2"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// TooltipCard — positioned near the spotlight cut-out
// ---------------------------------------------------------------------------

interface TooltipCardProps {
  rect: DOMRect | null;
  step: SpotlightStep;
  totalSteps: number;
  stepIndex: number;
  onNext: () => void;
  onSkip: () => void;
  isLast: boolean;
  vw: number;
  vh: number;
}

function TooltipCard({
  rect,
  step,
  totalSteps,
  stepIndex,
  onNext,
  onSkip,
  isLast,
  vw,
  vh,
}: TooltipCardProps) {
  const cardWidth = Math.min(320, vw - 32);
  const cardHeight = 200; // approximate
  const padding = 10;
  const gap = 16;

  let top: number;
  let left: number;

  if (!rect) {
    // Centered fallback
    top = vh / 2 - cardHeight / 2;
    left = vw / 2 - cardWidth / 2;
  } else {
    const spaceBelow = vh - (rect.bottom + padding + gap);
    if (spaceBelow >= cardHeight) {
      top = rect.bottom + padding + gap;
    } else {
      top = Math.max(8, rect.top - padding - gap - cardHeight);
    }
    left = Math.max(
      16,
      Math.min(
        rect.left + rect.width / 2 - cardWidth / 2,
        vw - cardWidth - 16,
      ),
    );
  }

  const lastLabel = stepIndex === 0 ? "Let's go" : isLast ? "Let's go" : 'Next';

  return (
    <div
      className="fixed bg-card border border-border rounded-2xl shadow-2xl p-5 animate-in fade-in-0 zoom-in-95 duration-200"
      style={{ zIndex: 51, top, left, width: cardWidth }}
    >
      <h3 className="font-semibold text-lg text-foreground mb-1">{step.title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        {step.description}
      </p>

      {/* Step dots */}
      <div className="flex gap-1.5 mb-4">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === stepIndex
                ? 'w-5 bg-primary'
                : 'w-1.5 bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onSkip}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip tour
        </button>
        <button
          onClick={onNext}
          className="ml-auto flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          {isLast ? lastLabel : 'Next'}
          {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SpotlightWalkthrough — main component
// ---------------------------------------------------------------------------

interface SpotlightWalkthroughProps {
  steps: SpotlightStep[];
  onDone: () => void;
}

function SpotlightWalkthrough({ steps, onDone }: SpotlightWalkthroughProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const { width: vw, height: vh } = useWindowSize();

  const currentStep = steps[stepIndex];
  const rect = useTargetRect(currentStep.targetSelector);
  const isLast = stepIndex === steps.length - 1;

  const handleNext = useCallback(() => {
    if (isLast) {
      onDone();
    } else {
      setStepIndex((i) => i + 1);
    }
  }, [isLast, onDone]);

  const handleSkip = useCallback(() => {
    onDone();
  }, [onDone]);

  // Intercept backdrop clicks (not the cut-out area) so users don't accidentally dismiss
  // The SVG is pointer-events-none, so we add a transparent intercept layer behind the tooltip
  return (
    <>
      {/* Invisible click-blocker layer — sits between page and spotlight SVG */}
      <div
        className="fixed inset-0"
        style={{ zIndex: 48 }}
        onClick={(e) => e.stopPropagation()}
      />

      {/* SVG overlay with mask cut-out (pointer-events: none so spotlight target stays interactive) */}
      <SpotlightOverlay rect={rect} vw={vw} vh={vh} />

      {/* Tooltip card */}
      <TooltipCard
        rect={rect}
        step={currentStep}
        totalSteps={steps.length}
        stepIndex={stepIndex}
        onNext={handleNext}
        onSkip={handleSkip}
        isLast={isLast}
        vw={vw}
        vh={vh}
      />
    </>
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
  return <SpotlightWalkthrough steps={STEPS_1} onDone={onDone} />;
}

/** Walkthrough 2 — 5-step guide on first trip detail view */
export function OnboardingWalkthrough2({ onDone }: OnboardingWalkthroughProps) {
  return <SpotlightWalkthrough steps={STEPS_2} onDone={onDone} />;
}
