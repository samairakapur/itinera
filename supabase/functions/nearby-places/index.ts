import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NearbyPlace {
  id: string;
  name: string;
  type: "attraction" | "cafe" | "restaurant";
  description: string;
  latitude: number;
  longitude: number;
  rating: number | null;
  priceLevel: number | null;
  openNow: boolean | null;
  address: string;
  imageUrl: string | null;
  distanceKm: number;
  distance: string;
  typicalTimeSpent: string;
  matchReason: string;
  cuisine?: string;
}

interface RequestBody {
  lat: number;
  lng: number;
  radiusMeters?: number;     // default 5000 m
  category?: string;         // "attraction" | "cafe" | "restaurant" | "all"
  // User preference hints for matchReason personalisation
  interests?: string[];
  cuisines?: string[];
  budget?: string;           // "Budget" | "Mid-range" | "Premium"
}

// ---------------------------------------------------------------------------
// Haversine distance (km)
// ---------------------------------------------------------------------------
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)} km`;
}

// ---------------------------------------------------------------------------
// Typical time-spent heuristic by place type
// ---------------------------------------------------------------------------
function typicalTime(type: string, name?: string): string {
  if (type === "cafe") return "30 – 60 min";
  if (type === "restaurant") return "45 min – 1.5 hrs";
  const n = (name || "").toLowerCase();
  if (n.includes("museum") || n.includes("gallery") || n.includes("palace"))
    return "1.5 – 3 hrs";
  if (n.includes("park") || n.includes("garden") || n.includes("forest"))
    return "1 – 2 hrs";
  if (n.includes("cathedral") || n.includes("church") || n.includes("temple"))
    return "30 – 60 min";
  return "1 – 2 hrs";
}

// ---------------------------------------------------------------------------
// Build a personalised matchReason based on user interests / cuisine prefs
// ---------------------------------------------------------------------------
function buildMatchReason(
  place: { name: string; type: string; description?: string; categories?: string[] },
  interests: string[],
  cuisines: string[],
  budget?: string,
): string {
  const n = (place.name || "").toLowerCase();
  const d = (place.description || "").toLowerCase();
  const cats = (place.categories || []).map((c) => c.toLowerCase());

  // Interest matching
  const interestMap: Record<string, string[]> = {
    art: ["gallery", "art", "museum", "exhibition"],
    history: ["museum", "heritage", "historic", "castle", "palace", "monument"],
    food: ["restaurant", "cafe", "bistro", "eatery"],
    coffee: ["cafe", "coffee", "espresso", "roast"],
    outdoors: ["park", "garden", "trail", "nature", "forest", "beach"],
    culture: ["temple", "church", "cathedral", "cultural", "heritage"],
    nightlife: ["bar", "club", "rooftop", "lounge"],
    shopping: ["market", "shop", "boutique", "mall"],
    architecture: ["tower", "bridge", "landmark", "historic"],
  };

  for (const interest of interests) {
    const keywords = interestMap[interest.toLowerCase()] || [interest.toLowerCase()];
    if (keywords.some((kw) => n.includes(kw) || d.includes(kw) || cats.some((c) => c.includes(kw)))) {
      return `Matches your interest in ${interest}`;
    }
  }

  // Cuisine matching for restaurants/cafes
  if (place.type === "restaurant" && cuisines.length > 0) {
    for (const cuisine of cuisines) {
      if (n.includes(cuisine.toLowerCase()) || d.includes(cuisine.toLowerCase())) {
        return `${cuisine} cuisine — matches your preferences`;
      }
    }
  }

  // Budget matching
  if (budget) {
    if (budget === "Budget" && (n.includes("market") || n.includes("street food"))) {
      return "Budget-friendly local favourite";
    }
    if (budget === "Premium" && (n.includes("fine") || n.includes("luxury") || n.includes("boutique"))) {
      return "Premium experience matching your budget";
    }
  }

  // Fallback by type
  if (place.type === "cafe") return "Great spot for a coffee break";
  if (place.type === "restaurant") return "Popular local dining option";
  return "Highly rated local attraction";
}

// ---------------------------------------------------------------------------
// Foursquare Places API v3 — /places/search (proper radius-based search)
// Using /places/search instead of /places/nearby for accurate radius filtering
// ---------------------------------------------------------------------------
async function fetchFoursquarePlaces(
  lat: number,
  lng: number,
  radiusMeters: number,
  categoryIds: string,
  apiKey: string,
  interests: string[],
  cuisines: string[],
  budget?: string,
): Promise<NearbyPlace[]> {
  // IMPORTANT: Build URL manually — URLSearchParams encodes commas as %2C,
  // but Foursquare v3 requires literal commas in both `ll` and `categories`.
  const fields = "fsq_id,name,geocodes,categories,rating,price,hours,location,photos,description,distance";
  const radius = Math.min(radiusMeters, 100000);
  const urlStr =
    `https://api.foursquare.com/v3/places/search` +
    `?ll=${lat},${lng}` +
    `&radius=${radius}` +
    `&categories=${categoryIds}` +
    `&limit=30` +
    `&fields=${fields}` +
    `&sort=DISTANCE`;

  const res = await fetch(urlStr, {
    headers: {
      Authorization: apiKey,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Foursquare API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const results = data.results || [];

  // Foursquare category ID groups for type classification
  const cafeIds = ["13032", "13033", "13034", "13035", "13036"]; // coffee/tea/bakery/juice
  const restaurantIds = ["13065", "13000"];                       // restaurant / food & drink

  return results.map((p: any): NearbyPlace => {
    const pLat = p.geocodes?.main?.latitude ?? 0;
    const pLng = p.geocodes?.main?.longitude ?? 0;
    const distKm = haversine(lat, lng, pLat, pLng);
    const catIds: string[] = (p.categories || []).map((c: any) => String(c.id));
    const catNames: string[] = (p.categories || []).map((c: any) => c.name || "");

    let placeType: NearbyPlace["type"] = "attraction";
    if (catIds.some((id) => restaurantIds.some((rid) => id.startsWith(rid.slice(0, 3))))) {
      placeType = "restaurant";
    }
    if (catIds.some((id) => cafeIds.includes(id))) placeType = "cafe";
    // Re-check: if category name clearly says restaurant, override
    if (
      catNames.some((n) =>
        ["restaurant", "diner", "bistro", "brasserie"].some((r) => n.toLowerCase().includes(r))
      )
    ) {
      placeType = "restaurant";
    }
    if (
      catNames.some((n) =>
        ["coffee", "cafe", "café", "tea", "bakery"].some((r) => n.toLowerCase().includes(r))
      )
    ) {
      placeType = "cafe";
    }

    // Build image URL — Foursquare photos: prefix + size + suffix
    let imageUrl: string | null = null;
    if (p.photos && p.photos.length > 0) {
      const photo = p.photos[0];
      imageUrl = `${photo.prefix}400x300${photo.suffix}`;
    }

    const matchReason = buildMatchReason(
      { name: p.name, type: placeType, description: p.description, categories: catNames },
      interests,
      cuisines,
      budget,
    );

    return {
      id: p.fsq_id || `fs-${Math.random()}`,
      name: p.name || "Unknown",
      type: placeType,
      description:
        p.description || catNames[0] || "A local hotspot",
      latitude: pLat,
      longitude: pLng,
      rating: p.rating ? p.rating / 2 : null, // Foursquare is /10; convert to /5
      priceLevel: p.price ?? null,
      openNow: p.hours?.open_now ?? null,
      address: [
        p.location?.address,
        p.location?.locality,
        p.location?.country,
      ]
        .filter(Boolean)
        .join(", "),
      imageUrl,
      distanceKm: distKm,
      distance: formatDistance(distKm),
      typicalTimeSpent: typicalTime(placeType, p.name),
      matchReason,
      cuisine: placeType === "restaurant" ? catNames[0] : undefined,
    };
  });
}

// ---------------------------------------------------------------------------
// OpenStreetMap Overpass API — free, no key required
// Tries a fast compact query first; if that times out, tries a minimal fallback.
// ---------------------------------------------------------------------------
async function fetchOverpassPlaces(
  lat: number,
  lng: number,
  radiusMeters: number,
  interests: string[],
  cuisines: string[],
  budget?: string,
): Promise<NearbyPlace[]> {
  const radius = Math.min(radiusMeters, 25000); // cap at 25km for speed

  // Primary query — most useful amenity/tourism/historic types
  const query = `[out:json][timeout:12];
(
  node["amenity"~"restaurant|cafe|bar|pub|fast_food|ice_cream"](around:${radius},${lat},${lng});
  node["amenity"~"museum|theatre|art_gallery"](around:${radius},${lat},${lng});
  node["tourism"~"attraction|museum|gallery|viewpoint|zoo|aquarium"](around:${radius},${lat},${lng});
  node["historic"~"monument|castle|memorial|building"](around:${radius},${lat},${lng});
  node["leisure"~"park|garden"](around:${radius},${lat},${lng});
);
out body;`;

  // Try primary Overpass endpoint with 14s browser abort
  let res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
    signal: AbortSignal.timeout(14000),
  });

  // If primary endpoint is overloaded (429/503), try the backup mirror
  if (!res.ok && (res.status === 429 || res.status === 503)) {
    console.warn(`Primary Overpass failed (${res.status}), trying backup mirror…`);
    res = await fetch("https://overpass.kumi.systems/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(14000),
    });
  }

  if (!res.ok) {
    throw new Error(`Overpass API error ${res.status}`);
  }

  const data = await res.json();
  const elements: any[] = data.elements || [];

  const cafeAmenities = ["cafe", "bar", "pub", "ice_cream"];
  const restaurantAmenities = ["restaurant", "fast_food", "food_court"];

  return elements
    .filter((el) => el.tags?.name) // only named places
    .map((el): NearbyPlace => {
      const pLat = el.lat as number;
      const pLng = el.lon as number;
      const distKm = haversine(lat, lng, pLat, pLng);

      const amenity = (el.tags?.amenity || "") as string;
      const tourism  = (el.tags?.tourism  || "") as string;
      const historic = (el.tags?.historic || "") as string;
      const leisure  = (el.tags?.leisure  || "") as string;
      const catTags  = [amenity, tourism, historic, leisure].filter(Boolean);

      let placeType: NearbyPlace["type"] = "attraction";
      if (restaurantAmenities.includes(amenity)) placeType = "restaurant";
      if (cafeAmenities.includes(amenity))        placeType = "cafe";

      const name = el.tags.name as string;

      return {
        id:               `osm-${el.id}`,
        name,
        type:             placeType,
        description:      (el.tags?.description as string) || catTags[0] || "Local point of interest",
        latitude:         pLat,
        longitude:        pLng,
        rating:           null,
        priceLevel:       null,
        openNow:          null,
        address:          [
          el.tags?.["addr:housenumber"],
          el.tags?.["addr:street"],
          el.tags?.["addr:city"],
        ].filter(Boolean).join(", "),
        imageUrl:         null,
        distanceKm:       distKm,
        distance:         formatDistance(distKm),
        typicalTimeSpent: typicalTime(placeType, name),
        matchReason:      buildMatchReason(
          { name, type: placeType, description: el.tags?.description || "", categories: catTags },
          interests, cuisines, budget,
        ),
        cuisine: placeType === "restaurant" ? (el.tags?.cuisine as string | undefined) : undefined,
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 20);
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const {
      lat,
      lng,
      radiusMeters = 5000,
      category = "all",
      interests = [],
      cuisines = [],
      budget,
    } = body;

    if (!lat || !lng) {
      return new Response(
        JSON.stringify({ error: "lat and lng are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Foursquare category ID groups
    const fsqMap: Record<string, string> = {
      attraction: "10000,16000,17000,12000",
      cafe:       "13032,13033,13034,13035,13036",
      restaurant: "13065,13000",
      all:        "10000,12000,13000,13032,13033,13065,16000",
    };
    const categoryIds = fsqMap[category] || fsqMap.all;

    const foursquareKey = Deno.env.get("FOURSQUARE_API_KEY");
    let places: NearbyPlace[] = [];
    let source = "openstreetmap";

    // ── Try Foursquare first (if key is configured) ──────────────────────────
    if (foursquareKey) {
      try {
        places = await fetchFoursquarePlaces(
          lat, lng, radiusMeters, categoryIds, foursquareKey,
          interests, cuisines, budget,
        );
        source = "foursquare";
        console.log(`Foursquare returned ${places.length} places`);
      } catch (fsErr) {
        const fsErrMsg = fsErr instanceof Error ? fsErr.message : String(fsErr);
        // 401 = invalid/expired key; fall through to Overpass
        console.warn(`Foursquare unavailable (${fsErrMsg}) — falling back to OpenStreetMap`);
      }
    }

    // ── Fall back to OpenStreetMap Overpass if Foursquare had no results ─────
    if (places.length === 0) {
      try {
        places = await fetchOverpassPlaces(lat, lng, radiusMeters, interests, cuisines, budget);
        source = "openstreetmap";
        console.log(`Overpass returned ${places.length} places`);
      } catch (osmErr) {
        const osmErrMsg = osmErr instanceof Error ? osmErr.message : String(osmErr);
        console.error("Overpass also failed:", osmErrMsg);

        // ── Last resort: try the backup Overpass mirror with a simpler query ──
        try {
          console.log("Trying minimal Overpass fallback query…");
          const simpleRadius = Math.min(radiusMeters, 10000);
          const simpleQuery = `[out:json][timeout:10];
(
  node["amenity"~"restaurant|cafe|museum"](around:${simpleRadius},${lat},${lng});
  node["tourism"="attraction"](around:${simpleRadius},${lat},${lng});
);
out body;`;
          const fallbackRes = await fetch("https://overpass.kumi.systems/api/interpreter", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `data=${encodeURIComponent(simpleQuery)}`,
            signal: AbortSignal.timeout(12000),
          });
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            const elements: any[] = (fallbackData.elements || []).filter((el: any) => el.tags?.name);
            if (elements.length > 0) {
              places = elements.slice(0, 20).map((el: any): NearbyPlace => {
                const pLat = el.lat as number;
                const pLng = el.lon as number;
                const distKm = haversine(lat, lng, pLat, pLng);
                const amenity = el.tags?.amenity || "";
                let placeType: NearbyPlace["type"] = "attraction";
                if (["restaurant","fast_food"].includes(amenity)) placeType = "restaurant";
                if (["cafe","bar","pub"].includes(amenity)) placeType = "cafe";
                return {
                  id: `osm-${el.id}`,
                  name: el.tags.name,
                  type: placeType,
                  description: el.tags?.description || amenity || "Local attraction",
                  latitude: pLat, longitude: pLng,
                  rating: null, priceLevel: null, openNow: null,
                  address: [el.tags?.["addr:street"], el.tags?.["addr:city"]].filter(Boolean).join(", "),
                  imageUrl: null,
                  distanceKm: distKm,
                  distance: formatDistance(distKm),
                  typicalTimeSpent: typicalTime(placeType, el.tags.name),
                  matchReason: buildMatchReason({ name: el.tags.name, type: placeType }, interests, cuisines, budget),
                };
              }).sort((a, b) => a.distanceKm - b.distanceKm);
              source = "openstreetmap";
              console.log(`Fallback Overpass returned ${places.length} places`);
            }
          }
        } catch (fallbackErr) {
          console.error("Fallback Overpass also failed:", fallbackErr);
        }

        if (places.length === 0) {
          return new Response(
            JSON.stringify({
              places: [],
              source: "error",
              count: 0,
              message: "Could not reach any places service. Please try again later.",
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Sort by distance and cap at 20
    places.sort((a, b) => a.distanceKm - b.distanceKm);
    places = places.slice(0, 20);

    return new Response(
      JSON.stringify({ places, source, count: places.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("nearby-places error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Internal error",
        places: [],
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
