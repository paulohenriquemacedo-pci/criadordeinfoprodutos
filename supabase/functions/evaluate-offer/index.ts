import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `Você é um consultor sênior de estratégia de ofertas digitais, especialista em infoprodutos, precificação, arquitetura de valor e otimização de conversão no mercado brasileiro.

Sua tarefa é avaliar a oferta apresentada (produto + bônus + bumps/upsells) com base em todo o contexto estratégico do projeto (módulos M1 a M8).

Estruture sua avaliação nos seguintes blocos:

## 1. NOTA GERAL DA OFERTA (0-100)
Dê uma nota objetiva com justificativa em 2-3 frases.

## 2. ANÁLISE DO PRODUTO PRINCIPAL
- Alinhamento com a persona (M1)
- Coerência com a estrutura proposta (M2)
- Força da promessa e transformação
- Adequação do preço vs valor percebido
- Pontos fortes e fracos

## 3. ANÁLISE DOS BÔNUS
- Relevância estratégica de cada bônus
- Impacto na percepção de valor
- Sugestões de bônus que estão faltando
- Classificação: 🔴 Crítico / 🟡 Importante / 🟢 Nice-to-have

## 4. ANÁLISE DOS BUMPS/UPSELLS
- Coerência com a escada de valor (M8)
- Adequação do trigger_point
- Potencial de aumento de ticket médio
- Sugestões de melhoria

## 5. COERÊNCIA COM A ESTRATÉGIA
- Alinhamento com copy e VSL (M3)
- Compatibilidade com conteúdo orgânico (M4)
- Sinergia com criativos de anúncio (M5)
- Integração com email marketing (M6) e WhatsApp (M7)
- Fit com o funil de vendas (M8)

## 6. RECOMENDAÇÕES PRIORITÁRIAS
Lista de 5-10 ações concretas com prioridade (🔴/🟡/🟢):
- [ ] 🔴 [Ação] — [resultado esperado]

## 7. OPORTUNIDADES NÃO EXPLORADAS
Identifique 3-5 oportunidades que a oferta atual não aproveita, baseado nos dados de pesquisa e estratégia.

REGRAS:
- Seja objetivo e direto
- Use dados dos módulos anteriores para fundamentar cada ponto
- Não repita informações — referencie módulos quando necessário
- Priorize ações que gerem mais impacto na conversão`;

async function callLovableAI(messages: any[], apiKey: string) {
  return await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages,
      stream: true,
    }),
  });
}

async function callGeminiFallback(messages: any[], apiKey: string) {
  const contents = messages
    .filter((m: any) => m.role !== "system")
    .map((m: any) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));

  const systemInstruction = messages.find((m: any) => m.role === "system");
  const body: any = { contents };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction.content }] };
  }

  return await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { offerContext, projectContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `${projectContext}\n\n========\n\nOFERTA A SER AVALIADA:\n${offerContext}\n\nAvalie esta oferta com base em todo o contexto estratégico acima.` },
    ];

    let streamResponse: Response | null = null;

    // Try Lovable AI first
    if (LOVABLE_API_KEY) {
      const response = await callLovableAI(messages, LOVABLE_API_KEY);
      if (response.ok) {
        streamResponse = response;
      } else if ((response.status === 402 || response.status === 429) && GEMINI_API_KEY) {
        console.log(`Lovable AI returned ${response.status}, falling back to Gemini`);
      } else {
        const t = await response.text();
        console.error("AI gateway error:", response.status, t);
        if (!GEMINI_API_KEY) {
          return new Response(JSON.stringify({ error: response.status === 402 ? "Créditos insuficientes." : "Erro no gateway de IA" }), {
            status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // Fallback to Gemini
    if (!streamResponse) {
      if (!GEMINI_API_KEY) {
        return new Response(JSON.stringify({ error: "Nenhuma chave de IA configurada" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const response = await callGeminiFallback(messages, GEMINI_API_KEY);
      if (!response.ok) {
        const t = await response.text();
        console.error("Gemini fallback error:", response.status, t);
        return new Response(JSON.stringify({ error: "Erro no gateway de IA (fallback)" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      streamResponse = response;
    }

    return new Response(streamResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("evaluate-offer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
