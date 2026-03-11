# 📋 DOCUMENTAÇÃO COMPLETA — Orquestrador de Infoprodutos

> **Versão:** 1.0  
> **Data:** 10 de Março de 2026  
> **Objetivo:** Backup completo para recriação da plataforma no Lovable  

---

## 1. VISÃO GERAL DO PROJETO

**Nome:** Orquestrador de Infoprodutos  
**Tipo:** Plataforma SaaS  
**Descrição:** Plataforma que utiliza IA generativa para guiar criadores no desenvolvimento completo de infoprodutos (cursos, ebooks ou mentorias) através de um workflow estruturado de 8 módulos de produção + 1 módulo de auditoria de coerência.

**URL Publicada:** https://orquestradorinfoprodutos.lovable.app

---

## 2. STACK TECNOLÓGICA

| Tecnologia | Uso |
|---|---|
| React 18 | Framework frontend |
| Vite 5 | Bundler/Dev server |
| TypeScript | Tipagem estática |
| Tailwind CSS 3 | Estilização |
| shadcn/ui | Componentes base (Radix UI) |
| Framer Motion | Animações |
| Lovable Cloud (Supabase) | Backend (banco, auth, storage, edge functions) |
| Lovable AI Gateway | IA generativa (modelos Google Gemini) |
| Perplexity API | Pesquisa de mercado com dados web reais |
| jsPDF | Exportação de documentos PDF |
| React Query (TanStack) | Gerenciamento de estado server-side |
| React Router DOM | Roteamento SPA |
| date-fns | Formatação de datas |
| react-resizable-panels | Painéis redimensionáveis |

---

## 3. FUNCIONALIDADES DA PLATAFORMA

### 3.1 Fluxo de Criação Duplo
A plataforma oferece dois caminhos:
- **"Do Zero"**: O usuário preenche o briefing (nome, nicho, promessa, público-alvo) e a IA desenvolve todo o produto.
- **"Produto Existente"**: O usuário envia PDFs (Livro Principal, Bônus, Order Bumps) e a IA analisa e complementa o projeto com base no material.

### 3.2 Workflow Modular (9 módulos)
| Módulo | Título | Descrição |
|---|---|---|
| M0 | Orquestrador de Coerência | Valida integridade e coerência entre todos os módulos |
| M1 | Briefing Estratégico | Base estratégica: posicionamento, persona, concorrentes |
| M2 | Estrutura do Produto | Arquitetura completa: módulos, bônus, precificação |
| M3 | Copy e VSL | Headlines, página de vendas, objeções, CTAs |
| M4 | Conteúdo Orgânico | Calendário editorial 30 dias, pilares de conteúdo |
| M5 | Criativos de Anúncio | 5 ângulos de criativo, segmentação, KPIs |
| M6 | E-mail Marketing | Sequências de email: boas-vindas, vendas, carrinho |
| M7 | Funil WhatsApp | Scripts, automações, templates de mensagem |
| M8 | Funil de Vendas | Funil completo: upsell, downsell, remarketing |

### 3.3 Sistema de Pesquisa de Mercado
Cada módulo possui pesquisa integrada com dois provedores:
- **Perplexity (sonar-pro)**: Busca dados reais da web com citações
- **Lovable IA (Gemini)**: Análise baseada em conhecimento do modelo

A pesquisa pode ser refinada iterativamente antes da geração.

### 3.4 Geração de Conteúdo com IA
- Usa Google Gemini 2.5 Flash via Lovable AI Gateway
- Streaming SSE para exibição em tempo real
- Suporte a PDFs inline como contexto multimodal
- Interdependência entre módulos (cada módulo recebe contexto dos anteriores)
- Prompts personalizáveis por módulo (pesquisa e geração)

### 3.5 Orquestrador de Coerência (M0)
- Validação cruzada contra briefing e módulos anteriores
- Score de coerência (0-100) com 3 status: coerente/atenção/incoerente
- Detecção de contradições com localização e sugestões
- Verificação de glossário (termos inconsistentes)
- Análise de tom de voz
- Resumo executivo e recomendações
- Usa Google Gemini 3 Flash Preview

### 3.6 Histórico de Versões
- Cada geração salva a versão anterior na tabela `module_versions`
- Histórico imutável — não permite exclusão
- Restauração de versões anteriores no editor

