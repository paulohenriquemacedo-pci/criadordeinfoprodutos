import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useProjects, useCreateProject } from "@/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Sparkles, LogOut, FolderOpen, Clock, FileText, Rocket, Upload, ArrowLeft, Zap, Trash2, HelpCircle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { MODULE_CONFIG } from "@/lib/modules";
import { HelpTooltip } from "@/components/HelpTooltip";
import { WelcomeDialog } from "@/components/WelcomeDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useBatchGeneration } from "@/hooks/useBatchGeneration";
import { useProjectModules } from "@/hooks/useProjects";
import BatchGenerationScreen from "@/components/workspace/BatchGenerationScreen";
import { exportProjectPdf, exportResearchPdf } from "@/lib/pdf-export";

type CreationMode = null | "scratch" | "existing";

export default function Dashboard() {
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const queryClient = useQueryClient();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<CreationMode>(null);
  const [form, setForm] = useState({ name: "", niche: "", promise: "", target_audience: "" });
  const [batchProjectId, setBatchProjectId] = useState<string | null>(null);
  const batch = useBatchGeneration();

  const handleBatchGenerate = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setBatchProjectId(projectId);
    batch.runGenerationOnly(projectId);
  };

  const handleDeleteProject = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    try {
      // Delete modules first (cascade should handle, but be safe)
      await supabase.from("modules").delete().eq("project_id", projectId);
      await supabase.from("project_files").delete().eq("project_id", projectId);
      await supabase.from("projects").delete().eq("id", projectId);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Projeto excluído com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao excluir projeto: " + err.message);
    }
  };

  const handleBatchDownloadPdf = async () => {
    if (!batchProjectId) return;
    const project = projects?.find(p => p.id === batchProjectId);
    if (!project) return;
    const { data: modules } = await supabase.from("modules").select("*").eq("project_id", batchProjectId).order("module_number");
    if (!modules) return;
    const hasGenerated = modules.some(m => m.generated_content);
    const hasResearch = modules.some(m => m.research_result || (m as any).research_perplexity || (m as any).research_gemini || (m as any).research_qwen);
    if (hasGenerated) {
      exportProjectPdf(project, modules);
    } else if (hasResearch) {
      exportResearchPdf(project, modules);
    }
  };

  const handleBatchClose = () => {
    setBatchProjectId(null);
    batch.reset();
  };

  const resetDialog = () => {
    setMode(null);
    setForm({ name: "", niche: "", promise: "", target_audience: "" });
  };

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) resetDialog();
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    const project = await createProject.mutateAsync(form);
    handleOpenChange(false);
    navigate(`/project/${project.id}`);
  };

  const getProgress = (status: string) => {
    const contentModules = MODULE_CONFIG.filter((m) => m.number > 0);
    const idx = contentModules.findIndex((m) => m.title.toLowerCase().includes(status.toLowerCase()));
    return idx >= 0 ? Math.round(((idx + 1) / contentModules.length) * 100) : 0;
  };

  return (
    <div className="min-h-screen bg-background">
      <WelcomeDialog />
      {/* Header */}
      <header className="border-b border-border/50 glass-panel sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold gradient-text">Orquestrador</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">Seus Projetos</h1>
              <HelpTooltip text="Aqui ficam todos os seus infoprodutos. Clique em um projeto para abrir a área de trabalho ou crie um novo." side="right" />
            </div>
            <p className="text-muted-foreground mt-1">Gerencie seus infoprodutos com IA</p>
          </div>
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Novo Projeto
              </Button>
              <HelpTooltip text="Crie um projeto do zero (preenchendo briefing) ou a partir de material existente (enviando PDFs)." side="bottom" />
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              {/* Step 1: Choose mode */}
              {mode === null && (
                <>
                  <DialogHeader>
                    <DialogTitle>Como deseja começar?</DialogTitle>
                    <DialogDescription>Escolha a forma de criar seu infoproduto</DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6">
                    <button
                      onClick={() => setMode("scratch")}
                      className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all text-center group"
                    >
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Rocket className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">Criar do Zero</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Preencha o briefing e a IA desenvolve todo o produto para você
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => setMode("existing")}
                      className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all text-center group"
                    >
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Upload className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">Produto Existente</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Envie seu material e a IA analisa e complementa o projeto
                        </p>
                      </div>
                    </button>
                  </div>
                </>
              )}

              {/* Step 2a: From scratch */}
              {mode === "scratch" && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setMode(null)}>
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      Criar do Zero
                    </DialogTitle>
                    <DialogDescription>Configure as informações base do seu infoproduto</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Input placeholder="Nome do projeto" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                    <Input placeholder="Nicho (ex: marketing digital)" value={form.niche} onChange={(e) => setForm((p) => ({ ...p, niche: e.target.value }))} />
                    <Textarea placeholder="Promessa principal do produto" value={form.promise} onChange={(e) => setForm((p) => ({ ...p, promise: e.target.value }))} />
                    <Textarea placeholder="Público-alvo" value={form.target_audience} onChange={(e) => setForm((p) => ({ ...p, target_audience: e.target.value }))} />
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreate} disabled={createProject.isPending || !form.name.trim()}>
                      {createProject.isPending ? "Criando..." : "Criar Projeto"}
                    </Button>
                  </DialogFooter>
                </>
              )}

              {/* Step 2b: From existing product */}
              {mode === "existing" && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setMode(null)}>
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      A partir de Produto Existente
                    </DialogTitle>
                    <DialogDescription>
                      Dê um nome ao projeto. Após criá-lo, você poderá enviar seus PDFs (Livro Principal, Bônus e Order Bumps) na área de trabalho para a IA analisar e complementar.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Input placeholder="Nome do projeto" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                    <Input placeholder="Nicho (ex: marketing digital)" value={form.niche} onChange={(e) => setForm((p) => ({ ...p, niche: e.target.value }))} />
                    <div className="rounded-lg border border-border/50 bg-secondary/20 p-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <FileText className="h-4 w-4 text-primary" />
                        Próximo passo: envie seus materiais
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Após criar o projeto, use o painel "Material Base" na área de trabalho para enviar o <strong>Livro Principal</strong>, <strong>Bônus</strong> e <strong>Order Bumps</strong>. A IA vai ler e analisar todo o conteúdo para dar continuidade ao seu projeto.
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreate} disabled={createProject.isPending || !form.name.trim()}>
                      {createProject.isPending ? "Criando..." : "Criar e Enviar Materiais"}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader><div className="h-5 bg-muted rounded w-2/3" /><div className="h-3 bg-muted rounded w-1/2 mt-2" /></CardHeader>
                <CardContent><div className="h-2 bg-muted rounded w-full" /></CardContent>
              </Card>
            ))}
          </div>
        ) : projects?.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <FolderOpen className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-muted-foreground">Nenhum projeto ainda</h2>
            <p className="text-muted-foreground/70 mt-1">Crie seu primeiro infoproduto para começar</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects?.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className="cursor-pointer hover:border-primary/30 hover:glow-shadow transition-all duration-300 group"
                  onClick={() => navigate(`/project/${project.id}`)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">{project.name}</CardTitle>
                    <CardDescription>{project.niche || "Sem nicho definido"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(project.updated_at), "dd MMM yyyy", { locale: ptBR })}
                      </span>
                      <span className="text-primary font-medium">{project.status}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary/70 rounded-full transition-all" style={{ width: `${getProgress(project.status)}%` }} />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Gerar todos os módulos"
                        onClick={(e) => handleBatchGenerate(e, project.id)}
                      >
                        <Zap className="h-3.5 w-3.5 text-primary" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Excluir projeto"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
                            <AlertDialogDescription>
                              O projeto "{project.name}" e todos os seus módulos serão excluídos permanentemente. Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={(e) => handleDeleteProject(e, project.id)}
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Batch generation fullscreen */}
      <AnimatePresence>
        {batchProjectId && (batch.state.isRunning || batch.state.isDone || batch.state.error) && (
          <BatchGenerationScreen
            state={batch.state}
            onCancel={batch.cancel}
            onClose={handleBatchClose}
            onDownloadPdf={handleBatchDownloadPdf}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
