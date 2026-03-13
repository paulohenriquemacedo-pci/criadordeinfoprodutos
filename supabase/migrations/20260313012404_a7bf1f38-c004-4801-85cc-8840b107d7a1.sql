
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
