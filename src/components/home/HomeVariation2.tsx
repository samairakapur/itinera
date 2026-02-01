// Variation 2: Bold & Engaging - Booking.com inspired
// Strong colors, urgency, social proof, multiple CTAs

import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCities } from '@/hooks/useCities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import CityCard from '@/components/cities/CityCard';
import { 
  Plane, 
  MapPin, 
  Calendar, 
  Bot, 
  Star,
  Users,
  CheckCircle2,
  ArrowRight,
  Zap
} from 'lucide-react';

const HomeVariation2 = () => {
  const { user } = useAuth();
  const { data: cities, isLoading } = useCities();
  const featuredCities = cities?.slice(0, 4) || [];

  return (
    <div className="min-h-screen">
      {/* Hero - Bold with urgency */}
      <section className="relative py-16 lg:py-24 overflow-hidden bg-gradient-to-b from-primary/5 to-background">
        <div className="container px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left - Content */}
              <div>
                <Badge variant="secondary" className="mb-4 px-4 py-2 text-sm font-semibold">
                  <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                  2,500+ trips planned this month
                </Badge>
                
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                  Build Your
                  <br />
                  <span className="text-primary">Perfect Trip</span>
                  <br />
                  in 60 Seconds
                </h1>
                
                <ul className="space-y-3 mb-8">
                  {[
                    'AI creates your personalized itinerary',
                    'Matches your pace, budget & interests',
                    'Real-time recommendations'
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-lg text-muted-foreground">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    size="lg" 
                    asChild 
                    className="h-14 px-8 text-lg font-bold rounded-xl bg-primary hover:bg-primary/90"
                  >
                    <Link to={user ? "/planner/new" : "/auth"}>
                      <Calendar className="w-5 h-5 mr-2" />
                      Start Planning Now
                    </Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    asChild 
                    className="h-14 px-8 text-lg rounded-xl"
                  >
                    <Link to="/destinations">
                      <MapPin className="w-5 h-5 mr-2" />
                      Browse Destinations
                    </Link>
                  </Button>
                </div>
                
                {/* Social proof */}
                <div className="flex items-center gap-6 mt-8 pt-8 border-t border-border/50">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-10 h-10 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                        <Users className="w-4 h-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-yellow-500">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">Trusted by 10,000+ travelers</p>
                  </div>
                </div>
              </div>
              
              {/* Right - Featured card */}
              <div className="relative">
                <Card className="overflow-hidden border-2 border-primary/20 shadow-2xl">
                  <div className="aspect-[4/3] bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <div className="text-center p-8">
                      <Bot className="w-20 h-20 mx-auto mb-4 text-primary" />
                      <h3 className="font-display text-2xl font-bold mb-2">AI Trip Planner</h3>
                      <p className="text-muted-foreground">Answer a few questions, get a perfect itinerary</p>
                    </div>
                  </div>
                </Card>
                <div className="absolute -bottom-4 -right-4 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold shadow-lg">
                  100% Free
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="py-8 bg-primary text-primary-foreground">
        <div className="container px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold">50+</div>
              <div className="text-sm opacity-90">Cities</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold">500+</div>
              <div className="text-sm opacity-90">Attractions</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold">1000+</div>
              <div className="text-sm opacity-90">Restaurants</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold">AI</div>
              <div className="text-sm opacity-90">Powered</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured cities */}
      <section className="py-16 lg:py-24">
        <div className="container px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold">Trending Destinations</h2>
              <p className="text-muted-foreground">Popular picks from fellow travelers</p>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/destinations">
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
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
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="container px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Ready to Plan Your Adventure?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
            Join thousands who've discovered their perfect trip with Itinera
          </p>
          <Button 
            size="lg" 
            variant="secondary" 
            asChild 
            className="h-14 px-10 text-lg font-bold rounded-xl"
          >
            <Link to={user ? "/planner/new" : "/auth"}>
              Build My Perfect Trip
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default HomeVariation2;
