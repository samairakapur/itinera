// Variation 4: Editorial/Magazine - Condé Nast Traveler inspired
// Sophisticated typography, editorial layout, curated feel

import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCities } from '@/hooks/useCities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import CityCard from '@/components/cities/CityCard';
import { ArrowRight, Minus } from 'lucide-react';

const HomeVariation4 = () => {
  const { user } = useAuth();
  const { data: cities, isLoading } = useCities();
  const featuredCities = cities?.slice(0, 4) || [];

  return (
    <div className="min-h-screen">
      {/* Hero - Editorial style */}
      <section className="relative py-20 lg:py-32">
        <div className="container px-4">
          <div className="max-w-5xl">
            <div className="flex items-center gap-4 mb-8">
              <Minus className="w-8 h-8 text-primary" />
              <span className="text-sm uppercase tracking-[0.2em] text-primary font-medium">
                AI-Powered Travel Planning
              </span>
            </div>
            
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-foreground leading-[0.95] mb-8">
              Plan trips
              <br />
              that feel like
              <br />
              <em className="text-primary not-italic">you.</em>
            </h1>
            
            <div className="grid md:grid-cols-2 gap-8 items-end">
              <p className="text-xl text-muted-foreground leading-relaxed">
                Itinera crafts personalized itineraries based on your travel style, 
                interests, and pace. No generic recommendations—just trips designed 
                around who you are.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 md:justify-end">
                <Button 
                  size="lg" 
                  asChild 
                  className="h-14 px-8 text-base font-medium"
                >
                  <Link to={user ? "/planner/new" : "/auth"}>
                    Create Your Itinerary
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial divider */}
      <div className="container px-4">
        <div className="border-t border-border" />
      </div>

      {/* Featured section - Magazine grid */}
      <section className="py-16 lg:py-24">
        <div className="container px-4">
          <div className="flex items-center gap-4 mb-12">
            <Minus className="w-8 h-8 text-muted-foreground" />
            <span className="text-sm uppercase tracking-[0.2em] text-muted-foreground font-medium">
              Featured Destinations
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              [1, 2, 3, 4].map((i) => (
                <Card key={i} className="overflow-hidden animate-pulse border-0">
                  <div className="aspect-[3/4] bg-muted" />
                  <CardContent className="p-4">
                    <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))
            ) : (
              featuredCities.map((city) => (
                <CityCard key={city.id} city={city} />
              ))
            )}
          </div>
          
          <div className="mt-12 text-center">
            <Button variant="link" size="lg" asChild className="text-base">
              <Link to="/destinations">
                View All Destinations
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Editorial divider */}
      <div className="container px-4">
        <div className="border-t border-border" />
      </div>

      {/* Features - Clean list */}
      <section className="py-16 lg:py-24">
        <div className="container px-4">
          <div className="grid md:grid-cols-2 gap-16 max-w-5xl">
            <div>
              <div className="flex items-center gap-4 mb-8">
                <Minus className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm uppercase tracking-[0.2em] text-muted-foreground font-medium">
                  The Experience
                </span>
              </div>
              
              <div className="space-y-8">
                {[
                  { num: '01', title: 'Personalized', desc: 'Every recommendation matches your travel style' },
                  { num: '02', title: 'Intelligent', desc: 'AI understands what makes you tick' },
                  { num: '03', title: 'Curated', desc: 'Hand-selected attractions and restaurants' },
                ].map((item) => (
                  <div key={item.num} className="flex gap-6">
                    <span className="text-xs text-muted-foreground font-mono">{item.num}</span>
                    <div>
                      <h3 className="font-display text-xl font-semibold mb-1">{item.title}</h3>
                      <p className="text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex items-center justify-center">
              <Card className="w-full aspect-square bg-gradient-to-br from-primary/10 to-secondary/10 border-0 flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="font-display text-6xl font-bold text-primary mb-4">50+</div>
                  <p className="text-muted-foreground">Destinations ready to explore</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Minimal */}
      <section className="py-20 bg-foreground text-background">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
              Your next journey starts here
            </h2>
            <p className="text-lg opacity-70 mb-10">
              Create a personalized itinerary in minutes
            </p>
            <Button 
              size="lg" 
              variant="secondary" 
              asChild 
              className="h-14 px-10 text-base font-medium"
            >
              <Link to={user ? "/planner/new" : "/auth"}>
                Begin Planning
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomeVariation4;
