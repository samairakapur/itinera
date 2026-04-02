import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const SYSTEM_PROMPT = `You are Kiko, a friendly and knowledgeable destination guide with deep expertise on cities around the world.

You help travellers discover what makes destinations special — the best neighbourhoods, must-see spots, hidden gems, local food scenes, transport tips, cultural customs, and what's genuinely worth skipping.

You do NOT have access to any specific user's trip, itinerary, or booking data. You only answer questions about destinations in general.

Your tone is warm, playful, and full of genuine enthusiasm for travel. You use specific examples, name actual neighbourhoods and places, and share insider perspectives rather than generic tourist advice.

Keep responses concise (3-5 sentences for simple questions, short paragraphs for more detailed ones). Use bullet points sparingly — only for comparisons or lists of 4+. Always end with a follow-up question or suggestion to keep the conversation going.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { message, history = [], userId } = await req.json();

    if (!message?.trim()) {
      return json({ error: "message is required" });
    }

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");

    type Provider = { key: string; url: string; model: string; name: string };
    const providers: Provider[] = [];
    if (GROQ_API_KEY)      providers.push({ key: GROQ_API_KEY,      url: "https://api.groq.com/openai/v1/chat/completions",                          model: "llama-3.3-70b-versatile",       name: "groq" });
    if (LOVABLE_API_KEY)   providers.push({ key: LOVABLE_API_KEY,   url: "https://ai.gateway.lovable.dev/v1/chat/completions",                       model: "google/gemini-2.5-flash",       name: "lovable" });
    if (GOOGLE_AI_API_KEY) providers.push({ key: GOOGLE_AI_API_KEY, url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", model: "gemini-2.0-flash",              name: "google" });

    if (providers.length === 0) {
      return json({ error: "No AI providers configured. Please check your API keys." });
    }

    const aiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.slice(-10).map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    let reply = "";
    let lastError = "";

    for (const provider of providers) {
      try {
        const aiRes = await fetch(provider.url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${provider.key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: provider.model,
            messages: aiMessages,
            temperature: 0.7,
            max_tokens: 512,
          }),
        });

        if (!aiRes.ok) {
          const status = aiRes.status;
          lastError = `${provider.name} ${status}`;
          if (status === 401 || status === 403) continue; // try next provider
          // For non-auth errors, try next anyway
          continue;
        }

        const aiData = await aiRes.json();
        const content = aiData.choices?.[0]?.message?.content;
        if (content) {
          reply = content;
          break;
        }
        lastError = `${provider.name} returned empty content`;
      } catch (e) {
        lastError = `${provider.name}: ${e instanceof Error ? e.message : String(e)}`;
      }
    }

    if (!reply) {
      return json({ error: `Kiko is temporarily unavailable (${lastError}). Please try again in a moment.` });
    }

    return json({ reply });
  } catch (err) {
    console.error("destination-concierge error:", err);
    return json({ error: "Kiko ran into an unexpected error. Please try again." });
  }
});
