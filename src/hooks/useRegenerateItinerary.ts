/**
 * useRegenerateItinerary
 *
 * Regenerates a *saved* itinerary with flight-aware scheduling.
 *
 * Flow:
 *  1. Convert saved flight rows → FlightConstraint[] using the itinerary's
 *     actual start_date so day numbers are exact (no provisional-date offset).
 *  2. Call the generate-itinerary edge function (same endpoint as NewTrip.tsx)
 *     with the itinerary's city / preferences + flight constraints.
 *  3. Stream + collect the full AI response text via SSE.
 *  4. Parse it with the shared parseItineraryText utility.
 *  5. DELETE all existing itinerary_items for this itinerary.
 *  6. INSERT the newly parsed items.
 *  7. Set itinerary.is_flight_aware = true.
 *  8. Invalidate the itinerary + items query caches.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { parseItineraryText } from '@/utils/itineraryParser';
import { SavedItinerary } from '@/hooks/useItineraries';
import { FlightDetail } from '@/hooks/useFlightDetails';
import { TripLeg } from '@/hooks/useTripLegs';

const ITINERARY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-itinerary`;

// ── helpers ────────────────────────────────────────────────────────────────

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60) % 24;
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

interface FlightConstraint {
  type: 'arrival' | 'departure';
  dayNumber: number;
  time: string;
  city: string;
  iata?: string;
  isInternational?: boolean;
  delayMinutes?: number;
}

/** Convert DB flight rows → FlightConstraint[] anchored to the trip start date. */
function buildFlightConstraints(
  flights: FlightDetail[],
  startDateStr: string,
): FlightConstraint[] {
  const tripStart = new Date(startDateStr + 'T12:00:00Z');

  return flights.flatMap(f => {
    const constraints: FlightConstraint[] = [];

    if (f.arrival_date && f.arrival_city) {
      const arrDate = new Date(f.arrival_date + 'T12:00:00Z');
      const dayNum = Math.round((arrDate.getTime() - tripStart.getTime()) / 86_400_000) + 1;
      if (dayNum >= 1) {
        // Add 2-hour buffer on top of the raw arrival time for the AI prompt.
        // useDayConstraints also applies a more detailed buffer (immigration +
        // baggage + transit + hotel) in the TripDetail view, but the prompt
        // needs a concrete start time to guide the AI.
        const arrivalMins = timeToMinutes(f.arrival_time || '12:00');
        const startMins = arrivalMins + 120; // +2 h
        constraints.push({
          type: 'arrival',
          dayNumber: dayNum,
          time: minutesToTime(startMins),
          city: f.arrival_city,
          iata: f.destination_iata || undefined,
          isInternational: f.is_international,
          delayMinutes: f.delay_minutes ?? 0,
        });
      }
    }

    if (f.departure_date && f.departure_city) {
      const depDate = new Date(f.departure_date + 'T12:00:00Z');
      const dayNum = Math.round((depDate.getTime() - tripStart.getTime()) / 86_400_000) + 1;
      if (dayNum >= 1) {
        constraints.push({
          type: 'departure',
          dayNumber: dayNum,
          time: f.departure_time || '12:00',
          city: f.departure_city,
          iata: f.origin_iata || undefined,
          isInternational: f.is_international,
        });
      }
    }

    return constraints;
  });
}

// ── hook ───────────────────────────────────────────────────────────────────

export interface RegenerateInput {
  itinerary: SavedItinerary;
  tripLegs: TripLeg[];
  flights: FlightDetail[];
  /** Callback to stream progress text back to the caller (optional). */
  onProgress?: (text: string) => void;
}

