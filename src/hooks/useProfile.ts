import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TravelPreferences {
  ageRange?: string;
  travelGroupTypes?: string[];
  fitnessLevel?: string;
  walkingTolerance?: string;
  crowdComfort?: string;
  pacePreference?: string;
  indoorOutdoor?: string;
  interests?: string[];
  scheduleFlexibility?: string;
  dailyBudget?: string;
  valuePremiumSlider?: number;
  diningSpendLevel?: string;
  preferredCuisines?: string[];
  dietaryRestrictions?: string[];
  willingnessToTryNew?: string;
  diningStyle?: string;
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  travel_preferences: TravelPreferences | null;
  profile_complete: boolean;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user?.id,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: { travel_preferences?: TravelPreferences; profile_complete?: boolean }) => {
      if (!user?.id) throw new Error('No user');

      // Build the upsert payload with user id
      const upsertPayload = {
        id: user.id,
        email: user.email || null,
        travel_preferences: updates.travel_preferences 
          ? JSON.parse(JSON.stringify(updates.travel_preferences)) 
          : undefined,
        profile_complete: updates.profile_complete,
      };

      // Use upsert to handle both insert (new user) and update (existing user)
      const { data, error } = await supabase
        .from('profiles')
        .upsert(upsertPayload, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;
      return data as Profile;
    },
    onSuccess: (data) => {
      // Immediately update the cache with the new data
      queryClient.setQueryData(['profile', user?.id], data);
      // Also invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });
};
