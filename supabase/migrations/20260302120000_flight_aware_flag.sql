-- Add is_flight_aware flag to itineraries.
-- Set to true after the itinerary has been regenerated with flight constraints,
-- so the UI knows whether to show the "Regenerate with flights" banner.

ALTER TABLE public.itineraries
  ADD COLUMN IF NOT EXISTS is_flight_aware BOOLEAN NOT NULL DEFAULT false;
