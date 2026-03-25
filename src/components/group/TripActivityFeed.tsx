import { ActivityFeedItem } from '@/hooks/useGroupTrip';
import { formatDistanceToNow } from 'date-fns';
import {
  UserPlus,
  PlusCircle,
  MinusCircle,
  Vote,
  CheckCircle,
  CreditCard,
  Plane,
  Calendar,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TripActivityFeedProps {
  feed: ActivityFeedItem[];
  isLoading?: boolean;
}

const activityConfig: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; label: string; color: string }
> = {
  member_joined: { icon: UserPlus, label: 'joined the trip', color: 'text-green-500' },
  activity_added: { icon: PlusCircle, label: 'added an activity', color: 'text-primary' },
  activity_removed: { icon: MinusCircle, label: 'removed an activity', color: 'text-destructive' },
  vote_started: { icon: Vote, label: 'started a vote', color: 'text-amber-500' },
  vote_resolved: { icon: CheckCircle, label: 'vote resolved', color: 'text-green-500' },
  booking_made: { icon: CreditCard, label: 'made a booking', color: 'text-primary' },
  flight_added: { icon: Plane, label: 'added a flight', color: 'text-sky-500' },
  schedule_changed: { icon: Calendar, label: 'updated the schedule', color: 'text-muted-foreground' },
  trip_created: { icon: Star, label: 'created this trip', color: 'text-primary' },
};

const FeedItemRow = ({ item }: { item: ActivityFeedItem }) => {
  const config = activityConfig[item.activity_type] ?? activityConfig.schedule_changed;
  const Icon = config.icon;
  const data = item.activity_data as Record<string, string>;
  const displayName = data.user_name || 'Someone';
  const detail = data.title || data.description || '';

  return (
    <div className="flex gap-3 py-3 border-b border-border/50 last:border-0">
      <div className={cn('shrink-0 mt-0.5 w-8 h-8 rounded-full bg-muted flex items-center justify-center', config.color)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-snug">
          <span className="font-medium">{displayName}</span>
          {' '}
          <span className="text-muted-foreground">{config.label}</span>
          {detail && (
            <>
              {' — '}
              <span className="text-foreground/80 italic truncate">{detail}</span>
            </>
          )}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
};

export const TripActivityFeed = ({ feed, isLoading }: TripActivityFeedProps) => {
  if (isLoading) {
    return (
      <div className="space-y-3 py-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-muted rounded w-3/4" />
              <div className="h-2.5 bg-muted rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (feed.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        No activity yet — be the first to make a move!
      </p>
    );
  }

  return (
    <div className="divide-y divide-border/50">
      {feed.map(item => (
        <FeedItemRow key={item.id} item={item} />
      ))}
    </div>
  );
};
