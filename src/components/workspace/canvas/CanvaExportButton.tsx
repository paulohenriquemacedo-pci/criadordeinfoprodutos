import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ExternalLink, Loader2, Unlink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCanvaConnection } from "@/hooks/useCanvaConnection";

interface Props {
  format: "feed" | "story";
  title?: string;
  subtitle?: string;
  body?: string;
  cta?: string;
  imageUrl?: string;
}

export default function CanvaExportButton({ format, title, subtitle, body, cta, imageUrl }: Props) {
  const { connected, loading, connect, disconnect, refresh } = useCanvaConnection();
  const [sending, setSending] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Detect ?canva=connected or ?canva=error after OAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("canva");
    if (status === "connected") {
      toast.success("Conta Canva conectada!");
      refresh();
      params.delete("canva");
      const qs = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
    } else if (status === "error") {
      toast.error("Falha ao conectar Canva: " + (params.get("msg") || ""));
      params.delete("canva"); params.delete("msg");
      const qs = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
    }
  }, [refresh]);

  const handleClick = async () => {
    if (connected === false) { setDialogOpen(true); return; }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("canva-autofill", {
        body: { format, title, subtitle, body, cta, imageUrl },
      });
      if (error) {
        const ctx: any = (error as any).context;
        const status = ctx?.status;
        if (status === 412) { setDialogOpen(true); return; }
        if (status === 402) {
          toast.error("Sua conta Canva precisa do plano Teams ou Enterprise para usar Brand Templates.");
          return;
        }
        throw error;
      }
      if (data?.edit_url) {
        window.open(data.edit_url, "_blank", "noopener,noreferrer");
        toast.success("Design criado no Canva!");
      }
    } catch (e: any) {
      toast.error("Erro ao enviar para o Canva: " + (e?.message || "falha"));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={handleClick}
        disabled={sending || loading || connected === null}
        className="gap-1"
      >
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
        {connected ? "Abrir no Canva" : "Conectar Canva"}
      </Button>
      {connected && (
        <Button size="sm" variant="ghost" onClick={disconnect} title="Desconectar Canva" className="px-2">
          <Unlink className="h-3.5 w-3.5" />
        </Button>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conectar sua conta Canva</DialogTitle>
            <DialogDescription>
              Vamos redirecionar você para o Canva autorizar a integração. Depois disso,
              o conteúdo gerado no M10 (título, subtítulo, corpo, CTA e imagem) será
              enviado automaticamente para um Brand Template seu, abrindo direto no editor do Canva.
              <br /><br />
              <strong>Importante:</strong> a função Autofill em Brand Templates exige o plano
              Canva for Teams ou Enterprise.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => { setDialogOpen(false); connect(); }} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Conectar Canva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}