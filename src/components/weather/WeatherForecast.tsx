import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudSnow, 
  CloudLightning, 
  CloudFog,
  Wind,
  Droplets,
  Thermometer,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, addDays } from 'date-fns';

interface DayForecast {
  date: string;
  dayName: string;
  tempHigh: number;
  tempLow: number;
  weatherCode: number;
  precipitationChance: number;
  windSpeed: number;
}

interface WeatherForecastProps {
  cityName: string;
  country: string;
}

// Map WMO weather codes to icons and descriptions
const getWeatherInfo = (code: number) => {
  if (code === 0) return { icon: Sun, label: 'Clear', color: 'text-yellow-500' };
  if (code === 1 || code === 2) return { icon: Sun, label: 'Mostly Clear', color: 'text-yellow-400' };
  if (code === 3) return { icon: Cloud, label: 'Cloudy', color: 'text-gray-400' };
  if (code >= 45 && code <= 48) return { icon: CloudFog, label: 'Foggy', color: 'text-gray-500' };
  if (code >= 51 && code <= 57) return { icon: CloudRain, label: 'Drizzle', color: 'text-blue-400' };
  if (code >= 61 && code <= 67) return { icon: CloudRain, label: 'Rainy', color: 'text-blue-500' };
  if (code >= 71 && code <= 77) return { icon: CloudSnow, label: 'Snow', color: 'text-blue-200' };
  if (code >= 80 && code <= 82) return { icon: CloudRain, label: 'Showers', color: 'text-blue-600' };
  if (code >= 85 && code <= 86) return { icon: CloudSnow, label: 'Snow Showers', color: 'text-blue-300' };
  if (code >= 95 && code <= 99) return { icon: CloudLightning, label: 'Thunderstorm', color: 'text-purple-500' };
  return { icon: Cloud, label: 'Cloudy', color: 'text-gray-400' };
};

// City coordinates lookup
const cityCoordinates: Record<string, { lat: number; lon: number }> = {
  'Amsterdam': { lat: 52.3676, lon: 4.9041 },
  'Athens': { lat: 37.9838, lon: 23.7275 },
  'Auckland': { lat: -36.8485, lon: 174.7633 },
  'Bali': { lat: -8.3405, lon: 115.0920 },
  'Bangkok': { lat: 13.7563, lon: 100.5018 },
  'Barcelona': { lat: 41.3851, lon: 2.1734 },
  'Berlin': { lat: 52.5200, lon: 13.4050 },
  'Brussels': { lat: 50.8503, lon: 4.3517 },
  'Budapest': { lat: 47.4979, lon: 19.0402 },
  'Buenos Aires': { lat: -34.6037, lon: -58.3816 },
  'Cape Town': { lat: -33.9249, lon: 18.4241 },
  'Copenhagen': { lat: 55.6761, lon: 12.5683 },
  'Dubai': { lat: 25.2048, lon: 55.2708 },
  'Dublin': { lat: 53.3498, lon: -6.2603 },
  'Dubrovnik': { lat: 42.6507, lon: 18.0944 },
  'Edinburgh': { lat: 55.9533, lon: -3.1883 },
  'Helsinki': { lat: 60.1699, lon: 24.9384 },
  'Hong Kong': { lat: 22.3193, lon: 114.1694 },
  'Krakow': { lat: 50.0647, lon: 19.9450 },
  'Kyoto': { lat: 35.0116, lon: 135.7681 },
  'Lima': { lat: -12.0464, lon: -77.0428 },
  'Lisbon': { lat: 38.7223, lon: -9.1393 },
  'London': { lat: 51.5074, lon: -0.1278 },
  'Los Angeles': { lat: 34.0522, lon: -118.2437 },
  'Madrid': { lat: 40.4168, lon: -3.7038 },
  'Marrakech': { lat: 31.6295, lon: -7.9811 },
  'Melbourne': { lat: -37.8136, lon: 144.9631 },
  'Mexico City': { lat: 19.4326, lon: -99.1332 },
  'Milan': { lat: 45.4642, lon: 9.1900 },
  'Montreal': { lat: 45.5017, lon: -73.5673 },
  'Munich': { lat: 48.1351, lon: 11.5820 },
  'New York City': { lat: 40.7128, lon: -74.0060 },
  'Oslo': { lat: 59.9139, lon: 10.7522 },
  'Paris': { lat: 48.8566, lon: 2.3522 },
  'Prague': { lat: 50.0755, lon: 14.4378 },
  'Reykjavik': { lat: 64.1466, lon: -21.9426 },
  'Rio de Janeiro': { lat: -22.9068, lon: -43.1729 },
  'Rome': { lat: 41.9028, lon: 12.4964 },
  'San Francisco': { lat: 37.7749, lon: -122.4194 },
  'Seoul': { lat: 37.5665, lon: 126.9780 },
  'Singapore': { lat: 1.3521, lon: 103.8198 },
  'Stockholm': { lat: 59.3293, lon: 18.0686 },
  'Sydney': { lat: -33.8688, lon: 151.2093 },
  'Taipei': { lat: 25.0330, lon: 121.5654 },
  'Tokyo': { lat: 35.6762, lon: 139.6503 },
  'Toronto': { lat: 43.6532, lon: -79.3832 },
  'Vancouver': { lat: 49.2827, lon: -123.1207 },
  'Venice': { lat: 45.4408, lon: 12.3155 },
  'Vienna': { lat: 48.2082, lon: 16.3738 },
  'Zurich': { lat: 47.3769, lon: 8.5417 },
};

