import { useState, useMemo } from 'react';
import { Search, MapPin, X, Plus, GripVertical, Sparkles, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface City {
  id: string;
  name: string;
  country: string;
  tags?: string[] | null;
  image_url?: string | null;
}

interface SelectedCity {
  cityId: string;
  daysToSpend: number;
}

interface TravelPreferences {
  interests?: string[];
  travelStyle?: string;
  pacePreference?: string;
}

interface MultiCitySelectorProps {
  cities: City[];
  userPreferences?: TravelPreferences | null;
  selectedCities: SelectedCity[];
  onSelectionChange: (cities: SelectedCity[]) => void;
}

// Popular destinations (curated list)
const POPULAR_CITY_NAMES = [
  'Paris', 'Tokyo', 'Barcelona', 'Rome', 'London', 
  'New York', 'Amsterdam', 'Prague', 'Lisbon', 'Vienna'
];

// Interest to tag mapping for personalization
const INTEREST_TAG_MAP: Record<string, string[]> = {
  food: ['food', 'culinary', 'foodie', 'gastronomy'],
  culture: ['culture', 'history', 'historic', 'heritage', 'museums'],
  nature: ['nature', 'outdoors', 'hiking', 'beaches', 'scenic'],
  shopping: ['shopping', 'markets', 'boutiques'],
  art: ['art', 'museums', 'galleries', 'architecture'],
  'theme-parks': ['theme parks', 'family', 'entertainment'],
  nightlife: ['nightlife', 'bars', 'clubs', 'entertainment'],
  'hidden-gems': ['off-the-beaten-path', 'local', 'authentic'],
  highlights: ['iconic', 'landmarks', 'must-see'],
};

export const MultiCitySelector = ({
  cities,
  userPreferences,
  selectedCities,
  onSelectionChange,
}: MultiCitySelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Get personalized recommendations based on user interests
  const personalizedCities = useMemo(() => {
    if (!userPreferences?.interests?.length) return [];

    const userTags = userPreferences.interests.flatMap(
      interest => INTEREST_TAG_MAP[interest] || []
    );

    return cities
      .filter(city => {
        // Exclude already selected cities
        if (selectedCities.some(sc => sc.cityId === city.id)) return false;
        if (!city.tags) return false;
        const cityTagsLower = city.tags.map(t => t.toLowerCase());
        return userTags.some(tag => 
          cityTagsLower.some(ct => ct.includes(tag.toLowerCase()))
        );
      })
      .slice(0, 6);
  }, [cities, userPreferences, selectedCities]);

  // Get popular cities
  const popularCities = useMemo(() => {
    return cities
      .filter(city => 
        POPULAR_CITY_NAMES.includes(city.name) &&
        !selectedCities.some(sc => sc.cityId === city.id)
      )
      .slice(0, 6);
  }, [cities, selectedCities]);

  // Filter cities by search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    return cities.filter(city =>
      !selectedCities.some(sc => sc.cityId === city.id) && (
        city.name.toLowerCase().includes(query) ||
        city.country.toLowerCase().includes(query) ||
        city.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    );
  }, [cities, searchQuery, selectedCities]);

  const handleAddCity = (cityId: string) => {
    onSelectionChange([...selectedCities, { cityId, daysToSpend: 2 }]);
    setSearchQuery('');
  };

  const handleRemoveCity = (cityId: string) => {
    onSelectionChange(selectedCities.filter(sc => sc.cityId !== cityId));
  };

  const handleUpdateDays = (cityId: string, days: number) => {
    onSelectionChange(
      selectedCities.map(sc => 
        sc.cityId === cityId ? { ...sc, daysToSpend: Math.max(1, Math.min(14, days)) } : sc
      )
    );
  };

  const moveCity = (fromIndex: number, toIndex: number) => {
    const newSelection = [...selectedCities];
    const [moved] = newSelection.splice(fromIndex, 1);
    newSelection.splice(toIndex, 0, moved);
    onSelectionChange(newSelection);
  };

  const getCityById = (id: string) => cities.find(c => c.id === id);

  // Determine what to show
  const showSearchResults = searchQuery.trim().length > 0;
  const displayCities = showSearchResults ? searchResults : [];
  const showRecommendations = !showSearchResults && personalizedCities.length > 0;
  const showPopular = !showSearchResults;

  const CityOption = ({ city, highlight }: { city: City; highlight?: string }) => (
    <Card
      className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50"
      onClick={() => handleAddCity(city.id)}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          {city.image_url ? (
            <img
              src={city.image_url}
              alt={city.name}
              className="w-10 h-10 rounded-lg object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
              <MapPin className="w-4 h-4 text-primary-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground truncate text-sm">{city.name}</h4>
            <p className="text-xs text-muted-foreground">{city.country}</p>
          </div>
          <Plus className="w-4 h-4 text-muted-foreground" />
          {highlight && (
            <Badge variant="secondary" className="text-xs shrink-0">
              {highlight}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Selected Cities List */}
      {selectedCities.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">Your Trip Route</h3>
            <span className="text-xs text-muted-foreground">
              {selectedCities.reduce((sum, sc) => sum + sc.daysToSpend, 0)} days total
            </span>
          </div>
          <div className="space-y-2">
            {selectedCities.map((sc, index) => {
              const city = getCityById(sc.cityId);
              if (!city) return null;
              
              return (
                <Card key={sc.cityId} className="border-primary/30 bg-primary/5">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <GripVertical className="w-4 h-4" />
                        <Badge variant="outline" className="text-xs px-1.5">
                          Leg {index + 1}
                        </Badge>
                      </div>
                      {city.image_url ? (
                        <img
                          src={city.image_url}
                          alt={city.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground truncate text-sm">
                          {city.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">{city.country}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleUpdateDays(sc.cityId, sc.daysToSpend - 1)}
                          disabled={sc.daysToSpend <= 1}
                        >
                          -
                        </Button>
                        <span className="text-sm font-medium w-12 text-center">
                          {sc.daysToSpend} {sc.daysToSpend === 1 ? 'day' : 'days'}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleUpdateDays(sc.cityId, sc.daysToSpend + 1)}
                          disabled={sc.daysToSpend >= 14}
                        >
                          +
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveCity(sc.cityId)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    {index < selectedCities.length - 1 && (
                      <div className="flex items-center gap-2 mt-2 ml-6">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-muted-foreground h-6 px-2"
                          onClick={() => moveCity(index, index + 1)}
                        >
                          ↓ Move down
                        </Button>
                      </div>
                    )}
                    {index > 0 && (
                      <div className="flex items-center gap-2 mt-2 ml-6">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-muted-foreground h-6 px-2"
                          onClick={() => moveCity(index, index - 1)}
                        >
                          ↑ Move up
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Add More Cities Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">
          {selectedCities.length > 0 ? 'Add Another City' : 'Select Your First City'}
        </h3>
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search cities, countries, or interests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        {/* Search Results */}
        {showSearchResults && (
          <div className="space-y-3">
            {searchResults.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground">
                  {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
                </p>
                <div className="grid gap-2 max-h-[300px] overflow-y-auto">
                  {searchResults.slice(0, 10).map(city => (
                    <CityOption key={city.id} city={city} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No cities found for "{searchQuery}"</p>
              </div>
            )}
          </div>
        )}

        {/* Personalized Recommendations */}
        {showRecommendations && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Recommended for You</span>
            </div>
            <div className="grid gap-2">
              {personalizedCities.slice(0, 4).map(city => (
                <CityOption key={city.id} city={city} highlight="Match" />
              ))}
            </div>
          </div>
        )}

        {/* Popular Destinations */}
        {showPopular && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span>Popular Destinations</span>
            </div>
            <div className="grid gap-2">
              {popularCities.slice(0, 4).map(city => (
                <CityOption key={city.id} city={city} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
