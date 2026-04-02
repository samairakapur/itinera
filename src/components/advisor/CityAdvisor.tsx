import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { City } from '@/hooks/useCities';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface CityAdvisorProps {
  city: City;
}

const SUPABASE_BASE = import.meta.env.VITE_SUPABASE_URL ?? 'https://vvrkjjtwxoynkubynsfi.supabase.co';
const CHAT_URL = `${SUPABASE_BASE}/functions/v1/chat`;

// ---------------------------------------------------------------------------
// Kiko prompt chips — same for all cities (destination-agnostic)
// ---------------------------------------------------------------------------
const KIKO_PROMPTS = [
  'What makes this city special?',
  'Best neighbourhood for first-timers?',
  'Hidden gems most tourists miss?',
  'Best time of year to visit?',
];

// ---------------------------------------------------------------------------
// Lightweight markdown renderer — bold, bullets, line breaks
// ---------------------------------------------------------------------------
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, lineIdx) => {
    if (line.trim() === '') {
      elements.push(<div key={`sp-${lineIdx}`} className="h-1" />);
      return;
    }
    const isBullet = /^\s*[-•]\s/.test(line);
    const content = isBullet ? line.replace(/^\s*[-•]\s/, '') : line;

    const parts = content.split(/\*\*(.*?)\*\*/g);
    const rendered = parts.map((part, i) =>
      i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : <span key={i}>{part}</span>
    );

    if (isBullet) {
      elements.push(
        <div key={lineIdx} className="flex gap-2 mt-0.5">
          <span className="text-primary shrink-0 mt-px">•</span>
          <span>{rendered}</span>
        </div>
      );
    } else {
      elements.push(<p key={lineIdx} className="mt-0.5">{rendered}</p>);
    }
  });

  return <>{elements}</>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const CityAdvisor = ({ city }: CityAdvisorProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token?.replace(/[^\x20-\x7E]/g, '').trim();
      if (!accessToken) {
        throw new Error('Please sign in to use the Travel Advisor.');
      }

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          cityContext: {
            name: city.name,
            country: city.country,
            description: city.description,
            familyTips: city.family_tips,
            bestTimeToVisit: city.best_time_to_visit,
          },
        }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) throw new Error('Too many requests — please wait a moment and try again.');
        const errData = await resp.json().catch(() => ({}));
        throw new Error((errData as { error?: string }).error || 'Failed to reach the AI service.');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, content: assistantContent } : m
                  );
                }
                return [...prev, { role: 'assistant', content: assistantContent }];
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      const msg = error instanceof Error
        ? error.message
        : "I'm having trouble connecting. Please try again in a moment.";
      setMessages(prev => [...prev, { role: 'assistant', content: msg }]);
    }

    setIsLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="border-b pb-3">
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 text-white text-sm font-bold">
            🌍
          </div>
          <div className="flex flex-col">
            <span>Kiko 🌍</span>
            <span className="text-xs font-normal text-muted-foreground">Your destination guide</span>
          </div>
        </CardTitle>
      </CardHeader>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-4 text-2xl">
              🌍
            </div>
            <h3 className="font-display text-lg font-semibold mb-1">
              Kiko 🌍
            </h3>
            <p className="text-sm text-muted-foreground mb-5 max-w-xs">
              Hi! I'm Kiko 🌍 Tell me where you're curious about — I can share what makes each city special, the best neighbourhoods to explore, and what's worth skipping.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {KIKO_PROMPTS.map((prompt) => (
                <Button
                  key={prompt}
                  variant="outline"
                  size="sm"
                  onClick={() => sendMessage(prompt)}
                  className="text-xs h-auto py-1.5 px-3 whitespace-normal text-left"
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 mt-0.5 text-sm">
                    🌍
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  {message.role === 'assistant'
                    ? renderMarkdown(message.content)
                    : <p>{message.content}</p>
                  }
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 text-sm">
                  🌍
                </div>
                <div className="bg-muted rounded-2xl px-4 py-3">
                  <div className="flex gap-1 items-center h-4">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask Kiko about ${city.name}…`}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
};

export default CityAdvisor;
