import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface TripCollaborator {
  id: string;
  itinerary_id: string;
  user_id: string;
  email: string;
  role: 'viewer' | 'editor';
  invited_by: string;
  invited_at: string;
  accepted_at: string | null;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export const useTripCollaborators = (itineraryId: string | undefined) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['trip-collaborators', itineraryId],
    queryFn: async () => {
      if (!itineraryId) return [];

      const { data, error } = await supabase
        .from('trip_collaborators')
        .select('*')
        .eq('itinerary_id', itineraryId)
        .order('invited_at', { ascending: false });

      if (error) throw error;
      return data as TripCollaborator[];
    },
    enabled: !!itineraryId,
  });

  // Subscribe to realtime changes
  useEffect(() => {
    if (!itineraryId) return;

    const channel = supabase
      .channel(`collaborators-${itineraryId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trip_collaborators',
          filter: `itinerary_id=eq.${itineraryId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['trip-collaborators', itineraryId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [itineraryId, queryClient]);

  return query;
};

export const useInviteCollaborator = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itineraryId,
      email,
      role,
      tripName,
      cityName,
    }: {
      itineraryId: string;
      email: string;
      role: 'viewer' | 'editor';
      tripName?: string;
      cityName?: string;
    }) => {
      if (!user) throw new Error('Must be logged in');

      // Check if invited user already has an Itinera account
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('email', email)
        .single();

      const { data, error } = await supabase
        .from('trip_collaborators')
        .insert({
          itinerary_id: itineraryId,
          email,
          role,
          invited_by: user.id,
          user_id: existingUser?.id || '00000000-0000-0000-0000-000000000000',
        })
        .select()
        .single();

      if (error) throw error;

      // Fire-and-forget invitation email — don't fail the invite if email sending fails
      try {
        const inviterProfile = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        await supabase.functions.invoke('send-invite-email', {
          body: {
            inviteeEmail: email,
            inviterName: inviterProfile.data?.full_name || user.email || 'A friend',
            tripName: tripName || 'a trip',
            cityName: cityName || '',
            itineraryId,
            appUrl: window.location.origin,
          },
        });
      } catch (emailErr) {
        // Email sending is best-effort — log but don't surface to user
        console.warn('Invitation email could not be sent:', emailErr);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trip-collaborators', variables.itineraryId] });
      toast.success('Invitation sent! They\'ll receive an email with a link to view the trip.');
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('This person has already been invited');
      } else {
        toast.error('Failed to add collaborator. Please try again.');
      }
    },
  });
};

export const useRemoveCollaborator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, itineraryId }: { id: string; itineraryId: string }) => {
      const { error } = await supabase
        .from('trip_collaborators')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return itineraryId;
    },
    onSuccess: (itineraryId) => {
      queryClient.invalidateQueries({ queryKey: ['trip-collaborators', itineraryId] });
      toast.success('Collaborator removed');
    },
    onError: () => {
      toast.error('Failed to remove collaborator');
    },
  });
};

export const useAcceptInvitation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('trip_collaborators')
        .update({
          user_id: user.id,
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invitationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trip-collaborators', data.itinerary_id] });
      queryClient.invalidateQueries({ queryKey: ['itineraries'] });
      toast.success('You have joined the trip!');
    },
    onError: () => {
      toast.error('Failed to accept invitation');
    },
  });
};

export const usePendingInvitations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pending-invitations', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];

      const { data, error } = await supabase
        .from('trip_collaborators')
        .select(`
          *,
          itinerary:itineraries (
            name,
            cities (name, country)
          )
        `)
        .eq('email', user.email)
        .is('accepted_at', null);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.email,
  });
};