### 3.7 Score de Viabilidade
- Análise de viabilidade de mercado antes de produzir
- 5 critérios ponderados: demanda, concorrência, diferenciação, escalabilidade, receita
- Score de 0-100 com análise detalhada

### 3.8 Upload e Processamento de PDFs
- Upload com drag-and-drop, múltiplos arquivos
- Classificação: Livro Principal, Bônus, Order Bump
- Extração de texto via IA (Gemini com visão)
- Efeito cascata: upload novo marca módulos como desatualizados

### 3.9 Exportação PDF
- Exportação do projeto completo com capa, sumário, briefing e todos os módulos
- Exportação individual por módulo
- Design profissional com cabeçalhos e rodapés

### 3.10 Autenticação
- Login/cadastro por email + senha
- Verificação de email obrigatória
- Sessão persistente com auto-refresh

---

## 4. ARQUITETURA DE ARQUIVOS

```
src/
├── App.tsx                          # Roteamento e providers
├── main.tsx                         # Entry point
├── index.css                        # Design tokens e variáveis CSS
├── components/
│   ├── ui/                          # Componentes shadcn/ui (padrão)
│   ├── workspace/
│   │   ├── ModuleWorkArea.tsx       # Área de trabalho principal (editor + geração)
│   │   ├── CoherenceWorkArea.tsx    # Orquestrador de Coerência (M0)
│   │   ├── CoherencePanel.tsx       # Painel inline de coerência (componente auxiliar)
│   │   ├── WorkflowSidebar.tsx      # Sidebar esquerda com módulos M0-M8
│   │   ├── ContextSidebar.tsx       # Sidebar direita (progresso, contexto, arquivos)
│   │   ├── ProjectProgressPanel.tsx # Painel de progresso e exportação
│   │   ├── PromptEditor.tsx         # Editor de prompts customizáveis
│   │   └── ResearchPanel.tsx        # Painel de pesquisa de mercado
│   └── NavLink.tsx
├── hooks/
│   ├── useAuth.tsx                  # AuthProvider + hook de autenticação
│   ├── useProjects.ts              # Hooks CRUD para projetos, módulos, versões
│   ├── use-mobile.tsx
│   └── use-toast.ts
├── lib/
│   ├── modules.ts                   # Configuração dos 9 módulos (M0-M8)
│   ├── context-builder.ts           # Montagem de contexto para IA (briefing + módulos + PDFs)
│   ├── default-prompts.ts           # Prompts padrão de pesquisa e geração
│   ├── pdf-export.ts                # Geração de PDFs exportáveis
│   └── utils.ts                     # Utilitários (cn)
├── pages/
│   ├── Auth.tsx                     # Tela de login/cadastro
│   ├── Dashboard.tsx                # Lista de projetos
│   ├── ProjectWorkspace.tsx         # Workspace do projeto (3 painéis)
│   ├── Index.tsx                    # Página fallback (não usada)
│   └── NotFound.tsx
└── integrations/
    └── supabase/
        ├── client.ts                # Cliente Supabase (auto-gerado)
        └── types.ts                 # Tipos do banco (auto-gerado)

supabase/
├── config.toml                      # Configuração das edge functions
└── functions/
    ├── generate-module/index.ts     # Geração de conteúdo com streaming SSE
    ├── market-research/index.ts     # Pesquisa via Perplexity API
    ├── ai-research/index.ts         # Pesquisa via Lovable AI Gateway
    ├── viability-score/index.ts     # Score de viabilidade de mercado
    ├── extract-pdf-text/index.ts    # Extração de texto de PDFs
    └── coherence-check/index.ts     # Validação de coerência via IA
```

---

## 5. BANCO DE DADOS (Schema Completo)

### 5.1 Tabela: `projects`
```sql
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,  -- referência auth.users (sem FK direta)
    name TEXT NOT NULL,
    niche TEXT,
    promise TEXT,
    target_audience TEXT,
    status TEXT NOT NULL DEFAULT 'briefing',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
```

**RLS Policies:**
- `Users can view own projects` → SELECT WHERE auth.uid() = user_id
- `Users can create own projects` → INSERT WITH CHECK auth.uid() = user_id
- `Users can update own projects` → UPDATE WHERE auth.uid() = user_id
- `Users can delete own projects` → DELETE WHERE auth.uid() = user_id