export const useRegenerateItinerary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itinerary, tripLegs, flights, onProgress }: RegenerateInput) => {
      // ── 1. Auth ───────────────────────────────────────────────────────
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error('Session expired. Please sign in again.');

      // ── 2. Build request body ─────────────────────────────────────────
      const startDateStr = itinerary.start_date ?? new Date().toISOString().split('T')[0];
      const flightDetails = buildFlightConstraints(flights, startDateStr);

      // Build city legs from trip_legs or fall back to the primary itinerary city.
      const cityLegs = tripLegs.length > 0
        ? tripLegs.map(leg => ({
            cityId: leg.city_id,
            cityName: leg.city?.name ?? 'Unknown City',
            countryName: leg.city?.country ?? '',
            daysToSpend: leg.end_day - leg.start_day + 1,
          }))
        : [{
            cityId: itinerary.city_id,
            cityName: itinerary.cities?.name ?? 'Unknown City',
            countryName: itinerary.cities?.country ?? '',
            daysToSpend: itinerary.num_days,
          }];

      const requestBody = {
        cities: cityLegs,
        cityName: cityLegs[0].cityName,
        countryName: cityLegs[0].countryName,
        numDays: itinerary.num_days,
        travelStyle: itinerary.travel_style ?? 'mixed',
        budgetLevel: itinerary.budget_level ?? 'medium',
        pace: itinerary.pace ?? 'moderate',
        dietaryPreferences: itinerary.dietary_preferences ?? [],
        userPreferences: null,
        startDate: startDateStr,
        flightDetails,
      };

      // ── 3. Call edge function + stream response ───────────────────────
      const response = await fetch(ITINERARY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Generation failed (${response.status})`);
      }

      if (!response.body) throw new Error('No response body from AI');

      // Read the SSE stream and collect full text
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, newlineIdx).trim();
          buffer = buffer.slice(newlineIdx + 1);

          if (!line.startsWith('data:')) continue;
          const raw = line.slice(5).trim();
          if (raw === '[DONE]') continue;

          try {
            const json = JSON.parse(raw);
            const delta = json?.choices?.[0]?.delta?.content;
            if (delta) {
              fullText += delta;
              onProgress?.(fullText);
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }

      if (!fullText.trim()) throw new Error('AI returned empty response');

      // ── 4. Parse ──────────────────────────────────────────────────────
      const parsed = parseItineraryText(fullText, itinerary.num_days);

      // ── 5. Replace itinerary_items ────────────────────────────────────
      const { error: deleteError } = await supabase
        .from('itinerary_items')
        .delete()
        .eq('itinerary_id', itinerary.id);

      if (deleteError) throw deleteError;

      const newItems = parsed.days.flatMap(day =>
        [
          ...day.morning.map((act, i) => ({
            itinerary_id: itinerary.id,
            day_number: day.dayNumber,
            time_slot: 'morning',
            order_index: i,
            item_type: act.type,
            custom_title: act.title,
            custom_description: act.description ?? null,
            notes: act.reasoning ?? null,
            attraction_id: null,
            restaurant_id: null,
          })),
          ...day.afternoon.map((act, i) => ({
            itinerary_id: itinerary.id,
            day_number: day.dayNumber,
            time_slot: 'afternoon',
            order_index: i,
            item_type: act.type,
            custom_title: act.title,
            custom_description: act.description ?? null,
            notes: act.reasoning ?? null,
            attraction_id: null,
            restaurant_id: null,
          })),
          ...day.evening.map((act, i) => ({
            itinerary_id: itinerary.id,
            day_number: day.dayNumber,
            time_slot: 'evening',
            order_index: i,
            item_type: act.type,
            custom_title: act.title,
            custom_description: act.description ?? null,
            notes: act.reasoning ?? null,
            attraction_id: null,
            restaurant_id: null,
          })),
        ]
      );

      if (newItems.length > 0) {
        const { error: insertError } = await supabase
          .from('itinerary_items')
          .insert(newItems);
        if (insertError) throw insertError;
      }

      // ── 6. Mark itinerary as flight-aware ─────────────────────────────
      await supabase
        .from('itineraries')
        .update({ is_flight_aware: true })
        .eq('id', itinerary.id);

      return { parsed, itemCount: newItems.length };
    },

    onSuccess: (_, { itinerary }) => {
      queryClient.invalidateQueries({ queryKey: ['itinerary', itinerary.id] });
      queryClient.invalidateQueries({ queryKey: ['itinerary-items', itinerary.id] });
      toast.success('Itinerary regenerated with your flight times!');
    },

    onError: (error: Error) => {
      console.error('[useRegenerateItinerary] error:', error);
      toast.error(error.message || 'Failed to regenerate itinerary');
    },
  });
};
