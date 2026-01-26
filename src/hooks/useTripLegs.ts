import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TripLeg {
  id: string;
  itinerary_id: string;
  city_id: string;
  leg_number: number;
  start_day: number;
  end_day: number;
  notes: string | null;
  city?: {
    id: string;
    name: string;
    country: string;
    image_url: string | null;
  };
}

export const useTripLegs = (itineraryId: string | undefined) => {
  return useQuery({
    queryKey: ['trip-legs', itineraryId],
    queryFn: async () => {
      if (!itineraryId) return [];

      const { data, error } = await supabase
        .from('trip_legs')
        .select(`
          *,
          city:cities (
            id,
            name,
            country,
            image_url
          )
        `)
        .eq('itinerary_id', itineraryId)
        .order('leg_number', { ascending: true });

      if (error) throw error;
      return data as TripLeg[];
    },
    enabled: !!itineraryId,
  });
};

export const getCityForDay = (dayNumber: number, legs: TripLeg[]): TripLeg | undefined => {
  return legs.find(leg => dayNumber >= leg.start_day && dayNumber <= leg.end_day);
};
