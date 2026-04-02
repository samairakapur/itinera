import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SavedPlace {
  id: string;
  user_id: string;
  place_name: string;
  place_type: 'attraction' | 'restaurant' | 'cafe';
  city: string;
  country?: string | null;
  image_url?: string | null;
  notes?: string | null;
  viator_product_id?: string | null;
  foursquare_id?: string | null;
  created_at: string;
}

export type SavedPlaceInsert = Omit<SavedPlace, 'id' | 'user_id' | 'created_at'>;

const QUERY_KEY = ['saved_places'];

/** Returns all saved places for the current user */
export function useSavedPlaces() {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...QUERY_KEY, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('saved_places')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as SavedPlace[];
    },
    enabled: !!user,
  });
}

/** Returns true if a place (by name + city) is already saved */
export function useIsSaved(placeName: string, city: string) {
  const { data: saved } = useSavedPlaces();
  return !!(saved?.find(
    p => p.place_name.toLowerCase() === placeName.toLowerCase() && p.city.toLowerCase() === city.toLowerCase()
  ));
}

/** Toggle save/unsave — returns { action: 'saved' | 'removed' } */
export function useToggleSavedPlace() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: saved } = useSavedPlaces();

  return useMutation({
    mutationFn: async (place: SavedPlaceInsert) => {
      if (!user) throw new Error('Must be signed in');
      const existing = saved?.find(
        p => p.place_name.toLowerCase() === place.place_name.toLowerCase() &&
             p.city.toLowerCase() === place.city.toLowerCase()
      );
      if (existing) {
        await supabase.from('saved_places').delete().eq('id', existing.id);
        return { action: 'removed' as const };
      } else {
        await supabase.from('saved_places').insert({ ...place, user_id: user.id });
        return { action: 'saved' as const };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
