import { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  created_at: string;
}

interface ToolCall {
  name: 'add_activity' | 'remove_activity' | 'swap_activity';
  args: Record<string, unknown>;
}

interface TripConciergeProps {
  tripId: string;
  tripName?: string;
  /** Open the panel automatically on mount */
  initialOpen?: boolean;
  /** Pre-inject an Aria message when the panel first opens */
  initialMessage?: string;
}

// Aria avatar — gradient circle with sparkle
const AriaAvatar = ({ size = 'md' }: { size?: 'sm' | 'md' }) => (
  <div
    className={cn(
      'rounded-full flex items-center justify-center shrink-0',
      'bg-gradient-to-br from-violet-500 to-fuchsia-500',
      size === 'sm' ? 'w-7 h-7' : 'w-9 h-9'
    )}
  >
    <Sparkles className={cn('text-white', size === 'sm' ? 'w-3.5 h-3.5' : 'w-4.5 h-4.5')} style={{ width: size === 'sm' ? 14 : 18, height: size === 'sm' ? 14 : 18 }} />
  </div>
);

// Static welcome message shown when there are no saved messages
const WELCOME_MESSAGE: Message = {
  id: 'aria-welcome',
  role: 'assistant',
  content: `Hi! I'm Aria, your personal trip concierge. 👋

I know your full itinerary, your group's preferences, and your flight times. Ask me anything — from restaurant recommendations to what to do if it rains.

Try asking:
• What should we do if it rains on Day 2?
• Find a vegetarian restaurant near our Day 3 hotel
• We're running late — should we skip anything?`,
  created_at: new Date().toISOString(),
};

