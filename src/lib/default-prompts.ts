// Quality directives applied to ALL modules
export const QUALITY_DIRECTIVES = `

## DIRETRIZES DE QUALIDADE E FORMATAÇÃO (OBRIGATÓRIAS)

### 1. RESUMO EXECUTIVO
No início do documento, inclua uma seção "## RESUMO EXECUTIVO" com:
- 3-5 bullet points dos principais insights/decisões do módulo
- 1 parágrafo de no máximo 3 frases sintetizando a essência estratégica

### 2. FORMATAÇÃO ESTRUTURADA
- Use **tabelas markdown** para comparações (concorrentes, personas lado a lado, precificação, métricas)
- **REGRA DE TABELAS**: Cada célula deve ter no máximo 80 caracteres. Use frases curtas e objetivas. Detalhes extensos devem ir em sub-seções APÓS a tabela, não dentro das células.
- Use **listas numeradas** para sequências e prioridades
- Use **headers hierárquicos** (##, ###) para organização clara
- Evite parágrafos com mais de 4 linhas — quebre em bullets ou sub-seções

### 3. SISTEMA DE PRIORIDADE
Classifique TODAS as recomendações e ações com emojis de prioridade:
- 🔴 **CRÍTICO** — Deve ser feito primeiro, impacto direto no resultado
- 🟡 **IMPORTANTE** — Alto valor, mas pode ser segunda fase  
- 🟢 **OPCIONAL** — Nice-to-have, otimização incremental

### 4. CHECKLIST DE AÇÕES
No final do documento, inclua uma seção "## CHECKLIST DE PRÓXIMOS PASSOS" com:
- 5-10 ações concretas e específicas, cada uma com prioridade (🔴/🟡/🟢)
- Formato: "- [ ] 🔴 [Ação específica] — [resultado esperado]"

### 5. DECISÕES-CHAVE
Inclua uma seção "## DECISÕES-CHAVE DESTE MÓDULO" listando as principais definições estratégicas feitas (ex: ticket escolhido, persona principal, formato do produto). Esses dados serão usados pelos próximos módulos.

### 6. CONCISÃO E ELIMINAÇÃO DE REDUNDÂNCIA
- NÃO repita a mesma citação ou dado em mais de uma seção
- Ao citar fontes, use referência curta entre parênteses (ex: "Pesquisa, Bloco 3")
- Priorize profundidade em poucos pontos em vez de superficialidade em muitos
`;

