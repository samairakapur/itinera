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

      // Cast to satisfy Supabase types while keeping our interface
      const updatePayload: Record<string, unknown> = {};
      if (updates.travel_preferences !== undefined) {
        updatePayload.travel_preferences = JSON.parse(JSON.stringify(updates.travel_preferences));
      }
      if (updates.profile_complete !== undefined) {
        updatePayload.profile_complete = updates.profile_complete;
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });
};
