-- =====================================================================
-- Extend flight_details with IATA codes, delay tracking, and
-- international flag so the scheduling engine can compute accurate
-- airport-transfer buffers and propagate delays into day constraints.
--
-- All columns are nullable / have defaults so existing rows are safe.
-- =====================================================================

ALTER TABLE public.flight_details
  ADD COLUMN IF NOT EXISTS origin_iata        TEXT,
  ADD COLUMN IF NOT EXISTS destination_iata   TEXT,
  ADD COLUMN IF NOT EXISTS is_international   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS delay_minutes      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS terminal           TEXT,
  ADD COLUMN IF NOT EXISTS booking_reference  TEXT,
  ADD COLUMN IF NOT EXISTS last_checked_at    TIMESTAMPTZ;

-- Index for delay monitoring queries
CREATE INDEX IF NOT EXISTS idx_flight_details_last_checked
  ON public.flight_details (last_checked_at)
  WHERE last_checked_at IS NOT NULL;

-- Index for itinerary + leg lookups (already common in queries)
CREATE INDEX IF NOT EXISTS idx_flight_details_itinerary_leg
  ON public.flight_details (itinerary_id, leg_number);
