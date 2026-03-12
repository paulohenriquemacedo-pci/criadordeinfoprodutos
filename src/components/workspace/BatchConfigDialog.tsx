import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Sparkles } from "lucide-react";

export interface BatchEngineConfig {
  researchEngine: "perplexity" | "gemini" | "qwen";
  generationModel: string;
  forceReResearch?: boolean;
}

const RESEARCH_ENGINES = [
  { value: "perplexity", label: "Perplexity (Web)", description: "Pesquisa em tempo real com citações" },
  { value: "gemini", label: "Gemini (IA)", description: "Análise com conhecimento do modelo" },
  { value: "qwen", label: "Qwen (OpenRouter)", description: "Raciocínio profundo e analítico" },
] as const;

const GENERATION_MODELS = [
  { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", description: "Rápido e eficiente (padrão)" },
  { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash", description: "Última geração, balanceado" },
  { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", description: "Máxima qualidade, mais lento" },
] as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (config: BatchEngineConfig) => void;
  mode: "research" | "generation";
}

export default function BatchConfigDialog({ open, onOpenChange, onConfirm, mode }: Props) {
  const [config, setConfig] = useState<BatchEngineConfig>({
    researchEngine: "perplexity",
    generationModel: "google/gemini-2.5-flash",
    forceReResearch: false,
  });

  const isResearch = mode === "research";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isResearch ? <Search className="h-5 w-5 text-primary" /> : <Sparkles className="h-5 w-5 text-primary" />}
            {isResearch ? "Pesquisa em Lote" : "Geração em Lote"}
          </DialogTitle>
          <DialogDescription>
            {isResearch
              ? "Escolha o motor de IA para pesquisar todos os módulos. Módulos já pesquisados serão pulados."
              : "Escolha o modelo de IA para gerar conteúdo. Módulos já preenchidos serão pulados. As pesquisas realizadas serão utilizadas automaticamente."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {isResearch ? (
            <>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  Motor de Pesquisa
                </Label>
                <Select
                  value={config.researchEngine}
                  onValueChange={(v) => setConfig(prev => ({ ...prev, researchEngine: v as BatchEngineConfig["researchEngine"] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESEARCH_ENGINES.map(engine => (
                      <SelectItem key={engine.value} value={engine.value}>
                        <div className="flex flex-col">
                          <span>{engine.label}</span>
                          <span className="text-xs text-muted-foreground">{engine.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="force-research"
                  checked={config.forceReResearch}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, forceReResearch: checked === true }))}
                />
                <Label htmlFor="force-research" className="text-sm cursor-pointer">
                  Forçar re-pesquisa em módulos já pesquisados
                </Label>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                  <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                  Modelo de Geração
                </Label>
                <Select
                  value={config.generationModel}
                  onValueChange={(v) => setConfig(prev => ({ ...prev, generationModel: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GENERATION_MODELS.map(model => (
                      <SelectItem key={model.value} value={model.value}>
                        <div className="flex flex-col">
                          <span>{model.label}</span>
                          <span className="text-xs text-muted-foreground">{model.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  Motor de Pesquisa (auto-pesquisa para módulos sem dados)
                </Label>
                <Select
                  value={config.researchEngine}
                  onValueChange={(v) => setConfig(prev => ({ ...prev, researchEngine: v as BatchEngineConfig["researchEngine"] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESEARCH_ENGINES.map(engine => (
                      <SelectItem key={engine.value} value={engine.value}>
                        <div className="flex flex-col">
                          <span>{engine.label}</span>
                          <span className="text-xs text-muted-foreground">{engine.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => { onConfirm(config); onOpenChange(false); }} className="gap-1.5">
            {isResearch ? <Search className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            {isResearch ? "Iniciar Pesquisa" : "Iniciar Geração"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
