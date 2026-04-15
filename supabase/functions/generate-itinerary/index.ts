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
  diningStyle?: string | string[];
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
 * Pace affects start time, activity count, and hard end-time cap.
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

/** Hard end-time cap per pace — the day MUST wrap up by this time */
function getDayEndTime(pace: string): string {
  if (pace === 'light')  return '6:00 PM';
  if (pace === 'full')   return '9:30 PM';
  return '8:00 PM'; // moderate
}

/** Maximum total non-transport activities per day per pace (meals + sightseeing + flex) */
function getMaxActivities(pace: string): number {
  if (pace === 'light')  return 5;  // breakfast + 1 sightseeing + lunch + flex + dinner
  if (pace === 'full')   return 9;  // breakfast + 4 sightseeing + lunch + flex + evening + dinner
  return 7; // moderate: breakfast + 2-3 sightseeing + lunch + flex + evening + dinner
}

/**
 * Returns the total available hours in the day based on start + end times.
 * Used to inject a concrete hour budget into the prompt.
 */
function getAvailableHours(startTime: string, endTime: string): number {
  const parse = (t: string) => {
    const [timePart, meridiem] = t.split(' ');
    let [h, m] = timePart.split(':').map(Number);
    if (meridiem === 'PM' && h !== 12) h += 12;
    if (meridiem === 'AM' && h === 12) h = 0;
    return h + (m || 0) / 60;
  };
  return Math.round(parse(endTime) - parse(startTime));
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
TOKYO CONTEXT:
- Key neighbourhoods: Shinjuku (nightlife), Shibuya (youth culture, crossing), Harajuku (Omotesando luxury), Asakusa (old Tokyo, Senso-ji), Ginza (luxury/Michelin), Akihabara (anime/electronics), Shimokitazawa (indie/vintage), Yanaka (old-Tokyo atmosphere), Roppongi (art museums, nightlife), Nakameguro (canal cafés).
- Transport: Suica/Pasmo IC card — works on all rail and vending machines. Avoid trains 7:30–9:00 and 17:30–19:30 (rush hour). Last trains ~midnight.
- Bookings: Sushi omakase — 1–3 months ahead. Teamlab — book online days ahead. DisneySea — 30+ days ahead. Ramen: queue, no booking.
- Etiquette: Cash-only at many small restaurants/shrines. Remove shoes at temples/ryokans. Quiet on trains.`);
  }

  if (dest.includes('barcelona')) {
    blocks.push(`
BARCELONA CONTEXT:
- Key neighbourhoods: Gothic Quarter (medieval, Cathedral), El Born (Picasso Museum, trendy bars), Barceloneta (beach, seafood), Eixample (Gaudí, upscale dining), Gràcia (bohemian, local), Poble Sec (Montjuïc base, pintxos), Poblenou (arts, craft beer), Sant Antoni (vintage market Sundays).
- Transport: TMB Metro with T-Casual 10-trip card. Aerobus from airport to Plaça Catalunya (35 min). Avoid tourist buses.
- Bookings: Sagrada Família — 2 weeks ahead (sells out same-day). Park Güell paid section — 2 weeks. Tickets restaurant (Albert Adrià) — 2 months ahead.
- Food: Dinner rarely before 9 PM. Menú del día (set lunch) best value €12–18. Pickpockets active on Las Ramblas and Metro L3.`);
  }

  if (dest.includes('bangkok')) {
    blocks.push(`
BANGKOK CONTEXT:
- Key neighbourhoods: Rattanakosin (Grand Palace, Wat Pho, Wat Arun — visit mornings), Silom/Sathorn (sky bars, Lumphini Park), Sukhumvit (BTS-connected; Thong Lor/Ekkamai for cafés), Chinatown/Yaowarat (best street food), Chatuchak (weekend market), Thonburi (canals, local life).
- Transport: BTS Skytrain + MRT (Rabbit card). Grab app for taxis. Chao Phraya Express Boats scenic and cheap. Avoid tuk-tuks for long distances. Traffic extreme 7:30–9:30 and 17:00–19:30.
- Bookings: Le Du/Gaggan Anand/Sorn (Michelin) — 2–4 weeks ahead. Rooftop bars — reserve weekends. Muay Thai ringside — 3 days ahead.
- Etiquette: Cover shoulders and knees at temples. Remove shoes. Never touch monks. Hot season (Mar–May) 35–40°C — visit temples early morning or evening.`);
  }

  return blocks.join('\n');
}

// ---------------------------------------------------------------------------
// Per-leg generation helpers
// ---------------------------------------------------------------------------

interface AIProvider {
  key: string;
  url: string;
  model: string;
  name: string;
  /** Hard cap on output tokens for this model (provider-enforced limit). */
  maxOutputTokens?: number;
}

/**
 * Detect which day numbers (from startDay to endDay inclusive) are missing
 * or incomplete in the AI output text.
 *
 * Two failure modes are caught:
 *   1. Header absent  — "## Day N" pattern not found at all.
 *   2. Header present but empty — "## Day N" exists but has no "### Morning"
 *      sub-section, meaning the AI wrote the heading and then stopped.
 *      This is just as broken as a missing day and must trigger a retry.
 *
 * The AI may write the global day number (e.g. "## Day 4") or restart at 1
 * for a new leg (e.g. "## Day 1") — both patterns are accepted.
 */
function findMissingDays(text: string, startDay: number, endDay: number): number[] {
  const missing: number[] = [];
  for (let d = startDay; d <= endDay; d++) {
    const relative = d - startDay + 1;

    const globalHeader   = new RegExp(`##\\s*Day\\s*${d}[\\s:—–-]`, 'i');
    const relativeHeader = relative !== d
      ? new RegExp(`##\\s*Day\\s*${relative}[\\s:—–-]`, 'i')
      : null;

    const foundGlobal   = globalHeader.test(text);
    const foundRelative = !!relativeHeader?.test(text);

    if (!foundGlobal && !foundRelative) {
      // Header completely absent
      missing.push(d);
      continue;
    }

    // Header exists — verify the section has actual activity content.
    // A day with a heading but no "### Morning" sub-section means the AI
    // stopped generating after the title (token budget exhaustion), leaving
    // the day with 0 activities.  Treat it as missing so a retry is triggered.
    const dayNum = foundGlobal ? d : relative;
    const hasContent = new RegExp(
      `##\\s*Day\\s*${dayNum}[\\s\\S]*?###\\s*Morning`, 'i'
    ).test(text);

    if (!hasContent) {
      console.log(
        `[findMissingDays] Day ${d} header exists but no Morning section — ` +
        `AI stopped mid-generation, treating as missing`
      );
      missing.push(d);
    }
  }
  return missing;
}

