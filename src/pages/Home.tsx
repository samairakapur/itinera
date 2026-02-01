import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCities } from '@/hooks/useCities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CityCard from '@/components/cities/CityCard';
import { 
  Plane, 
  MapPin, 
  Calendar, 
  Bot, 
  ChevronRight,
  Sparkles,
  Users,
  ArrowRight
} from 'lucide-react';

// Import variations for A/B testing
import { 
  HomeVariation1, 
  HomeVariation2, 
  HomeVariation3, 
  HomeVariation4, 
  HomeVariation5 
} from '@/components/home';

const Home = () => {
  const { user } = useAuth();
  const { data: cities, isLoading } = useCities();
  const [activeVariation, setActiveVariation] = useState<string>('default');

  const featuredCities = cities?.slice(0, 4) || [];

  // Render selected variation for testing
  if (activeVariation === 'v1') return <HomeVariation1 />;
  if (activeVariation === 'v2') return <HomeVariation2 />;
  if (activeVariation === 'v3') return <HomeVariation3 />;
  if (activeVariation === 'v4') return <HomeVariation4 />;
  if (activeVariation === 'v5') return <HomeVariation5 />;

  return (
    <div className="min-h-screen">
      {/* A/B Test Switcher - For development/testing only */}
      <div className="bg-muted/50 border-b border-border py-2">
        <div className="container px-4">
          <div className="flex items-center gap-4 overflow-x-auto">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Test Variations:</span>
            <Tabs value={activeVariation} onValueChange={setActiveVariation}>
              <TabsList className="h-8">
                <TabsTrigger value="default" className="text-xs h-7 px-3">Default</TabsTrigger>
                <TabsTrigger value="v1" className="text-xs h-7 px-3">Minimal</TabsTrigger>
                <TabsTrigger value="v2" className="text-xs h-7 px-3">Bold</TabsTrigger>
                <TabsTrigger value="v3" className="text-xs h-7 px-3">Playful</TabsTrigger>
                <TabsTrigger value="v4" className="text-xs h-7 px-3">Editorial</TabsTrigger>
                <TabsTrigger value="v5" className="text-xs h-7 px-3">App-Style</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Hero Section - Redesigned with dominant CTA */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/5" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute -bottom-1/4 -left-1/4 w-[500px] h-[500px] rounded-full bg-secondary/10 blur-[100px]" />
        </div>
        
        <div className="container relative px-4">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 border border-primary/20">
              <Sparkles className="w-4 h-4" />
              AI-Powered Trip Planning
            </div>
            
            {/* Headline */}
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground mb-6 leading-[1.1]">
              Plan Your Perfect Trip
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-primary/60">
                In Minutes, Not Hours
              </span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Tell us how you like to travel. Our AI creates personalized itineraries 
              with attractions, restaurants, and timing—all matched to your unique style.
            </p>
            
            {/* Primary CTA - Large and prominent */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button 
                size="lg" 
                asChild 
                className="h-16 px-10 text-lg font-bold rounded-2xl shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all hover:scale-[1.02] group"
              >
                <Link to={user ? "/planner/new" : "/auth"}>
                  <Calendar className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform" />
                  Plan My Trip Now
                  <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>

            {/* Secondary CTA */}
            <Button variant="ghost" size="lg" asChild className="text-base">
              <Link to="/destinations">
                <MapPin className="w-5 h-5 mr-2" />
                Or browse destinations first
              </Link>
            </Button>

            {/* Trust indicators */}
            {!user && (
              <p className="mt-8 text-sm text-muted-foreground">
                ✓ Free to use  •  ✓ No credit card  •  ✓ Ready in 2 minutes
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-border/50 bg-muted/30">
        <div className="container px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="font-display text-3xl md:text-4xl font-bold text-primary mb-1">50+</div>
              <div className="text-sm text-muted-foreground">Cities</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl md:text-4xl font-bold text-primary mb-1">500+</div>
              <div className="text-sm text-muted-foreground">Attractions</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl md:text-4xl font-bold text-primary mb-1">1000+</div>
              <div className="text-sm text-muted-foreground">Restaurants</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl md:text-4xl font-bold text-primary mb-1">AI</div>
              <div className="text-sm text-muted-foreground">Powered</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Cities */}
      <section className="py-16 lg:py-24">
        <div className="container px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
                Popular Destinations
              </h2>
              <p className="text-muted-foreground">
                Handpicked cities ready for your next adventure
              </p>
            </div>
            <Button variant="ghost" asChild className="hidden sm:flex">
              <Link to="/destinations">
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
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
          
          <div className="mt-8 text-center sm:hidden">
            <Button variant="outline" asChild>
              <Link to="/destinations">
                View All Destinations
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
              Everything You Need to Travel Smarter
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From planning to exploring, we've got you covered
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6 text-center border-border/50 hover:border-primary/30 transition-colors">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Bot className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">AI Robo-Advisor</h3>
              <p className="text-sm text-muted-foreground">
                Get personalized recommendations and answers to all your travel questions from our AI assistant.
              </p>
            </Card>
            
            <Card className="p-6 text-center border-border/50 hover:border-primary/30 transition-colors">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-secondary/20 flex items-center justify-center">
                <Calendar className="w-7 h-7 text-secondary-foreground" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">Smart Itineraries</h3>
              <p className="text-sm text-muted-foreground">
                Create day-by-day travel plans tailored to your preferences, pace, and budget.
              </p>
            </Card>
            
            <Card className="p-6 text-center border-border/50 hover:border-primary/30 transition-colors">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-accent/30 flex items-center justify-center">
                <Users className="w-7 h-7 text-accent-foreground" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">Curated for You</h3>
              <p className="text-sm text-muted-foreground">
                Every attraction and restaurant is rated and filtered based on your travel style.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-16 lg:py-24">
          <div className="container px-4">
            <Card className="overflow-hidden bg-gradient-to-r from-primary/10 via-background to-secondary/10 border-primary/20">
              <CardContent className="p-8 md:p-12 text-center">
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
                  Ready to Plan Your Next Adventure?
                </h2>
                <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                  Join thousands of travelers who trust Itinera for smarter trip planning. It's free to get started!
                </p>
                <Button size="lg" asChild className="h-14 px-8 text-lg font-bold rounded-xl">
                  <Link to="/auth">
                    Build My Perfect Trip
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <Plane className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-semibold text-foreground">Itinera</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Itinera. Made with ❤️ for travelers everywhere.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
