import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type TransportInfo = Tables<'transport_info'>;

export const useTransport = (cityId: string | undefined) => {
  return useQuery({
    queryKey: ['transport', cityId],
    queryFn: async () => {
      if (!cityId) throw new Error('City ID is required');
      
      const { data, error } = await supabase
        .from('transport_info')
        .select('*')
        .eq('city_id', cityId)
        .single();
      
      if (error) throw error;
      return data as TransportInfo;
    },
    enabled: !!cityId,
  });
};
