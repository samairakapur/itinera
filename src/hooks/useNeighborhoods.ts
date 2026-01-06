import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Neighborhood = Tables<'neighborhoods'>;

export const useNeighborhoods = (cityId: string | undefined) => {
  return useQuery({
    queryKey: ['neighborhoods', cityId],
    queryFn: async () => {
      if (!cityId) throw new Error('City ID is required');
      
      const { data, error } = await supabase
        .from('neighborhoods')
        .select('*')
        .eq('city_id', cityId)
        .order('name');
      
      if (error) throw error;
      return data as Neighborhood[];
    },
    enabled: !!cityId,
  });
};
