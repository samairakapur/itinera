import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeatherData {
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    weather: { main: string; description: string; icon: string }[];
  };
  daily: {
    dt: number;
    temp: { min: number; max: number };
    weather: { main: string; description: string; icon: string }[];
    pop: number;
  }[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { lat, lon, city } = await req.json();
    
    const apiKey = Deno.env.get('OPENWEATHERMAP_API_KEY');
    if (!apiKey) {
      console.error('OPENWEATHERMAP_API_KEY not configured');
      throw new Error('Weather API not configured');
    }

    let latitude = lat;
    let longitude = lon;

    // If city name provided instead of coordinates, geocode it first
    if (city && (!lat || !lon)) {
      console.log(`Geocoding city: ${city}`);
      const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${apiKey}`;
      const geoResponse = await fetch(geoUrl);
      
      if (!geoResponse.ok) {
        throw new Error(`Geocoding failed: ${geoResponse.status}`);
      }
      
      const geoData = await geoResponse.json();
      if (!geoData || geoData.length === 0) {
        throw new Error(`City not found: ${city}`);
      }
      
      latitude = geoData[0].lat;
      longitude = geoData[0].lon;
      console.log(`Geocoded ${city} to lat: ${latitude}, lon: ${longitude}`);
    }

    if (!latitude || !longitude) {
      throw new Error('Location coordinates required');
    }

    // Fetch 7-day forecast using One Call API 3.0
    console.log(`Fetching weather for lat: ${latitude}, lon: ${longitude}`);
    const weatherUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&exclude=minutely,hourly,alerts&units=metric&appid=${apiKey}`;
    
    const weatherResponse = await fetch(weatherUrl);
    
    if (!weatherResponse.ok) {
      const errorText = await weatherResponse.text();
      console.error(`Weather API error: ${weatherResponse.status} - ${errorText}`);
      
      // Fallback to free API if One Call fails
      console.log('Falling back to free weather API');
      const fallbackUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;
      const fallbackResponse = await fetch(fallbackUrl);
      
      if (!fallbackResponse.ok) {
        throw new Error(`Weather API fallback failed: ${fallbackResponse.status}`);
      }
      
      const fallbackData = await fallbackResponse.json();
      
      // Transform 5-day/3-hour forecast to daily format
      const dailyMap = new Map();
      fallbackData.list.forEach((item: any) => {
        const date = new Date(item.dt * 1000).toDateString();
        if (!dailyMap.has(date)) {
          dailyMap.set(date, {
            dt: item.dt,
            temp: { min: item.main.temp_min, max: item.main.temp_max },
            weather: item.weather,
            pop: item.pop || 0,
          });
        } else {
          const existing = dailyMap.get(date);
          existing.temp.min = Math.min(existing.temp.min, item.main.temp_min);
          existing.temp.max = Math.max(existing.temp.max, item.main.temp_max);
        }
      });
      
      const daily = Array.from(dailyMap.values()).slice(0, 7);
      
      return new Response(
        JSON.stringify({
          current: {
            temp: fallbackData.list[0].main.temp,
            feels_like: fallbackData.list[0].main.feels_like,
            humidity: fallbackData.list[0].main.humidity,
            weather: fallbackData.list[0].weather,
          },
          daily,
          source: 'openweathermap-fallback',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const weatherData: WeatherData = await weatherResponse.json();
    console.log('Weather data fetched successfully');

    return new Response(
      JSON.stringify({
        current: weatherData.current,
        daily: weatherData.daily.slice(0, 7),
        source: 'openweathermap',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-weather function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to fetch weather',
        current: null,
        daily: [],
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
