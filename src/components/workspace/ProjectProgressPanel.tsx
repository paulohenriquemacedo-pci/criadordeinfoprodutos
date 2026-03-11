import { MODULE_CONFIG } from "@/lib/modules";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, AlertTriangle, Download, FileDown, BarChart3 } from "lucide-react";
import { exportProjectPdf, exportModulePdf } from "@/lib/pdf-export";

interface ModuleData {
  module_number: number;
  generated_content: string | null;
  is_outdated: boolean;
}

interface ProjectData {
  name: string;
  niche: string | null;
  promise: string | null;
  target_audience: string | null;
}

interface Props {
  project: ProjectData;
  modules: ModuleData[];
  viabilityScore: number | null;
  viabilityAnalysis: string | null;
  onRequestViability: () => void;
  isAnalyzing: boolean;
}

export default function ProjectProgressPanel({
  project,
  modules,
  viabilityScore,
  viabilityAnalysis,
  onRequestViability,
  isAnalyzing,
}: Props) {
  const contentModules = MODULE_CONFIG.filter((c) => c.number > 0);
  const completedCount = modules.filter((m) => m.generated_content && !m.is_outdated && m.module_number > 0).length;
  const outdatedCount = modules.filter((m) => m.is_outdated && m.module_number > 0).length;
  const totalModules = contentModules.length;
  const progressPercent = Math.round((completedCount / totalModules) * 100);

  const handleExportAll = () => {
    exportProjectPdf(project, modules);
  };

  const handleExportModule = (mod: ModuleData) => {
    exportModulePdf(project, mod);
  };

  return (
    <div className="space-y-4">
      {/* Progress overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>Progresso do Projeto</span>
            <Badge variant={progressPercent === 100 ? "default" : "secondary"} className="text-xs">
              {completedCount}/{totalModules} módulos
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Progress value={progressPercent} className="flex-1 h-2.5" />
            <span className="text-sm font-bold text-primary">{progressPercent}%</span>
          </div>
          {outdatedCount > 0 && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> {outdatedCount} módulo(s) desatualizado(s)
            </p>
          )}
        </CardContent>
      </Card>

      {/* Module status list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Status dos Módulos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {contentModules.map((config) => {
            const mod = modules.find((m) => m.module_number === config.number);
            const hasContent = !!mod?.generated_content;
            const isOutdated = mod?.is_outdated;

            return (
              <div key={config.number} className="flex items-center gap-2 py-1">
                {isOutdated ? (
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                ) : hasContent ? (
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                )}
                <span className="text-xs flex-1 truncate">
                  M{config.number} — {config.title}
                </span>
                {hasContent && mod && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => handleExportModule(mod)}
                    title="Exportar módulo"
                  >
                    <FileDown className="h-3 w-3" />
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Viability score */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Score de Viabilidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          {viabilityScore !== null ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`text-3xl font-bold ${
                  viabilityScore >= 70 ? "text-primary" : viabilityScore >= 40 ? "text-yellow-500" : "text-destructive"
                }`}>
                  {viabilityScore}
                </div>
                <div className="flex-1">
                  <Progress
                    value={viabilityScore}
                    className={`h-2 ${
                      viabilityScore >= 70 ? "" : viabilityScore >= 40 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-destructive"
                    }`}
                  />
                  <span className="text-xs text-muted-foreground mt-1 block">
                    {viabilityScore >= 70 ? "Alto potencial" : viabilityScore >= 40 ? "Potencial moderado" : "Baixo potencial"}
                  </span>
                </div>
              </div>
              {viabilityAnalysis && (
                <div className="text-xs text-muted-foreground whitespace-pre-wrap bg-secondary/30 rounded-lg p-3 max-h-[400px] overflow-y-auto space-y-2">
                  {viabilityAnalysis.split(/\n(?=BLOCO \d+|--{3,})/).map((block, i) => {
                    const headerMatch = block.match(/^(BLOCO \d+ — .+)/);
                    if (headerMatch) {
                      const [header, ...rest] = block.split("\n");
                      return (
                        <div key={i}>
                          <h4 className="font-semibold text-foreground text-xs mt-2 mb-1">{header.replace(/^-+\s*/, "")}</h4>
                          <p className="whitespace-pre-wrap">{rest.join("\n").replace(/^-+\s*/, "").trim()}</p>
                        </div>
                      );
                    }
                    const trimmed = block.replace(/^-+\s*/, "").trim();
                    return trimmed ? <p key={i} className="whitespace-pre-wrap">{trimmed}</p> : null;
                  })}
                </div>
              )}
              <Button variant="outline" size="sm" className="w-full text-xs" onClick={onRequestViability} disabled={isAnalyzing}>
                {isAnalyzing ? "Analisando..." : "Reavaliar"}
              </Button>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-xs text-muted-foreground mb-3">
                Avalie o potencial de mercado do seu produto antes de produzir.
              </p>
              <Button size="sm" className="w-full text-xs" onClick={onRequestViability} disabled={isAnalyzing}>
                {isAnalyzing ? "Analisando..." : "Analisar Viabilidade"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export */}
      {completedCount > 0 && (
        <Button variant="outline" className="w-full gap-2 text-xs" onClick={handleExportAll}>
          <Download className="h-4 w-4" /> Exportar Projeto Completo (PDF)
        </Button>
      )}
    </div>
  );
}
