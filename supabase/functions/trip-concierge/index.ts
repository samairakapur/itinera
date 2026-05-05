// trip-concierge — personalised AI concierge for a specific trip.
//
// POST /functions/v1/trip-concierge
// Body: { tripId: string, message: string, userId: string, tripState?: TripState | null }
//
// Context strategy:
//   • When tripState is provided (frontend snapshot), it is used directly —
//     no need to re-fetch trip/items/flights/legs from the database.
//   • When tripState is absent (e.g. TripDayMode, deep-link), falls back to
//     loading all data from the database as before.
//   • Message history (trip_messages) is always fetched fresh — it is private
//     per user and not included in the frontend snapshot.
//
// IMPORTANT: All responses return HTTP 200 so supabase.functions.invoke
// returns { data, error: null } and the frontend reads data.error.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── TripState wire-format types (mirrors src/lib/types.ts) ───────────────────
interface TripActivity {
  id: string;
  title: string;
  itemType: string;
  timeSlot: 'morning' | 'afternoon' | 'evening';
  scheduledTime?: string;
  notes?: string;
  isCompleted?: boolean;
  dayNumber: number;
}

interface TripDay {
  dayNumber: number;
  date?: string;
  startTime?: string;
  city?: string;
  activities: TripActivity[];
}

interface TripLegShape {
  legNumber: number;
  startDay: number;
  endDay: number;
  city: string;
  country?: string;
}

interface FlightShape {
  legNumber?: number;
  airline?: string;
  flightNumber?: string;
  departureCity: string;
  arrivalCity: string;
  departureDate?: string;
  departureTime?: string;
  arrivalDate?: string;
  arrivalTime?: string;
}

interface TripState {
  id: string;
  name?: string;
  numDays: number;
  startDate?: string;
  endDate?: string;
  city?: string;
  country?: string;
  budgetLevel?: string;
  pace?: string;
  travelStyle?: string;
  dietaryPreferences?: string[];
  groupSize?: number;
  legs: TripLegShape[];
  flights: FlightShape[];
  days: TripDay[];
}
// ─────────────────────────────────────────────────────────────────────────────

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const sanitizeKey = (k: string | undefined) =>
  k?.replace(/[^\x20-\x7E]/g, '').trim() ?? '';

