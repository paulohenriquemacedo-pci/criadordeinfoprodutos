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