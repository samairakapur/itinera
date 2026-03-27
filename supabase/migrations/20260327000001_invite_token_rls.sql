-- ===========================================================================
-- Invite Token RLS: allow any visitor to look up a trip by its invite_token
-- ===========================================================================
-- Problem: AcceptInvite.tsx queries itineraries by invite_token, but the only
-- existing SELECT policies require the requester to be the trip owner or an
-- already-accepted collaborator.  A brand-new user clicking an invite link is
-- neither, so the query returns 0 rows → "Link not found" error.
--
-- Fix: add a permissive SELECT policy that lets anyone (even anonymous) read
-- a trip row when it has an active invite link.  We intentionally allow anon
-- access so a user can see the trip info *before* creating an account.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Allow anyone to look up a trip by invite_token (invite page)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'itineraries'
      AND policyname = 'Anyone can view trip via active invite token'
  ) THEN
    CREATE POLICY "Anyone can view trip via active invite token"
    ON public.itineraries
    FOR SELECT
    USING (
      invite_link_active = true
      AND invite_token IS NOT NULL
    );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Allow a joining user to INSERT themselves into trip_collaborators
--    Currently the only insert policy requires the *owner* to add people.
--    We need self-join via invite link to work for any authenticated user.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'trip_collaborators'
      AND policyname = 'Authenticated users can self-join via invite link'
  ) THEN
    CREATE POLICY "Authenticated users can self-join via invite link"
    ON public.trip_collaborators
    FOR INSERT
    WITH CHECK (
      auth.uid() = user_id
      AND EXISTS (
        SELECT 1 FROM public.itineraries i
        WHERE i.id = itinerary_id
          AND i.invite_link_active = true
          AND i.invite_token IS NOT NULL
      )
    );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Allow joining user to INSERT into trip_activity_feed (member_joined)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'trip_activity_feed'
      AND policyname = 'Trip members can log activity feed events'
  ) THEN
    CREATE POLICY "Trip members can log activity feed events"
    ON public.trip_activity_feed
    FOR INSERT
    WITH CHECK (
      auth.uid() = user_id
      AND (
        -- Owner
        EXISTS (
          SELECT 1 FROM public.itineraries i
          WHERE i.id = trip_id AND i.user_id = auth.uid()
        )
        -- Collaborator
        OR EXISTS (
          SELECT 1 FROM public.trip_collaborators tc
          WHERE tc.itinerary_id = trip_id AND tc.user_id = auth.uid()
        )
      )
    );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Backfill: ensure every existing trip has an invite_token
-- ---------------------------------------------------------------------------
UPDATE public.itineraries
SET invite_token = LEFT(REPLACE(gen_random_uuid()::text, '-', ''), 12)
WHERE invite_token IS NULL;
