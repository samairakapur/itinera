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
  // attractions vary — use name hints
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
// Foursquare Places API (free tier — 1,000 calls/day, no credit card needed)
// ---------------------------------------------------------------------------
async function fetchFoursquarePlaces(
  lat: number,
  lng: number,
  radiusMeters: number,
  categoryIds: string,
  apiKey: string
): Promise<NearbyPlace[]> {
  const url = new URL("https://api.foursquare.com/v3/places/nearby");
  url.searchParams.set("ll", `${lat},${lng}`);
  url.searchParams.set("radius", String(Math.min(radiusMeters, 100000)));
  url.searchParams.set("categories", categoryIds);
  url.searchParams.set("limit", "20");
  url.searchParams.set("fields", "fsq_id,name,geocodes,categories,rating,price,hours,location,photos,description,distance");
  url.searchParams.set("sort", "DISTANCE");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: apiKey,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Foursquare API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const results = data.results || [];

  // Foursquare category ID groups
  const cafeIds = ["13032", "13033", "13034", "13035"]; // coffee/tea/bakery
  const restaurantIds = ["13065"]; // restaurant
  // attractions = everything else

  return results.map((p: any): NearbyPlace => {
    const pLat = p.geocodes?.main?.latitude ?? 0;
    const pLng = p.geocodes?.main?.longitude ?? 0;
    const distKm = haversine(lat, lng, pLat, pLng);
    const catIds: string[] = (p.categories || []).map((c: any) => String(c.id));

    let placeType: NearbyPlace["type"] = "attraction";
    if (catIds.some((id) => restaurantIds.includes(id))) placeType = "restaurant";
    else if (catIds.some((id) => cafeIds.includes(id))) placeType = "cafe";

    let imageUrl: string | null = null;
    if (p.photos && p.photos.length > 0) {
      const photo = p.photos[0];
      imageUrl = `${photo.prefix}400x300${photo.suffix}`;
    }

    return {
      id: p.fsq_id || `fs-${Math.random()}`,
      name: p.name || "Unknown",
      type: placeType,
      description:
        p.description ||
        (p.categories?.[0]?.name || "A local hotspot"),
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
      matchReason: `Nearby ${placeType} worth visiting`,
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
    const { lat, lng, radiusMeters = 5000, category = "all" }: RequestBody =
      await req.json();

    if (!lat || !lng) {
      return new Response(
        JSON.stringify({ error: "lat and lng are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const foursquareKey = Deno.env.get("FOURSQUARE_API_KEY");

    // ---- Foursquare key not configured — return empty list gracefully ------
    // Return HTTP 200 with an empty array so the frontend shows "no places
    // found" rather than an error toast. The user can add a free Foursquare
    // API key (developer.foursquare.com) to enable this feature.
    if (!foursquareKey) {
      console.warn("FOURSQUARE_API_KEY is not set — returning empty places list");
      return new Response(
        JSON.stringify({
          places: [],
          source: "none",
          count: 0,
          message: "Nearby places require a Foursquare API key. Add FOURSQUARE_API_KEY to your Supabase Edge Function secrets.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let places: NearbyPlace[] = [];
    let source = "none";

    // ---- Foursquare (primary and only provider) --------------------------
    try {
      // Foursquare category IDs
      const fsqMap: Record<string, string> = {
        attraction: "10000,16000,17000", // arts/outdoors/events
        cafe: "13032,13033,13034",       // coffee/tea/bakery
        restaurant: "13065",             // restaurant
        all: "10000,13032,13033,13065,16000",
      };

      const categoryIds = fsqMap[category] || fsqMap.all;
      places = await fetchFoursquarePlaces(lat, lng, radiusMeters, categoryIds, foursquareKey);
      source = "foursquare";
    } catch (fsErr) {
      console.error("Foursquare request failed:", fsErr);
      // Return empty array instead of 500 so the frontend shows a graceful
      // "no places found" state rather than an error toast.
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
