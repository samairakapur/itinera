import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCities } from '@/hooks/useCities';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import CityCard from '@/components/cities/CityCard';
import { DestinationFilters } from '@/components/destinations/DestinationFilters';
import { Search, MapPin } from 'lucide-react';

const Destinations = () => {
  const navigate = useNavigate();
  const { data: cities, isLoading } = useCities();
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
      </div>
    </div>
  );
};

export default Destinations;
