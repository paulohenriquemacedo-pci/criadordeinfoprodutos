import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { niche, promise, targetAudience, researchData } = await req.json();

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY não configurada. Adicione sua chave pessoal do Google Gemini.");

    const prompt = `Atue como um analista sênior de negócios digitais, especialista em validação de mercado, estratégia de startups, monetização digital e análise competitiva.

Realize uma análise profunda de viabilidade para o seguinte infoproduto/nicho:

PRODUTO:
- Nicho: ${niche || "Não definido"}
- Promessa: ${promise || "Não definida"}
- Público-alvo: ${targetAudience || "Não definido"}
- Mercado principal: Brasil
- Tipo de produto: Infoproduto

${researchData ? `DADOS DE PESQUISA DE MERCADO:\n${researchData}\n` : ""}

Organize a análise nos blocos abaixo.

--------------------------------------------------

BLOCO 1 — PANORAMA DO MERCADO (resumo)

Forneça um resumo executivo rápido (máximo 5 linhas) sobre:
- Tamanho estimado e crescimento do nicho
- Nível de demanda atual
- Tendências mais relevantes

Classifique o potencial como: baixo / moderado / alto / muito alto.

--------------------------------------------------

BLOCO 2 — PERFIL DO PÚBLICO (resumo)

Resumo executivo (máximo 5 linhas) sobre:
- Perfil demográfico e nível de renda
- Principais dores e desejos
- Disposição para pagar por soluções

--------------------------------------------------

BLOCO 3 — CONCORRÊNCIA (resumo)

Resumo executivo (máximo 5 linhas) sobre:
- Players dominantes e saturação
- Nível de diferenciação entre concorrentes

Classifique: baixa / moderada / alta / extremamente competitiva.

--------------------------------------------------

BLOCO 4 — MODELOS DE MONETIZAÇÃO (análise profunda)

Analise quais modelos de negócio funcionam melhor nesse nicho.

Considere: cursos online, mentorias, consultorias, comunidade paga, assinatura, produtos digitais (ebooks, templates), serviços recorrentes, SaaS/ferramentas.

Para cada modelo viável, informe:
- Viabilidade (alta/média/baixa)
- Ticket médio provável
- Complexidade de implementação
- Potencial de escala
- Recomendação estratégica

--------------------------------------------------

BLOCO 5 — CUSTO DE AQUISIÇÃO DE CLIENTES (análise profunda)

Analise a dificuldade de adquirir clientes nesse nicho:
- Concorrência em anúncios (Meta Ads, Google Ads)
- Custo estimado de tráfego (CPL, CPA aproximados)
- Dificuldade de crescimento orgânico
- Dependência de autoridade/marca pessoal
- Ciclo de venda médio

Classifique a dificuldade de aquisição: baixa / moderada / alta. Justifique.

--------------------------------------------------

BLOCO 6 — BARREIRAS DE ENTRADA (análise profunda)

Analise:
- Necessidade de autoridade ou certificações
- Necessidade de equipe
- Complexidade técnica
- Capital inicial necessário
- Necessidade de marca pessoal

Classifique o nível de barreira: baixo / moderado / alto. Justifique.

--------------------------------------------------

BLOCO 7 — OPORTUNIDADES NÃO EXPLORADAS (análise profunda)

Identifique pelo menos 5 oportunidades reais:
- Públicos pouco atendidos
- Novos formatos de produto
- Novas abordagens de marketing
- Novos posicionamentos
- Novas promessas de transformação

Seja específico e acionável.

--------------------------------------------------

BLOCO 8 — RISCOS DO NICHO (análise profunda)

Analise riscos como:
- Saturação futura
- Dependência de plataformas
- Mudanças regulatórias
- Dificuldade de diferenciação
- Fragilidade da demanda

Explique o impacto de cada risco.

--------------------------------------------------

BLOCO 9 — POTENCIAL DE ESCALA (análise profunda)

Avalie:
- Possibilidade de escalar com automação
- Possibilidade de criar múltiplas ofertas (escada de valor)
- Possibilidade de construir comunidade
- Possibilidade de criar ecossistema de produtos

Classifique: baixo / médio / alto / muito alto. Justifique.

--------------------------------------------------

BLOCO 10 — VEREDITO FINAL

Responda claramente:
1. Vale a pena entrar nesse nicho?
2. Para quem esse nicho é ideal?
3. Para quem esse nicho NÃO é recomendado?
4. Qual estratégia de entrada seria mais inteligente?
5. Qual tipo de produto deveria ser criado primeiro?

NOTA FINAL: Atribua uma nota de 0 a 100 para o potencial deste nicho como negócio digital.

--------------------------------------------------

FORMATO OBRIGATÓRIO DA RESPOSTA:
Primeira linha: apenas o número da nota final (0-100), nada mais.
Depois uma linha em branco.
Depois a análise completa organizada por blocos com os headers acima.

REGRAS:
- Evite respostas genéricas.
- Use raciocínio estratégico.
- Destaque oportunidades reais.
- Seja honesto na avaliação.
- Traga insights acionáveis.`;

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
            content: "Você é um analista sênior de negócios digitais especializado em validação de mercado e monetização de infoprodutos no Brasil. Seja objetivo, estratégico e acionável. Responda em português do Brasil.",
          },
          { role: "user", content: prompt },
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
      return new Response(JSON.stringify({ error: "Erro na API do Gemini" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    const lines = content.trim().split("\n");
    const scoreMatch = lines[0].match(/\d+/);
    const score = scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[0]))) : 50;
    const analysis = lines.slice(1).join("\n").trim();

    return new Response(
      JSON.stringify({ score, analysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("viability-score error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