### 5.2 Tabela: `modules`
```sql
CREATE TABLE public.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id),
    module_number INTEGER NOT NULL,
    generated_content TEXT,
    is_outdated BOOLEAN NOT NULL DEFAULT false,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
    research_prompt TEXT,
    generation_prompt TEXT
);
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
```

**RLS Policies:**
- `Users can view own modules` → SELECT WHERE EXISTS (SELECT 1 FROM projects WHERE projects.id = modules.project_id AND projects.user_id = auth.uid())
- `Users can create own modules` → INSERT WITH CHECK similar
- `Users can update own modules` → UPDATE WHERE similar

### 5.3 Tabela: `module_versions`
```sql
CREATE TABLE public.module_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.module_versions ENABLE ROW LEVEL SECURITY;
```

**RLS Policies:**
- `Users can view own module versions` → SELECT via JOIN modules → projects → auth.uid()
- `Users can create own module versions` → INSERT via mesma lógica

### 5.4 Tabela: `project_files`
```sql
CREATE TABLE public.project_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id),
    file_type TEXT NOT NULL,          -- 'livro_principal', 'bonus', 'order_bump'
    file_url TEXT NOT NULL,
    file_name TEXT,
    extracted_text TEXT,
    processing_status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'processing', 'completed'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
```

**RLS Policies:**
- `Users can view own files` → SELECT via projects
- `Users can upload own files` → INSERT via projects
- `Users can update own files` → UPDATE via projects
- `Users can delete own files` → DELETE via projects

### 5.5 Tabela: `prompts`
```sql
CREATE TABLE public.prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_number INTEGER NOT NULL,
    prompt_text TEXT NOT NULL
);
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
```

**RLS Policies:**
- `Anyone authenticated can read prompts` → SELECT true (role: authenticated)

### 5.6 Storage Bucket
```
Bucket: project-files (público)
Estrutura: {user_id}/{project_id}/{timestamp}_{filename}.pdf
```

---

## 6. EDGE FUNCTIONS (Backend)

### 6.1 `generate-module`
- **Propósito:** Gerar conteúdo para cada módulo via streaming SSE
- **Modelo IA:** google/gemini-2.5-flash
- **JWT:** Desabilitado (verify_jwt = false)
- **Entrada:** `{ messages: [{role, content}], pdfParts?: [{base64, fileName, fileType}] }`
- **Saída:** Stream SSE (text/event-stream) no formato OpenAI
- **Secrets necessários:** LOVABLE_API_KEY (automático)
- **Lógica especial:** Suporta PDFs inline como multimodal content (image_url com data:application/pdf;base64,...)

### 6.2 `market-research`
- **Propósito:** Pesquisa de mercado com dados web reais
- **API:** Perplexity (sonar-pro)
- **JWT:** Desabilitado
- **Entrada:** `{ niche, promise, targetAudience, moduleTitle, moduleNumber, customPrompt }`
- **Saída:** `{ research: string, citations: string[] }`
- **Secrets necessários:** PERPLEXITY_API_KEY
- **Lógica especial:** Prompts específicos por módulo com search_recency_filter: "month"

### 6.3 `ai-research`
- **Propósito:** Pesquisa via Lovable AI (sem necessidade de API key do usuário)
- **Modelo IA:** google/gemini-2.5-flash
- **JWT:** Desabilitado
- **Entrada:** Mesmo que market-research
- **Saída:** `{ research: string, citations: [] }`
- **Secrets necessários:** LOVABLE_API_KEY (automático)

### 6.4 `viability-score`
- **Propósito:** Análise de viabilidade de mercado do produto
- **Modelo IA:** google/gemini-2.5-flash
- **JWT:** Desabilitado
- **Entrada:** `{ niche, promise, targetAudience, researchData? }`
- **Saída:** `{ score: number, analysis: string }`
- **Critérios:** Demanda (25%), Concorrência (20%), Diferenciação (20%), Escalabilidade (15%), Receita (20%)

