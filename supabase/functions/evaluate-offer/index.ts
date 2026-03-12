import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { offerContext, projectContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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
          { role: "user", content: `${projectContext}\n\n========\n\nOFERTA A SER AVALIADA:\n${offerContext}\n\nAvalie esta oferta com base em todo o contexto estratégico acima.` },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no gateway de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("evaluate-offer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
