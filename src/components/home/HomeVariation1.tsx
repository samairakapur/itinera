// Variation 1: Dark & Luxe — cinematic hero, editorial typography
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCities } from '@/hooks/useCities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import CityCard from '@/components/cities/CityCard';
import { ArrowRight, Sparkles } from 'lucide-react';

const HomeVariation1 = () => {
  const { user } = useAuth();
  const { data: cities, isLoading } = useCities();
  const featuredCities = cities?.slice(0, 4) || [];

  return (
    <div className="min-h-screen">
      {/* Hero — cinematic full-viewport */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#0A0A0A]">
        {/* Cinematic vignette — no blobs, just depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0A0A0A]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_hsl(0_0%_4%)_100%)]" />

        <div className="container relative px-4 text-center max-w-4xl">
          {/* Editorial badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-primary/20 text-xs font-medium mb-8 tracking-widest uppercase text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Trip Planning
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-semibold text-foreground mb-6 tracking-tight leading-[1.1]">
            Your Perfect Trip,
            <br />
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'var(--gradient-primary)' }}
            >
              Planned in Minutes
            </span>
          </h1>

          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            Tell us how you travel. We'll create a personalised itinerary that matches your style, pace, and interests.
          </p>

          {/* Single luxe CTA */}
          <Button
            size="lg"
            asChild
            className="h-14 px-10 text-base font-medium tracking-widest uppercase rounded-sm shadow-lg shadow-primary/20 hover:shadow-primary/35 transition-all hover:scale-[1.02]"
          >
            <Link to={user ? "/planner/new" : "/auth"}>
              Plan My Trip
              <ArrowRight className="w-4 h-4 ml-3" />
            </Link>
          </Button>

          {!user && (
            <p className="mt-6 text-sm text-muted-foreground tracking-wide">
              Free to start · No credit card required
            </p>
          )}
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="py-24 bg-[#0D0D0D]">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-4">
              Popular Destinations
            </h2>
            <p className="text-muted-foreground text-lg">
              Destinations worth the journey
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-muted" />
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredCities.map((city) => (
                <CityCard key={city.id} city={city} />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Button variant="outline" size="lg" asChild className="rounded-sm border-white/15 hover:border-primary/40 tracking-widest uppercase text-sm">
              <Link to="/destinations">
                View All Destinations
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomeVariation1;
