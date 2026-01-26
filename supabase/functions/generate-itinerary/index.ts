import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TravelPreferences {
  ageRange?: string;
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

interface CityLeg {
  cityId: string;
  cityName: string;
  countryName: string;
  daysToSpend: number;
  cityDescription?: string;
}

interface ItineraryRequest {
  // Multi-city support
  cities?: CityLeg[];
  // Legacy single-city support
  cityName: string;
  countryName: string;
  numDays: number;
  travelStyle: string;
  budgetLevel: string;
  pace: string;
  dietaryPreferences: string[];
  userPreferences: TravelPreferences | null;
  cityDescription?: string;
  preferredStartTime?: string;
}

interface DayWeather {
  date: string;
  condition: string;
  tempMin: number;
  tempMax: number;
  precipChance: number;
}

async function fetchWeather(cityName: string, numDays: number): Promise<DayWeather[]> {
  try {
    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1`
    );
    const geoData = await geoResponse.json();
    
    if (!geoData.results || geoData.results.length === 0) {
      return [];
    }
    
    const { latitude, longitude } = geoData.results[0];
    
    const forecastDays = Math.min(numDays, 7);
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=auto&forecast_days=${forecastDays}`
    );
    const weatherData = await weatherResponse.json();
    
    if (!weatherData.daily) {
      return [];
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
    
    return weatherData.daily.time.map((date: string, i: number) => ({
      date,
      condition: weatherCodes[weatherData.daily.weathercode[i]] || "Variable",
      tempMin: Math.round(weatherData.daily.temperature_2m_min[i]),
      tempMax: Math.round(weatherData.daily.temperature_2m_max[i]),
      precipChance: weatherData.daily.precipitation_probability_max[i],
    }));
  } catch (error) {
    console.error('Weather fetch error:', error);
    return [];
  }
}

function getActivitiesPerSlot(pace: string): number {
  switch (pace) {
    case 'light': return 1;
    case 'medium': return 2;
    case 'full': return 2;
    default: return 2;
  }
}

function getDefaultStartTime(pace: string): string {
  switch (pace) {
    case 'light': return '10:00 AM';
    case 'medium': return '9:00 AM';
    case 'full': return '8:30 AM';
    default: return '9:00 AM';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabase.auth.getClaims(token);
    
    if (authError || !data?.claims) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = data.claims.sub;
    console.log("Authenticated user:", userId);

    const requestBody: ItineraryRequest = await req.json();
    const {
      cities,
      cityName,
      countryName,
      numDays,
      travelStyle,
      budgetLevel,
      pace,
      dietaryPreferences,
      userPreferences,
      cityDescription,
      preferredStartTime,
    } = requestBody;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Determine if multi-city or single-city trip
    const isMultiCity = cities && cities.length > 1;
    const cityLegs: CityLeg[] = cities && cities.length > 0 
      ? cities 
      : [{ cityId: '', cityName, countryName, daysToSpend: numDays, cityDescription }];

    // Fetch weather for the first city (primary destination)
    const weatherByDay = await fetchWeather(cityLegs[0].cityName, numDays);
    console.log('Weather by day:', JSON.stringify(weatherByDay));

    // Build weather context for prompt
    const weatherContext = weatherByDay.length > 0
      ? weatherByDay.map((w, i) => 
          `Day ${i + 1} (${w.date}): ${w.condition}, ${w.tempMin}°C - ${w.tempMax}°C, ${w.precipChance}% rain chance`
        ).join('\n')
      : 'Weather data unavailable - assume typical conditions for the season';

    // Build user profile context
    let userProfileContext = "";
    if (userPreferences) {
      const parts = [];
      
      if (userPreferences.ageRange) parts.push(`Age range: ${userPreferences.ageRange}`);
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

    const activitiesPerSlot = getActivitiesPerSlot(pace);
    const totalActivitiesPerDay = activitiesPerSlot * 3;
    const startTime = preferredStartTime || getDefaultStartTime(pace);

    const cuisineContext = userPreferences?.preferredCuisines?.length 
      ? `Focus restaurant suggestions on these cuisine types: ${userPreferences.preferredCuisines.join(', ')}. `
      : '';

    // Build leg-specific context for multi-city trips
    let legContext = "";
    if (isMultiCity) {
      let currentDay = 1;
      legContext = "\n\nTRIP LEGS (MULTI-CITY STRUCTURE):\n";
      cityLegs.forEach((leg, index) => {
        const endDay = currentDay + leg.daysToSpend - 1;
        legContext += `Leg ${index + 1}: ${leg.cityName}, ${leg.countryName} (Days ${currentDay}-${endDay}, ${leg.daysToSpend} days)\n`;
        currentDay = endDay + 1;
      });
      legContext += "\nIMPORTANT: Structure the itinerary with clear LEG headers before each city section!";
    }

    const destinationsList = isMultiCity 
      ? cityLegs.map(l => `${l.cityName}, ${l.countryName}`).join(' → ')
      : `${cityName}, ${countryName}`;

    const systemPrompt = `You are an expert travel planner for ${destinationsList}. Generate a detailed, personalized itinerary with reasoning for each recommendation.
${isMultiCity ? `
MULTI-CITY TRIP FORMAT - Follow this EXACT structure:

## Summary
[2-3 sentence overview of the multi-city adventure]

## Leg 1: ${cityLegs[0].cityName}
### Day 1: [Thematic title]
...activities...

### Day 2: [Thematic title]  
...activities...

## Leg 2: ${cityLegs[1]?.cityName || 'Next City'}
### Day ${cityLegs[0].daysToSpend + 1}: [Thematic title]
...activities...

(Continue for all legs)
` : `
SINGLE-CITY FORMAT - Follow this EXACT structure:

## Summary
[2-3 sentence overview of the trip]

## Day 1: [Thematic title - e.g., "Historic City Center"]
`}
### Start Time: ${startTime}
### Weather
Condition: [e.g., "Partly cloudy"]
Temperature: [e.g., "12°C - 18°C"]
Rain: [e.g., "20%"]
Note: [One sentence recommendation based on weather]

### Morning
- **[Activity Name]** | [Type: attraction/restaurant/activity] | [Duration: e.g., "1.5 hours"] | [Time: e.g., "9:00 AM"]
  [1-2 sentence description with specific location]
  Why: [1 sentence explaining why this is recommended]

### Afternoon
- **[Activity Name]** | [Type] | [Duration] | [Time]
  [Description]
  Why: [Reasoning]
- **[Lunch: Restaurant Name]** | restaurant | [Duration] | [Time]
  [Description]
  Why: [Reasoning]

### Evening
- **[Activity Name]** | [Type] | [Duration] | [Time]
  [Description]
  Why: [Reasoning]
- **[Dinner: Restaurant Name]** | restaurant | [Duration] | [Time]
  [Description]
  Why: [Reasoning]

## Packing Tips
- [Tip 1]
- [Tip 2]

## Transport Tips
- [Tip 1]
- [Tip 2]

STRICT RULES:
1. Each time slot MUST have exactly ${activitiesPerSlot} activities
2. Include at least one restaurant per day
3. Use REAL places that exist - no made up names
4. Day titles must be thematic (NOT "Day 1" or the city name)
5. Each activity: **Name** | type | duration | time
6. MUST include "Why:" reasoning for EVERY activity
7. Weather notes should recommend indoor activities on rainy days
8. ${cuisineContext}Respect dietary restrictions: ${dietaryPreferences.length > 0 ? dietaryPreferences.join(', ') : 'None'}
9. Consider walking distances and group nearby attractions
10. Account for pace: ${pace} (${totalActivitiesPerDay} activities per day)
11. Morning activities start at ${startTime}
${isMultiCity ? `12. MUST clearly label each LEG with "## Leg N: CityName" headers
13. Include travel/transition notes between cities at the start of new legs` : ''}`;

    const userPrompt = `Create a ${numDays}-day itinerary for ${destinationsList}.
${legContext}

Trip Parameters:
- Travel style: ${travelStyle}
- Budget level: ${budgetLevel}
- Daily pace: ${pace} (${totalActivitiesPerDay} activities per day)
- Preferred start time: ${startTime}
- Dietary preferences: ${dietaryPreferences.length > 0 ? dietaryPreferences.join(', ') : 'None specified'}
${userProfileContext}

${cityDescription ? `\nAbout the destination:\n${cityDescription}` : ''}

Weather Forecast:
${weatherContext}

Generate exactly ${numDays} days${isMultiCity ? ` across ${cityLegs.length} city legs` : ''}. Each day must have:
- A unique thematic title
- Start Time section
- Weather section with condition, temperature, rain chance, and planning note
- Morning: ${activitiesPerSlot} activities with time and reasoning
- Afternoon: ${activitiesPerSlot} activities (including lunch) with time and reasoning  
- Evening: ${activitiesPerSlot} activities (including dinner) with time and reasoning
${isMultiCity ? `
CRITICAL: Start each city section with "## Leg N: CityName" header!` : ''}

IMPORTANT: Every activity MUST include a "Why:" line explaining why it's recommended.`;

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

    // Include weather and leg data in metadata header
    const responseHeaders = {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "X-Weather-Data": JSON.stringify(weatherByDay),
      "X-Trip-Legs": JSON.stringify(cityLegs),
    };

    return new Response(response.body, { headers: responseHeaders });
  } catch (error) {
    console.error("Error in generate-itinerary:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
