

-- ==========================================
-- MIGRATION: 20260310144440_37d6c2f7-6b2a-47ae-ab2d-c44b5b4d6b4e.sql
-- ==========================================

-- Create update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  niche TEXT,
  promise TEXT,
  target_audience TEXT,
  status TEXT NOT NULL DEFAULT 'briefing',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Modules table
CREATE TABLE public.modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  module_number INTEGER NOT NULL CHECK (module_number BETWEEN 1 AND 8),
  generated_content TEXT,
  is_outdated BOOLEAN NOT NULL DEFAULT false,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, module_number)
);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own modules" ON public.modules FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = modules.project_id AND projects.user_id = auth.uid())
);
CREATE POLICY "Users can create own modules" ON public.modules FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = modules.project_id AND projects.user_id = auth.uid())
);
CREATE POLICY "Users can update own modules" ON public.modules FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = modules.project_id AND projects.user_id = auth.uid())
);

CREATE TRIGGER update_modules_last_updated BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Module versions table (history)
CREATE TABLE public.module_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.module_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own module versions" ON public.module_versions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.modules m JOIN public.projects p ON p.id = m.project_id WHERE m.id = module_versions.module_id AND p.user_id = auth.uid())
);
CREATE POLICY "Users can create own module versions" ON public.module_versions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.modules m JOIN public.projects p ON p.id = m.project_id WHERE m.id = module_versions.module_id AND p.user_id = auth.uid())
);

-- Prompts table (configurable per module)
CREATE TABLE public.prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_number INTEGER NOT NULL UNIQUE CHECK (module_number BETWEEN 1 AND 8),
  prompt_text TEXT NOT NULL
);

ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can read prompts" ON public.prompts FOR SELECT TO authenticated USING (true);

-- Project files table (PDF uploads)
CREATE TABLE public.project_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL CHECK (file_type IN ('livro_principal', 'bonus', 'order_bump')),
  file_url TEXT NOT NULL,
  file_name TEXT,
  extracted_text TEXT,
  processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own files" ON public.project_files FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_files.project_id AND projects.user_id = auth.uid())
);
CREATE POLICY "Users can upload own files" ON public.project_files FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_files.project_id AND projects.user_id = auth.uid())
);
CREATE POLICY "Users can update own files" ON public.project_files FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_files.project_id AND projects.user_id = auth.uid())
);
CREATE POLICY "Users can delete own files" ON public.project_files FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_files.project_id AND projects.user_id = auth.uid())
);

-- Storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('project-files', 'project-files', false);

CREATE POLICY "Users can upload project files" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'project-files' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can view own project files" ON storage.objects FOR SELECT USING (
  bucket_id = 'project-files' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can delete own project files" ON storage.objects FOR DELETE USING (
  bucket_id = 'project-files' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Function to initialize 8 modules for a new project
CREATE OR REPLACE FUNCTION public.initialize_project_modules()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.modules (project_id, module_number)
  SELECT NEW.id, generate_series(1, 8);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER create_project_modules
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_project_modules();

-- Insert default prompts for each module
INSERT INTO public.prompts (module_number, prompt_text) VALUES
(1, 'Você é um estrategista de infoprodutos. Com base no briefing do projeto, gere um briefing estratégico completo incluindo: análise de mercado, posicionamento, diferenciação, persona detalhada, dores e desejos do público, e estratégia de lançamento.'),
(2, 'Você é um arquiteto de cursos e infoprodutos. Com base no briefing estratégico, crie a estrutura completa do produto incluindo: módulos, aulas, objetivos de aprendizagem, entregáveis por módulo, e sequência pedagógica.'),
(3, 'Você é um copywriter especialista em VSL e páginas de vendas. Com base no contexto do projeto, crie: headline principal, sub-headlines, bullets de benefícios, script de VSL completo, e CTA principal.'),
(4, 'Você é um estrategista de conteúdo orgânico. Com base no contexto do projeto, crie um plano de conteúdo orgânico com: 30 ideias de posts, scripts para reels/stories, calendário editorial, e estratégia de engajamento.'),
(5, 'Você é um especialista em tráfego pago e criativos. Com base no contexto do projeto, crie: 10 conceitos de criativos para anúncios, copies para Facebook/Instagram Ads, headlines, e estratégia de segmentação.'),
(6, 'Você é um especialista em e-mail marketing. Com base no contexto do projeto, crie: sequência de e-mails de lançamento (7 dias), sequência de carrinho abandonado, sequência de pós-venda, e templates de e-mail.'),
(7, 'Você é um especialista em funis de WhatsApp. Com base no contexto do projeto, crie: sequência de mensagens de captação, scripts de atendimento, automações de follow-up, e estratégia de conversão via WhatsApp.'),
(8, 'Você é um arquiteto de funis de vendas. Com base no contexto do projeto, crie: estrutura completa do funil (topo, meio, fundo), páginas necessárias, fluxo do usuário, upsells, downsells, e order bumps.');


