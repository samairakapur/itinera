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
}

function buildAffiliateUrl(productCode: string, webUrl?: string): string {
  if (webUrl) {
    // Append affiliate tracking parameter
    const sep = webUrl.includes('?') ? '&' : '?';
    return `${webUrl}${sep}mcid=${VIATOR_PARTNER_ID}`;
  }
  return `${VIATOR_AFFILIATE_BASE}/tours/${productCode}?mcid=${VIATOR_PARTNER_ID}`;
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
    imageUrl: p.images?.[0]?.variants?.find(v => v.url?.includes('w300'))?.url
      ?? p.images?.[0]?.variants?.[0]?.url,
    bookingUrl: buildAffiliateUrl(p.productCode, p.webURL),
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

    if (groupSize && groupSize > 1) {
      payload.pricingAgeGroup = [{ ageBand: 'ADULT', numberOfTravelers: groupSize }];
    }

    // Use v1 text search endpoint
    const searchRes = await fetch(`${VIATOR_API_BASE}/products/search`, {
      method: 'POST',
      headers: {
        'exp-api-key': apiKey,
        'Accept-Language': 'en-US',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // Sandbox key may return 401/403 before activation
    if (searchRes.status === 401 || searchRes.status === 403) {
      return new Response(
        JSON.stringify({
          products: [],
          fallback: true,
          reason: 'Viator sandbox key not yet activated — check partner portal',
        }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    if (!searchRes.ok) {
      const errText = await searchRes.text();
      console.error('Viator API error:', searchRes.status, errText);
      return new Response(
        JSON.stringify({ products: [], fallback: true, reason: `Viator error: ${searchRes.status}` }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const data = await searchRes.json();
    const products: ViatorProduct[] = data.products ?? data.data?.products ?? [];
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