### 6.5 `extract-pdf-text`
- **Propósito:** Extrair texto de PDFs enviados pelo usuário
- **Modelo IA:** google/gemini-2.5-flash (visão)
- **JWT:** Desabilitado
- **Entrada:** `{ projectId, filePath, fileName }`
- **Saída:** `{ success: boolean }`
- **Secrets necessários:** LOVABLE_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
- **Lógica:** Baixa o PDF do storage, converte para base64, envia ao Gemini como imagem inline

### 6.6 `coherence-check`
- **Propósito:** Validação de coerência entre módulos
- **Modelo IA:** google/gemini-3-flash-preview
- **JWT:** Desabilitado
- **Entrada:** `{ briefing, moduleNumber, moduleTitle, moduleContent, previousModules }`
- **Saída:** JSON com score, status, contradictions, glossaryCheck, toneCheck, executiveSummary, recommendations

---

## 7. CONFIGURAÇÃO DO SUPABASE (config.toml)

```toml
project_id = "zpziqcanrtfmacioybyy"

[functions.generate-module]
verify_jwt = false

[functions.extract-pdf-text]
verify_jwt = false

[functions.market-research]
verify_jwt = false

[functions.ai-research]
verify_jwt = false

[functions.viability-score]
verify_jwt = false

[functions.coherence-check]
verify_jwt = false
```

---

## 8. DESIGN SYSTEM

### 8.1 Fontes
- **Headings:** Space Grotesk (300-700)
- **Body:** Inter (300-700)
- **Import:** Google Fonts CDN

### 8.2 Cores (HSL)

**Light Mode:**
| Token | Valor HSL |
|---|---|
| --background | 220 20% 97% |
| --foreground | 220 25% 10% |
| --primary | 250 70% 55% |
| --secondary | 220 15% 92% |
| --accent | 250 60% 95% |
| --destructive | 0 72% 51% |
| --muted | 220 15% 92% |
| --border | 220 15% 88% |
| --ring | 250 70% 55% |
| --radius | 0.75rem |

**Dark Mode:**
| Token | Valor HSL |
|---|---|
| --background | 225 25% 6% |
| --foreground | 220 15% 92% |
| --primary | 250 70% 60% |
| --secondary | 225 18% 14% |
| --accent | 250 40% 18% |
| --destructive | 0 62% 45% |

### 8.3 Classes Customizadas
- `.glass-panel` — Efeito glassmorphism com blur
- `.gradient-text` — Texto com gradiente primary
- `.glow-shadow` — Sombra brilhante primary

### 8.4 Gradientes
- `--gradient-primary`: 135deg, primary → purple
- `--gradient-accent`: 135deg, accent light
- `--shadow-glow`: 0 0 40px primary/30%

---

## 9. ROTAS DA APLICAÇÃO

| Rota | Componente | Proteção |
|---|---|---|
| `/auth` | Auth.tsx | AuthRoute (redireciona se logado) |
| `/` | Dashboard.tsx | ProtectedRoute |
| `/project/:projectId` | ProjectWorkspace.tsx | ProtectedRoute |
| `*` | NotFound.tsx | Nenhuma |

---

## 10. FLUXO DE DADOS

### 10.1 Geração de Conteúdo
```
1. Usuário clica "Pesquisar" no módulo
2. ResearchPanel → market-research ou ai-research (edge function)
3. Resultado exibido no painel, usuário clica "Usar na geração"
4. Usuário clica "Gerar com IA"
5. ModuleWorkArea → buildProjectContext() → coleta briefing + módulos anteriores + PDFs
6. buildPdfParts() → converte PDFs do storage para base64
7. Chamada à edge function generate-module com streaming SSE
8. Versão anterior salva em module_versions
9. Conteúdo novo salvo em modules
10. Exibição em tempo real via stream
```

### 10.2 Interdependência entre Módulos
Cada módulo recebe um aviso de interdependência no prompt:
- **M2**: Baseia-se nos insights do M1 (posicionamento, persona, diferenciação)
- **M3**: Reflete a estrutura do M2 e posicionamento do M1
- **M4**: Atrai público do M1, nutre com M2, usa ganchos do M3
- **M5**: Usa ângulos e headlines do M3, direcionados ao público do M1
- **M6**: Segue funil definido, usa copy do M3 e estratégia do M4
- **M7**: Complementa email (M6) com abordagem alinhada à copy (M3)
- **M8**: Integra TODOS os canais anteriores em jornada coesa

