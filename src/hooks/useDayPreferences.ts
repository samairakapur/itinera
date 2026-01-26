import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DayPreference {
  id: string;
  itinerary_id: string;
  day_number: number;
  start_time: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpsertDayPreferenceInput {
  itinerary_id: string;
  day_number: number;
  start_time: string;
  notes?: string;
}

export const useDayPreferences = (itineraryId: string | undefined) => {
  return useQuery({
    queryKey: ['day-preferences', itineraryId],
    queryFn: async () => {
      if (!itineraryId) return [];

      const { data, error } = await supabase
        .from('day_preferences')
        .select('*')
        .eq('itinerary_id', itineraryId)
        .order('day_number', { ascending: true });

      if (error) throw error;
      return data as DayPreference[];
    },
    enabled: !!itineraryId,
  });
};

export const useUpsertDayPreference = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpsertDayPreferenceInput) => {
      const { data, error } = await supabase
        .from('day_preferences')
        .upsert(input, { onConflict: 'itinerary_id,day_number' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['day-preferences', variables.itinerary_id] });
    },
    onError: (error) => {
      console.error('Error saving day preference:', error);
      toast.error('Failed to save start time');
    },
  });
};

export const getStartTimeForDay = (
  dayNumber: number,
  preferences: DayPreference[]
): string => {
  const pref = preferences.find(p => p.day_number === dayNumber);
  return pref?.start_time || '09:00';
};

// Helper to calculate how much time is available in a day
export const calculateAvailableMinutes = (
  startTime: string,
  endTime: string = '22:00'
): number => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return Math.max(0, endMinutes - startMinutes);
};

// Estimate activity duration based on type
export const estimateActivityDuration = (type: string): number => {
  switch (type) {
    case 'attraction':
    case 'museum':
    case 'landmark':
      return 120; // 2 hours
    case 'restaurant':
    case 'food':
      return 90; // 1.5 hours
    case 'shopping':
      return 60; // 1 hour
    case 'transport':
      return 30; // 30 minutes
    default:
      return 60; // 1 hour default
  }
};
