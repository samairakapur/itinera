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

/**
 * Pace affects start time and energy level.
 * No hard cap on activity count — the AI uses judgement based on pace.
 */
function getSightseeingCount(pace: string): number {
  if (pace === 'light') return 2;
  if (pace === 'full')  return 4;
  return 3; // moderate
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
// Deep City AI Agents — city-specific knowledge injected into the system prompt
// Priority cities: Tokyo, Barcelona, Bangkok
// ---------------------------------------------------------------------------

function getDeepCityContext(destinations: string): string {
  const dest = destinations.toLowerCase();
  const blocks: string[] = [];

  if (dest.includes('tokyo')) {
    blocks.push(`
TOKYO AGENT CONTEXT:
- Neighbourhoods: Shinjuku (entertainment, nightlife, Kabukicho), Shibuya (youth culture, crossing, Daikanyama boutiques), Harajuku (Takeshita-dori youth fashion, Omotesando luxury), Asakusa (old Tokyo, Senso-ji, craft shops), Ginza (luxury retail, galleries, Michelin dining), Akihabara (electronics, anime, maid cafés), Shimokitazawa (indie music, vintage fashion, live houses), Yanaka (old-Tokyo atmosphere, preserved temple district), Roppongi (nightlife, art museums: Mori, National Art Centre), Nakameguro (canal walks, boutique cafés, especially beautiful in cherry blossom season).
- Transport: Tokyo Metro + Toei Subway + JR lines. Get a Suica/Pasmo IC card — works on all rail, some buses, and vending machines. Day passes: Tokyo Metro 24h ¥600. Avoid trains 7:30–9:00 and 17:30–19:30 rush hours. Taxis expensive but safe (flag-drop ¥420). Night buses limited — plan last trains (around midnight).
- Booking lead times: Popular ramen shops (Ichiran, Fuunji) — queue expected, arrive early; no booking. Sushi omakase (Sukiyabashi Jiro, Saito, Sushi Yoshitake) — book 1–3 months ahead via concierge. Wagyu teppanyaki (Mikawa Zezankyo, Kawamura) — 2–4 weeks ahead. Teamlab digital art museums — book online days ahead. DisneySea — book 30+ days ahead for popular rides via Premier Access.
- Seasonal warnings: Cherry blossom (late March–early April) — crowds peak, book all accommodation 3+ months ahead. Golden Week (late April–early May) — domestic travel surge, everything more expensive. Summer (July–August) — extreme humidity and heat 30–35°C, plan indoor breaks. Typhoon season September–October — check JMA forecasts. Autumn foliage (mid-November) — Shinjuku Gyoen, Rikugien best spots.
- Safety & etiquette: Extremely safe. Quiet on trains — no phone calls, headphones only. Carry cash — many small restaurants and shrines are cash-only. Remove shoes when entering temples/ryokans. Tattoos may bar entry to some onsen.
- Hidden gems: Koenji antique markets (weekends), Yanesen neighbourhood walking, Shimokitazawa record stores, Nezu Shrine (less crowded than Fushimi Inari), Kagurazaka (French-Japanese neighbourhood), rooftop gardens at department stores.`);
  }

  if (dest.includes('barcelona')) {
    blocks.push(`
BARCELONA AGENT CONTEXT:
- Neighbourhoods: Gothic Quarter (Barri Gòtic — medieval lanes, Cathedral, Plaça Reial), El Born/Sant Pere (trendy bars, Picasso Museum, Mercat de Santa Caterina), La Barceloneta (beach, seafood, younger crowd), Eixample (Gaudí architecture, gay-friendly, upscale dining — Dreta and Esquerra sides), Gràcia (bohemian, Plaça del Sol, local vibe, less touristy), Poble Sec (Avinguda del Paral·lel, Montjuïc base, tapas bars), Sarrià-Sant Gervasi (quiet residential, upscale, Tibidabo views), Poblenou (emerging arts, craft beer, beach access, design scene), Sant Antoni (vintage market Sundays, neo-tapas, bookshops).
- Transport: TMB Metro (T-Casual 10-trip card is best value). Buses cover gaps not reached by Metro. Bicing bike-share for short rides. Taxis (Free Now app) safe and metered. Aerobus from T1/T2 to Plaça Catalunya (35 min). AVOID tourist buses — waste of time vs Metro.
- Booking lead times: Sagrada Família — book online AT LEAST 2 weeks ahead (often sells out same-day). Park Güell (paid section) — book 2 weeks ahead. Casa Batlló / Casa Milà (La Pedrera) — book 1 week ahead, magic nights evenings worth the premium. Popular tapas bars (Bar Cañete, Bodega 1900, Tickets by Albert Adrià) — Tickets needs 2 months ahead via specific booking window; others 1–2 weeks.
- Seasonal warnings: Summer (July–August) — extreme heat 32–38°C, beaches packed, tourist density highest, many locals leave for August. Book everything further ahead. Spring (April–May) and autumn (Sept–Oct) — best weather 20–25°C, lower crowds, local festivals. Sant Jordi (23 April) — roses and books street festival, beautiful. La Mercè (24 September) — free concerts, castellers, fire runs.
- Safety: Pickpockets very active on Las Ramblas, Metro Line 3, and Barceloneta beach. Use anti-theft bags; don't put phone on restaurant tables. Las Ramblas itself is touristy — navigate to parallel streets (La Rambla del Raval, Carrer Nou de la Rambla) for authentic experience.
- Food specifics: Lunch (2–4 PM) is the main meal; dinner rarely before 9 PM. Menú del día (set lunch) is best value at €12–18. Catalan cuisine: pa amb tomàquet (bread rubbed with tomato), escalivada, fideuà, crema catalana. Best seafood: Barceloneta and Poblenou waterfront.
- Hidden gems: Bunkers del Carmel (360° city views, less known than Tibidabo), Mercat de l'Abaceria (Gràcia — local market), Els Encants flea market (Mondays/Wednesdays/Fridays/Saturdays), Carrer Blai pintxos bars in Poble Sec.`);
  }

  if (dest.includes('bangkok')) {
    blocks.push(`
BANGKOK AGENT CONTEXT:
- Neighbourhoods: Rattanakosin (Old Bangkok — Grand Palace, Wat Pho, Wat Arun, best explored morning before heat peaks), Silom/Sathorn (business district, Patpong night market, sky bars, Lumphini Park), Sukhumvit (expat hub — BTS-connected; Thong Lor and Ekkamai for trendy cafés and nightlife; Asok for malls), Banglamphu/Khao San Road (backpacker hub, temples, canals, affordable food), Chinatown (Yaowarat — best street food in Bangkok, night market, gold shops), Ari (local neighbourhood, independent cafés, less touristy), Chatuchak (weekend market — largest in Asia, 15,000 stalls), Thonburi (canal neighbourhoods, local life, Wat Pak Nam — giant Buddha).
- Transport: BTS Skytrain (Silom + Sukhumvit lines) + MRT Blue/Purple/Yellow lines — use Rabbit card. Grab app for taxis (always meter or Grab — never negotiate with tuk-tuk for long distances). Chao Phraya Express Boats (Orange flag — all piers, cheapest and scenic). Khlong boats on Khlong Saen Saep for east-west travel. AVOID: flag-down taxis that refuse meter, tuk-tuks for tourist traps (gem store scams). Traffic is extreme 7:30–9:30 and 17:00–19:30 — always take rail.
- Booking lead times: Le Du, Gaggan Anand, Sorn (Michelin starred) — book 2–4 weeks ahead online. River City Cruise dinner — book 3–5 days ahead. Popular rooftop bars (Vertigo at Banyan Tree, Octave, Cielo) — reservations recommended weekends. Muay Thai stadium (Lumpinee, Rajadamnern) — book ringside 3 days ahead. Thai Massage schools (Wat Pho massage school) — walk-in fine.
- Seasonal warnings: Hot season (March–May) — extreme heat 35–40°C, plan temple visits 7–9 AM and 5–7 PM, midday indoors. Rainy season (June–October) — afternoon downpours (1–3 hours), bring umbrella, not usually all-day rain. Cool season (November–February) — best weather 25–30°C, peak tourist season, book ahead. Songkran (Thai New Year, 13–15 April) — epic water festival but infrastructure disruption.
- Safety & etiquette: Very safe for tourists. Always cover shoulders and knees at temples; sarongs available at entrance. Remove shoes entering temples and traditional homes. Never touch monks (women especially) or point feet at Buddha images. The Royal Family — any criticism is illegal (lèse-majesté).
- Food specifics: Street food is excellent and safe at busy stalls. Famous dishes: pad thai (avoid tourist traps — Thipsamai is the benchmark), som tum, massaman curry, boat noodles, mango sticky rice. Chinatown Yaowarat for crab omelette and BBQ pork. Or Tor Kor market for premium Thai produce. Eat at lunch as locals do — 11 AM to 2 PM for best street food variety.
- Hidden gems: Wat Pak Nam (giant golden Buddha, less crowded), Talat Noi (old Sino-Portuguese quarter), Bang Krachao ("green lung" — rent bicycles on island), Flower Market Pak Khlong Talat (best before dawn 2–5 AM), Artist's House in Thonburi canal.`);
  }

  return blocks.join('\n');
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

    // ── AI provider selection ────────────────────────────────────────────────
    // Priority: Groq (high limits, fast) → Lovable gateway → direct Gemini.
    // GROQ_API_KEY is already set in Supabase secrets so this is the active path.
    const GROQ_API_KEY      = Deno.env.get("GROQ_API_KEY");
    const LOVABLE_API_KEY   = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");

    let AI_KEY: string;
    let AI_URL: string;
    let AI_MODEL: string;
    let AI_PROVIDER: string;

    if (GROQ_API_KEY) {
      AI_KEY      = GROQ_API_KEY;
      AI_URL      = "https://api.groq.com/openai/v1/chat/completions";
      AI_MODEL    = "llama-3.3-70b-versatile";
      AI_PROVIDER = "Groq";
    } else if (LOVABLE_API_KEY) {
      AI_KEY      = LOVABLE_API_KEY;
      AI_URL      = "https://ai.gateway.lovable.dev/v1/chat/completions";
      AI_MODEL    = "google/gemini-2.5-flash";
      AI_PROVIDER = "Lovable gateway";
    } else if (GOOGLE_AI_API_KEY) {
      AI_KEY      = GOOGLE_AI_API_KEY;
      AI_URL      = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
      AI_MODEL    = "gemini-2.0-flash";
      AI_PROVIDER = "direct Gemini";
    } else {
      console.error("No AI API key configured (GROQ_API_KEY, LOVABLE_API_KEY, or GOOGLE_AI_API_KEY)");
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
    const sightseeingCount = getSightseeingCount(pace);
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

    // ── Deep city context ───────────────────────────────────────────────────
    const deepCityContext = getDeepCityContext(destinationsList);

    // ── Prompts ─────────────────────────────────────────────────────────────
    const systemPrompt = `You are an expert travel planner specialising in ${destinationsList}. Generate a detailed, practical, and personalised day-by-day itinerary.${deepCityContext ? `\n${deepCityContext}` : ''}

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
- **🗺️ Wander & Explore: [Neighbourhood/Area Name]** | flex | [Duration, e.g., 45 min] | [Time]
  [Brief description of what makes this neighbourhood worth wandering — markets, street art, cafés, architecture, vibe. Be specific.]
  Why: [Why this neighbourhood fits here — proximity, character, relaxed pace after structured activity]

### Evening
- **[Activity Name]** | attraction | [Duration] | [Time]
  [Description]
  Why: [Reasoning]
- **🚶 Travel to [Restaurant]** | transport | [N min] | [Time]
  [Route]
  Why: [Reasoning]
- **[Dinner: Restaurant Name]** | restaurant | [Duration] | [Time]
  [Description]
  ⚠️ Book [X] weeks ahead · [How to book — website, phone, or walk-in]
  Why: [Reasoning]

## Packing Tips
- [Tip 1]
- [Tip 2]

## Transport Tips
- [Tip 1]
- [Tip 2]

ACTIVITY TYPES (use EXACTLY these values in the type field):
- attraction — museums, landmarks, parks, viewpoints, shows, tours
- restaurant — any meal: breakfast, lunch, dinner, brunch, coffee stop
- transport — 🚶 travel blocks between activities
- flex — 🗺️ Wander & Explore blocks (unstructured neighbourhood time)
- prebooked — ticketed events that must be booked in advance

FLEX BLOCKS (🗺️ Wander & Explore):
- Insert 1–2 flex blocks per day, spread across different time slots
- Each flex block covers a specific neighbourhood or district with a soft suggestion ("look for the hidden courtyard", "browse the weekend market")
- Flex blocks provide breathing room and spontaneity — do NOT fill every minute with structured activities
- Flex blocks should feel earned: place them after a cluster of structured attractions

BOOKING WARNINGS:
- Add a ⚠️ Book [X] weeks ahead line for ANY activity that commonly requires advance booking:
  - Popular or Michelin-starred restaurants: ⚠️ Book 2–3 weeks ahead · [how to book]
  - Major ticketed attractions (Louvre, Vatican, Tower of London, etc.): ⚠️ Book online at least 1 week ahead to skip queues
  - Shows, concerts, theatre, sports: ⚠️ Book [X] weeks ahead · [ticketing platform]
  - High-demand tours: ⚠️ Book 1 week ahead · [operator website]
- Place the ⚠️ line immediately after the description, before the Why: line
- For restaurants with walk-in availability, you may omit the booking warning OR note "walk-ins usually fine before 6 PM"

STRICT RULES:
0. NEVER generate a "Free Day", "Rest Day", "Leisure Day", or any day with no planned activities. EVERY day — including the last day of a trip — must have the full structure: breakfast + sightseeing + lunch + flex block + dinner. The flex block already provides unstructured free time; an empty day is never appropriate.
1. Every day MUST include: breakfast (morning), lunch (afternoon), dinner (evening) — real, named restaurants only
2. Every sightseeing activity MUST be followed by a 🚶 Travel block showing time and transport mode to the next stop
3. Travel blocks use format: **🚶 Travel to [Destination]** | transport | [N min] | [Time]
4. ${calendarContext.startsWith('CALENDAR') ? 'Use the exact calendar dates in each ## Day heading' : 'Label days as "Day N — [Weekday]"'}
5. Day titles must be thematic (NOT "Day 1" or just the city name)
6. Each activity: **Name** | type | duration | time
7. MUST include "Why:" reasoning for EVERY item including travel blocks and flex blocks
8. ${cuisineContext}Respect dietary restrictions: ${dietaryPreferences.length > 0 ? dietaryPreferences.join(', ') : 'none'}
9. Group nearby attractions — minimise unnecessary travel
10. PACE-DRIVEN ACTIVITY COUNT — let pace set the density:
    - light: ~2 sightseeing activities/day — slow mornings, long lunches, early evenings; leave plenty of buffer
    - moderate: ~3 sightseeing activities/day — comfortable rhythm with time to breathe between stops
    - full: ~4 sightseeing activities/day — energetic but not frantic; every slot filled without doubling back
    All paces include breakfast + lunch + dinner + 1 flex block. Transport blocks are connectors and don't count.
    A realistic, enjoyable day always beats an overloaded one — when in doubt, do less.
11. Use REAL places that exist — no invented names
12. Insert booking warnings (⚠️) for ALL activities that typically require advance reservation
13. Insert exactly 1 flex block per day (🗺️ Wander & Explore format)
${isMultiCity ? `14. Use "## Leg N: CityName" header before each city section
15. Start each new city leg with transit/arrival logistics` : ''}
${flightConstraintContext ? '16. STRICTLY honour all flight constraints listed above — do not schedule activities outside allowed windows' : ''}`;

    const userPrompt = `Create a ${numDays}-day itinerary for ${destinationsList}.
${legContext}

Trip parameters:
- Travel style: ${travelStyle}
- Budget level: ${budgetLevel}
- Pace: ${pace} (~${sightseeingCount} sightseeing activities/day — adjust density to match this energy level)
- Preferred start time: ${startTime}
- Dietary preferences: ${dietaryPreferences.length > 0 ? dietaryPreferences.join(', ') : 'none'}
${userProfileContext}

${cityDescription ? `\nAbout the destination:\n${cityDescription}` : ''}

Weather forecast:
${weatherContext}

Generate exactly ${numDays} days${isMultiCity ? ` across ${cityLegs.length} city legs` : ''}.
Every day requires ALL of the following:
- Breakfast (morning)
- A 🚶 travel block between every sightseeing activity
- Lunch (afternoon)
- Dinner (evening)
- Exactly 1 flex block (🗺️ Wander & Explore [neighbourhood])
- ⚠️ booking warnings on any activity that typically needs advance reservation
Activity density follows the "${pace}" pace setting (~${sightseeingCount} sightseeing activities/day).
Every item — including travel and flex blocks — must have a "Why:" line.
${startDate ? `Use the exact dates from the calendar context in every ## Day heading.` : ''}
${flightConstraintContext ? 'Strictly honour all flight constraints.' : ''}`;

    // ── Call AI (Lovable gateway preferred; falls back to direct Gemini) ─────
    // Lovable gateway uses a shared key pool with higher effective rate limits
    // than the individual 15 RPM free tier on the direct Google API.
    console.log(`Calling ${AI_MODEL} via ${AI_PROVIDER} for ${destinationsList} (${numDays} days)`);

    const aiPayload = {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${AI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 8192,
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    };

    // Helper — single attempt
    const callAI = () => fetch(AI_URL, aiPayload);

    let aiResponse = await callAI();

    // ── Retry on 429 / 503 — wait 5 s then try once more ───────────────────
    if (aiResponse.status === 429 || aiResponse.status === 503) {
      console.warn(`AI returned ${aiResponse.status} — retrying in 5 s…`);
      await new Promise(r => setTimeout(r, 5000));
      aiResponse = await callAI();
    }

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
          JSON.stringify({ error: "The AI service is temporarily busy. Please wait 10 seconds and try again." }),
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
