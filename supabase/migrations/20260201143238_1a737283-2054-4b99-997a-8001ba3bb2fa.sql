-- TripDay model for multi-city binding
-- Stores which leg each day belongs to + canonical date/title

CREATE TABLE IF NOT EXISTS public.trip_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id uuid NOT NULL,
  trip_leg_id uuid NOT NULL,
  day_index integer NOT NULL,
  day_date date NOT NULL,
  title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT trip_days_day_index_positive CHECK (day_index > 0),
  CONSTRAINT trip_days_unique_per_itinerary_day UNIQUE (itinerary_id, day_index)
);

CREATE INDEX IF NOT EXISTS idx_trip_days_itinerary_id ON public.trip_days (itinerary_id);
CREATE INDEX IF NOT EXISTS idx_trip_days_trip_leg_id ON public.trip_days (trip_leg_id);

ALTER TABLE public.trip_days ENABLE ROW LEVEL SECURITY;

-- RLS: only itinerary owners/collaborators via owns_itinerary
CREATE POLICY "Users can view their own trip days"
ON public.trip_days
FOR SELECT
USING (owns_itinerary(itinerary_id));

CREATE POLICY "Users can create trip days for their itineraries"
ON public.trip_days
FOR INSERT
WITH CHECK (owns_itinerary(itinerary_id));

CREATE POLICY "Users can update trip days for their itineraries"
ON public.trip_days
FOR UPDATE
USING (owns_itinerary(itinerary_id));

CREATE POLICY "Users can delete trip days for their itineraries"
ON public.trip_days
FOR DELETE
USING (owns_itinerary(itinerary_id));

-- updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_trip_days_updated_at'
  ) THEN
    CREATE TRIGGER update_trip_days_updated_at
    BEFORE UPDATE ON public.trip_days
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;