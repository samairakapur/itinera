import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type City = Tables<'cities'>;

export const useCities = () => {
  return useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as City[];
    },
  });
};

export const useCity = (cityId: string | undefined) => {
  return useQuery({
    queryKey: ['city', cityId],
    queryFn: async () => {
      if (!cityId) throw new Error('City ID is required');
      
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .eq('id', cityId)
        .single();
      
      if (error) throw error;
      return data as City;
    },
    enabled: !!cityId,
  });
};
