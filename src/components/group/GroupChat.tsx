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
    email?: string;
  } | null;
}

interface GroupChatProps {
  tripId: string;
}

export const GroupChat = ({ tripId }: GroupChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load initial messages
  useEffect(() => {
    if (!tripId) return;

    const loadMessages = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('trip_chat')
        .select(`
          id, trip_id, user_id, message, created_at,
          profiles:user_id ( full_name, avatar_url )
        `)
        .eq('trip_id', tripId)
        .order('created_at', { ascending: true })
        .limit(100);

      setMessages((data as ChatMessage[]) ?? []);
      setLoading(false);
    };

    loadMessages();
  }, [tripId]);

  // Scroll to bottom when messages load or change
  useEffect(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [messages]);

  // Real-time subscription
  useEffect(() => {
    if (!tripId) return;

    const channel = supabase
      .channel(`trip-chat-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trip_chat',
          filter: `trip_id=eq.${tripId}`,
        },
        async (payload) => {
          const newMsg = payload.new as ChatMessage;
          // Fetch profile for the new message's sender
          if (newMsg.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('id', newMsg.user_id)
              .single();
            newMsg.profile = profile;
          }
          setMessages(prev => {
            // Avoid duplicates (optimistic vs real)
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tripId]);

  const handleSend = async () => {
    if (!input.trim() || sending || !user) return;

    const msgText = input.trim();
    setInput('');
    setSending(true);

    // Optimistic insert
    const tempId = `temp-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      trip_id: tripId,
      user_id: user.id,
      message: msgText,
      created_at: new Date().toISOString(),
      profile: null,
    };
    setMessages(prev => [...prev, optimistic]);

    const { error } = await supabase.from('trip_chat').insert({
      trip_id: tripId,
      user_id: user.id,
      message: msgText,
    });

    if (error) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
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

  const getDisplayName = (msg: ChatMessage) => {
    if (msg.profile?.full_name) return msg.profile.full_name;
    if (msg.user_id === user?.id) return 'You';
    return 'Group member';
  };

  const getInitial = (msg: ChatMessage) => {
    const name = getDisplayName(msg);
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm">Loading chat…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 px-1 pb-4 min-h-0" style={{ maxHeight: '400px' }}>
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
            const showSender = !prevMsg || prevMsg.user_id !== msg.user_id;

            return (
              <div
                key={msg.id}
                className={cn('flex gap-2.5', isMe && 'flex-row-reverse')}
              >
                {/* Avatar (only for first in a group) */}
                {!isMe && showSender ? (
                  <Avatar className="w-8 h-8 shrink-0 mt-1">
                    <AvatarImage src={msg.profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">{getInitial(msg)}</AvatarFallback>
                  </Avatar>
                ) : !isMe ? (
                  <div className="w-8 shrink-0" />
                ) : null}

                <div className={cn('max-w-[75%] space-y-0.5', isMe && 'items-end flex flex-col')}>
                  {showSender && !isMe && (
                    <p className="text-xs text-muted-foreground pl-1">{getDisplayName(msg)}</p>
                  )}
                  <div
                    className={cn(
                      'px-3.5 py-2.5 rounded-2xl text-sm',
                      isMe
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-muted rounded-tl-sm'
                    )}
                  >
                    {msg.message}
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 px-1">
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="pt-3 border-t border-border/60 shrink-0">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder="Type a message…"
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
