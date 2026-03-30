// restaurant-details — fetch Foursquare place details for a named restaurant
//
// POST /functions/v1/restaurant-details
// Body: { name: string, city?: string }
// Returns: { tel?, website?, hours?: { display?, is_open_now? }, categories?, location? }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { name, city } = await req.json() as { name?: string; city?: string };

    if (!name) return json({ error: 'name is required' }, 400);

    const FSQ_KEY = Deno.env.get('FOURSQUARE_API_KEY');
    if (!FSQ_KEY) return json({ place: null, reason: 'FOURSQUARE_API_KEY not configured' });

    const near = city ? `&near=${encodeURIComponent(city)}` : '';
    const url =
      `https://api.foursquare.com/v3/places/search` +
      `?query=${encodeURIComponent(name)}${near}&categories=13065&limit=1` +
      `&fields=name,tel,website,hours,location,categories`;

    const res = await fetch(url, {
      headers: { Authorization: FSQ_KEY, Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.error('[restaurant-details] Foursquare error:', res.status, await res.text().catch(() => ''));
      return json({ place: null, reason: `Foursquare returned ${res.status}` });
    }

    const data = await res.json();
    const place = data?.results?.[0] ?? null;

    if (!place) return json({ place: null });

    return json({
      place: {
        tel: place.tel ?? null,
        website: place.website ?? null,
        hours: place.hours
          ? { display: place.hours.display ?? null, is_open_now: place.hours.is_open_now ?? null }
          : null,
        categories: (place.categories ?? []).map((c: { name: string }) => c.name),
        address: place.location?.address ?? null,
      },
    });
  } catch (err) {
    console.error('[restaurant-details] error:', err);
    return json({ place: null, reason: err instanceof Error ? err.message : 'Unknown error' });
  }
});
