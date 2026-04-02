import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import MobileBottomNav from './MobileBottomNav';
import { useActiveTripToday } from '@/hooks/useItineraries';
import { Button } from '@/components/ui/button';
import { MapPin, X } from 'lucide-react';
import { useState } from 'react';
import { OnboardingWalkthrough, useOnboarding } from '@/components/onboarding/OnboardingWalkthrough';

const ActiveTripBanner = () => {
  const { data: activeTrip } = useActiveTripToday();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  if (!activeTrip || dismissed) return null;

  return (
    <div className="bg-primary text-white px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-2 min-w-0">
        <MapPin className="w-4 h-4 shrink-0" />
        <span className="truncate">
          <span className="font-semibold">Day {activeTrip.dayNumber}/{activeTrip.numDays}</span>
          {' · '}
          {activeTrip.cityName || activeTrip.name}
        </span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          size="sm"
          className="h-7 px-3 text-xs bg-white/20 hover:bg-white/30 text-white border-0 rounded-lg font-medium"
          onClick={() => navigate(`/trips/${activeTrip.id}/day`)}
        >
          Open Day Mode
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-white hover:bg-white/20 rounded-lg"
          onClick={() => setDismissed(true)}
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};

const Layout = () => {
  const { shouldShow, markDone } = useOnboarding();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <ActiveTripBanner />
      {/* Extra bottom padding on mobile so content isn't hidden under the tab bar */}
      <main className="pb-16 md:pb-0">
        <Outlet />
      </main>
      <MobileBottomNav />
      {shouldShow && <OnboardingWalkthrough onDone={markDone} />}
    </div>
  );
};

export default Layout;
