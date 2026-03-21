import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { NearbyCard, NearbyPlace } from '@/components/nearby/NearbyCard';
import ManualLocationDialog from '@/components/nearby/ManualLocationDialog';
import { Input } from '@/components/ui/input';
import {
  MapPin,
  Navigation,
  RefreshCw,
  Coffee,
  Utensils,
  Landmark,
  AlertCircle,
  Sparkles,
  Settings,
  MapPinOff,
  Send,
  X as XIcon,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Cross-browser AbortSignal with timeout — AbortSignal.timeout() only exists in Chrome 103+/Safari 17+
function makeTimeout(ms: number): AbortSignal {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (AbortSignal as any).timeout === 'function') return (AbortSignal as any).timeout(ms);
  } catch { /* fall through */ }
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), ms);
  return ctrl.signal;
}

// Haversine distance in km
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// ---------------------------------------------------------------------------
// Browser-side Overpass fallback — called when the edge function fails.
// Uses the user's own IP (not Supabase server IPs), so no rate-limiting.
// ---------------------------------------------------------------------------
const fetchOverpassDirect = async (
  lat: number,
  lng: number,
  radiusMeters: number,
): Promise<NearbyPlace[]> => {
  const r = Math.min(radiusMeters, 25000);
  // Include both node AND way/relation — in many countries (esp. Japan) restaurants
  // and buildings are mapped as way polygons, not node pins.  "out center tags" gives
  // us a centroid lat/lon for each way so the rest of the code can treat them uniformly.
  const query = `[out:json][timeout:20];
(
  node["amenity"~"restaurant|cafe|bar|pub|fast_food|museum|theatre"](around:${r},${lat},${lng});
  way["amenity"~"restaurant|cafe|bar|pub|fast_food|museum|theatre"](around:${r},${lat},${lng});
  node["tourism"~"attraction|museum|gallery|viewpoint|zoo|aquarium"](around:${r},${lat},${lng});
  way["tourism"~"attraction|museum|gallery|viewpoint|zoo|aquarium"](around:${r},${lat},${lng});
  node["historic"~"monument|castle|memorial|building"](around:${r},${lat},${lng});
  way["historic"~"monument|castle|memorial|building"](around:${r},${lat},${lng});
  node["leisure"~"park|garden"](around:${r},${lat},${lng});
  way["leisure"~"park|garden"](around:${r},${lat},${lng});
);
out center tags;`;

  const body = `data=${encodeURIComponent(query)}`;
  const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body,
        signal: makeTimeout(20000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const elements: any[] = (data.elements || []).filter((el: any) => el.tags?.name);
      if (elements.length === 0) continue;

      return elements
        .slice(0, 50)
        .map((el: any): NearbyPlace => {
          // node elements have el.lat/el.lon directly;
          // way elements need el.center.lat/el.center.lon (from "out center")
          const pLat = (el.lat ?? el.center?.lat) as number;
          const pLng = (el.lon ?? el.center?.lon) as number;
          const distKm = haversineDistance(lat, lng, pLat, pLng);
          const amenity = el.tags?.amenity || '';
          let type: NearbyPlace['type'] = 'attraction';
          if (['restaurant', 'fast_food'].includes(amenity)) type = 'restaurant';
          if (['cafe', 'bar', 'pub'].includes(amenity)) type = 'cafe';
          // Some OSM nodes already carry a direct image URL or a Wikimedia
          // Commons filename — use them immediately so enrichment isn't needed.
          let osmImageUrl: string | null = null;
          if (el.tags?.image) {
            osmImageUrl = el.tags.image;
          } else if (el.tags?.wikimedia_commons) {
            // "File:Foo.jpg"  →  Wikimedia thumbnail URL
            const wmc = (el.tags.wikimedia_commons as string).replace(/^(File|Category):/, '');
            osmImageUrl =
              `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(wmc)}?width=400`;
          }

          // OSM cuisine tag e.g. "indian", "japanese", "pizza;italian"
          const rawCuisine = el.tags?.cuisine as string | undefined;
          const cuisine = rawCuisine
            ? rawCuisine.split(/[;,]/).map((c: string) => c.trim()).join(', ')
            : undefined;

          // Build a rich description that the AI can match against food queries
          const descParts: string[] = [];
          if (cuisine) descParts.push(`Serves ${cuisine} cuisine`);
          if (el.tags?.description) descParts.push(el.tags.description as string);
          else if (el.tags?.tourism) descParts.push(el.tags.tourism as string);
          else if (amenity && amenity !== 'restaurant' && amenity !== 'cafe') descParts.push(amenity);
          const description = descParts.join('. ') || 'Local point of interest';

          return {
            id: `osm-${el.id}`,
            name: el.tags.name,
            type,
            description,
            cuisine,
            latitude: pLat,
            longitude: pLng,
            rating: null,
            priceLevel: null,
            openNow: null,
            address: [el.tags?.['addr:street'], el.tags?.['addr:city']].filter(Boolean).join(', '),
            imageUrl: osmImageUrl,
            distanceKm: distKm,
            distance: distKm < 1 ? `${Math.round(distKm * 1000)}m` : `${distKm.toFixed(1)} km`,
            typicalTimeSpent:
              type === 'cafe' ? '30 – 60 min' : type === 'restaurant' ? '45 min – 1.5 hrs' : '1 – 2 hrs',
            matchReason: cuisine ? `${cuisine.charAt(0).toUpperCase() + cuisine.slice(1)} cuisine nearby` : 'Nearby local point of interest',
          };
        })
        .sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99));
    } catch {
      // try next endpoint
    }
  }
  return [];
};

