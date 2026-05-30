CREATE TABLE public.canva_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  canva_user_id TEXT,
  scope TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, DELETE ON public.canva_connections TO authenticated;
GRANT ALL ON public.canva_connections TO service_role;

ALTER TABLE public.canva_connections ENABLE ROW LEVEL SECURITY;

-- Users can check whether they have a connection and disconnect it.
-- INSERT/UPDATE are restricted to service_role (edge functions) so tokens
-- can never be written from the client.
CREATE POLICY "Users can view own canva connection"
  ON public.canva_connections FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own canva connection"
  ON public.canva_connections FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_canva_connections_updated_at
  BEFORE UPDATE ON public.canva_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Temporary table to hold PKCE verifiers + state during OAuth handshake
CREATE TABLE public.canva_oauth_state (
  state TEXT NOT NULL PRIMARY KEY,
  user_id UUID NOT NULL,
  code_verifier TEXT NOT NULL,
  redirect_to TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.canva_oauth_state TO service_role;
ALTER TABLE public.canva_oauth_state ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role accesses this table.