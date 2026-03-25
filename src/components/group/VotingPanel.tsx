import { Proposal } from '@/hooks/useGroupTrip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, isPast } from 'date-fns';
import { ThumbsUp, ThumbsDown, Minus, Clock, CheckCircle2, XCircle, Plus } from 'lucide-react';

interface VotingPanelProps {
  proposals: Proposal[];
  myVoteFor: (proposalId: string) => { vote: 'yes' | 'no' | 'neutral' } | undefined;
  voteCounts: (proposalId: string) => { yes: number; no: number; neutral: number; total: number };
  onVote: (proposalId: string, vote: 'yes' | 'no' | 'neutral') => Promise<void>;
  isLoading?: boolean;
  /** When provided, renders a "+ New Proposal" button in the empty/top area */
  onCreateProposal?: () => void;
}

const proposalTypeLabel: Record<string, string> = {
  add_activity: 'Add activity',
  remove_activity: 'Remove activity',
  swap_activity: 'Swap activity',
  change_time: 'Change time',
  change_restaurant: 'Change restaurant',
  change_day_start: 'Change day start',
};

const VoteBar = ({ yes, no, neutral, total }: { yes: number; no: number; neutral: number; total: number }) => {
  if (total === 0) return <div className="h-1.5 bg-muted rounded-full" />;
  const yesW = Math.round((yes / total) * 100);
  const noW = Math.round((no / total) * 100);
  const neutralW = 100 - yesW - noW;
  return (
    <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
      {yesW > 0 && <div className="bg-green-500 transition-all" style={{ width: `${yesW}%` }} />}
      {neutralW > 0 && <div className="bg-muted-foreground/30 transition-all" style={{ width: `${neutralW}%` }} />}
      {noW > 0 && <div className="bg-destructive transition-all" style={{ width: `${noW}%` }} />}
    </div>
  );
};

const ProposalCard = ({
  proposal,
  myVote,
  counts,
  onVote,
}: {
  proposal: Proposal;
  myVote: { vote: 'yes' | 'no' | 'neutral' } | undefined;
  counts: ReturnType<VotingPanelProps['voteCounts']>;
  onVote: (vote: 'yes' | 'no' | 'neutral') => void;
}) => {
  const data = proposal.proposal_data as Record<string, string>;
  const title = data.title || data.name || proposalTypeLabel[proposal.proposal_type] || 'Proposal';
  const description = data.description || data.reason || '';
  const deadline = proposal.voting_deadline ? new Date(proposal.voting_deadline) : null;
  const isExpired = deadline ? isPast(deadline) : false;

  return (
    <div className="border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs shrink-0">
              {proposalTypeLabel[proposal.proposal_type] || proposal.proposal_type}
            </Badge>
          </div>
          <p className="font-medium text-sm text-foreground leading-snug">{title}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
          )}
        </div>
      </div>

      {/* Vote bar */}
      <VoteBar {...counts} />
      <p className="text-xs text-muted-foreground">
        {counts.yes} yes · {counts.no} no · {counts.neutral} neutral · {counts.total} vote{counts.total !== 1 ? 's' : ''}
      </p>

      {/* Deadline */}
      {deadline && (
        <p className={cn('text-xs flex items-center gap-1', isExpired ? 'text-destructive' : 'text-muted-foreground')}>
          <Clock className="w-3 h-3 shrink-0" />
          {isExpired ? 'Voting closed' : `Closes ${formatDistanceToNow(deadline, { addSuffix: true })}`}
        </p>
      )}

      {/* Vote buttons */}
      {!isExpired && (
        <div className="flex gap-2">
          <Button
            variant={myVote?.vote === 'yes' ? 'default' : 'outline'}
            size="sm"
            className={cn('flex-1 gap-1.5', myVote?.vote === 'yes' && 'bg-green-600 hover:bg-green-700 border-green-600')}
            onClick={() => onVote('yes')}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            Yes
          </Button>
          <Button
            variant={myVote?.vote === 'neutral' ? 'default' : 'outline'}
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => onVote('neutral')}
          >
            <Minus className="w-3.5 h-3.5" />
            Neutral
          </Button>
          <Button
            variant={myVote?.vote === 'no' ? 'default' : 'outline'}
            size="sm"
            className={cn('flex-1 gap-1.5', myVote?.vote === 'no' && 'bg-destructive hover:bg-destructive/90 border-destructive text-destructive-foreground')}
            onClick={() => onVote('no')}
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            No
          </Button>
        </div>
      )}

      {isExpired && counts.yes > counts.no && (
        <p className="text-xs text-green-600 flex items-center gap-1 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" /> Approved by majority
        </p>
      )}
      {isExpired && counts.no >= counts.yes && counts.total > 0 && (
        <p className="text-xs text-destructive flex items-center gap-1 font-medium">
          <XCircle className="w-3.5 h-3.5" /> Not approved
        </p>
      )}
    </div>
  );
};

export const VotingPanel = ({
  proposals,
  myVoteFor,
  voteCounts,
  onVote,
  isLoading,
  onCreateProposal,
}: VotingPanelProps) => {
  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2].map(i => (
          <div key={i} className="border border-border rounded-xl p-4 space-y-3">
            <div className="h-4 bg-muted rounded w-2/3" />
            <div className="h-2 bg-muted rounded w-full" />
            <div className="h-8 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground text-center py-4">
          No open proposals right now.
        </p>
        {onCreateProposal && (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 border-dashed"
            onClick={onCreateProposal}
          >
            <Plus className="w-4 h-4" />
            New Proposal
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {onCreateProposal && (
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 border-dashed"
          onClick={onCreateProposal}
        >
          <Plus className="w-4 h-4" />
          New Proposal
        </Button>
      )}
      {proposals.map(proposal => (
        <ProposalCard
          key={proposal.id}
          proposal={proposal}
          myVote={myVoteFor(proposal.id)}
          counts={voteCounts(proposal.id)}
          onVote={vote => onVote(proposal.id, vote)}
        />
      ))}
    </div>
  );
};