// ---------------------------------------------------------------------------
// Transport mode recommendation — based on road distance
// ---------------------------------------------------------------------------
function getTransportMode(roadKm: number): NonNullable<NearbyPlace['transportMode']> {
  if (roadKm <= 0.5)
    return { mode: 'walk',    emoji: '🚶', label: 'Walk',         estimatedMins: Math.max(1, Math.round(roadKm * 60 / 4.5)) };
  if (roadKm <= 2.5)
    return { mode: 'cycle',   emoji: '🚴', label: 'Walk / Cycle', estimatedMins: Math.round(roadKm * 60 / 5) };
  if (roadKm <= 12)
    return { mode: 'transit', emoji: '🚌', label: 'Bus / MRT',    estimatedMins: Math.round(10 + roadKm * 60 / 25) };
  return   { mode: 'car',     emoji: '🚗', label: 'Grab / Taxi',  estimatedMins: Math.round(10 + roadKm * 60 / 35) };
}

// ---------------------------------------------------------------------------
// OSRM Table API — actual road distances for all places in one request.
// Free, no API key needed, global coverage. Returns same array updated in-place.
// ---------------------------------------------------------------------------
async function enrichWithRoadDistances(
  userLat: number,
  userLng: number,
  places: NearbyPlace[],
): Promise<NearbyPlace[]> {
  if (places.length === 0) return places;

  // OSRM uses lng,lat order (not lat,lng)
  const coords = [
    `${userLng.toFixed(6)},${userLat.toFixed(6)}`,
    ...places.map(p => `${(p.longitude ?? 0).toFixed(6)},${(p.latitude ?? 0).toFixed(6)}`),
  ].join(';');

  const res = await fetch(
    `https://router.project-osrm.org/table/v1/driving/${coords}?sources=0&annotations=distance`,
    { signal: makeTimeout(8000) },
  );
  if (!res.ok) throw new Error(`OSRM ${res.status}`);
  const data = await res.json();
  if (data.code !== 'Ok' || !data.distances?.[0]) throw new Error('OSRM bad response');

  const dists: number[] = data.distances[0];
  // dists[0] = user→user = 0; dists[i+1] = user→places[i]

  return places.map((p, i) => {
    const roadMeters = dists[i + 1];
    if (roadMeters == null) return p;
    const roadKm = roadMeters / 1000;
    return {
      ...p,
      distanceKm: roadKm,
      distance: roadKm < 1 ? `${Math.round(roadMeters)}m` : `${roadKm.toFixed(1)} km`,
      transportMode: getTransportMode(roadKm),
    };
  });
}

