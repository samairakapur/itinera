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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['flight-details', variables.itinerary_id] });
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
      const { data, error } = await supabase
        .from('flight_details')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['flight-details', data.itinerary_id] });
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
    onSuccess: (itineraryId) => {
      queryClient.invalidateQueries({ queryKey: ['flight-details', itineraryId] });
      toast.success('Flight removed');
    },
    onError: (error) => {
      console.error('Error deleting flight:', error);
      toast.error('Failed to remove flight');
    },
  });
};
