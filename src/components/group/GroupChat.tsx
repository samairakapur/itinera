import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface ChatMessage {
  id: string;
  trip_id: string;
  user_id: string | null;
  message: string;
  created_at: string;
}

// Map of user_id → display name + avatar
interface MemberInfo {
  name: string;
  avatarUrl?: string;
}

interface GroupChatProps {
  tripId: string;
}

export const GroupChat = ({ tripId }: GroupChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [memberMap, setMemberMap] = useState<Record<string, MemberInfo>>({});
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ---------------------------------------------------------------------------
  // Load member map: collaborators + trip owner → profile names
  // profiles has NO FK relationships defined, so we can't use PostgREST join.
  // Instead: fetch collaborator rows, then fetch profiles in a separate .in() query.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!tripId) return;

    const buildMemberMap = async () => {
      // 1. Collaborators (user_id + email fallback)
      const { data: collabs } = await supabase
        .from('trip_collaborators')
        .select('user_id, email')
        .eq('itinerary_id', tripId);

      // 2. Trip owner (may not be in trip_collaborators)
      const { data: tripRow } = await supabase
        .from('itineraries')
        .select('user_id')
        .eq('id', tripId)
        .single();

      // 3. Collect all real user_ids (skip placeholder UUID)
      const PLACEHOLDER = '00000000-0000-0000-0000-000000000000';
      const rawIds = [
        ...(collabs ?? []).map((c) => c.user_id),
        tripRow?.user_id,
      ].filter((id): id is string => !!id && id !== PLACEHOLDER);
      const userIds = [...new Set(rawIds)];

      if (userIds.length === 0) return;

      // 4. Fetch profiles in one query
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', userIds);

      const profileById: Record<string, { full_name: string | null; email: string | null; avatar_url: string | null }> = {};
      (profiles ?? []).forEach((p) => { profileById[p.id] = p; });

      // 5. Build map
      const map: Record<string, MemberInfo> = {};

      userIds.forEach((uid) => {
        const profile = profileById[uid];
        // Find email from collaborators list (profiles.email may be null for OAuth users)
        const collab = (collabs ?? []).find((c) => c.user_id === uid);
        const emailFallback = profile?.email || (collab?.email as string | undefined);
        map[uid] = {
          name: profile?.full_name || emailFallback?.split('@')[0] || 'Member',
          avatarUrl: profile?.avatar_url || undefined,
        };
      });

      setMemberMap(map);
    };

    buildMemberMap();
  }, [tripId]);

  // ---------------------------------------------------------------------------
  // Load initial messages + back-fill memberMap from message user_ids
  // The initial buildMemberMap uses trip_collaborators rows, but collaborators
  // whose user_id FK isn't set (pending invite) won't appear. Loading profiles
  // from the actual message user_ids guarantees every sender has a name.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!tripId) return;
    setLoading(true);
    supabase
      .from('trip_chat')
      .select('id, trip_id, user_id, message, created_at')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(async ({ data }) => {
        const msgs = (data as ChatMessage[]) ?? [];
        setMessages(msgs);
        setLoading(false);

        // Back-fill names for any user_id that buildMemberMap may have missed
        const PLACEHOLDER = '00000000-0000-0000-0000-000000000000';
        const seenIds = [...new Set(
          msgs.map(m => m.user_id).filter((id): id is string => !!id && id !== PLACEHOLDER)
        )];
        if (seenIds.length === 0) return;

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .in('id', seenIds);

        if (!profiles?.length) return;
        setMemberMap(prev => {
          const next = { ...prev };
          profiles.forEach(p => {
            if (!next[p.id] || next[p.id].name === 'Member') {
              next[p.id] = {
                name: p.full_name || p.email?.split('@')[0] || 'Member',
                avatarUrl: p.avatar_url || undefined,
              };
            }
          });
          return next;
        });
      });
  }, [tripId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [messages]);

  // ---------------------------------------------------------------------------
  // Real-time subscription — Realtime is single source of truth (no optimistic insert)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!tripId) return;
    const channel = supabase
      .channel(`trip-chat-${tripId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'trip_chat', filter: `trip_id=eq.${tripId}` },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          // Deduplicate: skip if we already have this id
          setMessages((prev) =>
            prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]
          );
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tripId]);

  const handleSend = async () => {
    if (!input.trim() || sending || !user) return;
    const msgText = input.trim();
    setInput(''); // clear immediately for responsiveness
    setSending(true);

    const { error } = await supabase
      .from('trip_chat')
      .insert({ trip_id: tripId, user_id: user.id, message: msgText });

    if (error) setInput(msgText); // restore on failure
    setSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Resolve display name: own messages → "You", others → memberMap name
  const getDisplayName = (msg: ChatMessage): string => {
    if (!msg.user_id) return 'Member';
    if (msg.user_id === user?.id) return 'You';
    return memberMap[msg.user_id]?.name ?? 'Member';
  };

  const getAvatarUrl = (msg: ChatMessage): string | undefined => {
    if (!msg.user_id) return undefined;
    return memberMap[msg.user_id]?.avatarUrl;
  };

  const getInitial = (msg: ChatMessage): string =>
    getDisplayName(msg).charAt(0).toUpperCase();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm">Loading chat…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ minHeight: 0 }}>
      {/* Messages */}
      <div className="overflow-y-auto space-y-3 pb-4" style={{ maxHeight: '380px', minHeight: '160px' }}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center text-muted-foreground">
            <MessageSquare className="w-10 h-10 text-muted-foreground/30" />
            <div>
              <p className="text-sm font-medium">No messages yet</p>
              <p className="text-xs mt-1">Start the conversation with your group!</p>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.user_id === user?.id;
            const prevMsg = i > 0 ? messages[i - 1] : null;
            const showSenderLabel = !prevMsg || prevMsg.user_id !== msg.user_id;
            const displayName = getDisplayName(msg);
            const avatarUrl = getAvatarUrl(msg);

            return (
              <div key={msg.id} className={cn('flex gap-2.5', isMe && 'flex-row-reverse')}>
                {/* Avatar — only for first in a consecutive block */}
                {!isMe ? (
                  showSenderLabel ? (
                    <Avatar className="w-7 h-7 shrink-0 mt-1">
                      <AvatarImage src={avatarUrl} />
                      <AvatarFallback className="text-xs bg-secondary/20 text-secondary-foreground">
                        {getInitial(msg)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-7 shrink-0" />
                  )
                ) : null}

                <div className={cn('max-w-[76%] space-y-0.5', isMe && 'items-end flex flex-col')}>
                  {showSenderLabel && !isMe && (
                    <p className="text-xs text-muted-foreground font-medium pl-0.5">{displayName}</p>
                  )}
                  <div
                    className={cn(
                      'px-3.5 py-2 rounded-2xl text-sm leading-relaxed',
                      isMe
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-muted rounded-tl-sm'
                    )}
                  >
                    {msg.message}
                  </div>
                  {/* Timestamp on last message in a group */}
                  {(!messages[i + 1] || messages[i + 1].user_id !== msg.user_id) && (
                    <p className="text-[10px] text-muted-foreground/60 px-0.5">
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="pt-3 border-t border-border/60">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder={sending ? 'Sending…' : 'Type a message…'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
            className="flex-1 text-sm"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="shrink-0"
          >
            {sending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};
