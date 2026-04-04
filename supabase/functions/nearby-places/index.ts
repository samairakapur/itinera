import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NearbyRequest {
  lat: number;
  lng: number;
  radius_meters: number;
  categories: Array<"attraction" | "cafe" | "restaurant">;
}

// Always HTTP 200 so supabase.functions.invoke reads the body
const json = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Foursquare v3 category codes
// Attractions: Arts & Entertainment (10000) + Landmarks & Outdoors (16000)
// Café: 13032 (Coffee Shop) + 13035 (Café)
// Restaurant: 13065 (Restaurant)
const FSQ_CATEGORIES: Record<string, string[]> = {
  attraction: ["10000", "16000"],
  cafe: ["13032", "13035"],
  restaurant: ["13065"],
};

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function mapFsqType(categories: any[]): "attraction" | "cafe" | "restaurant" {
  if (!categories?.length) return "attraction";
  const ids: number[] = categories.map((c: any) => Math.floor(c.id / 1000));
  if (ids.some(id => id === 13)) {
    const leafIds = categories.map((c: any) => c.id);
    if (leafIds.some((id: number) => [13032, 13035, 13063].includes(id))) return "cafe";
    return "restaurant";
  }
  return "attraction";
}

function buildPhotoUrl(photo: any): string | null {
  if (!photo?.prefix || !photo?.suffix) return null;
  return `${photo.prefix}500x300${photo.suffix}`;
}

function buildMatchReason(type: string, place: any): string {
  const category = place.categories?.[0]?.name ?? "";
  const distance = place.distance ? `${formatDistance(place.distance)} away` : "nearby";
  switch (type) {
    case "cafe": return `${category || "Café"} ${distance}`;
    case "restaurant": return `${category || "Restaurant"} ${distance}`;
    default: return `${category || "Attraction"} ${distance}`;
  }
}

function buildDescription(type: string, place: any): string {
  const category = place.categories?.[0]?.name ?? "";
  switch (type) {
    case "cafe": return category ? `A ${category.toLowerCase()} near you.` : "A café near you.";
    case "restaurant": return category ? `A ${category.toLowerCase()} near you.` : "A restaurant near you.";
    default: return category ? `A ${category.toLowerCase()} in the area.` : `A local attraction nearby.`;
  }
}

function typicalTime(type: string): string {
  if (type === "cafe") return "30 – 45 min";
  if (type === "restaurant") return "1 – 1.5 hrs";
  return "1 – 2 hrs";
}

