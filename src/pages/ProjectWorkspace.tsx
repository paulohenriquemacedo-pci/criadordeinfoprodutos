import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useProject, useProjectModules, useUpdateProject, useMarkModulesOutdated } from "@/hooks/useProjects";
import { MODULE_CONFIG, ModuleNumber } from "@/lib/modules";
import WorkflowSidebar from "@/components/workspace/WorkflowSidebar";
import ModuleWorkArea from "@/components/workspace/ModuleWorkArea";
import CoherenceWorkArea from "@/components/workspace/CoherenceWorkArea";
import ProductionWorkArea from "@/components/workspace/ProductionWorkArea";
import CreativeHubWorkArea from "@/components/workspace/CreativeHubWorkArea";
import OfferWorkArea from "@/components/workspace/OfferWorkArea";
import StrategicChatWorkArea from "@/components/workspace/StrategicChatWorkArea";
import ContextSidebar from "@/components/workspace/ContextSidebar";
import BatchGenerationScreen from "@/components/workspace/BatchGenerationScreen";
import BatchConfigDialog, { BatchEngineConfig } from "@/components/workspace/BatchConfigDialog";
import PromptExportImport from "@/components/workspace/PromptExportImport";
import { ArrowLeft, Settings, Search, Sparkles, Download, Trash2, MoreVertical, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpTooltip } from "@/components/HelpTooltip";
import { WelcomeDialog } from "@/components/WelcomeDialog";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useBatchGeneration } from "@/hooks/useBatchGeneration";
import { exportProjectPdf, exportResearchPdf } from "@/lib/pdf-export";
import { supabase } from "@/integrations/supabase/client";
import { AnimatePresence } from "framer-motion";

