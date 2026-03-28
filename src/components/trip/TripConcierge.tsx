import { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface TripConciergeProps {
  tripId: string;
  tripName?: string;
}

export const TripConcierge = ({ tripId, tripName }: TripConciergeProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load message history when panel opens
  useEffect(() => {
    if (!open || historyLoaded || !tripId) return;

    const loadHistory = async () => {
      const { data } = await supabase
        .from('trip_messages')
        .select('id, role, content, created_at')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: true })
        .limit(30);

      if (data) {
        setMessages(data as Message[]);
        setHistoryLoaded(true);
      }
    };

    loadHistory();
  }, [open, historyLoaded, tripId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  }, [messages, open]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSend = async () => {
    if (!input.trim() || loading || !user) return;

    const userMessage = input.trim();
    setInput('');

    // Optimistically add user message
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('trip-concierge', {
        body: { tripId, message: userMessage, userId: user.id },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      toast.error('Concierge unavailable. Please try again.');
      // Remove the optimistic user message on error
      setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
      setInput(userMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedPrompts = [
    'What should we do if it rains?',
    'Suggest a nearby restaurant for dinner',
    'How do we get between activities?',
    'Can you suggest a lighter Day 1?',
  ];

  return (
    <>
      {/* Floating button — sits above the mobile bottom nav (z-50 + pb-16 offset) */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          // On mobile: sit above the 64px bottom nav bar
          'fixed bottom-[4.5rem] right-4 z-[55] w-14 h-14 rounded-full shadow-xl',
          // On sm+: back to normal bottom-right
          'sm:bottom-6 sm:right-6',
          'bg-primary text-primary-foreground',
          'flex items-center justify-center gap-1.5',
          'hover:scale-110 active:scale-95 transition-transform duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary/50',
          open && 'hidden'
        )}
        aria-label="Open trip concierge"
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {/* Chat panel */}
      {open && (
        <div className={cn(
          'fixed z-[55] bg-background border border-border/60 shadow-2xl',
          // Mobile: full screen (sits above everything including bottom nav)
          'inset-0',
          // Desktop: floating panel bottom-right
          'sm:inset-auto sm:bottom-6 sm:right-6 sm:w-96 sm:h-[600px] sm:rounded-2xl',
          'flex flex-col'
        )}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60 shrink-0">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-tight">Trip Concierge</p>
              <p className="text-xs text-muted-foreground truncate">
                {tripName ? `${tripName} · ` : ''}AI assistant
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8"
              onClick={() => setOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
            {messages.length === 0 && !loading && (
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-muted/60 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                    <p className="text-sm">
                      Hi! I'm your personal concierge for{' '}
                      <span className="font-medium">{tripName || 'this trip'}</span>. Ask me anything about your itinerary, alternatives, transport, or restaurants.
                    </p>
                  </div>
                </div>

                {/* Suggested prompts */}
                <div className="pl-11 space-y-2">
                  <p className="text-xs text-muted-foreground">Try asking:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedPrompts.map(prompt => (
                      <button
                        key={prompt}
                        onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                        className="text-xs px-3 py-1.5 rounded-full border border-border/60 hover:bg-muted/60 transition-colors text-left"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map(msg => (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-3',
                  msg.role === 'user' && 'flex-row-reverse'
                )}
              >
                {msg.role === 'assistant' ? (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                ) : (
                  <Avatar className="w-8 h-8 shrink-0 mt-1">
                    <AvatarFallback className="text-xs">
                      {(user?.email ?? 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-[80%] px-4 py-3 rounded-2xl text-sm',
                    msg.role === 'assistant'
                      ? 'bg-muted/60 rounded-tl-sm'
                      : 'bg-primary text-primary-foreground rounded-tr-sm'
                  )}
                >
                  {/* Simple markdown: convert **bold** and bullet lists */}
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-muted/60 rounded-2xl rounded-tl-sm px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-border/60 shrink-0">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="Ask about your trip…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className="flex-1 text-sm"
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="shrink-0"
              >
                {loading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
