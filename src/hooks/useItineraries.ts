import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { DayData } from '@/components/trip/DayCard';
import { addDays, format } from 'date-fns';

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

export interface CitySelection {
  cityId: string;
  cityName?: string;
  daysToSpend: number;
}

export interface PreSaveFlightDetail {
  airline?: string;
  flight_number?: string;
  departure_city: string;
  arrival_city: string;
  origin_iata?: string;
  destination_iata?: string;
  departure_date: string;
  departure_time?: string;
  arrival_date: string;
  arrival_time?: string;
  is_international?: boolean;
}

export interface CreateItineraryInput {
  /** First city id for backwards compat – used as primary city_id on itinerary */
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
  /** For multi-city trips, array of city selections in order */
  selectedCities?: CitySelection[];
  /** Pre-save flight details — written to flight_details table after itinerary is created */
  flightDetails?: PreSaveFlightDetail[];
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

      // ---- DEBUG START ----
      console.log('[useCreateItinerary] user.id:', user.id);
      console.log('[useCreateItinerary] input:', JSON.stringify(input, null, 2));
      // ---- DEBUG END ----

      // 1. Create the itinerary row
      const itineraryPayload = {
        user_id: user.id,
        city_id: input.cityId,
        name: input.name,
        num_days: input.numDays,
        start_date: format(input.startDate, 'yyyy-MM-dd'),
        end_date: format(input.endDate, 'yyyy-MM-dd'),
        budget_level: input.budgetLevel ?? null,
        pace: input.pace ?? null,
        travel_style: input.travelStyle ?? null,
        dietary_preferences: input.dietaryPreferences ?? null,
      };

      console.log('[useCreateItinerary] itineraryPayload:', itineraryPayload);

      const { data: itinerary, error: itineraryError } = await supabase
        .from('itineraries')
        .insert(itineraryPayload)
        .select()
        .single();

      if (itineraryError) {
        console.error('[useCreateItinerary] itineraryError:', itineraryError);
        throw itineraryError;
      }

      console.log('[useCreateItinerary] created itinerary:', itinerary);

      // 2. Create trip_legs (multi-city support)
      const selectedCities = input.selectedCities ?? [{ cityId: input.cityId, daysToSpend: input.numDays }];
      let runningStartDay = 1;
      const legInserts: {
        itinerary_id: string;
        city_id: string;
        leg_number: number;
        start_day: number;
        end_day: number;
      }[] = [];

      selectedCities.forEach((sc, idx) => {
        const endDay = runningStartDay + sc.daysToSpend - 1;
        legInserts.push({
          itinerary_id: itinerary.id,
          city_id: sc.cityId,
          leg_number: idx + 1,
          start_day: runningStartDay,
          end_day: endDay,
        });
        runningStartDay = endDay + 1;
      });

      console.log('[useCreateItinerary] legInserts:', legInserts);

      // trip_legs and trip_days are non-fatal — if the tables don't exist yet
      // (migrations not yet applied to the Supabase project) we still want
      // the core itinerary + items to be saved successfully.
      const { data: legs, error: legsError } = await supabase
        .from('trip_legs')
        .insert(legInserts)
        .select();

      if (legsError) {
        // Log but don't throw — itinerary_items save will still proceed.
        console.warn('[useCreateItinerary] trip_legs insert failed (non-fatal):', legsError);
      } else {
        console.log('[useCreateItinerary] created legs:', legs);
      }

      // 3. Create trip_days binding each day to its leg (only if legs exist)
      const tripDaysInserts: {
        itinerary_id: string;
        trip_leg_id: string;
        day_index: number;
        day_date: string;
        title: string;
      }[] = [];

      if (legs && legs.length > 0) {
        input.days.forEach((day) => {
          const legForDay = legs.find(
            (l) => day.dayNumber >= l.start_day && day.dayNumber <= l.end_day
          );
          if (!legForDay) return;
          const dayDate = addDays(input.startDate, day.dayNumber - 1);
          tripDaysInserts.push({
            itinerary_id: itinerary.id,
            trip_leg_id: legForDay.id,
            day_index: day.dayNumber,
            day_date: format(dayDate, 'yyyy-MM-dd'),
            title: day.title || `Day ${day.dayNumber}`,
          });
        });

        console.log('[useCreateItinerary] tripDaysInserts:', tripDaysInserts);

        if (tripDaysInserts.length > 0) {
          const { error: daysError } = await supabase
            .from('trip_days')
            .insert(tripDaysInserts);

          if (daysError) {
            // Non-fatal — itinerary_items will still save.
            console.warn('[useCreateItinerary] trip_days insert failed (non-fatal):', daysError);
          }
        }
      }

      // 4. Create itinerary_items from days
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

      console.log('[useCreateItinerary] itinerary_items count:', items.length);

      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from('itinerary_items')
          .insert(items);

        if (itemsError) {
          console.error('[useCreateItinerary] itemsError:', itemsError);
          throw itemsError;
        }
      }

      // 5. Save pre-collected flight details if provided
      if (input.flightDetails && input.flightDetails.length > 0) {
        const flightInserts = input.flightDetails.map((fd, idx) => ({
          itinerary_id: itinerary.id,
          leg_number: idx + 1,
          airline: fd.airline ?? null,
          flight_number: fd.flight_number ?? null,
          departure_city: fd.departure_city,
          arrival_city: fd.arrival_city,
          origin_iata: fd.origin_iata ?? null,
          destination_iata: fd.destination_iata ?? null,
          departure_date: fd.departure_date,
          departure_time: fd.departure_time ?? null,
          arrival_date: fd.arrival_date,
          arrival_time: fd.arrival_time ?? null,
          is_international: fd.is_international ?? false,
          delay_minutes: 0,
        }));

        const { error: flightError } = await supabase
          .from('flight_details')
          .insert(flightInserts);

        if (flightError) {
          // Non-fatal — itinerary is already saved
          console.warn('[useCreateItinerary] flight_details insert failed (non-fatal):', flightError);
        } else {
          console.log('[useCreateItinerary] saved', flightInserts.length, 'flight(s)');
        }
      }

      return itinerary;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itineraries'] });
      toast.success('Trip saved successfully!');
    },
    onError: (error: any) => {
      console.error('[useCreateItinerary] mutation error:', error);
      const message = error?.message || error?.details || 'Unknown error';
      toast.error(`Failed to save trip: ${message}`);
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
