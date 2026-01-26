-- Create flight_details table for storing flight information
CREATE TABLE public.flight_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  itinerary_id UUID NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  leg_number INTEGER NOT NULL DEFAULT 1,
  airline TEXT,
  flight_number TEXT,
  departure_city TEXT NOT NULL,
  arrival_city TEXT NOT NULL,
  departure_date DATE NOT NULL,
  departure_time TIME,
  arrival_date DATE NOT NULL,
  arrival_time TIME,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create day_preferences table for per-day settings like start time
CREATE TABLE public.day_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  itinerary_id UUID NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  start_time TIME NOT NULL DEFAULT '09:00',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(itinerary_id, day_number)
);

-- Enable RLS on both tables
ALTER TABLE public.flight_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for flight_details using owns_itinerary function
CREATE POLICY "Users can view their own flight details"
  ON public.flight_details FOR SELECT
  USING (owns_itinerary(itinerary_id));

CREATE POLICY "Users can create flight details for their itineraries"
  ON public.flight_details FOR INSERT
  WITH CHECK (owns_itinerary(itinerary_id));

CREATE POLICY "Users can update their own flight details"
  ON public.flight_details FOR UPDATE
  USING (owns_itinerary(itinerary_id));

CREATE POLICY "Users can delete their own flight details"
  ON public.flight_details FOR DELETE
  USING (owns_itinerary(itinerary_id));

-- RLS policies for day_preferences
CREATE POLICY "Users can view their own day preferences"
  ON public.day_preferences FOR SELECT
  USING (owns_itinerary(itinerary_id));

CREATE POLICY "Users can create day preferences for their itineraries"
  ON public.day_preferences FOR INSERT
  WITH CHECK (owns_itinerary(itinerary_id));

CREATE POLICY "Users can update their own day preferences"
  ON public.day_preferences FOR UPDATE
  USING (owns_itinerary(itinerary_id));

CREATE POLICY "Users can delete their own day preferences"
  ON public.day_preferences FOR DELETE
  USING (owns_itinerary(itinerary_id));

-- Trigger to update updated_at on day_preferences
CREATE TRIGGER update_day_preferences_updated_at
  BEFORE UPDATE ON public.day_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();