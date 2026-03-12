import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { RefreshCw, Globe, Brain, Loader2, Plus, Send, Download, CheckCircle2, Zap, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DEFAULT_RESEARCH_PROMPTS } from "@/lib/default-prompts";

type ResearchProvider = "perplexity" | "lovable-ai" | "qwen";

interface ResearchResult {
  provider: ResearchProvider;
  content: string;
  citations: string[];
  timestamp: Date;
}

interface Props {
  projectId: string;
  moduleNumber: number;
  moduleTitle: string;
  niche: string;
  promise: string;
  targetAudience: string;
  customResearchPrompt: string | null;
  savedResearch: string;
  savedCitations: string[];
  onResearchReady: (research: string, citations: string[]) => void;
  onClearResearch?: () => void;
}

const PROVIDER_CONFIG: Record<ResearchProvider, { label: string; edgeFunction: string; icon: "globe" | "brain" | "zap" }> = {
  perplexity: { label: "Perplexity", edgeFunction: "market-research", icon: "globe" },
  "lovable-ai": { label: "Gemini", edgeFunction: "ai-research", icon: "brain" },
  qwen: { label: "Qwen", edgeFunction: "qwen-research", icon: "zap" },
};

const ProviderIcon = ({ provider, className }: { provider: ResearchProvider; className?: string }) => {
  switch (PROVIDER_CONFIG[provider].icon) {
    case "globe": return <Globe className={className} />;
    case "brain": return <Brain className={className} />;
    case "zap": return <Zap className={className} />;
  }
};