// ---------------------------------------------------------------------------
// Image enrichment — priority order:
//   1. Google Places Photos API  (best quality; set VITE_GOOGLE_PLACES_API_KEY)
//   2. Yelp Fusion API            (actual venue photos; set VITE_YELP_API_KEY)
//   3. Wikimedia Commons geosearch by GPS coords  (free, no key, landmarks only)
//   4. Wikipedia article thumbnail by name         (free, famous places)
//   5. Category-aware loremflickr fallback         (real Flickr photos by type)
//
// NOTE: steps 3+4 use Wikipedia/Commons which only covers famous/notable
// places — most restaurants and cafes will fall through to step 5.
// For actual venue photos of small businesses, add either:
//   • VITE_GOOGLE_PLACES_API_KEY  (Google Maps Platform — ~28k free/month)
//   • VITE_YELP_API_KEY           (Yelp Fusion — 500 free/day, no card needed)
// ---------------------------------------------------------------------------
async function enrichWithImages(places: NearbyPlace[]): Promise<NearbyPlace[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (import.meta as any).env ?? {};
  const googleKey: string  = env.VITE_GOOGLE_PLACES_API_KEY ?? '';
  const yelpKey: string    = env.VITE_YELP_API_KEY ?? '';

  const results = await Promise.allSettled(
    places.map(async (p): Promise<NearbyPlace> => {
      if (p.imageUrl) return p; // OSM already provided a direct image URL

      // ── 1. Google Places Photos API ────────────────────────────────────
      // Most accurate venue photos — same source as Google Maps.
      // Get a free key at console.cloud.google.com (Places API, ~$200/mo credit).
      if (googleKey && p.latitude && p.longitude) {
        try {
          // Step A: find the Place ID by name + coordinates
          const findRes = await fetch(
            `https://maps.googleapis.com/maps/api/place/findplacefromtext/json` +
            `?input=${encodeURIComponent(p.name)}` +
            `&inputtype=textquery` +
            `&fields=photos,place_id` +
            `&locationbias=circle:300@${p.latitude},${p.longitude}` +
            `&key=${googleKey}`,
            { signal: makeTimeout(6000) },
          );
          if (findRes.ok) {
            const findData = await findRes.json();
            const photoRef = findData.candidates?.[0]?.photos?.[0]?.photo_reference;
            if (photoRef) {
              // Step B: resolve the photo reference to an image URL
              return {
                ...p,
                imageUrl:
                  `https://maps.googleapis.com/maps/api/place/photo` +
                  `?maxwidth=400&photo_reference=${photoRef}&key=${googleKey}`,
              };
            }
          }
        } catch { /* fall through */ }
      }

      // ── 2. Yelp Fusion API ──────────────────────────────────────────────
      // Actual venue cover photos. Free tier: 500 req/day, no credit card.
      // Get a free key at https://docs.developer.yelp.com/docs/fusion-intro
      if (yelpKey && p.latitude && p.longitude) {
        try {
          const yelpRes = await fetch(
            `https://api.yelp.com/v3/businesses/search` +
            `?term=${encodeURIComponent(p.name)}` +
            `&latitude=${p.latitude}&longitude=${p.longitude}` +
            `&radius=200&limit=1`,
            {
              headers: { Authorization: `Bearer ${yelpKey}` },
              signal: makeTimeout(5000),
            },
          );
          if (yelpRes.ok) {
            const yelpData = await yelpRes.json();
            const imgUrl = yelpData.businesses?.[0]?.image_url;
            if (imgUrl) return { ...p, imageUrl: imgUrl };
          }
        } catch { /* fall through */ }
      }

      // ── 3. Wikimedia Commons geosearch by coordinates ───────────────────
      // Only reliably finds photos for well-known landmarks, parks, monuments.
      // Does NOT find photos for restaurants, cafes, or small businesses.
      if (p.latitude && p.longitude) {
        try {
          const geoRes = await fetch(
            `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
            `&generator=geosearch&ggscoord=${p.latitude}|${p.longitude}` +
            `&ggsradius=500&ggslimit=10&prop=imageinfo&iiprop=url&iiurlwidth=400&origin=*`,
            { signal: makeTimeout(5000) },
          );
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            const pages = Object.values(geoData.query?.pages ?? {}) as any[];
            const hit = pages.find(pg => pg.imageinfo?.[0]?.thumburl);
            if (hit) return { ...p, imageUrl: hit.imageinfo[0].thumburl };
          }
        } catch { /* fall through */ }
      }

      // ── 4. Wikipedia article thumbnail by exact name ────────────────────
      // Works for museums, national parks, iconic buildings — not restaurants.
      if (p.type === 'attraction') {
        try {
          const wikiRes = await fetch(
            `https://en.wikipedia.org/w/api.php?action=query&format=json` +
            `&prop=pageimages&piprop=thumbnail&pithumbsize=400` +
            `&titles=${encodeURIComponent(p.name)}&origin=*`,
            { signal: makeTimeout(5000) },
          );
          if (wikiRes.ok) {
            const wikiData = await wikiRes.json();
            const pages = wikiData.query?.pages ?? {};
            const page = Object.values(pages)[0] as any;
            // pageid === -1 means "no article found" — skip
            if (page?.thumbnail?.source && Number(page.pageid) !== -1) {
              return { ...p, imageUrl: page.thumbnail.source };
            }
          }
        } catch { /* fall through */ }
      }

      // ── 5. loremflickr — category-aware fallback ────────────────────────
      // Pulls real Creative Commons Flickr photos matched to the venue type.
      // Much more relevant than random stock — a restaurant gets a real
      // restaurant photo, a museum gets a real museum photo, etc.
      // The ?lock= seed keeps the same image for the same venue on re-renders.
      const typeKeywords: Record<NearbyPlace['type'], string> = {
        restaurant: 'restaurant,food,dining',
        cafe:       'cafe,coffee,interior',
        attraction: 'landmark,architecture,travel',
      };
      const kw = typeKeywords[p.type] ?? 'travel';
      const seed = [...p.name].reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) >>> 0, 0) % 1000 + 1;
      return { ...p, imageUrl: `https://loremflickr.com/400/300/${kw}?lock=${seed}` };
    }),
  );
  return results.map((r, i) => (r.status === 'fulfilled' ? r.value : places[i]));
}