-- ==========================================
-- MIGRATION: 20260310151205_ec51ba3d-949a-4fc0-8e7c-25c14e579d61.sql
-- ==========================================
DROP TRIGGER IF EXISTS update_modules_last_updated ON public.modules;

CREATE OR REPLACE FUNCTION public.update_modules_last_updated_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_modules_last_updated
  BEFORE UPDATE ON public.modules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modules_last_updated_column();

-- ==========================================
-- MIGRATION: 20260310152444_f5b74b79-575c-4081-9c24-6a745b2f673e.sql
-- ==========================================

DROP TRIGGER IF EXISTS initialize_project_modules ON public.projects;
CREATE TRIGGER initialize_project_modules
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_project_modules();

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- ==========================================
-- MIGRATION: 20260310153600_af991a5a-8dfe-44c8-abe0-c17c1054c6e2.sql
-- ==========================================

-- Recreate triggers that are missing
CREATE OR REPLACE TRIGGER on_project_created
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_project_modules();

CREATE OR REPLACE TRIGGER on_project_updated
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER on_module_updated
  BEFORE UPDATE ON public.modules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modules_last_updated_column();


-- ==========================================
-- MIGRATION: 20260310154429_a0efc9cc-556e-4fe3-b608-e8baa87edec0.sql
-- ==========================================

CREATE OR REPLACE FUNCTION public.initialize_project_modules()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.modules (project_id, module_number)
  SELECT NEW.id, gs
  FROM generate_series(1, 8) AS gs
  ON CONFLICT (project_id, module_number) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Recreate all triggers
DROP TRIGGER IF EXISTS on_project_created ON public.projects;
CREATE TRIGGER on_project_created
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_project_modules();

DROP TRIGGER IF EXISTS on_project_updated ON public.projects;
CREATE TRIGGER on_project_updated
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS on_module_updated ON public.modules;
CREATE TRIGGER on_module_updated
  BEFORE UPDATE ON public.modules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modules_last_updated_column();


-- ==========================================
-- MIGRATION: 20260310172406_f95bcf27-0e00-4f11-8845-1ddfcd251d77.sql
-- ==========================================
ALTER TABLE public.modules
  ADD COLUMN research_prompt text,
  ADD COLUMN generation_prompt text;

-- ==========================================
-- MIGRATION: 20260310211453_1232956a-35b4-4cab-a632-706711e274ed.sql
-- ==========================================
ALTER TABLE public.modules
ADD COLUMN research_result text,
ADD COLUMN research_citations text[];

-- ==========================================
-- MIGRATION: 20260310212117_ea06b93b-5159-423d-a53b-7eb0b3d7ff99.sql
-- ==========================================
ALTER TABLE public.modules ADD COLUMN research_chat text;

-- ==========================================
-- MIGRATION: 20260310214829_ad6517af-6e07-4530-b62c-e4d88f0fbb80.sql
-- ==========================================
ALTER TABLE public.modules ADD COLUMN custom_research text DEFAULT NULL;

-- ==========================================
-- MIGRATION: 20260312005856_4235444b-3014-43c6-b9a8-8d429d8b7424.sql
-- ==========================================
ALTER TABLE public.projects ADD COLUMN strategic_memory jsonb DEFAULT NULL;

