// Itinera Home — Sunlit Wanderer
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCities } from '@/hooks/useCities';
import { Button } from '@/components/ui/button';
import CityCard from '@/components/cities/CityCard';
import { ArrowRight, Sparkles, Map, CalendarDays, Compass } from 'lucide-react';

const features = [
  {
    icon: Sparkles,
    title: 'AI-crafted itineraries',
    description: 'Tailored to your pace, style, and interests.',
  },
  {
    icon: Map,
    title: '104 curated destinations',
    description: 'Every city hand-picked for experience depth.',
  },
  {
    icon: CalendarDays,
    title: 'Day-by-day planning',
    description: 'From arrival to departure, nothing left to chance.',
  },
];

const HomeVariation1 = () => {
  const { user } = useAuth();
  const { data: cities, isLoading } = useCities();
  const featuredCities = cities?.slice(0, 4) || [];

  return (
    <div className="min-h-screen">

      {/* ── Hero ── cinematic dark, editorial ── */}
      <section className="relative overflow-hidden bg-background">

        {/* Cinematic radial vignette */}
        <div className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at center top, hsl(43 58% 54% / 0.05) 0%, transparent 60%)' }} />

        <div className="container relative px-4 pt-20 pb-24 md:pt-28 md:pb-32 text-center max-w-4xl mx-auto">

          {/* Eyebrow pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-white/5 text-xs font-medium mb-8 tracking-widest uppercase text-primary">
            <Compass className="w-3.5 h-3.5" />
            Your world, perfectly planned
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl md:text-7xl text-foreground mb-6 leading-[1.1]" style={{ fontWeight: 400 }}>
            Travel that feels like{' '}
            <em className="not-italic text-gradient">you</em>
          </h1>

          {/* Sub */}
          <p className="text-lg md:text-xl text-foreground/60 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
            Tell us how you like to explore. We'll build a beautiful, day-by-day itinerary matched to your pace, interests, and sense of adventure.
          </p>

          {/* CTA row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              asChild
              className="h-14 px-10 text-base font-medium tracking-widest uppercase rounded-sm hover:shadow-lg hover:scale-[1.02] transition-all"
              data-tour="create-trip"
            >
              <Link to={user ? '/planner/new' : '/auth'}>
                Plan my trip
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-14 px-10 text-base rounded-sm border-white/10 bg-white/5 hover:bg-white/10 transition-all text-foreground/70 hover:text-foreground"
            >
              <Link to="/destinations">
                Browse destinations
              </Link>
            </Button>
          </div>

          {!user && (
            <p className="mt-5 text-sm text-foreground/45 font-light">
              Free to start · No credit card required
            </p>
          )}
        </div>
      </section>

      {/* ── Feature trio ── */}
      <section className="py-16 bg-card border-y border-border">
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-base font-normal text-foreground mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Destinations ── */}
      <section className="py-20 bg-background">
        <div className="container px-4">

          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Popular right now</p>
              <h2 className="font-display text-3xl md:text-4xl text-foreground" style={{ fontWeight: 400 }}>
                Destinations Worth The Journey
              </h2>
            </div>
            <Button variant="ghost" asChild className="hidden md:flex text-muted-foreground hover:text-foreground gap-1.5">
              <Link to="/destinations">
                View all
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-2xl overflow-hidden animate-pulse bg-muted">
                  <div className="aspect-[4/3]" />
                  <div className="p-4 bg-white">
                    <div className="h-4 bg-muted rounded-lg w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded-lg w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredCities.map((city) => (
                <CityCard key={city.id} city={city} />
              ))}
            </div>
          )}

          <div className="text-center mt-10 md:hidden">
            <Button variant="outline" size="lg" asChild className="rounded-sm border-white/10 text-foreground/70">
              <Link to="/destinations">
                View all destinations
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA banner ── */}
      <section className="py-16 bg-card border-t border-border">
        <div className="container px-4 text-center max-w-2xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl text-foreground mb-4" style={{ fontWeight: 400 }}>
            Ready for your next adventure?
          </h2>
          <p className="text-muted-foreground mb-8 text-lg leading-relaxed font-light">
            Join thousands of travellers who've discovered the joy of perfectly planned trips.
          </p>
          <Button size="lg" asChild className="h-14 px-10 rounded-sm hover:shadow-lg hover:scale-[1.02] transition-all font-medium tracking-widest uppercase">
            <Link to={user ? '/planner/new' : '/auth'}>
              {user ? 'Plan a new trip' : 'Get started free'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

    </div>
  );
};

export default HomeVariation1;
