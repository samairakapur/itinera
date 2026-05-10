import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ParsedFlightPartial {
  flightNumber?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  departureDate?: string;
  departureTime?: string;
  arrivalTime?: string;
  // legacy fields kept for downstream compat
  airline?: string;
  departure_city?: string;
  arrival_city?: string;
  arrival_date?: string;
  notes?: string;
}

interface ParseFlightResponse {
  success: boolean;
  confidence: 'high' | 'low' | 'none';
  partial: ParsedFlightPartial;
  message?: string;
  // legacy field so the existing complete-flight path still works
  flights?: ParsedFlightPartial[];
}

function ok(body: ParseFlightResponse): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Standard Supabase JS v2 auth (replaces non-standard getClaims)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return ok({ success: false, confidence: 'none', partial: {}, message: "No image provided" });
    }

    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) {
      return ok({ success: false, confidence: 'none', partial: {}, message: "AI service not configured" });
    }

    // Use Gemini via OpenAI-compatible endpoint (supports vision/image input)
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GOOGLE_AI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemini-1.5-flash",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Extract flight details from this booking confirmation image. Return ONLY valid JSON with this exact structure:
{
  "flights": [
    {
      "airline": "Airline Name",
      "flight_number": "XX123",
      "departure_city": "City Name",
      "arrival_city": "City Name",
      "departure_date": "YYYY-MM-DD",
      "departure_time": "HH:MM",
      "arrival_date": "YYYY-MM-DD",
      "arrival_time": "HH:MM",
      "notes": "Terminal/gate/confirmation info if visible"
    }
  ]
}

Rules:
- Extract ALL flight legs (outbound + return + connections)
- Use 24-hour time format
- Use ISO date format YYYY-MM-DD
- If a field is not visible, use null
- For city names, use the city (not airport code), but include the airport code in notes if visible
- If this is not a flight confirmation, return {"flights": [], "error": "Not a flight confirmation"}`
                },
                {
                  type: "image_url",
                  image_url: {
                    url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                  }
                }
              ]
            }
          ],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", response.status, errText);
      if (response.status === 429) {
        return ok({ success: false, confidence: 'none', partial: {}, message: "Rate limit reached. Please try again in a moment." });
      }
      return ok({ success: false, confidence: 'none', partial: {}, message: `AI error: ${response.status}` });
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn("parse-flight: could not extract JSON from AI response");
      return ok({ success: false, confidence: 'none', partial: {}, message: "Could not read flight details from this image" });
    }

    let parsed: { flights?: ParsedFlightPartial[]; error?: string };
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return ok({ success: false, confidence: 'none', partial: {}, message: "Could not read flight details from this image" });
    }

    const flights = parsed.flights ?? [];

    // Check for complete flights (the legacy path used by the existing success handler)
    const completeFlights = flights.filter(
      (f) => f.departure_city && f.arrival_city && f.departure_date && f.arrival_date
    );

    if (completeFlights.length > 0) {
      // Full success — keep legacy `flights` field for the frontend complete-flight path
      return ok({
        success: true,
        confidence: 'high',
        partial: completeFlights[0],
        flights: completeFlights,
      });
    }

    // Partial parse — some fields extracted but not enough for auto-save
    const firstFlight = flights[0] ?? {};
    const hasAnyField = Object.values(firstFlight).some(v => v != null && v !== '');
    if (hasAnyField) {
      return ok({
        success: false,
        confidence: 'low',
        partial: firstFlight,
        flights,
        message: "We couldn't read all details from your boarding pass — please check and complete the fields below.",
      });
    }

    return ok({
      success: false,
      confidence: 'none',
      partial: {},
      message: "We couldn't read all details from your boarding pass — please check and complete the fields below.",
    });

  } catch (e) {
    console.error("parse-flight error:", e);
    return ok({
      success: false,
      confidence: 'none',
      partial: {},
      message: "We couldn't read all details from your boarding pass — please check and complete the fields below.",
    });
  }
});
