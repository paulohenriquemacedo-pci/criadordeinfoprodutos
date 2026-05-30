# Integração Canva no M10 — Enviar para o Canva

Fluxo: usuário gera conteúdo no M10 → clica em "Abrir no Canva" → conteúdo (título, subtítulo, corpo, CTA, imagem) é injetado em um Brand Template via Autofill API → design abre no editor do Canva em nova aba.

## Pré-requisitos que você precisa providenciar

1. **App OAuth no Canva Developer Portal** (canva.dev → Your integrations → Create integration tipo "Public" ou "Team"):
   - Adicionar Redirect URL: `https://xelrutazncasjdenrzyz.supabase.co/functions/v1/canva-oauth-callback`
   - Scopes necessários: `design:content:write`, `design:meta:read`, `asset:write`, `brandtemplate:meta:read`, `brandtemplate:content:read`, `profile:read`
   - Copiar **Client ID** e **Client Secret**
2. **Brand Template no Canva** (precisa de plano Canva for Teams/Enterprise): criar um template no Canva 1080x1350 e 1080x1920 com campos de autofill nomeados `titulo`, `subtitulo`, `corpo`, `cta`, `imagem`. Copiar o **Brand Template ID** de cada um.

## Arquitetura

```text
M10 UI (CreativeHubWorkArea)
   │ "Abrir no Canva"
   ▼
[1] Verificar conexão Canva do usuário (tabela canva_connections)
   │ se não conectado → redireciona p/ OAuth
   ▼
[2] Edge function canva-autofill
   │ - faz upload da imagem do post como asset
   │ - chama Autofill API com brand_template_id + dados
   │ - faz polling do job até completar
   ▼
[3] Retorna design.urls.edit_url → abre em nova aba
```

## O que será criado

### Backend (Lovable Cloud)

**Migration:** tabela `canva_connections`
- `user_id` (FK auth.users, unique)
- `access_token`, `refresh_token`, `expires_at`
- `canva_user_id`
- RLS: usuário só lê/escreve a própria conexão; tokens nunca expostos ao client (acessados só por edge functions com service role)

**Secrets:** `CANVA_CLIENT_ID`, `CANVA_CLIENT_SECRET`, `CANVA_FEED_TEMPLATE_ID`, `CANVA_STORY_TEMPLATE_ID`

**Edge functions:**
- `canva-oauth-start` — gera URL de autorização com PKCE e state, devolve para o front redirecionar
- `canva-oauth-callback` — troca `code` por tokens, salva em `canva_connections`, redireciona de volta para o M10
- `canva-autofill` — recebe `{ taskId, format, title, subtitle, body, cta, imageUrl }`, refresh do token se necessário, upload da imagem como asset, cria job de autofill, faz polling (status `success`/`failed`), retorna `edit_url`
- `canva-disconnect` — revoga token e apaga linha

### Frontend

- `src/hooks/useCanvaConnection.ts` — checa se usuário tem conexão ativa, expõe `connect()` e `disconnect()`
- `src/components/workspace/canvas/CanvaExportButton.tsx` — botão "Abrir no Canva" no editor do M10:
  - se não conectado → abre dialog "Conecte sua conta Canva" → chama `canva-oauth-start`
  - se conectado → chama `canva-autofill` com o conteúdo atual e abre `edit_url` em nova aba
- Integração em `CreativeHubWorkArea.tsx` / no header do canvas, ao lado do botão de exportar PNG existente
- Página `/canva/callback` minimalista que mostra "Conectado!" e fecha (caso OAuth abra em popup) — ou redirect direto para o M10

### Mapeamento de conteúdo → autofill

O M10 já extrai `headline`, `subheadline`, `body`, `cta`, `imageUrl` (visto em `PostContentData` em `useCanvasElements.ts`). Vou reaproveitar esses mesmos campos e mapear:

```text
titulo    ← headline
subtitulo ← subheadline
corpo     ← body
cta       ← cta
imagem    ← imageUrl (uploaded como asset Canva)
```

## Pontos de atenção que vou comunicar no UI

- Autofill em Brand Templates exige plano **Canva for Teams/Enterprise** no usuário final. Se ele estiver em Free/Pro, o job falha e a gente mostra: "Sua conta Canva não suporta Brand Templates. Faça upgrade ou use o botão 'Exportar PNG'."
- Cada usuário conecta a própria conta Canva (uma vez); o token de refresh fica salvo e renovado automaticamente.
- Custo: API Canva Connect é gratuita para uso normal; sem consumo de créditos Lovable além das chamadas das edge functions.

## Fora do escopo (posso fazer em iteração futura se quiser)

- Importar designs prontos do Canva de volta como imagem no canvas Konva
- Listar/escolher Brand Templates da conta do usuário (em vez de IDs fixos por formato)
- Sincronizar edições feitas no Canva de volta para o M10

## Ordem de execução

1. Você cria o app no Canva Developer Portal e me passa Client ID + Secret + 2 Brand Template IDs (feed e story)
2. Eu rodo a migration `canva_connections` e cadastro os 4 secrets
3. Eu crio as 4 edge functions + hook + botão
4. Testamos o fluxo de OAuth e de autofill ponta a ponta com um post existente

Quando você aprovar o plano, eu já começo pelo passo 2 (secrets + migration) e te peço os valores via formulário seguro.