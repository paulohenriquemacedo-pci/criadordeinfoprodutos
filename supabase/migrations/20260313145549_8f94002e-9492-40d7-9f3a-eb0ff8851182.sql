
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
