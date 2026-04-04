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
    const GROQ_API_KEY    = sanitizeKey(Deno.env.get('GROQ_API_KEY'))    || undefined;
    const GOOGLE_AI_KEY   = sanitizeKey(Deno.env.get('GOOGLE_AI_API_KEY')) || undefined;
    const LOVABLE_API_KEY = sanitizeKey(Deno.env.get('LOVABLE_API_KEY')) || undefined;

    console.log('[trip-concierge] AI keys present:', {
      groq: !!GROQ_API_KEY, google: !!GOOGLE_AI_KEY, lovable: !!LOVABLE_API_KEY,
    });

    // ── Service-role client ───────────────────────────────────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // ── Load trip data ────────────────────────────────────────────────────
    const [tripRes, itemsRes, flightsRes, historyRes] = await Promise.all([
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
    ]);

    const trip = tripRes.data;
    if (!trip) {
      console.error('[trip-concierge] Trip not found:', tripId, tripRes.error);
      return json({ error: 'Trip not found. Make sure you are viewing an existing trip.' });
    }

    const items = itemsRes.data ?? [];
    const flights = flightsRes.data ?? [];
    const history = historyRes.data ?? [];

    // ── Build system prompt (max 2000 chars) ──────────────────────────────
    const cities = trip.cities as { name: string; country: string } | null;
    const tripName = trip.name || (cities ? `Trip to ${cities.name}` : 'Trip');
    const startDate = trip.start_date
      ? new Date(trip.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : 'TBD';
    const endDate = trip.end_date
      ? new Date(trip.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : 'TBD';

    const byDay: Record<number, string[]> = {};
    for (const item of items) {
      if (!byDay[item.day_number]) byDay[item.day_number] = [];
      const notes = item.notes ? ` (${item.notes})` : '';
      byDay[item.day_number].push(`  ${item.time_slot}: ${item.custom_title || item.item_type}${notes}`);
    }
    const itineraryContext = Object.entries(byDay)
      .slice(0, 7) // cap at 7 days to keep prompt short
      .map(([day, acts]) => `Day ${day}:\n${acts.join('\n')}`)
      .join('\n\n');

    const flightContext = flights.length > 0
      ? flights.slice(0, 3).map(f =>
          `Leg ${f.leg_number ?? ''}: ${f.airline ?? ''} ${f.flight_number ?? ''} — ${f.departure_city} → ${f.arrival_city}, departs ${f.departure_time ?? 'TBD'}`
        ).join('\n')
      : 'No flights recorded';

    const dietaryPrefs = (trip.dietary_preferences as string[] | null)?.join(', ') || 'none';

    const systemPromptFull = `You are Aria, a warm and knowledgeable travel concierge for the trip "${tripName}" to ${cities?.name ?? 'the destination'}, ${cities?.country ?? ''}.

TRIP: ${startDate} – ${endDate}, ${trip.num_days} days. Budget: ${trip.budget_level ?? 'not specified'}. Pace: ${trip.pace ?? 'not specified'}. Dietary: ${dietaryPrefs}.

ITINERARY:
${itineraryContext || 'No activities planned yet.'}

FLIGHTS:
${flightContext}

Be warm, concise, and actionable. Use bullet points for lists. Reference specific days and activities from the itinerary when relevant. You are also a destination expert — share local knowledge, neighbourhood tips, and practical advice about ${cities?.name ?? 'the destination'}.`;

    // Truncate system prompt to 1800 chars to stay within model limits
    const systemPrompt = systemPromptFull.slice(0, 1800);

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

    // Provider 3: Lovable gateway
    if (LOVABLE_API_KEY && !reply) {
      console.log('[trip-concierge] trying lovable (google/gemini-2.5-flash)');
      try {
        const lovableRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          signal: AbortSignal.timeout(25000),
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: aiMessages,
            max_tokens: 800,
            temperature: 0.7,
          }),
        });

        if (lovableRes.ok) {
          const lovableData = await lovableRes.json();
          const content = lovableData.choices?.[0]?.message?.content;
          if (content) {
            reply = content;
            console.log('[trip-concierge] lovable success, reply length:', reply.length);
          } else {
            lastError = 'lovable returned empty content';
          }
        } else {
          const errText = await lovableRes.text().catch(() => '');
          console.warn(`[trip-concierge] lovable returned ${lovableRes.status}:`, errText.slice(0, 300));
          lastError = `lovable error ${lovableRes.status}`;
        }
      } catch (fetchErr) {
        console.warn('[trip-concierge] lovable fetch error:', fetchErr);
        lastError = 'lovable fetch failed';
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
