-- =============================================================================
-- This migration does two things:
--
-- 1. Backports every DDL block that was previously applied ad-hoc through the
--    `apply-migrations` edge function (a one-shot DDL runner that bypassed
--    `supabase db push`). That function has now been deleted — it was a live,
--    public-facing endpoint whose only "auth" was a hardcoded passphrase
--    checked into git, giving anyone who found it full DB-owner access via
--    `sql.unsafe()`. Its DDL is reproduced here verbatim (same idempotent
--    IF NOT EXISTS / CREATE OR REPLACE / DROP+CREATE patterns, same order —
--    later blocks intentionally supersede earlier ones in the original file)
--    so the versioned migration history matches whatever state production
--    was actually left in, regardless of exactly which of those blocks ran.
--
-- 2. Adds one additional hardening fix: a scoped UPDATE policy on
--    trip_collaborators so a pending email-invitee can claim their own
--    invitation row (the app's useAcceptInvitation hook already assumes this
--    exists; without it, that path simply fails under RLS for anyone but the
--    trip owner). Scoped so a user can only claim a row addressed to their
--    own verified email, and only while it's still pending.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- Backport 1/13 — price_tier column (safe no-op if already added elsewhere)
-- ---------------------------------------------------------------------------
ALTER TABLE public.itinerary_items ADD COLUMN IF NOT EXISTS price_tier TEXT;

-- ---------------------------------------------------------------------------
-- Backport 2/13 — invite token lookup policy
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
    USING (invite_link_active = true AND invite_token IS NOT NULL);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Backport 3/13 — self-join via invite link (identity still pinned to
-- auth.uid() = user_id, so this cannot be used to enroll a different user —
-- that was a separate bug, fixed in the get-invite-trip edge function)
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
-- Backport 4/13 — backfill missing invite_tokens
-- ---------------------------------------------------------------------------
UPDATE public.itineraries
SET invite_token = LEFT(REPLACE(gen_random_uuid()::text, '-', ''), 12)
WHERE invite_token IS NULL;