async function fetchFoursquarePlaces(
  lat: number,
  lng: number,
  radiusMeters: number,
  categories: string[],
  apiKey: string,
): Promise<any[] | null> {
  // Returns null when Foursquare fails (caller should fall through to Overpass)
  try {
    const categoryIds = categories.flatMap(c => FSQ_CATEGORIES[c] ?? []).join(",");
    const fields = "fsq_id,name,categories,geocodes,location,distance,rating,price,photos";
    const url =
      `https://api.foursquare.com/v3/places/search?ll=${lat},${lng}&radius=${radiusMeters}` +
      `&categories=${categoryIds}&fields=${fields}&limit=40&sort=DISTANCE`;

    const res = await fetch(url, {
      headers: {
        Authorization: apiKey,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(`Foursquare API ${res.status} — falling back to Overpass:`, body.slice(0, 100));
      return null; // fall through to Overpass
    }

    const data = await res.json();
    const results = data.results ?? [];
    if (results.length === 0) {
      console.warn("Foursquare returned 0 results — falling back to Overpass");
      return null;
    }
    return results;
  } catch (e) {
    console.warn("Foursquare fetch error — falling back to Overpass:", e);
    return null;
  }
}

// Overpass fallback — kumi.systems first (overpass-api.de is often overloaded)
const OVERPASS_ENDPOINTS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

function buildOverpassQuery(lat: number, lng: number, radius: number, categories: string[]): string {
  const around = `(around:${radius},${lat},${lng})`;
  const parts: string[] = [];
  if (categories.includes("attraction")) {
    parts.push(`node["tourism"~"^(attraction|museum|gallery|artwork|viewpoint|zoo|theme_park)$"]${around};`);
    parts.push(`node["historic"~"^(monument|castle|ruins|memorial|building|church)$"]["name"]${around};`);
    parts.push(`way["tourism"~"^(attraction|museum|gallery)$"]["name"]${around};`);
  }
  if (categories.includes("cafe")) {
    parts.push(`node["amenity"~"^(cafe|bakery)$"]["name"]${around};`);
  }
  if (categories.includes("restaurant")) {
    parts.push(`node["amenity"~"^(restaurant|fast_food|pub|bar)$"]["name"]${around};`);
  }
  return `[out:json][timeout:25];(${parts.join("")});out body 50;>;out skel qt;`;
}

async function fetchOverpass(query: string): Promise<any> {
  const encoded = encodeURIComponent(query);
  let lastErr: Error = new Error("All Overpass endpoints failed");
  for (const base of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(`${base}?data=${encoded}`, {
        headers: { "User-Agent": "itinera-travel-app/1.0" },
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) { lastErr = new Error(`${base} ${res.status}`); continue; }
      return await res.json();
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastErr;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function osmTagsToType(tags: Record<string, string>): "attraction" | "cafe" | "restaurant" {
  const amenity = tags.amenity || "";
  if (["cafe", "bakery", "ice_cream"].includes(amenity)) return "cafe";
  if (["restaurant", "fast_food", "food_court", "pub", "bar"].includes(amenity)) return "restaurant";
  return "attraction";
}

function osmMatchReason(type: string, tags: Record<string, string>, distM: number): string {
  const dist = formatDistance(distM);
  const cuisine = tags.cuisine?.split(";")[0] ?? "";
  if (type === "cafe") return cuisine ? `${cuisine} café, ${dist} away` : `Café ${dist} away`;
  if (type === "restaurant") return cuisine ? `${cuisine} restaurant, ${dist} away` : `Restaurant ${dist} away`;
  const poi = tags.tourism || tags.historic || "";
  return poi ? `${poi.replace(/_/g, " ")} ${dist} away` : `Local attraction ${dist} away`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body: NearbyRequest = await req.json();
    const { lat, lng, radius_meters, categories } = body;

    if (!lat || !lng || !radius_meters || !categories?.length) {
      return json({ error: "Missing required fields", places: [] });
    }

    const clampedRadius = Math.min(radius_meters, 25000);
    const apiKey = Deno.env.get("FOURSQUARE_API_KEY");

    // ── Try Foursquare first ────────────────────────────────────────────────
    if (apiKey) {
      const results = await fetchFoursquarePlaces(lat, lng, clampedRadius, categories, apiKey);
      // null = Foursquare failed → fall through to Overpass below
      if (results !== null) {
        const places = results
          .filter((r: any) => r.name && r.geocodes?.main)
          .map((r: any) => {
            const type = mapFsqType(r.categories);
            const distM = r.distance ?? haversine(lat, lng, r.geocodes.main.latitude, r.geocodes.main.longitude);
            const photo = r.photos?.[0];
            const imageUrl = buildPhotoUrl(photo);
            const addr = r.location?.formatted_address ?? r.location?.address ?? "Address unavailable";

            return {
              id: r.fsq_id,
              name: r.name,
              type,
              description: buildDescription(type, r),
              latitude: r.geocodes.main.latitude,
              longitude: r.geocodes.main.longitude,
              distanceKm: distM / 1000,
              distance: formatDistance(distM),
              rating: r.rating ? Math.round(r.rating * 10) / 10 : null,
              priceLevel: r.price ?? null,
              openNow: null,
              address: addr,
              imageUrl,
              matchReason: buildMatchReason(type, r),
              cuisine: r.categories?.find((c: any) => c.name?.toLowerCase().includes("cuisine"))?.name ?? null,
              typicalTimeSpent: typicalTime(type),
            };
          })
          .sort((a: any, b: any) => a.distanceKm - b.distanceKm)
          .slice(0, 20);

        return json({ places });
      }
    }

    // ── Overpass fallback (Foursquare unavailable or failed) ───────────────
    console.warn("Foursquare unavailable — falling back to Overpass OSM");
    const query = buildOverpassQuery(lat, lng, clampedRadius, categories);
    const data = await fetchOverpass(query);
    const elements: any[] = data.elements || [];
    const nodes = elements.filter(el => el.type === "node" && el.tags?.name && el.lat && el.lon);

    const places = nodes
      .map((node: any) => {
        const tags = node.tags as Record<string, string>;
        const type = osmTagsToType(tags);
        if (!categories.includes(type)) return null;
        const distM = haversine(lat, lng, node.lat, node.lon);
        const addrParts = [
          tags["addr:housenumber"] && tags["addr:street"]
            ? `${tags["addr:housenumber"]} ${tags["addr:street"]}`
            : tags["addr:street"],
          tags["addr:city"],
        ].filter(Boolean);

        return {
          id: `osm-${node.id}`,
          name: tags.name,
          type,
          description: osmMatchReason(type, tags, distM),
          latitude: node.lat,
          longitude: node.lon,
          distanceKm: distM / 1000,
          distance: formatDistance(distM),
          rating: null,
          priceLevel: null,
          openNow: null,
          address: addrParts.join(", ") || "Address unavailable",
          imageUrl: null,
          matchReason: osmMatchReason(type, tags, distM),
          cuisine: tags.cuisine ? tags.cuisine.split(";")[0].trim() : null,
          typicalTimeSpent: typicalTime(type),
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.distanceKm - b.distanceKm)
      .slice(0, 20);

    return json({ places });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("nearby-places error:", msg);
    return json({
      error: `Could not load nearby places. The location service may be temporarily unavailable — please try again in a moment.`,
      places: [],
    });
  }
});
