import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ActivityFeedItem {
  id: string;
  trip_id: string;
  user_id: string | null;
  activity_type:
    | 'member_joined'
    | 'activity_added'
    | 'activity_removed'
    | 'vote_started'
    | 'vote_resolved'
    | 'booking_made'
    | 'flight_added'
    | 'schedule_changed'
    | 'trip_created';
  activity_data: Record<string, unknown>;
  created_at: string;
}

export interface Proposal {
  id: string;
  trip_id: string;
  proposed_by: string;
  proposal_type:
    | 'add_activity'
    | 'remove_activity'
    | 'swap_activity'
    | 'change_time'
    | 'change_restaurant'
    | 'change_day_start';
  proposal_data: Record<string, unknown>;
  status: 'open' | 'approved' | 'rejected' | 'expired';
  voting_deadline: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface Vote {
  id: string;
  proposal_id: string;
  user_id: string;
  vote: 'yes' | 'no' | 'neutral';
  created_at: string;
}

export const useGroupTrip = (tripId: string | undefined) => {
  const { user } = useAuth();
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Proposals that just transitioned to 'approved' — consumed by TripDetail to auto-apply changes
  const [approvedProposals, setApprovedProposals] = useState<Proposal[]>([]);

  const fetchOpenProposals = useCallback(async () => {
    if (!tripId) return;
    const { data } = await supabase
      .from('trip_proposals')
      .select('*')
      .eq('trip_id', tripId)
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    if (data) {
      const open = data as Proposal[];
      setProposals(open);
      if (open.length > 0) {
        const ids = open.map(p => p.id);
        const { data: votesData } = await supabase
          .from('trip_votes')
          .select('*')
          .in('proposal_id', ids);
        if (votesData) setVotes(votesData as Vote[]);
      }
    }
  }, [tripId]);

  useEffect(() => {
    if (!tripId) return;

    const fetchAll = async () => {
      setIsLoading(true);
      const [feedResult] = await Promise.all([
        supabase
          .from('trip_activity_feed')
          .select('*')
          .eq('trip_id', tripId)
          .order('created_at', { ascending: false })
          .limit(25),
        fetchOpenProposals(),
      ]);
      if (feedResult.data) setActivityFeed(feedResult.data as ActivityFeedItem[]);
      setIsLoading(false);
    };

    fetchAll();

    const feedChannel = supabase
      .channel(`feed_${tripId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'trip_activity_feed', filter: `trip_id=eq.${tripId}` },
        (payload) => {
          setActivityFeed(prev => [payload.new as ActivityFeedItem, ...prev.slice(0, 24)]);
        }
      )
      .subscribe();

    const proposalsChannel = supabase
      .channel(`proposals_${tripId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trip_proposals', filter: `trip_id=eq.${tripId}` },
        (payload) => {
          // Detect proposals that just became approved — surface them for auto-apply
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Proposal;
            if (updated.status === 'approved') {
              setApprovedProposals(prev => {
                // Avoid duplicates
                if (prev.some(p => p.id === updated.id)) return prev;
                return [...prev, updated];
              });
            }
          }
          fetchOpenProposals();
        }
      )
      .subscribe();

    const votesChannel = supabase
      .channel(`votes_${tripId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trip_votes' },
        (payload) => {
          const v = payload.new as Vote;
          if (payload.eventType === 'INSERT') {
            setVotes(prev => [...prev, v]);
          } else if (payload.eventType === 'UPDATE') {
            setVotes(prev => prev.map(x => (x.id === v.id ? v : x)));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(feedChannel);
      supabase.removeChannel(proposalsChannel);
      supabase.removeChannel(votesChannel);
    };
  }, [tripId, fetchOpenProposals]);

  const castVote = async (proposalId: string, vote: 'yes' | 'no' | 'neutral') => {
    if (!user) return;
    const existing = votes.find(v => v.proposal_id === proposalId && v.user_id === user.id);
    if (existing) {
      await supabase.from('trip_votes').update({ vote }).eq('id', existing.id);
    } else {
      await supabase.from('trip_votes').insert({ proposal_id: proposalId, user_id: user.id, vote });
    }

    // After casting, check whether the proposal should be resolved.
    // Resolution rules:
    //   - Approved:  yes votes > 50% of total group members
    //   - Rejected:  yes votes ≤ 50% of total group members AND all members have voted
    //     (ties count as rejected)
    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal || proposal.status !== 'open') return;

    // Fetch the latest vote tallies from the server
    const { data: latestVotes } = await supabase
      .from('trip_votes')
      .select('vote')
      .eq('proposal_id', proposalId);

    const { data: tripData } = await supabase
      .from('itineraries')
      .select('group_size')
      .eq('id', tripId!)
      .single();

    const allVotes = latestVotes ?? [];
    const yesCount = allVotes.filter(v => v.vote === 'yes').length;
    const totalVoted = allVotes.length;

    // Default group size to number of collaborators + 1 (owner) if not set
    const groupSize = (tripData?.group_size as number | null) ?? totalVoted;
    const threshold = groupSize / 2; // strictly more than 50%

    if (yesCount > threshold) {
      // Approve immediately — majority achieved
      await supabase
        .from('trip_proposals')
        .update({ status: 'approved', resolved_at: new Date().toISOString() })
        .eq('id', proposalId);
    } else if (totalVoted >= groupSize && yesCount <= threshold) {
      // All members voted and yes ≤ 50% — reject (ties go to rejected)
      await supabase
        .from('trip_proposals')
        .update({ status: 'rejected', resolved_at: new Date().toISOString() })
        .eq('id', proposalId);
    }
  };

  const createProposal = async (
    proposalType: Proposal['proposal_type'],
    proposalData: Record<string, unknown>,
    votingDeadlineHours = 24
  ) => {
    if (!tripId || !user) return;
    const deadline = new Date(Date.now() + votingDeadlineHours * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from('trip_proposals').insert({
      trip_id: tripId,
      proposed_by: user.id,
      proposal_type: proposalType,
      proposal_data: proposalData,
      voting_deadline: deadline,
    });
    if (!error) {
      // Log to activity feed
      await supabase.from('trip_activity_feed').insert({
        trip_id: tripId,
        user_id: user.id,
        activity_type: 'vote_started',
        activity_data: { proposal_type: proposalType, ...proposalData },
      });
    }
    return error;
  };

  // Unread = activity feed items in the last 10 minutes
  const recentCutoff = new Date(Date.now() - 10 * 60 * 1000);
  const unreadCount = activityFeed.filter(
    item => new Date(item.created_at) > recentCutoff
  ).length;

  const myVoteFor = (proposalId: string) =>
    user ? votes.find(v => v.proposal_id === proposalId && v.user_id === user.id) : undefined;

  const voteCounts = (proposalId: string) => {
    const proposalVotes = votes.filter(v => v.proposal_id === proposalId);
    return {
      yes: proposalVotes.filter(v => v.vote === 'yes').length,
      no: proposalVotes.filter(v => v.vote === 'no').length,
      neutral: proposalVotes.filter(v => v.vote === 'neutral').length,
      total: proposalVotes.length,
    };
  };

  /** Call this after you've handled an approved proposal to clear it from the queue */
  const dismissApprovedProposal = (proposalId: string) => {
    setApprovedProposals(prev => prev.filter(p => p.id !== proposalId));
  };

  /**
   * Log an event to the trip activity feed.
   * Wrapped in useCallback so consumers get a stable reference and don't
   * accidentally include it as a changing useCallback/useMemo dependency.
   */
  const logFeedEvent = useCallback(async (
    activityType: ActivityFeedItem['activity_type'],
    activityData: Record<string, unknown>
  ) => {
    if (!tripId || !user) return;
    await supabase.from('trip_activity_feed').insert({
      trip_id: tripId,
      user_id: user.id,
      activity_type: activityType,
      activity_data: activityData,
    });
  }, [tripId, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    activityFeed,
    proposals,
    votes,
    isLoading,
    unreadCount,
    approvedProposals,
    castVote,
    createProposal,
    dismissApprovedProposal,
    logFeedEvent,
    myVoteFor,
    voteCounts,
  };
};
