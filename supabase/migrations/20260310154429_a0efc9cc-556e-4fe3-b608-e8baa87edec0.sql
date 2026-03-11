
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
