import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useCanvaConnection() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setConnected(false); return; }
    const { data } = await supabase
      .from("canva_connections")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    setConnected(!!data);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const connect = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("canva-oauth-start", {
        body: { redirect_to: window.location.href },
      });
      if (error) throw error;
      if (!data?.authorize_url) throw new Error("URL de autorização não recebida");
      window.location.href = data.authorize_url;
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("canva_connections").delete().eq("user_id", user.id);
    setConnected(false);
  }, []);

  return { connected, loading, connect, disconnect, refresh };
}