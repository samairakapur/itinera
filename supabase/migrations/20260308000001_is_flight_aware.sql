-- Add is_flight_aware flag to itineraries
-- When true, the itinerary has been regenerated with flight constraints applied.
-- This lets the UI know whether to show the "Regenerate with flights" banner.
ALTER TABLE public.itineraries ADD COLUMN IF NOT EXISTS is_flight_aware BOOLEAN NOT NULL DEFAULT false;
