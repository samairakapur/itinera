import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Search } from 'lucide-react';

interface ManualLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLocationSet: (lat: number, lng: number, locationName?: string) => void;
}

// Popular city coordinates for quick selection
const popularCities = [
  { name: 'New York', lat: 40.7128, lng: -74.0060 },
  { name: 'London', lat: 51.5074, lng: -0.1278 },
  { name: 'Paris', lat: 48.8566, lng: 2.3522 },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
  { name: 'Amsterdam', lat: 52.3676, lng: 4.9041 },
  { name: 'Barcelona', lat: 41.3851, lng: 2.1734 },
  { name: 'Rome', lat: 41.9028, lng: 12.4964 },
];

const ManualLocationDialog = ({ open, onOpenChange, onLocationSet }: ManualLocationDialogProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  const handleCitySelect = (city: typeof popularCities[0]) => {
    onLocationSet(city.lat, city.lng, city.name);
    onOpenChange(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=1`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        onLocationSet(result.latitude, result.longitude, result.name);
        onOpenChange(false);
      } else {
        // No results found
        alert('Location not found. Please try another search or use coordinates.');
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      alert('Failed to search for location. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleManualSubmit = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      alert('Please enter valid coordinates (lat: -90 to 90, lng: -180 to 180)');
      return;
    }
    
    onLocationSet(lat, lng);
    onOpenChange(false);
  };

  const filteredCities = popularCities.filter(city =>
    city.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Set Your Location
          </DialogTitle>
          <DialogDescription>
            Search for a city or enter coordinates manually to get personalized recommendations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Search */}
          <div className="space-y-2">
            <Label>Search for a city</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter city name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={searching}>
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Quick select cities */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Quick select</Label>
            <div className="flex flex-wrap gap-2">
              {(searchQuery ? filteredCities : popularCities).map((city) => (
                <Button
                  key={city.name}
                  variant="outline"
                  size="sm"
                  onClick={() => handleCitySelect(city)}
                >
                  {city.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or enter coordinates</span>
            </div>
          </div>

          {/* Manual coordinates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lat">Latitude</Label>
              <Input
                id="lat"
                placeholder="e.g., 40.7128"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                type="number"
                step="any"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lng">Longitude</Label>
              <Input
                id="lng"
                placeholder="e.g., -74.0060"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                type="number"
                step="any"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleManualSubmit}
            disabled={!manualLat || !manualLng}
          >
            Set Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManualLocationDialog;
