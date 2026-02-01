// Variation 5: App-Style Hero - Spotify/Notion inspired
// Feature showcase, testimonial-forward, product-focused

import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCities } from '@/hooks/useCities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import CityCard from '@/components/cities/CityCard';
import { 
  ArrowRight, 
  Calendar, 
  MapPin, 
  Sparkles, 
  Clock,
  DollarSign,
  Utensils,
  Sun
} from 'lucide-react';

const HomeVariation5 = () => {
  const { user } = useAuth();
  const { data: cities, isLoading } = useCities();
  const featuredCities = cities?.slice(0, 4) || [];

  const features = [
    { icon: Calendar, label: 'Day-by-day plans', color: 'text-blue-500' },
    { icon: MapPin, label: 'Top attractions', color: 'text-green-500' },
    { icon: Utensils, label: 'Restaurant picks', color: 'text-orange-500' },
    { icon: Sun, label: 'Weather insights', color: 'text-yellow-500' },
    { icon: Clock, label: 'Time optimization', color: 'text-purple-500' },
    { icon: DollarSign, label: 'Budget tracking', color: 'text-emerald-500' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero - Product showcase */}
      <section className="relative py-16 lg:py-24 overflow-hidden">
        <div className="container px-4">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left - Content */}
            <div className="order-2 lg:order-1">
              <Badge className="mb-6 px-3 py-1">
                <Sparkles className="w-3 h-3 mr-1" />
                AI-Powered
              </Badge>
              
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                The smartest way to
                <span className="block text-primary">plan your trip</span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Tell us how you like to travel. Our AI builds a personalized itinerary 
                with attractions, restaurants, and timing—all matched to your style.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Button 
                  size="lg" 
                  asChild 
                  className="h-14 px-8 text-lg font-semibold rounded-xl"
                >
                  <Link to={user ? "/planner/new" : "/auth"}>
                    Plan My Trip Now
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button 
                  variant="ghost" 
                  size="lg" 
                  asChild 
                  className="h-14 px-8 text-lg rounded-xl"
                >
                  <Link to="/destinations">
                    Explore Destinations
                  </Link>
                </Button>
              </div>
              
              {/* Feature pills */}
              <div className="flex flex-wrap gap-3">
                {features.map((feature, i) => (
                  <div 
                    key={i} 
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-sm"
                  >
                    <feature.icon className={`w-4 h-4 ${feature.color}`} />
                    {feature.label}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Right - Product preview */}
            <div className="order-1 lg:order-2 relative">
              <div className="relative">
                {/* Main card */}
                <Card className="overflow-hidden shadow-2xl">
                  <div className="bg-gradient-to-br from-primary/5 to-secondary/5 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold">Paris Adventure</div>
                        <div className="text-sm text-muted-foreground">5 days • March 2025</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {[
                        { time: '9:00 AM', activity: 'Eiffel Tower', type: 'Attraction' },
                        { time: '12:30 PM', activity: 'Le Marais Lunch', type: 'Restaurant' },
                        { time: '3:00 PM', activity: 'Louvre Museum', type: 'Attraction' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-background/80">
                          <span className="text-xs font-mono text-muted-foreground w-16">{item.time}</span>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{item.activity}</div>
                            <div className="text-xs text-muted-foreground">{item.type}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
                
                {/* Floating badge */}
                <div className="absolute -bottom-4 -left-4 bg-green-500 text-white px-4 py-2 rounded-xl font-medium text-sm shadow-lg">
                  ✓ Personalized for you
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof strip */}
      <section className="py-8 border-y border-border/50 bg-muted/30">
        <div className="container px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 text-center">
            <div>
              <div className="text-2xl font-bold text-foreground">10K+</div>
              <div className="text-sm text-muted-foreground">Trips planned</div>
            </div>
            <div className="h-8 w-px bg-border hidden md:block" />
            <div>
              <div className="text-2xl font-bold text-foreground">50+</div>
              <div className="text-sm text-muted-foreground">Cities</div>
            </div>
            <div className="h-8 w-px bg-border hidden md:block" />
            <div>
              <div className="text-2xl font-bold text-foreground">4.9★</div>
              <div className="text-sm text-muted-foreground">User rating</div>
            </div>
            <div className="h-8 w-px bg-border hidden md:block" />
            <div>
              <div className="text-2xl font-bold text-foreground">Free</div>
              <div className="text-sm text-muted-foreground">To use</div>
            </div>
          </div>
        </div>
      </section>

      {/* Destinations */}
      <section className="py-16 lg:py-24">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Start with a destination
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Browse our curated collection of cities, or let us recommend one based on your preferences
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
                View All 50+ Destinations
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5">
        <div className="container px-4">
          <Card className="max-w-4xl mx-auto overflow-hidden">
            <CardContent className="p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
                    Ready to plan smarter?
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Create your first personalized itinerary in under 2 minutes. 
                    No signup required to start.
                  </p>
                  <Button 
                    size="lg" 
                    asChild 
                    className="h-14 px-8 text-lg font-semibold rounded-xl"
                  >
                    <Link to={user ? "/planner/new" : "/auth"}>
                      Build My Perfect Trip
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                </div>
                <div className="hidden md:flex items-center justify-center">
                  <div className="text-8xl">🗺️</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default HomeVariation5;
