import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Attraction = Tables<'attractions'>;

export const useAttractions = (cityId: string | undefined) => {
  return useQuery({
    queryKey: ['attractions', cityId],
    queryFn: async () => {
      if (!cityId) throw new Error('City ID is required');
      
      const { data, error } = await supabase
        .from('attractions')
        .select('*')
        .eq('city_id', cityId)
        .order('rating', { ascending: false });
      
      if (error) throw error;
      return data as Attraction[];
    },
    enabled: !!cityId,
  });
};
