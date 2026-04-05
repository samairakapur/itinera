import { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ParsedChange {
  action: 'add' | 'remove' | 'swap';
  day: number;
  remove?: string; // activity name to remove
  add?: {
    name: string;
    time?: string;
    category?: string;
    description?: string;
  };
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string; // already stripped of the CHANGE block
  created_at: string;
  parsedChange?: ParsedChange; // attached when Aria proposes a change
}

// ---------------------------------------------------------------------------
// Sentiment detection for Day Mode reflections
// ---------------------------------------------------------------------------

type ReflectionSentiment = 'fatigue' | 'positive' | 'neutral';

function detectSentiment(text: string): ReflectionSentiment {
  const lower = text.toLowerCase();
  const fatigueWords = ['tired', 'exhausted', 'pain', 'hurting', 'sore', 'legs', 'slow', 'jet lag', 'jetlag', 'kids', 'rough', 'hard', 'difficult', 'overwhelming', 'too much'];
  const positiveWords = ['amazing', 'great', 'loved', 'fantastic', 'perfect', 'energetic', 'incredible', 'best', 'want more', 'awesome', 'brilliant', 'excellent', 'wonderful'];
  if (fatigueWords.some((w) => lower.includes(w))) return 'fatigue';
  if (positiveWords.some((w) => lower.includes(w))) return 'positive';
  return 'neutral';
}

interface TripConciergeProps {
  tripId: string;
  tripName?: string;
  /** Open the panel automatically on mount */
  initialOpen?: boolean;
  /** Pre-inject an Aria message when the panel first opens */
  initialMessage?: string;
  /** Reflection mode: enables adaptive action buttons after user responds */
  isReflection?: boolean;
  /** Current day index (1-based) used for pace adjustment and reflection storage */
  dayIndex?: number;
  /** Programmatically open the panel (e.g. from toast action) */
  forceOpen?: boolean;
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

function parseChangeBlock(text: string): { cleanText: string; change: ParsedChange | null } {
  const match = text.match(/<!--CHANGE:(.*?)-->/s);
  if (!match) return { cleanText: text, change: null };
  try {
    const change = JSON.parse(match[1]) as ParsedChange;
    const cleanText = text.replace(/\n?<!--CHANGE:.*?-->/s, '').trim();
    return { cleanText, change };
  } catch {
    return { cleanText: text.replace(/\n?<!--CHANGE:.*?-->/s, '').trim(), change: null };
  }
}

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

export const TripConcierge = ({ tripId, tripName, initialOpen = false, initialMessage, isReflection = false, dayIndex, forceOpen }: TripConciergeProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(initialOpen);

  // Allow parent to programmatically open (e.g. toast action)
  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);
  const [messages, setMessages] = useState<Message[]>(() =>
    initialMessage
      ? [{ id: 'reflection-0', role: 'assistant', content: initialMessage, created_at: new Date().toISOString() }]
      : []
  );
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [appliedChangeIds, setAppliedChangeIds] = useState<Set<string>>(new Set());
  const [applyingChange, setApplyingChange] = useState(false);

  // Reflection-mode state
  const reflectionUserMsgIdRef = useRef<string | null>(null); // id of user's reflection reply
  const [reflectionSentiment, setReflectionSentiment] = useState<ReflectionSentiment | null>(null);
  const [reflectionAriaMsgId, setReflectionAriaMsgId] = useState<string | null>(null); // aria response msg id
  const [paceAdjusting, setPaceAdjusting] = useState(false);
  const [paceAdjusted, setPaceAdjusted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load message history when panel opens
  useEffect(() => {
    if (!open || historyLoaded || !tripId || !user) return;

    const loadHistory = async () => {
      const { data } = await supabase
        .from('trip_messages')
        .select('id, role, content, created_at')
        .eq('trip_id', tripId)
        .eq('user_id', user.id)  // Privacy: only load this user's messages
        .order('created_at', { ascending: true })
        .limit(30);

      if (data && data.length > 0) {
        // Strip <!--CHANGE:...--> blocks from loaded assistant messages and attach parsedChange
        const parsed = data.map(m => {
          if (m.role === 'assistant') {
            const { cleanText, change } = parseChangeBlock(m.content);
            return { ...m, content: cleanText, parsedChange: change ?? undefined };
          }
          return m;
        });
        setMessages(parsed as Message[]);
      }
      // If no history, leave messages empty — welcome message is shown via displayMessages
      setHistoryLoaded(true);
    };

    loadHistory();
  }, [open, historyLoaded, tripId, user]);

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
    const tempUserMsgId = `temp-${Date.now()}`;
    const tempUserMsg: Message = {
      id: tempUserMsgId,
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

    // Reflection mode: if this is the user's first reply to the reflection question, detect sentiment
    const isFirstReflectionReply = isReflection && reflectionUserMsgIdRef.current === null;
    if (isFirstReflectionReply) {
      reflectionUserMsgIdRef.current = tempUserMsgId;
      setReflectionSentiment(detectSentiment(userMessage));
      // Store in trip_reflections table (fire-and-forget)
      if (user && dayIndex) {
        supabase.from('trip_reflections').insert({
          trip_id: tripId,
          user_id: user.id,
          day_index: dayIndex,
          reflection_text: userMessage,
        }).then(() => { /* silent */ });
      }
    }

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
      const { cleanText, change } = parseChangeBlock(data.reply);
      const assistantMsg: Message = {
        id: msgId,
        role: 'assistant',
        content: cleanText,
        created_at: new Date().toISOString(),
        parsedChange: change ?? undefined,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      // Mark this as the reflection aria response so we can attach action buttons to it
      if (isFirstReflectionReply) {
        setReflectionAriaMsgId(msgId);
        // Update trip_reflections with aria_response (best-effort)
        if (user && dayIndex) {
          supabase.from('trip_reflections')
            .update({ aria_response: data.reply })
            .eq('trip_id', tripId)
            .eq('user_id', user.id)
            .eq('day_index', dayIndex)
            .order('created_at', { ascending: false })
            .limit(1)
            .then(() => { /* silent */ });
        }
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

  // Apply an Aria-proposed itinerary change to the database
  const handleApplyChange = async (msgId: string, change: ParsedChange) => {
    if (!user) return;
    setApplyingChange(true);
    try {
      if (change.action === 'remove' || change.action === 'swap') {
        await supabase
          .from('itinerary_items')
          .delete()
          .eq('itinerary_id', tripId)
          .eq('day_number', change.day)
          .ilike('custom_title', `%${change.remove}%`);
      }
      if ((change.action === 'add' || change.action === 'swap') && change.add) {
        // Determine time slot from change.add.time
        let time_slot = 'afternoon';
        if (change.add.time) {
          const h = parseInt(change.add.time.split(':')[0], 10);
          if (h < 12) time_slot = 'morning';
          else if (h >= 18) time_slot = 'evening';
          else time_slot = 'afternoon';
        }
        await supabase.from('itinerary_items').insert({
          itinerary_id: tripId,
          day_number: change.day,
          time_slot,
          item_type: change.add.category ?? 'attraction',
          custom_title: change.add.name,
          custom_description: change.add.description ?? '',
          order_index: 999,
        });
      }
      setAppliedChangeIds(prev => new Set([...prev, msgId]));
      // Confirm to Aria
      setMessages(prev => [...prev, {
        id: `aria-confirm-${Date.now()}`,
        role: 'assistant',
        content: `Done! I've updated your itinerary. ${change.add ? `${change.add.name} is now on Day ${change.day}.` : `${change.remove} has been removed from Day ${change.day}.`}`,
        created_at: new Date().toISOString(),
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: `aria-err-${Date.now()}`,
        role: 'error',
        content: 'Could not apply the change. Please edit the itinerary manually.',
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setApplyingChange(false);
    }
  };

  // Pace adjustment — remove ~30% of future flex activities
  const handleAdjustPace = async () => {
    if (!dayIndex || !tripId || paceAdjusted) return;
    setPaceAdjusting(true);
    try {
      const { data: flexItems } = await supabase
        .from('itinerary_items')
        .select('id')
        .eq('itinerary_id', tripId)
        .eq('item_type', 'flex')
        .gt('day_number', dayIndex)
        .order('day_number', { ascending: true });

      if (flexItems && flexItems.length > 0) {
        const removeCount = Math.max(1, Math.ceil(flexItems.length * 0.3));
        const toRemove = flexItems.slice(0, removeCount).map((i: { id: string }) => i.id);
        await supabase.from('itinerary_items').delete().in('id', toRemove);
        // Update pace_adjustment_made in trip_reflections
        if (user) {
          supabase.from('trip_reflections')
            .update({ pace_adjustment_made: true })
            .eq('trip_id', tripId)
            .eq('user_id', user.id)
            .eq('day_index', dayIndex)
            .order('created_at', { ascending: false })
            .limit(1)
            .then(() => { /* silent */ });
        }
      }
      setPaceAdjusted(true);
      setMessages(prev => [...prev, {
        id: `aria-pace-${Date.now()}`,
        role: 'assistant',
        content: "Done! I've lightened the load for your remaining days — removed some optional flex activities so you have more breathing room. Enjoy the rest of your trip! 🌿",
        created_at: new Date().toISOString(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: `aria-pace-err-${Date.now()}`,
        role: 'error',
        content: 'Could not adjust the pace right now. Please try again.',
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setPaceAdjusting(false);
    }
  };

  const handleKeepPace = () => {
    setPaceAdjusted(true); // dismiss the buttons
    setMessages(prev => [...prev, {
      id: `aria-keep-${Date.now()}`,
      role: 'assistant',
      content: "No problem — keeping everything as planned. You've got this! 💪",
      created_at: new Date().toISOString(),
    }]);
  };

  const handleAddMore = () => {
    setPaceAdjusted(true); // dismiss the buttons
    setInput("Can you suggest something extra to add to tomorrow?");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleKeepAsIs = () => {
    setPaceAdjusted(true);
    setMessages(prev => [...prev, {
      id: `aria-keepasis-${Date.now()}`,
      role: 'assistant',
      content: "Sounds great — keeping the itinerary as is. Keep up the amazing energy! 🚀",
      created_at: new Date().toISOString(),
    }]);
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
        data-tour="aria-button"
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
                      {/* Reflection adaptive action buttons */}
                      {isReflection && msg.id === reflectionAriaMsgId && !paceAdjusted && reflectionSentiment && (
                        <div className="flex flex-col gap-2 mt-2 pl-0.5">
                          {reflectionSentiment === 'fatigue' && (
                            <>
                              <p className="text-xs text-muted-foreground">Would you like me to ease the pace for your remaining days?</p>
                              <div className="flex gap-2 flex-wrap">
                                <Button
                                  size="sm"
                                  className="h-8 text-xs bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 border-0 text-white gap-1"
                                  onClick={handleAdjustPace}
                                  disabled={paceAdjusting}
                                >
                                  {paceAdjusting && <Loader2 className="w-3 h-3 animate-spin" />}
                                  Yes, adjust pace
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs"
                                  onClick={handleKeepPace}
                                  disabled={paceAdjusting}
                                >
                                  Keep as planned
                                </Button>
                              </div>
                            </>
                          )}
                          {reflectionSentiment === 'positive' && (
                            <>
                              <p className="text-xs text-muted-foreground">Want me to make tomorrow a bit fuller?</p>
                              <div className="flex gap-2 flex-wrap">
                                <Button
                                  size="sm"
                                  className="h-8 text-xs bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 border-0 text-white"
                                  onClick={handleAddMore}
                                >
                                  Add more
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs"
                                  onClick={handleKeepAsIs}
                                >
                                  Keep as is
                                </Button>
                              </div>
                            </>
                          )}
                          {reflectionSentiment === 'neutral' && (
                            <p className="text-xs text-muted-foreground italic">Thanks for sharing! I'll keep your feedback in mind for this trip.</p>
                          )}
                        </div>
                      )}

                      {/* Itinerary change confirmation — shown when Aria proposes a change */}
                      {msg.parsedChange && !appliedChangeIds.has(msg.id) && (
                        <div className="flex gap-2 mt-2 pl-0.5">
                          <Button
                            size="sm"
                            className="h-8 text-xs bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 border-0 text-white gap-1"
                            onClick={() => handleApplyChange(msg.id, msg.parsedChange!)}
                            disabled={applyingChange}
                          >
                            {applyingChange && <Loader2 className="w-3 h-3 animate-spin" />}
                            Apply to itinerary
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => setAppliedChangeIds(prev => new Set([...prev, msg.id]))}
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
