// trip-concierge — personalised AI concierge for a specific trip.
//
// POST /functions/v1/trip-concierge
// Body: { tripId: string, message: string, userId: string }
//
// Loads trip context and answers the user's question.
// Saves conversation to trip_messages PRIVATE per user per trip.
//
// IMPORTANT: All responses return HTTP 200 so supabase.functions.invoke
// returns { data, error: null } and the frontend reads data.error.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json() as {
      tripId?: string;
      message?: string;
      userId?: string;
    };

    const { tripId, message, userId } = body;
    console.log('[trip-concierge] request:', { tripId, userId, messageLen: message?.length });

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // ── Load trip data ────────────────────────────────────────────────────
    const [tripRes, itemsRes, flightsRes, historyRes, legsRes] = await Promise.all([
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

      // PRIVATE per user: only fetch messages where user_id = userId (both user and assistant messages)
      supabase
        .from('trip_messages')
        .select('role, content')
        .eq('trip_id', tripId)
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(20),

      // Multi-leg: load all legs with city info
      supabase
        .from('trip_legs')
        .select('leg_number, start_day, end_day, cities ( name, country )')
        .eq('itinerary_id', tripId)
        .order('leg_number'),
    ]);

    const trip = tripRes.data;
    if (!trip) {
      console.error('[trip-concierge] Trip not found:', tripId, tripRes.error);
      return json({ error: 'Trip not found. Make sure you are viewing an existing trip.' });
    }

    const items = itemsRes.data ?? [];
    const flights = flightsRes.data ?? [];
    const history = historyRes.data ?? [];
    const legs = legsRes.data ?? [];

    // ── Build system prompt (max 2000 chars) ──────────────────────────────
    const cities = trip.cities as { name: string; country: string } | null;
    const tripName = trip.name || (cities ? `Trip to ${cities.name}` : 'Trip');
    const startDate = trip.start_date
      ? new Date(trip.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : 'TBD';
    const endDate = trip.end_date
      ? new Date(trip.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : 'TBD';

    // ── Helper: find city name for a day number from legs ─────────────────
    type LegRow = { leg_number: number; start_day: number; end_day: number; cities: { name: string; country: string } | null };
    const typedLegs = legs as LegRow[];

    function cityForDay(dayNum: number): string {
      if (typedLegs.length === 0) return cities?.name ?? 'the destination';
      const leg = typedLegs.find(l => l.start_day <= dayNum && l.end_day >= dayNum);
      return (leg?.cities as { name: string } | null)?.name ?? cities?.name ?? 'the destination';
    }

    // ── Calculate current trip phase context ──────────────────────────────
    const today = new Date();
    const tripStartDate = trip.start_date ? new Date(trip.start_date) : null;
    const tripEndDate = trip.end_date ? new Date(trip.end_date) : null;
    let tripPhaseContext = '';

    if (tripStartDate && today < tripStartDate) {
      tripPhaseContext = `The trip has NOT started yet. It begins on ${tripStartDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. The user is in the PLANNING phase.`;
    } else if (tripEndDate && today > tripEndDate) {
      tripPhaseContext = `The trip has ENDED (ended ${tripEndDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}). The user may be reflecting.`;
    } else if (tripStartDate) {
      const msPerDay = 1000 * 60 * 60 * 24;
      const dayIndex = Math.floor((today.getTime() - tripStartDate.getTime()) / msPerDay);
      const dayNum = dayIndex + 1; // 1-based

      // Determine current city — use leg data for multi-city trips
      const currentCity = cityForDay(dayNum);

      // Find today's items
      const todayItems = items.filter(item => item.day_number === dayNum);
      const todaySchedule = todayItems.length > 0
        ? todayItems.map(i => `  - ${i.time_slot}: ${i.custom_title || i.item_type}`).join('\n')
        : '  No activities planned for today.';

      tripPhaseContext = `TODAY IS DAY ${dayNum} OF THE TRIP (out of ${trip.num_days} days total).
The user is currently in ${currentCity} on Day ${dayNum}.
Today's planned activities:
${todaySchedule}`;
    }

    // ── Multi-leg overview ────────────────────────────────────────────────
    let legOverview = '';
    if (typedLegs.length > 1) {
      legOverview = '\nTRIP LEGS:\n' + typedLegs.map(l => {
        const legCity = (l.cities as { name: string } | null)?.name ?? '?';
        return `  Leg ${l.leg_number}: ${legCity} (Days ${l.start_day}–${l.end_day})`;
      }).join('\n');
    }

    // ── Full itinerary with per-day city annotation ───────────────────────
    const byDay: Record<number, { acts: string[]; city: string }> = {};
    for (const item of items) {
      if (!byDay[item.day_number]) {
        byDay[item.day_number] = { acts: [], city: cityForDay(item.day_number) };
      }
      const notes = item.notes ? ` (${item.notes})` : '';
      byDay[item.day_number].acts.push(`  ${item.time_slot}: ${item.custom_title || item.item_type}${notes}`);
    }
    const itineraryContext = Object.entries(byDay)
      .slice(0, 10) // cap at 10 days to keep prompt reasonable
      .map(([day, { acts, city }]) => `Day ${day} — ${city}:\n${acts.join('\n')}`)
      .join('\n\n');

    const flightContext = flights.length > 0
      ? flights.slice(0, 3).map(f =>
          `Leg ${f.leg_number ?? ''}: ${f.airline ?? ''} ${f.flight_number ?? ''} — ${f.departure_city} → ${f.arrival_city}, departs ${f.departure_time ?? 'TBD'}`
        ).join('\n')
      : 'No flights recorded';

    const dietaryPrefs = (trip.dietary_preferences as string[] | null)?.join(', ') || 'none';

    const systemPromptFull = `You are Aria, a warm and knowledgeable travel concierge for the trip "${tripName}".

TRIP: ${startDate} – ${endDate}, ${trip.num_days} days. Budget: ${trip.budget_level ?? 'not specified'}. Pace: ${trip.pace ?? 'not specified'}. Dietary: ${dietaryPrefs}.${legOverview}

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
• Only include the CHANGE block when the user has confirmed they want the change${tripPhaseContext ? `\n\nCURRENT STATUS:\n${tripPhaseContext}` : ''}

ITINERARY (showing up to 10 days):
${itineraryContext || 'No activities yet.'}

FLIGHTS: ${flightContext}

Be warm, concise, practical. Use bullet points. Reference specific days and cities.`;

    // Truncate system prompt to 2800 chars to keep key instructions intact
    const systemPrompt = systemPromptFull.slice(0, 2800);

    // ── Save user message (private: user_id = userId) ─────────────────────
    try {
      await supabase.from('trip_messages').insert({
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

    // ── Call AI — simplified request, NO tools ────────────────────────────
    let reply = '';
    let lastError = '';

    // Provider 1: Groq — try current models in order (older ones are deprecated)
    if (GROQ_API_KEY && !reply) {
      // Models in order of preference: newest first, fallback to smaller ones
      const groqModels = [
        'llama-3.3-70b-versatile',  // current Llama 3.3 (replacement for 3.1-70b)
        'llama-3.1-8b-instant',      // fast small model, reliably available
        'gemma2-9b-it',              // Google Gemma, stable on Groq
        'llama3-70b-8192',           // older, may still work
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
              max_tokens: 700,
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
            // 404 = model not found (deprecated), try next model
            // 400 = bad request, also try next model
            // 429 = rate limit, stop trying Groq
            if (groqRes.status === 429) break;
          }
        } catch (fetchErr) {
          console.warn(`[trip-concierge] groq (${model}) fetch error:`, fetchErr);
          lastError = 'groq fetch failed';
          break; // network error, no point trying more models
        }
      }
    }

    // Provider 2: Google AI (Gemini) — already key configured in Supabase secrets
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

    // ── Save assistant reply PRIVATE per user (user_id = userId) ─────────
    try {
      await supabase.from('trip_messages').insert({
        trip_id: tripId,
        user_id: userId,   // private: associate assistant messages with the user who triggered them
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
