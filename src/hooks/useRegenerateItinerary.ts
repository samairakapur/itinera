import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { parseItineraryText } from '@/utils/itineraryParser';
import { FlightDetail } from './useFlightDetails';
import { SavedItinerary, SavedItineraryItem } from './useItineraries';
import { differenceInDays, format } from 'date-fns';
import { enrichActivitiesWithViator } from '@/utils/viatorEnrichment';

const ITINERARY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-itinerary`;

interface FlightConstraint {
  dayNumber: number;
  type: 'arrival' | 'departure';
  time: string;         // "HH:mm"
  airportCode?: string;
  isInternational: boolean;
}

/**
 * Convert DB flight rows into FlightConstraint[] for the edge function prompt.
 */
function buildFlightConstraints(
  flights: FlightDetail[],
  startDate: Date,
): FlightConstraint[] {
  const constraints: FlightConstraint[] = [];

  for (const f of flights) {
    // Day number = (flight date - trip start) + 1
    const arrDay = differenceInDays(new Date(f.arrival_date), startDate) + 1;
    const depDay = differenceInDays(new Date(f.departure_date), startDate) + 1;

    if (f.arrival_time && arrDay >= 1) {
      constraints.push({
        dayNumber: arrDay,
        type: 'arrival',
        time: f.arrival_time.slice(0, 5),
        airportCode: f.destination_iata || undefined,
        isInternational: f.is_international ?? true,
      });
    }

    if (f.departure_time && depDay >= 1) {
      constraints.push({
        dayNumber: depDay,
        type: 'departure',
        time: f.departure_time.slice(0, 5),
        airportCode: f.origin_iata || undefined,
        isInternational: f.is_international ?? true,
      });
    }
  }

  return constraints;
}

interface RegenerateInput {
  itineraryId: string;
  itinerary: SavedItinerary;
  flights: FlightDetail[];
}

/**
 * Hook to regenerate an existing itinerary with flight constraints.
 *
 * 1. Builds flight constraints from DB flight rows
 * 2. Calls the generate-itinerary edge function with constraints
 * 3. Streams + parses the response
 * 4. Replaces itinerary_items in the DB
 * 5. Sets is_flight_aware = true
 * 6. Invalidates query caches
 */
export const useRegenerateItinerary = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itineraryId, itinerary, flights }: RegenerateInput) => {
      if (!user) throw new Error('Must be logged in');

      const startDate = itinerary.start_date ? new Date(itinerary.start_date) : new Date();
      const flightConstraints = buildFlightConstraints(flights, startDate);

      // Get session token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error('Session expired. Please sign in again.');

      // Build request body similar to NewTrip.tsx
      const cityName = itinerary.cities?.name || 'Unknown';
      const countryName = itinerary.cities?.country || '';

      const response = await fetch(ITINERARY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          cityName,
          countryName,
          numDays: itinerary.num_days,
          travelStyle: itinerary.travel_style || 'group',
          budgetLevel: itinerary.budget_level || 'moderate',
          pace: itinerary.pace || 'medium',
          dietaryPreferences: itinerary.dietary_preferences || [],
          startDate: format(startDate, 'yyyy-MM-dd'),
          flightConstraints,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          throw new Error('AI is busy. Please wait a moment and try again.');
        }
        if (response.status === 503) {
          throw new Error('AI service temporarily overloaded. Try again soon.');
        }
        throw new Error(errorData.error || 'Failed to regenerate itinerary');
      }

      // Stream the response
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            let content: string | undefined;
            if (parsed.choices?.[0]?.delta?.content) {
              content = parsed.choices[0].delta.content;
            } else if (
              parsed.type === 'content_block_delta' &&
              parsed.delta?.type === 'text_delta'
            ) {
              content = parsed.delta.text;
            }
            if (content) {
              fullText += content;
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      if (!fullText || fullText.length < 100) {
        throw new Error('Regeneration produced empty result. Please try again.');
      }

      // Parse the AI output
      const parsed = parseItineraryText(fullText, itinerary.num_days);

      if (parsed.days.length === 0) {
        throw new Error('Could not parse regenerated itinerary. Please try again.');
      }

      // Delete existing itinerary_items
      const { error: deleteError } = await supabase
        .from('itinerary_items')
        .delete()
        .eq('itinerary_id', itineraryId);

      if (deleteError) {
        console.error('[regenerate] delete items error:', deleteError);
        throw new Error('Failed to clear old itinerary items');
      }

      // Insert new itinerary_items from parsed days
      const items: Omit<SavedItineraryItem, 'id'>[] = [];

      parsed.days.forEach((day) => {
        const addItems = (activities: typeof day.morning, timeSlot: string) => {
          activities.forEach((activity, index) => {
            items.push({
              itinerary_id: itineraryId,
              day_number: day.dayNumber,
              time_slot: timeSlot,
              order_index: index,
              item_type: activity.type,
              custom_title: activity.title,
              custom_description: activity.description || null,
              notes: activity.reasoning || null,
              attraction_id: null,
              restaurant_id: null,
              price_tier: activity.priceTier ?? null,
            });
          });
        };

        addItems(day.morning, 'morning');
        addItems(day.afternoon, 'afternoon');
        addItems(day.evening, 'evening');
      });

      let insertedItems: Array<{ id: string; item_type: string; custom_title: string | null }> = [];

      if (items.length > 0) {
        const { data: savedItems, error: insertError } = await supabase
          .from('itinerary_items')
          .insert(items)
          .select('id, item_type, custom_title');

        if (insertError) {
          console.error('[regenerate] insert items error:', insertError);
          throw new Error('Failed to save regenerated itinerary items');
        }
        insertedItems = savedItems ?? [];
      }

      // Fire-and-forget Viator enrichment
      const cityName = itinerary.cities?.name ?? '';
      if (insertedItems.length > 0 && cityName) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session?.access_token) return;
          enrichActivitiesWithViator({
            items: insertedItems,
            cityName,
            budgetLevel: itinerary.budget_level ?? undefined,
            groupSize: (itinerary as any).group_size ?? undefined,
            accessToken: session.access_token,
          }).catch(() => {});
        });
      }

      // Mark itinerary as flight-aware
      const { error: updateError } = await supabase
        .from('itineraries')
        .update({
          is_flight_aware: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itineraryId);

      if (updateError) {
        console.warn('[regenerate] failed to set is_flight_aware:', updateError);
        // Non-fatal — items are already saved
      }

      return { dayCount: parsed.days.length, activityCount: items.length };
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['itinerary', variables.itineraryId] });
      queryClient.invalidateQueries({ queryKey: ['itinerary-items', variables.itineraryId] });
      queryClient.invalidateQueries({ queryKey: ['itineraries'] });
      toast.success(
        `Itinerary regenerated! ${result.dayCount} days, ${result.activityCount} activities — now flight-aware.`
      );
    },
    onError: (error: Error) => {
      console.error('[regenerate] error:', error);
      toast.error(error.message || 'Failed to regenerate itinerary');
    },
  });
};
