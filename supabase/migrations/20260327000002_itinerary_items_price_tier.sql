-- Add price_tier column to itinerary_items
-- This allows the parsed priceTier (€/€€/€€€/€€€€) to be persisted per activity
-- and loaded back without relying on re-parsing from raw text.

ALTER TABLE public.itinerary_items
  ADD COLUMN IF NOT EXISTS price_tier TEXT;
