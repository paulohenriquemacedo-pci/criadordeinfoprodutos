
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
