
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
