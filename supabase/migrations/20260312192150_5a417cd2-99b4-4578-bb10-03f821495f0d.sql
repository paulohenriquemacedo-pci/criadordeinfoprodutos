
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
