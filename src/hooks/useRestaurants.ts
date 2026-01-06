import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Restaurant = Tables<'restaurants'>;

export const useRestaurants = (cityId: string | undefined) => {
  return useQuery({
    queryKey: ['restaurants', cityId],
    queryFn: async () => {
      if (!cityId) throw new Error('City ID is required');
      
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('city_id', cityId)
        .order('rating', { ascending: false });
      
      if (error) throw error;
      return data as Restaurant[];
    },
    enabled: !!cityId,
  });
};