// ── System-prompt builder — works from TripState ─────────────────────────────
function buildSystemPrompt(ts: TripState, today: Date): string {
  const tripName = ts.name || (ts.city ? `Trip to ${ts.city}` : 'Trip');

  const fmtDate = (iso: string | undefined) =>
    iso
      ? new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : 'TBD';

  const startLabel = fmtDate(ts.startDate);
  const endLabel   = fmtDate(ts.endDate);

  // ── Trip-phase context ──────────────────────────────────────────────────
  const tripStart = ts.startDate ? new Date(ts.startDate) : null;
  const tripEnd   = ts.endDate   ? new Date(ts.endDate)   : null;
  let tripPhaseContext = '';

  if (tripStart && today < tripStart) {
    tripPhaseContext = `The trip has NOT started yet. It begins on ${fmtDate(ts.startDate)}. The user is in the PLANNING phase.`;
  } else if (tripEnd && today > tripEnd) {
    tripPhaseContext = `The trip has ENDED (ended ${fmtDate(ts.endDate)}). The user may be reflecting.`;
  } else if (tripStart) {
    const msPerDay = 1000 * 60 * 60 * 24;
    const dayIdx = Math.floor((today.getTime() - tripStart.getTime()) / msPerDay);
    const dayNum = dayIdx + 1;

    const currentCity = cityForDayFromState(dayNum, ts) ?? ts.city ?? 'your destination';
    const todayDay = ts.days.find(d => d.dayNumber === dayNum);
    const todaySchedule = todayDay && todayDay.activities.length > 0
      ? todayDay.activities.map(a => `  - ${a.timeSlot}: ${a.title}${a.isCompleted ? ' ✓' : ''}`).join('\n')
      : '  No activities planned for today.';

    tripPhaseContext = `TODAY IS DAY ${dayNum} OF THE TRIP (out of ${ts.numDays} days total).
The user is currently in ${currentCity} on Day ${dayNum}.
Today's planned activities:
${todaySchedule}`;
  }

  // ── Multi-leg overview ──────────────────────────────────────────────────
  let legOverview = '';
  if (ts.legs.length > 1) {
    legOverview = '\nTRIP LEGS:\n' + ts.legs.map(l =>
      `  Leg ${l.legNumber}: ${l.city} (Days ${l.startDay}–${l.endDay})`
    ).join('\n');
  }

  // ── Full itinerary grouped by day ───────────────────────────────────────
  const itineraryLines: string[] = [];
  for (const day of ts.days) {
    const city = day.city ?? ts.city ?? 'unknown city';
    if (day.activities.length === 0) continue;
    const actLines = day.activities.map(a => {
      const note = a.notes ? ` (${a.notes})` : '';
      const done = a.isCompleted ? ' ✓' : '';
      return `  ${a.timeSlot}: ${a.title}${note}${done}`;
    });
    itineraryLines.push(`Day ${day.dayNumber} — ${city}:\n${actLines.join('\n')}`);
  }
  const itineraryContext = itineraryLines.join('\n\n') || 'No activities yet.';

  // ── Flights ─────────────────────────────────────────────────────────────
  const flightContext = ts.flights.length > 0
    ? ts.flights.slice(0, 3).map(f =>
        `Leg ${f.legNumber ?? ''}: ${f.airline ?? ''} ${f.flightNumber ?? ''} — ${f.departureCity} → ${f.arrivalCity}, departs ${f.departureTime ?? 'TBD'}`
      ).join('\n')
    : 'No flights recorded';

  const dietaryPrefs = ts.dietaryPreferences?.join(', ') || 'none';

  const full = `You are Aria, a warm and knowledgeable travel concierge for the trip "${tripName}".

TRIP: ${startLabel} – ${endLabel}, ${ts.numDays} days. Budget: ${ts.budgetLevel ?? 'not specified'}. Pace: ${ts.pace ?? 'not specified'}. Dietary: ${dietaryPrefs}.${legOverview}

ADDING/CHANGING ACTIVITIES — MANDATORY 3-STEP FLOW:
When the user asks you to add, swap, or change an activity, you MUST follow these steps in order. NEVER skip to step 3 without completing steps 1 and 2.

STEP 1 — Present real options (NO change block yet):
"Here are a few options for [activity type] in [city]:
1. **[Specific venue name, e.g. 'Studio Gaga Hong Kong']** — [1-line description]
   📍 [Neighbourhood], ⏱ [X hours], 💰 ~[price/person], ⭐ [what makes it special]
2. **[Another real venue]** — [description] ..."
Then ask: "Which one interests you?"

STEP 2 — After user picks, confirm placement (NO change block yet):
"Great! To add [venue] to Day [X]:
• I'll place it at [time] because [reason]
• [Existing activity] will be shortened/moved to make room
• Your day runs [start]–[end] total
Ready to make this change?"

STEP 3 — Only after user confirms, add the CHANGE block at the very end:
<!--CHANGE:{"action":"add","day":N,"add":{"name":"Exact Venue Name","time":"14:00","category":"attraction","description":"Brief description"}}-->

RULES:
• ALWAYS use REAL, named venues — never say "a popular dance studio in Central"
• NEVER include the <!--CHANGE:--> block in steps 1 or 2
• For remove: <!--CHANGE:{"action":"remove","day":N,"remove":"exact activity title"}-->
• For swap: <!--CHANGE:{"action":"swap","day":N,"remove":"old title","add":{...}}-->
• Only include the CHANGE block when the user has confirmed they want the change

CRITICAL — AVAILABILITY:
You do NOT have access to real-time availability data for any venue, class, or attraction. You must NEVER state or imply that a specific time slot is available. Instead of: 'The class is available at 10am' — say: 'I can place this at 10am in your itinerary, but you must confirm availability directly with the venue before committing.' This disclaimer must appear every time you suggest adding a bookable experience.

CRITICAL — TIME CONSISTENCY:
The time field in your CHANGE JSON must be the exact same time you state in your message, in HH:MM 24-hour format. If you say '9:30 AM' in your message, the JSON must contain "time":"09:30". If you say '10:00 AM', the JSON must contain "time":"10:00". Never use a different time in the JSON than what you told the user.

MANDATORY — BOOKING LINK:
Every time you suggest or add a bookable activity (class, tour, experience, attraction), end your response with exactly this line:
🔍 Search availability: https://www.viator.com/searchResults/all?text=[ACTIVITY_NAME]+[CITY]&mcid=P00294080
Replace [ACTIVITY_NAME] and [CITY] with the activity name and city (spaces replaced with +). Example: https://www.viator.com/searchResults/all?text=Cooking+Class+Coriander+Leaf+Singapore&mcid=P00294080
This line must always appear. No exceptions.${tripPhaseContext ? `\n\nCURRENT STATUS:\n${tripPhaseContext}` : ''}

ITINERARY (showing up to 10 days):
${itineraryContext}

FLIGHTS: ${flightContext}

Be warm, concise, practical. Use bullet points. Reference specific days and cities.`;

  // 5000 char cap — 3-step rules appear early (~1100 chars in) so always included
  return full.slice(0, 5000);
}

