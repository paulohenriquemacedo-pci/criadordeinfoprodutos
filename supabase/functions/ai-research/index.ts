import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { niche, promise, targetAudience, moduleTitle, moduleNumber, customPrompt } = await req.json();

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY não configurada. Adicione sua chave pessoal do Google Gemini.");

    const baseContext = `Nicho: ${niche || "não definido"}
Promessa do produto: ${promise || "não definida"}
Público-alvo: ${targetAudience || "não definido"}
Módulo atual: ${moduleNumber} - ${moduleTitle}`;

    const userMessage = customPrompt
      ? `${baseContext}\n\n${customPrompt}`
      : `${baseContext}\n\nFaça uma análise de mercado completa e detalhada sobre este nicho no Brasil, incluindo concorrentes, tendências, público-alvo, estratégias e oportunidades.`;

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um pesquisador de mercado digital especializado em infoprodutos no Brasil.
Retorne dados objetivos sobre o mercado, concorrentes, tendências, público-alvo e oportunidades.
Inclua dados concretos sempre que possível: números estimados, nomes de concorrentes conhecidos, preços praticados, estratégias observadas.
Use seu conhecimento para fornecer análises fundamentadas.
Responda em português do Brasil.`,
          },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido na API Gemini." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 401 || response.status === 403) {
        return new Response(JSON.stringify({ error: "Chave Gemini inválida ou sem permissão." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("Gemini API error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro na API do Gemini" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ research: content, citations: [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("ai-research error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
