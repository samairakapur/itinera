import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCities } from '@/hooks/useCities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import CityCard from '@/components/cities/CityCard';
import { 
  Plane, 
  MapPin, 
  Calendar, 
  Bot, 
  ChevronRight,
  Sparkles,
  Users,
  Star
} from 'lucide-react';

const Home = () => {
  const { user } = useAuth();
  const { data: cities, isLoading } = useCities();

  const featuredCities = cities?.slice(0, 4) || [];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-20 lg:py-32">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-1/4 -left-1/4 w-96 h-96 rounded-full bg-secondary/10 blur-3xl" />
        </div>
        
        <div className="container relative px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered Family Travel Planning
            </div>
            
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Plan Your Perfect{' '}
              <span className="text-transparent bg-clip-text bg-gradient-primary">
                Family Adventure
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Discover family-friendly destinations, create personalized itineraries, and get AI-powered recommendations for unforgettable trips with your loved ones.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="text-base">
                <Link to="/destinations">
                  <MapPin className="w-5 h-5 mr-2" />
                  Explore Destinations
                </Link>
              </Button>
              {!user ? (
                <Button size="lg" variant="outline" asChild className="text-base">
                  <Link to="/auth">
                    Get Started Free
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              ) : (
                <Button size="lg" variant="outline" asChild className="text-base">
                  <Link to="/planner">
                    <Calendar className="w-5 h-5 mr-2" />
                    Create Itinerary
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-border/50 bg-muted/30">
        <div className="container px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="font-display text-3xl md:text-4xl font-bold text-primary mb-1">8+</div>
              <div className="text-sm text-muted-foreground">Cities</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl md:text-4xl font-bold text-primary mb-1">100+</div>
              <div className="text-sm text-muted-foreground">Attractions</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl md:text-4xl font-bold text-primary mb-1">200+</div>
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
                Family-friendly cities handpicked for your next adventure
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
              Everything You Need for Family Travel
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From planning to exploring, we've got your family covered
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
                Create day-by-day travel plans tailored to your family's preferences, pace, and budget.
              </p>
            </Card>
            
            <Card className="p-6 text-center border-border/50 hover:border-primary/30 transition-colors">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-accent/30 flex items-center justify-center">
                <Users className="w-7 h-7 text-accent-foreground" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">Family-First Content</h3>
              <p className="text-sm text-muted-foreground">
                Every attraction and restaurant is rated for family-friendliness with kids' menu info.
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
                  Ready to Plan Your Next Family Trip?
                </h2>
                <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                  Join thousands of families who trust TravelBuddy for their vacation planning. It's free to get started!
                </p>
                <Button size="lg" asChild>
                  <Link to="/auth">
                    Create Free Account
                    <ChevronRight className="w-5 h-5 ml-2" />
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
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Plane className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-semibold text-foreground">TravelBuddy</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 TravelBuddy. Made with ❤️ for families.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
