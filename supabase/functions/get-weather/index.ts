import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ---------------------------------------------------------------------------
// get-weather — Supabase Edge Function
//
// Uses Open-Meteo (https://open-meteo.com) — completely free, no API key.
// Falls back to the Open-Meteo geocoding API when only a city name is given.
// ---------------------------------------------------------------------------

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// WMO Weather interpretation codes → human-readable + icon slug
function describeWeatherCode(code: number): {
  main: string;
  description: string;
  icon: string;
} {
  if (code === 0)  return { main: "Clear",        description: "Clear sky",          icon: "01d" };
  if (code <= 2)   return { main: "Partly Cloudy", description: "Partly cloudy",      icon: "02d" };
  if (code === 3)  return { main: "Cloudy",        description: "Overcast",            icon: "04d" };
  if (code <= 48)  return { main: "Fog",           description: "Foggy",               icon: "50d" };
  if (code <= 57)  return { main: "Drizzle",       description: "Light drizzle",       icon: "09d" };
  if (code <= 67)  return { main: "Rain",          description: "Rain",                icon: "10d" };
  if (code <= 77)  return { main: "Snow",          description: "Snowfall",            icon: "13d" };
  if (code <= 82)  return { main: "Showers",       description: "Rain showers",        icon: "09d" };
  if (code <= 86)  return { main: "Snow Showers",  description: "Snow showers",        icon: "13d" };
  if (code <= 99)  return { main: "Thunderstorm",  description: "Thunderstorm",        icon: "11d" };
  return                  { main: "Unknown",       description: "Unknown conditions",  icon: "01d" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    let { lat, lon, city } = body as {
      lat?: number;
      lon?: number;
      city?: string;
    };

    // ── Geocode city name if coordinates not provided ──────────────────────
    if (city && (lat == null || lon == null)) {
      const geoUrl =
        `https://geocoding-api.open-meteo.com/v1/search` +
        `?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

      const geoRes = await fetch(geoUrl);
      if (!geoRes.ok) throw new Error(`Geocoding failed: ${geoRes.status}`);

      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) {
        throw new Error(`City not found: ${city}`);
      }

      lat = geoData.results[0].latitude;
      lon = geoData.results[0].longitude;
    }

    if (lat == null || lon == null) {
      return new Response(
        JSON.stringify({
          error: "Provide lat/lon coordinates or a city name",
          current: null,
          daily: [],
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Fetch 7-day forecast from Open-Meteo (no key required) ────────────
    const forecastUrl =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,` +
      `precipitation_probability_max,wind_speed_10m_max,sunrise,sunset` +
      `&timezone=auto&forecast_days=7`;

    const weatherRes = await fetch(forecastUrl);
    if (!weatherRes.ok) {
      throw new Error(`Open-Meteo error: ${weatherRes.status}`);
    }

    const weatherData = await weatherRes.json();

    // ── Current conditions ─────────────────────────────────────────────────
    const curr = weatherData.current ?? {};
    const currCode: number = curr.weather_code ?? 0;

    const current = {
      temp: Math.round(curr.temperature_2m ?? 0),
      feels_like: Math.round(curr.apparent_temperature ?? curr.temperature_2m ?? 0),
      humidity: Math.round(curr.relative_humidity_2m ?? 0),
      weather: [describeWeatherCode(currCode)],
    };

    // ── 7-day daily forecast ───────────────────────────────────────────────
    const daily = (weatherData.daily?.time ?? []).map(
      (date: string, i: number) => {
        const code: number = weatherData.daily.weather_code[i] ?? 0;
        return {
          dt: Math.floor(new Date(date).getTime() / 1000), // unix timestamp
          temp: {
            min: Math.round(weatherData.daily.temperature_2m_min[i] ?? 0),
            max: Math.round(weatherData.daily.temperature_2m_max[i] ?? 0),
          },
          weather: [describeWeatherCode(code)],
          pop: (weatherData.daily.precipitation_probability_max[i] ?? 0) / 100,
          wind_speed: Math.round(weatherData.daily.wind_speed_10m_max[i] ?? 0),
          sunrise: weatherData.daily.sunrise?.[i] ?? null,
          sunset: weatherData.daily.sunset?.[i] ?? null,
        };
      }
    );

    return new Response(
      JSON.stringify({ current, daily, source: "open-meteo" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("get-weather error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Failed to fetch weather",
        current: null,
        daily: [],
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
