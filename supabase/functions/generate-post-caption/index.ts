import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function tryLovableGateway(systemPrompt: string, userPrompt: string, apiKey: string): Promise<string | null> {
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (response.status === 402 || response.status === 429) {
      console.log(`Lovable gateway returned ${response.status}, falling back to Gemini API`);
      await response.text();
      return null;
    }

    if (!response.ok) {
      const text = await response.text();
      console.error("Lovable gateway caption error:", response.status, text);
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) {
    console.error("Lovable gateway caption exception:", e);
    return null;
  }
}

async function tryGeminiDirect(systemPrompt: string, userPrompt: string, apiKey: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 1400,
          },
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("Gemini direct caption error:", response.status, text);
      return null;
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const caption = parts
      .map((part: { text?: string }) => part.text || "")
      .join("\n")
      .trim();

    return caption || null;
  } catch (e) {
    console.error("Gemini direct caption exception:", e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { headline, subheadline, body, niche, targetAudience, tone, platform } = await req.json();

    const systemPrompt = `Você é um especialista em copywriting para redes sociais, focado em ${platform || "Instagram"}.
Gere uma legenda completa para uma postagem com base no conteúdo fornecido.

A legenda DEVE conter:
1. **Gancho** (primeira linha chamativa que gera curiosidade)
2. **Corpo** (desenvolvimento do tema, 2-4 parágrafos curtos com emojis estratégicos)
3. **CTA** (chamada para ação clara e direta)
4. **Hashtags** (10-15 hashtags relevantes, mix de populares e nichadas)

Regras:
- Use linguagem conversacional e envolvente
- Quebre parágrafos com linhas em branco para facilitar leitura
- Use emojis de forma estratégica (não excessiva)
- O CTA deve ser separado do corpo com uma linha em branco
- As hashtags devem vir depois do CTA, separadas por uma linha
- Adapte o tom conforme solicitado
- Escreva em português brasileiro`;

    const userPrompt = `Conteúdo do post:
- Título: ${headline || ""}
- Subtítulo: ${subheadline || ""}
- Corpo: ${body || ""}

Contexto:
- Nicho: ${niche || "não especificado"}
- Público-alvo: ${targetAudience || "não especificado"}
- Tom: ${tone || "profissional e engajante"}

Gere a legenda completa.`;

    let caption: string | null = null;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (LOVABLE_API_KEY) {
      caption = await tryLovableGateway(systemPrompt, userPrompt, LOVABLE_API_KEY);
    }

    if (!caption) {
      const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
      if (GEMINI_API_KEY) {
        console.log("Using Gemini API fallback for caption generation");
        caption = await tryGeminiDirect(systemPrompt, userPrompt, GEMINI_API_KEY);
      }
    }

    if (!caption) {
      return new Response(JSON.stringify({
        error: "Não foi possível gerar a legenda no momento. Tente novamente em instantes.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ caption }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-post-caption error:", e);
    return new Response(JSON.stringify({
      error: e instanceof Error ? e.message : "Erro inesperado ao gerar legenda",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
