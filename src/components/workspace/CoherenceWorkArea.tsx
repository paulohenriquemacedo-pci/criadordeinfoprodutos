import { useState, useCallback } from "react";
import { useProjectModules } from "@/hooks/useProjects";
import { supabase } from "@/integrations/supabase/client";
import { MODULE_CONFIG } from "@/lib/modules";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  RefreshCw,
  CheckCircle2,
  XCircle,
  Brain,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import StrategicMemoryPanel from "./StrategicMemoryPanel";

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

interface CoherenceResult {
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

interface ModuleResult {
  moduleNumber: number;
  moduleTitle: string;
  result: CoherenceResult | null;
  isChecking: boolean;
  error?: string;
}

interface Props {
  projectId: string;
  project: { niche: string | null; promise: string | null; target_audience: string | null };
}

export default function CoherenceWorkArea({ projectId, project }: Props) {
  const { data: modules } = useProjectModules(projectId);
  const [moduleResults, setModuleResults] = useState<Record<number, ModuleResult>>({});
  const [isRunningAll, setIsRunningAll] = useState(false);

  const generatedModules = (modules || []).filter((m) => m.generated_content);
  const briefing = `Nicho: ${project.niche || "N/A"}\nPromessa: ${project.promise || "N/A"}\nPúblico-Alvo: ${project.target_audience || "N/A"}`;

  const checkModule = useCallback(
    async (moduleNumber: number) => {
      const mod = generatedModules.find((m) => m.module_number === moduleNumber);
      if (!mod?.generated_content) return;

      const title =
        MODULE_CONFIG.find((c) => c.number === moduleNumber)?.title || `Módulo ${moduleNumber}`;

      setModuleResults((prev) => ({
        ...prev,
        [moduleNumber]: { moduleNumber, moduleTitle: title, result: null, isChecking: true },
      }));

      try {
        const previousModules = generatedModules
          .filter((m) => m.module_number < moduleNumber)
          .map((m) => ({
            number: m.module_number,
            title: MODULE_CONFIG.find((c) => c.number === m.module_number)?.title || `Módulo ${m.module_number}`,
            content: m.generated_content!,
          }));

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
              moduleTitle: title,
              moduleContent: mod.generated_content,
              previousModules,
            }),
          }
        );

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || `Erro ${response.status}`);
        }

        const data: CoherenceResult = await response.json();
        setModuleResults((prev) => ({
          ...prev,
          [moduleNumber]: { moduleNumber, moduleTitle: title, result: data, isChecking: false },
        }));
      } catch (err: any) {
        setModuleResults((prev) => ({
          ...prev,
          [moduleNumber]: { moduleNumber, moduleTitle: title, result: null, isChecking: false, error: err.message },
        }));
      }
    },
    [generatedModules, briefing]
  );

  const runAllChecks = useCallback(async () => {
    if (generatedModules.length === 0) {
      toast.error("Nenhum módulo gerado para validar.");
      return;
    }
    setIsRunningAll(true);
    for (const mod of generatedModules) {
      await checkModule(mod.module_number);
    }
    setIsRunningAll(false);
    toast.success("Validação completa de todos os módulos!");
  }, [generatedModules, checkModule]);

  const completedResults = Object.values(moduleResults).filter((r) => r.result);
  const avgScore =
    completedResults.length > 0
      ? Math.round(completedResults.reduce((sum, r) => sum + (r.result?.score || 0), 0) / completedResults.length)
      : null;
  const totalContradictions = completedResults.reduce(
    (sum, r) => sum + (r.result?.contradictions.length || 0),
    0
  );
  const totalGlossaryIssues = completedResults.reduce(
    (sum, r) => sum + (r.result?.glossaryCheck.inconsistent.length || 0),
    0
  );

  const overallStatus =
    avgScore === null ? null : avgScore >= 80 ? "coerente" : avgScore >= 50 ? "atencao" : "incoerente";

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border/50 p-4 shrink-0">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">M0</Badge>
          <h2 className="text-lg font-semibold">Central Estratégica</h2>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Memória estratégica consolidada e validação de coerência entre módulos
        </p>
      </div>

      <Tabs defaultValue="memory" className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-border/50 px-4">
          <TabsList className="h-9 bg-transparent p-0 gap-4">
            <TabsTrigger value="memory" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 pb-2 text-sm gap-1.5">
              <Brain className="h-3.5 w-3.5" /> Memória Estratégica
            </TabsTrigger>
            <TabsTrigger value="coherence" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 pb-2 text-sm gap-1.5">
              <Shield className="h-3.5 w-3.5" /> Validação de Coerência
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="memory" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <StrategicMemoryPanel projectId={projectId} />
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="coherence" className="flex-1 flex flex-col overflow-hidden mt-0">
          {/* Coherence controls */}
          <div className="border-b border-border/50 p-4 flex items-center justify-between shrink-0">
            <p className="text-sm text-muted-foreground">
              Validação cruzada de integridade entre briefing e todos os módulos
            </p>
            <Button
              onClick={runAllChecks}
              disabled={isRunningAll || generatedModules.length === 0}
              className="gap-2"
            >
              {isRunningAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
              {isRunningAll ? "Validando..." : "Validar Tudo"}
            </Button>
          </div>

          {/* Overview cards */}
          {avgScore !== null && (
            <div className="border-b border-border/50 p-4 grid grid-cols-4 gap-3">
              <div
                className={`rounded-lg border p-3 text-center ${
                  overallStatus === "coerente"
                    ? "bg-green-500/10 border-green-500/30"
                    : overallStatus === "atencao"
                    ? "bg-yellow-500/10 border-yellow-500/30"
                    : "bg-destructive/10 border-destructive/30"
                }`}
              >
                <p className="text-2xl font-bold">{avgScore}</p>
                <p className="text-xs text-muted-foreground">Score Médio</p>
              </div>
              <div className="rounded-lg border border-border/50 p-3 text-center">
                <p className="text-2xl font-bold">{completedResults.length}/{generatedModules.length}</p>
                <p className="text-xs text-muted-foreground">Módulos Validados</p>
              </div>
              <div className="rounded-lg border border-border/50 p-3 text-center">
                <p className="text-2xl font-bold text-destructive">{totalContradictions}</p>
                <p className="text-xs text-muted-foreground">Contradições</p>
              </div>
              <div className="rounded-lg border border-border/50 p-3 text-center">
                <p className="text-2xl font-bold text-yellow-500">{totalGlossaryIssues}</p>
                <p className="text-xs text-muted-foreground">Termos Inconsistentes</p>
              </div>
            </div>
          )}

          {/* Progress bar when running all */}
          {isRunningAll && (
            <div className="border-b border-border/50 px-4 py-3 flex items-center gap-3 bg-accent/10">
              <Shield className="h-4 w-4 text-primary animate-pulse" />
              <div className="flex-1">
                <p className="text-sm font-medium">Validando módulos...</p>
                <Progress
                  value={
                    (Object.values(moduleResults).filter((r) => !r.isChecking).length /
                      Math.max(generatedModules.length, 1)) *
                    100
                  }
                  className="mt-2 h-1.5"
                />
              </div>
            </div>
          )}

          {/* Module results */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {generatedModules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Shield className="h-12 w-12 text-muted-foreground/20 mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground">Nenhum módulo gerado</h3>
                  <p className="text-sm text-muted-foreground/70 mt-1 max-w-md">
                    Gere conteúdo nos módulos M1-M8 primeiro. O Orquestrador validará a coerência entre eles.
                  </p>
                </div>
              ) : (
                generatedModules.map((mod) => {
                  const mr = moduleResults[mod.module_number];
                  const title =
                    MODULE_CONFIG.find((c) => c.number === mod.module_number)?.title ||
                    `Módulo ${mod.module_number}`;
                  const result = mr?.result;
                  const isChecking = mr?.isChecking;

                  return (
                    <ModuleCoherenceCard
                      key={mod.module_number}
                      moduleNumber={mod.module_number}
                      title={title}
                      result={result}
                      isChecking={isChecking}
                      error={mr?.error}
                      onCheck={() => checkModule(mod.module_number)}
                    />
                  );
                })
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ModuleCoherenceCard({
  moduleNumber,
  title,
  result,
  isChecking,
  error,
  onCheck,
}: {
  moduleNumber: number;
  title: string;
  result: CoherenceResult | null | undefined;
  isChecking?: boolean;
  error?: string;
  onCheck: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

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

  const borderColor = result
    ? result.status === "coerente"
      ? "border-green-500/30"
      : result.status === "atencao"
      ? "border-yellow-500/30"
      : "border-destructive/30"
    : "border-border/50";

  return (
    <div className={`rounded-lg border ${borderColor} overflow-hidden`}>
      <div
        className="p-3 flex items-center gap-3 cursor-pointer hover:bg-accent/5 transition-colors"
        onClick={() => result && setExpanded(!expanded)}
      >
        <StatusIcon className={`h-5 w-5 ${statusColor} shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">M{moduleNumber}</span>
            <span className="text-sm font-medium truncate">{title}</span>
          </div>
          {result && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{result.executiveSummary}</p>
          )}
          {error && <p className="text-xs text-destructive mt-0.5">{error}</p>}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {result && (
            <Badge
              variant="outline"
              className={`text-xs ${
                result.status === "coerente"
                  ? "bg-green-500/10 border-green-500/30"
                  : result.status === "atencao"
                  ? "bg-yellow-500/10 border-yellow-500/30"
                  : "bg-destructive/10 border-destructive/30"
              }`}
            >
              {result.score}/100
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              onCheck();
            }}
            disabled={isChecking}
          >
            {isChecking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </Button>
          {result && (expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
        </div>
      </div>

      {result && expanded && (
        <div className="border-t border-border/30 p-3 space-y-3 bg-card/30">
          {/* Contradictions */}
          {result.contradictions.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Contradições ({result.contradictions.length})
                </span>
              </div>
              <div className="space-y-2">
                {result.contradictions.map((c, i) => (
                  <div key={i} className="rounded-md border border-destructive/20 bg-destructive/5 p-2.5 text-xs space-y-1">
                    <p className="font-medium text-destructive">{c.issue}</p>
                    <p className="text-muted-foreground">📍 {c.location}</p>
                    <p>💡 {c.suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Glossary */}
          {result.glossaryCheck.inconsistent.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider">Glossário</span>
              </div>
              <div className="space-y-2">
                {result.glossaryCheck.inconsistent.map((g, i) => (
                  <div key={i} className="rounded-md border border-yellow-500/20 bg-yellow-500/5 p-2.5 text-xs">
                    <p className="font-medium">"{g.term}"</p>
                    <p className="text-muted-foreground">Variações: {g.variants.join(", ")}</p>
                    <p className="text-primary">✅ Recomendado: "{g.recommended}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tone */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider">Tom de Voz</span>
              {result.toneCheck.aligned ? (
                <CheckCircle2 className="h-3 w-3 text-green-500" />
              ) : (
                <XCircle className="h-3 w-3 text-destructive" />
              )}
            </div>
            <div
              className={`rounded-md border p-2.5 text-xs space-y-1 ${
                result.toneCheck.aligned ? "border-green-500/20 bg-green-500/5" : "border-yellow-500/20 bg-yellow-500/5"
              }`}
            >
              <p><span className="text-muted-foreground">Esperado:</span> {result.toneCheck.expected}</p>
              <p><span className="text-muted-foreground">Detectado:</span> {result.toneCheck.detected}</p>
              {result.toneCheck.notes && <p className="text-muted-foreground italic">{result.toneCheck.notes}</p>}
            </div>
          </div>

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Lightbulb className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Recomendações ({result.recommendations.length})
                </span>
              </div>
              <div className="space-y-1.5">
                {result.recommendations.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="text-primary font-bold">{i + 1}.</span>
                    <p>{r}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
