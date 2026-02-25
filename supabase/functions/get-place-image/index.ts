import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ---------------------------------------------------------------------------
// get-place-image — Supabase Edge Function
//
// Returns a relevant photo URL for a city / attraction / restaurant.
// Primary: Unsplash (50 req/hr free tier, needs UNSPLASH_ACCESS_KEY)
// Fallback: Picsum Photos (no key, always works, generic images)
// ---------------------------------------------------------------------------

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { query, width = 800, height = 600 } = await req.json() as {
      query: string;
      width?: number;
      height?: number;
    };

    if (!query) {
      return new Response(
        JSON.stringify({ error: "query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const unsplashKey = Deno.env.get("UNSPLASH_ACCESS_KEY");

    // ── Try Unsplash first ─────────────────────────────────────────────────
    if (unsplashKey) {
      const url =
        `https://api.unsplash.com/search/photos` +
        `?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;

      const res = await fetch(url, {
        headers: { Authorization: `Client-ID ${unsplashKey}` },
      });

      if (res.ok) {
        const data = await res.json();
        const photo = data.results?.[0];

        if (photo) {
          return new Response(
            JSON.stringify({
              imageUrl: `${photo.urls.raw}&w=${width}&h=${height}&fit=crop&auto=format`,
              thumb: photo.urls.thumb,
              credit: {
                name: photo.user.name,
                link: photo.links.html,
              },
              source: "unsplash",
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // ── Fallback: Picsum (seeded by query hash so it's stable per place) ──
    const hash = [...query].reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) >>> 0, 0);
    const seed = (hash % 1000) + 1;
    const imageUrl = `https://picsum.photos/seed/${seed}/${width}/${height}`;

    return new Response(
      JSON.stringify({ imageUrl, source: "picsum" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("get-place-image error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Internal error",
        imageUrl: null,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