export default function ProjectWorkspace() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: modules } = useProjectModules(projectId);
  const updateProject = useUpdateProject();
  const markOutdated = useMarkModulesOutdated();

  const getInitialModule = (): ModuleNumber => {
    const param = searchParams.get("m");
    if (param !== null) {
      const num = parseInt(param, 10);
      if (num >= 0 && num <= 12) return num as ModuleNumber;
    }
    return 0;
  };
  const [activeModule, setActiveModuleState] = useState<ModuleNumber>(getInitialModule);

  const setActiveModule = useCallback((mod: ModuleNumber) => {
    setActiveModuleState(mod);
    setSearchParams({ m: String(mod) }, { replace: true });
  }, [setSearchParams]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [batchConfigOpen, setBatchConfigOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", niche: "", promise: "", target_audience: "" });
  const batch = useBatchGeneration();
  const [batchMode, setBatchMode] = useState<"research" | "generation">("research");
  const [clearResearchConfirm, setClearResearchConfirm] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);

  const handleBatchConfirm = (config: BatchEngineConfig) => {
    if (!projectId) return;
    if (batchMode === "research") {
      batch.runResearchOnly(projectId, { researchEngine: config.researchEngine, forceReResearch: config.forceReResearch });
    } else {
      batch.runGenerationOnly(projectId, { generationModel: config.generationModel, researchEngine: config.researchEngine });
    }
  };

  const handleBatchDownloadPdf = async () => {
    if (!project) return;
    const { data: mods } = await supabase.from("modules").select("*").eq("project_id", project.id).order("module_number");
    if (!mods) return;
    const hasGenerated = mods.some(m => m.generated_content);
    const hasResearch = mods.some(m => m.research_result || (m as any).research_perplexity || (m as any).research_gemini || (m as any).research_qwen);
    if (hasGenerated) {
      exportProjectPdf(project, mods);
    } else if (hasResearch) {
      exportResearchPdf(project, mods);
    }
  };

  const handleBatchDownloadResearchTxt = async () => {
    if (!project) return;
    const { data: mods } = await supabase.from("modules").select("*").eq("project_id", project.id).order("module_number");
    if (!mods) return;
    
    const blocks: string[] = [];
    for (const mod of mods) {
      const parts: string[] = [];
      for (const col of ["research_perplexity", "research_gemini", "research_qwen"] as const) {
        const val = (mod as any)[col];
        if (val) parts.push(val);
      }
      // Add research_result only if not duplicate of engine columns
      const resResult = (mod as any).research_result;
      if (resResult && !parts.some(p => resResult.includes(p) || p.includes(resResult))) {
        parts.push(resResult);
      }
      // Add custom/manual research
      const customRes = (mod as any).custom_research;
      if (customRes) parts.push(`[Pesquisa Manual]\n${customRes}`);
      if (parts.length === 0) continue;
      const config = MODULE_CONFIG.find(c => c.number === mod.module_number);
      blocks.push(`${"=".repeat(60)}\nM${mod.module_number} — ${config?.title || ""}\n${"=".repeat(60)}\n\n${parts.join("\n\n---\n\n")}`);
    }
    
    if (blocks.length === 0) {
      toast.error("Nenhuma pesquisa encontrada para exportar.");
      return;
    }

    const text = blocks.join("\n\n\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.replace(/[^a-zA-Z0-9]/g, "_")}_pesquisas_completas.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Todas as pesquisas exportadas (TXT)!");
  };

  const handleBatchDownloadResearchPdf = async (includeCustom = false) => {
    if (!project) return;
    const { data: mods } = await supabase.from("modules").select("*").eq("project_id", project.id).order("module_number");
    if (!mods || mods.length === 0) {
      toast.error("Nenhuma pesquisa encontrada para exportar.");
      return;
    }
    const hasResearch = mods.some((m: any) => m.research_perplexity || m.research_gemini || m.research_qwen || m.research_result);
    if (!hasResearch) {
      toast.error("Nenhuma pesquisa encontrada para exportar.");
      return;
    }
    exportResearchPdf(project, mods as any, { includeCustomResearch: includeCustom });
    toast.success("Pesquisas exportadas em PDF!");
  };

  const handleBatchClearResearch = async () => {
    if (!project) return;
    const { data: mods } = await supabase.from("modules").select("id").eq("project_id", project.id);
    if (!mods) return;
    for (const mod of mods) {
      await supabase.from("modules").update({
        research_result: null,
        research_citations: null,
        research_perplexity: null,
        research_perplexity_citations: null,
        research_gemini: null,
        research_gemini_citations: null,
        research_qwen: null,
        research_qwen_citations: null,
      } as any).eq("id", mod.id);
    }
    setClearResearchConfirm(false);
    toast.success("Todas as pesquisas foram apagadas!");
  };

  const openSettings = () => {
    if (project) {
      setEditForm({
        name: project.name,
        niche: project.niche || "",
        promise: project.promise || "",
        target_audience: project.target_audience || "",
      });
    }
    setSettingsOpen(true);
  };

  const handleSaveSettings = async () => {
    if (!project) return;
    const coreChanged =
      editForm.niche !== (project.niche || "") ||
      editForm.promise !== (project.promise || "") ||
      editForm.target_audience !== (project.target_audience || "");

    await updateProject.mutateAsync({ id: project.id, ...editForm });

    if (coreChanged) {
      await markOutdated.mutateAsync(project.id);
    }
    setSettingsOpen(false);
    toast.success("Projeto atualizado!");
  };

  const currentModule = modules?.find((m) => m.module_number === activeModule);

  if (projectLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando projeto...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Projeto não encontrado</p>
          <Button onClick={() => navigate("/")}>Voltar ao Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <header className="h-14 border-b border-border/50 glass-panel flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-sm font-semibold">{project.name}</h1>
            <p className="text-xs text-muted-foreground">{project.niche || "Sem nicho"}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <HelpTooltip text="Use 'Pesquisar Tudo' para rodar pesquisa de mercado em todos os módulos. 'Gerar Tudo' cria o conteúdo de todos os módulos de uma vez." side="bottom" />
          <PromptExportImport projectId={project.id} />
          <Button variant="outline" size="sm" onClick={() => { setBatchMode("research"); setBatchConfigOpen(true); }} className="gap-1.5" title="Pesquisar todos os módulos de uma vez">
            <Search className="h-4 w-4" /> Pesquisar Tudo
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setBatchMode("generation"); setBatchConfigOpen(true); }} className="gap-1.5" title="Gerar conteúdo para todos os módulos">
            <Sparkles className="h-4 w-4" /> Gerar Tudo
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" title="Mais opções">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleBatchDownloadResearchTxt} className="gap-2">
                <Download className="h-4 w-4" /> Baixar pesquisas (TXT)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBatchDownloadResearchPdf(false)} className="gap-2">
                <Download className="h-4 w-4" /> Pesquisa de mercado (PDF)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBatchDownloadResearchPdf(true)} className="gap-2">
                <Download className="h-4 w-4" /> Pesquisa completa (PDF)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleBatchDownloadPdf} className="gap-2">
                <Download className="h-4 w-4" /> Baixar projeto (PDF)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setClearResearchConfirm(true)} className="gap-2 text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4" /> Apagar todas as pesquisas
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" onClick={() => setWelcomeOpen(true)} title="Como usar">
            <HelpCircle className="h-4 w-4" />
          </Button>
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" onClick={openSettings}>
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configurações do Projeto</DialogTitle>
                <DialogDescription>Alterações no nicho, promessa ou público marcam módulos para atualização.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input placeholder="Nome" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
                <Input placeholder="Nicho" value={editForm.niche} onChange={(e) => setEditForm((p) => ({ ...p, niche: e.target.value }))} />
                <Textarea placeholder="Promessa principal" value={editForm.promise} onChange={(e) => setEditForm((p) => ({ ...p, promise: e.target.value }))} />
                <Textarea placeholder="Público-alvo" value={editForm.target_audience} onChange={(e) => setEditForm((p) => ({ ...p, target_audience: e.target.value }))} />
              </div>
              <DialogFooter>
                <Button onClick={handleSaveSettings} disabled={updateProject.isPending}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* 3-panel layout */}
      <div className="flex-1 flex overflow-hidden min-w-0">
        <WorkflowSidebar
          activeModule={activeModule}
          onSelectModule={setActiveModule}
          modules={modules || []}
        />
        {activeModule === 0 ? (
          <CoherenceWorkArea
            projectId={project.id}
            project={project}
          />
        ) : activeModule === 9 ? (
          <OfferWorkArea
            projectId={project.id}
            project={project}
          />
        ) : activeModule === 10 ? (
          <CreativeHubWorkArea
            projectId={project.id}
            project={project}
          />
        ) : activeModule === 11 ? (
          <ProductionWorkArea
            projectId={project.id}
            project={project}
          />
        ) : activeModule === 12 ? (
          <StrategicChatWorkArea
            projectId={project.id}
            project={project}
          />
        ) : (
          <ModuleWorkArea
            projectId={project.id}
            module={currentModule}
            moduleConfig={MODULE_CONFIG.find((m) => m.number === activeModule)!}
          />
        )}
        {activeModule !== 12 && (
          <ContextSidebar
            project={project}
            projectId={project.id}
            hasGeneratedContent={modules?.some((m) => !!m.generated_content)}
          />
        )}
      </div>

      {/* Batch config dialog */}
      <BatchConfigDialog
        open={batchConfigOpen}
        onOpenChange={setBatchConfigOpen}
        onConfirm={handleBatchConfirm}
        mode={batchMode}
      />

      {/* Batch generation fullscreen */}
      <AnimatePresence>
        {(batch.state.isRunning || batch.state.isDone || batch.state.error) && (
          <BatchGenerationScreen
            state={batch.state}
            onCancel={batch.cancel}
            onClose={batch.reset}
            onDownloadPdf={handleBatchDownloadPdf}
          />
        )}
      </AnimatePresence>

      {/* Clear research confirmation */}
      <AlertDialog open={clearResearchConfirm} onOpenChange={setClearResearchConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar todas as pesquisas?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso removerá todas as pesquisas (Perplexity, Gemini e Qwen) de todos os módulos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleBatchClearResearch} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Apagar tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
