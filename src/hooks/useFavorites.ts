import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';

export type Favorite = Tables<'favorites'>;

export const useFavorites = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('favorites')
        .select('*, attractions(*), restaurants(*)')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useToggleFavorite = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      attractionId, 
      restaurantId 
    }: { 
      attractionId?: string; 
      restaurantId?: string 
    }) => {
      if (!user) throw new Error('Must be logged in');
      
      // Check if already favorited
      let query = supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id);
      
      if (attractionId) {
        query = query.eq('attraction_id', attractionId);
      } else if (restaurantId) {
        query = query.eq('restaurant_id', restaurantId);
      }
      
      const { data: existing } = await query.maybeSingle();
      
      if (existing) {
        // Remove favorite
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('id', existing.id);
        
        if (error) throw error;
        return { action: 'removed' };
      } else {
        // Add favorite
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            attraction_id: attractionId || null,
            restaurant_id: restaurantId || null,
          });
        
        if (error) throw error;
        return { action: 'added' };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
};

export const useIsFavorite = (attractionId?: string, restaurantId?: string) => {
  const { data: favorites } = useFavorites();
  
  if (!favorites) return false;
  
  return favorites.some(fav => 
    (attractionId && fav.attraction_id === attractionId) ||
    (restaurantId && fav.restaurant_id === restaurantId)
  );
};
