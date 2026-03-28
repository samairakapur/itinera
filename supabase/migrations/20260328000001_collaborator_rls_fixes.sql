-- ===========================================================================
-- Fix RLS for joined members so they can see all itinerary content.
--
-- Problem: Users who join via invite link are added to trip_collaborators
-- with user_id set, but:
--   1. is_itinerary_collaborator() only checked by email, not user_id
--   2. trip_days had no collaborator SELECT policy
--
-- Fix:
--   1. Update is_itinerary_collaborator to check BOTH email AND user_id
--   2. Add collaborator SELECT policy to trip_days
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Update is_itinerary_collaborator to match by user_id OR email.
--    The original only checked email = auth.email(), which fails if the
--    stored email ever differs from the auth email (e.g. social login).
--    Checking user_id is more reliable and covers all invite-link joins.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_itinerary_collaborator(itinerary_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.trip_collaborators
    WHERE itinerary_id = itinerary_uuid
      AND (
        user_id = auth.uid()
        OR email = auth.email()
      )
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. trip_days — collaborators can view days (needed for multi-city binding).
--    The original 20260201 migration only granted access to owners.
--    20260303 did not add a collaborator policy for this table.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'trip_days'
      AND policyname = 'Collaborators can view shared trip days'
  ) THEN
    CREATE POLICY "Collaborators can view shared trip days"
    ON public.trip_days
    FOR SELECT
    USING (public.is_itinerary_collaborator(itinerary_id));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Ensure itinerary_items collaborator SELECT policy exists and covers
--    user_id (not just email). Drop old email-only version if it exists,
--    then recreate with both checks.
--    The 20260126 migration created a user_id-based policy — this ensures
--    it's in the correct state even if it was accidentally dropped.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'itinerary_items'
      AND policyname = 'Collaborators can view shared itinerary items'
  ) THEN
    CREATE POLICY "Collaborators can view shared itinerary items"
    ON public.itinerary_items
    FOR SELECT
    USING (public.is_itinerary_collaborator(itinerary_id));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Ensure itineraries collaborator SELECT policy exists.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'itineraries'
      AND policyname = 'Collaborators can view shared itineraries'
  ) THEN
    CREATE POLICY "Collaborators can view shared itineraries"
    ON public.itineraries
    FOR SELECT
    USING (public.is_itinerary_collaborator(id));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 5. trip_legs — ensure collaborator policy exists (20260303 should have
--    created it, but double-check).
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'trip_legs'
      AND policyname = 'Collaborators can view shared trip legs'
  ) THEN
    CREATE POLICY "Collaborators can view shared trip legs"
    ON public.trip_legs
    FOR SELECT
    USING (public.is_itinerary_collaborator(itinerary_id));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 6. day_preferences — ensure collaborator policy exists.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'day_preferences'
      AND policyname = 'Collaborators can view shared day preferences'
  ) THEN
    CREATE POLICY "Collaborators can view shared day preferences"
    ON public.day_preferences
    FOR SELECT
    USING (public.is_itinerary_collaborator(itinerary_id));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 7. flight_details — ensure collaborator policy exists.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'flight_details'
      AND policyname = 'Collaborators can view shared flight details'
  ) THEN
    CREATE POLICY "Collaborators can view shared flight details"
    ON public.flight_details
    FOR SELECT
    USING (public.is_itinerary_collaborator(itinerary_id));
  END IF;
END $$;
