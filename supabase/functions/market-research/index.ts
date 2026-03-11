import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { niche, promise, targetAudience, moduleTitle, moduleNumber, customPrompt } = await req.json();

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) throw new Error("PERPLEXITY_API_KEY não configurada");

    // Use custom prompt if provided, otherwise fall back to built-in
    const searchQuery = customPrompt
      ? `Nicho: ${niche || "não definido"}\nPromessa do produto: ${promise || "não definida"}\nPúblico-alvo: ${targetAudience || "não definido"}\nMódulo atual: ${moduleNumber} - ${moduleTitle}\n\n${customPrompt}`
      : buildSearchQuery(niche, promise, targetAudience, moduleTitle, moduleNumber);
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          {
            role: "system",
            content: `Você é um pesquisador de mercado digital especializado em infoprodutos no Brasil. 
Retorne dados objetivos e atualizados sobre o mercado, concorrentes, tendências, público-alvo e oportunidades.
Sempre inclua dados concretos: números, nomes de concorrentes, preços praticados, estratégias observadas.
Responda em português do Brasil.`,
          },
          { role: "user", content: searchQuery },
        ],
        search_recency_filter: "month",
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Perplexity error:", response.status, errText);

      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos Perplexity insuficientes." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Erro na pesquisa de mercado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const citations = data.citations || [];

    return new Response(
      JSON.stringify({ research: content, citations }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("market-research error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildSearchQuery(
  niche: string,
  promise: string,
  targetAudience: string,
  moduleTitle: string,
  moduleNumber: number
): string {
  const base = `Nicho: ${niche || "não definido"}
Promessa do produto: ${promise || "não definida"}
Público-alvo: ${targetAudience || "não definido"}
Módulo atual: ${moduleNumber} - ${moduleTitle}`;

  const moduleQueries: Record<number, string> = {
    1: `${base}

Faça uma pesquisa de mercado completa sobre este nicho no Brasil:
1. Principais concorrentes (nomes, produtos, faixas de preço)
2. Tendências atuais e oportunidades
3. Dores e desejos mais comuns do público-alvo
4. Estratégias de posicionamento que funcionam neste nicho
5. Tamanho estimado do mercado e potencial de crescimento`,

    2: `${base}

Atue como analista sênior de mercado digital especializado em infoprodutos e benchmarking competitivo.
Pesquise sobre estruturação de infoprodutos neste nicho com profundidade:
1. Formatos mais vendidos (curso, mentoria, ebook, comunidade, workshop, imersão, mastermind, templates) — popularidade, percepção de valor, faixa de preço, promessas, vantagens e limitações
2. Estruturas de módulos dos concorrentes — nomes, sequência, duração, metodologia, lacunas e oportunidades
3. Bônus e ofertas complementares — frequência, valor percebido, função estratégica, impacto na conversão
4. Modelos de precificação — tickets, parcelamento, assinatura, escada de valor, ancoragem, upsell/downsell
5. Plataformas de entrega — Hotmart, Kiwify, Eduzz, plataformas próprias, comunidades
Priorize dados reais, compare concorrentes, destaque oportunidades pouco exploradas. Seja estratégico e acionável.`,

    3: `${base}

Atue como especialista sênior em copywriting e análise de funis de venda para infoprodutos.
Pesquise sobre copy e vendas neste nicho com profundidade:
1. Headlines e ganchos que funcionam — padrões estruturais, tipos (promessa direta, curiosidade, mecanismo único, quebra de crença, autoridade, antes/depois), exemplos
2. Estruturas de VSL e páginas de vendas dos concorrentes — sequência de elementos, duração média, storytelling, modelo consolidado ideal
3. Gatilhos mentais predominantes — como são aplicados, em que parte do funil, exemplos de copy
4. Objeções mais comuns do público — origem psicológica, como concorrentes tratam, argumentos de neutralização
5. Promessas e CTAs de alta conversão — tipos de transformação, especificidade, exemplos de CTAs diretos, transformacionais e de urgência
Priorize padrões reais, traga exemplos práticos, destaque oportunidades pouco exploradas. Seja estratégico e acionável.`,

    4: `${base}

Atue como estrategista sênior de marketing de conteúdo, especialista em crescimento orgânico e comportamento de audiência digital.
Pesquise sobre conteúdo orgânico neste nicho com profundidade:
1. Tipos de conteúdo com maior engajamento — educativo, storytelling, dicas, tutoriais, antes/depois, estudos de caso, polêmicas, frameworks. Para cada: objetivo, engajamento, plataformas, exemplos
2. Plataformas onde o público é mais ativo — Instagram, TikTok, YouTube, LinkedIn, Twitter/X, comunidades. Para cada: presença, conteúdo que performa, saturação, oportunidades
3. Influenciadores e criadores de referência — perfis relevantes, estilo, audiência, diferenciais, padrões de crescimento
4. Hashtags e palavras-chave trending — amplas, de nicho, de comunidade, temas virais, perguntas comuns
5. Formatos de conteúdo viral recentes — hooks, estrutura, duração, edição, narrativa, gatilhos explorados
Priorize padrões observáveis, traga exemplos práticos, destaque oportunidades pouco exploradas. Seja estratégico e acionável.`,

    5: `${base}

Atue como especialista sênior em tráfego pago, análise de anúncios digitais e funis de aquisição.
Pesquise sobre anúncios pagos neste nicho com profundidade:
1. Tipos de criativos que mais convertem — UGC, depoimentos, demonstração, storytelling, antes/depois, educacionais, curiosidade. Para cada: objetivo, estágio do funil, elementos visuais, estrutura narrativa, exemplos
2. Plataformas de anúncio mais eficazes — Meta Ads, Google Ads, YouTube Ads, TikTok Ads, LinkedIn Ads, Native Ads. Para cada: adoção, tipo de oferta, formato, vantagens/limitações
3. Ângulos de copy para ads — dor, transformação, mecanismo único, quebra de crença, prova social, curiosidade, autoridade, urgência. Para cada: lógica persuasiva, exemplo de copy
4. Métricas de referência — CPM, CPC, CTR, CPA, custo por lead/venda. Diferenciar por plataforma e estágio do funil
5. Tendências de formato — vídeos curtos, carrossel, UGC, estilo orgânico, storytelling. Por que funcionam e como adaptar
Priorize padrões reais, traga exemplos práticos, destaque oportunidades pouco exploradas. Seja estratégico e acionável.`,

    6: `${base}

Atue como especialista sênior em email marketing, automação e funis de relacionamento.
Pesquise sobre email marketing neste nicho com profundidade:
1. Tipos de sequências mais eficazes — boas-vindas, nutrição, vendas, lançamento, carrinho abandonado, reengajamento, storytelling, urgência. Para cada: objetivo, estrutura, número de emails, exemplos
2. Assuntos de email com maior abertura — curiosidade, promessa, pergunta, storytelling, números, urgência, quebra de padrão, personalização. Para cada: estrutura, exemplo, por que funciona
3. Frequência ideal de envios — semanal, em campanhas, nutrição, promoções. Riscos e equilíbrio valor/vendas
4. Estratégias de segmentação — comportamento, estágio no funil, interesses, compras, engajamento, origem. Impacto em conversão
5. Ferramentas e automações populares — Mailchimp, ActiveCampaign, RD Station, ConvertKit, Brevo. Automações comuns e vantagens
Priorize padrões reais, traga exemplos práticos, destaque oportunidades pouco exploradas. Seja estratégico e acionável.`,

    7: `${base}

Atue como especialista sênior em vendas conversacionais, funis de WhatsApp e automação de atendimento.
Pesquise sobre vendas via WhatsApp neste nicho com profundidade:
1. Estratégias de funil no WhatsApp — captura, qualificação, diagnóstico, apresentação, prova social, oferta, fechamento, follow-up. Modelo típico de funil conversacional
2. Scripts de abordagem — mensagem inicial, qualificação, diagnóstico, oferta, objeções, fechamento. Estilo e exemplos adaptados
3. Automações e ferramentas — WhatsApp Business, API, ManyChat, Zenvia, Take Blip, Kommo, ChatGuru, Wati. Automações comuns e vantagens
4. Métricas de conversão — taxa de resposta, qualificação, conversão, tempo de resposta, mensagens até fechamento. Por origem e ticket
5. Técnicas de follow-up — lembrete, prova social, conteúdo educativo, urgência, ofertas limitadas. Momento ideal e exemplos
Priorize padrões reais, traga exemplos práticos, destaque oportunidades pouco exploradas. Seja estratégico e acionável.`,

    8: `${base}

Atue como estrategista sênior de funis de vendas digitais, especialista em conversão e monetização.
Pesquise sobre funis de vendas neste nicho com profundidade:
1. Estruturas de funil mais usadas — captura, webinar, VSL, lançamento, desafio, tripwire, comunidade. Para cada: objetivo, etapas, tipo de oferta, por que converte
2. Estratégias de upsell/downsell/order bump — tipos de oferta, posicionamento, faixa de preço, impacto no ticket médio. Exemplos adaptados
3. Taxas de conversão de referência — captura, abertura, página de vendas, upsell, order bump, recompra. Por tipo de funil e origem do tráfego
4. Plataformas de checkout — Hotmart, Greenn, Kiwify, Eduzz, Monetizze, Stripe, PerfectPay. Adoção, recursos, vantagens, limitações
5. Estratégias de remarketing — ads, email, WhatsApp, conteúdo, bônus. Momento do funil, mensagem, duração, exemplos
Priorize padrões reais, traga exemplos práticos, destaque oportunidades pouco exploradas. Seja estratégico e acionável.`,
  };

  return moduleQueries[moduleNumber] || `${base}\n\nFaça uma pesquisa de mercado completa e relevante para este módulo.`;
}
