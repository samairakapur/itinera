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
  // Use /places/search for proper radius + category filtering
  // (The /nearby endpoint is a "trending" feed that ignores radius)
  const url = new URL("https://api.foursquare.com/v3/places/search");
  url.searchParams.set("ll", `${lat},${lng}`);
  url.searchParams.set("radius", String(Math.min(radiusMeters, 100000)));
  url.searchParams.set("categories", categoryIds);
  url.searchParams.set("limit", "30");
  url.searchParams.set(
    "fields",
    "fsq_id,name,geocodes,categories,rating,price,hours,location,photos,description,distance",
  );
  url.searchParams.set("sort", "DISTANCE");

  const res = await fetch(url.toString(), {
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

    const foursquareKey = Deno.env.get("FOURSQUARE_API_KEY");

    if (!foursquareKey) {
      console.warn("FOURSQUARE_API_KEY is not set — returning empty places list");
      return new Response(
        JSON.stringify({
          places: [],
          source: "none",
          count: 0,
          message:
            "Nearby places require a Foursquare API key. Add FOURSQUARE_API_KEY to your Supabase Edge Function secrets.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Foursquare category ID groups
    // Full Foursquare v3 category tree: https://location.foursquare.com/places/docs/categories
    const fsqMap: Record<string, string> = {
      attraction: "10000,16000,17000,12000", // arts+entertainment, outdoors, events, landmarks
      cafe:       "13032,13033,13034,13035,13036", // coffee, tea, bakery, juice bar
      restaurant: "13065,13000",                   // restaurant, food & drink
      all:        "10000,12000,13000,13032,13033,13065,16000",
    };
    const categoryIds = fsqMap[category] || fsqMap.all;

    let places: NearbyPlace[] = [];

    try {
      places = await fetchFoursquarePlaces(
        lat, lng, radiusMeters, categoryIds, foursquareKey,
        interests, cuisines, budget,
      );
    } catch (fsErr) {
      console.error("Foursquare request failed:", fsErr);
      return new Response(
        JSON.stringify({
          places: [],
          source: "foursquare_error",
          count: 0,
          message: "Could not reach Foursquare — please try again later.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sort by distance and cap at 20
    places.sort((a, b) => a.distanceKm - b.distanceKm);
    places = places.slice(0, 20);

    return new Response(
      JSON.stringify({ places, source: "foursquare", count: places.length }),
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
