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
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

// Map of user_id → display name + avatar (built from trip_collaborators + profiles)
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

  // Load collaborator names + profiles for display
  useEffect(() => {
    if (!tripId) return;
    supabase
      .from('trip_collaborators')
      .select('user_id, email, profiles:user_id ( full_name, avatar_url )')
      .eq('itinerary_id', tripId)
      .then(({ data }) => {
        const map: Record<string, MemberInfo> = {};
        (data ?? []).forEach((c: any) => {
          if (!c.user_id) return;
          const fullName = c.profiles?.full_name as string | null;
          const emailPrefix = (c.email as string | undefined)?.split('@')[0];
          map[c.user_id] = {
            name: fullName || emailPrefix || 'Member',
            avatarUrl: c.profiles?.avatar_url || undefined,
          };
        });
        setMemberMap(map);
      });
  }, [tripId]);

  // Load initial messages with profile join
  useEffect(() => {
    if (!tripId) return;
    setLoading(true);
    supabase
      .from('trip_chat')
      .select(`
        id, trip_id, user_id, message, created_at,
        profiles:user_id ( full_name, avatar_url )
      `)
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => {
        setMessages((data as ChatMessage[]) ?? []);
        setLoading(false);
      });
  }, [tripId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [messages]);

  // Real-time subscription — NO optimistic insert so Realtime is the single source of truth
  useEffect(() => {
    if (!tripId) return;
    const channel = supabase
      .channel(`trip-chat-${tripId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'trip_chat', filter: `trip_id=eq.${tripId}` },
        async (payload) => {
          const newMsg = payload.new as ChatMessage;
          // Fetch profile for the sender if not already in memberMap
          if (newMsg.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('id', newMsg.user_id)
              .single();
            newMsg.profile = profile;
          }
          // Deduplicate: skip if we already have this id
          setMessages(prev =>
            prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]
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

    // Insert — Realtime subscription will add it to state (no optimistic insert = no duplicates)
    const { error } = await supabase
      .from('trip_chat')
      .insert({ trip_id: tripId, user_id: user.id, message: msgText });

    if (error) {
      // Restore input on failure
      setInput(msgText);
    }
    setSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Resolve display name: own messages → "You", others → full_name → email prefix → "Member"
  const getDisplayName = (msg: ChatMessage): string => {
    if (msg.user_id === user?.id) return 'You';
    // Try inline profile join first (from initial load)
    if (msg.profile?.full_name) return msg.profile.full_name;
    // Fall back to the memberMap built from trip_collaborators
    if (msg.user_id && memberMap[msg.user_id]) return memberMap[msg.user_id].name;
    return 'Member';
  };

  const getAvatarUrl = (msg: ChatMessage): string | undefined => {
    if (msg.profile?.avatar_url) return msg.profile.avatar_url;
    if (msg.user_id && memberMap[msg.user_id]) return memberMap[msg.user_id].avatarUrl;
    return undefined;
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
            onChange={e => setInput(e.target.value)}
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