### 10.3 Efeito Cascata
Quando o briefing ou material base é alterado:
- Todos os módulos com conteúdo são marcados como `is_outdated = true`
- Badge "Desatualizado" aparece no workflow sidebar
- Botão muda de "Gerar com IA" para "Regenerar"

---

## 11. PROMPTS PADRÃO

### 11.1 Prompts de Pesquisa (por módulo)
Cada módulo tem um prompt de pesquisa focado em 5 tópicos específicos do mercado brasileiro:

- **M1:** Concorrentes, tendências, dores/desejos, posicionamento, tamanho do mercado
- **M2:** Formatos vendidos, estruturas de conteúdo, bônus, precificação, plataformas
- **M3:** Headlines, VSL/páginas de vendas, gatilhos mentais, objeções, CTAs
- **M4:** Tipos de conteúdo, plataformas ativas, influenciadores, hashtags, formatos virais
- **M5:** Criativos que convertem, plataformas de ads, copy para ads, métricas, formatos
- **M6:** Sequências eficazes, assuntos de email, frequência, segmentação, ferramentas
- **M7:** Estratégias WhatsApp, scripts, automações, métricas, follow-up
- **M8:** Estruturas de funil, upsell/downsell, taxas de conversão, checkout, remarketing

### 11.2 Prompts de Geração (por módulo)
Cada módulo tem um prompt de geração que define o papel da IA e a estrutura do output esperado:

- **M1:** Estrategista → posicionamento, proposta de valor, persona, concorrentes, precificação
- **M2:** Designer instrucional → formato, grade de módulos, bônus, materiais, cronograma
- **M3:** Copywriter → headline, VSL, bullet points, objeções, CTAs
- **M4:** Estrategista de conteúdo → calendário 30 dias, pilares, scripts, plataformas, funil
- **M5:** Especialista em tráfego → 5 ângulos, headlines/textos, segmentação, escala, KPIs
- **M6:** Especialista em email → boas-vindas, vendas, carrinho, assuntos, segmentação
- **M7:** Especialista WhatsApp → funil, scripts, automações, templates, grupos
- **M8:** Arquiteto de funis → funil completo, upsell/downsell, páginas, KPIs, remarketing

---

## 12. SECRETS NECESSÁRIOS

| Secret | Origem | Uso |
|---|---|---|
| LOVABLE_API_KEY | Automático (Lovable Cloud) | Gateway IA para geração, pesquisa, extração e coerência |
| PERPLEXITY_API_KEY | Manual (usuário configura) | Pesquisa de mercado com dados web reais via Perplexity |
| SUPABASE_URL | Automático | Usado pela edge function extract-pdf-text |
| SUPABASE_SERVICE_ROLE_KEY | Automático | Usado pela edge function extract-pdf-text |

---

## 13. REGRAS DE NEGÓCIO IMPORTANTES

1. **M0 é excluído de métricas de progresso** — O progresso do dashboard e do painel lateral conta apenas M1-M8 (8 módulos de conteúdo)
2. **M0 é excluído da exportação PDF** — O documento final contém apenas os 8 módulos de conteúdo
3. **Versões são imutáveis** — Não é permitido excluir versões anteriores do histórico
4. **Verificação de email obrigatória** — Auto-confirm de email NÃO está habilitado
5. **Prompts são personalizáveis** — Cada módulo permite customizar prompt de pesquisa e geração
6. **Pesquisa é iterativa** — O usuário pode refinar a pesquisa várias vezes antes de usar na geração
7. **PDFs são lidos integralmente pela IA** — Os PDFs são convertidos para base64 e enviados inline como multimodal content

---

## 14. LAYOUT DA INTERFACE

### 14.1 Dashboard (`/`)
- Header: Logo + email do usuário + logout
- Grid de cards de projetos com nome, nicho, data, progresso
- Diálogo de criação com 2 modos (Do Zero / Produto Existente)

### 14.2 Workspace (`/project/:id`)
- **Header**: Botão voltar + nome/nicho do projeto + configurações
- **Layout 3 painéis**:
  - **Esquerda (264px)**: WorkflowSidebar — M0 separado visualmente, M1-M8 com status
  - **Centro (flex-1)**: ModuleWorkArea (M1-M8) ou CoherenceWorkArea (M0)
  - **Direita (288px)**: ContextSidebar — 3 abas (Progresso, Contexto, Arquivos)

