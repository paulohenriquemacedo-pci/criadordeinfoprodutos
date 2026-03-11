import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { briefing, moduleNumber, moduleTitle, moduleContent, previousModules } = await req.json();

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY não configurada. Adicione sua chave pessoal do Google Gemini.");

    const systemPrompt = `Você é um Orquestrador de Coerência para projetos de infoprodutos digitais. Sua função é analisar o conteúdo gerado por um módulo e validar sua coerência com o briefing estratégico e os módulos anteriores.

Você DEVE retornar EXCLUSIVAMENTE um JSON válido (sem markdown, sem backticks) com esta estrutura exata:

{
  "score": <número de 0 a 100>,
  "status": "<coerente|atencao|incoerente>",
  "contradictions": [
    {"issue": "<descrição da contradição>", "location": "<onde foi encontrada>", "suggestion": "<como corrigir>"}
  ],
  "glossaryCheck": {
    "consistent": ["<termos usados de forma consistente>"],
    "inconsistent": [{"term": "<termo>", "variants": ["<variante1>", "<variante2>"], "recommended": "<forma recomendada>"}]
  },
  "toneCheck": {
    "expected": "<tom esperado baseado no briefing>",
    "detected": "<tom detectado no conteúdo>",
    "aligned": <true|false>,
    "notes": "<observações>"
  },
  "executiveSummary": "<resumo executivo de 2-3 frases sobre o estado de coerência do projeto>",
  "recommendations": ["<recomendação 1>", "<recomendação 2>"]
}

Critérios de avaliação:
- score 80-100 (coerente): Conteúdo alinhado com briefing e módulos anteriores
- score 50-79 (atencao): Pequenas inconsistências que merecem revisão
- score 0-49 (incoerente): Contradições graves que comprometem o produto

Analise:
1. Contradições diretas entre o conteúdo e o briefing (persona, nicho, promessa)
2. Contradições entre o conteúdo e módulos anteriores
3. Consistência terminológica (mesmo produto, mesma persona, mesmos benefícios)
4. Tom de voz (formal vs informal, técnico vs acessível)
5. Promessas e claims — o módulo promete algo que contradiz outro?`;

    let userMessage = `BRIEFING DO PROJETO:\n${briefing}\n\n`;

    if (previousModules && previousModules.length > 0) {
      userMessage += "MÓDULOS ANTERIORES GERADOS:\n";
      for (const mod of previousModules) {
        userMessage += `\n--- MÓDULO ${mod.number} (${mod.title}) ---\n${mod.content}\n`;
      }
      userMessage += "\n\n";
    }

    userMessage += `MÓDULO SENDO VALIDADO - ${moduleNumber} (${moduleTitle}):\n${moduleContent}\n\nAnalise a coerência deste módulo em relação ao briefing e aos módulos anteriores. Retorne APENAS o JSON.`;

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido na API Gemini." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 401 || response.status === 403) {
        return new Response(JSON.stringify({ error: "Chave Gemini inválida ou sem permissão." }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("Gemini API error:", response.status, t);
      throw new Error("Erro na API do Gemini");
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent);
    } catch {
      console.error("Failed to parse coherence response:", rawContent);
      throw new Error("Falha ao interpretar resposta da IA");
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("coherence-check error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