export const DEFAULT_RESEARCH_PROMPTS: Record<number, string> = {
  1: `Faça uma pesquisa de mercado completa sobre este nicho no Brasil:
1. Principais concorrentes (nomes, produtos, faixas de preço)
2. Tendências atuais e oportunidades
3. Dores e desejos mais comuns do público-alvo
4. Estratégias de posicionamento que funcionam neste nicho
5. Tamanho estimado do mercado e potencial de crescimento`,

  2: `Atue como um analista sênior de mercado digital, especialista em infoprodutos, benchmarking competitivo e estruturação de ofertas educacionais online.
Realize uma pesquisa aprofundada sobre a estruturação de infoprodutos neste nicho, considerando o mercado brasileiro e o público-alvo definido.

Analise os seguintes pontos com profundidade:

1. FORMATOS MAIS VENDIDOS
Identifique os formatos mais populares e comercialmente viáveis (curso gravado, mentoria em grupo/individual, consultoria, ebook, comunidade/assinatura, workshop, imersão, desafio pago, mastermind, templates/kits prontos).
Para cada formato: nível de popularidade, percepção de valor, faixa de preço comum, promessas de transformação, vantagens e limitações.

2. ESTRUTURAS DE MÓDULOS E CONTEÚDO DOS CONCORRENTES
Mapeie como os concorrentes estruturam seus produtos: nomes dos módulos, sequência lógica, duração estimada, profundidade, metodologia, foco da transformação.
Gere um padrão consolidado com: módulos mais recorrentes, jornada de aprendizagem típica, lacunas pouco exploradas, oportunidades de diferenciação.

3. BÔNUS E OFERTAS COMPLEMENTARES POPULARES
Liste os bônus mais usados (aulas bônus, comunidade fechada, sessões ao vivo, templates, checklists, planilhas, certificação, grupos WhatsApp/Telegram, suporte, mentorias coletivas, biblioteca de materiais, atualizações futuras).
Para cada: frequência de uso, valor percebido, função estratégica, impacto na conversão.

4. MODELOS DE PRECIFICAÇÃO PRATICADOS
Analise: ticket de entrada/intermediário/premium, pagamento único vs parcelamento vs assinatura, escada de valor, upsell/downsell/order bump.
Apresente: faixas de preço por tipo, lógica de precificação, relação formato-profundidade-preço, ancoragem de valor, oportunidades de posicionamento.

5. PLATAFORMAS MAIS USADAS PARA ENTREGA
Identifique plataformas para hospedagem, pagamentos, comunidade, suporte, entrega (Hotmart, Kiwify, Eduzz, Monetizze, HeroSpark, Kajabi, plataformas próprias, Telegram, WhatsApp, Discord, Circle).
Para cada: frequência de uso, perfil de produto ideal, vantagens, limitações.

FORMATO DE SAÍDA em 7 blocos:
Bloco 1: Visão geral do nicho de infoprodutos
Bloco 2: Formatos mais vendidos
Bloco 3: Estruturas de módulos dos concorrentes
Bloco 4: Bônus e ofertas complementares
Bloco 5: Modelos de precificação
Bloco 6: Plataformas mais usadas
Bloco 7: Recomendações estratégicas finais (3 oportunidades de diferenciação, 3 formatos promissores, 1 estrutura sugerida de produto ideal, 1 faixa de preço, 1 stack de bônus, 1 plataforma recomendada)

REGRAS: Não dê respostas genéricas. Priorize padrões reais e recorrentes. Sinalize hipóteses quando não houver confirmação. Compare concorrentes. Destaque oportunidades pouco exploradas. Seja estratégico, objetivo e acionável.`,

  3: `Atue como um especialista sênior em copywriting, marketing digital e análise de funis de venda para infoprodutos.
Realize uma pesquisa aprofundada sobre estratégias de copy e vendas utilizadas neste nicho no Brasil.

Analise os seguintes pontos:

1. HEADLINES E GANCHOS QUE ESTÃO FUNCIONANDO
Identifique padrões de headlines dos players relevantes: estrutura, promessa central, tipo de transformação, linguagem (direta, aspiracional, curiosidade, dor).
Classifique por tipo (promessa direta, curiosidade, mecanismo único, quebra de crença, autoridade, antes/depois, velocidade de resultado).
Para cada tipo: padrão estrutural, exemplos adaptados ao nicho, por que funciona para esse público.

2. ESTRUTURAS DE VSL E PÁGINAS DE VENDAS DOS CONCORRENTES
Mapeie a sequência de elementos: hook inicial, identificação da dor, história/autoridade, agitação, quebra de crenças, mecanismo único, solução, prova social, oferta, bônus, garantia, urgência/escassez, CTA.
Apresente: estrutura mais comum, elementos recorrentes, duração média das VSLs, nível de storytelling, padrões de construção de desejo.
Gere um modelo consolidado de estrutura de VSL ideal para o nicho.

3. GATILHOS MENTAIS MAIS EFICAZES
Identifique os gatilhos predominantes (autoridade, prova social, escassez, urgência, especificidade, curiosidade, antecipação, pertencimento, simplicidade, mecanismo único, novidade, contraste antes/depois).
Para cada: como é aplicado, em que parte do funil aparece, exemplos de copy no nicho.

4. OBJEÇÕES MAIS COMUNS DO PÚBLICO
Identifique as principais objeções (preço, tempo, confiança, medo de não aplicar, ceticismo, experiências negativas, dúvida sobre resultados).
Para cada: origem psicológica, como concorrentes tratam, exemplos de argumentos/copy usados para neutralizar.

5. PROMESSAS E CTAs DE ALTA CONVERSÃO
Analise padrões de promessas: tipo de transformação, prazo/velocidade, especificidade, diferenciação.
Exemplos de CTAs: diretos, orientados à transformação, baseados em urgência, baseados em curiosidade.

FORMATO DE SAÍDA em 7 blocos:
Bloco 1: Panorama da comunicação de marketing no nicho
Bloco 2: Padrões de headlines e ganchos
Bloco 3: Estruturas de VSL e páginas de vendas
Bloco 4: Gatilhos mentais predominantes
Bloco 5: Principais objeções do público
Bloco 6: Promessas e CTAs de alta conversão
Bloco 7: Recomendações estratégicas (5 padrões de copy que mais convertem, 3 erros comuns em páginas de vendas, 3 oportunidades de diferenciação em copy, 3 estruturas de headline para testar, 1 estrutura de VSL otimizada, 5 headlines prontas para teste, 3 CTAs otimizados)

REGRAS: Evite respostas genéricas. Priorize padrões recorrentes. Traga exemplos práticos. Destaque oportunidades pouco exploradas. Seja estratégico, objetivo e aplicável.`,

  4: `Atue como um estrategista sênior de marketing de conteúdo, especialista em crescimento orgânico, análise de redes sociais e comportamento de audiência digital.
Realize uma pesquisa aprofundada sobre estratégias de conteúdo orgânico utilizadas neste nicho no Brasil.

Analise os seguintes pontos:

1. TIPOS DE CONTEÚDO COM MAIOR ENGAJAMENTO
Identifique quais tipos geram mais interação: educativo, storytelling pessoal, dicas rápidas, tutoriais, antes/depois, estudos de caso, opiniões polêmicas, mitos vs verdades, listas/frameworks, tendências, bastidores, motivacional, aspiracional.
Para cada: objetivo principal, nível médio de engajamento, plataformas onde funciona melhor, por que conecta com o público, exemplos de ideias de posts.

2. PLATAFORMAS ONDE O PÚBLICO É MAIS ATIVO
Analise: Instagram, TikTok, YouTube, YouTube Shorts, LinkedIn, Twitter/X, Facebook, comunidades (Discord, Telegram, WhatsApp), blogs/SEO.
Para cada: nível de presença do público, tipo de conteúdo que performa, comportamento da audiência, tipo de criador que se destaca, nível de saturação.
Identifique quais oferecem maior oportunidade de crescimento orgânico atualmente.

3. INFLUENCIADORES E CRIADORES DE REFERÊNCIA
Para cada criador relevante: nome/perfil, plataforma principal, tipo de conteúdo, estilo de comunicação, tamanho da audiência, diferencial de engajamento.
Identifique padrões entre os que mais crescem e estratégias de fidelização de audiência.

4. HASHTAGS E PALAVRAS-CHAVE TRENDING
Separe em: hashtags amplas (alto alcance, alta concorrência), hashtags de nicho (audiência qualificada), hashtags de comunidade (identificação de público).
Identifique: palavras-chave populares em títulos, temas recorrentes em posts virais, perguntas comuns da audiência.

5. FORMATOS DE CONTEÚDO VIRAL RECENTES
Analise: tipos de hook nos primeiros segundos, estrutura do conteúdo, duração média, estilo de edição, narrativa, uso de storytelling/curiosidade.
Explique: por que geram alcance, quais emoções/gatilhos são explorados, como adaptar para novos criadores.

FORMATO DE SAÍDA em 7 blocos:
Bloco 1: Panorama do conteúdo orgânico no nicho
Bloco 2: Tipos de conteúdo com maior engajamento
Bloco 3: Plataformas com maior atividade do público
Bloco 4: Influenciadores e criadores de referência
Bloco 5: Hashtags e palavras-chave relevantes
Bloco 6: Formatos de conteúdo viral recentes
Bloco 7: Recomendações estratégicas (10 ideias de conteúdo, 5 formatos com maior potencial, 5 hooks fortes, 3 estratégias de crescimento rápido, 1 estratégia de autoridade, 1 estratégia de comunidade, calendário semanal básico)

REGRAS: Evite respostas genéricas. Priorize padrões observáveis. Traga exemplos práticos. Destaque oportunidades pouco exploradas. Seja estratégico, claro e acionável.`,

  5: `Atue como um especialista sênior em tráfego pago, análise de anúncios digitais e funis de aquisição de clientes.
Realize uma pesquisa aprofundada sobre estratégias de anúncios pagos utilizadas neste nicho no Brasil.

Analise os seguintes pontos:

1. TIPOS DE CRIATIVOS QUE MAIS CONVERTEM
Identifique os criativos mais utilizados: vídeos curtos UGC, depoimentos, demonstração de produto, storytelling pessoal, antes/depois, provas de resultado, educacionais, curiosidade, comparação, autoridade/especialista.
Para cada: objetivo, estágio do funil, elementos visuais, estrutura narrativa, por que converte, exemplos adaptados ao nicho.

2. PLATAFORMAS DE ANÚNCIO MAIS EFICAZES
Analise: Meta Ads, Google Ads, YouTube Ads, TikTok Ads, LinkedIn Ads, Pinterest Ads, Native Ads (Outbrain/Taboola).
Para cada: nível de adoção, tipo de oferta que performa, estágio do funil, formato predominante, vantagens e limitações.
Identifique quais oferecem maior oportunidade atualmente.

3. ÂNGULOS DE COPY PARA ANÚNCIOS
Analise ângulos: dor do público, promessa de transformação, mecanismo único, quebra de crença, prova social, curiosidade, autoridade, urgência, comparação com método antigo, erro comum.
Para cada: lógica persuasiva, etapa do funil, exemplo de copy adaptado, tipo de criativo que combina.

4. MÉTRICAS DE REFERÊNCIA (BENCHMARKS)
Apresente benchmarks: CPM, CPC, CTR, CPA, taxa de conversão, custo por lead, custo por venda.
Diferencie por plataforma, tipo de criativo e estágio do funil.
Explique fatores que influenciam: qualidade da copy, saturação, qualidade do público, qualidade da landing page.

5. TENDÊNCIAS DE FORMATOS DE ANÚNCIO
Analise formatos em alta: vídeos curtos reels/tiktok, carrossel educacional, UGC, estilo orgânico, storytelling, demonstração.
Para cada: por que funciona, qual oferta combina, elementos que aumentam conversão, como adaptar para novos anunciantes.

FORMATO DE SAÍDA em 7 blocos:
Bloco 1: Panorama dos anúncios pagos no nicho
Bloco 2: Tipos de criativos mais utilizados
Bloco 3: Plataformas de anúncio mais eficazes
Bloco 4: Ângulos de copy mais utilizados
Bloco 5: Benchmarks de métricas
Bloco 6: Tendências de formatos de anúncios
Bloco 7: Recomendações estratégicas (10 criativos com maior potencial, 10 ângulos de copy para testar, 3 erros comuns, 3 oportunidades pouco exploradas, 10 ideias de criativos prontos, 3 estruturas para aquisição, 2 estruturas para remarketing)

REGRAS: Evite respostas genéricas. Priorize padrões recorrentes. Traga exemplos práticos. Destaque oportunidades pouco exploradas. Seja estratégico, claro e acionável.`,

  6: `Atue como um especialista sênior em email marketing, automação de marketing e funis de relacionamento com clientes.
Realize uma pesquisa aprofundada sobre estratégias de email marketing utilizadas neste nicho no Brasil.

Analise os seguintes pontos:

1. TIPOS DE SEQUÊNCIAS DE EMAIL MAIS EFICAZES
Identifique as sequências mais utilizadas: boas-vindas, nutrição, vendas, lançamento, recuperação de carrinho, reengajamento, educacional, prova social, storytelling, urgência/fechamento.
Para cada: objetivo, momento do funil, número médio de emails, estrutura típica, tipo de conteúdo, por que funciona. Inclua exemplos adaptados ao nicho.

2. ASSUNTOS DE EMAIL COM MAIOR ABERTURA
Classifique os tipos: curiosidade, promessa de valor, pergunta direta, storytelling, números/listas, urgência, quebra de padrão, personalização.
Para cada: estrutura do assunto, exemplo adaptado, por que gera abertura, contexto em que funciona melhor.

3. FREQUÊNCIA IDEAL DE ENVIO
Analise: frequência semanal comum, durante campanhas/lançamentos, durante nutrição, durante promoções.
Explique: por que funciona, riscos de excesso ou escassez, como equilibrar valor e vendas.

4. ESTRATÉGIAS DE SEGMENTAÇÃO
Analise segmentações por: comportamento do usuário, estágio no funil, interesse em temas, histórico de compras, engajamento com emails, origem do lead.
Explique: tipos mais comuns, impacto em abertura e conversão, exemplos de campanhas por segmento.

5. FERRAMENTAS E AUTOMAÇÕES POPULARES
Analise: Mailchimp, ActiveCampaign, RD Station, HubSpot, ConvertKit, Brevo, Klaviyo, GetResponse.
Para cada: adoção no nicho, automações mais usadas, vantagens, limitações.
Identifique automações comuns: boas-vindas, nutrição, recuperação, vendas, reengajamento.

FORMATO DE SAÍDA em 7 blocos:
Bloco 1: Panorama do email marketing no nicho
Bloco 2: Tipos de sequências mais eficazes
Bloco 3: Assuntos de email com maior abertura
Bloco 4: Frequência ideal de envios
Bloco 5: Estratégias de segmentação
Bloco 6: Ferramentas e automações populares
Bloco 7: Recomendações estratégicas (5 sequências essenciais, 10 assuntos para teste, 5 emails de alto valor para nutrição, 3 estratégias de segmentação que aumentam conversão, 3 erros comuns, 1 estrutura de funil de email completo)

REGRAS: Evite respostas genéricas. Priorize padrões recorrentes. Traga exemplos práticos. Destaque oportunidades pouco exploradas. Seja estratégico, claro e acionável.`,

  7: `Atue como um especialista sênior em vendas conversacionais, funis de WhatsApp e automação de atendimento para marketing digital.
Realize uma pesquisa aprofundada sobre estratégias de vendas via WhatsApp utilizadas neste nicho no Brasil.

Analise os seguintes pontos:

1. ESTRATÉGIAS DE FUNIL NO WHATSAPP
Identifique estruturas de funil mais utilizadas: captura do lead, primeira mensagem automática, qualificação, diagnóstico, apresentação da solução, prova social, oferta/fechamento, follow-up.
Para cada etapa: objetivo, tipo de mensagem, abordagem comum, como concorrentes conduzem, por que converte. Apresente modelo típico de funil conversacional.

2. SCRIPTS DE ABORDAGEM UTILIZADOS
Analise scripts: mensagem inicial, qualificação, diagnóstico, apresentação da oferta, tratamento de objeções, fechamento.
Para cada: objetivo, estrutura, estilo de comunicação (consultivo, direto, educativo), exemplo adaptado ao nicho.

3. AUTOMAÇÕES E FERRAMENTAS POPULARES
Analise: WhatsApp Business, WhatsApp Business API, ManyChat, Zenvia, Take Blip, Kommo, RD Station Conversas, ChatGuru, Wati, bots de atendimento.
Para cada: adoção no nicho, automações utilizadas, vantagens, limitações.
Automações comuns: mensagem inicial, qualificação automática, roteamento, envio de conteúdo, lembretes/follow-ups.

4. MÉTRICAS DE CONVERSÃO DE REFERÊNCIA
Benchmarks: taxa de resposta inicial, qualificação, conversão para venda, tempo médio de resposta, mensagens até fechamento, conversão após follow-up.
Diferencie por origem do lead, tipo de oferta e ticket. Explique fatores que influenciam.

5. TÉCNICAS DE FOLLOW-UP EFICAZES
Analise: lembrete suave, prova social, conteúdo educativo, reforço da dor, reforço do benefício, urgência, ofertas limitadas.
Para cada: momento ideal, tom da comunicação, estrutura da mensagem, exemplo adaptado.

FORMATO DE SAÍDA em 7 blocos:
Bloco 1: Panorama das vendas via WhatsApp no nicho
Bloco 2: Estruturas de funil de WhatsApp
Bloco 3: Scripts de abordagem utilizados
Bloco 4: Automações e ferramentas populares
Bloco 5: Benchmarks de métricas de conversão
Bloco 6: Técnicas de follow-up eficazes
Bloco 7: Recomendações estratégicas (1 modelo completo de funil, 5 mensagens de abordagem inicial, 5 mensagens de follow-up, 3 estratégias para aumentar taxa de resposta, 3 erros comuns, 3 oportunidades pouco exploradas)

REGRAS: Evite respostas genéricas. Priorize padrões recorrentes. Traga exemplos práticos. Destaque oportunidades pouco exploradas. Seja estratégico, claro e acionável.`,

  8: `Atue como um estrategista sênior de funis de vendas digitais, especialista em otimização de conversão, monetização de ofertas e estruturação de jornadas de compra online.
Realize uma pesquisa aprofundada sobre funis de vendas utilizados neste nicho no Brasil.

Analise os seguintes pontos:

1. ESTRUTURAS DE FUNIL MAIS USADAS
Identifique os tipos: funil de captura, webinar, VSL, conteúdo + oferta, lançamento, desafio, diagnóstico/consultoria, vendas diretas, tripwire, comunidade/assinatura.
Para cada: objetivo, estrutura das etapas, tipo de oferta, estágio do público ideal, por que converte. Descreva exemplo de jornada de compra.

2. ESTRATÉGIAS DE UPSELL, DOWNSELL E ORDER BUMP
Analise como concorrentes monetizam dentro do funil:
- Order bump: oferta adicional no checkout
- Upsell: oferta complementar após compra
- Downsell: alternativa se upsell recusado
Para cada: tipo de oferta, posicionamento no funil, faixa de preço, proposta de valor, impacto no ticket médio. Exemplos adaptados ao nicho.

3. TAXAS DE CONVERSÃO DE REFERÊNCIA
Benchmarks: conversão da página de captura, abertura de webinar/VSL, conversão da página de vendas, compra do produto principal, aceitação de upsell, aceitação de order bump, taxa de recompra.
Diferencie por tipo de funil, origem do tráfego e ticket. Explique fatores que influenciam.

4. PLATAFORMAS DE CHECKOUT MAIS POPULARES
Analise: Hotmart, Greenn, Kiwify, Eduzz, Monetizze, Stripe, Shopify, Cartpanda, PerfectPay, Yampi.
Para cada: adoção no nicho, produtos mais vendidos, recursos (upsell, order bump, recorrência), vantagens, limitações.

5. ESTRATÉGIAS DE REMARKETING QUE FUNCIONAM
Analise: remarketing de anúncios, por email, via WhatsApp, por conteúdo, com bônus/incentivo.
Para cada: momento do funil, tipo de mensagem, duração da campanha, exemplos adaptados.

FORMATO DE SAÍDA em 7 blocos:
Bloco 1: Panorama dos funis de vendas no nicho
Bloco 2: Estruturas de funil mais utilizadas
Bloco 3: Estratégias de upsell, downsell e order bump
Bloco 4: Benchmarks de conversão
Bloco 5: Plataformas de checkout populares
Bloco 6: Estratégias de remarketing
Bloco 7: Recomendações estratégicas (3 estruturas de funil ideais, 5 ideias de upsell, 3 ideias de order bump, 2 ideias de downsell, 3 estratégias de remarketing, 3 erros comuns, 3 oportunidades de monetização pouco exploradas)

REGRAS: Evite respostas genéricas. Priorize padrões recorrentes. Traga exemplos práticos. Destaque oportunidades pouco exploradas. Seja estratégico, claro e acionável.`,
};

