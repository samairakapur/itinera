// trip-concierge — personalised AI concierge for a specific trip.
//
// POST /functions/v1/trip-concierge
// Body: { tripId: string, message: string, userId: string }
//
// Loads the full trip context (itinerary, members, flights, prefs) and
// answers the user's question using the same AI stack as generate-itinerary.
// Saves the conversation to trip_messages for shared history.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const sanitizeKey = (k: string | undefined) =>
  k?.replace(/[^\x20-\x7E]/g, '').trim() ?? '';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { tripId, message, userId } = await req.json() as {
      tripId: string;
      message: string;
      userId: string;
    };

    if (!tripId || !message || !userId) {
      return json({ error: 'tripId, message, and userId are required' }, 400);
    }

    // ── AI key setup (same priority order as generate-itinerary) ──────────
    const GROQ_API_KEY      = sanitizeKey(Deno.env.get('GROQ_API_KEY'))      || undefined;
    const LOVABLE_API_KEY   = sanitizeKey(Deno.env.get('LOVABLE_API_KEY'))   || undefined;
    const GOOGLE_AI_API_KEY = sanitizeKey(Deno.env.get('GOOGLE_AI_API_KEY')) || undefined;

    let AI_KEY: string, AI_URL: string, AI_MODEL: string;

    if (GROQ_API_KEY) {
      AI_KEY   = GROQ_API_KEY;
      AI_URL   = 'https://api.groq.com/openai/v1/chat/completions';
      AI_MODEL = 'llama-3.3-70b-versatile';
    } else if (LOVABLE_API_KEY) {
      AI_KEY   = LOVABLE_API_KEY;
      AI_URL   = 'https://ai.gateway.lovable.dev/v1/chat/completions';
      AI_MODEL = 'google/gemini-2.5-flash';
    } else if (GOOGLE_AI_API_KEY) {
      AI_KEY   = GOOGLE_AI_API_KEY;
      AI_URL   = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
      AI_MODEL = 'gemini-2.0-flash';
    } else {
      return json({ error: 'AI service not configured' }, 500);
    }

    // ── Service-role client to load all trip data ──────────────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // ── Load trip data ─────────────────────────────────────────────────────
    const [tripRes, itemsRes, collaboratorsRes, flightsRes, historyRes] = await Promise.all([
      supabase
        .from('itineraries')
        .select(`
          id, name, num_days, start_date, end_date, group_size, trip_mode,
          budget_level, pace, travel_style, dietary_preferences,
          cities ( name, country, description )
        `)
        .eq('id', tripId)
        .single(),

      supabase
        .from('itinerary_items')
        .select('day_number, time_slot, item_type, custom_title, custom_description, notes, price_tier')
        .eq('itinerary_id', tripId)
        .order('day_number')
        .order('order_index'),

      supabase
        .from('trip_collaborators')
        .select('email, role, accepted_at, user_id')
        .eq('itinerary_id', tripId),

      supabase
        .from('flight_details')
        .select('flight_type, airline, flight_number, departure_airport, arrival_airport, departure_time, arrival_time')
        .eq('itinerary_id', tripId),

      supabase
        .from('trip_messages')
        .select('role, content')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: true })
        .limit(20)
        .throwOnError(false),
    ]);

    const trip = tripRes.data;
    if (!trip) return json({ error: 'Trip not found' }, 404);

    const items = itemsRes.data ?? [];
    const collaborators = collaboratorsRes.data ?? [];
    const flights = flightsRes.data ?? [];
    const history = historyRes.data ?? [];

    // ── Build system prompt ────────────────────────────────────────────────
    const cities = trip.cities as { name: string; country: string; description?: string } | null;
    const tripName = trip.name || (cities ? `Trip to ${cities.name}` : 'Trip');
    const startDate = trip.start_date ? new Date(trip.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'TBD';
    const endDate   = trip.end_date   ? new Date(trip.end_date).toLocaleDateString('en-US',   { month: 'long', day: 'numeric', year: 'numeric' }) : 'TBD';

    // Group itinerary items by day
    const byDay: Record<number, string[]> = {};
    for (const item of items) {
      if (!byDay[item.day_number]) byDay[item.day_number] = [];
      const title = item.custom_title || item.item_type;
      const slot = item.time_slot;
      const notes = item.notes ? ` (${item.notes})` : '';
      byDay[item.day_number].push(`  ${slot}: ${title}${notes}`);
    }
    const itineraryContext = Object.entries(byDay)
      .map(([day, acts]) => `Day ${day}:\n${acts.join('\n')}`)
      .join('\n\n');

    const flightContext = flights.length > 0
      ? flights.map(f =>
          `${f.flight_type === 'inbound' ? 'Arrival' : f.flight_type === 'outbound' ? 'Departure' : 'Flight'}: ${f.airline ?? ''} ${f.flight_number ?? ''} — ${f.departure_airport} → ${f.arrival_airport}, ${f.departure_time ?? ''}`
        ).join('\n')
      : 'No flights recorded';

    const memberCount = 1 + collaborators.filter(c => c.accepted_at).length;
    const dietaryPrefs = (trip.dietary_preferences as string[] | null)?.join(', ') || 'none specified';

    const systemPrompt = `You are the personal trip concierge for "${tripName}".

TRIP DETAILS:
- Destination: ${cities?.name ?? 'Unknown'}, ${cities?.country ?? ''}
- Dates: ${startDate} – ${endDate} (${trip.num_days} days)
- Group size: ${trip.group_size ?? memberCount} people
- Budget: ${trip.budget_level ?? 'not specified'}
- Pace: ${trip.pace ?? 'not specified'}
- Travel style: ${trip.travel_style ?? 'not specified'}
- Dietary restrictions: ${dietaryPrefs}
- Trip mode: ${trip.trip_mode === 'democratic' ? 'Democratic (group votes on changes)' : 'Organiser-led'}

CURRENT ITINERARY:
${itineraryContext || 'No activities planned yet.'}

FLIGHTS:
${flightContext}

YOUR ROLE:
- Answer questions about THIS specific trip (not generic travel advice)
- Suggest alternatives, handle "what if" scenarios, help with day restructuring
- Never suggest moving Firm (confirmed/booked) activities
- When suggesting restaurants, always check dietary restrictions
- Be concise — these are travellers who want quick, actionable answers
- If asked about transport between activities, give specific directions
- Format responses clearly — use bullet points for lists`;

    // ── Save user message (best-effort — skip if table doesn't exist yet) ─
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
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
      { role: 'user', content: message },
    ];

    // ── Call AI ────────────────────────────────────────────────────────────
    const aiRes = await fetch(AI_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        max_tokens: 600,
        temperature: 0.7,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error('[trip-concierge] AI error:', aiRes.status, errText);
      if (aiRes.status === 401 || aiRes.status === 403) {
        return json({ error: 'AI API key is invalid or missing. Check Supabase Edge Function secrets (GROQ_API_KEY / LOVABLE_API_KEY / GOOGLE_AI_API_KEY).' }, 502);
      }
      if (aiRes.status === 429) {
        return json({ error: 'AI service is busy right now. Please wait a few seconds and try again.' }, 429);
      }
      return json({ error: `AI service returned ${aiRes.status}. Please try again.` }, 502);
    }

    const aiData = await aiRes.json();
    const reply: string = aiData.choices?.[0]?.message?.content ?? 'Sorry, I couldn\'t generate a response.';

    // ── Save assistant reply (best-effort) ────────────────────────────────
    try {
      await supabase.from('trip_messages').insert({
        trip_id: tripId,
        user_id: null,
        role: 'assistant',
        content: reply,
      });
    } catch (e) {
      console.warn('[trip-concierge] could not save assistant reply:', e);
    }

    return json({ reply });
  } catch (err) {
    console.error('[trip-concierge]', err);
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
