-- ===========================================================================
-- Allow trip collaborators (both pending and accepted invitations) to VIEW
-- shared itinerary data.
--
-- Problem: the share link (/trips/:id) showed "Trip not found" for users who
-- had been invited as collaborators because all SELECT policies on `itineraries`
-- and related tables only permitted the *owner* (auth.uid() = user_id).
--
-- Fix: add a SECURITY DEFINER helper function and supplementary SELECT policies
-- that grant read access when the current user's email appears in
-- `trip_collaborators` for the given itinerary.  We intentionally include
-- *pending* invitations (accepted_at IS NULL) so the invitee can view the trip
-- and decide whether to accept before clicking "Accept".
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Helper function: returns TRUE when the current user is a collaborator
-- (invited OR accepted) on the given itinerary.
-- SECURITY DEFINER ensures the sub-query inside runs as the function owner
-- and avoids RLS recursion loops.
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
      AND email = auth.email()
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- itineraries — collaborators can view the trip they were invited to
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
-- itinerary_items — collaborators can read the day-by-day activities
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
-- flight_details — collaborators can see flight info
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

-- ---------------------------------------------------------------------------
-- day_preferences — collaborators can see per-day start times, etc.
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
-- trip_legs — collaborators can see leg structure (needed for multi-city trips)
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
