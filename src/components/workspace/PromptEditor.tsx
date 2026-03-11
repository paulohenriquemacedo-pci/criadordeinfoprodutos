import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Settings2, RotateCcw, Save, Globe, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_RESEARCH_PROMPTS, DEFAULT_GENERATION_PROMPTS } from "@/lib/default-prompts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  moduleId: string;
  moduleNumber: number;
  researchPrompt: string | null;
  generationPrompt: string | null;
  onSaved: () => void;
}

export default function PromptEditor({ moduleId, moduleNumber, researchPrompt, generationPrompt, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [research, setResearch] = useState(researchPrompt || DEFAULT_RESEARCH_PROMPTS[moduleNumber] || "");
  const [generation, setGeneration] = useState(generationPrompt || DEFAULT_GENERATION_PROMPTS[moduleNumber] || "");
  const [saving, setSaving] = useState(false);

  // Reset prompts when module changes
  const [prevModuleId, setPrevModuleId] = useState(moduleId);
  if (moduleId !== prevModuleId) {
    setPrevModuleId(moduleId);
    setResearch(researchPrompt || DEFAULT_RESEARCH_PROMPTS[moduleNumber] || "");
    setGeneration(generationPrompt || DEFAULT_GENERATION_PROMPTS[moduleNumber] || "");
    setOpen(false);
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("modules")
        .update({ research_prompt: research, generation_prompt: generation })
        .eq("id", moduleId);
      if (error) throw error;
      toast.success("Prompts salvos!");
      onSaved();
    } catch (err: any) {
      toast.error("Erro ao salvar prompts: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = (type: "research" | "generation") => {
    if (type === "research") {
      setResearch(DEFAULT_RESEARCH_PROMPTS[moduleNumber] || "");
    } else {
      setGeneration(DEFAULT_GENERATION_PROMPTS[moduleNumber] || "");
    }
    toast.info("Prompt restaurado ao padrão. Clique em Salvar para confirmar.");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 h-8 text-xs">
          <Settings2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Prompts</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Prompts do Módulo {moduleNumber}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {/* Research prompt */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Prompt de Pesquisa</span>
                  <Badge variant="secondary" className="text-xs">Perplexity</Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleReset("research")} className="text-xs gap-1">
                  <RotateCcw className="h-3 w-3" /> Restaurar padrão
                </Button>
              </div>
              <Textarea
                value={research}
                onChange={(e) => setResearch(e.target.value)}
                className="min-h-[150px] text-xs font-mono"
                placeholder="Defina o que a Perplexity deve pesquisar sobre o mercado..."
              />
            </div>

            {/* Generation prompt */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Prompt de Geração</span>
                  <Badge variant="secondary" className="text-xs">IA</Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleReset("generation")} className="text-xs gap-1">
                  <RotateCcw className="h-3 w-3" /> Restaurar padrão
                </Button>
              </div>
              <Textarea
                value={generation}
                onChange={(e) => setGeneration(e.target.value)}
                className="min-h-[150px] text-xs font-mono"
                placeholder="Defina as instruções de geração de conteúdo para a IA..."
              />
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end pt-2 border-t border-border/50">
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1">
            <Save className="h-4 w-4" />
            {saving ? "Salvando..." : "Salvar Prompts"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
