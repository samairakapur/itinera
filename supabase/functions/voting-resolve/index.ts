// voting-resolve — resolves open proposals whose deadline has passed
// Can be called manually or via a cron job.
//
// POST /functions/v1/voting-resolve
// Body (optional): { tripId?: string } — if omitted, resolves ALL expired proposals globally

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const tripId: string | undefined = body.tripId;

    // Fetch expired open proposals
    let query = supabase
      .from('trip_proposals')
      .select('id, trip_id, proposal_type, proposal_data')
      .eq('status', 'open')
      .not('voting_deadline', 'is', null)
      .lte('voting_deadline', new Date().toISOString());

    if (tripId) query = query.eq('trip_id', tripId);

    const { data: expired, error: fetchErr } = await query;
    if (fetchErr) throw fetchErr;
    if (!expired || expired.length === 0) {
      return new Response(JSON.stringify({ resolved: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For each expired proposal, count votes and determine outcome
    const resolved: string[] = [];

    for (const proposal of expired) {
      const { data: votes } = await supabase
        .from('trip_votes')
        .select('vote')
        .eq('proposal_id', proposal.id);

      const yes = (votes ?? []).filter((v: { vote: string }) => v.vote === 'yes').length;
      const no = (votes ?? []).filter((v: { vote: string }) => v.vote === 'no').length;
      const newStatus = yes > no ? 'approved' : 'rejected';

      await supabase
        .from('trip_proposals')
        .update({ status: newStatus, resolved_at: new Date().toISOString() })
        .eq('id', proposal.id);

      // Log to activity feed
      await supabase.from('trip_activity_feed').insert({
        trip_id: proposal.trip_id,
        user_id: null,
        activity_type: 'vote_resolved',
        activity_data: {
          proposal_id: proposal.id,
          proposal_type: proposal.proposal_type,
          outcome: newStatus,
          yes_count: yes,
          no_count: no,
        },
      });

      resolved.push(proposal.id);
    }

    return new Response(
      JSON.stringify({ resolved: resolved.length, proposal_ids: resolved }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[voting-resolve]', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