### 14.3 ModuleWorkArea
- Header com badge do módulo, título, status, botões (Prompts, Pesquisar, Histórico, Salvar, Gerar)
- ResearchPanel expansível com seletor de provedor + refinamento
- Barra de progresso durante geração
- Textarea com conteúdo (readonly durante streaming)
- Empty state com orientação

### 14.4 CoherenceWorkArea (M0)
- Header com botão "Validar Tudo"
- Cards de visão geral: Score Médio, Módulos Validados, Contradições, Termos Inconsistentes
- Lista de módulos com cards expansíveis: contradições, glossário, tom de voz, recomendações

---

## 15. DEPENDÊNCIAS COMPLETAS (package.json)

### Produção
```
@hookform/resolvers, @radix-ui/* (todos os componentes), @supabase/supabase-js,
@tanstack/react-query, class-variance-authority, clsx, cmdk, date-fns,
embla-carousel-react, framer-motion, input-otp, jspdf, lucide-react,
next-themes, react, react-day-picker, react-dom, react-hook-form,
react-resizable-panels, react-router-dom, recharts, sonner, tailwind-merge,
tailwindcss-animate, vaul, zod
```

### Desenvolvimento
```
@eslint/js, @playwright/test, @tailwindcss/typography, @testing-library/jest-dom,
@testing-library/react, @types/node, @types/react, @types/react-dom,
@vitejs/plugin-react-swc, autoprefixer, eslint, eslint-plugin-react-hooks,
eslint-plugin-react-refresh, globals, jsdom, lovable-tagger, postcss,
tailwindcss, typescript, typescript-eslint, vite, vitest
```

---

## 16. INSTRUÇÕES PARA RECRIAÇÃO

Se precisar recriar a plataforma no Lovable, envie este documento no chat e peça:

> "Recrie a plataforma Orquestrador de Infoprodutos com base nesta documentação completa. Siga exatamente a arquitetura descrita: 9 módulos (M0-M8), pesquisa de mercado com Perplexity e Lovable IA, geração com streaming SSE via Gemini, orquestrador de coerência, upload de PDFs, exportação PDF, histórico de versões imutável, e score de viabilidade. Use o design system com Space Grotesk + Inter, tema roxo (primary HSL 250 70% 55%), glassmorphism e gradientes. Configure Lovable Cloud com as tabelas projects, modules, module_versions, project_files, prompts, e as 6 edge functions descritas."

### Passo a passo recomendado:
1. Criar projeto no Lovable
2. Habilitar Lovable Cloud
3. Criar as tabelas e RLS policies
4. Criar o bucket de storage `project-files`
5. Configurar o design system (index.css)
6. Implementar autenticação
7. Implementar Dashboard
8. Implementar Workspace com os 3 painéis
9. Implementar as 6 edge functions
10. Implementar pesquisa de mercado
11. Implementar geração com streaming
12. Implementar M0 (Orquestrador de Coerência)
13. Implementar upload de PDFs
14. Implementar exportação PDF
15. Implementar score de viabilidade
16. Configurar PERPLEXITY_API_KEY nos secrets
17. Testar fluxo completo

---

## 17. NOTAS TÉCNICAS

### 17.1 Streaming SSE
O generate-module retorna um stream SSE no formato OpenAI. O frontend lê chunk a chunk:
```
data: {"choices":[{"delta":{"content":"texto"}}]}
data: [DONE]
```

### 17.2 Context Builder
A função `buildProjectContext` monta o contexto completo para a IA:
- Briefing do projeto (nome, nicho, promessa, público)
- Todos os módulos já gerados com seus conteúdos
- Texto extraído dos PDFs enviados

### 17.3 PDF Multimodal
Os PDFs são enviados como `data:application/pdf;base64,...` no campo `image_url` das mensagens do Gemini, permitindo leitura completa do documento original.

### 17.4 Módulo de Coerência
Usa `google/gemini-3-flash-preview` (modelo mais avançado) para análise crítica. Retorna JSON estruturado com regex fallback para extrair o JSON do response.

---

*Documento gerado em 10/03/2026 — Orquestrador de Infoprodutos v1.0*
