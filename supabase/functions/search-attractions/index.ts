/**
 * search-attractions — Viator product search
 *
 * POST body:
 *   { destination: string, category?: string, groupSize?: number, query?: string }
 *
 * Returns top 2–3 Viator products per query with affiliate booking URLs.
 * Falls back gracefully if VIATOR_API_KEY is absent or the sandbox key is not yet active.
 *
 * Viator Basic Access API docs: https://docs.viator.com/partner-api/technical/
 * Auth header: exp-api-key
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Affiliate base URL — replace PARTNER_ID with your actual Viator affiliate ID
const VIATOR_AFFILIATE_BASE = 'https://www.viator.com';
const VIATOR_PARTNER_ID = 'P00294080';
const VIATOR_API_BASE = 'https://api.viator.com/partner';

interface ViatorProduct {
  productCode: string;
  title: string;
  description?: string;
  rating?: number;
  reviewCount?: number;
  pricing?: { summary?: { fromPrice?: number; currency?: string } };
  images?: Array<{ variants?: Array<{ url?: string }> }>;
  webURL?: string;
  // Duration can appear in multiple formats depending on API version
  duration?: {
    fixedDurationInMinutes?: number;
    variableDurationFromMinutes?: number;
    variableDurationToMinutes?: number;
  };
  durationMinutes?: number; // some endpoints flatten this
}

function buildAffiliateUrl(productCode: string, webUrl?: string): string {
  if (webUrl && webUrl.includes('viator.com')) {
    // Append affiliate tracking parameter to the direct product URL
    const sep = webUrl.includes('?') ? '&' : '?';
    return `${webUrl}${sep}mcid=${VIATOR_PARTNER_ID}`;
  }
  // Fallback: Viator search URL filtered to this product code
  // The generic /tours/{productCode} path doesn't always resolve correctly
  return `${VIATOR_AFFILIATE_BASE}/searchResults/all?text=${encodeURIComponent(productCode)}&mcid=${VIATOR_PARTNER_ID}`;
}

function extractDurationMinutes(p: ViatorProduct): number | undefined {
  if (p.durationMinutes) return p.durationMinutes;
  if (p.duration?.fixedDurationInMinutes) return p.duration.fixedDurationInMinutes;
  if (p.duration?.variableDurationFromMinutes) return p.duration.variableDurationFromMinutes;
  return undefined;
}

function mapProduct(p: ViatorProduct) {
  return {
    productCode: p.productCode,
    title: p.title,
    description: p.description?.slice(0, 200),
    rating: p.rating,
    reviewCount: p.reviewCount,
    fromPrice: p.pricing?.summary?.fromPrice,
    currency: p.pricing?.summary?.currency ?? 'USD',
    durationMinutes: extractDurationMinutes(p),
    imageUrl: p.images?.[0]?.variants?.find(v => v.url?.includes('w300'))?.url
      ?? p.images?.[0]?.variants?.[0]?.url,
    // bookingUrl: direct product page when webURL available, otherwise search fallback
    bookingUrl: buildAffiliateUrl(p.productCode, p.webURL),
    // Provide the raw webURL so the client can fall back or construct its own URL
    webURL: p.webURL,
  };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const apiKey = Deno.env.get('VIATOR_API_KEY');

    // Graceful degradation — no key configured
    if (!apiKey) {
      return new Response(
        JSON.stringify({ products: [], fallback: true, reason: 'Viator API key not configured' }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const { destination, category, groupSize, query } = await req.json();

    if (!destination && !query) {
      return new Response(
        JSON.stringify({ error: 'destination or query is required' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // Build Viator v1 product search payload
    // Combine query + destination for best results (e.g. "Eiffel Tower Paris")
    const searchText = query && destination
      ? `${query} ${destination}`
      : (query || destination);
    const payload: Record<string, unknown> = {
      searchTerm: searchText,
      count: 3,
      startIndex: 0,
      currency: 'USD',
    };

    // NOTE: pricingAgeGroup is NOT a valid field for /partner/products/search — omit it.
    // groupSize is used only for context (passed through to UI), not sent to Viator.

    // Use v1 text search endpoint
    const searchRes = await fetch(`${VIATOR_API_BASE}/products/search`, {
      method: 'POST',
      headers: {
        'exp-api-key': apiKey,
        'Accept-Language': 'en-US',
        'Content-Type': 'application/json',
        'Accept': 'application/json;version=2.0',
      },
      body: JSON.stringify(payload),
    });

    // Sandbox key may return 401/403 before activation
    if (searchRes.status === 401 || searchRes.status === 403) {
      const authErrText = await searchRes.text().catch(() => '');
      console.error('[search-attractions] Viator auth error:', searchRes.status, authErrText);
      return new Response(
        JSON.stringify({
          products: [],
          fallback: true,
          reason: 'Viator sandbox key not yet activated — check partner portal',
          debug: authErrText.slice(0, 200),
        }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    if (!searchRes.ok) {
      const errText = await searchRes.text();
      console.error('[search-attractions] Viator API error:', searchRes.status, errText);
      console.error('[search-attractions] Request payload was:', JSON.stringify(payload));
      return new Response(
        JSON.stringify({ products: [], fallback: true, reason: `Viator error: ${searchRes.status}`, debug: errText.slice(0, 300) }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const rawBody = await searchRes.text();
    console.log('[search-attractions] Viator raw response (first 800 chars):', rawBody.slice(0, 800));

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(rawBody);
    } catch {
      console.error('[search-attractions] Failed to parse Viator response as JSON');
      return new Response(
        JSON.stringify({ products: [], fallback: true, reason: 'Invalid JSON from Viator' }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // Viator v2 response shape: { products: [...] } or { data: { products: [...] } }
    const products: ViatorProduct[] = (data.products as ViatorProduct[]) ?? (data as any)?.data?.products ?? [];
    const mapped = products.slice(0, 3).map(mapProduct);

    return new Response(
      JSON.stringify({ products: mapped, fallback: false }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('search-attractions error:', err);
    return new Response(
      JSON.stringify({ products: [], fallback: true, reason: String(err) }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});
