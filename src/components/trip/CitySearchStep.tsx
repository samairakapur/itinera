import { useState, useMemo } from 'react';
import { Search, Sparkles, TrendingUp, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface City {
  id: string;
  name: string;
  country: string;
  tags?: string[] | null;
  image_url?: string | null;
}

interface TravelPreferences {
  interests?: string[];
  travelStyle?: string;
  pacePreference?: string;
}

interface CitySearchStepProps {
  cities: City[];
  userPreferences?: TravelPreferences | null;
  selectedCityId: string;
  onSelect: (cityId: string) => void;
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

export const CitySearchStep = ({
  cities,
  userPreferences,
  selectedCityId,
  onSelect,
}: CitySearchStepProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Get personalized recommendations based on user interests
  const personalizedCities = useMemo(() => {
    if (!userPreferences?.interests?.length) return [];

    const userTags = userPreferences.interests.flatMap(
      interest => INTEREST_TAG_MAP[interest] || []
    );

    return cities
      .filter(city => {
        if (!city.tags) return false;
        const cityTagsLower = city.tags.map(t => t.toLowerCase());
        return userTags.some(tag => 
          cityTagsLower.some(ct => ct.includes(tag.toLowerCase()))
        );
      })
      .slice(0, 6);
  }, [cities, userPreferences]);

  // Get popular cities
  const popularCities = useMemo(() => {
    return cities
      .filter(city => POPULAR_CITY_NAMES.includes(city.name))
      .slice(0, 6);
  }, [cities]);

  // Filter cities by search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    return cities.filter(city =>
      city.name.toLowerCase().includes(query) ||
      city.country.toLowerCase().includes(query) ||
      city.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }, [cities, searchQuery]);

  // Determine what to show
  const showSearchResults = searchQuery.trim().length > 0;
  const displayCities = showSearchResults ? searchResults : [];
  const showRecommendations = !showSearchResults && personalizedCities.length > 0;
  const showPopular = !showSearchResults;

  const CityCard = ({ city, highlight }: { city: City; highlight?: string }) => (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50",
        selectedCityId === city.id && "ring-2 ring-primary border-primary bg-primary/5"
      )}
      onClick={() => onSelect(city.id)}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          {city.image_url ? (
            <img
              src={city.image_url}
              alt={city.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground truncate">{city.name}</h4>
            <p className="text-sm text-muted-foreground">{city.country}</p>
          </div>
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
              <div className="grid gap-3 max-h-[400px] overflow-y-auto">
                {searchResults.map(city => (
                  <CityCard key={city.id} city={city} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
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
          <div className="grid gap-3">
            {personalizedCities.map(city => (
              <CityCard key={city.id} city={city} highlight="Match" />
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
          <div className="grid gap-3">
            {popularCities.map(city => (
              <CityCard key={city.id} city={city} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
