
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
