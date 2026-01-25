import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CommunityTip {
  id: string;
  user_id: string;
  city_id: string;
  attraction_id: string | null;
  restaurant_id: string | null;
  category: 'attraction' | 'restaurant' | 'city';
  tip_type: 'experience' | 'timing' | 'accuracy' | 'recommendation' | 'general';
  content: string;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  user_name?: string;
  user_avatar?: string;
}

export const useCommunityTips = (
  cityId?: string,
  category?: 'attraction' | 'restaurant' | 'city',
  itemId?: string
) => {
  return useQuery({
    queryKey: ['community-tips', cityId, category, itemId],
    queryFn: async () => {
      let query = supabase
        .from('community_tips')
        .select(`
          *,
          profiles:user_id (full_name, avatar_url)
        `)
        .eq('city_id', cityId!)
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      if (itemId) {
        if (category === 'attraction') {
          query = query.eq('attraction_id', itemId);
        } else if (category === 'restaurant') {
          query = query.eq('restaurant_id', itemId);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((tip: any) => ({
        ...tip,
        user_name: tip.profiles?.full_name || 'Anonymous Traveler',
        user_avatar: tip.profiles?.avatar_url,
      })) as CommunityTip[];
    },
    enabled: !!cityId,
  });
};

export const useAddCommunityTip = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (tip: {
      city_id: string;
      attraction_id?: string;
      restaurant_id?: string;
      category: 'attraction' | 'restaurant' | 'city';
      tip_type: 'experience' | 'timing' | 'accuracy' | 'recommendation' | 'general';
      content: string;
    }) => {
      if (!user?.id) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('community_tips')
        .insert({
          user_id: user.id,
          ...tip,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['community-tips', variables.city_id],
      });
    },
  });
};

export const useDeleteCommunityTip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tipId, cityId }: { tipId: string; cityId: string }) => {
      const { error } = await supabase
        .from('community_tips')
        .delete()
        .eq('id', tipId);

      if (error) throw error;
      return { tipId, cityId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['community-tips', variables.cityId],
      });
    },
  });
};
