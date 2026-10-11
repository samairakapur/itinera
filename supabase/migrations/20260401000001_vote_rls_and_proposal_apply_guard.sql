-- =============================================================================
-- Fix: trip_votes RLS allowed any authenticated user to vote on any trip's
-- proposals (INSERT/UPDATE policies only checked auth.uid() = user_id, with
-- no check that the user is actually a collaborator on the trip). Bring them
-- in line with the SELECT policy, which already checks membership.
--
-- Also add trip_proposals.applied_at so the client can atomically "claim" an
-- approved proposal before applying its side effects, preventing the same
-- approved change from being inserted/deleted twice when multiple
-- collaborators have the trip open at once.
-- =============================================================================

DROP POLICY IF EXISTS "Users can cast their own vote" ON public.trip_votes;
CREATE POLICY "Users can cast their own vote"
  ON public.trip_votes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.trip_proposals tp
      JOIN public.itineraries i ON i.id = tp.trip_id
      WHERE tp.id = proposal_id
        AND (i.user_id = auth.uid() OR public.is_itinerary_collaborator(i.id))
    )
  );

DROP POLICY IF EXISTS "Users can change their own vote" ON public.trip_votes;
CREATE POLICY "Users can change their own vote"
  ON public.trip_votes FOR UPDATE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.trip_proposals tp
      JOIN public.itineraries i ON i.id = tp.trip_id
      WHERE tp.id = proposal_id
        AND (i.user_id = auth.uid() OR public.is_itinerary_collaborator(i.id))
    )
  );

ALTER TABLE public.trip_proposals
  ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ;

-- The original UPDATE policy only let the proposal's creator update it, but
-- resolving a vote (setting status) happens client-side from whichever
-- collaborator casts the deciding vote, and claiming a proposal for
-- side-effect application (setting applied_at) can likewise happen from any
-- collaborator's open tab — neither is necessarily the proposer. Without
-- this, both writes silently match zero rows under RLS whenever the actor
-- isn't the original proposer.
DROP POLICY IF EXISTS "Proposal creator can update their proposal" ON public.trip_proposals;
CREATE POLICY "Trip members can update proposals"
  ON public.trip_proposals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = trip_id
        AND (i.user_id = auth.uid() OR public.is_itinerary_collaborator(i.id))
    )
  );
