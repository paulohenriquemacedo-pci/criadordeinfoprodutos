import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MEMORY_CATEGORIES = `
Extraia as decisões estratégicas do conteúdo do módulo e retorne um JSON estruturado.

CATEGORIAS OBRIGATÓRIAS (preencha apenas as que tiverem dados no conteúdo):

1. identidade_posicionamento: { nicho, subnicho, posicionamento, big_idea, promessa_principal }
2. publico_alvo: { avatar_principal, dores_principais[], desejos_principais[], objecoes[] }
3. produto: { nome_produto, formato_produto, estrutura_modulos[], bonus[], preco, ticket_medio }
4. copy_mensagem: { headline_principal, angulo_principal, mecanismo_unico, ctas[] }
5. marketing: { pilares_conteudo[], plataformas_prioritarias[], criativos_principais[] }
6. funil_monetizacao: { tipo_funil, escada_valor[], order_bump, upsell, downsell }
7. automacoes: { sequencias_email[], funil_whatsapp, remarketing[] }

REGRAS:
- Retorne APENAS o JSON, sem texto adicional
- Use null para campos sem dados
- Arrays vazios [] para listas sem dados
- Mantenha valores concisos (máx 100 chars por campo de texto)
- Para arrays, máximo 5 itens mais relevantes
`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { moduleNumber, moduleContent, existingMemory } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const systemPrompt = `Você é um sistema de memória estratégica para uma plataforma de criação de infoprodutos.
${MEMORY_CATEGORIES}

${existingMemory ? `MEMÓRIA EXISTENTE (mescle com os novos dados, priorizando os mais recentes):\n${JSON.stringify(existingMemory)}` : "Esta é a primeira extração. Crie a memória do zero."}`;

    const userPrompt = `Extraia as decisões estratégicas do MÓDULO ${moduleNumber} abaixo e retorne o JSON atualizado da memória estratégica.

CONTEÚDO DO MÓDULO ${moduleNumber}:
${moduleContent.slice(0, 15000)}`;

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
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit excedido. Tente novamente em instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes para Lovable AI." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no gateway AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = raw;
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    } else {
      // Try to find raw JSON object
      const objMatch = raw.match(/\{[\s\S]*\}/);
      if (objMatch) jsonStr = objMatch[0];
    }

    let memory;
    try {
      memory = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse memory JSON:", jsonStr.slice(0, 500));
      // Return existing memory if parsing fails
      memory = existingMemory || {};
    }

    // Add metadata
    memory._meta = {
      last_updated: new Date().toISOString(),
      last_module: moduleNumber,
      modules_processed: [
        ...(existingMemory?._meta?.modules_processed || []).filter((n: number) => n !== moduleNumber),
        moduleNumber,
      ].sort(),
    };

    return new Response(JSON.stringify({ memory }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("strategic-memory error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