/**
 * Collect a streaming SSE response body into a plain text string.
 * Parses OpenAI-compatible "data: {...}" SSE events and concatenates delta content.
 */
async function collectSSEStream(body: ReadableStream<Uint8Array>): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let fullText = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') return fullText;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) fullText += content;
        } catch { /* ignore malformed SSE line */ }
      }
    }
  } finally {
    try { reader.releaseLock(); } catch { /* ignore */ }
  }
  return fullText;
}

/**
 * Call AI using streaming and collect the full response text.
 *
 * Why streaming instead of stream:false?
 * Non-streaming requires the AI to generate ALL tokens before returning a
 * single byte.  For 6000-token legs this takes 25-45 s with nothing on the
 * wire — edge-function idle-connection timeouts kill the request.  Streaming
 * sends the first byte in 1-2 s, keeps the connection alive, and Deno's fetch
 * reads it incrementally.  Same generation time, zero timeout risk.
 */
async function callAIStreaming(
  providers: AIProvider[],
  messages: Array<{ role: string; content: string }>,
  maxTokens: number,
): Promise<string> {
  for (const provider of providers) {
    console.log(`[callAI] Trying ${provider.name} (${provider.model}), maxTokens=${maxTokens}`);

    // 50-second abort per provider attempt — enough for a 3-day leg
    const controller = new AbortController();
    const timer = setTimeout(() => {
      console.warn(`[callAI] ${provider.name} aborted after 50 s`);
      controller.abort();
    }, 50000);

    let response: Response;
    try {
      response = await fetch(provider.url, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${provider.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: provider.model, max_tokens: Math.min(maxTokens, provider.maxOutputTokens ?? maxTokens), stream: true, messages }),
      });
    } catch (err) {
      clearTimeout(timer);
      const name = (err as Error)?.name ?? '';
      console.warn(`[callAI] ${provider.name} ${name === 'AbortError' ? 'timed out' : 'network error'}: ${err}`);
      continue;
    }

    if (response.status === 401 || response.status === 403) {
      clearTimeout(timer);
      throw new Error('AI_AUTH_FAILED');
    }
    if (!response.ok) {
      clearTimeout(timer);
      let errText = ''; try { errText = await response.text(); } catch { /* ignore */ }
      console.warn(`[callAI] ${provider.name} returned ${response.status}: ${errText.slice(0, 300)}`);
      continue;
    }

    try {
      const text = await collectSSEStream(response.body!);
      clearTimeout(timer);
      if (text.length > 50) {
        console.log(`[callAI] ${provider.name} success, collected ${text.length} chars`);
        return text;
      }
      console.warn(`[callAI] ${provider.name} collected empty/short text (${text.length} chars)`);
    } catch (err) {
      clearTimeout(timer);
      console.warn(`[callAI] ${provider.name} stream collection error:`, err);
    }
  }
  throw new Error('All AI providers failed');
}

