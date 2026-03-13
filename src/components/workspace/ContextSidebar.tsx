import { useState, useCallback } from "react";
import { useProjectFiles, useProjectModules, useMarkModulesOutdated } from "@/hooks/useProjects";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Upload, FileText, Eye, Loader2, Trash2, Target, Users, Zap, AlertTriangle, BarChart3, FolderOpen, PanelRightClose, PanelRightOpen, Palette } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import ProjectProgressPanel from "./ProjectProgressPanel";
import BrandKitPanel from "./BrandKitPanel";
import { AnimatePresence, motion } from "framer-motion";

interface Project {
  id: string;
  name: string;
  niche: string | null;
  promise: string | null;
  target_audience: string | null;
}

interface Props {
  project: Project;
  projectId: string;
  hasGeneratedContent?: boolean;
}

export default function ContextSidebar({ project, projectId, hasGeneratedContent }: Props) {
  const { user } = useAuth();
  const { data: files } = useProjectFiles(projectId);
  const { data: modules } = useProjectModules(projectId);
  const queryClient = useQueryClient();
  const markOutdated = useMarkModulesOutdated();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadCount, setUploadCount] = useState({ current: 0, total: 0 });
  const [fileType, setFileType] = useState<string>("livro_principal");
  const [viewingFile, setViewingFile] = useState<{ name: string; text: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [showCascadeWarning, setShowCascadeWarning] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Viability score state
  const [viabilityScore, setViabilityScore] = useState<number | null>(null);
  const [viabilityAnalysis, setViabilityAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const hasExistingFileOfType = useCallback(
    (type: string) => files?.some((f) => f.file_type === type),
    [files]
  );

  const handleRequestViability = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/viability-score`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            niche: project.niche || "",
            promise: project.promise || "",
            targetAudience: project.target_audience || "",
          }),
        }
      );
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Erro ${response.status}`);
      }
      const data = await response.json();
      setViabilityScore(data.score);
      setViabilityAnalysis(data.analysis);
      toast.success(`Score de viabilidade: ${data.score}/100`);
    } catch (err: any) {
      toast.error("Erro na análise: " + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const doUploadSingle = useCallback(async (file: File) => {
    if (!user) return;
    const sanitizedName = file.name
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_+/g, "_");
    const filePath = `${user.id}/${projectId}/${Date.now()}_${sanitizedName}`;
    const { error: uploadError } = await supabase.storage
      .from("project-files")
      .upload(filePath, file);
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("project-files")
      .getPublicUrl(filePath);

    const { error: insertError } = await supabase.from("project_files").insert({
      project_id: projectId,
      file_type: fileType,
      file_url: urlData.publicUrl,
      file_name: file.name,
      processing_status: "pending",
    });
    if (insertError) throw insertError;

    try {
      await supabase.functions.invoke("extract-pdf-text", {
        body: { projectId, filePath, fileName: file.name },
      });
    } catch { /* async */ }
  }, [user, projectId, fileType]);

  const doUploadBatch = useCallback(async (filesToUpload: File[]) => {
    if (!user || filesToUpload.length === 0) return;
    setUploading(true);
    setUploadCount({ current: 0, total: filesToUpload.length });
    setUploadProgress(0);

    let successCount = 0;
    for (let i = 0; i < filesToUpload.length; i++) {
      setUploadCount({ current: i + 1, total: filesToUpload.length });
      setUploadProgress(Math.round(((i + 1) / filesToUpload.length) * 100));
      try {
        await doUploadSingle(filesToUpload[i]);
        successCount++;
      } catch (err: any) {
        toast.error(`Erro em "${filesToUpload[i].name}": ${err.message}`);
      }
    }

    if (hasGeneratedContent && successCount > 0) {
      await markOutdated.mutateAsync(projectId);
    }
    queryClient.invalidateQueries({ queryKey: ["project_files", projectId] });
    if (successCount > 0) toast.success(`${successCount} arquivo(s) enviado(s)!`);
    setUploading(false);
    setUploadProgress(0);
    setUploadCount({ current: 0, total: 0 });
  }, [user, doUploadSingle, hasGeneratedContent, markOutdated, projectId, queryClient]);

  const uploadFiles = useCallback(async (fileList: File[]) => {
    const pdfFiles = fileList.filter((f) => f.type === "application/pdf");
    const nonPdfCount = fileList.length - pdfFiles.length;
    if (nonPdfCount > 0) toast.error(`${nonPdfCount} arquivo(s) ignorado(s) — apenas PDFs.`);
    if (pdfFiles.length === 0) return;
    if (hasExistingFileOfType(fileType) && hasGeneratedContent) {
      setPendingFiles(pdfFiles);
      setShowCascadeWarning(true);
      return;
    }
    await doUploadBatch(pdfFiles);
  }, [fileType, hasExistingFileOfType, hasGeneratedContent, doUploadBatch]);

  const confirmCascadeUpload = useCallback(async () => {
    setShowCascadeWarning(false);
    if (pendingFiles.length > 0) {
      await doUploadBatch(pendingFiles);
      setPendingFiles([]);
    }
  }, [pendingFiles, doUploadBatch]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    uploadFiles(Array.from(e.dataTransfer.files));
  }, [uploadFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length > 0) uploadFiles(selected);
    e.target.value = "";
  };

  const deleteFile = async (fileId: string) => {
    setDeletingId(fileId);
    try {
      const { error } = await supabase.from("project_files").delete().eq("id", fileId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["project_files", projectId] });
      toast.success("Arquivo removido.");
    } catch (err: any) {
      toast.error("Erro ao remover: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const fileTypeLabels: Record<string, string> = {
    livro_principal: "Livro Principal",
    bonus: "Bônus",
    order_bump: "Order Bump",
  };

  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("progress");

  const handleTabClick = (tab: string) => {
    if (expanded && activeTab === tab) {
      setExpanded(false);
    } else {
      setActiveTab(tab);
      setExpanded(true);
    }
  };

  return (
    <aside className="border-l border-border/50 bg-card/30 shrink-0 flex flex-col hidden lg:flex relative">
      {/* Collapsed strip with vertical tab buttons */}
      <div className="flex flex-col items-center gap-1 py-2 px-1 border-b border-border/30">
        <Button
          variant={expanded && activeTab === "progress" ? "default" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => handleTabClick("progress")}
          title="Progresso"
        >
          <BarChart3 className="h-4 w-4" />
        </Button>
        <Button
          variant={expanded && activeTab === "context" ? "default" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => handleTabClick("context")}
          title="Contexto"
        >
          <Target className="h-4 w-4" />
        </Button>
        <Button
          variant={expanded && activeTab === "files" ? "default" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => handleTabClick("files")}
          title="Arquivos"
        >
          <FolderOpen className="h-4 w-4" />
        </Button>
        <Button
          variant={expanded && activeTab === "brand" ? "default" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => handleTabClick("brand")}
          title="Brand Kit"
        >
          <Palette className="h-4 w-4" />
        </Button>
        <div className="border-t border-border/30 w-full my-1" />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setExpanded(!expanded)}
          title={expanded ? "Recolher painel" : "Expandir painel"}
        >
          {expanded ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
        </Button>
      </div>

      {/* Expanded content panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 288, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="flex-1 overflow-hidden flex flex-col absolute top-0 right-10 bottom-0 bg-card border-l border-border/50 z-30 shadow-lg"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {activeTab === "progress" ? "Progresso" : activeTab === "context" ? "Contexto" : activeTab === "brand" ? "Brand Kit" : "Arquivos"}
              </span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExpanded(false)}>
                <PanelRightClose className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
              {activeTab === "progress" && (
                <ProjectProgressPanel
                  project={project}
                  modules={modules || []}
                  viabilityScore={viabilityScore}
                  viabilityAnalysis={viabilityAnalysis}
                  onRequestViability={handleRequestViability}
                  isAnalyzing={isAnalyzing}
                />
              )}

              {activeTab === "context" && (
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Identidade do Produto</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 min-w-0">
                      <Target className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-xs text-muted-foreground">Nicho</span>
                        <p className="text-sm truncate">{project.niche || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 min-w-0">
                      <Zap className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-xs text-muted-foreground">Promessa</span>
                        <p className="text-sm truncate">{project.promise || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 min-w-0">
                      <Users className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-xs text-muted-foreground">Público-Alvo</span>
                        <p className="text-sm truncate">{project.target_audience || "—"}</p>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {activeTab === "files" && (
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Material Base</h3>
                  <p className="text-xs text-muted-foreground/70 mb-3">PDFs lidos integralmente pela IA.</p>

                  <Select value={fileType} onValueChange={setFileType}>
                    <SelectTrigger className="mb-3 text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="livro_principal">Livro Principal</SelectItem>
                      <SelectItem value="bonus">Bônus</SelectItem>
                      <SelectItem value="order_bump">Order Bump</SelectItem>
                    </SelectContent>
                  </Select>

                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
                      dragOver ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"
                    }`}
                    onClick={() => document.getElementById("file-input")?.click()}
                  >
                    <input id="file-input" type="file" accept=".pdf" multiple className="hidden" onChange={handleFileInput} />
                    {uploading ? (
                      <div className="space-y-2">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                        <Progress value={uploadProgress} className="h-1" />
                        <p className="text-xs text-muted-foreground">Enviando {uploadCount.current}/{uploadCount.total}...</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-6 w-6 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-xs text-muted-foreground">Arraste PDFs ou clique</p>
                      </>
                    )}
                  </div>

                  <div className="mt-3 space-y-2">
                    {files?.map((f) => (
                      <div key={f.id} className="flex items-center gap-2 p-2 rounded-md bg-secondary/30 group min-w-0 overflow-hidden">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs truncate">{f.file_name}</p>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-[10px] px-1 py-0">{fileTypeLabels[f.file_type] || f.file_type}</Badge>
                            <Badge variant={f.processing_status === "completed" ? "default" : "secondary"} className="text-[10px] px-1 py-0">
                              {f.processing_status === "completed" ? "✓ Lido" : f.processing_status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {f.extracted_text && (
                            <Button variant="ghost" size="icon" className="h-6 w-6"
                              onClick={() => setViewingFile({ name: f.file_name || "Arquivo", text: f.extracted_text! })}>
                              <Eye className="h-3 w-3" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive"
                            disabled={deletingId === f.id} onClick={() => deleteFile(f.id)}>
                            {deletingId === f.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {activeTab === "brand" && (
                <BrandKitPanel projectId={projectId} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={!!viewingFile} onOpenChange={() => setViewingFile(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader><DialogTitle>{viewingFile?.name}</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <pre className="text-sm whitespace-pre-wrap text-muted-foreground p-4">{viewingFile?.text}</pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showCascadeWarning} onOpenChange={setShowCascadeWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Efeito Cascata
            </AlertDialogTitle>
            <AlertDialogDescription>
              Substituir o material base pode desalinhar módulos já gerados. Todos serão marcados como "desatualizados".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingFiles([])}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCascadeUpload}>Substituir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}
