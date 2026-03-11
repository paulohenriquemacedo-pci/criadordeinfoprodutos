import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Search, Sparkles } from "lucide-react";

export interface BatchEngineConfig {
  researchEngine: "perplexity" | "gemini" | "qwen";
  generationModel: string;
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
}

export default function BatchConfigDialog({ open, onOpenChange, onConfirm }: Props) {
  const [config, setConfig] = useState<BatchEngineConfig>({
    researchEngine: "perplexity",
    generationModel: "google/gemini-2.5-flash",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Configurar Geração em Lote
          </DialogTitle>
          <DialogDescription>
            Escolha os motores de IA para pesquisa e geração de conteúdo. Módulos já preenchidos serão pulados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => { onConfirm(config); onOpenChange(false); }} className="gap-1.5">
            <Zap className="h-4 w-4" /> Iniciar Geração
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