// ---------------------------------------------------------------------------
// Enrich a raw places array (road distances + images) then set React state.
// Shows places immediately with haversine distances, then silently upgrades.
// ---------------------------------------------------------------------------
async function runEnrichment(
  rawPlaces: NearbyPlace[],
  userLat: number,
  userLng: number,
  setter: (p: NearbyPlace[]) => void,
): Promise<void> {
  const [withDist, withImg] = await Promise.all([
    enrichWithRoadDistances(userLat, userLng, rawPlaces).catch(() => rawPlaces),
    enrichWithImages(rawPlaces).catch(() => rawPlaces),
  ]);
  // Merge: road distances + transport from withDist; images from withImg
  setter(rawPlaces.map((_, i) => ({ ...withDist[i], imageUrl: withImg[i].imageUrl })));
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const Nearby = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const {
    latitude,
    longitude,
    error: geoError,
    loading: geoLoading,
    requestLocation,
    setManualLocation,
    isPermissionDenied,
    errorCode
  } = useGeolocation();

  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);   // prevents infinite-retry on failure
  const [activeTab, setActiveTab] = useState('all');
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [locationName, setLocationName] = useState<string | null>(null);
  // radiusKm = the committed value that drives fetches (changes only on slider release).
  // displayRadiusKm = what the label shows while the user is dragging (instant feedback).
  const [radiusKm, setRadiusKm] = useState(10);
  const [displayRadiusKm, setDisplayRadiusKm] = useState(10);
  // Track the location + radius we last fetched so we can re-fetch only on real changes
  const lastFetchKey = useRef<string | null>(null);
  // Cancels stale runEnrichment calls when a new fetch starts
  const enrichmentIdRef = useRef(0);

  // AI assistant state
  const [aiInputValue, setAiInputValue] = useState('');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const preferences = profile?.travel_preferences;

  // ---------------------------------------------------------------------------
  // AI assistant — answers natural-language queries about the visible venues
  // ---------------------------------------------------------------------------
  const callNearbyAI = useCallback(async (query: string) => {
    if (!query.trim() || aiLoading) return;

    setAiQuestion(query);
    setAiResponse('');
    setAiLoading(true);
    setAiInputValue('');

    // Build a compact venue list for the prompt (cap at 40 to keep tokens manageable)
    // Include cuisine tag explicitly so the AI can match food-specific queries (e.g. "I want lamb" → Indian restaurant)
    const venueList = places.slice(0, 40).map(p => {
      const cuisineNote = p.cuisine ? ` [cuisine: ${p.cuisine}]` : '';
      const ratingNote = p.rating ? `, rated ${p.rating}/5` : '';
      return `- ${p.name} (${p.type}${cuisineNote}, ${p.distance}${ratingNote}): ${p.description || p.matchReason || ''}`;
    }).join('\n');

    const prefsContext = preferences ? [
      preferences.interests?.length ? `Interests: ${preferences.interests.join(', ')}` : '',
      (preferences as any).preferredCuisines?.length ? `Preferred cuisines: ${(preferences as any).preferredCuisines.join(', ')}` : '',
      (preferences as any).dailyBudget ? `Budget: ${(preferences as any).dailyBudget}` : '',
    ].filter(Boolean).join('. ') : '';

    const userMessage = [
      `I'm currently near ${locationName || 'my current location'} exploring nearby places.`,
      '',
      'Nearby venues available:',
      venueList || '(No venues loaded yet)',
      '',
      prefsContext ? `My profile preferences: ${prefsContext}.` : '',
      '',
      `My question: ${query}`,
      '',
      'Please recommend specific venues from the list above that best match what I\'m looking for. Be concise and mention the venue name, why it fits, and distance. If nothing on the list matches well, say so honestly.',
    ].filter(s => s !== undefined).join('\n');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userMessage }],
        }),
      });

      if (!resp.ok || !resp.body) {
        const msg = resp.status === 429
          ? 'AI is a little busy — try again in a moment.'
          : resp.status === 402
            ? 'AI credits exhausted. Please try again later.'
            : 'Could not connect to AI assistant.';
        throw new Error(msg);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              accumulated += content;
              setAiResponse(accumulated);
            }
          } catch { /* incomplete SSE chunk — will retry on next line */ }
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      setAiResponse(`Sorry, I couldn't process your request. ${msg}`);
    }

    setAiLoading(false);
  }, [places, locationName, preferences, aiLoading]);

  // fetchNearbyPlaces does NOT depend on activeTab — we always fetch ALL categories
  // and filter client-side, so switching tabs never triggers a new API call.
  // preferences is passed explicitly to avoid stale closure.
  const fetchNearbyPlaces = useCallback(async (
    lat: number,
    lng: number,
    radius: number,
    prefs?: typeof preferences,
  ) => {
    setLoading(true);
    setHasError(false);
    setPlaces([]);

    // Stamp this fetch — enrichment callbacks ignore stale results.
    // Declared at the top of the function body so it's always in scope.
    const eid = ++enrichmentIdRef.current;

    // ── Phase 1: Fetch raw places ──────────────────────────────────────────
    // Try browser-direct Overpass FIRST — it uses the user's IP (not Supabase
    // servers) so it is never rate-limited. The edge function is used only as
    // a secondary in case Overpass returns nothing (e.g. Foursquare key set).

    let rawPlaces: NearbyPlace[] = [];

    try {
      // Query 30% wider than the radius so we catch places where haversine is
      // just under the cutoff but the actual road route stays within radius.
      rawPlaces = await fetchOverpassDirect(lat, lng, radius * 1300);
      console.log(`Overpass returned ${rawPlaces.length} places`);
    } catch (overpassErr) {
      console.warn('Overpass direct failed:', overpassErr);
    }

    // If Overpass got nothing, try the edge function as a secondary source.
    // Wrapped in its own race so a slow edge function can't block forever.
    if (rawPlaces.length === 0) {
      try {
        const edgeFnPromise = supabase.functions.invoke('nearby-places', {
          body: {
            lat, lng,
            radiusMeters: radius * 1000,
            category: 'all',
            interests: prefs?.interests ?? [],
            cuisines:  prefs?.preferredCuisines ?? [],
            budget:    prefs?.dailyBudget,
          },
        });
        // Race the edge function against a 6-second timeout
        const timeoutPromise = new Promise<{ data: null; error: Error }>(resolve =>
          setTimeout(() => resolve({ data: null, error: new Error('edge fn timeout') }), 6000),
        );
        const { data } = await Promise.race([edgeFnPromise, timeoutPromise]);

        if (Array.isArray(data?.places) && data.places.length > 0) {
          rawPlaces = (data.places as any[]).map(p => {
            const d = haversineDistance(lat, lng, p.latitude ?? 0, p.longitude ?? 0);
            return {
              ...p,
              distanceKm: d,
              distance: d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)} km`,
            } as NearbyPlace;
          });
          console.log(`Edge function returned ${rawPlaces.length} places`);
        }
      } catch (edgeErr) {
        console.warn('Edge function also failed:', edgeErr);
      }
    }

    // ── Phase 2: Filter + display ──────────────────────────────────────────
    const inRadius = rawPlaces
      .filter(p => (p.distanceKm ?? 99) <= radius)
      .sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99));

    if (inRadius.length === 0) {
      setHasError(rawPlaces.length === 0); // only hard-error if fetch truly failed
      setLoading(false);
      if (rawPlaces.length === 0) {
        toast.error('Could not load nearby recommendations. Try again.');
      } else {
        toast.info('No places found within your radius. Try increasing the distance.');
      }
      return;
    }

    // Show places immediately — spinner stops here
    setPlaces(inRadius);
    setLoading(false);

    // ── Phase 3: Silent background enrichment ──────────────────────────────
    // OSRM road distances + images run in parallel.
    // After OSRM we RE-FILTER by road distance so that places which are within
    // the haversine radius but outside the road-distance radius are removed.
    try {
      const [withDist, withImg] = await Promise.all([
        enrichWithRoadDistances(lat, lng, inRadius).catch(() => inRadius),
        enrichWithImages(inRadius).catch(() => inRadius),
      ]);
      if (enrichmentIdRef.current === eid) {
        const enriched = inRadius
          .map((orig, i) => ({
            ...withDist[i],
            imageUrl: withImg[i]?.imageUrl ?? orig.imageUrl,
          }))
          // Re-filter: road distances are always ≥ haversine, so some places
          // that appeared within the radius may actually exceed it by road.
          .filter(p => (p.distanceKm ?? 99) <= radius)
          .sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99));
        setPlaces(enriched);
      }
    } catch { /* enrichment failure is non-fatal; places already shown */ }
  }, []); // stable — params passed explicitly; refs never change

  // Trigger a fetch only when location or radius meaningfully changes
  useEffect(() => {
    if (!latitude || !longitude) return;
    const key = `${latitude.toFixed(4)},${longitude.toFixed(4)},${radiusKm}`;
    if (lastFetchKey.current === key) return; // already fetched for this combination
    lastFetchKey.current = key;
    setPlaces([]);
    setHasError(false);
    fetchNearbyPlaces(latitude, longitude, radiusKm, preferences);
  }, [latitude, longitude, radiusKm, fetchNearbyPlaces, preferences]);

  const handleManualLocationSet = (lat: number, lng: number, name?: string) => {
    setManualLocation(lat, lng);
    setLocationName(name || null);
    setPlaces([]);
    setHasError(false);
    lastFetchKey.current = null; // force re-fetch for new location
    toast.success(`Location set to ${name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`}`);
  };

  const handleRefresh = () => {
    if (isPermissionDenied && !locationName) {
      setManualDialogOpen(true);
    } else if (latitude && longitude) {
      lastFetchKey.current = null; // force re-fetch
      setPlaces([]);
      setHasError(false);
      fetchNearbyPlaces(latitude, longitude, radiusKm, preferences);
    }
  };

  // Client-side tab filtering — no re-fetch needed when switching tabs
  const filteredPlaces = useMemo(() => {
    if (activeTab === 'all') return places;
    // map tab values to place type strings
    const typeMap: Record<string, string[]> = {
      attraction: ['attraction', 'landmark', 'museum'],
      cafe:       ['cafe', 'coffee'],
      restaurant: ['restaurant', 'food'],
    };
    const types = typeMap[activeTab] ?? [activeTab];
    return places.filter(p => types.some(t => p.type?.toLowerCase().includes(t)));
  }, [places, activeTab]);

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen py-8">
        <div className="container px-4">
          <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>Sign in to Explore Nearby</CardTitle>
              <CardDescription>
                Get personalized recommendations based on your location and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => navigate('/auth')}>
                Sign In to Continue
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Loading state
  if (geoLoading && !latitude && !longitude && !geoError) {
    return (
      <div className="min-h-screen py-8">
        <div className="container px-4">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 mb-6 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <Navigation className="w-10 h-10 text-primary" />
            </div>
            <h2 className="font-display text-xl font-semibold mb-2">Detecting Your Location</h2>
            <p className="text-muted-foreground text-center max-w-sm mb-6">
              Please allow location access to discover personalized recommendations near you.
            </p>
            <Button variant="outline" onClick={() => setManualDialogOpen(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Set Location Manually
            </Button>
          </div>
        </div>
        <ManualLocationDialog 
          open={manualDialogOpen} 
          onOpenChange={setManualDialogOpen}
          onLocationSet={handleManualLocationSet}
        />
      </div>
    );
  }

  // Location denied or error
  if (geoError && !latitude && !longitude) {
    return (
      <div className="min-h-screen py-8">
        <div className="container px-4">
          <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center">
                {isPermissionDenied ? (
                  <MapPinOff className="w-8 h-8 text-amber-500" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-amber-500" />
                )}
              </div>
              <CardTitle>
                {isPermissionDenied ? 'Location Access Disabled' : 'Location Unavailable'}
              </CardTitle>
              <CardDescription className="mt-2">
                {isPermissionDenied 
                  ? 'Location permission was denied. You can still explore nearby recommendations by setting your location manually.'
                  : geoError
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" onClick={() => setManualDialogOpen(true)}>
                <MapPin className="w-4 h-4 mr-2" />
                Set Location Manually
              </Button>
              {!isPermissionDenied && (
                <Button className="w-full" variant="outline" onClick={requestLocation}>
                  <Navigation className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              )}
              {isPermissionDenied && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    To enable automatic location, update your browser settings and refresh the page.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <ManualLocationDialog 
          open={manualDialogOpen} 
          onOpenChange={setManualDialogOpen}
          onLocationSet={handleManualLocationSet}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">Nearby</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">
                {locationName || `${latitude?.toFixed(4)}, ${longitude?.toFixed(4)}`}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs"
                onClick={() => setManualDialogOpen(true)}
              >
                Change
              </Button>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Radius Slider */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Search radius</Label>
              <span className="text-sm text-muted-foreground font-medium">{displayRadiusKm} km</span>
            </div>
            <Slider
              value={[displayRadiusKm]}
              onValueChange={([v]) => setDisplayRadiusKm(v)}
              onValueCommit={([v]) => { setDisplayRadiusKm(v); setRadiusKm(v); }}
              min={1}
              max={25}
              step={1}
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* AI Search */}
        <Card className="mb-4 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Ask about nearby places</span>
            </div>
            <form
              onSubmit={e => { e.preventDefault(); callNearbyAI(aiInputValue); }}
              className="flex gap-2"
            >
              <Input
                value={aiInputValue}
                onChange={e => setAiInputValue(e.target.value)}
                placeholder={places.length > 0 ? 'e.g. "I want lamb", "cozy café", "family lunch"…' : 'Load places first, then ask anything…'}
                disabled={aiLoading || places.length === 0}
                className="flex-1 text-sm bg-background"
              />
              <Button
                type="submit"
                size="icon"
                disabled={aiLoading || !aiInputValue.trim() || places.length === 0}
                className="shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>

            {/* Profile preference chips */}
            {preferences && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {(preferences as any).interests?.slice(0, 3).map((interest: string) => (
                  <Badge key={interest} variant="secondary" className="text-xs">
                    {interest}
                  </Badge>
                ))}
                {(preferences as any).preferredCuisines?.slice(0, 2).map((cuisine: string) => (
                  <Badge key={cuisine} variant="outline" className="text-xs">
                    {cuisine}
                  </Badge>
                ))}
                {(preferences as any).dailyBudget && (
                  <Badge variant="outline" className="text-xs">
                    {(preferences as any).dailyBudget} budget
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Response Card */}
        {(aiQuestion || aiLoading) && (
          <Card className="mb-6 border-primary/30 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-primary">"{aiQuestion}"</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={() => { setAiQuestion(''); setAiResponse(''); }}
                >
                  <XIcon className="w-3.5 h-3.5" />
                </Button>
              </div>
              {aiLoading && !aiResponse ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
                  </div>
                  Searching nearby places…
                </div>
              ) : (
                <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {aiResponse}
                  {aiLoading && <span className="inline-block w-1 h-4 bg-primary ml-0.5 animate-pulse align-text-bottom" />}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="all" className="gap-2">
              All
              {places.length > 0 && (
                <span className="text-xs bg-primary/10 px-2 py-0.5 rounded-full">{places.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="attraction" className="gap-2">
              <Landmark className="w-4 h-4" />
              <span className="hidden sm:inline">Attractions</span>
            </TabsTrigger>
            <TabsTrigger value="cafe" className="gap-2">
              <Coffee className="w-4 h-4" />
              <span className="hidden sm:inline">Cafés</span>
            </TabsTrigger>
            <TabsTrigger value="restaurant" className="gap-2">
              <Utensils className="w-4 h-4" />
              <span className="hidden sm:inline">Restaurants</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-video" />
                    <CardContent className="p-4">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-3" />
                      <Skeleton className="h-16 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredPlaces.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPlaces.map((place) => (
                  <NearbyCard key={place.id} place={place} />
                ))}
              </div>
            ) : hasError ? (
              <Card className="border-destructive/20">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-destructive" />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2">Couldn't load places</h3>
                  <p className="text-muted-foreground mb-4">
                    The location service timed out. This sometimes happens — tap retry and it usually works!
                  </p>
                  <Button onClick={handleRefresh} disabled={loading} className="gap-2">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2">No recommendations yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Tap refresh to discover places near your current location.
                  </p>
                  <Button variant="outline" onClick={handleRefresh} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Load Recommendations
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <ManualLocationDialog 
        open={manualDialogOpen} 
        onOpenChange={setManualDialogOpen}
        onLocationSet={handleManualLocationSet}
      />
    </div>
  );
};

export default Nearby;
