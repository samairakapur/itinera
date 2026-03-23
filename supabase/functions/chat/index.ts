import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Use standard Supabase JS v2 auth (replaces non-standard getClaims)
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Authenticated user:", user.id);

    const { messages, cityContext } = await req.json();

    // Strip non-printable / non-ASCII bytes from the API key.
    // Deno's fetch throws "Value is not a valid ByteString" if the
    // Authorization header contains anything outside U+0020–U+007E
    // (e.g. a trailing \n that paste-from-clipboard silently adds).
    const rawGroqKey = Deno.env.get("GROQ_API_KEY");
    const GROQ_API_KEY = rawGroqKey?.replace(/[^\x20-\x7E]/g, '').trim() || undefined;

    if (!GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ error: "The AI service is not configured. Please contact support." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build system prompt based on context
    let systemPrompt = `You are TravelBuddy AI, a friendly and knowledgeable travel advisor. You specialize in helping travelers plan personalized trips to destinations worldwide including Orlando (USA), London (UK), Tokyo (Japan), Barcelona (Spain), Sydney (Australia), Amsterdam (Netherlands), San Diego (USA), Copenhagen (Denmark), and many more.

Your expertise includes:
- Top attractions and activities for all travel styles
- Restaurant recommendations for diverse tastes and dietary needs
- Public transportation tips and getting around efficiently
- Budget-saving strategies and money-saving tips
- Best times to visit each destination
- Safety tips and practical advice
- Hidden gems and local favorites

Communication style:
- Be warm, encouraging, and enthusiastic about travel
- Give practical, actionable advice
- Use bullet points for lists
- Include specific recommendations when possible
- Mention approximate costs when relevant
- Consider different traveler types (solo, couples, groups, etc.)

Keep responses concise but helpful. If you don't know something specific, be honest and suggest alternatives.`;

    // Add city-specific context if provided
    if (cityContext) {
      systemPrompt += `

The user is currently viewing information about ${cityContext.name}, ${cityContext.country}. Here's some context about this city:
${cityContext.description ? `About: ${cityContext.description}` : ""}
${cityContext.familyTips ? `Insider Tips: ${cityContext.familyTips}` : ""}
${cityContext.bestTimeToVisit ? `Best Time to Visit: ${cityContext.bestTimeToVisit}` : ""}

When answering, prioritize information relevant to ${cityContext.name}.`;
    }

    // Call Google Gemini via OpenAI-compatible endpoint (free tier: 1,500 req/day)
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit reached. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 401 || response.status === 403) {
        return new Response(
          JSON.stringify({ error: "The AI service key is invalid or missing. Please contact support." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "AI service error. Please try again in a moment." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
