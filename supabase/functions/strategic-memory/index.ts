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
- Todos os valores devem ser strings ou arrays de strings, NUNCA objetos aninhados
`;

function extractJsonFromResponse(response: string): unknown {
  let cleaned = response
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const jsonStart = cleaned.search(/[\{\[]/);
  const jsonEnd = cleaned.lastIndexOf(jsonStart !== -1 && cleaned[jsonStart] === '[' ? ']' : '}');

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("No JSON object found in response");
  }

  cleaned = cleaned.substring(jsonStart, jsonEnd + 1);

  try {
    return JSON.parse(cleaned);
  } catch {
    cleaned = cleaned
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
      .replace(/[\x00-\x1F\x7F]/g, "");

    try {
      return JSON.parse(cleaned);
    } catch {
      const lastBrace = cleaned.lastIndexOf("}");
      if (lastBrace > 0) {
        const repaired = cleaned.substring(0, lastBrace + 1);
        try {
          return JSON.parse(repaired);
        } catch {
          throw new Error("Cannot repair truncated JSON");
        }
      }
      throw new Error("Cannot parse JSON after repair attempts");
    }
  }
}

// Recursively flatten any nested objects into strings
function flattenValues(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(item => {
      if (typeof item === "object" && item !== null) return JSON.stringify(item);
      return String(item);
    });
  }
  if (typeof obj === "object") {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key === "_meta") {
        result[key] = value;
        continue;
      }
      if (Array.isArray(value)) {
        result[key] = value.map(item => {
          if (typeof item === "object" && item !== null) return JSON.stringify(item);
          return String(item);
        });
      } else if (typeof value === "object" && value !== null) {
        // Check if it's a category-level object (has string/array leaves)
        const inner: any = {};
        for (const [k, v] of Object.entries(value as any)) {
          if (Array.isArray(v)) {
            inner[k] = v.map((i: any) => typeof i === "object" && i !== null ? JSON.stringify(i) : String(i));
          } else if (typeof v === "object" && v !== null) {
            inner[k] = JSON.stringify(v);
          } else if (v !== null && v !== undefined) {
            inner[k] = String(v);
          } else {
            inner[k] = null;
          }
        }
        result[key] = inner;
      } else {
        result[key] = value;
      }
    }
    return result;
  }
  return obj;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { moduleNumber, moduleContent, existingMemory } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    
    if (!LOVABLE_API_KEY && !GEMINI_API_KEY) throw new Error("Nenhuma chave de IA configurada");

    const systemPrompt = `Você é um sistema de memória estratégica para uma plataforma de criação de infoprodutos.
${MEMORY_CATEGORIES}

${existingMemory ? `MEMÓRIA EXISTENTE (mescle com os novos dados, priorizando os mais recentes):\n${JSON.stringify(existingMemory)}` : "Esta é a primeira extração. Crie a memória do zero."}`;

    const userPrompt = `Extraia as decisões estratégicas do MÓDULO ${moduleNumber} abaixo e retorne o JSON atualizado da memória estratégica.

CONTEÚDO DO MÓDULO ${moduleNumber}:
${moduleContent.slice(0, 15000)}`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    const callLovable = () => fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-2.5-flash", messages, temperature: 0.1 }),
    });

    const callGemini = () => fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gemini-2.5-flash", messages, temperature: 0.1 }),
    });

    let response: Response;
    if (LOVABLE_API_KEY) {
      response = await callLovable();
      if ((response.status === 402 || response.status === 429) && GEMINI_API_KEY) {
        console.log(`Lovable AI returned ${response.status}, falling back to Gemini direct`);
        response = await callGemini();
      }
    } else {
      response = await callGemini();
    }

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit excedido. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes para IA." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no gateway AI" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";

    let memory;
    try {
      memory = extractJsonFromResponse(raw);
    } catch (e) {
      console.error("Failed to parse memory JSON:", e, raw.slice(0, 500));
      memory = existingMemory || {};
    }

    // Flatten any nested objects to prevent [object Object]
    memory = flattenValues(memory);

    // Add metadata
    (memory as any)._meta = {
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
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
