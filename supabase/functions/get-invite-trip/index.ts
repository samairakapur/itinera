// get-invite-trip — looks up a trip by invite_token and optionally joins it.
// Uses service_role to bypass RLS so the invite page works for any visitor
// (including users who aren't yet members of the trip).
//
// POST /functions/v1/get-invite-trip
// Body:
//   { action: 'lookup', token: string }
//   { action: 'join',   token: string, userId: string, email: string }
//
// Returns:
//   lookup → { trip: TripInfo }   or  { error: 'not_found' }
//   join   → { success: true }    or  { error: string }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // Service-role client — bypasses all RLS policies
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const body = await req.json();
    const { action, token } = body as { action: string; token: string; userId?: string; email?: string };

    if (!token) {
      return json({ error: 'missing_token' }, 400);
    }

    // -----------------------------------------------------------------------
    // LOOKUP — return trip info for the invite page
    // -----------------------------------------------------------------------
    if (action === 'lookup') {
      const { data, error } = await supabase
        .from('itineraries')
        .select(`
          id, name, num_days, start_date, end_date,
          group_size, trip_mode, invite_link_active, user_id,
          cities ( name, country )
        `)
        .eq('invite_token', token)
        .eq('invite_link_active', true)
        .single();

      if (error || !data) {
        return json({ error: 'not_found' }, 404);
      }

      const cities = data.cities as { name: string; country: string } | null;

      return json({
        trip: {
          id: data.id,
          name: data.name,
          city: cities?.name ?? null,
          country: cities?.country ?? null,
          num_days: data.num_days,
          start_date: data.start_date,
          end_date: data.end_date,
          group_size: data.group_size,
          trip_mode: data.trip_mode,
          invite_link_active: data.invite_link_active,
          owner_id: data.user_id,
        },
      });
    }

    // -----------------------------------------------------------------------
    // JOIN — add authenticated user as a collaborator
    // -----------------------------------------------------------------------
    if (action === 'join') {
      const { userId, email } = body as { userId: string; email: string };

      if (!userId) return json({ error: 'missing_user_id' }, 400);

      // First verify the invite is still active and fetch the trip id
      const { data: trip, error: tripErr } = await supabase
        .from('itineraries')
        .select('id, user_id, invite_link_active')
        .eq('invite_token', token)
        .eq('invite_link_active', true)
        .single();

      if (tripErr || !trip) {
        return json({ error: 'not_found' }, 404);
      }

      // Don't let the owner "join" their own trip
      if (trip.user_id === userId) {
        return json({ success: true, already_member: true });
      }

      // Check if already a collaborator
      const { data: existing } = await supabase
        .from('trip_collaborators')
        .select('id')
        .eq('itinerary_id', trip.id)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        return json({ success: true, already_member: true });
      }

      // Insert collaborator row
      const { error: insertErr } = await supabase.from('trip_collaborators').insert({
        itinerary_id: trip.id,
        user_id: userId,
        email: email ?? '',
        role: 'editor',
        invited_by: trip.id, // self-join via link
        accepted_at: new Date().toISOString(),
      });

      if (insertErr && insertErr.code !== '23505') {
        throw insertErr;
      }

      // Log to activity feed (ignore errors — non-critical)
      await supabase.from('trip_activity_feed').insert({
        trip_id: trip.id,
        user_id: userId,
        activity_type: 'member_joined',
        activity_data: { email: email ?? '' },
      }).then(() => {});

      return json({ success: true });
    }

    return json({ error: 'unknown_action' }, 400);
  } catch (err) {
    console.error('[get-invite-trip]', err);
    return json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      500
    );
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
