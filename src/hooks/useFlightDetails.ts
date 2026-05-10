import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FlightDetail {
  id: string;
  itinerary_id: string;
  leg_number: number;
  airline: string | null;
  flight_number: string | null;
  departure_city: string;
  arrival_city: string;
  departure_date: string;
  departure_time: string | null;
  arrival_date: string;
  arrival_time: string | null;
  notes: string | null;
  created_at: string;
  // New fields added by flight_enhancements migration
  departure_airport_iata: string | null;
  arrival_airport_iata: string | null;
  status: 'scheduled' | 'delayed' | 'cancelled' | 'landed' | null;
  departure_terminal: string | null;
  arrival_terminal: string | null;
}

export interface CreateFlightInput {
  itinerary_id: string;
  leg_number?: number;
  airline?: string;
  flight_number?: string;
  departure_city: string;
  arrival_city: string;
  departure_date: string;
  departure_time?: string;
  arrival_date: string;
  arrival_time?: string;
  notes?: string;
  departure_airport_iata?: string;
  arrival_airport_iata?: string;
  status?: string;
  departure_terminal?: string;
  arrival_terminal?: string;
}

// ---------------------------------------------------------------------------
// Trip leg synchronisation
// After any flight mutation, call this to keep trip_legs in sync with flights.
// Logic:
//   - Sort all flights for the itinerary by departure date/time
//   - Build a city timeline (which city the traveller is in on each calendar date)
//   - Convert calendar dates → day numbers relative to itinerary.start_date
//   - Upsert trip_legs rows (one per city stay)
// ---------------------------------------------------------------------------
async function syncTripLegs(itineraryId: string): Promise<void> {
  try {
    // Fetch itinerary start_date and num_days
    const { data: itinerary, error: itinError } = await supabase
      .from('itineraries')
      .select('start_date, num_days')
      .eq('id', itineraryId)
      .single();

    if (itinError || !itinerary?.start_date) return; // nothing to sync without a start date

    // Fetch all flights sorted by departure date
    const { data: flights, error: flightError } = await supabase
      .from('flight_details')
      .select('*')
      .eq('itinerary_id', itineraryId)
      .order('departure_date', { ascending: true })
      .order('departure_time', { ascending: true });

    if (flightError || !flights?.length) return;

    const startDate = new Date(itinerary.start_date + 'T00:00:00');

    // Build ordered city segments: [{ city, startDate, endDate }]
    // Each segment = one stay in a city
    interface CitySegment {
      city: string;
      startDate: Date;
      endDate: Date;
    }

    const segments: CitySegment[] = [];

    // First city = departure city of the first flight
    const firstFlight = flights[0];
    const firstCityStart = startDate;
    const firstCityEnd = new Date(firstFlight.departure_date + 'T00:00:00');
    segments.push({
      city: firstFlight.departure_city,
      startDate: firstCityStart,
      endDate: firstCityEnd,
    });

    // Subsequent cities = arrival city of each flight
    for (let i = 0; i < flights.length; i++) {
      const flight = flights[i];
      const arrivalStart = new Date(flight.arrival_date + 'T00:00:00');
      // Ends when the next flight departs (or the last day of the trip)
      const nextFlight = flights[i + 1];
      const segEnd = nextFlight
        ? new Date(nextFlight.departure_date + 'T00:00:00')
        : new Date(startDate.getTime() + (itinerary.num_days - 1) * 86400000);

      segments.push({
        city: flight.arrival_city,
        startDate: arrivalStart,
        endDate: segEnd,
      });
    }

    // Convert dates to 1-based day numbers
    function toDay(d: Date): number {
      const diff = Math.round((d.getTime() - startDate.getTime()) / 86400000);
      return Math.max(1, diff + 1);
    }

    // ── Fetch existing legs (needed as city_id fallback below) ───────────────
    const { data: existingLegsData } = await supabase
      .from('trip_legs')
      .select('city_id, leg_number, start_day, end_day, cities(id, name)')
      .eq('itinerary_id', itineraryId)
      .order('leg_number');
    const existingLegs = existingLegsData ?? [];

    // ── Resolve city_id for each segment ─────────────────────────────────────
    // Priority: exact DB match → fuzzy DB match → matching existing leg city name
    const cityNames = [...new Set(segments.map(s => s.city))];
    const { data: cityRows } = await supabase
      .from('cities')
      .select('id, name')
      .in('name', cityNames);

    const cityMap: Record<string, string> = {};
    for (const row of cityRows ?? []) {
      cityMap[row.name.toLowerCase()] = row.id;
    }

    for (const name of cityNames) {
      if (!cityMap[name.toLowerCase()]) {
        // Fuzzy DB search
        const { data: fuzzy } = await supabase
          .from('cities')
          .select('id, name')
          .ilike('name', `%${name}%`)
          .limit(1)
          .maybeSingle();
        if (fuzzy) {
          cityMap[name.toLowerCase()] = fuzzy.id;
        } else {
          // Fall back to existing leg whose city name overlaps with this segment's city
          const nameLower = name.toLowerCase();
          const legMatch = existingLegs.find(l => {
            const legCityName = ((l as any).cities?.name ?? '').toLowerCase();
            return legCityName && (legCityName.includes(nameLower) || nameLower.includes(legCityName));
          });
          if (legMatch?.city_id) {
            console.log(`[syncTripLegs] City "${name}" not in DB — matched to existing leg city_id ${legMatch.city_id}`);
            cityMap[name.toLowerCase()] = legMatch.city_id;
          }
        }
      }
    }

    // ── Build new leg rows ────────────────────────────────────────────────────
    const legRows = segments
      .map((seg, index) => {
        const cityId = cityMap[seg.city.toLowerCase()];
        if (!cityId) {
          console.warn(`[syncTripLegs] Could not resolve city_id for "${seg.city}" — aborting sync to preserve existing legs`);
          return null;
        }

        const startDay = toDay(seg.startDate);
        const endDay = toDay(seg.endDate);
        if (startDay > endDay) return null;

        return {
          itinerary_id: itineraryId,
          city_id: cityId,
          leg_number: index + 1,
          start_day: startDay,
          end_day: Math.min(endDay, itinerary.num_days),
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    if (legRows.length === 0) return;

    // ── Safety check: if we built FEWER legs than currently exist AND
    //    any original segment is unresolved, keep existing legs intact ─────────
    const unresolvedCount = segments.length - legRows.length;
    if (unresolvedCount > 0) {
      console.warn(`[syncTripLegs] ${unresolvedCount} segment(s) could not be resolved — preserving existing leg structure`);
      return;
    }

    // ── Replace legs only when we have a complete, fully-resolved set ─────────
    await supabase.from('trip_legs').delete().eq('itinerary_id', itineraryId);
    await supabase.from('trip_legs').insert(legRows);
  } catch (err) {
    // Leg sync is best-effort — don't surface errors to user
    console.warn('syncTripLegs error (non-fatal):', err);
  }
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export const useFlightDetails = (itineraryId: string | undefined) => {
  return useQuery({
    queryKey: ['flight-details', itineraryId],
    queryFn: async () => {
      if (!itineraryId) return [];

      const { data, error } = await supabase
        .from('flight_details')
        .select('*')
        .eq('itinerary_id', itineraryId)
        .order('leg_number', { ascending: true });

      if (error) throw error;
      return data as FlightDetail[];
    },
    enabled: !!itineraryId,
  });
};

export const useCreateFlightDetail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateFlightInput) => {
      const { data, error } = await supabase
        .from('flight_details')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['flight-details', variables.itinerary_id] });
      toast.success('Flight added successfully');
      // Sync trip legs based on new flight data
      await syncTripLegs(variables.itinerary_id);
      queryClient.invalidateQueries({ queryKey: ['trip-legs', variables.itinerary_id] });
      // Remind user to check the departure day schedule
      if (variables.departure_time) {
        toast.info(
          `Check your departure day — activities should end at least ${variables.departure_airport_iata ? '2h 30m' : '1h 30m'} before your ${variables.departure_time} flight.`,
          { duration: 6000 }
        );
      }
    },
    onError: (error) => {
      console.error('Error adding flight:', error);
      toast.error('Failed to add flight');
    },
  });
};

