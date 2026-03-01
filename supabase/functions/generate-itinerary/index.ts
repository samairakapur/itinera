import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

interface FlightConstraint {
  type: 'arrival' | 'departure';
  dayNumber: number;
  time: string;           // HH:mm (local)
  city: string;
  iata?: string;
  isInternational?: boolean;
  delayMinutes?: number;
}

interface ItineraryRequest {
  // Multi-city
  cities?: CityLeg[];
  // Legacy single-city
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
  // New fields
  startDate?: string;             // YYYY-MM-DD — provisional trip start date
  flightDetails?: FlightConstraint[];
}

interface DayWeather {
  date: string;
  condition: string;
  tempMin: number;
  tempMax: number;
  precipChance: number;
}

// ---------------------------------------------------------------------------
// Weather (Open-Meteo — free, no key)
// ---------------------------------------------------------------------------

async function fetchWeather(cityName: string, numDays: number): Promise<DayWeather[]> {
  try {
    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1`
    );
    const geoData = await geoResponse.json();
    if (!geoData.results?.length) return [];

    const { latitude, longitude } = geoData.results[0];
    const forecastDays = Math.min(numDays, 7);

    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode` +
      `&timezone=auto&forecast_days=${forecastDays}`
    );
    const weatherData = await weatherResponse.json();
    if (!weatherData.daily) return [];

    const weatherCodes: Record<number, string> = {
      0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
      45: "Foggy", 48: "Rime fog",
      51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
      61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
      71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
      80: "Showers", 81: "Moderate showers", 82: "Heavy showers",
      95: "Thunderstorm",
    };

    return weatherData.daily.time.map((date: string, i: number) => ({
      date,
      condition: weatherCodes[weatherData.daily.weathercode[i]] ?? "Variable",
      tempMin: Math.round(weatherData.daily.temperature_2m_min[i]),
      tempMax: Math.round(weatherData.daily.temperature_2m_max[i]),
      precipChance: weatherData.daily.precipitation_probability_max[i],
    }));
  } catch (err) {
    console.error('Weather fetch error:', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Pace helpers
// ---------------------------------------------------------------------------

function getActivitiesPerSlot(pace: string): number {
  return pace === 'light' ? 1 : 2;
}

function getDefaultStartTime(pace: string): string {
  switch (pace) {
    case 'light':  return '10:00 AM';
    case 'full':   return '8:30 AM';
    default:       return '9:00 AM';
  }
}

// ---------------------------------------------------------------------------
// Calendar date helpers
// ---------------------------------------------------------------------------

function buildCalendarDates(startDate: string, numDays: number): string {
  const lines: string[] = [];
  for (let i = 0; i < numDays; i++) {
    const d = new Date(startDate + 'T12:00:00Z'); // noon UTC avoids DST edge cases
    d.setUTCDate(d.getUTCDate() + i);
    const weekday = d.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
    const monthDay = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });
    lines.push(`Day ${i + 1} = ${weekday}, ${monthDay}`);
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Auth ────────────────────────────────────────────────────────────────
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

    // Use the standard getUser() API — the client is initialized with the
    // user's bearer token so no explicit jwt argument is needed.
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const userId = user.id;
    console.log("Authenticated user:", userId);

    // ── Parse request ───────────────────────────────────────────────────────
    const body: ItineraryRequest = await req.json();
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
      startDate,
      flightDetails = [],
    } = body;

    // ── API key ─────────────────────────────────────────────────────────────
    // Google Gemini free tier: 1,500 requests/day, no credit card required.
    // Get your key at: https://aistudio.google.com/apikey
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) {
      console.error("GROQ_API_KEY is not set");
      return new Response(
        JSON.stringify({ error: "The AI service is not configured. Please contact support." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Build city legs ─────────────────────────────────────────────────────
    const isMultiCity = (cities?.length ?? 0) > 1;
    const cityLegs: CityLeg[] = cities?.length
      ? cities
      : [{ cityId: '', cityName, countryName, daysToSpend: numDays, cityDescription }];

    // ── Weather ─────────────────────────────────────────────────────────────
    const weatherByDay = await fetchWeather(cityLegs[0].cityName, numDays);

    const weatherContext = weatherByDay.length > 0
      ? weatherByDay.map((w, i) =>
          `Day ${i + 1} (${w.date}): ${w.condition}, ${w.tempMin}°C–${w.tempMax}°C, ${w.precipChance}% rain`
        ).join('\n')
      : 'Weather data unavailable — assume typical seasonal conditions';

    // ── Calendar dates ──────────────────────────────────────────────────────
    const calendarContext = startDate
      ? `CALENDAR DATES (use these exact dates in day headings):\n${buildCalendarDates(startDate, numDays)}`
      : `No specific start date provided. Label days as "Day 1 — [suggested weekday]", e.g. "Day 1 — Saturday".`;

    // ── User profile ────────────────────────────────────────────────────────
    let userProfileContext = '';
    if (userPreferences) {
      const parts: string[] = [];
      if (userPreferences.ageRange)              parts.push(`Age range: ${userPreferences.ageRange}`);
      if (userPreferences.fitnessLevel)          parts.push(`Fitness level: ${userPreferences.fitnessLevel}`);
      if (userPreferences.walkingTolerance)      parts.push(`Walking tolerance: ${userPreferences.walkingTolerance}`);
      if (userPreferences.crowdComfort)          parts.push(`Crowd comfort: ${userPreferences.crowdComfort}`);
      if (userPreferences.pacePreference)        parts.push(`Pace preference: ${userPreferences.pacePreference}`);
      if (userPreferences.indoorOutdoor)         parts.push(`Indoor/Outdoor: ${userPreferences.indoorOutdoor}`);
      if (userPreferences.interests?.length)     parts.push(`Interests: ${userPreferences.interests.join(', ')}`);
      if (userPreferences.scheduleFlexibility)   parts.push(`Schedule flexibility: ${userPreferences.scheduleFlexibility}`);
      if (userPreferences.dailyBudget)           parts.push(`Daily budget: ${userPreferences.dailyBudget}`);
      if (userPreferences.diningSpendLevel)      parts.push(`Dining spend: ${userPreferences.diningSpendLevel}`);
      if (userPreferences.preferredCuisines?.length)   parts.push(`Preferred cuisines: ${userPreferences.preferredCuisines.join(', ')}`);
      if (userPreferences.dietaryRestrictions?.length) parts.push(`Dietary restrictions: ${userPreferences.dietaryRestrictions.join(', ')}`);
      if (userPreferences.willingnessToTryNew)   parts.push(`Try new foods: ${userPreferences.willingnessToTryNew}`);
      if (userPreferences.diningStyle)           parts.push(`Dining style: ${userPreferences.diningStyle}`);
      if (parts.length) userProfileContext = `\n\nUser Profile:\n${parts.join('\n')}`;
    }

    // ── Flight constraints ──────────────────────────────────────────────────
    let flightConstraintContext = '';
    if (flightDetails.length > 0) {
      const lines = flightDetails.map(f => {
        if (f.type === 'arrival') {
          const delayNote  = f.delayMinutes ? ` (+${f.delayMinutes} min delay)` : '';
          const intlNote   = f.isInternational
            ? ' Allow 45 min immigration + 30 min baggage + 30 min transit + 60 min hotel check-in after landing.'
            : ' Allow 20 min baggage + transit + 30 min hotel check-in.';
          return `⚠ ARRIVAL DAY ${f.dayNumber} — Flight lands ${f.city} at ${f.time}${delayNote}.${intlNote} Do NOT schedule activities before these buffers are accounted for.`;
        } else {
          const buffer = f.isInternational ? '2 h 30 min' : '1 h 30 min';
          return `⚠ DEPARTURE DAY ${f.dayNumber} — Flight departs ${f.city} at ${f.time}. Last activity must end ≥ ${buffer} before departure to allow airport travel and check-in.`;
        }
      });
      flightConstraintContext = `\n\nFLIGHT CONSTRAINTS — MUST BE RESPECTED:\n${lines.join('\n')}`;
    }

    // ── Pace / slot settings ────────────────────────────────────────────────
    const activitiesPerSlot = getActivitiesPerSlot(pace);
    const totalActivitiesPerDay = activitiesPerSlot * 3;
    const startTime = preferredStartTime || getDefaultStartTime(pace);

    const cuisineContext = userPreferences?.preferredCuisines?.length
      ? `Preferred cuisines: ${userPreferences.preferredCuisines.join(', ')}. `
      : '';

    // ── Multi-city leg context ─────────────────────────────────────────────
    let legContext = '';
    if (isMultiCity) {
      let currentDay = 1;
      legContext = '\n\nTRIP LEGS (MULTI-CITY):\n';
      cityLegs.forEach((leg, idx) => {
        const endDay = currentDay + leg.daysToSpend - 1;
        legContext += `Leg ${idx + 1}: ${leg.cityName}, ${leg.countryName} — Days ${currentDay}–${endDay}\n`;
        currentDay = endDay + 1;
      });
    }

    const destinationsList = isMultiCity
      ? cityLegs.map(l => `${l.cityName}, ${l.countryName}`).join(' → ')
      : `${cityName}, ${countryName}`;

    // ── Prompts ─────────────────────────────────────────────────────────────
    const systemPrompt = `You are an expert travel planner specialising in ${destinationsList}. Generate a detailed, practical, and personalised day-by-day itinerary.

${calendarContext}
${flightConstraintContext}

OUTPUT FORMAT — follow this structure EXACTLY for every day:

${isMultiCity ? `## Leg N: CityName, Country
` : ''}## Day N — [Weekday, Month Day] (or "Day N" if no date given): [Thematic title]

### Start Time: ${startTime}

### Weather
Condition: [e.g., Partly cloudy]
Temperature: [e.g., 14°C – 22°C]
Rain: [e.g., 15%]
Note: [One practical sentence — recommend indoor alternatives on rainy days]

### Morning
- **[Breakfast: Café/Restaurant Name]** | restaurant | [Duration, e.g., 45 min] | [Time, e.g., 8:30 AM]
  [1-2 sentence description. Specific neighbourhood/address hint.]
  Why: [Why this breakfast spot suits today's itinerary and traveller profile]
- **[Activity Name]** | attraction | [Duration] | [Time]
  [Description]
  Why: [Reasoning — crowds, lighting, proximity to next stop, etc.]
- **🚶 Travel to [Next Place]** | transport | [N min] | [Time]
  [Walk/Metro/Bus/Taxi — specific line or route if known]
  Why: [Most efficient or scenic route]

### Afternoon
- **[Activity Name]** | attraction | [Duration] | [Time]
  [Description]
  Why: [Reasoning]
- **🚶 Travel to [Next Place]** | transport | [N min] | [Time]
  [Route description]
  Why: [Why this mode]
- **[Lunch: Restaurant Name]** | restaurant | [Duration] | [Time]
  [Description]
  Why: [Reasoning]

### Evening
- **[Activity Name]** | attraction | [Duration] | [Time]
  [Description]
  Why: [Reasoning]
- **🚶 Travel to [Restaurant]** | transport | [N min] | [Time]
  [Route]
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
1. Every day MUST include: breakfast (morning), lunch (afternoon), dinner (evening) — real, named restaurants only
2. Every day MUST have ALL THREE sub-sections: ### Morning, ### Afternoon, ### Evening — even if a flight lands late
3. Every sightseeing activity MUST be followed by a 🚶 Travel block showing time and transport mode to the next stop
4. Travel blocks use format: **🚶 Travel to [Destination]** | transport | [N min] | [Time]
5. ${calendarContext.startsWith('CALENDAR') ? 'Use the exact calendar dates in each ## Day heading' : 'Label days as "Day N — [Weekday]"'}
6. Day titles must be thematic (NOT "Day 1" or just the city name)
7. Each activity: **Name** | type | duration | time
8. MUST include "Why:" reasoning for EVERY item including travel blocks
9. ${cuisineContext}Respect dietary restrictions: ${dietaryPreferences.length > 0 ? dietaryPreferences.join(', ') : 'none'}
10. Group nearby attractions — minimise unnecessary travel
11. Account for pace: ${pace} (~${totalActivitiesPerDay} main activities/day, plus meals and travel blocks)
12. Use REAL places that exist — no invented names
13. DEFAULT DAY START TIME: ${startTime}. On days with a flight arrival, the first activity starts at arrival_time + 2 hours (minimum buffer for baggage, transit, hotel check-in). If flight lands after 14:00, reduce afternoon activities and focus on check-in + nearby dining.
14. COMPLETE ALL DAYS — do not stop before finishing every day's ### Morning, ### Afternoon, and ### Evening sections. After all days, always end with ## Packing Tips and ## Transport Tips.
${isMultiCity ? `15. Use "## Leg N: CityName" header before each city section
16. Start each new city leg with transit/arrival logistics` : ''}
${flightConstraintContext ? '17. STRICTLY honour all flight constraints listed above — do not schedule activities outside allowed windows' : ''}`;

    const userPrompt = `Create a ${numDays}-day itinerary for ${destinationsList}.
${legContext}

Trip parameters:
- Travel style: ${travelStyle}
- Budget level: ${budgetLevel}
- Pace: ${pace} (${totalActivitiesPerDay} main activities/day)
- Preferred start time: ${startTime}
- Dietary preferences: ${dietaryPreferences.length > 0 ? dietaryPreferences.join(', ') : 'none'}
${userProfileContext}

${cityDescription ? `\nAbout the destination:\n${cityDescription}` : ''}

Weather forecast:
${weatherContext}

Generate exactly ${numDays} days${isMultiCity ? ` across ${cityLegs.length} city legs` : ''}.
Every day requires breakfast (morning), a 🚶 travel block between every sightseeing activity, lunch (afternoon), and dinner (evening).
Every item — including travel blocks — must have a "Why:" line.
${startDate ? `Use the exact dates from the calendar context in every ## Day heading.` : ''}
${flightConstraintContext ? 'Strictly honour all flight constraints.' : ''}`;

    // ── Call Google Gemini (OpenAI-compatible endpoint, free tier) ──────────
    // Free tier: 1,500 requests/day, 1M tokens/min — no credit card needed.
    // Uses OpenAI-compatible format so the SSE response streams as
    // choices[0].delta.content — already handled by the frontend parser.
    console.log(`Calling Gemini gemini-1.5-flash for ${destinationsList} (${numDays} days)`);

    const aiResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 16000,
          stream: true,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      }
    );

    // ── Error handling ──────────────────────────────────────────────────────
    if (!aiResponse.ok) {
      const status = aiResponse.status;
      let errorText = '';
      try { errorText = await aiResponse.text(); } catch { /* ignore */ }
      console.error(`Gemini API error ${status}:`, errorText);

      if (status === 401 || status === 403) {
        return new Response(
          JSON.stringify({ error: "The AI service key is invalid or missing. Please contact support." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "The AI is a little busy right now. Please wait a few seconds and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 503 || status === 500) {
        return new Response(
          JSON.stringify({ error: "The AI service is overloaded right now. Please try again in a few seconds." }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Try to extract a meaningful message from the error body
      let userMessage = "Failed to generate itinerary. Please try again.";
      try {
        const errJson = JSON.parse(errorText);
        if (errJson?.error?.message) userMessage = errJson.error.message;
      } catch { /* use default */ }

      return new Response(
        JSON.stringify({ error: userMessage }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Stream back to client ───────────────────────────────────────────────
    // Attach metadata in response headers so the frontend can read them
    // without waiting for the stream to finish.
    const responseHeaders = {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Weather-Data": JSON.stringify(weatherByDay),
      "X-Trip-Legs": JSON.stringify(cityLegs),
    };

    return new Response(aiResponse.body, { headers: responseHeaders });

  } catch (error) {
    console.error("Unhandled error in generate-itinerary:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
