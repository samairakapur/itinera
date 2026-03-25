-- =============================================================================
-- PHASE 1A MIGRATION: Group Trip Foundation
-- =============================================================================
-- SAFE: All operations use IF NOT EXISTS / ADD COLUMN IF NOT EXISTS
-- No existing tables are dropped or modified destructively.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. ADD GROUP COLUMNS TO EXISTING itineraries TABLE
-- ---------------------------------------------------------------------------
ALTER TABLE public.itineraries
  ADD COLUMN IF NOT EXISTS group_size         INTEGER,
  ADD COLUMN IF NOT EXISTS trip_mode          TEXT    NOT NULL DEFAULT 'organizer'
                                              CHECK (trip_mode IN ('organizer', 'democratic')),
  ADD COLUMN IF NOT EXISTS budget_level       TEXT    CHECK (budget_level IN ('budget', 'midrange', 'premium', 'mixed')),
  ADD COLUMN IF NOT EXISTS invite_token       TEXT    UNIQUE,
  ADD COLUMN IF NOT EXISTS invite_link_active BOOLEAN NOT NULL DEFAULT true;


-- ---------------------------------------------------------------------------
-- 2. BACKFILL INVITE TOKENS FOR EXISTING TRIPS
-- ---------------------------------------------------------------------------
UPDATE public.itineraries
SET invite_token = LEFT(REPLACE(gen_random_uuid()::text, '-', ''), 12)
WHERE invite_token IS NULL;


-- ---------------------------------------------------------------------------
-- 3. trip_member_preferences
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trip_member_preferences (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id              UUID        NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  user_id              UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  budget_comfort       TEXT        CHECK (budget_comfort IN ('budget', 'midrange', 'premium')),
  dietary_restrictions TEXT[]      NOT NULL DEFAULT '{}',
  mobility_needs       TEXT        CHECK (mobility_needs IN ('fully_mobile', 'minimal_walking', 'wheelchair')),
  interests            TEXT[]      NOT NULL DEFAULT '{}',
  travel_pace          TEXT        CHECK (travel_pace IN ('packed', 'balanced', 'relaxed')),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (trip_id, user_id)
);

