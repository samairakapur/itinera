import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Globe2, X, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
}

// Kiko avatar — warm amber/orange gradient (distinct from Aria's violet/fuchsia)
const KikoAvatar = ({ size = 'md' }: { size?: 'sm' | 'md' }) => (
  <div
    className={cn(
      'rounded-full flex items-center justify-center shrink-0',
      'bg-gradient-to-br from-amber-400 to-orange-500',
      size === 'sm' ? 'w-7 h-7' : 'w-9 h-9'
    )}
  >
    <Globe2
      className="text-white"
      style={{ width: size === 'sm' ? 14 : 18, height: size === 'sm' ? 14 : 18 }}
    />
  </div>
);

const WELCOME: Message = {
  id: 'kiko-welcome',
  role: 'assistant',
  content: `Hi! I'm Kiko 🌍 Tell me where you're curious about — I can share what makes each city special, the best neighbourhoods to explore, and what's worth skipping.`,
};

const PROMPT_CHIPS = [
  "What makes Tokyo different from other Asian cities?",
  "Best neighbourhood for first-timers in Paris?",
  "Hidden gems in Barcelona most tourists miss?",
  "Is Lisbon or Porto better for a weekend trip?",
  "What's the food scene like in Bangkok?",
];

export const KikoConcierge = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (open) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }, [messages, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userText = text.trim();
    setInput('');

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: userText,
    };
    setMessages((prev) => {
      const base = prev.length === 0 ? [] : prev;
      return [...base, userMsg];
    });
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('destination-concierge', {
        body: {
          message: userText,
          history: messages
            .filter((m) => m.role !== 'error')
            .slice(-6)
            .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
          userId: user?.id ?? null,
        },
      });

      if (error) throw new Error((error as any)?.message ?? 'Kiko is temporarily unavailable.');
      if (data?.error) throw new Error(data.error);

      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'assistant', content: data.reply },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Kiko is temporarily unavailable.';
      setMessages((prev) => [
        ...prev,
        { id: `e-${Date.now()}`, role: 'error', content: msg },
      ]);
      setInput(userText);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const displayMessages = messages.length === 0 ? [WELCOME] : messages;

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40',
          'w-14 h-14 rounded-full shadow-lg',
          'bg-gradient-to-br from-amber-400 to-orange-500',
          'flex items-center justify-center',
          'hover:scale-105 active:scale-95 transition-transform',
          open && 'hidden',
        )}
        aria-label="Chat with Kiko"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </button>

      {/* Chat panel */}
      {open && (
        <div className={cn(
          'fixed z-50 flex flex-col',
          'bottom-0 left-0 right-0 md:bottom-6 md:right-6 md:left-auto',
          'md:w-[380px] md:rounded-2xl',
          'bg-card border shadow-2xl',
          'h-[75vh] md:h-[520px]',
        )}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 md:rounded-t-2xl">
            <KikoAvatar />
            <div className="flex-1">
              <p className="font-semibold text-sm text-foreground">Kiko</p>
              <p className="text-xs text-muted-foreground">Destination guide</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {displayMessages.map((msg) => (
              <div
                key={msg.id}
                className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {msg.role !== 'user' && <KikoAvatar size="sm" />}
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : msg.role === 'error'
                      ? 'bg-destructive/10 text-destructive border border-destructive/20 rounded-tl-sm'
                      : 'bg-muted text-foreground rounded-tl-sm',
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Prompt chips — only shown after welcome, before first user message */}
            {messages.length === 0 && (
              <div className="flex flex-col gap-1.5 mt-2">
                {PROMPT_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => sendMessage(chip)}
                    className="text-left text-xs px-3 py-2 rounded-xl border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="flex gap-2 items-center">
                <KikoAvatar size="sm" />
                <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Kiko about any destination…"
              className="flex-1 text-sm"
              disabled={loading}
            />
            <Button
              size="icon"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="shrink-0 bg-gradient-to-br from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 border-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
