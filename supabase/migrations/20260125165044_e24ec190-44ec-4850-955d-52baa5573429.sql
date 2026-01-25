-- Create trip_legs table for leg-based multi-city trips
CREATE TABLE public.trip_legs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  itinerary_id UUID NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  city_id UUID NOT NULL REFERENCES public.cities(id),
  leg_number INTEGER NOT NULL DEFAULT 1,
  start_day INTEGER NOT NULL DEFAULT 1,
  end_day INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on trip_legs
ALTER TABLE public.trip_legs ENABLE ROW LEVEL SECURITY;

-- RLS policies for trip_legs (user must own the parent itinerary)
CREATE POLICY "Users can view their own trip legs"
ON public.trip_legs FOR SELECT
USING (owns_itinerary(itinerary_id));

CREATE POLICY "Users can create trip legs for their itineraries"
ON public.trip_legs FOR INSERT
WITH CHECK (owns_itinerary(itinerary_id));

CREATE POLICY "Users can update their own trip legs"
ON public.trip_legs FOR UPDATE
USING (owns_itinerary(itinerary_id));

CREATE POLICY "Users can delete their own trip legs"
ON public.trip_legs FOR DELETE
USING (owns_itinerary(itinerary_id));

-- Add activity completion tracking columns to itinerary_items
ALTER TABLE public.itinerary_items
ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN is_completed BOOLEAN DEFAULT false,
ADD COLUMN carried_from_day INTEGER,
ADD COLUMN scheduled_time TEXT,
ADD COLUMN estimated_duration_minutes INTEGER,
ADD COLUMN travel_time_from_previous INTEGER;

-- Add index for efficient queries
CREATE INDEX idx_trip_legs_itinerary ON public.trip_legs(itinerary_id);
CREATE INDEX idx_itinerary_items_completion ON public.itinerary_items(itinerary_id, is_completed);