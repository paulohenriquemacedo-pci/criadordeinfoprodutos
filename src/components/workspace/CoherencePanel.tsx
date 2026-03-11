import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  BookOpen,
  MessageSquare,
  Lightbulb,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Contradiction {
  issue: string;
  location: string;
  suggestion: string;
}

interface GlossaryInconsistency {
  term: string;
  variants: string[];
  recommended: string;
}

interface ToneCheck {
  expected: string;
  detected: string;
  aligned: boolean;
  notes: string;
}

export interface CoherenceResult {
  score: number;
  status: "coerente" | "atencao" | "incoerente";
  contradictions: Contradiction[];
  glossaryCheck: {
    consistent: string[];
    inconsistent: GlossaryInconsistency[];
  };
  toneCheck: ToneCheck;
  executiveSummary: string;
  recommendations: string[];
}

interface Props {
  projectId: string;
  moduleNumber: number;
  moduleTitle: string;
  moduleContent: string;
  briefing: string;
  previousModules: Array<{ number: number; title: string; content: string }>;
}

export default function CoherencePanel({
  projectId,
  moduleNumber,
  moduleTitle,
  moduleContent,
  briefing,
  previousModules,
}: Props) {
  const [result, setResult] = useState<CoherenceResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [sectionsOpen, setSectionsOpen] = useState<Record<string, boolean>>({
    contradictions: true,
    glossary: false,
    tone: false,
    recommendations: true,
  });

  const toggleSection = (key: string) =>
    setSectionsOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  const runCheck = useCallback(async () => {
    if (!moduleContent) {
      toast.error("Nenhum conteúdo para validar.");
      return;
    }
    setIsChecking(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/coherence-check`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            briefing,
            moduleNumber,
            moduleTitle,
            moduleContent,
            previousModules,
          }),
        }
      );
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Erro ${response.status}`);
      }
      const data: CoherenceResult = await response.json();
      setResult(data);
      setExpanded(true);

      const statusMsg =
        data.status === "coerente"
          ? "✅ Conteúdo coerente!"
          : data.status === "atencao"
          ? "⚠️ Atenção: inconsistências encontradas"
          : "❌ Incoerências graves detectadas";
      toast[data.status === "coerente" ? "success" : data.status === "atencao" ? "warning" : "error"](
        `${statusMsg} (${data.score}/100)`
      );
    } catch (err: any) {
      toast.error("Erro na validação: " + err.message);
    } finally {
      setIsChecking(false);
    }
  }, [briefing, moduleNumber, moduleTitle, moduleContent, previousModules]);

  const StatusIcon = result
    ? result.status === "coerente"
      ? ShieldCheck
      : result.status === "atencao"
      ? ShieldAlert
      : ShieldX
    : Shield;

  const statusColor = result
    ? result.status === "coerente"
      ? "text-green-500"
      : result.status === "atencao"
      ? "text-yellow-500"
      : "text-destructive"
    : "text-muted-foreground";

  const scoreBg = result
    ? result.status === "coerente"
      ? "bg-green-500/10 border-green-500/30"
      : result.status === "atencao"
      ? "bg-yellow-500/10 border-yellow-500/30"
      : "bg-destructive/10 border-destructive/30"
    : "";

  return (
    <div className="border-b border-border/50">
      {/* Header bar */}
      <div
        className="px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-accent/5 transition-colors"
        onClick={() => result && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <StatusIcon className={`h-4 w-4 ${statusColor}`} />
          <span className="text-sm font-medium">Orquestrador de Coerência</span>
          {result && (
            <Badge variant="outline" className={`text-xs ${scoreBg}`}>
              {result.score}/100
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              runCheck();
            }}
            disabled={isChecking || !moduleContent}
            className="gap-1 text-xs h-7"
          >
            {isChecking ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Shield className="h-3 w-3" />
            )}
            {isChecking ? "Validando..." : result ? "Revalidar" : "Validar Coerência"}
          </Button>
          {result && (expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
        </div>
      </div>

      {/* Results */}
      {result && expanded && (
        <ScrollArea className="max-h-[300px]">
          <div className="px-4 pb-4 space-y-3">
            {/* Executive Summary */}
            <div className={`rounded-lg border p-3 ${scoreBg}`}>
              <p className="text-sm">{result.executiveSummary}</p>
            </div>

            {/* Contradictions */}
            {result.contradictions.length > 0 && (
              <Collapsible open={sectionsOpen.contradictions} onOpenChange={() => toggleSection("contradictions")}>
                <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Contradições ({result.contradictions.length})
                  </span>
                  {sectionsOpen.contradictions ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-2">
                  {result.contradictions.map((c, i) => (
                    <div key={i} className="rounded-md border border-destructive/20 bg-destructive/5 p-2.5 text-xs space-y-1">
                      <p className="font-medium text-destructive">{c.issue}</p>
                      <p className="text-muted-foreground">📍 {c.location}</p>
                      <p className="text-foreground">💡 {c.suggestion}</p>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Glossary */}
            <Collapsible open={sectionsOpen.glossary} onOpenChange={() => toggleSection("glossary")}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider">Glossário</span>
                {result.glossaryCheck.inconsistent.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">
                    {result.glossaryCheck.inconsistent.length} inconsistência(s)
                  </Badge>
                )}
                {sectionsOpen.glossary ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                {result.glossaryCheck.inconsistent.map((g, i) => (
                  <div key={i} className="rounded-md border border-yellow-500/20 bg-yellow-500/5 p-2.5 text-xs">
                    <p className="font-medium">"{g.term}"</p>
                    <p className="text-muted-foreground">Variações: {g.variants.join(", ")}</p>
                    <p className="text-primary">✅ Recomendado: "{g.recommended}"</p>
                  </div>
                ))}
                {result.glossaryCheck.consistent.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    ✅ Termos consistentes: {result.glossaryCheck.consistent.join(", ")}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Tone */}
            <Collapsible open={sectionsOpen.tone} onOpenChange={() => toggleSection("tone")}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
                <MessageSquare className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider">Tom de Voz</span>
                {!result.toneCheck.aligned && (
                  <Badge variant="destructive" className="text-[10px] px-1 py-0">Desalinhado</Badge>
                )}
                {sectionsOpen.tone ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className={`rounded-md border p-2.5 text-xs space-y-1 ${result.toneCheck.aligned ? "border-green-500/20 bg-green-500/5" : "border-yellow-500/20 bg-yellow-500/5"}`}>
                  <p><span className="text-muted-foreground">Esperado:</span> {result.toneCheck.expected}</p>
                  <p><span className="text-muted-foreground">Detectado:</span> {result.toneCheck.detected}</p>
                  {result.toneCheck.notes && <p className="text-muted-foreground italic">{result.toneCheck.notes}</p>}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <Collapsible open={sectionsOpen.recommendations} onOpenChange={() => toggleSection("recommendations")}>
                <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
                  <Lightbulb className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Recomendações ({result.recommendations.length})
                  </span>
                  {sectionsOpen.recommendations ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-1.5">
                  {result.recommendations.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="text-primary font-bold">{i + 1}.</span>
                      <p>{r}</p>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