/** Find the city name for a given day number from TripState leg data. */
function cityForDayFromState(dayNum: number, ts: TripState): string | undefined {
  if (ts.legs.length === 0) return ts.city ?? undefined;
  const leg = ts.legs.find(l => l.startDay <= dayNum && l.endDay >= dayNum);
  return leg?.city ?? ts.city ?? undefined;
}

// ── DB fallback: builds system prompt from raw Supabase rows ─────────────────
// Used when no tripState is provided (e.g. TripDayMode, direct API callers).
async function buildSystemPromptFromDB(
  tripId: string,
  supabase: ReturnType<typeof createClient>,
  today: Date
): Promise<{ prompt: string; error?: string }> {
  const [tripRes, itemsRes, flightsRes, legsRes] = await Promise.all([
    supabase
      .from('itineraries')
      .select(`
        id, name, num_days, start_date, end_date, group_size, trip_mode,
        budget_level, pace, travel_style, dietary_preferences,
        cities ( name, country )
      `)
      .eq('id', tripId)
      .single(),

    supabase
      .from('itinerary_items')
      .select('day_number, time_slot, item_type, custom_title, notes')
      .eq('itinerary_id', tripId)
      .order('day_number')
      .order('order_index'),

    supabase
      .from('flight_details')
      .select('leg_number, airline, flight_number, departure_city, arrival_city, departure_time, arrival_time')
      .eq('itinerary_id', tripId),

    supabase
      .from('trip_legs')
      .select('leg_number, start_day, end_day, cities ( name, country )')
      .eq('itinerary_id', tripId)
      .order('leg_number'),
  ]);

  const trip = tripRes.data;
  if (!trip) {
    return { prompt: '', error: 'Trip not found. Make sure you are viewing an existing trip.' };
  }

  const items   = itemsRes.data   ?? [];
  const flights = flightsRes.data ?? [];
  const legs    = legsRes.data    ?? [];

  // Convert DB rows → TripState-like shape so we can reuse buildSystemPrompt
  type LegRow = { leg_number: number; start_day: number; end_day: number; cities: { name: string; country: string } | null };
  const typedLegs = legs as LegRow[];
  const cities = trip.cities as { name: string; country: string } | null;

  function cityForDayDB(dayNum: number): string {
    if (typedLegs.length === 0) return cities?.name ?? 'the destination';
    const leg = typedLegs.find(l => l.start_day <= dayNum && l.end_day >= dayNum);
    return (leg?.cities as { name: string } | null)?.name ?? cities?.name ?? 'the destination';
  }

  // Build days array from items
  const dayMap: Record<number, TripDay> = {};
  for (const item of items) {
    if (!dayMap[item.day_number]) {
      dayMap[item.day_number] = {
        dayNumber: item.day_number,
        city: cityForDayDB(item.day_number),
        activities: [],
      };
    }
    dayMap[item.day_number].activities.push({
      id: '',
      title: item.custom_title || item.item_type,
      itemType: item.item_type,
      timeSlot: item.time_slot as 'morning' | 'afternoon' | 'evening',
      notes: item.notes ?? undefined,
      dayNumber: item.day_number,
    });
  }

  const ts: TripState = {
    id: tripId,
    name: trip.name ?? undefined,
    numDays: trip.num_days,
    startDate: trip.start_date ?? undefined,
    endDate: trip.end_date ?? undefined,
    city: cities?.name ?? undefined,
    country: cities?.country ?? undefined,
    budgetLevel: (trip as Record<string, unknown>).budget_level as string | undefined,
    pace: (trip as Record<string, unknown>).pace as string | undefined,
    travelStyle: (trip as Record<string, unknown>).travel_style as string | undefined,
    dietaryPreferences: (trip.dietary_preferences as string[] | null) ?? undefined,
    legs: typedLegs.map(l => ({
      legNumber: l.leg_number,
      startDay: l.start_day,
      endDay: l.end_day,
      city: (l.cities as { name: string } | null)?.name ?? '',
      country: (l.cities as { country: string } | null)?.country ?? undefined,
    })),
    flights: flights.map(f => ({
      legNumber: (f as Record<string, unknown>).leg_number as number | undefined,
      airline: (f as Record<string, unknown>).airline as string | undefined,
      flightNumber: (f as Record<string, unknown>).flight_number as string | undefined,
      departureCity: f.departure_city,
      arrivalCity: f.arrival_city,
      departureTime: (f as Record<string, unknown>).departure_time as string | undefined,
      arrivalTime: (f as Record<string, unknown>).arrival_time as string | undefined,
    })),
    days: Object.values(dayMap),
  };

  return { prompt: buildSystemPrompt(ts, today) };
}

