import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TravelPreferences {
  ageRange?: string;
  travelGroupTypes?: string[];
  fitnessLevel?: string;
  walkingTolerance?: string;
  crowdComfort?: string;
  pacePreference?: string;
  indoorOutdoor?: string;
  interests?: string[];
  scheduleFlexibility?: string;
  dailyBudget?: string;
  valuePremiumSlider?: number;
  diningSpendLevel?: string;
  preferredCuisines?: string[];
  dietaryRestrictions?: string[];
  willingnessToTryNew?: string;
  diningStyle?: string;
}

interface ItineraryRequest {
  cityName: string;
  countryName: string;
  numDays: number;
  travelStyle: string;
  budgetLevel: string;
  pace: string;
  dietaryPreferences: string[];
  userPreferences: TravelPreferences | null;
  cityDescription?: string;
}

async function fetchWeather(cityName: string): Promise<string> {
  try {
    // Using Open-Meteo (free, no API key required)
    // First geocode the city
    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1`
    );
    const geoData = await geoResponse.json();
    
    if (!geoData.results || geoData.results.length === 0) {
      return "Weather data unavailable";
    }
    
    const { latitude, longitude } = geoData.results[0];
    
    // Get 7-day forecast
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=auto&forecast_days=7`
    );
    const weatherData = await weatherResponse.json();
    
    if (!weatherData.daily) {
      return "Weather data unavailable";
    }
    
    const weatherCodes: Record<number, string> = {
      0: "Clear sky",
      1: "Mainly clear",
      2: "Partly cloudy",
      3: "Overcast",
      45: "Foggy",
      48: "Depositing rime fog",
      51: "Light drizzle",
      53: "Moderate drizzle",
      55: "Dense drizzle",
      61: "Slight rain",
      63: "Moderate rain",
      65: "Heavy rain",
      71: "Slight snow",
      73: "Moderate snow",
      75: "Heavy snow",
      80: "Slight rain showers",
      81: "Moderate rain showers",
      82: "Violent rain showers",
      95: "Thunderstorm",
    };
    
    const forecast = weatherData.daily.time.map((date: string, i: number) => {
      const maxTemp = Math.round(weatherData.daily.temperature_2m_max[i]);
      const minTemp = Math.round(weatherData.daily.temperature_2m_min[i]);
      const precipProb = weatherData.daily.precipitation_probability_max[i];
      const code = weatherData.daily.weathercode[i];
      const condition = weatherCodes[code] || "Variable";
      
      return `${date}: ${condition}, ${minTemp}°C - ${maxTemp}°C, ${precipProb}% chance of rain`;
    }).join('\n');
    
    return forecast;
  } catch (error) {
    console.error('Weather fetch error:', error);
    return "Weather data unavailable";
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      cityName,
      countryName,
      numDays,
      travelStyle,
      budgetLevel,
      pace,
      dietaryPreferences,
      userPreferences,
      cityDescription
    }: ItineraryRequest = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Fetch weather for the city
    const weatherForecast = await fetchWeather(cityName);
    console.log('Weather forecast:', weatherForecast);

    // Build user profile context
    let userProfileContext = "";
    if (userPreferences) {
      const parts = [];
      
      if (userPreferences.ageRange) parts.push(`Age range: ${userPreferences.ageRange}`);
      if (userPreferences.travelGroupTypes?.length) parts.push(`Travel group: ${userPreferences.travelGroupTypes.join(', ')}`);
      if (userPreferences.fitnessLevel) parts.push(`Fitness level: ${userPreferences.fitnessLevel}`);
      if (userPreferences.walkingTolerance) parts.push(`Walking tolerance: ${userPreferences.walkingTolerance}`);
      if (userPreferences.crowdComfort) parts.push(`Crowd comfort: ${userPreferences.crowdComfort}`);
      if (userPreferences.pacePreference) parts.push(`Pace preference: ${userPreferences.pacePreference}`);
      if (userPreferences.indoorOutdoor) parts.push(`Indoor/Outdoor: ${userPreferences.indoorOutdoor}`);
      if (userPreferences.interests?.length) parts.push(`Interests: ${userPreferences.interests.join(', ')}`);
      if (userPreferences.scheduleFlexibility) parts.push(`Schedule flexibility: ${userPreferences.scheduleFlexibility}`);
      if (userPreferences.dailyBudget) parts.push(`Daily budget: ${userPreferences.dailyBudget}`);
      if (userPreferences.diningSpendLevel) parts.push(`Dining spend: ${userPreferences.diningSpendLevel}`);
      if (userPreferences.preferredCuisines?.length) parts.push(`Preferred cuisines: ${userPreferences.preferredCuisines.join(', ')}`);
      if (userPreferences.dietaryRestrictions?.length) parts.push(`Dietary restrictions: ${userPreferences.dietaryRestrictions.join(', ')}`);
      if (userPreferences.willingnessToTryNew) parts.push(`Try new foods: ${userPreferences.willingnessToTryNew}`);
      if (userPreferences.diningStyle) parts.push(`Dining style: ${userPreferences.diningStyle}`);
      
      userProfileContext = parts.length > 0 ? `\n\nUser Profile & Preferences:\n${parts.join('\n')}` : "";
    }

    const systemPrompt = `You are an expert travel planner specializing in creating personalized, practical itineraries. Generate detailed day-by-day travel itineraries that account for weather conditions, user preferences, and local knowledge.

Format your response as a structured itinerary with:
- Day headers (Day 1, Day 2, etc.)
- Time slots (Morning, Afternoon, Evening)
- Specific activity recommendations with brief descriptions
- Restaurant suggestions that match dietary preferences
- Weather-appropriate alternatives when needed
- Practical tips (best times to visit, crowd avoidance, etc.)
- Walking distances and transport suggestions

Be specific with real place names and attractions. Consider the user's fitness level and pace preferences when planning activities.`;

    const userPrompt = `Create a ${numDays}-day itinerary for ${cityName}, ${countryName}.

Trip Parameters:
- Travel style: ${travelStyle}
- Budget level: ${budgetLevel}
- Daily pace: ${pace}
- Dietary preferences: ${dietaryPreferences.length > 0 ? dietaryPreferences.join(', ') : 'None specified'}
${userProfileContext}

${cityDescription ? `\nAbout the destination:\n${cityDescription}` : ''}

Weather Forecast (next 7 days):
${weatherForecast}

Please create a detailed day-by-day itinerary that:
1. Accounts for the weather forecast (suggest indoor activities on rainy days, outdoor activities on nice days)
2. Matches the user's pace and fitness level
3. Includes meal recommendations matching their dietary preferences and budget
4. Groups nearby attractions to minimize travel time
5. Includes realistic timing and walking distances
6. Suggests the best times to visit popular spots to avoid crowds (if the user prefers)`;

    console.log('Sending request to Lovable AI...');
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to generate itinerary" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Error in generate-itinerary:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
