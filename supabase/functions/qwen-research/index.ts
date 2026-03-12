import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { niche, promise, targetAudience, moduleTitle, moduleNumber, customPrompt } = await req.json();

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY não configurada. Adicione sua chave do OpenRouter.");

    const searchQuery = customPrompt
      ? `Nicho: ${niche || "não definido"}\nPromessa do produto: ${promise || "não definida"}\nPúblico-alvo: ${targetAudience || "não definido"}\nMódulo atual: ${moduleNumber} - ${moduleTitle}\n\n${customPrompt}`
      : `Nicho: ${niche || "não definido"}
Promessa do produto: ${promise || "não definida"}
Público-alvo: ${targetAudience || "não definido"}
Módulo atual: ${moduleNumber} - ${moduleTitle}

Faça uma pesquisa de mercado profunda e analítica sobre este nicho no Brasil:
1. Análise detalhada do público-alvo: dores, desejos, objeções, comportamento de compra
2. Mapeamento de concorrentes com análise SWOT de cada um
3. Gaps de mercado e oportunidades sub-exploradas
4. Tendências emergentes e projeções futuras
5. Estratégias de posicionamento e diferenciação recomendadas
6. Análise de preços praticados e elasticidade de demanda
7. Canais de aquisição mais eficazes no nicho

Seja extremamente detalhado e analítico. Forneça dados concretos, nomes reais de players, números e estatísticas quando possível.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://orquestradorinfoprodutos.lovable.app",
        "X-Title": "Orquestrador de Infoprodutos",
      },
      body: JSON.stringify({
        model: "qwen/qwen3-235b-a22b",
        max_tokens: 16384,
        messages: [
          {
            role: "system",
            content: `Você é um pesquisador de mercado digital de elite, especializado em infoprodutos no mercado brasileiro. 
Sua análise deve ser profunda, estratégica e fundamentada em dados reais.
Estruture sua resposta com headers claros, tabelas markdown quando apropriado, e priorize insights acionáveis.
Sempre inclua dados concretos: números, nomes de concorrentes, preços praticados, métricas de referência.
REGRA OBRIGATÓRIA: NUNCA omita informações por brevidade. NUNCA use frases como "foram omitidas por brevidade", "resumido por questões de espaço", "entre outros" sem listar todos. Forneça TODAS as informações, análises e dados possíveis, sem qualquer corte ou resumo. A resposta deve ser completa e exaustiva.
Responda em português do Brasil.`,
          },
          { role: "user", content: searchQuery },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenRouter/Qwen error:", response.status, errText);

      if (response.status === 402 || response.status === 401) {
        return new Response(JSON.stringify({ error: "Créditos OpenRouter insuficientes ou chave inválida." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido no OpenRouter. Tente novamente em alguns instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Erro na pesquisa via Qwen/OpenRouter" }), {
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
    console.error("qwen-research error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
