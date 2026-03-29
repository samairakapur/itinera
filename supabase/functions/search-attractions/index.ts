/**
 * search-attractions — Viator product search (v2 freetext API)
 *
 * POST body:
 *   { destination: string, category?: string, groupSize?: number, query?: string }
 *
 * Returns top 3 Viator products with direct product URLs (affiliate-tracked).
 * Falls back gracefully if VIATOR_API_KEY is absent or invalid.
 *
 * Viator Basic Access API docs: https://docs.viator.com/partner-api/technical/
 * Auth header: exp-api-key
 * Endpoint: POST /partner/search/freetext (v2 — no destination ID required)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const VIATOR_AFFILIATE_BASE = 'https://www.viator.com';
const VIATOR_PARTNER_ID = 'P00294080';

// Sandbox: https://api.sandbox.viator.com/partner
// Production: https://api.viator.com/partner
const VIATOR_API_BASE = 'https://api.sandbox.viator.com/partner';

interface ViatorProduct {
  productCode: string;
  title: string;
  description?: string;
  // v2 review format
  reviews?: {
    combinedAverageRating?: number;
    totalReviews?: number;
    sources?: Array<{ provider: string; totalCount: number; averageRating: number }>;
  };
  pricing?: { summary?: { fromPrice?: number }; currency?: string };
  images?: Array<{ variants?: Array<{ url?: string; width?: number; height?: number }> }>;
  // v2 returns productUrl with affiliate tracking already embedded
  productUrl?: string;
  duration?: {
    fixedDurationInMinutes?: number;
    variableDurationFromMinutes?: number;
    variableDurationToMinutes?: number;
  };
}

function buildBookingUrl(p: ViatorProduct): string {
  if (p.productUrl && p.productUrl.includes('viator.com')) {
    // productUrl from v2 already contains pid= affiliate tracking
    // Add mcid if not already present
    if (p.productUrl.includes('mcid=')) return p.productUrl;
    const sep = p.productUrl.includes('?') ? '&' : '?';
    return `${p.productUrl}${sep}mcid=${VIATOR_PARTNER_ID}`;
  }
  // Fallback: search by product code — returns the specific product in results
  return `${VIATOR_AFFILIATE_BASE}/searchResults/all?text=${encodeURIComponent(p.productCode)}&mcid=${VIATOR_PARTNER_ID}`;
}

function extractDurationMinutes(p: ViatorProduct): number | undefined {
  if (p.duration?.fixedDurationInMinutes) return p.duration.fixedDurationInMinutes;
  if (p.duration?.variableDurationFromMinutes) return p.duration.variableDurationFromMinutes;
  return undefined;
}

function pickImageUrl(p: ViatorProduct): string | undefined {
  const variants = p.images?.[0]?.variants ?? [];
  // Prefer ~400px wide image
  const preferred = variants.find(v => v.width && v.width >= 360 && v.width <= 540);
  return preferred?.url ?? variants[0]?.url;
}

function mapProduct(p: ViatorProduct) {
  return {
    productCode: p.productCode,
    title: p.title,
    description: p.description?.slice(0, 220),
    rating: p.reviews?.combinedAverageRating,
    reviewCount: p.reviews?.totalReviews,
    fromPrice: p.pricing?.summary?.fromPrice,
    currency: p.pricing?.currency ?? 'USD',
    durationMinutes: extractDurationMinutes(p),
    imageUrl: pickImageUrl(p),
    bookingUrl: buildBookingUrl(p),
    webURL: p.productUrl,
  };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const apiKey = Deno.env.get('VIATOR_API_KEY');

    if (!apiKey) {
      return new Response(
        JSON.stringify({ products: [], fallback: true, reason: 'Viator API key not configured' }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const { destination, groupSize, query } = await req.json();

    if (!destination && !query) {
      return new Response(
        JSON.stringify({ error: 'destination or query is required' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // Combine query + destination for best freetext results (e.g. "Eiffel Tower Paris")
    const searchText = query && destination
      ? `${query} ${destination}`
      : (query || destination);

    console.log('[search-attractions] searching:', searchText);

    // Viator v2 freetext search — no destination ID required
    const payload = {
      searchTerm: searchText,
      searchTypes: [
        {
          searchType: 'PRODUCTS',
          pagination: { offset: 0, limit: 3 },
        },
      ],
      currency: 'USD',
    };

    const searchRes = await fetch(`${VIATOR_API_BASE}/search/freetext`, {
      method: 'POST',
      headers: {
        'exp-api-key': apiKey,
        'Accept': 'application/json;version=2.0',
        'Accept-Language': 'en-US',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (searchRes.status === 401 || searchRes.status === 403) {
      const errText = await searchRes.text().catch(() => '');
      console.error('[search-attractions] Viator auth error:', searchRes.status, errText);
      return new Response(
        JSON.stringify({ products: [], fallback: true, reason: 'Viator API key rejected — check partner portal' }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    if (!searchRes.ok) {
      const errText = await searchRes.text();
      console.error('[search-attractions] Viator API error:', searchRes.status, errText);
      return new Response(
        JSON.stringify({ products: [], fallback: true, reason: `Viator error: ${searchRes.status}` }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const rawBody = await searchRes.text();
    console.log('[search-attractions] Viator response (first 500):', rawBody.slice(0, 500));

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(rawBody);
    } catch {
      console.error('[search-attractions] Failed to parse Viator response');
      return new Response(
        JSON.stringify({ products: [], fallback: true, reason: 'Invalid JSON from Viator' }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // v2 freetext response: { products: { totalCount, results: [...] } }
    const rawProducts = (data as any)?.products?.results as ViatorProduct[] ?? [];
    const mapped = rawProducts.slice(0, 3).map(mapProduct);

    console.log(`[search-attractions] returning ${mapped.length} products`);
    return new Response(
      JSON.stringify({ products: mapped, fallback: false }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[search-attractions] unhandled error:', err);
    return new Response(
      JSON.stringify({ products: [], fallback: true, reason: String(err) }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});