/**
 * Wrap plain text as a ReadableStream of SSE events in the same format
 * that the Gemini/OpenAI streaming APIs use.  The frontend reads these events
 * identically to a live stream, so no frontend change is required.
 */
function textToSSEStream(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const chunkSize = 40;
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (let i = 0; i < text.length; i += chunkSize) {
        const chunk = text.slice(i, i + chunkSize);
        const payload = JSON.stringify({ choices: [{ delta: { content: chunk } }] });
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
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

    // ── AI keys ─────────────────────────────────────────────────────────────
    // Strip ALL non-printable / non-ASCII characters — Deno's fetch API throws
    // "Value is not a valid ByteString" if the Authorization header value
    // contains any byte outside U+0020–U+007E (e.g. trailing \n, \r, or BOM
    // that some secret stores silently append).
    const sanitizeKey = (k: string | undefined) =>
      k?.replace(/[^\x20-\x7E]/g, '').trim() ?? '';
    const GROQ_API_KEY      = sanitizeKey(Deno.env.get("GROQ_API_KEY"))      || undefined;
    const GOOGLE_AI_API_KEY = sanitizeKey(Deno.env.get("GOOGLE_AI_API_KEY")) || undefined;

    // ── Build city legs ─────────────────────────────────────────────────────
    const isMultiCity = (cities?.length ?? 0) > 1;
    const cityLegs: CityLeg[] = cities?.length
      ? cities
      : [{ cityId: '', cityName, countryName, daysToSpend: numDays, cityDescription }];

    // ── Weather — fetch per leg so each city gets its own forecast ──────────
    console.log('[generate-itinerary] WEATHER ENFORCER RUNNING — fetching per-leg weather for', cityLegs.map(l => l.cityName));
    const weatherByDay: DayWeather[] = [];
    for (const leg of cityLegs) {
      const legWeather = await fetchWeather(leg.cityName, leg.daysToSpend);
      // Take up to daysToSpend entries for this leg
      weatherByDay.push(...legWeather.slice(0, leg.daysToSpend));
    }

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
      if (userPreferences.diningStyle)           parts.push(`Dining style: ${Array.isArray(userPreferences.diningStyle) ? userPreferences.diningStyle.join(', ') : userPreferences.diningStyle}`);
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
    const maxActivities = getMaxActivities(pace);
    const startTime = preferredStartTime || getDefaultStartTime(pace);
    const endTime = getDayEndTime(pace);
    const availableHours = getAvailableHours(startTime, endTime);

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
        legContext += `Leg ${idx + 1}: ${leg.cityName}, ${leg.countryName} — Days ${currentDay}–${endDay} (${leg.daysToSpend} day${leg.daysToSpend > 1 ? 's' : ''})\n`;
        currentDay = endDay + 1;
      });
      legContext += '\n⚠️ CRITICAL — DAY NUMBERING: Day numbers are SEQUENTIAL across ALL legs. NEVER restart at "Day 1" for a new city. Example: if Leg 1 ends on Day 3, Leg 2\'s first day header must be "## Day 4", not "## Day 1".\n';

      // Build explicit per-city generation checklist
      let dayChecklistStart = 1;
      legContext += '\nYOU MUST GENERATE ACTIVITIES FOR EVERY CITY LISTED BELOW — NO EXCEPTIONS:\n';
      cityLegs.forEach((leg, idx) => {
        const endDay = dayChecklistStart + leg.daysToSpend - 1;
        legContext += `  City ${idx + 1}: ${leg.cityName} → Days ${dayChecklistStart}–${endDay} — generate FULL days for ALL ${leg.daysToSpend} day${leg.daysToSpend > 1 ? 's' : ''}\n`;
        dayChecklistStart = endDay + 1;
      });
      legContext += `  TOTAL: ${numDays} days — do NOT stop after the first city. Incomplete output is NOT acceptable.`;
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

CRITICAL SCHEDULING RULE — ENFORCE BEFORE WRITING EACH ACTIVITY:
- Day starts: ${startTime}
- Day MUST end by: ${endTime} — the LAST activity (dinner) must FINISH by this time
- Total available: ~${availableHours} hours
- Travel time between activities: 20–30 minutes each (count this against the budget every time)
- Pace "${pace}" allows MAXIMUM ${sightseeingCount} sightseeing attractions and ${maxActivities} total non-transport activities per day

