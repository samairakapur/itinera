-- ===========================================================================
-- trip_messages: stores AI concierge conversation history per trip
-- trip_chat: stores human group chat messages per trip
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- trip_messages (concierge)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trip_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id     UUID NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_messages_trip_id ON public.trip_messages (trip_id, created_at DESC);

ALTER TABLE public.trip_messages ENABLE ROW LEVEL SECURITY;

-- All trip members can read concierge messages
CREATE POLICY "Trip members can view concierge messages"
ON public.trip_messages FOR SELECT
USING (public.is_itinerary_collaborator(trip_id) OR public.owns_itinerary(trip_id));

-- All trip members can insert messages
CREATE POLICY "Trip members can insert concierge messages"
ON public.trip_messages FOR INSERT
WITH CHECK (public.is_itinerary_collaborator(trip_id) OR public.owns_itinerary(trip_id));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_messages;

-- ---------------------------------------------------------------------------
-- trip_chat (human group chat)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trip_chat (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id     UUID NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_chat_trip_id ON public.trip_chat (trip_id, created_at ASC);

ALTER TABLE public.trip_chat ENABLE ROW LEVEL SECURITY;

-- All trip members can read chat
CREATE POLICY "Trip members can view chat messages"
ON public.trip_chat FOR SELECT
USING (public.is_itinerary_collaborator(trip_id) OR public.owns_itinerary(trip_id));

-- All trip members can send chat messages
CREATE POLICY "Trip members can send chat messages"
ON public.trip_chat FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (public.is_itinerary_collaborator(trip_id) OR public.owns_itinerary(trip_id))
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_chat;
