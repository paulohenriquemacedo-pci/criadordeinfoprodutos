import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, FileText, Search, Palette, BookOpen, Bot, Package, Zap } from "lucide-react";

const WELCOME_KEY = "orquestrador_welcome_seen";

const steps = [
  {
    icon: FileText,
    title: "Módulos 1–8: Estratégia Completa",
    desc: "Preencha o briefing e a IA gera pesquisa de mercado, copy, funis, e-mails e muito mais — módulo a módulo.",
  },
  {
    icon: Package,
    title: "M9: Definição de Oferta",
    desc: "Monte produtos, bônus e order bumps. A IA avalia e pontua sua oferta.",
  },
  {
    icon: Palette,
    title: "M10: Hub Criativo",
    desc: "Crie posts, stories e anúncios com imagens (IA ou banco gratuito), texto e legendas automáticas.",
  },
  {
    icon: BookOpen,
    title: "M11: Produção de Conteúdo",
    desc: "Escreva o produto final capítulo a capítulo com apoio da IA.",
  },
  {
    icon: Bot,
    title: "M12: Consultor Estratégico",
    desc: "Chat livre com IA que tem acesso a todo o contexto do seu projeto.",
  },
  {
    icon: Zap,
    title: "Geração em Lote",
    desc: "Use 'Pesquisar Tudo' e 'Gerar Tudo' para processar todos os módulos de uma vez.",
  },
];

export function WelcomeDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(WELCOME_KEY);
    if (!seen) setOpen(true);
  }, []);

  const handleClose = () => {
    localStorage.setItem(WELCOME_KEY, "true");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            Bem-vindo ao Orquestrador!
          </DialogTitle>
          <DialogDescription>
            Sua plataforma de criação de infoprodutos com IA. Veja como funciona:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-border/50 bg-secondary/20 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <step.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-medium">{step.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Dica:</strong> Passe o mouse sobre os ícones <span className="inline-flex align-middle"><Search className="h-3 w-3 text-primary" /></span> de informação espalhados pela plataforma para ver dicas de uso de cada função.
          </p>
        </div>

        <DialogFooter>
          <Button onClick={handleClose} className="w-full gap-2">
            <Sparkles className="h-4 w-4" /> Começar a Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