interface UpdateFlightInput {
  id: string;
  itinerary_id: string; // required so onSuccess can always call syncTripLegs
  airline?: string | null;
  flight_number?: string | null;
  departure_city?: string;
  arrival_city?: string;
  departure_date?: string;
  departure_time?: string | null;
  arrival_date?: string;
  arrival_time?: string | null;
  notes?: string | null;
  departure_airport_iata?: string | null;
  arrival_airport_iata?: string | null;
  status?: string | null;
  departure_terminal?: string | null;
  arrival_terminal?: string | null;
}

export const useUpdateFlightDetail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, itinerary_id, ...updates }: UpdateFlightInput) => {
      const { data, error } = await supabase
        .from('flight_details')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { ...(data as FlightDetail), itinerary_id: (data as FlightDetail).itinerary_id ?? itinerary_id };
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['flight-details', data.itinerary_id] });
      toast.success('Flight updated');
      await syncTripLegs(data.itinerary_id);
      queryClient.invalidateQueries({ queryKey: ['trip-legs', data.itinerary_id] });
    },
    onError: (error) => {
      console.error('Error updating flight:', error);
      toast.error('Failed to update flight');
    },
  });
};

export const useDeleteFlightDetail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, itineraryId }: { id: string; itineraryId: string }) => {
      const { error } = await supabase
        .from('flight_details')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return itineraryId;
    },
    onSuccess: async (itineraryId) => {
      queryClient.invalidateQueries({ queryKey: ['flight-details', itineraryId] });
      toast.success('Flight removed');
      await syncTripLegs(itineraryId);
      queryClient.invalidateQueries({ queryKey: ['trip-legs', itineraryId] });
    },
    onError: (error) => {
      console.error('Error deleting flight:', error);
      toast.error('Failed to remove flight');
    },
  });
};
