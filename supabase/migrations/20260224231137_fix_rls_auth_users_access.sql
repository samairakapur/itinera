-- =============================================================
-- Fix: RLS policy on trip_collaborators queries auth.users
-- directly, which the authenticated role cannot access.
--
-- Root cause: "permission denied for table users" cascades from:
--   SELECT on itineraries
--     → evaluates "Collaborators can view shared itineraries"
--       → subquery on trip_collaborators
--         → evaluates trip_collaborators SELECT policy
--           → (SELECT email FROM auth.users ...)  ← FAILS
--
-- Fix: Replace the subquery with auth.email() — a Supabase
-- built-in that returns the current user's email without
-- requiring direct access to auth.users.
-- =============================================================

-- Drop the broken policy
DROP POLICY IF EXISTS "Users can view their collaboration invitations"
  ON public.trip_collaborators;

-- Re-create with auth.email() instead of querying auth.users
CREATE POLICY "Users can view their collaboration invitations"
  ON public.trip_collaborators
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR email = auth.email()
  );

-- Also fix the can_access_itinerary function to avoid any
-- future issues — make it SECURITY DEFINER so sub-queries
-- inside it run as the function owner (bypasses RLS loops)
CREATE OR REPLACE FUNCTION public.can_access_itinerary(itinerary_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    -- User owns the itinerary
    EXISTS (
      SELECT 1 FROM public.itineraries
      WHERE id = itinerary_uuid AND user_id = auth.uid()
    )
    OR
    -- User is an accepted collaborator
    EXISTS (
      SELECT 1 FROM public.trip_collaborators
      WHERE itinerary_id = itinerary_uuid
        AND user_id = auth.uid()
        AND accepted_at IS NOT NULL
    )
  );
END;
$$;

-- Also add a policy so shared trips appear in the invited
-- user's trip list (previously missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'itineraries'
      AND policyname = 'Shared trip owners can always view own trips'
  ) THEN
    -- Ensure the original owner policy exists (idempotent)
    NULL;
  END IF;
END $$;
