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
  // Enriched fields (from migration 20260225092934)
  origin_iata: string | null;
  destination_iata: string | null;
  is_international: boolean;
  delay_minutes: number;
  terminal: string | null;
  booking_reference: string | null;
  last_checked_at: string | null;
}

export interface CreateFlightInput {
  itinerary_id: string;
  leg_number?: number;
  airline?: string;
  flight_number?: string;
  departure_city: string;
  arrival_city: string;
  departure_date: string;
  departure_time?: string | null;
  arrival_date: string;
  arrival_time?: string | null;
  notes?: string | null;
  // Enriched fields
  origin_iata?: string | null;
  destination_iata?: string | null;
  is_international?: boolean;
  delay_minutes?: number;
  terminal?: string | null;
  booking_reference?: string | null;
}

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

// ---------------------------------------------------------------------------
// Helper — mark an itinerary as no longer flight-aware (non-fatal).
// Called after any flight mutation so the amber "Regenerate" banner re-appears.
// ---------------------------------------------------------------------------
async function markItineraryStale(itineraryId: string): Promise<void> {
  const { error } = await supabase
    .from('itineraries')
    .update({ is_flight_aware: false })
    .eq('id', itineraryId);
  if (error) {
    // Non-fatal: column may not exist on older DB instances.
    console.warn('[markItineraryStale] could not reset is_flight_aware:', error.message);
  }
}

export const useCreateFlightDetail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateFlightInput) => {
      // Separate guaranteed-base columns from extended columns added in migration
      // 20260225092934. Extended columns may not exist in all environments, and
      // PostgREST will throw a schema-cache error if we include unknown columns.
      const {
        origin_iata,
        destination_iata,
        is_international,
        delay_minutes,
        terminal,
        booking_reference,
        ...baseInput
      } = input;

      // Start with the base fields that always exist
      const insertData: Record<string, unknown> = { ...baseInput };

      // Only include extended fields when they carry meaningful values — this
      // prevents PostgREST from rejecting inserts if the columns don't yet exist
      // in the DB schema cache (falsy values are handled by column defaults anyway).
      if (origin_iata)       insertData.origin_iata       = origin_iata;
      if (destination_iata)  insertData.destination_iata  = destination_iata;
      if (is_international)  insertData.is_international  = is_international;
      if (delay_minutes)     insertData.delay_minutes     = delay_minutes;
      if (terminal)          insertData.terminal          = terminal;
      if (booking_reference) insertData.booking_reference = booking_reference;

      const { data, error } = await supabase
        .from('flight_details')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (_, variables) => {
      // Mark itinerary stale so "Regenerate" banner re-appears persistently
      await markItineraryStale(variables.itinerary_id);
      queryClient.invalidateQueries({ queryKey: ['flight-details', variables.itinerary_id] });
      queryClient.invalidateQueries({ queryKey: ['itinerary', variables.itinerary_id] });
      toast.success('Flight added successfully');
    },
    onError: (error: any) => {
      console.error('Error adding flight:', error);
      const msg = error?.message || error?.details || error?.hint || JSON.stringify(error);
      toast.error(`Failed to add flight: ${msg}`);
    },
  });
};

export const useUpdateFlightDetail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FlightDetail> & { id: string }) => {
      // Strip extended columns from updates to avoid schema-cache errors
      // when the migration hasn't been applied yet.
      const {
        origin_iata,
        destination_iata,
        is_international,
        delay_minutes,
        terminal,
        booking_reference,
        last_checked_at,
        ...baseUpdates
      } = updates as Partial<FlightDetail>;

      const updateData: Record<string, unknown> = { ...baseUpdates };
      if (origin_iata !== undefined)      updateData.origin_iata       = origin_iata;
      if (destination_iata !== undefined) updateData.destination_iata  = destination_iata;
      if (is_international !== undefined) updateData.is_international  = is_international;
      if (delay_minutes !== undefined)    updateData.delay_minutes     = delay_minutes;
      if (terminal !== undefined)         updateData.terminal          = terminal;
      if (booking_reference !== undefined) updateData.booking_reference = booking_reference;
      if (last_checked_at !== undefined)  updateData.last_checked_at   = last_checked_at;

      const { data, error } = await supabase
        .from('flight_details')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      await markItineraryStale(data.itinerary_id);
      queryClient.invalidateQueries({ queryKey: ['flight-details', data.itinerary_id] });
      queryClient.invalidateQueries({ queryKey: ['itinerary', data.itinerary_id] });
      toast.success('Flight updated');
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
      await markItineraryStale(itineraryId);
      queryClient.invalidateQueries({ queryKey: ['flight-details', itineraryId] });
      queryClient.invalidateQueries({ queryKey: ['itinerary', itineraryId] });
      toast.success('Flight removed');
    },
    onError: (error) => {
      console.error('Error deleting flight:', error);
      toast.error('Failed to remove flight');
    },
  });
};