export const DEFAULT_GENERATION_PROMPTS: Record<number, string> = {
  1: `Você é um estrategista sênior de infoprodutos com experiência em lançamentos de 7 dígitos no Brasil. Crie um briefing estratégico completo incluindo:
- Análise do posicionamento ideal no mercado (com tabela comparativa de concorrentes)
- Proposta de valor única e diferenciada
- Persona detalhada do cliente ideal (tabela com dados demográficos, dores, aspirações)
- Mapeamento de concorrentes e oportunidades (tabela: nome | produto | preço | pontos fortes | pontos fracos | nosso diferencial)
- Estratégia de precificação sugerida (tabela value ladder com tickets e justificativas)
Use os dados da pesquisa de mercado para fundamentar cada recomendação com dados reais.`,

  2: `Você é um estrategista de produto digital e designer instrucional especializado em infoprodutos de alto impacto no Brasil.
Com base na pesquisa de mercado realizada, transforme os achados em uma proposta de infoproduto altamente competitiva.

Desenvolva:
1. **Melhor formato de infoproduto** para lançar (com justificativa baseada nos dados da pesquisa)
2. **Nome provisório da oferta** (3 opções criativas)
3. **Promessa principal** clara e vendável
4. **Público-alvo ideal** refinado (tabela: demográficos | dores | aspirações | nível de consciência)
5. **Mecanismo único ou diferencial** — o que torna esta oferta diferente de tudo no mercado
6. **Estrutura de módulos sugerida** (tabela: módulo | título | objetivo | duração estimada | entrega-chave)
7. **Bônus recomendados** (tabela: bônus | valor percebido | custo real | impacto na conversão | função estratégica)
8. **Faixa de preço ideal** com ancoragem de valor e justificativa
9. **Modelo de entrega** (plataforma, formato, cronograma)
10. **Escada de valor sugerida** (tabela: nível | produto | preço | objetivo | próximo passo)
11. **Order bumps e upsells** com lógica de value ladder
12. **Principais argumentos de venda** (5-7 bullets transformacionais)

No final, entregue:
- Uma **versão enxuta da oferta** (produto mínimo viável)
- Uma **versão premium** (oferta completa com todos os bônus)
- **Recomendação** de qual lançar primeiro e por quê
- **Cronograma de produção** sugerido (tabela com marcos e prazos)

REGRAS IMPORTANTES DE FORMATAÇÃO PARA TABELAS:
- Cada célula de tabela deve ter NO MÁXIMO 80 caracteres. Se precisar de mais detalhes, coloque-os em bullets ABAIXO da tabela.
- Use descrições curtas e objetivas dentro das tabelas — elas são para visão geral rápida.
- Detalhamentos extensos devem vir em sub-seções separadas após cada tabela.

Baseie-se nos dados de mercado e nas DECISÕES-CHAVE do Módulo 1 (persona, posicionamento, ticket).`,

  3: `Você é um copywriter de resposta direta e estrategista de vendas especialista em infoprodutos no Brasil.
Com base na pesquisa de copy e vendas realizada, crie todo o arsenal de comunicação persuasiva do produto.

Desenvolva:

1. **Headlines** — Principal + 5 variações (tabela: headline | tipo/ângulo | emoção-alvo | onde usar)
2. **Estrutura completa de VSL** com timestamps, transições e notas de direção
3. **Página de vendas completa** com todas as seções:
   - Above the fold (headline + sub-headline + CTA)
   - Identificação do problema (agitação da dor)
   - Apresentação do mecanismo único
   - Solução e método
   - Prova social e autoridade
   - Oferta detalhada com ancoragem de valor
   - Bônus com valor percebido
   - Garantia estratégica
   - FAQ com tratamento de objeções
   - CTA final com urgência
4. **Bullet points transformacionais** (15-20 bullets focados em resultados, não features)
5. **Tratamento das 7 principais objeções** (tabela: objeção | origem psicológica | argumento de contorno | exemplo de copy)
6. **CTAs estratégicos** para cada etapa do funil (tabela: etapa | CTA | gatilho usado | variação)
7. **Scripts de garantia** (3 versões: incondicional, condicional, híbrida)

Use EXATAMENTE a persona, ticket e posicionamento definidos nos módulos anteriores.
Alinhe tom de voz com o público-alvo identificado no M1.`,

  4: `Você é um estrategista sênior de conteúdo orgânico com foco em crescimento de audiência e conversão para infoprodutos no Brasil.
Com base na pesquisa de conteúdo orgânico realizada, crie um plano completo e acionável.

Desenvolva:

1. **3 Pilares de conteúdo** alinhados ao produto e à persona (tabela: pilar | objetivo | exemplos de temas | frequência)
2. **Calendário editorial de 30 dias** (tabela: dia | plataforma | formato | tema | pilar | CTA | objetivo)
3. **10 scripts/roteiros completos** para posts de alta conversão:
   - 3 posts educativos
   - 2 storytelling/bastidores
   - 2 posts de autoridade/prova social
   - 2 posts de engajamento/debate
   - 1 post de venda direta
   Para cada: hook, corpo, CTA, hashtags sugeridas
4. **Estratégia por plataforma** (tabela: plataforma | formato ideal | frequência | tom de voz | métrica-chave | prioridade)
5. **Funil de conteúdo**: atração → engajamento → conversão com métricas esperadas por etapa
6. **5 hooks virais** adaptados ao nicho com estrutura e justificativa
7. **Estratégia de crescimento de comunidade** (grupo WhatsApp/Telegram, lives, interação)
8. **KPIs e métricas** de acompanhamento (tabela: métrica | meta semanal | meta mensal | ferramenta)

Use os ângulos da copy (M3), a persona do briefing (M1) e o produto estruturado (M2).`,

  5: `Você é um especialista sênior em tráfego pago para infoprodutos digitais no Brasil.
Com base na pesquisa de anúncios pagos realizada, crie um plano completo de mídia paga.

Desenvolva:

1. **10 ângulos de criativo** diferentes (tabela: ângulo | hook | público-alvo | formato | plataforma | CTA | estágio do funil)
2. **Headlines e textos de anúncio completos** para cada ângulo:
   - Primary text (corpo do anúncio)
   - Headline
   - Description
   - CTA
3. **Roteiros de vídeo** para os 5 melhores ângulos (hook → problema → solução → prova → CTA, com timestamps)
4. **Sugestões de segmentação detalhadas**:
   - Interesses (tabela: interesse | justificativa | tamanho estimado)
   - Lookalikes recomendados
   - Públicos de retargeting (visitantes, engajamento, carrinho)
   - Exclusões recomendadas
5. **Estratégia de escala** com orçamentos por fase (tabela: fase | duração | budget diário | objetivo | KPI alvo | ação se não performar)
6. **Métricas de referência e KPIs alvo** (tabela: métrica | benchmark do nicho | meta conservadora | meta otimista)
7. **Estrutura de campanha** recomendada (campanhas, conjuntos, anúncios) para Meta Ads e Google Ads
8. **Estratégia de remarketing** com sequência de anúncios por etapa do funil

Use as headlines e objeções do M3, o conteúdo orgânico do M4 e o público do M1.`,

  6: `Você é um especialista sênior em email marketing para infoprodutos, lançamentos e perpétuos no Brasil.
Com base na pesquisa de email marketing realizada, crie um sistema completo de email marketing.

Desenvolva:

1. **Sequência de boas-vindas** (5-7 emails):
   Para cada email: assunto | preview text | objetivo | corpo completo | CTA | timing após inscrição
2. **Sequência de vendas/lançamento** (7-10 emails):
   Para cada: assunto | gatilho mental | corpo | CTA | dia de envio
3. **Sequência de nutrição** (5 emails de alto valor):
   Para cada: assunto | tipo de conteúdo | corpo | link para conteúdo
4. **3 emails de carrinho abandonado** com timing específico (1h, 24h, 48h)
5. **Sequência de reengajamento** (3 emails para leads inativos)
6. **Assuntos com alto potencial de abertura** (tabela: assunto | técnica usada | tipo de sequência | taxa esperada) — mínimo 15 assuntos
7. **Estratégia de segmentação** (tabela: segmento | critério | sequência ativada | frequência | objetivo)
8. **Automações recomendadas** (tabela: automação | gatilho | ação | sequência | ferramenta sugerida)
9. **Calendário de envios** semanal e mensal com tipos de email

Alinhe tom de voz com a copy (M3) e persona (M1). Use os argumentos de venda do M2.`,

  7: `Você é um especialista sênior em vendas consultivas via WhatsApp para infoprodutos no Brasil.
Com base na pesquisa de vendas via WhatsApp realizada, crie um sistema completo de vendas conversacionais.

Desenvolva:

1. **Funil completo de WhatsApp** com todas as etapas:
   - Captação → Boas-vindas → Qualificação → Diagnóstico → Apresentação → Prova social → Oferta → Fechamento → Pós-venda
   Para cada etapa: objetivo | mensagem modelo | timing | gatilho para próxima etapa
2. **Scripts completos de abordagem** (5 variações por tipo de lead):
   - Lead frio (orgânico)
   - Lead quente (anúncio)
   - Lead indicação
   - Reativação de lead antigo
   Para cada: abertura | qualificação | transição para oferta
3. **Scripts de tratamento de objeções** (tabela: objeção | resposta modelo | técnica usada | variação alternativa)
4. **Scripts de fechamento** (3 técnicas: fechamento direto, fechamento por escassez, fechamento consultivo)
5. **Sequência de follow-up** completa (7 mensagens com timing):
   Para cada: mensagem | hora/dia de envio | gatilho | objetivo
6. **Automações sugeridas** (tabela: gatilho | ação automática | mensagem | timing | ferramenta)
7. **Templates de mensagens** para cada etapa do funil (prontos para copiar e usar)
8. **Estratégia de grupos e listas de transmissão** com regras de uso e frequência
9. **Métricas e KPIs** de acompanhamento (tabela: métrica | meta | ferramenta de tracking)

Use o tom de voz da copy (M3), complemente o email (M6) e alinhe com o funil de ads (M5).`,

  8: `Você é um arquiteto sênior de funis de vendas de alta conversão para infoprodutos no Brasil.
Com base na pesquisa de funis realizada, crie a arquitetura completa do funil de vendas integrando TODOS os canais dos módulos anteriores.

Desenvolva:

1. **Funil completo com todas as etapas** (diagrama em texto + descrição detalhada de cada etapa):
   - Topo: Atração e captura (orgânico M4 + ads M5)
   - Meio: Nutrição e engajamento (email M6 + conteúdo M4)
   - Fundo: Conversão (página de vendas M3 + WhatsApp M7)
   - Pós-venda: Retenção e upsell
   Para cada etapa: objetivo | canal | ação do lead | métrica-chave | página/ferramenta
2. **Estratégia de monetização** (tabela: oferta | tipo (upsell/downsell/order bump) | trigger | preço | valor percebido | conversão esperada | posição no funil)
3. **Páginas necessárias** (tabela: página | objetivo | elementos essenciais | copy principal | KPI | ferramenta sugerida)
4. **Métricas e KPIs por etapa** (tabela: etapa do funil | métrica | benchmark do nicho | meta conservadora | meta otimista | ação se abaixo da meta)
5. **Plano de remarketing multicanal**:
   - Remarketing por ads (públicos, criativos, frequência)
   - Remarketing por email (sequência específica)
   - Remarketing por WhatsApp (scripts de recuperação)
   - Remarketing por conteúdo (posts estratégicos)
   Para cada: timing | mensagem | canal | objetivo
6. **Estratégia de recuperação de carrinho** (sequência completa: email + WhatsApp + ads)
7. **Escada de valor completa** (tabela: nível | produto | preço | objetivo | taxa de conversão esperada | próximo passo)
8. **Stack tecnológico recomendado** (tabela: função | ferramenta | custo | alternativa)
9. **Cronograma de implementação** (tabela: semana | ação | responsável | entregável | dependência)

Integre TODOS os canais: copy (M3), conteúdo orgânico (M4), tráfego pago (M5), email (M6) e WhatsApp (M7) em uma jornada coesa e otimizada.`,
};
