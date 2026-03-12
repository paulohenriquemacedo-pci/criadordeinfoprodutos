
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