-- ==========================================
-- MIGRATION: 20260312015101_2e72e3a1-3caf-4e5f-aa0f-a752f83b9f5e.sql
-- ==========================================
ALTER TABLE public.modules
  ADD COLUMN research_perplexity text,
  ADD COLUMN research_perplexity_citations text[],
  ADD COLUMN research_gemini text,
  ADD COLUMN research_gemini_citations text[],
  ADD COLUMN research_qwen text,
  ADD COLUMN research_qwen_citations text[];

-- ==========================================
-- MIGRATION: 20260312025243_639e7710-13a8-4e97-b37e-34a6659c6e95.sql
-- ==========================================

-- Create production_chapters table
CREATE TABLE public.production_chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    chapter_order INTEGER NOT NULL,
    title TEXT NOT NULL DEFAULT 'Capítulo sem título',
    generated_content TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(project_id, chapter_order)
);

ALTER TABLE public.production_chapters ENABLE ROW LEVEL SECURITY;

-- RLS: Users can CRUD their own chapters via project ownership
CREATE POLICY "Users can view own chapters"
ON public.production_chapters FOR SELECT
USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = production_chapters.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can create own chapters"
ON public.production_chapters FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = production_chapters.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can update own chapters"
ON public.production_chapters FOR UPDATE
USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = production_chapters.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can delete own chapters"
ON public.production_chapters FOR DELETE
USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = production_chapters.project_id AND projects.user_id = auth.uid()));

-- Auto-update last_updated
CREATE TRIGGER update_production_chapters_last_updated
BEFORE UPDATE ON public.production_chapters
FOR EACH ROW EXECUTE FUNCTION public.update_modules_last_updated_column();

-- Update the trigger function to also create M9 (module_number 9)
CREATE OR REPLACE FUNCTION public.initialize_project_modules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.modules (project_id, module_number)
  SELECT NEW.id, gs
  FROM generate_series(1, 9) AS gs
  ON CONFLICT (project_id, module_number) DO NOTHING;
  RETURN NEW;
END;
$function$;


-- ==========================================
-- MIGRATION: 20260312192150_5a417cd2-99b4-4578-bb10-03f821495f0d.sql
-- ==========================================

-- Creative Tasks table for M10
CREATE TABLE public.creative_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    category TEXT NOT NULL DEFAULT 'social',
    title TEXT NOT NULL,
    description TEXT,
    template_type TEXT,
    prompt_input TEXT,
    context_modules INTEGER[] DEFAULT '{1,2,3,4,5,6,7,8}',
    tone TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    favorite_version_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.creative_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own creative tasks" ON public.creative_tasks
  FOR SELECT USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = creative_tasks.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can create own creative tasks" ON public.creative_tasks
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = creative_tasks.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can update own creative tasks" ON public.creative_tasks
  FOR UPDATE USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = creative_tasks.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can delete own creative tasks" ON public.creative_tasks
  FOR DELETE USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = creative_tasks.project_id AND projects.user_id = auth.uid()));

-- Creative Versions table
CREATE TABLE public.creative_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.creative_tasks(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1,
    content TEXT NOT NULL,
    refinement_prompt TEXT,
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.creative_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own creative versions" ON public.creative_versions
  FOR SELECT USING (EXISTS (SELECT 1 FROM creative_tasks ct JOIN projects p ON p.id = ct.project_id WHERE ct.id = creative_versions.task_id AND p.user_id = auth.uid()));

CREATE POLICY "Users can create own creative versions" ON public.creative_versions
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM creative_tasks ct JOIN projects p ON p.id = ct.project_id WHERE ct.id = creative_versions.task_id AND p.user_id = auth.uid()));

CREATE POLICY "Users can update own creative versions" ON public.creative_versions
  FOR UPDATE USING (EXISTS (SELECT 1 FROM creative_tasks ct JOIN projects p ON p.id = ct.project_id WHERE ct.id = creative_versions.task_id AND p.user_id = auth.uid()));

