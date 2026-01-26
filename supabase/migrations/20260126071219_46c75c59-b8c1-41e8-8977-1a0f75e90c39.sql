-- Create trip_collaborators table for sharing trips
CREATE TABLE public.trip_collaborators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  itinerary_id UUID NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor')),
  invited_by UUID NOT NULL,
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(itinerary_id, email)
);

-- Enable RLS
ALTER TABLE public.trip_collaborators ENABLE ROW LEVEL SECURITY;

-- Policy: Trip owners can manage collaborators
CREATE POLICY "Trip owners can manage collaborators"
ON public.trip_collaborators
FOR ALL
USING (owns_itinerary(itinerary_id))
WITH CHECK (owns_itinerary(itinerary_id));

-- Policy: Collaborators can view their own invitations
CREATE POLICY "Users can view their collaboration invitations"
ON public.trip_collaborators
FOR SELECT
USING (auth.uid() = user_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Update itinerary_items policy to allow collaborators to view
CREATE OR REPLACE FUNCTION public.can_access_itinerary(itinerary_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    -- User owns the itinerary
    EXISTS (
      SELECT 1 FROM public.itineraries 
      WHERE id = itinerary_uuid AND user_id = auth.uid()
    )
    OR
    -- User is a collaborator
    EXISTS (
      SELECT 1 FROM public.trip_collaborators 
      WHERE itinerary_id = itinerary_uuid 
      AND user_id = auth.uid()
      AND accepted_at IS NOT NULL
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add a policy for collaborators to view itineraries
CREATE POLICY "Collaborators can view shared itineraries"
ON public.itineraries
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.trip_collaborators
    WHERE itinerary_id = id
    AND user_id = auth.uid()
    AND accepted_at IS NOT NULL
  )
);

-- Add policy for collaborators to view itinerary items
CREATE POLICY "Collaborators can view shared itinerary items"
ON public.itinerary_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.trip_collaborators
    WHERE itinerary_id = itinerary_items.itinerary_id
    AND user_id = auth.uid()
    AND accepted_at IS NOT NULL
  )
);

-- Add policy for editors to modify itinerary items
CREATE POLICY "Collaborator editors can modify itinerary items"
ON public.itinerary_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.trip_collaborators
    WHERE itinerary_id = itinerary_items.itinerary_id
    AND user_id = auth.uid()
    AND role = 'editor'
    AND accepted_at IS NOT NULL
  )
);

-- Enable realtime for trip_collaborators
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_collaborators;
-- Enable realtime for itinerary_items for collaborative editing
ALTER PUBLICATION supabase_realtime ADD TABLE public.itinerary_items;