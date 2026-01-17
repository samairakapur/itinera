import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { DayData } from '@/components/trip/DayCard';

export interface SavedItinerary {
  id: string;
  name: string;
  city_id: string;
  start_date: string | null;
  end_date: string | null;
  num_days: number;
  budget_level: string | null;
  pace: string | null;
  travel_style: string | null;
  dietary_preferences: string[] | null;
  home_base: string | null;
  estimated_daily_cost: number | null;
  created_at: string;
  updated_at: string;
  cities?: {
    name: string;
    country: string;
    image_url: string | null;
  };
  itinerary_items?: SavedItineraryItem[];
}

export interface SavedItineraryItem {
  id: string;
  itinerary_id: string;
  day_number: number;
  time_slot: string;
  order_index: number;
  item_type: string;
  custom_title: string | null;
  custom_description: string | null;
  notes: string | null;
  attraction_id: string | null;
  restaurant_id: string | null;
}

export interface CreateItineraryInput {
  cityId: string;
  name: string;
  numDays: number;
  startDate: Date;
  endDate: Date;
  budgetLevel?: string;
  pace?: string;
  travelStyle?: string;
  dietaryPreferences?: string[];
  days: DayData[];
  summary?: string;
}

export const useItineraries = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['itineraries', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('itineraries')
        .select(`
          *,
          cities (
            name,
            country,
            image_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SavedItinerary[];
    },
    enabled: !!user,
  });
};

export const useItinerary = (itineraryId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['itinerary', itineraryId],
    queryFn: async () => {
      if (!user || !itineraryId) return null;

      const { data, error } = await supabase
        .from('itineraries')
        .select(`
          *,
          cities (
            name,
            country,
            image_url,
            description
          ),
          itinerary_items (*)
        `)
        .eq('id', itineraryId)
        .single();

      if (error) throw error;
      return data as SavedItinerary;
    },
    enabled: !!user && !!itineraryId,
  });
};

export const useCreateItinerary = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateItineraryInput) => {
      if (!user) throw new Error('Must be logged in');

      // 1. Create the itinerary
      const { data: itinerary, error: itineraryError } = await supabase
        .from('itineraries')
        .insert({
          user_id: user.id,
          city_id: input.cityId,
          name: input.name,
          num_days: input.numDays,
          start_date: input.startDate.toISOString().split('T')[0],
          end_date: input.endDate.toISOString().split('T')[0],
          budget_level: input.budgetLevel,
          pace: input.pace,
          travel_style: input.travelStyle,
          dietary_preferences: input.dietaryPreferences,
        })
        .select()
        .single();

      if (itineraryError) throw itineraryError;

      // 2. Create itinerary items from days
      const items: Omit<SavedItineraryItem, 'id'>[] = [];
      
      input.days.forEach((day) => {
        const addItems = (activities: typeof day.morning, timeSlot: string) => {
          activities.forEach((activity, index) => {
            items.push({
              itinerary_id: itinerary.id,
              day_number: day.dayNumber,
              time_slot: timeSlot,
              order_index: index,
              item_type: activity.type,
              custom_title: activity.title,
              custom_description: activity.description || null,
              notes: activity.reasoning || null,
              attraction_id: null,
              restaurant_id: null,
            });
          });
        };

        addItems(day.morning, 'morning');
        addItems(day.afternoon, 'afternoon');
        addItems(day.evening, 'evening');
      });

      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from('itinerary_items')
          .insert(items);

        if (itemsError) throw itemsError;
      }

      return itinerary;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itineraries'] });
      toast.success('Trip saved successfully!');
    },
    onError: (error) => {
      console.error('Error saving itinerary:', error);
      toast.error('Failed to save trip');
    },
  });
};

export const useUpdateItinerary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      itineraryId, 
      days 
    }: { 
      itineraryId: string; 
      days: DayData[];
    }) => {
      // Delete existing items
      const { error: deleteError } = await supabase
        .from('itinerary_items')
        .delete()
        .eq('itinerary_id', itineraryId);

      if (deleteError) throw deleteError;

      // Create new items
      const items: Omit<SavedItineraryItem, 'id'>[] = [];
      
      days.forEach((day) => {
        const addItems = (activities: typeof day.morning, timeSlot: string) => {
          activities.forEach((activity, index) => {
            items.push({
              itinerary_id: itineraryId,
              day_number: day.dayNumber,
              time_slot: timeSlot,
              order_index: index,
              item_type: activity.type,
              custom_title: activity.title,
              custom_description: activity.description || null,
              notes: activity.reasoning || null,
              attraction_id: null,
              restaurant_id: null,
            });
          });
        };

        addItems(day.morning, 'morning');
        addItems(day.afternoon, 'afternoon');
        addItems(day.evening, 'evening');
      });

      if (items.length > 0) {
        const { error: insertError } = await supabase
          .from('itinerary_items')
          .insert(items);

        if (insertError) throw insertError;
      }

      // Update timestamp
      const { error: updateError } = await supabase
        .from('itineraries')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', itineraryId);

      if (updateError) throw updateError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['itinerary', variables.itineraryId] });
      queryClient.invalidateQueries({ queryKey: ['itineraries'] });
      toast.success('Trip updated!');
    },
    onError: (error) => {
      console.error('Error updating itinerary:', error);
      toast.error('Failed to update trip');
    },
  });
};

export const useDeleteItinerary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itineraryId: string) => {
      const { error } = await supabase
        .from('itineraries')
        .delete()
        .eq('id', itineraryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itineraries'] });
      toast.success('Trip deleted');
    },
    onError: (error) => {
      console.error('Error deleting itinerary:', error);
      toast.error('Failed to delete trip');
    },
  });
};