CREATE POLICY "Users can delete own creative versions" ON public.creative_versions
  FOR DELETE USING (EXISTS (SELECT 1 FROM creative_tasks ct JOIN projects p ON p.id = ct.project_id WHERE ct.id = creative_versions.task_id AND p.user_id = auth.uid()));

-- Trigger for updated_at on creative_tasks
CREATE TRIGGER update_creative_tasks_updated_at
  BEFORE UPDATE ON public.creative_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- ==========================================
-- MIGRATION: 20260312205058_49397be7-67ed-4257-b95b-680709355e58.sql
-- ==========================================

-- Step 1: Update constraint and migrate module numbers
ALTER TABLE public.modules DROP CONSTRAINT modules_module_number_check;
ALTER TABLE public.modules ADD CONSTRAINT modules_module_number_check CHECK (module_number >= 1 AND module_number <= 11);

-- Migrate M9 → M11 (production content)
UPDATE public.modules SET module_number = 11 WHERE module_number = 9;

-- Insert M9 and M10 for existing projects
INSERT INTO public.modules (project_id, module_number)
SELECT p.id, 9 FROM public.projects p
WHERE NOT EXISTS (SELECT 1 FROM public.modules m WHERE m.project_id = p.id AND m.module_number = 9)
ON CONFLICT (project_id, module_number) DO NOTHING;

INSERT INTO public.modules (project_id, module_number)
SELECT p.id, 10 FROM public.projects p
WHERE NOT EXISTS (SELECT 1 FROM public.modules m WHERE m.project_id = p.id AND m.module_number = 10)
ON CONFLICT (project_id, module_number) DO NOTHING;

-- Update trigger
CREATE OR REPLACE FUNCTION public.initialize_project_modules()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.modules (project_id, module_number)
  SELECT NEW.id, gs
  FROM generate_series(1, 11) AS gs
  ON CONFLICT (project_id, module_number) DO NOTHING;
  RETURN NEW;
END;
$function$;


-- ==========================================
-- MIGRATION: 20260312205125_99072ce7-ccdf-4f7e-bba4-4f4ae399e510.sql
-- ==========================================

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2),
  product_type TEXT NOT NULL DEFAULT 'digital',
  positioning TEXT,
  delivery_format TEXT,
  target_transformation TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own products" ON public.products FOR SELECT USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = products.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can create own products" ON public.products FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = products.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update own products" ON public.products FOR UPDATE USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = products.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete own products" ON public.products FOR DELETE USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = products.project_id AND projects.user_id = auth.uid()));
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create product_bonuses table
CREATE TABLE public.product_bonuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  perceived_value NUMERIC(10,2),
  delivery_type TEXT DEFAULT 'imediato',
  strategic_function TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.product_bonuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bonuses" ON public.product_bonuses FOR SELECT USING (EXISTS (SELECT 1 FROM products p JOIN projects pr ON pr.id = p.project_id WHERE p.id = product_bonuses.product_id AND pr.user_id = auth.uid()));
CREATE POLICY "Users can create own bonuses" ON public.product_bonuses FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM products p JOIN projects pr ON pr.id = p.project_id WHERE p.id = product_bonuses.product_id AND pr.user_id = auth.uid()));
CREATE POLICY "Users can update own bonuses" ON public.product_bonuses FOR UPDATE USING (EXISTS (SELECT 1 FROM products p JOIN projects pr ON pr.id = p.project_id WHERE p.id = product_bonuses.product_id AND pr.user_id = auth.uid()));
CREATE POLICY "Users can delete own bonuses" ON public.product_bonuses FOR DELETE USING (EXISTS (SELECT 1 FROM products p JOIN projects pr ON pr.id = p.project_id WHERE p.id = product_bonuses.product_id AND pr.user_id = auth.uid()));

-- Create product_bumps table
CREATE TABLE public.product_bumps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2),
  bump_type TEXT NOT NULL DEFAULT 'order_bump',
  trigger_point TEXT DEFAULT 'checkout',
  value_proposition TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.product_bumps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bumps" ON public.product_bumps FOR SELECT USING (EXISTS (SELECT 1 FROM products p JOIN projects pr ON pr.id = p.project_id WHERE p.id = product_bumps.product_id AND pr.user_id = auth.uid()));
