import { useEffect, useRef } from "react";
import { BatchState, BatchLogEntry } from "@/hooks/useBatchGeneration";
import { MODULE_CONFIG } from "@/lib/modules";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, CheckCircle2, XCircle, Loader2, Download, X, RotateCcw } from "lucide-react";

interface Props {
  state: BatchState;
  onCancel: () => void;
  onClose: () => void;
  onDownloadPdf: () => void;
}

function phaseIcon(phase: BatchLogEntry["phase"]) {
  switch (phase) {
    case "done": return <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />;
    case "error": return <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />;
    default: return <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse shrink-0" />;
  }
}

function phaseColor(phase: BatchLogEntry["phase"]) {
  switch (phase) {
    case "done": return "text-green-400";
    case "error": return "text-red-400";
    case "research": return "text-blue-400";
    case "generation": return "text-purple-400";
    case "context": return "text-yellow-400";
    case "saving": return "text-orange-400";
    default: return "text-muted-foreground";
  }
}

export default function BatchGenerationScreen({ state, onCancel, onClose, onDownloadPdf }: Props) {
  const logEndRef = useRef<HTMLDivElement>(null);
  const progressPercent = (state.completedModules.length / state.totalModules) * 100;

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.logs.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      {/* Header */}
      <div className="border-b border-border/50 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Geração em Lote</h1>
            <p className="text-xs text-muted-foreground">
              {state.isDone
                ? "Todos os módulos foram gerados!"
                : state.error
                ? "Execução interrompida"
                : `Processando módulos automaticamente...`}
            </p>
          </div>
        </div>
        {!state.isRunning && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Module status sidebar */}
        <div className="w-72 border-r border-border/50 p-4 space-y-2 shrink-0 overflow-y-auto">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Módulos</p>
          {MODULE_CONFIG.filter(m => m.number > 0).map(config => {
            const isCompleted = state.completedModules.includes(config.number);
            const isCurrent = state.currentModule === config.number && state.isRunning;
            const isFailed = state.failedModule === config.number;
            const isPending = !isCompleted && !isCurrent && !isFailed;

            return (
              <div
                key={config.number}
                className={`rounded-lg px-3 py-2.5 text-sm flex items-center gap-2.5 transition-colors ${
                  isCurrent ? "bg-primary/10 border border-primary/30" :
                  isCompleted ? "bg-green-500/10 border border-green-500/20" :
                  isFailed ? "bg-red-500/10 border border-red-500/20" :
                  "bg-muted/30 border border-transparent"
                }`}
              >
                {isCurrent && <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />}
                {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                {isFailed && <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
                {isPending && <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />}
                <div className="min-w-0">
                  <p className={`font-medium truncate ${isPending ? "text-muted-foreground" : ""}`}>
                    M{config.number} — {config.title}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Log area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Progress bar */}
          <div className="px-6 pt-4 pb-2 shrink-0">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">
                {state.completedModules.length} de {state.totalModules} módulos concluídos
              </span>
              <span className="font-mono text-primary font-bold">{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Terminal-like log */}
          <ScrollArea className="flex-1 px-6 py-2">
            <div className="font-mono text-xs space-y-1.5 pb-4">
              {state.logs.map((log, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-2"
                >
                  {phaseIcon(log.phase)}
                  <span className="text-muted-foreground/60 shrink-0">
                    {log.timestamp.toLocaleTimeString("pt-BR")}
                  </span>
                  {log.moduleNumber > 0 && (
                    <span className="text-primary/70 shrink-0">[M{log.moduleNumber}]</span>
                  )}
                  <span className={phaseColor(log.phase)}>{log.message}</span>
                </motion.div>
              ))}
              <div ref={logEndRef} />
            </div>
          </ScrollArea>

          {/* Bottom actions */}
          <div className="border-t border-border/50 px-6 py-4 flex items-center justify-between shrink-0">
            {state.isRunning ? (
              <>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Não feche esta janela durante o processamento
                </p>
                <Button variant="destructive" size="sm" onClick={onCancel}>
                  <X className="h-4 w-4 mr-1" /> Cancelar
                </Button>
              </>
            ) : state.isDone ? (
              <>
                <p className="text-sm text-green-500 font-medium">✓ Geração concluída com sucesso!</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={onClose}>
                    Fechar
                  </Button>
                  <Button size="sm" onClick={onDownloadPdf} className="gap-1">
                    <Download className="h-4 w-4" /> Baixar Relatório PDF
                  </Button>
                </div>
              </>
            ) : state.error ? (
              <>
                <p className="text-sm text-red-400">Erro no módulo {state.failedModule}: {state.error}</p>
                <Button variant="outline" size="sm" onClick={onClose}>
                  Fechar
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
