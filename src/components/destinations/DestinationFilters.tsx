import { useMemo } from 'react';
import { Filter, MapPin, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { City } from '@/hooks/useCities';

interface DestinationFiltersProps {
  cities: City[];
  selectedCountry: string;
  selectedCity: string;
  onCountryChange: (country: string) => void;
  onCityChange: (city: string) => void;
  onClearFilters: () => void;
}

export const DestinationFilters = ({
  cities,
  selectedCountry,
  selectedCity,
  onCountryChange,
  onCityChange,
  onClearFilters,
}: DestinationFiltersProps) => {
  // Get unique countries sorted alphabetically
  const countries = useMemo(() => {
    const countrySet = new Set(cities.map(c => c.country));
    return Array.from(countrySet).sort();
  }, [cities]);

  // Get cities filtered by selected country
  const filteredCities = useMemo(() => {
    if (!selectedCountry || selectedCountry === 'all') {
      return cities.sort((a, b) => a.name.localeCompare(b.name));
    }
    return cities
      .filter(c => c.country === selectedCountry)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [cities, selectedCountry]);

  const hasActiveFilters = selectedCountry !== 'all' || selectedCity !== 'all';
  const activeFilterCount = [selectedCountry !== 'all', selectedCity !== 'all'].filter(Boolean).length;

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="w-4 h-4" />
        <span>Filter by:</span>
      </div>

      <div className="flex flex-wrap gap-3">
        {/* Country Filter */}
        <Select value={selectedCountry} onValueChange={onCountryChange}>
          <SelectTrigger className="w-[180px] h-9">
            <Globe className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="All Countries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {countries.map(country => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* City Filter */}
        <Select value={selectedCity} onValueChange={onCityChange}>
          <SelectTrigger className="w-[180px] h-9">
            <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="All Cities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            {filteredCities.map(city => (
              <SelectItem key={city.id} value={city.id}>
                {city.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-9 text-muted-foreground"
          >
            Clear
            <Badge variant="secondary" className="ml-2 h-5 px-1.5">
              {activeFilterCount}
            </Badge>
          </Button>
        )}
      </div>
    </div>
  );
};
