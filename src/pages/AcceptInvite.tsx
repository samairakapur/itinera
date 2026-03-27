import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, MapPin, Users, Calendar, CheckCircle2, LogIn, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface TripInfo {
  id: string;
  name: string | null;
  city: string | null;
  country: string | null;
  num_days: number;
  start_date: string | null;
  end_date: string | null;
  group_size: number | null;
  trip_mode: string | null;
  invite_link_active: boolean;
  owner_id: string;
}

const AcceptInvite = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  const [trip, setTrip] = useState<TripInfo | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'found' | 'invalid' | 'already_member'>('loading');
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  // Lookup trip by invite token via Edge Function (bypasses RLS)
  useEffect(() => {
    if (!token) {
      setLoadState('invalid');
      return;
    }

    const lookup = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-invite-trip', {
          body: { action: 'lookup', token },
        });

        if (error || !data?.trip) {
          setLoadState('invalid');
          return;
        }

        const tripData: TripInfo = data.trip;
        setTrip(tripData);

        // Check if current user is already a member
        if (user) {
          if (user.id === tripData.owner_id) {
            setLoadState('already_member');
            return;
          }

          const { data: existing } = await supabase
            .from('trip_collaborators')
            .select('id')
            .eq('itinerary_id', tripData.id)
            .eq('user_id', user.id)
            .maybeSingle();

          if (existing) {
            setLoadState('already_member');
            return;
          }
        }

        setLoadState('found');
      } catch (err) {
        console.error('Invite lookup error:', err);
        setLoadState('invalid');
      }
    };

    if (!authLoading) {
      lookup();
    }
  }, [token, user, authLoading]);

  const handleJoin = async () => {
    if (!user) {
      navigate(`/auth?redirect=/invite/${token}`);
      return;
    }
    if (!trip) return;

    setJoining(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-invite-trip', {
        body: {
          action: 'join',
          token,
          userId: user.id,
          email: user.email ?? '',
        },
      });

      if (error) throw new Error(error.message ?? 'Join failed');
      if (data?.error && data.error !== 'already_member') {
        throw new Error(data.error);
      }

      setJoined(true);
      toast.success('Welcome to the trip! 🎉');
      setTimeout(() => navigate(`/trips/${trip.id}`), 1500);
    } catch (err: any) {
      toast.error('Could not join trip. Please try again.');
      console.error('Join error:', err);
    } finally {
      setJoining(false);
    }
  };

  const handleAuthRedirect = () => {
    navigate(`/auth?redirect=/invite/${token}`);
  };

  if (authLoading || loadState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (loadState === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="py-10 space-y-4">
            <div className="text-4xl">🔗</div>
            <h2 className="font-bold text-xl">Link not found</h2>
            <p className="text-sm text-muted-foreground">
              This invite link is invalid or has been deactivated by the trip organiser.
            </p>
            <Button variant="outline" onClick={() => navigate('/')}>
              Go home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadState === 'already_member' && trip) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="py-10 space-y-4">
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-500" />
            <h2 className="font-bold text-xl">You're already on this trip!</h2>
            <p className="text-sm text-muted-foreground">
              {trip.city} · {trip.num_days} days
            </p>
            <Button onClick={() => navigate(`/trips/${trip.id}`)}>
              View trip
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!trip) return null;

  const tripTitle = trip.name || (trip.city ? `Trip to ${trip.city}` : 'Group Trip');
  const startDate = trip.start_date ? new Date(trip.start_date) : null;
  const endDate = trip.end_date ? new Date(trip.end_date) : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <p className="text-sm text-muted-foreground font-medium tracking-wide uppercase">
            You've been invited
          </p>
          <h1 className="font-display text-3xl font-bold text-foreground">
            {tripTitle}
          </h1>
        </div>

        {/* Trip card */}
        <Card>
          <CardContent className="p-5 space-y-4">
            {/* Destination */}
            {trip.city && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{trip.city}</p>
                  {trip.country && (
                    <p className="text-xs text-muted-foreground">{trip.country}</p>
                  )}
                </div>
              </div>
            )}

            {/* Dates */}
            {startDate && endDate && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {format(startDate, 'MMM d')} – {format(endDate, 'MMM d, yyyy')}
                  </p>
                  <p className="text-xs text-muted-foreground">{trip.num_days} days</p>
                </div>
              </div>
            )}

            {/* Group */}
            {trip.group_size && trip.group_size > 1 && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Group of {trip.group_size}</p>
                  {trip.trip_mode && (
                    <p className="text-xs text-muted-foreground capitalize">
                      {trip.trip_mode === 'democratic' ? '🗳️ Democratic voting' : '👑 Organiser-led'}
                    </p>
                  )}
                </div>
              </div>
            )}

            {trip.trip_mode === 'democratic' && (
              <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2.5 text-xs text-primary">
                This is a democratic trip — you'll be able to create proposals and vote on changes.
              </div>
            )}
          </CardContent>
        </Card>

        {/* CTA */}
        {joined ? (
          <div className="text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-green-500" />
            <p className="font-semibold">Joined! Redirecting…</p>
          </div>
        ) : user ? (
          <Button
            className="w-full gap-2 h-12 text-base"
            onClick={handleJoin}
            disabled={joining}
          >
            {joining ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <UserPlus className="w-5 h-5" />
            )}
            Join this trip
          </Button>
        ) : (
          <div className="space-y-3">
            <Button className="w-full gap-2 h-12 text-base" onClick={handleAuthRedirect}>
              <UserPlus className="w-5 h-5" />
              Sign up to join
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleAuthRedirect}
            >
              <LogIn className="w-5 h-5" />
              Already have an account? Log in
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              After signing in you'll be taken straight to this trip.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcceptInvite;
