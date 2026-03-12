import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { filesText } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Você é um especialista em análise de infoprodutos digitais. Sua tarefa é extrair informações estruturadas sobre produto principal, bônus e order bumps/upsells a partir do texto fornecido.

Retorne APENAS um JSON válido (sem markdown, sem backticks) com a seguinte estrutura:

{
  "products": [
    {
      "name": "Nome do produto principal",
      "description": "Descrição detalhada",
      "product_type": "digital",
      "positioning": "Posicionamento/diferencial",
      "delivery_format": "Formato de entrega (ex: ebook, curso online)",
      "target_transformation": "Transformação prometida ao cliente",
      "bonuses": [
        {
          "name": "Nome do bônus",
          "description": "Descrição do bônus",
          "delivery_type": "imediato",
          "strategic_function": "Função estratégica (ex: reduzir objeção)"
        }
      ],
      "bumps": [
        {
          "name": "Nome do bump/upsell",
          "description": "Descrição",
          "bump_type": "order_bump ou upsell ou downsell",
          "trigger_point": "checkout ou pos-compra ou abandono",
          "value_proposition": "Por que o cliente compraria"
        }
      ]
    }
  ]
}

REGRAS:
- Se não encontrar informações sobre bônus ou bumps, retorne arrays vazios
- Se houver múltiplos produtos, liste-os separadamente
- Identifique claramente o que é produto principal, bônus e order bump
- Extraia o máximo de informações relevantes do texto
- product_type pode ser: digital, fisico, servico, hibrido
- delivery_type pode ser: imediato, condicional, progressivo
- bump_type pode ser: order_bump, upsell, downsell
- trigger_point pode ser: checkout, pos-compra, abandono`;

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
          { role: "user", content: `Analise o seguinte material e extraia as informações de produtos, bônus e bumps:\n\n${filesText}` },
        ],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no gateway de IA" }), {
        status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Try to parse the JSON from the response
    let parsed;
    try {
      // Remove potential markdown code blocks
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Não foi possível extrair dados estruturados do material" }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-offer-from-files error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
