import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query, page, perPage, orientation } = await req.json();

    if (!query) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const UNSPLASH_ACCESS_KEY = Deno.env.get("UNSPLASH_ACCESS_KEY");
    if (!UNSPLASH_ACCESS_KEY) {
      return new Response(JSON.stringify({ error: "UNSPLASH_ACCESS_KEY não configurada. Configure nas configurações do projeto." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const params = new URLSearchParams({
      query,
      page: String(page || 1),
      per_page: String(perPage || 12),
      orientation: orientation || "portrait",
    });

    console.log("Searching Unsplash:", query);

    const response = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
      headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Unsplash error:", response.status, text);
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = await response.json();

    const images = data.results.map((img: any) => ({
      id: img.id,
      url: img.urls.regular,
      thumbUrl: img.urls.small,
      fullUrl: img.urls.full,
      alt: img.alt_description || img.description || query,
      author: img.user.name,
      authorUrl: img.user.links.html,
      width: img.width,
      height: img.height,
    }));

    return new Response(JSON.stringify({ images, totalPages: data.total_pages, total: data.total }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("search-stock-images error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
