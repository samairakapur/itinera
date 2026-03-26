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

interface NearbyPlace {
  id: string;
  name: string;
  type: "attraction" | "cafe" | "restaurant";
  description: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  distance: string;
  rating: null;
  priceLevel: null;
  openNow: null;
  address: string;
  imageUrl: null;
  matchReason: string;
  cuisine: string | null;
  typicalTimeSpent: string;
}

// Haversine distance in km
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)} km`;
}

function buildOverpassQuery(lat: number, lng: number, radius: number, categories: string[]): string {
  const around = `(around:${radius},${lat},${lng})`;
  const parts: string[] = [];

  if (categories.includes("attraction")) {
    parts.push(`node["tourism"~"^(attraction|museum|gallery|artwork|viewpoint|zoo|theme_park)$"]${around};`);
    parts.push(`node["historic"~"^(monument|castle|ruins|memorial|building|church)$"]["name"]${around};`);
    parts.push(`node["amenity"~"^(theatre|cinema|arts_centre)$"]["name"]${around};`);
    parts.push(`way["tourism"~"^(attraction|museum|gallery)$"]["name"]${around};`);
  }
  if (categories.includes("cafe")) {
    parts.push(`node["amenity"~"^(cafe|bakery)$"]["name"]${around};`);
    parts.push(`node["amenity"="ice_cream"]["name"]${around};`);
  }
  if (categories.includes("restaurant")) {
    parts.push(`node["amenity"~"^(restaurant|fast_food|food_court|pub|bar)$"]["name"]${around};`);
    parts.push(`way["amenity"~"^(restaurant|fast_food)$"]["name"]${around};`);
  }

  return `[out:json][timeout:30];(${parts.join("")});out body 60;>;out skel qt;`;
}

function osmTagsToType(tags: Record<string, string>): "attraction" | "cafe" | "restaurant" {
  const amenity = tags.amenity || "";
  const tourism = tags.tourism || "";
  const historic = tags.historic || "";

  if (["cafe", "bakery", "ice_cream"].includes(amenity)) return "cafe";
  if (["restaurant", "fast_food", "food_court", "pub", "bar"].includes(amenity)) return "restaurant";
  if (tourism || historic || ["theatre", "cinema", "arts_centre"].includes(amenity)) return "attraction";
  return "attraction";
}

function buildAddress(tags: Record<string, string>): string {
  const parts: string[] = [];
  if (tags["addr:housenumber"] && tags["addr:street"]) {
    parts.push(`${tags["addr:housenumber"]} ${tags["addr:street"]}`);
  } else if (tags["addr:street"]) {
    parts.push(tags["addr:street"]);
  }
  if (tags["addr:city"]) parts.push(tags["addr:city"]);
  if (tags["addr:country"]) parts.push(tags["addr:country"]);
  return parts.join(", ") || "Address unavailable";
}

function buildMatchReason(type: string, tags: Record<string, string>): string {
  const cuisine = tags.cuisine;
  switch (type) {
    case "cafe":
      return cuisine ? `${cuisine.split(";")[0]} café nearby` : "Café within walking distance";
    case "restaurant":
      return cuisine ? `${cuisine.split(";")[0]} cuisine nearby` : "Restaurant within reach";
    default: {
      const tourism = tags.tourism || tags.historic || "";
      if (tourism) return `Local ${tourism.replace(/_/g, " ")} worth visiting`;
      return "Local attraction nearby";
    }
  }
}

function buildDescription(type: string, tags: Record<string, string>): string {
  const name = tags.name || "This place";
  switch (type) {
    case "cafe":
      return tags.cuisine
        ? `A local ${tags.cuisine.split(";")[0]} café.`
        : `A café near you.`;
    case "restaurant":
      return tags.cuisine
        ? `Serving ${tags.cuisine.split(";")[0]} cuisine.`
        : `A restaurant near you.`;
    default: {
      if (tags.tourism === "museum") return `A museum in the area.`;
      if (tags.tourism === "gallery") return `An art gallery nearby.`;
      if (tags.historic) return `A historic ${tags.historic.replace(/_/g, " ")} nearby.`;
      if (tags.tourism === "viewpoint") return `A viewpoint with local views.`;
      return `A local attraction — ${name}.`;
    }
  }
}

function typicalTimeSpent(type: string, tags: Record<string, string>): string {
  if (type === "cafe") return "30 – 45 min";
  if (type === "restaurant") return "1 – 1.5 hrs";
  if (tags.tourism === "museum") return "1.5 – 3 hrs";
  if (tags.tourism === "gallery") return "1 – 2 hrs";
  if (tags.tourism === "viewpoint") return "15 – 30 min";
  return "1 – 2 hrs";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: NearbyRequest = await req.json();
    const { lat, lng, radius_meters, categories } = body;

    if (!lat || !lng || !radius_meters || !categories?.length) {
      return new Response(JSON.stringify({ error: "Missing required fields: lat, lng, radius_meters, categories" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cap radius at 25km to avoid overloading Overpass
    const clampedRadius = Math.min(radius_meters, 25000);

    const query = buildOverpassQuery(lat, lng, clampedRadius, categories);
    const encodedQuery = encodeURIComponent(query);

    const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodedQuery}`;

    const response = await fetch(overpassUrl, {
      headers: { "User-Agent": "itinera-travel-app/1.0" },
      signal: AbortSignal.timeout(28000),
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const elements: any[] = data.elements || [];

    // Filter to nodes with a name and valid coords
    const nodes = elements.filter(
      (el) => el.type === "node" && el.tags?.name && el.lat && el.lon
    );

    const places: NearbyPlace[] = nodes
      .map((node): NearbyPlace | null => {
        const tags = node.tags as Record<string, string>;
        const type = osmTagsToType(tags);

        // Only keep the categories requested
        if (!categories.includes(type)) return null;

        const distanceKm = haversineDistance(lat, lng, node.lat, node.lon);

        return {
          id: `osm-${node.id}`,
          name: tags.name,
          type,
          description: buildDescription(type, tags),
          latitude: node.lat,
          longitude: node.lon,
          distanceKm,
          distance: formatDistance(distanceKm),
          rating: null,
          priceLevel: null,
          openNow: null,
          address: buildAddress(tags),
          imageUrl: null,
          matchReason: buildMatchReason(type, tags),
          cuisine: tags.cuisine ? tags.cuisine.split(";")[0].trim() : null,
          typicalTimeSpent: typicalTimeSpent(type, tags),
        };
      })
      .filter((p): p is NearbyPlace => p !== null)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 15);

    return new Response(JSON.stringify({ places }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("nearby-places error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error", places: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
