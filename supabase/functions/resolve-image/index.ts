// resolve-image — cascading image resolver for attractions and restaurants
//
// POST /functions/v1/resolve-image
// Body: { name: string, city: string, category?: string }
// Returns: { url: string, source: string }
//
// Source priority:
//   1. Wikimedia Commons (best for famous landmarks — no key needed)
//   2. Foursquare photos (best for restaurants — already have key)
//   3. Unsplash (high quality — already have key)
//   4. Pexels (large library — key now in secrets)
//   5. Pixabay (fallback — key now in secrets)
//   6. City-level Unsplash (correct city at minimum)
//   7. Picsum stable hash (final fallback — no API needed)

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

function picsumUrl(seed: string): string {
  const hash = [...seed].reduce((a, c) => ((a * 31 + c.charCodeAt(0)) >>> 0), 0);
  return `https://picsum.photos/seed/${(hash % 1000) + 1}/800/600`;
}

// Curated city images (guaranteed correct city)
const CITY_IMAGES: Record<string, string> = {
  'Amsterdam':     'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&h=600&fit=crop',
  'Bali':          'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=600&fit=crop',
  'Bangkok':       'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=800&h=600&fit=crop',
  'Barcelona':     'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&h=600&fit=crop',
  'Berlin':        'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&h=600&fit=crop',
  'Budapest':      'https://images.unsplash.com/photo-1551867633-194f125bddfa?w=800&h=600&fit=crop',
  'Cape Town':     'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&h=600&fit=crop',
  'Dubai':         'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=600&fit=crop',
  'Dublin':        'https://images.unsplash.com/photo-1549918864-48ac978761a4?w=800&h=600&fit=crop',
  'Edinburgh':     'https://images.unsplash.com/photo-1581366688600-ee2ef76cc9a8?w=800&h=600&fit=crop',
  'Hong Kong':     'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&h=600&fit=crop',
  'Istanbul':      'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&h=600&fit=crop',
  'Kyoto':         'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=600&fit=crop',
  'Lisbon':        'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800&h=600&fit=crop',
  'London':        'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=600&fit=crop',
  'Los Angeles':   'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&h=600&fit=crop',
  'Madrid':        'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800&h=600&fit=crop',
  'Marrakech':     'https://images.unsplash.com/photo-1597211684565-dca64d72bdfe?w=800&h=600&fit=crop',
  'Milan':         'https://images.unsplash.com/photo-1520175480921-4edfa2983e0f?w=800&h=600&fit=crop',
  'New York City': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=600&fit=crop',
  'Paris':         'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=600&fit=crop',
  'Prague':        'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800&h=600&fit=crop',
  'Rome':          'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&h=600&fit=crop',
  'San Francisco': 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=600&fit=crop',
  'Seoul':         'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=800&h=600&fit=crop',
  'Singapore':     'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&h=600&fit=crop',
  'Sydney':        'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&h=600&fit=crop',
  'Tokyo':         'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop',
  'Venice':        'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=800&h=600&fit=crop',
  'Vienna':        'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=800&h=600&fit=crop',
  'Kuala Lumpur':  'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800&h=600&fit=crop',
  'Phuket':        'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800&h=600&fit=crop',
};

// ── Source 1: Wikimedia Commons ─────────────────────────────────────────────
// CRITICAL: Always pass `name + ' ' + city` — using just the name returns wrong/generic images
async function fetchWikimedia(nameWithCity: string): Promise<string | null> {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(nameWithCity)}&prop=pageimages&format=json&pithumbsize=800&origin=*`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data?.query?.pages ?? {};
    for (const page of Object.values(pages) as any[]) {
      // Skip "page not found" results (negative page IDs)
      if ((page as any).missing !== undefined) continue;
      const thumb = (page as any)?.thumbnail?.source;
      if (thumb) return thumb;
    }
  } catch { /* ignore */ }
  return null;
}

// ── Source 2: Unsplash ───────────────────────────────────────────────────────
async function fetchUnsplash(query: string, key: string): Promise<string | null> {
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`;
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${key}` },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const results = data?.results ?? [];
    return results[0]?.urls?.regular ?? null;
  } catch { /* ignore */ }
  return null;
}

// ── Source 3: Pexels ─────────────────────────────────────────────────────────
async function fetchPexels(query: string, key: string): Promise<string | null> {
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`;
    const res = await fetch(url, {
      headers: { Authorization: key },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const photos = data?.photos ?? [];
    return photos[0]?.src?.large ?? null;
  } catch { /* ignore */ }
  return null;
}

