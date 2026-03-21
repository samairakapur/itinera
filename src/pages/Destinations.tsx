import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCities } from '@/hooks/useCities';
import { usePersonalizedDestinations, ScoredCity } from '@/hooks/usePersonalizedDestinations';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import CityCard from '@/components/cities/CityCard';
import { DestinationFilters } from '@/components/destinations/DestinationFilters';
import { Search, MapPin, Sparkles, Heart, ArrowRight } from 'lucide-react';

// Personalized city card with match reasons
const PersonalizedCityCard = ({ city }: { city: ScoredCity }) => {
  const navigate = useNavigate();
  
  return (
    <Card 
      className="overflow-hidden cursor-pointer group hover:shadow-lg transition-all border-primary/20 hover:border-primary/40"
      onClick={() => navigate(`/city/${city.id}`)}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={city.image_url || '/placeholder.svg'}
          alt={city.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3">
          <Badge className="bg-primary/90 text-primary-foreground">
            <Heart className="w-3 h-3 mr-1" />
            Match for you
          </Badge>
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-display font-semibold text-lg mb-1">{city.name}</h3>
        <p className="text-sm text-muted-foreground mb-3">{city.country}</p>
        {city.matchReasons.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {city.matchReasons.slice(0, 2).map((reason, i) => (
              <Badge key={i} variant="secondary" className="text-xs font-normal">
                {reason}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const Destinations = () => {
  const navigate = useNavigate();
  const { data: cities, isLoading } = useCities();
  const { personalizedCities, hasPersonalization } = usePersonalizedDestinations();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');

  const filteredCities = useMemo(() => {
    if (!cities) return [];

    return cities.filter(city => {
      // Apply country filter
      if (selectedCountry !== 'all' && city.country !== selectedCountry) {
        return false;
      }

      // Apply city filter
      if (selectedCity !== 'all' && city.id !== selectedCity) {
        return false;
      }

      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          city.name.toLowerCase().includes(query) ||
          city.country.toLowerCase().includes(query) ||
          city.tags?.some(tag => tag.toLowerCase().includes(query))
        );
      }

      return true;
    });
  }, [cities, searchQuery, selectedCountry, selectedCity]);

  const handleClearFilters = () => {
    setSelectedCountry('all');
    setSelectedCity('all');
    setSearchQuery('');
  };

  // When city is directly selected from filter, navigate to it
  const handleCityFilterChange = (cityId: string) => {
    setSelectedCity(cityId);
    if (cityId !== 'all') {
      navigate(`/city/${cityId}`);
    }
  };

  const showPersonalized = hasPersonalization && !searchQuery && selectedCountry === 'all' && selectedCity === 'all';

  return (
    <div className="min-h-screen py-8">
      <div className="container px-4">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Explore Amazing Destinations
          </h1>
          <p className="text-muted-foreground mb-6">
            Discover cities perfect for your next adventure
          </p>
          
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search cities, countries, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
        </div>

        {/* Filters */}
        {cities && cities.length > 0 && (
          <div className="mb-8">
            <DestinationFilters
              cities={cities}
              selectedCountry={selectedCountry}
              selectedCity={selectedCity}
              onCountryChange={setSelectedCountry}
              onCityChange={handleCityFilterChange}
              onClearFilters={handleClearFilters}
            />
          </div>
        )}

        {/* Personalized Recommendations Section */}
        {showPersonalized && personalizedCities.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-sm bg-primary/10 border border-primary/15">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
                  We think you'll love these
                </h2>
                <p className="text-sm text-muted-foreground">
                  Personalized based on your travel preferences
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {personalizedCities.slice(0, 4).map((city) => (
                <PersonalizedCityCard key={city.id} city={city} />
              ))}
            </div>

            {personalizedCities.length > 4 && (
              <div className="mt-6 text-center">
                <Button variant="outline" size="sm">
                  View all {personalizedCities.length} personalized picks
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </section>
        )}

        {/* Call to action for non-personalized users */}
        {!hasPersonalization && !searchQuery && selectedCountry === 'all' && (
          <Card className="mb-12 p-6 bg-muted border-white/10">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="p-3 rounded-2xl bg-primary/10">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="font-display text-lg font-semibold mb-1">
                  Get personalized recommendations
                </h3>
                <p className="text-muted-foreground text-sm">
                  Complete your travel profile to see destinations matched to your interests and style
                </p>
              </div>
              <Button asChild>
                <Link to="/profile-setup">
                  Set Up Profile
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </Card>
        )}

        {/* Popular Destinations Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-sm bg-muted border border-white/8">
              <MapPin className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
                {showPersonalized ? 'All Destinations' : 'Popular Destinations'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {filteredCities.length} cities to explore
              </p>
            </div>
          </div>

          {/* Cities Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Card key={i} className="overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-muted" />
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCities.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCities.map((city) => (
                <CityCard key={city.id} city={city} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <MapPin className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">No destinations found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Destinations;