SELF-CHECK: After each activity: (prev end) + (20–30 min travel) + (duration) = new total. If new total pushes dinner past ${endTime} → remove last non-meal activity instead. Priority when short on time: keep meals + flex; drop extra evening/afternoon attractions.
VERIFY after each day: last activity (dinner) finishes by ${endTime}. If not, remove the last 1–2 non-meal activities. Fewer activities that fit > many that overflow.

PRICE TIERS — MANDATORY:
- Every activity MUST include a price tier in the pipe fields: € (free/very cheap), €€ (moderate, €5–25 entry or mid-range meal), €€€ (premium, €25–80), €€€€ (luxury/exclusive)
- Use local currency symbol appropriate to the destination (€ for Europe, $ for Americas, etc.)
- Restaurants: € = street food/casual (<€15/head), €€ = bistro (€15–40/head), €€€ = fine dining (€40–80/head), €€€€ = Michelin/tasting menu (€80+/head)
- Attractions: € = free or <€5, €€ = €5–20, €€€ = €20–50, €€€€ = >€50

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
- **[Breakfast: Café/Restaurant Name]** | restaurant | €€ | [Duration, e.g., 45 min] | [Time, e.g., 8:30 AM]
  [1-2 sentence description. Specific neighbourhood/address hint.]
  Why: [Why this breakfast spot suits today's itinerary and traveller profile]
- **[Activity Name]** | attraction | €€ | [Duration] | [Time]
  [Description]
  Why: [Reasoning — crowds, lighting, proximity to next stop, etc.]
- **🚶 Travel to [Next Place]** | transport | € | [N min] | [Time]
  [Walk/Metro/Bus/Taxi — specific line or route if known]
  Why: [Most efficient or scenic route]

### Afternoon
- **[Activity Name]** | attraction | €€ | [Duration] | [Time]
  [Description]
  Why: [Reasoning]
- **🚶 Travel to [Next Place]** | transport | € | [N min] | [Time]
  [Route description]
  Why: [Why this mode]
- **[Lunch: Restaurant Name]** | restaurant | €€ | [Duration] | [Time]
  [Description]
  Why: [Reasoning]
- **🗺️ Wander & Explore: [Neighbourhood/Area Name]** | flex | € | [Duration, e.g., 45 min] | [Time]
  [Brief description of what makes this neighbourhood worth wandering — markets, street art, cafés, architecture, vibe. Be specific.]
  Why: [Why this neighbourhood fits here — proximity, character, relaxed pace after structured activity]

### Evening
- **[Activity Name]** | attraction | €€ | [Duration] | [Time]
  [Description]
  Why: [Reasoning]
- **🚶 Travel to [Restaurant]** | transport | € | [N min] | [Time]
  [Route]
  Why: [Reasoning]
- **[Dinner: Restaurant Name]** | restaurant | €€€ | [Duration] | [Time]
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

FLEX BLOCKS: Insert exactly 1 per day (🗺️ Wander & Explore [Neighbourhood]) after a cluster of structured activities. Give a soft suggestion of what to find there. Include Why: line.

BOOKING WARNINGS: Add ⚠️ Book [X] weeks ahead immediately after the description (before Why:) for any activity requiring advance reservation — Michelin restaurants (2–3 weeks), major attractions (1–2 weeks), shows/sports (as needed). Omit for walk-in venues.

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
10. PACE AND TIME BUDGET — absolute maximum: light ends 6 PM (max 5 acts), moderate ends 8 PM (max 7 acts), full ends 9:30 PM (max 9 acts). Travel = 20–30 min each time. Track cumulative time — remove last non-meal activity if dinner overshoots the cap.
11. Use REAL places that exist — no invented names
12. Insert booking warnings (⚠️) for ALL activities that typically require advance reservation
13. Insert exactly 1 flex block per day (🗺️ Wander & Explore format)
14. EVERY activity including restaurants, transport, and flex blocks MUST have a price tier in the pipe fields (€, €€, €€€, or €€€€). This field is mandatory — never omit it.
${isMultiCity ? `15. Use "## Leg N: CityName" header before each city section, then CONTINUE day numbers. NEVER restart at "Day 1" for a second city — use the next sequential day number
16. Start each new city leg with transit/arrival logistics` : ''}
${flightConstraintContext ? '17. STRICTLY honour all flight constraints listed above — do not schedule activities outside allowed windows' : ''}`;

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

${isMultiCity ? (() => {
      let d = 1;
      return 'GENERATE FULL CONTENT FOR EVERY CITY — DO NOT STOP EARLY:\n' +
        cityLegs.map(leg => {
          const start = d;
          const end = d + leg.daysToSpend - 1;
          d = end + 1;
          return `  → ${leg.cityName}: Days ${start}–${end} (${leg.daysToSpend} days)`;
        }).join('\n') +
        `\nThe itinerary is NOT complete until ALL ${numDays} days are written. Write each city fully before moving to the next.`;
    })() : `Generate exactly ${numDays} days.`}
Every day requires ALL of the following:
- Breakfast (morning)
- A 🚶 travel block between every sightseeing activity
- Lunch (afternoon)
- Dinner (evening)
- Exactly 1 flex block (🗺️ Wander & Explore [neighbourhood])
- ⚠️ booking warnings on any activity that typically needs advance reservation
- A price tier (€/€€/€€€/€€€€) in the pipe fields of EVERY activity
Activity density follows the "${pace}" pace setting (~${sightseeingCount} sightseeing activities/day).
TIME CONSTRAINT: Day starts ${startTime} and MUST end by ${endTime} (~${availableHours} hours available, ~${maxActivities} total activities maximum). Count travel time (20–30 min) between every activity. After writing each day, verify the last activity ends before ${endTime} — if not, remove the last 1–2 non-meal activities.
Every item — including travel and flex blocks — must have a "Why:" line.
${startDate ? `Use the exact dates from the calendar context in every ## Day heading.` : ''}
${flightConstraintContext ? 'Strictly honour all flight constraints.' : ''}`;

    // ── Build provider list ──────────────────────────────────────────────────
    // 4-provider cascade: Gemini 2.0 Flash → Gemini 1.5 Flash → Groq 70B → Groq 8B.
    // Multiple entries per API key mean that if 2.0-flash is rate-limited (429),
    // 1.5-flash gets tried next before falling back to Groq.  The Groq 8B instant
    // model has much higher TPM limits than the 70B, so it almost always succeeds
    // even when the 70B quota is exhausted.
    const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
    const GROQ_URL   = "https://api.groq.com/openai/v1/chat/completions";
    const providers: AIProvider[] = [];
    if (GOOGLE_AI_API_KEY) {
      providers.push({ key: GOOGLE_AI_API_KEY, url: GEMINI_URL, model: "gemini-2.0-flash", name: "Gemini-2.0" });
      providers.push({ key: GOOGLE_AI_API_KEY, url: GEMINI_URL, model: "gemini-1.5-flash", name: "Gemini-1.5" });
    }
    if (GROQ_API_KEY) {
      providers.push({ key: GROQ_API_KEY, url: GROQ_URL, model: "llama-3.3-70b-versatile", name: "Groq-70B" });
      // llama-3.1-8b-instant has very high TPM (131K) but lower per-request output cap (~8K).
      // Used as last-resort fallback when higher-quality models are rate-limited.
      providers.push({ key: GROQ_API_KEY, url: GROQ_URL, model: "llama-3.1-8b-instant", name: "Groq-8B", maxOutputTokens: 8000 });
    }
    if (providers.length === 0) {
      console.error("No AI API key configured");
      return new Response(
        JSON.stringify({ error: "The AI service is not configured. Please contact support." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Response headers used for both streaming paths
    const responseHeaders = {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Weather-Data": JSON.stringify(weatherByDay),
      "X-Trip-Legs": JSON.stringify(cityLegs),
    };

    // ── MULTI-CITY: per-leg generation ───────────────────────────────────────
    // Each city leg is generated in a separate, focused AI call (non-streaming).
    // This prevents attention degradation across long outputs and allows per-leg
    // validation + retry without regenerating the entire trip.
    if (isMultiCity) {
      console.log('[generate-itinerary] MULTI-CITY per-leg mode:', cityLegs.map(l => `${l.cityName}(${l.daysToSpend}d)`).join(' → '));

      // Reusable format rules block shared by all leg prompts
      const sharedFormatRules = `OUTPUT FORMAT — follow this structure EXACTLY for every day:

## Day N — [Weekday, Month Day] (or "Day N" if no date given): [Thematic title]

### Start Time: ${startTime}

### Weather
Condition: [e.g., Partly cloudy]
Temperature: [e.g., 14°C – 22°C]
Rain: [e.g., 15%]
Note: [One practical sentence]

### Morning
- **[Breakfast: Name]** | restaurant | €€ | [Duration] | [Time]
  [Description]
  Why: [Reasoning]
- **[Activity]** | attraction | €€ | [Duration] | [Time]
  [Description]
  Why: [Reasoning]
- **🚶 Travel to [Next]** | transport | € | [N min] | [Time]
  [Route]
  Why: [Route reasoning]

### Afternoon
- **[Activity]** | attraction | €€ | [Duration] | [Time] [Description] Why: [Reasoning]
- **[Lunch: Name]** | restaurant | €€ | [Duration] | [Time] [Description] Why: [Reasoning]
- **🗺️ Wander & Explore: [Neighbourhood]** | flex | € | [Duration] | [Time] [Description] Why: [Reasoning]

### Evening
- **[Activity]** | attraction | €€ | [Duration] | [Time] [Description] Why: [Reasoning]
- **[Dinner: Name]** | restaurant | €€€ | [Duration] | [Time]
  [Description]
  ⚠️ Book [X] weeks ahead · [How to book]
  Why: [Reasoning]

## Packing Tips
- [Tip]

## Transport Tips
- [Tip]

ACTIVITY TYPES: attraction | restaurant | transport | flex | prebooked
FLEX BLOCKS: 1 per day (🗺️ Wander & Explore [Neighbourhood]). Always include Why: line.
BOOKING WARNINGS: ⚠️ Book [X] weeks ahead after description, before Why:, for anything needing advance reservation.

STRICT RULES:
0. Every day: breakfast (morning) + lunch (afternoon) + dinner (evening) — real named venues only.
1. Every sightseeing activity → followed by 🚶 Travel block with time and mode.
2. Day titles thematic, not just "Day N" or the city name.
3. Every activity (including transport, flex) must have a price tier (€/€€/€€€/€€€€).
4. Every activity must have a Why: reasoning line.
5. Group nearby attractions to minimise travel.
6. PACE: ${pace} — max ${sightseeingCount} sightseeing/day, ${maxActivities} total, day ends by ${endTime}. Travel = 20–30 min each time. Remove last non-meal activity if dinner overshoots the cap.
7. Use REAL places that exist — no invented names.
8. Dietary restrictions: ${dietaryPreferences.length > 0 ? dietaryPreferences.join(', ') : 'none'}.`;

      // ── Precompute day ranges for all legs ────────────────────────────────────
      // Must happen synchronously so parallel closures share no mutable counter.
      let _dayCounter = 1;
      const legRanges = cityLegs.map((leg) => {
        const startDay = _dayCounter;
        const endDay   = _dayCounter + leg.daysToSpend - 1;
        _dayCounter    = endDay + 1;
        return { startDay, endDay };
      });

      // ── Build all per-leg prompt configs upfront ──────────────────────────────
      const legConfigs = cityLegs.map((leg, legIdx) => {
        const { startDay: legStartDay, endDay: legEndDay } = legRanges[legIdx];

        const legWeather = weatherByDay.slice(legStartDay - 1, legEndDay);
        const legWeatherCtx = legWeather.length > 0
          ? legWeather.map((w, i) => `Day ${legStartDay + i}: ${w.condition}, ${w.tempMin}°C–${w.tempMax}°C, ${w.precipChance}% rain`).join('\n')
          : 'Weather data unavailable — assume typical seasonal conditions.';

        const legCalendar = startDate
          ? (() => {
              const lines: string[] = [];
              for (let i = 0; i < leg.daysToSpend; i++) {
                const d = new Date(startDate + 'T12:00:00Z');
                d.setUTCDate(d.getUTCDate() + (legStartDay - 1) + i);
                const weekday = d.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
                const monthDay = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });
                lines.push(`Day ${legStartDay + i} = ${weekday}, ${monthDay}`);
              }
              return 'CALENDAR DATES:\n' + lines.join('\n');
            })()
          : '';

        const legFlightLines = flightDetails
          .filter(f => f.dayNumber >= legStartDay && f.dayNumber <= legEndDay)
          .map(f => {
            if (f.type === 'arrival') {
              const intl = f.isInternational ? 'Allow 45 min immigration + 30 min baggage + 30 min transit + 60 min hotel check-in.' : 'Allow 20 min baggage + transit + 30 min check-in.';
              return `⚠ ARRIVAL Day ${f.dayNumber}: flight lands at ${f.time}. ${intl}`;
            } else {
              const buf = f.isInternational ? '2h 30m' : '1h 30m';
              return `⚠ DEPARTURE Day ${f.dayNumber}: flight at ${f.time}. Last activity must end ≥ ${buf} before departure.`;
            }
          });
        const legFlightCtx = legFlightLines.length > 0
          ? `\nFLIGHT CONSTRAINTS (must be respected):\n${legFlightLines.join('\n')}`
          : '';

        const legCityContext = getDeepCityContext(leg.cityName);

        const sysPrompt = `You are an expert travel planner for ${leg.cityName}, ${leg.countryName}.${legCityContext ? `\n${legCityContext}` : ''}

${legCalendar}
${legFlightCtx}

THIS IS LEG ${legIdx + 1} OF A ${cityLegs.length}-CITY TRIP.
Generate ONLY Days ${legStartDay}–${legEndDay} (${leg.daysToSpend} day${leg.daysToSpend > 1 ? 's' : ''}) for ${leg.cityName}.
Day numbers are GLOBAL and SEQUENTIAL across the entire trip.
Use ## Day ${legStartDay} through ## Day ${legEndDay} as headers.
NEVER write ## Day 1 or restart numbering — day numbers must start at ${legStartDay}.
${legIdx === 0 ? '' : `This leg immediately follows the previous city. ${leg.cityName} is the NEXT city in the trip.`}

SELF-CHECK: After each day, verify last activity (dinner) finishes by ${endTime}. If not, remove last non-meal activity.

${sharedFormatRules}`;

        const dayList = Array.from({ length: leg.daysToSpend }, (_, i) => `Day ${legStartDay + i}`).join(', ');
        const usrPrompt = `Generate ${leg.daysToSpend} day${leg.daysToSpend > 1 ? 's' : ''} for ${leg.cityName}, ${leg.countryName}.

Days to generate: ${dayList}
Travel style: ${travelStyle} | Budget: ${budgetLevel} | Pace: ${pace} | Start time: ${startTime}
Dietary: ${dietaryPreferences.length > 0 ? dietaryPreferences.join(', ') : 'none'}${userProfileContext}
${leg.cityDescription ? `\nAbout ${leg.cityName}: ${leg.cityDescription}` : ''}

Weather:
${legWeatherCtx}

Generate EXACTLY these days with headers ## Day ${legStartDay}${leg.daysToSpend > 1 ? ` through ## Day ${legEndDay}` : ''}.
Each day: Breakfast + attractions + 🚶 travel blocks + Lunch + 1 flex block + Dinner.
Every item must have a price tier and Why: line.${legFlightCtx ? '\nStrictly honour all flight constraints.' : ''}`;

        return { leg, legIdx, startDay: legStartDay, endDay: legEndDay, sysPrompt, usrPrompt, weatherCtx: legWeatherCtx };
      });

      // ── Progressive streaming response ────────────────────────────────────────
      // CRITICAL: Return HTTP 200 immediately via TransformStream — this prevents
      // the Supabase edge-function wall-clock timeout (60 s free / 150 s Pro) from
      // killing the request before any bytes reach the client.
      //
      // Generation runs in a background async IIFE.  Legs are started in PARALLEL
      // with a 3-second stagger so they don't all hammer the same provider at the
      // same millisecond (which would exhaust rate limits immediately).  Each leg
      // resolves independently; the streaming loop pipes them to the client IN ORDER
      // as soon as each one completes — so the user sees leg-1 content in ~15-25 s
      // regardless of how long later legs take.
      const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
      const writer  = writable.getWriter();
      const encoder = new TextEncoder();
      const SSE_CHUNK = 40;

      const pipeTextAsSSE = async (text: string) => {
        for (let i = 0; i < text.length; i += SSE_CHUNK) {
          const chunk   = text.slice(i, i + SSE_CHUNK);
          const payload = JSON.stringify({ choices: [{ delta: { content: chunk } }] });
          await writer.write(encoder.encode(`data: ${payload}\n\n`));
        }
      };

      // Each promise resolves to the leg text (or '' on total failure — never rejects).
      const legPromises: Promise<string>[] = legConfigs.map((cfg) =>
        new Promise<string>(resolve => {
          // Stagger starts so legs don't all hit Gemini simultaneously
          setTimeout(async () => {
            console.log(`[generate-itinerary] Leg ${cfg.legIdx + 1}/${cityLegs.length}: ${cfg.leg.cityName} Days ${cfg.startDay}–${cfg.endDay} starting`);
            try {
              let legText = await callAIStreaming(providers, [
                { role: 'system', content: cfg.sysPrompt },
                { role: 'user',   content: cfg.usrPrompt },
              ], 5120);

              // Validate — retry missing/empty days once
              const missingDays = findMissingDays(legText, cfg.startDay, cfg.endDay);
              if (missingDays.length > 0) {
                console.warn(`[generate-itinerary] Leg ${cfg.legIdx + 1} missing days: ${missingDays.join(', ')} — retrying`);
                const retryDayList = missingDays.map(d => `Day ${d}`).join(', ');
                const retryPrompt = `The previous response was incomplete. Generate ONLY the following missing days for ${cfg.leg.cityName}: ${retryDayList}.

Use the same trip parameters (${travelStyle}, ${budgetLevel}, ${pace}) and the same output format.
Start time: ${startTime}. End by: ${endTime}. Dietary: ${dietaryPreferences.join(', ') || 'none'}.
Weather: ${cfg.weatherCtx}
Each day: Breakfast + 2–3 attractions with 🚶 travel blocks + Lunch + 1 flex block + Dinner.
Every item must have price tier and Why: line.
Use ## Day N headers with EXACTLY these day numbers: ${retryDayList}.`;
                try {
                  const retryText = await callAIStreaming(providers, [
                    { role: 'system', content: cfg.sysPrompt },
                    { role: 'user',   content: retryPrompt },
                  ], 5120);
                  legText += '\n\n' + retryText;
                  console.log(`[generate-itinerary] Leg ${cfg.legIdx + 1} retry done`);
                } catch {
                  console.warn(`[generate-itinerary] Leg ${cfg.legIdx + 1} retry also failed — proceeding with partial`);
                }
              } else {
                console.log(`[generate-itinerary] Leg ${cfg.legIdx + 1} validated — all ${cfg.leg.daysToSpend} days present`);
              }
              resolve(legText);
            } catch (err) {
              console.error(`[generate-itinerary] Leg ${cfg.legIdx + 1} (${cfg.leg.cityName}) failed:`, err);
              resolve(''); // resolve empty rather than reject so other legs can still stream
            }
          }, cfg.legIdx * 3000); // 3 s stagger: leg 0 at 0 s, leg 1 at 3 s, leg 2 at 6 s
        })
      );

      // Background loop: pipe each leg to client IN ORDER as its promise resolves
      (async () => {
        try {
          for (let i = 0; i < legPromises.length; i++) {
            const text = await legPromises[i];
            if (text) await pipeTextAsSSE((i > 0 ? '\n\n' : '') + text);
          }
          console.log(`[generate-itinerary] All ${cityLegs.length} legs streamed to client`);
        } catch (err) {
          console.error('[generate-itinerary] Streaming loop error:', err);
        } finally {
          await writer.write(encoder.encode('data: [DONE]\n\n'));
          await writer.close().catch(() => {});
        }
      })();

      return new Response(readable, { headers: responseHeaders });
    }

    // ── SINGLE-CITY: existing streaming approach ─────────────────────────────
    // Single city / single leg trips use a direct streaming passthrough.
    // Output is bounded (~3000-8000 tokens) so truncation risk is minimal.

    console.log(`[generate-itinerary] Single-city mode: ${destinationsList} (${numDays} days)`);

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userPrompt },
    ];

    let aiResponse: Response | null = null;

    // Single-city uses direct streaming passthrough (most efficient — first tokens
    // reach the client in 1-2 s).  Each provider attempt gets a 45 s AbortSignal
    // for the initial connection; once HTTP 200 headers arrive, the timer is cleared
    // so the body stream is never cancelled mid-way.
    const SINGLE_MAX = 10240; // safe for up to 7-day trips on Gemini/Groq-70B

    for (const provider of providers) {
      const effectiveMax = Math.min(SINGLE_MAX, provider.maxOutputTokens ?? SINGLE_MAX);
      console.log(`[single-city] Trying ${provider.name} (${provider.model}), max_tokens=${effectiveMax}`);

      const attemptFetch = async (): Promise<Response | null> => {
        const ctrl  = new AbortController();
        const timer = setTimeout(() => {
          console.warn(`[single-city] ${provider.name} connection timed out after 45 s`);
          ctrl.abort();
        }, 45000);
        try {
          const r = await fetch(provider.url, {
            method: "POST",
            signal: ctrl.signal,
            headers: { "Authorization": `Bearer ${provider.key}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: provider.model, max_tokens: effectiveMax, stream: true, messages }),
          });
          clearTimeout(timer); // headers received — don't abort the body stream
          return r;
        } catch (err) {
          clearTimeout(timer);
          const name = (err as Error)?.name ?? '';
          console.warn(`[single-city] ${provider.name} ${name === 'AbortError' ? 'timed out' : 'fetch error'}: ${err}`);
          return null;
        }
      };

      let attempt = await attemptFetch();
      if (!attempt) continue; // timed out or network error — try next provider

      if (!attempt.ok && (attempt.status === 429 || attempt.status === 503)) {
        console.warn(`[single-city] ${provider.name} returned ${attempt.status} — retrying once in 5 s…`);
        await new Promise(r => setTimeout(r, 5000));
        attempt = await attemptFetch() ?? attempt; // keep original if retry also times out
      }

      if (attempt.ok) {
        aiResponse = attempt;
        break;
      }
      if (attempt.status === 401 || attempt.status === 403) {
        return new Response(
          JSON.stringify({ error: "The AI service key is invalid or missing. Please contact support." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      let errText = ''; try { errText = await attempt.text(); } catch { /* ignore */ }
      console.warn(`[single-city] ${provider.name} failed (${attempt.status}) — trying next. Body: ${errText.slice(0, 300)}`);
    }

    if (!aiResponse) {
      return new Response(
        JSON.stringify({ error: "The AI service is busy right now. Please wait 15 seconds and try again." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(aiResponse.body, { headers: responseHeaders });

  } catch (error) {
    console.error("Unhandled error in generate-itinerary:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
