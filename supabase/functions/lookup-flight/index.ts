import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LookupFlightRequest {
  flight_number: string; // e.g. "BA123"
  date: string;          // YYYY-MM-DD
}

interface FlightLookupResult {
  airline: string;
  flight_number: string;
  departure_city: string;
  arrival_city: string;
  departure_airport_iata: string;
  arrival_airport_iata: string;
  departure_date: string;
  departure_time: string;
  arrival_date: string;
  arrival_time: string;
  departure_terminal: string | null;
  arrival_terminal: string | null;
  status: string;
}

// Map AviationStack status codes to our status values
function normaliseStatus(status: string): string {
  switch (status?.toLowerCase()) {
    case "scheduled": return "scheduled";
    case "active":
    case "en-route": return "scheduled";
    case "landed": return "landed";
    case "cancelled": return "cancelled";
    case "incident":
    case "diverted":
    case "delayed": return "delayed";
    default: return "scheduled";
  }
}

// Extract HH:MM from an ISO datetime string like "2026-03-15T14:30:00+00:00"
function extractTime(datetime: string | null): string {
  if (!datetime) return "";
  const match = datetime.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : "";
}

// Extract YYYY-MM-DD date from an ISO datetime string
function extractDate(datetime: string | null, fallbackDate: string): string {
  if (!datetime) return fallbackDate;
  const match = datetime.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : fallbackDate;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: LookupFlightRequest = await req.json();
    const { flight_number, date } = body;

    if (!flight_number || !date) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: flight_number, date" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const AVIATIONSTACK_API_KEY = Deno.env.get("AVIATIONSTACK_API_KEY");

    if (!AVIATIONSTACK_API_KEY) {
      // Graceful degradation: key not configured
      return new Response(
        JSON.stringify({ error: "FLIGHT_LOOKUP_UNAVAILABLE" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalise flight number: remove spaces, uppercase
    const normalisedFlightNumber = flight_number.replace(/\s+/g, "").toUpperCase();

    const url = new URL("http://api.aviationstack.com/v1/flights");
    url.searchParams.set("access_key", AVIATIONSTACK_API_KEY);
    url.searchParams.set("flight_iata", normalisedFlightNumber);
    url.searchParams.set("flight_date", date);

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`AviationStack API error: ${response.status}`);
    }

    const apiData = await response.json();

    if (apiData.error) {
      // API returned an error object (e.g. rate limit exceeded)
      console.error("AviationStack error:", apiData.error);
      return new Response(
        JSON.stringify({ error: "FLIGHT_LOOKUP_UNAVAILABLE", detail: apiData.error.message }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const flights: any[] = apiData.data ?? [];

    if (flights.length === 0) {
      return new Response(
        JSON.stringify({ error: "FLIGHT_NOT_FOUND" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use the first matching result
    const f = flights[0];

    const result: FlightLookupResult = {
      airline: f.airline?.name ?? "",
      flight_number: f.flight?.iata ?? normalisedFlightNumber,
      departure_city: f.departure?.airport ?? f.departure?.iata ?? "",
      arrival_city: f.arrival?.airport ?? f.arrival?.iata ?? "",
      departure_airport_iata: f.departure?.iata ?? "",
      arrival_airport_iata: f.arrival?.iata ?? "",
      departure_date: extractDate(f.departure?.scheduled, date),
      departure_time: extractTime(f.departure?.scheduled),
      arrival_date: extractDate(f.arrival?.scheduled, date),
      arrival_time: extractTime(f.arrival?.scheduled),
      departure_terminal: f.departure?.terminal ?? null,
      arrival_terminal: f.arrival?.terminal ?? null,
      status: normaliseStatus(f.flight_status),
    };

    return new Response(JSON.stringify({ flight: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("lookup-flight error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