-- ---------------------------------------------------------------------------
-- Backport 5/13 — is_itinerary_collaborator: check user_id OR email.
-- (Email fallback is intentional — the two live call sites that need it most,
-- trip_chat/trip_messages Realtime delivery, can't use this SECURITY DEFINER
-- function at all per backport 9 below, and every write policy using this
-- function separately pins authorship to auth.uid() = user_id, so a stale
-- email can at most grant read/participate access under the matcher's own
-- identity — never let them act as someone else.)
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
-- Backport 6/13 — collaborator SELECT policies (trip_days, itinerary_items,
-- itineraries, trip_legs, day_preferences, flight_details)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'trip_days' AND policyname = 'Collaborators can view shared trip days'
  ) THEN
    CREATE POLICY "Collaborators can view shared trip days"
    ON public.trip_days FOR SELECT
    USING (public.is_itinerary_collaborator(itinerary_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'itinerary_items' AND policyname = 'Collaborators can view shared itinerary items'
  ) THEN
    CREATE POLICY "Collaborators can view shared itinerary items"
    ON public.itinerary_items FOR SELECT
    USING (public.is_itinerary_collaborator(itinerary_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'itineraries' AND policyname = 'Collaborators can view shared itineraries'
  ) THEN
    CREATE POLICY "Collaborators can view shared itineraries"
    ON public.itineraries FOR SELECT
    USING (public.is_itinerary_collaborator(id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'trip_legs' AND policyname = 'Collaborators can view shared trip legs'
  ) THEN
    CREATE POLICY "Collaborators can view shared trip legs"
    ON public.trip_legs FOR SELECT
    USING (public.is_itinerary_collaborator(itinerary_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'day_preferences' AND policyname = 'Collaborators can view shared day preferences'
  ) THEN
    CREATE POLICY "Collaborators can view shared day preferences"
    ON public.day_preferences FOR SELECT
    USING (public.is_itinerary_collaborator(itinerary_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'flight_details' AND policyname = 'Collaborators can view shared flight details'
  ) THEN
    CREATE POLICY "Collaborators can view shared flight details"
    ON public.flight_details FOR SELECT
    USING (public.is_itinerary_collaborator(itinerary_id));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Backport 7/13 — trip_messages (AI concierge) table + realtime
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trip_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id    UUID NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trip_messages_trip_id ON public.trip_messages (trip_id, created_at DESC);
ALTER TABLE public.trip_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'trip_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_messages;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Backport 8/13 — trip_chat (group chat) table + realtime
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trip_chat (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id    UUID NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trip_chat_trip_id ON public.trip_chat (trip_id, created_at ASC);
ALTER TABLE public.trip_chat ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'trip_chat'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_chat;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Backport 9/13 — itinerary_items Viator pre-selected-tour columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.itinerary_items
  ADD COLUMN IF NOT EXISTS viator_product_code TEXT,
  ADD COLUMN IF NOT EXISTS viator_booking_url TEXT,
  ADD COLUMN IF NOT EXISTS viator_product_title TEXT,
  ADD COLUMN IF NOT EXISTS viator_price_per_person DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS viator_rating DECIMAL(3,2),
  ADD COLUMN IF NOT EXISTS viator_duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS viator_image_url TEXT;

-- ---------------------------------------------------------------------------
-- Backport 10/13 — trip_chat final RLS (inline SQL, not the SECURITY DEFINER
-- helper function, because Supabase Realtime evaluates postgres_changes
-- policies incorrectly against SECURITY DEFINER functions) + REPLICA IDENTITY
-- FULL so DELETE events carry the full row for RLS evaluation.
-- Authorship is still pinned to auth.uid() = user_id on INSERT — the email
-- branch only ever widens *membership*, never *identity*.
-- ---------------------------------------------------------------------------
ALTER TABLE public.trip_chat REPLICA IDENTITY FULL;

DROP POLICY IF EXISTS "Trip members can view chat messages" ON public.trip_chat;
DROP POLICY IF EXISTS "Trip members can send chat messages" ON public.trip_chat;

CREATE POLICY "Trip members can view chat messages"
ON public.trip_chat FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.itineraries WHERE id = trip_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.trip_collaborators WHERE itinerary_id = trip_id AND email = auth.email())
  OR EXISTS (SELECT 1 FROM public.trip_collaborators WHERE itinerary_id = trip_id AND user_id = auth.uid())
);

CREATE POLICY "Trip members can send chat messages"
ON public.trip_chat FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (
    EXISTS (SELECT 1 FROM public.itineraries WHERE id = trip_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.trip_collaborators WHERE itinerary_id = trip_id AND email = auth.email())
    OR EXISTS (SELECT 1 FROM public.trip_collaborators WHERE itinerary_id = trip_id AND user_id = auth.uid())
  )
);

-- ---------------------------------------------------------------------------
-- Backport 11/13 — owner can update Viator enrichment columns on items
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'itinerary_items' AND policyname = 'Owner can update viator enrichment on items'
  ) THEN
    CREATE POLICY "Owner can update viator enrichment on items"
    ON public.itinerary_items FOR UPDATE TO authenticated
    USING (public.owns_itinerary(itinerary_id))
    WITH CHECK (public.owns_itinerary(itinerary_id));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Backport 12/13 — profiles readable by all authenticated users (needed for
-- chat display names and the collaborator-invite existing-user lookup)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Users can read all profiles'
  ) THEN
    CREATE POLICY "Users can read all profiles"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Backport 13/13 — trip_reflections, trip_messages final (self-scoped) RLS,
-- profiles onboarding columns, saved_places table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trip_reflections (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id              UUID NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  user_id              UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  day_index            INTEGER NOT NULL,
  reflection_text      TEXT NOT NULL,
  aria_response        TEXT,
  pace_adjustment_made BOOLEAN DEFAULT false,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.trip_reflections ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'trip_reflections' AND policyname = 'Users can manage their own reflections'
  ) THEN
    CREATE POLICY "Users can manage their own reflections"
    ON public.trip_reflections FOR ALL TO authenticated
    USING  (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_trip_reflections_trip_id ON public.trip_reflections (trip_id, day_index);

-- trip_messages: final state is self-scoped reads (not just trip-wide
-- membership) — each user only ever sees their own concierge transcript, and
-- authorship on insert is pinned to auth.uid() = user_id, closing the
-- message-author-spoofing gap an earlier, now-superseded version of this
-- policy had.
DROP POLICY IF EXISTS "Trip members can view concierge messages" ON public.trip_messages;
DROP POLICY IF EXISTS "Trip members can insert concierge messages" ON public.trip_messages;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'trip_messages' AND policyname = 'Users can view own concierge messages'
  ) THEN
    CREATE POLICY "Users can view own concierge messages"
    ON public.trip_messages FOR SELECT TO authenticated
    USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'trip_messages' AND policyname = 'Users can insert own concierge messages'
  ) THEN
    CREATE POLICY "Users can insert own concierge messages"
    ON public.trip_messages FOR INSERT TO authenticated
    WITH CHECK (
      user_id = auth.uid()
      AND (
        EXISTS (SELECT 1 FROM public.itineraries WHERE id = trip_id AND user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.trip_collaborators WHERE itinerary_id = trip_id AND email = auth.email())
        OR EXISTS (SELECT 1 FROM public.trip_collaborators WHERE itinerary_id = trip_id AND user_id = auth.uid())
      )
    );
  END IF;
END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_completed_onboarding_1 boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_completed_onboarding_2 boolean DEFAULT false;

DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS public.saved_places (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    place_name         TEXT NOT NULL,
    place_type         TEXT NOT NULL CHECK (place_type IN ('attraction', 'restaurant', 'cafe')),
    city               TEXT NOT NULL,
    country            TEXT,
    image_url          TEXT,
    notes              TEXT,
    viator_product_id  TEXT,
    foursquare_id      TEXT,
    created_at         TIMESTAMPTZ DEFAULT NOW()
  );

  ALTER TABLE public.saved_places ENABLE ROW LEVEL SECURITY;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'saved_places' AND policyname = 'Users can manage their own saved places'
  ) THEN
    CREATE POLICY "Users can manage their own saved places"
    ON public.saved_places
    FOR ALL
    TO authenticated
    USING  (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;

  CREATE INDEX IF NOT EXISTS idx_saved_places_user ON public.saved_places (user_id);
END $$;


-- =============================================================================
-- New hardening: let a pending email-invitee claim their own invitation.
-- Without this, useAcceptInvitation's UPDATE (set user_id + accepted_at) has
-- no policy to authorize it for anyone but the trip owner, so it silently
-- fails under RLS for the person it's actually meant for. Scoped tightly:
-- only the row's own invited email, and only while still pending.
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'trip_collaborators' AND policyname = 'Invitee can accept their own pending invitation'
  ) THEN
    CREATE POLICY "Invitee can accept their own pending invitation"
    ON public.trip_collaborators
    FOR UPDATE
    USING (email = auth.email() AND accepted_at IS NULL)
    WITH CHECK (auth.uid() = user_id AND email = auth.email());
  END IF;
END $$;
