import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TravelPreferences {
  ageRange?: string;
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
  diningStyle?: string[];
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  travel_preferences: TravelPreferences | null;
  profile_complete: boolean;
  has_completed_onboarding_1: boolean;
  has_completed_onboarding_2: boolean;
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
    mutationFn: async (updates: { travel_preferences?: TravelPreferences; profile_complete?: boolean; has_completed_onboarding_1?: boolean; has_completed_onboarding_2?: boolean }) => {
      if (!user?.id) throw new Error('No user');

      // Build the upsert payload with user id
      const upsertPayload: Record<string, unknown> = {
        id: user.id,
        email: user.email || null,
      };
      if (updates.travel_preferences !== undefined) {
        upsertPayload.travel_preferences = JSON.parse(JSON.stringify(updates.travel_preferences));
      }
      if (updates.profile_complete !== undefined) {
        upsertPayload.profile_complete = updates.profile_complete;
      }
      if (updates.has_completed_onboarding_1 !== undefined) {
        upsertPayload.has_completed_onboarding_1 = updates.has_completed_onboarding_1;
      }
      if (updates.has_completed_onboarding_2 !== undefined) {
        upsertPayload.has_completed_onboarding_2 = updates.has_completed_onboarding_2;
      }

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