export default function ResearchPanel({
  projectId,
  moduleNumber,
  moduleTitle,
  niche,
  promise,
  targetAudience,
  customResearchPrompt,
  savedResearch,
  savedCitations,
  onResearchReady,
  onClearResearch,
}: Props) {
  const [results, setResults] = useState<ResearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [provider, setProvider] = useState<ResearchProvider>("perplexity");
  const [refinementText, setRefinementText] = useState("");
  const [isApplied, setIsApplied] = useState(!!savedResearch);

  // Load saved research from DB on mount
  useEffect(() => {
    if (savedResearch && results.length === 0) {
      // Detect provider from saved content
      let detectedProvider: ResearchProvider = "perplexity";
      if (savedResearch.includes("[Pesquisa via Qwen") || savedResearch.includes("via Qwen")) {
        detectedProvider = "qwen";
      } else if (savedResearch.includes("[Pesquisa via Gemini") || savedResearch.includes("via Gemini")) {
        detectedProvider = "lovable-ai";
      }
      setResults([{
        provider: detectedProvider,
        content: savedResearch.replace(/^\[Pesquisa via [^\]]+\]\n/, ""),
        citations: savedCitations,
        timestamp: new Date(),
      }]);
      setIsApplied(true);
    }
  }, []);

  const doResearch = async (prompt: string, selectedProvider: ResearchProvider) => {
    setIsSearching(true);
    try {
      const config = PROVIDER_CONFIG[selectedProvider];
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${config.edgeFunction}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            niche,
            promise,
            targetAudience,
            moduleTitle,
            moduleNumber,
            customPrompt: prompt,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Erro ${response.status}`);
      }

      const data = await response.json();
      const newResult: ResearchResult = {
        provider: selectedProvider,
        content: data.research || "",
        citations: data.citations || [],
        timestamp: new Date(),
      };
      setResults((prev) => [newResult, ...prev]);
      setIsApplied(false);

      toast.success(`Pesquisa via ${config.label} concluída!`);
    } catch (err: any) {
      toast.error("Erro na pesquisa: " + err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInitialResearch = () => {
    const prompt = customResearchPrompt || DEFAULT_RESEARCH_PROMPTS[moduleNumber] || "";
    doResearch(prompt, provider);
  };

  const handleRefine = () => {
    if (!refinementText.trim()) return;
    const existingContext = results.map((r) => r.content).join("\n\n---\n\n");
    const refinePrompt = `PESQUISA ANTERIOR:\n${existingContext}\n\n---\n\nCOMPLEMENTO SOLICITADO:\n${refinementText}\n\nCom base na pesquisa anterior, complemente com as informações solicitadas acima. Foque apenas nos novos dados pedidos, sem repetir o que já foi pesquisado.`;
    doResearch(refinePrompt, provider);
    setRefinementText("");
  };

  const handleUseResearch = () => {
    const combined = results
      .map((r) => {
        const config = PROVIDER_CONFIG[r.provider];
        const label = r.provider === "perplexity" ? "Perplexity (web)" : r.provider === "qwen" ? "Qwen (OpenRouter)" : "Gemini";
        return `[Pesquisa via ${label}]\n${r.content}`;
      })
      .join("\n\n========\n\n");
    const allCitations = results.flatMap((r) => r.citations);
    onResearchReady(combined, allCitations);
    setIsApplied(true);
    toast.success("Pesquisa salva e aplicada ao contexto de geração!");
  };

  const handleDownload = () => {
    const text = results
      .map((r, i) => {
        const config = PROVIDER_CONFIG[r.provider];
        let block = `=== Pesquisa ${i + 1} via ${config.label} ===\n${r.timestamp.toLocaleString("pt-BR")}\n\n${r.content}`;
        if (r.citations.length > 0) {
          block += `\n\nFontes:\n${r.citations.map((c, j) => `[${j + 1}] ${c}`).join("\n")}`;
        }
        return block;
      })
      .join("\n\n" + "=".repeat(60) + "\n\n");

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pesquisa-M${moduleNumber}-${moduleTitle.replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Pesquisa exportada!");
  };

  return (
    <div className="border-b border-border/50 bg-card/30">
      {/* Controls */}
      <div className="px-4 py-3 flex items-center gap-2 border-b border-border/30">
        <Select value={provider} onValueChange={(v) => setProvider(v as ResearchProvider)}>
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="perplexity">
              <span className="flex items-center gap-1.5"><Globe className="h-3 w-3" /> Perplexity</span>
            </SelectItem>
            <SelectItem value="lovable-ai">
              <span className="flex items-center gap-1.5"><Brain className="h-3 w-3" /> Gemini</span>
            </SelectItem>
            <SelectItem value="qwen">
              <span className="flex items-center gap-1.5"><Zap className="h-3 w-3" /> Qwen</span>
            </SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={handleInitialResearch} disabled={isSearching} className="gap-1 text-xs">
          {isSearching ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          {results.length > 0 ? "Nova pesquisa" : "Pesquisar"}
        </Button>
        {results.length > 0 && (
          <>
            <Button size="sm" variant="outline" onClick={handleDownload} className="gap-1 text-xs">
              <Download className="h-3 w-3" /> Exportar
            </Button>
            <Button
              size="sm"
              onClick={handleUseResearch}
              disabled={isApplied}
              className="gap-1 text-xs ml-auto"
            >
              {isApplied ? (
                <><CheckCircle2 className="h-3 w-3" /> Salva</>
              ) : (
                <><Plus className="h-3 w-3" /> Salvar e usar na geração</>
              )}
            </Button>
          </>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <ScrollArea className="max-h-[250px]">
          <div className="px-4 py-3 space-y-3">
            {results.map((r, i) => (
              <div key={i} className="border border-border/30 rounded-lg p-3 bg-background/50">
                <div className="flex items-center gap-2 mb-2">
                  <ProviderIcon provider={r.provider} className="h-3 w-3 text-primary" />
                  <Badge variant="secondary" className="text-xs">
                    {PROVIDER_CONFIG[r.provider].label}
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {r.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {r.citations.length > 0 && (
                    <Badge variant="outline" className="text-xs">{r.citations.length} fontes</Badge>
                  )}
                </div>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-6">{r.content}</pre>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Refinement input */}
      {results.length > 0 && (
        <div className="px-4 py-3 border-t border-border/30 flex gap-2">
          <Input
            value={refinementText}
            onChange={(e) => setRefinementText(e.target.value)}
            placeholder="Refinar pesquisa: ex. 'inclua preços dos concorrentes' ou 'pesquise sobre tendências de IA no nicho'"
            className="text-xs h-8"
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleRefine()}
            disabled={isSearching}
          />
          <Button size="sm" variant="outline" onClick={handleRefine} disabled={isSearching || !refinementText.trim()} className="gap-1 text-xs shrink-0">
            <Send className="h-3 w-3" /> Refinar
          </Button>
        </div>
      )}
    </div>
  );
}
