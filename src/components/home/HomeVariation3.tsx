// Variation 3: Interactive/Playful - Duolingo/Headspace inspired
// Gamified feel, friendly illustrations, step-by-step journey

import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCities } from '@/hooks/useCities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import CityCard from '@/components/cities/CityCard';
import { 
  Compass, 
  Sparkles, 
  Heart,
  Map,
  Utensils,
  Sun,
  ArrowRight,
  Play
} from 'lucide-react';

const HomeVariation3 = () => {
  const { user } = useAuth();
  const { data: cities, isLoading } = useCities();
  const featuredCities = cities?.slice(0, 4) || [];

  const steps = [
    { icon: Heart, title: 'Tell us your style', desc: 'Quick quiz about how you travel', color: 'bg-pink-500/10 text-pink-500' },
    { icon: Map, title: 'Pick your destination', desc: 'Choose from 50+ amazing cities', color: 'bg-blue-500/10 text-blue-500' },
    { icon: Sparkles, title: 'Get your plan', desc: 'AI creates your perfect itinerary', color: 'bg-purple-500/10 text-purple-500' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero - Playful & inviting */}
      <section className="relative py-16 lg:py-28 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-16 h-16 rounded-2xl bg-primary/10 rotate-12" />
          <div className="absolute top-40 right-20 w-12 h-12 rounded-full bg-secondary/20" />
          <div className="absolute bottom-20 left-1/4 w-20 h-20 rounded-3xl bg-accent/10 -rotate-12" />
          <div className="absolute bottom-40 right-1/3 w-8 h-8 rounded-lg bg-primary/20 rotate-45" />
        </div>
        
        <div className="container px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 mb-8">
              <Compass className="w-10 h-10 text-primary" />
            </div>
            
            <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Where will your
              <br />
              <span className="relative inline-block">
                next adventure
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                  <path d="M2 10C50 2 150 2 298 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-primary/30" />
                </svg>
              </span>
              <br />
              take you?
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
              Answer a few fun questions and we'll craft a trip that's uniquely yours ✨
            </p>
            
            <Button 
              size="lg" 
              asChild 
              className="h-16 px-10 text-lg font-bold rounded-2xl group"
            >
              <Link to={user ? "/planner/new" : "/auth"}>
                <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Start My Trip Quiz
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How it works - Steps */}
      <section className="py-16 bg-muted/30">
        <div className="container px-4">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-12">
            How it works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <Card className="p-6 text-center h-full hover:shadow-lg transition-shadow">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${step.color} mb-4`}>
                    <step.icon className="w-8 h-8" />
                  </div>
                  <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.desc}</p>
                </Card>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you'll discover */}
      <section className="py-16">
        <div className="container px-4">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-4">
            Your itinerary includes
          </h2>
          <p className="text-muted-foreground text-center mb-12">
            Everything you need for an amazing trip
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { icon: Map, label: 'Top attractions', emoji: '🏛️' },
              { icon: Utensils, label: 'Best restaurants', emoji: '🍽️' },
              { icon: Sun, label: 'Weather tips', emoji: '☀️' },
              { icon: Sparkles, label: 'Local secrets', emoji: '✨' },
            ].map((item, i) => (
              <Card key={i} className="p-4 text-center hover:border-primary/50 transition-colors">
                <span className="text-3xl mb-2 block">{item.emoji}</span>
                <p className="text-sm font-medium">{item.label}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Cities preview */}
      <section className="py-16 bg-muted/30">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
              Explore destinations
            </h2>
            <p className="text-muted-foreground">
              50+ cities waiting for you
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              [1, 2, 3, 4].map((i) => (
                <Card key={i} className="overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-muted" />
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
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
          
          <div className="text-center mt-10">
            <Button variant="outline" size="lg" asChild className="rounded-xl">
              <Link to="/destinations">
                See all destinations
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="container px-4">
          <Card className="max-w-2xl mx-auto p-8 md:p-12 text-center bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
            <span className="text-4xl mb-4 block">🎯</span>
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
              Ready to find your perfect trip?
            </h2>
            <p className="text-muted-foreground mb-8">
              Takes just 2 minutes. Your adventure awaits!
            </p>
            <Button 
              size="lg" 
              asChild 
              className="h-14 px-10 text-lg font-bold rounded-xl"
            >
              <Link to={user ? "/planner/new" : "/auth"}>
                Let's Go! 🚀
              </Link>
            </Button>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default HomeVariation3;
