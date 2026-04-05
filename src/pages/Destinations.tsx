import { useState, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCities } from '@/hooks/useCities';
import { usePersonalizedDestinations, ScoredCity } from '@/hooks/usePersonalizedDestinations';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import CityCard from '@/components/cities/CityCard';
import { DestinationFilters } from '@/components/destinations/DestinationFilters';
import { Search, MapPin, Sparkles, Heart, ArrowRight } from 'lucide-react';
import { KikoConcierge } from '@/components/destinations/KikoConcierge';

// Personalized city card
const PersonalizedCityCard = ({ city }: { city: ScoredCity }) => {
  const navigate = useNavigate();

  return (
    <div
      className="group rounded-2xl overflow-hidden bg-white border border-border shadow-card hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer"
      onClick={() => navigate(`/city/${city.id}`)}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={city.image_url || '/placeholder.svg'}
          alt={city.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="absolute top-3 left-3">
          <Badge className="bg-primary text-white text-xs font-semibold shadow-sm">
            <Heart className="w-3 h-3 mr-1" />
            Matched for you
          </Badge>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-display text-xl font-normal text-white">{city.name}</h3>
          <p className="text-white/75 text-xs mt-0.5">{city.country}</p>
        </div>
      </div>
      {city.matchReasons.length > 0 && (
        <div className="px-4 py-3 flex flex-wrap gap-1.5">
          {city.matchReasons.slice(0, 2).map((reason, i) => (
            <Badge key={i} variant="outline" className="text-xs font-normal border-border text-muted-foreground bg-muted/40">
              {reason}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

const Destinations = () => {
  const navigate = useNavigate();
  const { data: cities, isLoading } = useCities();
  const { personalizedCities, hasPersonalization } = usePersonalizedDestinations();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [showAllPersonalized, setShowAllPersonalized] = useState(false);
  const allDestinationsRef = useRef<HTMLDivElement>(null);

  const filteredCities = useMemo(() => {
    if (!cities) return [];
    return cities.filter(city => {
      if (selectedCountry !== 'all' && city.country !== selectedCountry) return false;
      if (selectedCity !== 'all' && city.id !== selectedCity) return false;
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

  const handleCityFilterChange = (cityId: string) => {
    setSelectedCity(cityId);
    if (cityId !== 'all') navigate(`/city/${cityId}`);
  };

  const showPersonalized = hasPersonalization && !searchQuery && selectedCountry === 'all' && selectedCity === 'all';

  return (
    <div className="min-h-screen bg-background">

      {/* ── Page header ── */}
      <div className="bg-white border-b border-border">
        <div className="container px-4 py-10 max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            104 destinations
          </p>
          <h1 className="font-display text-4xl md:text-5xl text-foreground mb-4" style={{ fontWeight: 400 }}>
            Where will you go next?
          </h1>
          <p className="text-muted-foreground text-lg font-light mb-8">
            Every city hand-picked for culture, food, and unforgettable moments.
          </p>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search city, country, or vibe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base rounded-xl bg-background border-border focus-visible:ring-primary/30"
            />
          </div>
        </div>
      </div>

      <div className="container px-4 py-10">
        {/* Filters */}
        {cities && cities.length > 0 && (
          <div className="mb-10">
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

        {/* Personalised picks */}
        {showPersonalized && personalizedCities.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-4.5 h-4.5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-normal text-foreground">
                  We think you'll love these
                </h2>
                <p className="text-sm text-muted-foreground">Based on your travel preferences</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {personalizedCities.slice(0, showAllPersonalized ? undefined : 4).map((city) => (
                <PersonalizedCityCard key={city.id} city={city} />
              ))}
            </div>
            {personalizedCities.length > 4 && !showAllPersonalized && (
              <div className="mt-6 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-border"
                  onClick={() => setShowAllPersonalized(true)}
                >
                  View all {personalizedCities.length} personalized picks
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </section>
        )}

        {/* Profile prompt */}
        {!hasPersonalization && !searchQuery && selectedCountry === 'all' && (
          <div className="mb-12 rounded-2xl border border-border bg-white p-6 flex flex-col md:flex-row items-center gap-6 shadow-card">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="font-display text-lg font-normal text-foreground mb-1">
                Get personalised recommendations
              </h3>
              <p className="text-muted-foreground text-sm font-light">
                Complete your travel profile and we'll match destinations to your style and interests.
              </p>
            </div>
            <Button asChild className="rounded-xl shadow-warm shrink-0">
              <Link to="/profile-setup">
                Set up profile
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        )}

        {/* All destinations */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-2xl font-normal text-foreground">
                {showPersonalized ? 'All destinations' : 'Popular destinations'}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {filteredCities.length} {filteredCities.length === 1 ? 'city' : 'cities'} to explore
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="rounded-2xl overflow-hidden bg-white border border-border shadow-card animate-pulse">
                  <div className="aspect-[4/3] bg-muted" />
                  <div className="p-4">
                    <div className="h-4 bg-muted rounded-lg w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded-lg w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCities.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredCities.map((city) => (
                <CityCard key={city.id} city={city} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <MapPin className="w-7 h-7 text-muted-foreground/50" />
              </div>
              <h3 className="font-display text-xl font-normal text-foreground mb-2">No destinations found</h3>
              <p className="text-muted-foreground text-sm">
                Try adjusting your search or clearing the filters
              </p>
              <Button variant="outline" size="sm" onClick={handleClearFilters} className="mt-4 rounded-xl border-border">
                Clear filters
              </Button>
            </div>
          )}
        </section>
      </div>

      {/* Kiko — floating destination guide chatbot */}
      <KikoConcierge />
    </div>
  );
};

export default Destinations;