// ── Main handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json() as {
      tripId?: string;
      message?: string;
      userId?: string;
      tripState?: TripState | null;
    };

    const { tripId, message, userId, tripState } = body;
    console.log('[trip-concierge] request:', {
      tripId,
      userId,
      messageLen: message?.length,
      hasTripState: !!tripState,
    });

    if (!tripId || !message || !userId) {
      return json({ error: 'tripId, message, and userId are required' });
    }

    // ── AI keys ───────────────────────────────────────────────────────────
    const GROQ_API_KEY  = sanitizeKey(Deno.env.get('GROQ_API_KEY'))      || undefined;
    const GOOGLE_AI_KEY = sanitizeKey(Deno.env.get('GOOGLE_AI_API_KEY')) || undefined;

    console.log('[trip-concierge] AI keys present:', {
      groq: !!GROQ_API_KEY, google: !!GOOGLE_AI_KEY,
    });

    // ── Service-role client ───────────────────────────────────────────────
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const today = new Date();

    // ── Build system prompt ───────────────────────────────────────────────
    let systemPrompt = '';

    if (tripState && tripState.id === tripId) {
      // Fast path: use the frontend snapshot directly
      console.log('[trip-concierge] using frontend TripState snapshot');
      systemPrompt = buildSystemPrompt(tripState, today);
    } else {
      // Slow path: load from DB (TripDayMode, deep-links, missing snapshot)
      console.log('[trip-concierge] no valid tripState — loading from DB');
      const { prompt, error: dbError } = await buildSystemPromptFromDB(tripId, supabaseClient, today);
      if (dbError) return json({ error: dbError });
      systemPrompt = prompt;
    }

    // ── Fetch conversation history (always from DB — private per user) ────
    const historyRes = await supabaseClient
      .from('trip_messages')
      .select('role, content')
      .eq('trip_id', tripId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(20);

    const history = historyRes.data ?? [];

    // ── Save user message ─────────────────────────────────────────────────
    try {
      await supabaseClient.from('trip_messages').insert({
        trip_id: tripId,
        user_id: userId,
        role: 'user',
        content: message,
      });
    } catch (e) {
      console.warn('[trip-concierge] could not save user message:', e);
    }

    // ── Build messages array with history ─────────────────────────────────
    const aiMessages = [
      { role: 'system', content: systemPrompt },
      ...history.map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
      { role: 'user', content: message },
    ];

    // ── Call AI — Groq first, Gemini fallback ─────────────────────────────
    let reply = '';
    let lastError = '';

    // Provider 1: Groq
    if (GROQ_API_KEY && !reply) {
      const groqModels = [
        'llama-3.3-70b-versatile',
        'llama-3.1-8b-instant',
        'gemma2-9b-it',
        'llama3-70b-8192',
      ];

      for (const model of groqModels) {
        if (reply) break;
        console.log(`[trip-concierge] trying groq (${model})`);
        try {
          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            signal: AbortSignal.timeout(20000),
            headers: {
              'Authorization': `Bearer ${GROQ_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              messages: aiMessages,
              max_tokens: 1000,
              temperature: 0.7,
            }),
          });

          if (groqRes.ok) {
            const groqData = await groqRes.json();
            const content = groqData.choices?.[0]?.message?.content;
            if (content) {
              reply = content;
              console.log(`[trip-concierge] groq success (${model}), reply length:`, reply.length);
              break;
            } else {
              lastError = `groq (${model}) returned empty content`;
            }
          } else {
            const errText = await groqRes.text().catch(() => '');
            console.warn(`[trip-concierge] groq (${model}) returned ${groqRes.status}:`, errText.slice(0, 200));
            lastError = `groq error ${groqRes.status}`;
            if (groqRes.status === 429) break;
          }
        } catch (fetchErr) {
          console.warn(`[trip-concierge] groq (${model}) fetch error:`, fetchErr);
          lastError = 'groq fetch failed';
          break;
        }
      }
    }

    // Provider 2: Google AI (Gemini)
    if (GOOGLE_AI_KEY && !reply) {
      console.log('[trip-concierge] trying Google AI (gemini-2.0-flash)');
      try {
        const googleRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_KEY}`,
          {
            method: 'POST',
            signal: AbortSignal.timeout(25000),
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser: ${message}` }] }
              ],
              generationConfig: { maxOutputTokens: 800, temperature: 0.7 }
            })
          }
        );

        if (googleRes.ok) {
          const googleData = await googleRes.json();
          const content = googleData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (content) {
            reply = content;
            console.log('[trip-concierge] google AI success, reply length:', reply.length);
          } else {
            lastError = 'google AI returned empty content';
            console.warn('[trip-concierge] google AI response:', JSON.stringify(googleData).slice(0, 300));
          }
        } else {
          const errText = await googleRes.text().catch(() => '');
          console.warn(`[trip-concierge] google AI returned ${googleRes.status}:`, errText.slice(0, 300));
          lastError = `google AI error ${googleRes.status}`;
        }
      } catch (fetchErr) {
        console.warn('[trip-concierge] google AI fetch error:', fetchErr);
        lastError = 'google AI fetch failed';
      }
    }

    if (!reply) {
      return json({ error: `Aria couldn't respond (${lastError}). Please try again in a moment.` });
    }

    // ── Save assistant reply (private per user) ───────────────────────────
    try {
      await supabaseClient.from('trip_messages').insert({
        trip_id: tripId,
        user_id: userId,
        role: 'assistant',
        content: reply,
      });
    } catch (e) {
      console.warn('[trip-concierge] could not save assistant reply:', e);
    }

    console.log('[trip-concierge] success, reply length:', reply.length);
    return json({ reply });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isTimeout = msg.includes('timed out') || msg.includes('AbortError') || msg.includes('signal');
    console.error('[trip-concierge] unhandled error:', msg);
    return json({
      error: isTimeout
        ? 'Aria took too long to respond. Please try again.'
        : `Aria error: ${msg}`,
    });
  }
});