ALTER TABLE public.trip_member_preferences ENABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------------
-- 4. trip_proposals
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trip_proposals (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id         UUID        NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  proposed_by     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proposal_type   TEXT        NOT NULL
                  CHECK (proposal_type IN (
                    'add_activity', 'remove_activity', 'swap_activity',
                    'change_time', 'change_restaurant', 'change_day_start'
                  )),
  proposal_data   JSONB       NOT NULL DEFAULT '{}',
  status          TEXT        NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open', 'approved', 'rejected', 'expired')),
  voting_deadline TIMESTAMPTZ,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_proposals ENABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------------
-- 5. trip_votes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trip_votes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID        NOT NULL REFERENCES public.trip_proposals(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote        TEXT        NOT NULL CHECK (vote IN ('yes', 'no', 'neutral')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (proposal_id, user_id)
);

ALTER TABLE public.trip_votes ENABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------------
-- 6. bookings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookings (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id               UUID        NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  itinerary_item_id     UUID        REFERENCES public.itinerary_items(id) ON DELETE SET NULL,
  booking_type          TEXT        NOT NULL
                        CHECK (booking_type IN ('attraction', 'restaurant', 'flight', 'accommodation')),
  provider              TEXT        NOT NULL
                        CHECK (provider IN ('viator', 'opentable', 'resy', 'amadeus', 'manual')),
  external_reference    TEXT,
  booking_url           TEXT,
  status                TEXT        NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  total_price           DECIMAL(10,2),
  currency              TEXT,
  price_per_person      DECIMAL(10,2),
  group_size_at_booking INTEGER,
  cancellation_policy   TEXT,
  booked_by             UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  booked_at             TIMESTAMPTZ,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------------
-- 7. trip_activity_feed
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trip_activity_feed (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id       UUID        NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  user_id       UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  activity_type TEXT        NOT NULL
                CHECK (activity_type IN (
                  'member_joined', 'activity_added', 'activity_removed',
                  'vote_started', 'vote_resolved', 'booking_made',
                  'flight_added', 'schedule_changed', 'trip_created'
                )),
  activity_data JSONB       NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_activity_feed ENABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------------
-- 8. INDEXES
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_trip_member_prefs_trip ON public.trip_member_preferences(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_member_prefs_user ON public.trip_member_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_proposals_trip    ON public.trip_proposals(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_proposals_status  ON public.trip_proposals(status);
CREATE INDEX IF NOT EXISTS idx_trip_votes_proposal    ON public.trip_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_bookings_trip          ON public.bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status        ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_activity_feed_trip     ON public.trip_activity_feed(trip_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created  ON public.trip_activity_feed(created_at DESC);


-- ---------------------------------------------------------------------------
-- 9. ENABLE REALTIME
-- ---------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_proposals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_activity_feed;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_member_preferences;


-- ---------------------------------------------------------------------------
-- 10. RLS POLICIES
-- ---------------------------------------------------------------------------

-- ── trip_member_preferences ────────────────────────────────────────────────
CREATE POLICY "Users can read their own trip preferences"
  ON public.trip_member_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trip preferences"
  ON public.trip_member_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trip preferences"
  ON public.trip_member_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trip preferences"
  ON public.trip_member_preferences FOR DELETE
  USING (auth.uid() = user_id);


-- ── trip_proposals ─────────────────────────────────────────────────────────
CREATE POLICY "Trip members can read proposals"
  ON public.trip_proposals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = trip_id AND i.user_id = auth.uid()
    )
    OR public.is_itinerary_collaborator(trip_id)
  );

CREATE POLICY "Trip members can create proposals"
  ON public.trip_proposals FOR INSERT
  WITH CHECK (
    auth.uid() = proposed_by
    AND (
      EXISTS (
        SELECT 1 FROM public.itineraries i
        WHERE i.id = trip_id AND i.user_id = auth.uid()
      )
      OR public.is_itinerary_collaborator(trip_id)
    )
  );

CREATE POLICY "Proposal creator can update their proposal"
  ON public.trip_proposals FOR UPDATE
  USING (auth.uid() = proposed_by);


-- ── trip_votes ─────────────────────────────────────────────────────────────
CREATE POLICY "Trip members can read votes"
  ON public.trip_votes FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.trip_proposals tp
      JOIN public.itineraries i ON i.id = tp.trip_id
      WHERE tp.id = proposal_id
        AND (i.user_id = auth.uid() OR public.is_itinerary_collaborator(i.id))
    )
  );

CREATE POLICY "Users can cast their own vote"
  ON public.trip_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can change their own vote"
  ON public.trip_votes FOR UPDATE
  USING (auth.uid() = user_id);


-- ── bookings ───────────────────────────────────────────────────────────────
CREATE POLICY "Trip members can view bookings"
  ON public.bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = trip_id
        AND (i.user_id = auth.uid() OR public.is_itinerary_collaborator(i.id))
    )
  );

CREATE POLICY "Trip members can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (
    auth.uid() = booked_by
    AND EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = trip_id
        AND (i.user_id = auth.uid() OR public.is_itinerary_collaborator(i.id))
    )
  );

CREATE POLICY "Booker or owner can update bookings"
  ON public.bookings FOR UPDATE
  USING (
    auth.uid() = booked_by
    OR EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = trip_id AND i.user_id = auth.uid()
    )
  );


-- ── trip_activity_feed ─────────────────────────────────────────────────────
CREATE POLICY "Trip members can read activity feed"
  ON public.trip_activity_feed FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = trip_id
        AND (i.user_id = auth.uid() OR public.is_itinerary_collaborator(i.id))
    )
  );


-- ---------------------------------------------------------------------------
-- 11. PRIVACY VIEW — budget aggregate (no individual exposure)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.trip_budget_summary AS
SELECT
  trip_id,
  COUNT(*)                                             AS member_count,
  COUNT(*) FILTER (WHERE budget_comfort = 'budget')    AS budget_count,
  COUNT(*) FILTER (WHERE budget_comfort = 'midrange')  AS midrange_count,
  COUNT(*) FILTER (WHERE budget_comfort = 'premium')   AS premium_count,
  CASE
    WHEN COUNT(DISTINCT budget_comfort) = 1 THEN MIN(budget_comfort)
    ELSE 'mixed'
  END AS resolved_budget
FROM public.trip_member_preferences
GROUP BY trip_id;
