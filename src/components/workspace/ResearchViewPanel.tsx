import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Globe, Brain, Zap, FileText, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  moduleId: string;
}

interface EngineData {
  key: string;
  label: string;
  icon: React.ReactNode;
  content: string | null;
  citations: string[] | null;
}

export default function ResearchViewPanel({ moduleId }: Props) {
  const [engines, setEngines] = useState<EngineData[]>([]);
  const [customResearch, setCustomResearch] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("modules")
        .select("research_perplexity, research_perplexity_citations, research_gemini, research_gemini_citations, research_qwen, research_qwen_citations, custom_research")
        .eq("id", moduleId)
        .single();

      if (data) {
        const list: EngineData[] = [];
        if ((data as any).research_perplexity) {
          list.push({
            key: "perplexity",
            label: "Perplexity",
            icon: <Globe className="h-3.5 w-3.5" />,
            content: (data as any).research_perplexity,
            citations: (data as any).research_perplexity_citations,
          });
        }
        if ((data as any).research_gemini) {
          list.push({
            key: "gemini",
            label: "Gemini",
            icon: <Brain className="h-3.5 w-3.5" />,
            content: (data as any).research_gemini,
            citations: (data as any).research_gemini_citations,
          });
        }
        if ((data as any).research_qwen) {
          list.push({
            key: "qwen",
            label: "Qwen",
            icon: <Zap className="h-3.5 w-3.5" />,
            content: (data as any).research_qwen,
            citations: (data as any).research_qwen_citations,
          });
        }
        setEngines(list);
        setCustomResearch((data as any).custom_research || null);
      }
      setLoading(false);
    };
    load();
  }, [moduleId]);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copiado!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const hasAnyResearch = engines.length > 0 || !!customResearch;

  if (loading) {
    return (
      <div className="px-4 py-6 text-center text-sm text-muted-foreground animate-pulse">
        Carregando pesquisas...
      </div>
    );
  }

  if (!hasAnyResearch) {
    return (
      <div className="px-4 py-6 text-center text-sm text-muted-foreground">
        Nenhuma pesquisa realizada para este módulo.
      </div>
    );
  }

  const allTabs = [
    ...engines.map((e) => e.key),
    ...(customResearch ? ["custom"] : []),
  ];

  return (
    <div className="border-b border-border/50 bg-card/30">
      <Tabs defaultValue={allTabs[0]} className="w-full">
        <div className="px-4 pt-3 pb-1">
          <TabsList className="h-8 w-full justify-start bg-muted/50">
            {engines.map((e) => (
              <TabsTrigger key={e.key} value={e.key} className="gap-1.5 text-xs h-7 data-[state=active]:bg-background">
                {e.icon}
                {e.label}
              </TabsTrigger>
            ))}
            {customResearch && (
              <TabsTrigger value="custom" className="gap-1.5 text-xs h-7 data-[state=active]:bg-background">
                <FileText className="h-3.5 w-3.5" />
                Externa
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {engines.map((e) => (
          <TabsContent key={e.key} value={e.key} className="mt-0">
            <ScrollArea className="max-h-[300px]">
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {e.icon}
                    <span className="text-sm font-medium">{e.label}</span>
                    {e.citations && e.citations.length > 0 && (
                      <Badge variant="outline" className="text-[10px]">
                        {e.citations.length} fontes
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-xs"
                    onClick={() => handleCopy(e.key, e.content || "")}
                  >
                    {copiedKey === e.key ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copiedKey === e.key ? "Copiado" : "Copiar"}
                  </Button>
                </div>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed bg-background/50 rounded-lg p-3 border border-border/30">
                  {(e.content || "").replace(/^\[Pesquisa via [^\]]+\]\n/, "")}
                </pre>
                {e.citations && e.citations.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">Fontes:</span>
                    {e.citations.map((c, i) => (
                      <div key={i} className="text-xs text-primary/70 truncate">
                        [{i + 1}] {c}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}

        {customResearch && (
          <TabsContent value="custom" className="mt-0">
            <ScrollArea className="max-h-[300px]">
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5" />
                    <span className="text-sm font-medium">Pesquisa Externa</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-xs"
                    onClick={() => handleCopy("custom", customResearch)}
                  >
                    {copiedKey === "custom" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copiedKey === "custom" ? "Copiado" : "Copiar"}
                  </Button>
                </div>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed bg-background/50 rounded-lg p-3 border border-border/30">
                  {customResearch}
                </pre>
              </div>
            </ScrollArea>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