const WeatherForecast = ({ cityName, country }: WeatherForecastProps) => {
  const [forecast, setForecast] = useState<DayForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTemp, setCurrentTemp] = useState<number | null>(null);

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get coordinates for the city
      let coords = cityCoordinates[cityName];
      
      // If not found, try to geocode
      if (!coords) {
        const geoResponse = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1`
        );
        const geoData = await geoResponse.json();
        
        if (geoData.results && geoData.results.length > 0) {
          coords = { lat: geoData.results[0].latitude, lon: geoData.results[0].longitude };
        } else {
          throw new Error('City not found');
        }
      }

      // Fetch weather data from Open-Meteo
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&current=temperature_2m&timezone=auto&forecast_days=7`
      );

      if (!response.ok) throw new Error('Failed to fetch weather data');

      const data = await response.json();

      // Set current temperature
      if (data.current?.temperature_2m !== undefined) {
        setCurrentTemp(Math.round(data.current.temperature_2m));
      }

      // Parse the daily forecast
      const dailyForecast: DayForecast[] = data.daily.time.map((date: string, index: number) => ({
        date,
        dayName: index === 0 ? 'Today' : format(addDays(new Date(), index), 'EEE'),
        tempHigh: Math.round(data.daily.temperature_2m_max[index]),
        tempLow: Math.round(data.daily.temperature_2m_min[index]),
        weatherCode: data.daily.weather_code[index],
        precipitationChance: data.daily.precipitation_probability_max[index] || 0,
        windSpeed: Math.round(data.daily.wind_speed_10m_max[index]),
      }));

      setForecast(dailyForecast);
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError('Unable to load weather data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [cityName]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            Weather Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Cloud className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={fetchWeather}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const todayWeather = forecast[0];
  const weatherInfo = todayWeather ? getWeatherInfo(todayWeather.weatherCode) : null;
  const WeatherIcon = weatherInfo?.icon || Cloud;

  return (
    <div className="space-y-6">
      {/* Current Weather Card */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className={`p-4 rounded-full bg-background/80 ${weatherInfo?.color}`}>
                <WeatherIcon className="w-16 h-16" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{cityName}, {country}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold">{currentTemp ?? todayWeather?.tempHigh}°</span>
                  <span className="text-xl text-muted-foreground">C</span>
                </div>
                <p className="text-lg font-medium mt-1">{weatherInfo?.label}</p>
              </div>
            </div>
            
            {todayWeather && (
              <div className="flex gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-muted-foreground" />
                  <span>H: {todayWeather.tempHigh}° L: {todayWeather.tempLow}°</span>
                </div>
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <span>{todayWeather.precipitationChance}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-muted-foreground" />
                  <span>{todayWeather.windSpeed} km/h</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 7-Day Forecast */}
      <Card>
        <CardHeader>
          <CardTitle>7-Day Forecast</CardTitle>
          <CardDescription>Daily weather outlook for your trip planning</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            {forecast.map((day, index) => {
              const dayWeatherInfo = getWeatherInfo(day.weatherCode);
              const DayIcon = dayWeatherInfo.icon;
              
              return (
                <div
                  key={day.date}
                  className={`flex flex-col items-center p-4 rounded-xl transition-colors ${
                    index === 0 ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50 hover:bg-muted'
                  }`}
                >
                  <span className={`text-sm font-medium ${index === 0 ? 'text-primary' : ''}`}>
                    {day.dayName}
                  </span>
                  <DayIcon className={`w-10 h-10 my-3 ${dayWeatherInfo.color}`} />
                  <div className="text-center">
                    <span className="font-semibold">{day.tempHigh}°</span>
                    <span className="text-muted-foreground mx-1">/</span>
                    <span className="text-muted-foreground">{day.tempLow}°</span>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Droplets className="w-3 h-3 text-blue-500" />
                    <span>{day.precipitationChance}%</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Wind className="w-3 h-3" />
                    <span>{day.windSpeed}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeatherForecast;