CREATE POLICY "Users can create own bumps" ON public.product_bumps FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM products p JOIN projects pr ON pr.id = p.project_id WHERE p.id = product_bumps.product_id AND pr.user_id = auth.uid()));
CREATE POLICY "Users can update own bumps" ON public.product_bumps FOR UPDATE USING (EXISTS (SELECT 1 FROM products p JOIN projects pr ON pr.id = p.project_id WHERE p.id = product_bumps.product_id AND pr.user_id = auth.uid()));
CREATE POLICY "Users can delete own bumps" ON public.product_bumps FOR DELETE USING (EXISTS (SELECT 1 FROM products p JOIN projects pr ON pr.id = p.project_id WHERE p.id = product_bumps.product_id AND pr.user_id = auth.uid()));

-- Create offer_versions table
CREATE TABLE public.offer_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.offer_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own offer versions" ON public.offer_versions FOR SELECT USING (EXISTS (SELECT 1 FROM products p JOIN projects pr ON pr.id = p.project_id WHERE p.id = offer_versions.product_id AND pr.user_id = auth.uid()));
CREATE POLICY "Users can create own offer versions" ON public.offer_versions FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM products p JOIN projects pr ON pr.id = p.project_id WHERE p.id = offer_versions.product_id AND pr.user_id = auth.uid()));

-- Add columns to creative_tasks
ALTER TABLE public.creative_tasks ADD COLUMN IF NOT EXISTS content_focus TEXT NOT NULL DEFAULT 'engagement';
ALTER TABLE public.creative_tasks ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE SET NULL;
ALTER TABLE public.creative_tasks ADD COLUMN IF NOT EXISTS offer_item_type TEXT;
ALTER TABLE public.creative_tasks ADD COLUMN IF NOT EXISTS offer_item_id UUID;


-- ==========================================
-- MIGRATION: 20260313012003_c1f770a8-3c12-4ccb-a9c4-dcbb7bba3fb8.sql
-- ==========================================

-- Chat conversations table
CREATE TABLE public.chat_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Nova conversa',
  context_modules INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5,6,7,8,9,10,11}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS for chat_conversations
CREATE POLICY "Users can view own conversations" ON public.chat_conversations
  FOR SELECT USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = chat_conversations.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can create own conversations" ON public.chat_conversations
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = chat_conversations.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can update own conversations" ON public.chat_conversations
  FOR UPDATE USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = chat_conversations.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can delete own conversations" ON public.chat_conversations
  FOR DELETE USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = chat_conversations.project_id AND projects.user_id = auth.uid()));

-- RLS for chat_messages
CREATE POLICY "Users can view own messages" ON public.chat_messages
  FOR SELECT USING (EXISTS (SELECT 1 FROM chat_conversations cc JOIN projects p ON p.id = cc.project_id WHERE cc.id = chat_messages.conversation_id AND p.user_id = auth.uid()));

CREATE POLICY "Users can create own messages" ON public.chat_messages
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM chat_conversations cc JOIN projects p ON p.id = cc.project_id WHERE cc.id = chat_messages.conversation_id AND p.user_id = auth.uid()));

CREATE POLICY "Users can delete own messages" ON public.chat_messages
  FOR DELETE USING (EXISTS (SELECT 1 FROM chat_conversations cc JOIN projects p ON p.id = cc.project_id WHERE cc.id = chat_messages.conversation_id AND p.user_id = auth.uid()));

-- Auto-update updated_at
CREATE TRIGGER update_chat_conversations_updated_at
  BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update initialize_project_modules to include M12
CREATE OR REPLACE FUNCTION public.initialize_project_modules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.modules (project_id, module_number)
  SELECT NEW.id, gs
  FROM generate_series(1, 12) AS gs
  ON CONFLICT (project_id, module_number) DO NOTHING;
  RETURN NEW;
END;
$$;


