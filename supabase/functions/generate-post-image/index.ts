import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function tryLovableGateway(enhancedPrompt: string, apiKey: string): Promise<string | null> {
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: enhancedPrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (response.status === 429 || response.status === 402) {
      console.log(`Lovable gateway returned ${response.status}, falling back to Gemini API`);
      await response.text();
      return null;
    }

    if (!response.ok) {
      const text = await response.text();
      console.error("Lovable gateway error:", response.status, text);
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;
  } catch (e) {
    console.error("Lovable gateway exception:", e);
    return null;
  }
}

async function tryGeminiDirect(enhancedPrompt: string, apiKey: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: enhancedPrompt }] }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("Gemini direct error:", response.status, text);
      return null;
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (e) {
    console.error("Gemini direct exception:", e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, style, width, height } = await req.json();

    const aspectRatio = width && height ? `${width}x${height}` : "1080x1350";

    const enhancedPrompt = `Create a professional, high-quality background image for a social media post (${aspectRatio}).
Style: ${style || "dark premium, cinematic lighting, moody atmosphere"}.
Subject/Theme: ${prompt}.
Requirements:
- The image should work well as a background with text overlay
- Use dramatic lighting and rich colors
- No text, logos, or watermarks in the image
- Professional photography quality
- Slightly blurred/bokeh elements for depth`;

    console.log("Generating image with prompt:", enhancedPrompt.slice(0, 100));

    // Try Lovable gateway first
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let imageUrl: string | null = null;

    if (LOVABLE_API_KEY) {
      imageUrl = await tryLovableGateway(enhancedPrompt, LOVABLE_API_KEY);
    }

    // Fallback to Gemini direct API
    if (!imageUrl) {
      const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
      if (GEMINI_API_KEY) {
        console.log("Using Gemini API fallback for image generation");
        imageUrl = await tryGeminiDirect(enhancedPrompt, GEMINI_API_KEY);
      }
    }

    if (!imageUrl) {
      throw new Error("Não foi possível gerar a imagem. Verifique seus créditos ou tente novamente.");
    }

    console.log("Image generated successfully");

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-post-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
