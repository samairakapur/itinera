// Variation 1: Minimalist Hero - Airbnb/Apple inspired
// Clean, image-focused with prominent single CTA

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
      {/* Hero - Full viewport, image-forward */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/10" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[100px]" />
          <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-secondary/10 blur-[80px]" />
        </div>
        
        <div className="container relative px-4 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            AI-Powered Trip Planning
          </div>
          
          <h1 className="font-display text-5xl md:text-7xl font-bold text-foreground mb-6 tracking-tight leading-[1.1]">
            Your Perfect Trip,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
              Planned in Minutes
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            Tell us how you travel. We'll create a personalized itinerary that matches your style, pace, and interests.
          </p>
          
          {/* Single prominent CTA */}
          <Button 
            size="lg" 
            asChild 
            className="h-16 px-12 text-lg font-semibold rounded-2xl shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-105"
          >
            <Link to={user ? "/planner/new" : "/auth"}>
              Plan My Trip Now
              <ArrowRight className="w-5 h-5 ml-3" />
            </Link>
          </Button>
          
          {!user && (
            <p className="mt-6 text-sm text-muted-foreground">
              Free to start • No credit card required
            </p>
          )}
        </div>
      </section>

      {/* Featured Destinations - Clean grid */}
      <section className="py-24 bg-muted/30">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Popular Destinations
            </h2>
            <p className="text-muted-foreground text-lg">
              Start exploring our handpicked cities
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
            <Button variant="outline" size="lg" asChild className="rounded-xl">
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