-- ==========================================
-- MIGRATION: 20260313012404_a7bf1f38-c004-4801-85cc-8840b107d7a1.sql
-- ==========================================

-- Remove the old check constraint and add a new one that includes 12
ALTER TABLE public.modules DROP CONSTRAINT IF EXISTS modules_module_number_check;
ALTER TABLE public.modules ADD CONSTRAINT modules_module_number_check CHECK (module_number >= 1 AND module_number <= 12);

-- Now insert M12 for existing projects
INSERT INTO public.modules (project_id, module_number)
SELECT p.id, 12
FROM public.projects p
WHERE NOT EXISTS (
  SELECT 1 FROM public.modules m WHERE m.project_id = p.id AND m.module_number = 12
);


-- ==========================================
-- MIGRATION: 20260313145549_8f94002e-9492-40d7-9f3a-eb0ff8851182.sql
-- ==========================================

-- Brand settings table for storing project visual identity
CREATE TABLE public.brand_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  primary_color text NOT NULL DEFAULT '#6366f1',
  secondary_color text NOT NULL DEFAULT '#8b5cf6',
  accent_color text NOT NULL DEFAULT '#f59e0b',
  background_color text NOT NULL DEFAULT '#ffffff',
  text_color text NOT NULL DEFAULT '#1f2937',
  heading_font text NOT NULL DEFAULT 'Inter',
  body_font text NOT NULL DEFAULT 'Inter',
  logo_url text,
  visual_style text NOT NULL DEFAULT 'clean',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id)
);

-- Enable RLS
ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own brand settings"
  ON public.brand_settings FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = brand_settings.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can create own brand settings"
  ON public.brand_settings FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = brand_settings.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can update own brand settings"
  ON public.brand_settings FOR UPDATE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = brand_settings.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can delete own brand settings"
  ON public.brand_settings FOR DELETE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = brand_settings.project_id AND projects.user_id = auth.uid()));

-- Creative assets table for storing generated visual materials
CREATE TABLE public.creative_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.creative_tasks(id) ON DELETE CASCADE,
  version_id uuid REFERENCES public.creative_versions(id) ON DELETE SET NULL,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  asset_type text NOT NULL DEFAULT 'post_feed',
  template_id text NOT NULL DEFAULT 'post_1080x1350',
  format text NOT NULL DEFAULT '4:5',
  width integer NOT NULL DEFAULT 1080,
  height integer NOT NULL DEFAULT 1350,
  content_data jsonb NOT NULL DEFAULT '{}',
  image_url text,
  ai_background_url text,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.creative_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own creative assets"
  ON public.creative_assets FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = creative_assets.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can create own creative assets"
  ON public.creative_assets FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = creative_assets.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can update own creative assets"
  ON public.creative_assets FOR UPDATE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = creative_assets.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can delete own creative assets"
  ON public.creative_assets FOR DELETE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = creative_assets.project_id AND projects.user_id = auth.uid()));


-- ==========================================
-- MIGRATION: 20260530190350_daea03d8-df53-4d79-8d27-b7c28d206a8b.sql
-- ==========================================
CREATE TABLE public.canva_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  canva_user_id TEXT,
  scope TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, DELETE ON public.canva_connections TO authenticated;
GRANT ALL ON public.canva_connections TO service_role;

ALTER TABLE public.canva_connections ENABLE ROW LEVEL SECURITY;

-- Users can check whether they have a connection and disconnect it.
-- INSERT/UPDATE are restricted to service_role (edge functions) so tokens
-- can never be written from the client.
CREATE POLICY "Users can view own canva connection"
  ON public.canva_connections FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own canva connection"
  ON public.canva_connections FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_canva_connections_updated_at
  BEFORE UPDATE ON public.canva_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Temporary table to hold PKCE verifiers + state during OAuth handshake
CREATE TABLE public.canva_oauth_state (
  state TEXT NOT NULL PRIMARY KEY,
  user_id UUID NOT NULL,
  code_verifier TEXT NOT NULL,
  redirect_to TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.canva_oauth_state TO service_role;
ALTER TABLE public.canva_oauth_state ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role accesses this table.