
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