export const TripConcierge = ({ tripId, tripName, initialOpen = false, initialMessage }: TripConciergeProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(initialOpen);
  const [messages, setMessages] = useState<Message[]>(() =>
    initialMessage
      ? [{ id: 'reflection-0', role: 'assistant', content: initialMessage, created_at: new Date().toISOString() }]
      : []
  );
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [pendingToolCall, setPendingToolCall] = useState<{ toolCall: ToolCall; messageId: string } | null>(null);
  const [applyingTool, setApplyingTool] = useState(false);
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

      if (data && data.length > 0) {
        setMessages(data as Message[]);
      }
      // If no history, leave messages empty — welcome message is shown via displayMessages
      setHistoryLoaded(true);
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

  // Get current session token for authenticated Edge Function calls
  const getAuthHeader = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  };

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
    setMessages((prev) => {
      // If prev is empty, skip the welcome message now that there's a real message
      const base = prev.length === 0 ? [] : prev;
      return [...base, tempUserMsg];
    });
    setLoading(true);

    try {
      const authHeaders = await getAuthHeader();
      const { data, error } = await supabase.functions.invoke('trip-concierge', {
        body: { tripId, message: userMessage, userId: user.id },
        headers: authHeaders,
      });

      if (error) {
        // Supabase returns FunctionsHttpError for non-2xx. Try to extract the actual body.
        let errMsg = 'Aria is temporarily unavailable. Please try again.';
        try {
          const ctx = (error as any)?.context;
          if (ctx?.json) {
            const body = await ctx.json();
            errMsg = body?.error || errMsg;
          } else if (ctx?.text) {
            const text = await ctx.text();
            errMsg = text || errMsg;
          } else {
            errMsg = (error as any)?.message || errMsg;
          }
        } catch {
          errMsg = (error as any)?.message || errMsg;
        }
        throw new Error(errMsg);
      }

      if (data?.error) throw new Error(data.error);

      const msgId = `assistant-${Date.now()}`;
      const assistantMsg: Message = {
        id: msgId,
        role: 'assistant',
        content: data.reply,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      // If Aria proposes a tool action, store it for user confirmation
      if (data.toolCall) {
        setPendingToolCall({ toolCall: data.toolCall as ToolCall, messageId: msgId });
      }
    } catch (err) {
      const errorText = err instanceof Error ? err.message : 'The concierge is temporarily unavailable.';
      // Show inline error bubble instead of toast so context isn't lost
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'error',
        content: errorText,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      setInput(userMessage); // restore input so user can retry
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

  // Execute an Aria-proposed itinerary change after user confirms
  const handleApplyTool = async (confirm: boolean) => {
    if (!pendingToolCall || !user) return;
    const { toolCall } = pendingToolCall;
    setPendingToolCall(null);

    if (!confirm) {
      // User declined — let Aria know
      const declineMsg: Message = {
        id: `user-${Date.now()}`, role: 'user',
        content: "No thanks, keep the itinerary as is.",
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, declineMsg]);
      setLoading(true);
      try {
        const authHeaders2 = await getAuthHeader();
        const { data } = await supabase.functions.invoke('trip-concierge', {
          body: { tripId, message: "No thanks, keep the itinerary as is.", userId: user.id },
          headers: authHeaders2,
        });
        if (data?.reply) {
          setMessages(prev => [...prev, {
            id: `assistant-${Date.now()}`, role: 'assistant',
            content: data.reply, created_at: new Date().toISOString(),
          }]);
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
      return;
    }

    setApplyingTool(true);
    try {
      const args = toolCall.args;

      if (toolCall.name === 'remove_activity') {
        await supabase.from('itinerary_items')
          .delete()
          .eq('itinerary_id', tripId)
          .eq('day_number', args.day_number as number)
          .ilike('custom_title', `%${args.activity_name}%`);

      } else if (toolCall.name === 'add_activity') {
        await supabase.from('itinerary_items').insert({
          itinerary_id: tripId,
          day_number: args.day_number as number,
          time_slot: (args.time_slot as string) || 'morning',
          item_type: (args.category as string) || 'attraction',
          custom_title: args.activity_name as string,
          custom_description: (args.description as string) || '',
          order_index: 999,
        });

      } else if (toolCall.name === 'swap_activity') {
        await supabase.from('itinerary_items')
          .delete()
          .eq('itinerary_id', tripId)
          .eq('day_number', args.day_number as number)
          .ilike('custom_title', `%${args.old_activity}%`);
        await supabase.from('itinerary_items').insert({
          itinerary_id: tripId,
          day_number: args.day_number as number,
          item_type: (args.new_category as string) || 'attraction',
          custom_title: args.new_activity as string,
          order_index: 999,
        });
      }

      // Confirm to Aria that the change was applied
      const confirmMsg: Message = {
        id: `user-${Date.now()}`, role: 'user',
        content: "Done, please apply the change.",
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, confirmMsg]);
      setLoading(true);
      const authHeaders3 = await getAuthHeader();
      const { data } = await supabase.functions.invoke('trip-concierge', {
        body: { tripId, message: 'The change has been applied to the itinerary successfully.', userId: user.id },
        headers: authHeaders3,
      });
      if (data?.reply) {
        setMessages(prev => [...prev, {
          id: `assistant-${Date.now()}`, role: 'assistant',
          content: data.reply, created_at: new Date().toISOString(),
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`, role: 'error',
        content: 'Could not apply the change. Please edit the itinerary manually.',
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setApplyingTool(false);
      setLoading(false);
    }
  };

  // Show welcome message if no real messages exist yet (after history is loaded)
  const displayMessages: Message[] =
    historyLoaded && messages.length === 0 ? [WELCOME_MESSAGE] : messages;

  const suggestedPrompts = [
    'What should we do if it rains?',
    'Suggest a nearby restaurant for dinner',
    'How do we get between activities?',
    'Can you suggest a lighter Day 1?',
  ];

  return (
    <>
      {/* Floating button — sits above mobile bottom nav */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          // Mobile: above 64px bottom nav
          'fixed bottom-[4.5rem] right-4 z-[55]',
          'h-12 rounded-full shadow-xl px-4 gap-2',
          'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white',
          'flex items-center justify-center',
          'hover:scale-105 active:scale-95 transition-transform duration-200',
          'focus:outline-none focus:ring-2 focus:ring-violet-400/50',
          // Desktop: normal bottom-right, pill with label
          'sm:bottom-6 sm:right-6',
          open && 'hidden'
        )}
        aria-label="Open Trip Concierge"
      >
        <Sparkles className="w-4 h-4 shrink-0" />
        <span className="text-sm font-medium">Aria</span>
      </button>

      {/* Chat panel */}
      {open && (
        <div className={cn(
          'fixed z-[55] bg-background border border-border/60 shadow-2xl',
          'inset-0',
          'sm:inset-auto sm:bottom-6 sm:right-6 sm:w-96 sm:h-[600px] sm:rounded-2xl',
          'flex flex-col'
        )}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60 shrink-0">
            <AriaAvatar />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-tight">Aria</p>
              <p className="text-xs text-muted-foreground truncate">
                {tripName ? `${tripName} · ` : ''}Trip Concierge
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
            {displayMessages.map((msg, idx) => (
              <div key={msg.id}>
                {msg.role === 'user' ? (
                  <div className="flex gap-3 flex-row-reverse">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1 text-xs font-medium">
                      {(user?.email ?? 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tr-sm text-sm bg-primary text-primary-foreground">
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ) : msg.role === 'error' ? (
                  <div className="flex gap-3">
                    <AriaAvatar size="sm" />
                    <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tl-sm text-sm bg-red-50 border border-red-200/60 text-red-700">
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <AriaAvatar size="sm" />
                    <div className="max-w-[80%] space-y-0.5">
                      {/* Show "Aria" label only on the first assistant message or after a user message */}
                      {(idx === 0 || displayMessages[idx - 1]?.role === 'user') && (
                        <p className="text-xs text-muted-foreground font-medium pl-0.5">Aria</p>
                      )}
                      <div className="px-4 py-3 rounded-2xl rounded-tl-sm text-sm bg-muted/60">
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      </div>
                      {/* Tool-call confirmation — shown only for the message that triggered the tool */}
                      {pendingToolCall?.messageId === msg.id && (
                        <div className="flex gap-2 mt-2 pl-0.5">
                          <Button
                            size="sm"
                            className="h-8 text-xs bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 border-0 text-white gap-1"
                            onClick={() => handleApplyTool(true)}
                            disabled={applyingTool}
                          >
                            {applyingTool && <Loader2 className="w-3 h-3 animate-spin" />}
                            Apply this change
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => handleApplyTool(false)}
                            disabled={applyingTool}
                          >
                            No thanks
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Suggested prompts after welcome message only */}
                {msg.id === 'aria-welcome' && messages.length === 0 && (
                  <div className="pl-10 mt-3 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {suggestedPrompts.map((prompt) => (
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
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <AriaAvatar size="sm" />
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
                placeholder="Ask Aria about your trip…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className="flex-1 text-sm"
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="shrink-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 border-0"
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
