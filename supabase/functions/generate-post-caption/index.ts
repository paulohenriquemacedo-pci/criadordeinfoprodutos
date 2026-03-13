import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { headline, subheadline, body, niche, targetAudience, tone, platform } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
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

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI error:", status, text);
      throw new Error(`AI error: ${status}`);
    }

    const data = await response.json();
    const caption = data.choices?.[0]?.message?.content;

    if (!caption) throw new Error("No caption generated");

    return new Response(JSON.stringify({ caption }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-post-caption error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
