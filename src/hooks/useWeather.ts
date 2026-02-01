import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface WeatherCondition {
  main: string;
  description: string;
  icon: string;
}

interface CurrentWeather {
  temp: number;
  feels_like: number;
  humidity: number;
  weather: WeatherCondition[];
}

interface DailyForecast {
  dt: number;
  temp: { min: number; max: number };
  weather: WeatherCondition[];
  pop: number;
}

interface WeatherResponse {
  current: CurrentWeather | null;
  daily: DailyForecast[];
  source?: string;
  error?: string;
}

export const useWeather = (city: string | undefined) => {
  return useQuery({
    queryKey: ['weather', city],
    queryFn: async (): Promise<WeatherResponse> => {
      if (!city) throw new Error('City is required');

      const { data, error } = await supabase.functions.invoke('get-weather', {
        body: { city },
      });

      if (error) {
        console.error('Weather fetch error:', error);
        throw error;
      }

      return data as WeatherResponse;
    },
    enabled: !!city,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    retry: 1,
  });
};

// Helper to get weather icon URL
export const getWeatherIconUrl = (icon: string) => {
  return `https://openweathermap.org/img/wn/${icon}@2x.png`;
};

// Helper to format temperature
export const formatTemp = (temp: number, unit: 'C' | 'F' = 'C') => {
  if (unit === 'F') {
    return `${Math.round((temp * 9/5) + 32)}°F`;
  }
  return `${Math.round(temp)}°C`;
};
