/**
 * search-flights — Amadeus flight offers search
 *
 * POST body:
 *   {
 *     origin: string,        // IATA code, e.g. "LHR"
 *     destination: string,   // IATA code, e.g. "NRT"
 *     departureDate: string, // YYYY-MM-DD
 *     returnDate?: string,   // YYYY-MM-DD (optional, for round trips)
 *     adults?: number,       // default 1
 *     currencyCode?: string  // default "USD"
 *   }
 *
 * Returns top 5 cheapest flight offers.
 * Degrades gracefully if AMADEUS_CLIENT_ID / AMADEUS_CLIENT_SECRET not configured.
 *
 * Uses Amadeus TEST environment: test.api.amadeus.com
 * OAuth2 client_credentials flow; token cached for 29 minutes.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const AMADEUS_BASE = 'https://test.api.amadeus.com';

// In-memory token cache (survives warm Deno isolate restarts for ~29 min)
let cachedToken: string | null = null;
let tokenExpiresAt = 0; // ms epoch

async function getAmadeusToken(clientId: string, clientSecret: string): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const res = await fetch(`${AMADEUS_BASE}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Amadeus token error ${res.status}: ${txt}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  // Cache for 29 minutes (Amadeus tokens last 30 min)
  tokenExpiresAt = now + 29 * 60 * 1000;
  return cachedToken!;
}

interface FlightOffer {
  id: string;
  price?: { total?: string; currency?: string };
  itineraries?: Array<{
    duration?: string;
    segments?: Array<{
      departure?: { iataCode?: string; at?: string };
      arrival?: { iataCode?: string; at?: string };
      carrierCode?: string;
      number?: string;
      aircraft?: { code?: string };
      numberOfStops?: number;
    }>;
  }>;
}

function mapOffer(offer: FlightOffer) {
  const outbound = offer.itineraries?.[0];
  const inbound = offer.itineraries?.[1];
  const firstSeg = outbound?.segments?.[0];
  const lastSeg = outbound?.segments?.at?.(-1);

  return {
    id: offer.id,
    price: {
      total: offer.price?.total,
      currency: offer.price?.currency ?? 'USD',
    },
    outbound: {
      duration: outbound?.duration,
      stops: (outbound?.segments?.length ?? 1) - 1,
      departure: {
        airport: firstSeg?.departure?.iataCode,
        at: firstSeg?.departure?.at,
      },
      arrival: {
        airport: lastSeg?.arrival?.iataCode,
        at: lastSeg?.arrival?.at,
      },
      carrier: firstSeg?.carrierCode,
      flightNumber: firstSeg ? `${firstSeg.carrierCode}${firstSeg.number}` : undefined,
    },
    inbound: inbound
      ? {
          duration: inbound.duration,
          stops: (inbound.segments?.length ?? 1) - 1,
          departure: {
            airport: inbound.segments?.[0]?.departure?.iataCode,
            at: inbound.segments?.[0]?.departure?.at,
          },
          arrival: {
            airport: inbound.segments?.at?.(-1)?.arrival?.iataCode,
            at: inbound.segments?.at?.(-1)?.arrival?.at,
          },
        }
      : undefined,
  };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const clientId = Deno.env.get('AMADEUS_CLIENT_ID');
    const clientSecret = Deno.env.get('AMADEUS_CLIENT_SECRET');

    // Graceful degradation — keys not yet obtained
    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({
          flights: [],
          fallback: true,
          reason: 'Amadeus API keys not configured — add AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET to Supabase secrets',
        }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const {
      origin,
      destination,
      departureDate,
      returnDate,
      adults = 1,
      currencyCode = 'USD',
    } = body;

    if (!origin || !destination || !departureDate) {
      return new Response(
        JSON.stringify({ error: 'origin, destination, and departureDate are required' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const token = await getAmadeusToken(clientId, clientSecret);

    const params = new URLSearchParams({
      originLocationCode: origin.toUpperCase(),
      destinationLocationCode: destination.toUpperCase(),
      departureDate,
      adults: String(adults),
      currencyCode,
      max: '5',
    });

    if (returnDate) {
      params.append('returnDate', returnDate);
    }

    const searchRes = await fetch(
      `${AMADEUS_BASE}/v2/shopping/flight-offers?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!searchRes.ok) {
      const errText = await searchRes.text();
      console.error('Amadeus search error:', searchRes.status, errText);
      return new Response(
        JSON.stringify({
          flights: [],
          fallback: true,
          reason: `Amadeus error ${searchRes.status} — check test environment credentials`,
        }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const data = await searchRes.json();
    const offers: FlightOffer[] = data.data ?? [];
    const mapped = offers.map(mapOffer);

    return new Response(
      JSON.stringify({ flights: mapped, fallback: false }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('search-flights error:', err);
    return new Response(
      JSON.stringify({ flights: [], fallback: true, reason: String(err) }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});
