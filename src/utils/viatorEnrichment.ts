import { supabase } from '@/integrations/supabase/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ViatorProductSummary {
  productCode: string;
  title: string;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  durationMinutes?: number;
  fromPrice?: number;
  currency?: string;
  bookingUrl: string;
}

interface TourSelectionPreferences {
  /** 'budget' | 'mid-range' | 'luxury' — maps from CreateItineraryInput.budgetLevel */
  budgetLevel?: string;
  /** Available time window in minutes for this activity slot */
  availableTimeMinutes?: number;
}

// ---------------------------------------------------------------------------
// selectBestTour
// ---------------------------------------------------------------------------

/**
 * Picks the single best Viator tour from a list of search results.
 *
 * Algorithm:
 *  1. Filter by budget (loose — only removes extreme mismatches)
 *  2. Filter by duration (skip products that far exceed available time)
 *  3. Sort by: rating desc → review count desc → price asc
 */
export function selectBestTour(
  products: ViatorProductSummary[],
  prefs: TourSelectionPreferences = {},
): ViatorProductSummary | null {
  if (!products.length) return null;

  let candidates = [...products];

  // Budget filter (loose — keep at least one result)
  if (prefs.budgetLevel === 'budget') {
    const cheap = candidates.filter(p => !p.fromPrice || p.fromPrice < 60);
    if (cheap.length) candidates = cheap;
  } else if (prefs.budgetLevel === 'luxury') {
    const premium = candidates.filter(p => p.fromPrice == null || p.fromPrice >= 40);
    if (premium.length) candidates = premium;
  }

  // Duration filter: skip tours that take more than 1.5× the available time window
  if (prefs.availableTimeMinutes && prefs.availableTimeMinutes < 300) {
    const fits = candidates.filter(
      p => !p.durationMinutes || p.durationMinutes <= prefs.availableTimeMinutes! * 1.5,
    );
    if (fits.length) candidates = fits;
  }

  // Sort: best rating first; ties broken by review volume, then cheapest
  candidates.sort((a, b) => {
    const rDiff = (b.rating ?? 0) - (a.rating ?? 0);
    if (Math.abs(rDiff) > 0.09) return rDiff;
    const revDiff = (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
    if (revDiff !== 0) return revDiff;
    return (a.fromPrice ?? 999) - (b.fromPrice ?? 999);
  });

  return candidates[0] ?? null;
}

// ---------------------------------------------------------------------------
// enrichActivitiesWithViator
// ---------------------------------------------------------------------------

/**
 * After itinerary_items are inserted to the DB, asynchronously looks up a
 * Viator tour for each attraction-type item and writes the best match back.
 *
 * This runs fire-and-forget — callers should not await it unless testing.
 * All errors are swallowed so they never surface to the user.
 */
export async function enrichActivitiesWithViator(params: {
  /** Items as returned by the DB insert (.select('id, item_type, custom_title')) */
  items: Array<{ id: string; item_type: string; custom_title: string | null }>;
  /** Primary city name, used as the Viator search destination */
  cityName: string;
  budgetLevel?: string;
  groupSize?: number;
  /** Supabase access token for calling the Edge Function */
  accessToken: string;
}): Promise<void> {
  const { items, cityName, budgetLevel, groupSize, accessToken } = params;

  const attractions = items.filter(
    item => item.item_type === 'attraction' && !!item.custom_title,
  );

  if (!attractions.length) return;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const CONCURRENCY = 4; // parallel batches to avoid rate limits

  for (let i = 0; i < attractions.length; i += CONCURRENCY) {
    const batch = attractions.slice(i, i + CONCURRENCY);

    await Promise.allSettled(
      batch.map(async item => {
        try {
          const res = await fetch(`${supabaseUrl}/functions/v1/search-attractions`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              destination: cityName,
              query: item.custom_title,
              groupSize: groupSize ?? 2,
            }),
          });

          if (!res.ok) return;

          const json = await res.json();
          const products: ViatorProductSummary[] = Array.isArray(json.products)
            ? json.products
            : [];

          // If the API returned fallback/empty results, skip this item
          if (!products.length || json.fallback) return;

          const best = selectBestTour(products, { budgetLevel });
          if (!best) return;

          // Persist the selected tour details back to the DB row
          await (supabase
            .from('itinerary_items')
            .update({
              viator_product_code: best.productCode,
              viator_booking_url: best.bookingUrl,
              viator_product_title: best.title,
              viator_price_per_person: best.fromPrice ?? null,
              viator_rating: best.rating ?? null,
              viator_duration_minutes: best.durationMinutes ?? null,
              viator_image_url: best.imageUrl ?? null,
            } as any)
            .eq('id', item.id));
        } catch {
          // Non-fatal — item simply won't have a pre-selected tour
        }
      }),
    );
  }
}