// ── Source 4: Pixabay ────────────────────────────────────────────────────────
async function fetchPixabay(query: string, key: string): Promise<string | null> {
  try {
    const url = `https://pixabay.com/api/?key=${key}&q=${encodeURIComponent(query)}&image_type=photo&per_page=3&orientation=horizontal&safesearch=true`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const data = await res.json();
    const hits = data?.hits ?? [];
    return hits[0]?.webformatURL ?? null;
  } catch { /* ignore */ }
  return null;
}

// ── Source 5: Foursquare place photo ─────────────────────────────────────────
async function fetchFoursquarePhoto(name: string, city: string, fsqKey: string): Promise<string | null> {
  try {
    // First find the place
    const searchUrl = `https://api.foursquare.com/v3/places/search?query=${encodeURIComponent(name)}&near=${encodeURIComponent(city)}&limit=1&fields=fsq_id`;
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: fsqKey, Accept: 'application/json' },
      signal: AbortSignal.timeout(4000),
    });
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const fsqId = searchData?.results?.[0]?.fsq_id;
    if (!fsqId) return null;

    // Then get a photo
    const photoUrl = `https://api.foursquare.com/v3/places/${fsqId}/photos?limit=1`;
    const photoRes = await fetch(photoUrl, {
      headers: { Authorization: fsqKey, Accept: 'application/json' },
      signal: AbortSignal.timeout(4000),
    });
    if (!photoRes.ok) return null;
    const photos = await photoRes.json();
    const p = photos?.[0];
    if (!p?.prefix || !p?.suffix) return null;
    return `${p.prefix}800x600${p.suffix}`;
  } catch { /* ignore */ }
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { name, city, category } = await req.json() as {
      name?: string; city?: string; category?: string;
    };

    if (!name || !city) return json({ error: 'name and city are required' }, 400);

    const UNSPLASH_KEY  = Deno.env.get('UNSPLASH_ACCESS_KEY') || '';
    const PEXELS_KEY    = Deno.env.get('PEXELS_API_KEY') || '';
    const PIXABAY_KEY   = Deno.env.get('PIXABAY_API_KEY') || '';
    const FSQ_KEY       = Deno.env.get('FOURSQUARE_API_KEY') || '';
    const isRestaurant  = /restaurant|cafe|bar|dining|food/i.test(category ?? '');

    // Run non-blocking lookups in priority order
    let url: string | null = null;
    let source = 'picsum';

    // 1. Wikimedia with "Attraction Name, City" — city is REQUIRED to avoid wrong results
    if (!isRestaurant) {
      url = await fetchWikimedia(`${name}, ${city}`);
      if (!url) {
        // Try with just name (some landmarks are known globally without city context)
        url = await fetchWikimedia(name);
      }
      if (url) source = 'wikimedia';
    }

    // 2. Foursquare photos (best for restaurants)
    if (!url && FSQ_KEY && isRestaurant) {
      url = await fetchFoursquarePhoto(name, city, FSQ_KEY);
      if (url) source = 'foursquare';
    }

    // 3. Unsplash with specific name + city
    if (!url && UNSPLASH_KEY) {
      url = await fetchUnsplash(`${name} ${city}`, UNSPLASH_KEY);
      if (url) source = 'unsplash';
    }

    // 4. Pexels with specific name + city
    if (!url && PEXELS_KEY) {
      url = await fetchPexels(`${name} ${city}`, PEXELS_KEY);
      if (url) source = 'pexels';
    }

    // 5. Pixabay with specific name + city
    if (!url && PIXABAY_KEY) {
      url = await fetchPixabay(`${name} ${city}`, PIXABAY_KEY);
      if (url) source = 'pixabay';
    }

    // 6. Unsplash with just city + category (at least correct city)
    if (!url && UNSPLASH_KEY) {
      url = await fetchUnsplash(`${city} ${category ?? 'travel'}`, UNSPLASH_KEY);
      if (url) source = 'unsplash-city';
    }

    // 7. Pexels city fallback
    if (!url && PEXELS_KEY) {
      url = await fetchPexels(`${city} travel`, PEXELS_KEY);
      if (url) source = 'pexels-city';
    }

    // 8. Curated city image
    if (!url && CITY_IMAGES[city]) {
      url = CITY_IMAGES[city];
      source = 'city-curated';
    }

    // 9. Stable Picsum hash
    if (!url) {
      url = picsumUrl(`${name}-${city}`);
      source = 'picsum';
    }

    return json({ url, source });
  } catch (err) {
    console.error('[resolve-image]', err);
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
});
