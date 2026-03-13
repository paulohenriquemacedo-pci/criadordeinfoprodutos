import { useState, useCallback } from "react";
import { useCreativeTasks, useCreateCreativeTask, useDeleteCreativeTask, useCreateCreativeVersion, useCreativeVersions, useToggleFavoriteVersion, CreativeTask } from "@/hooks/useCreativeHub";
import { buildProjectContext } from "@/lib/context-builder";
import { MODULE_CONFIG } from "@/lib/modules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Sparkles, Trash2, Palette, Loader2, Star, ArrowLeft, RefreshCw, ChevronRight, Instagram, Megaphone, FileText, Copy } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Props {
  projectId: string;
  project: { name: string; niche: string | null; promise: string | null; target_audience: string | null };
}

const CATEGORIES = [
  { id: "social", label: "Conteúdo Social", icon: Instagram, color: "text-pink-500" },
  { id: "ads", label: "Ads & Landing Pages", icon: Megaphone, color: "text-blue-500" },
  { id: "long", label: "Conteúdo Longo", icon: FileText, color: "text-green-500" },
] as const;

const TEMPLATES: Record<string, Array<{ id: string; label: string; description: string }>> = {
  social: [
    { id: "carousel", label: "Carrossel Instagram", description: "Carrossel educativo ou de vendas com slides estruturados" },
    { id: "reel_script", label: "Roteiro de Reel", description: "Roteiro completo para Reels/TikTok com gancho e CTA" },
    { id: "caption", label: "Legenda de Post", description: "Legenda persuasiva com storytelling e call-to-action" },
    { id: "stories", label: "Sequência de Stories", description: "Sequência estratégica de stories com engajamento" },
  ],
  ads: [
    { id: "meta_ad", label: "Criativo Meta Ads", description: "Copy + conceito visual para Facebook/Instagram Ads" },
    { id: "google_ad", label: "Campanha Google Ads", description: "Headlines, descrições e extensões para Search/Display" },
    { id: "landing_page", label: "Landing Page", description: "Estrutura completa de página de vendas com copy" },
    { id: "headline_pack", label: "Pack de Headlines", description: "10+ headlines testáveis para split testing" },
  ],
  long: [
    { id: "blog_article", label: "Artigo de Blog", description: "Artigo SEO-optimizado com estrutura completa" },
    { id: "youtube_script", label: "Roteiro YouTube", description: "Roteiro completo com retenção e CTAs estratégicos" },
    { id: "lead_magnet", label: "Lead Magnet", description: "Material rico para captura de leads (ebook/checklist)" },
    { id: "tofu_mofu_bofu", label: "Conteúdo de Funil", description: "Peça para TOFU, MOFU ou BOFU com objetivo claro" },
  ],
};

export default function CreativeHubWorkArea({ projectId, project }: Props) {
  const { data: tasks, isLoading } = useCreativeTasks(projectId);
  const createTask = useCreateCreativeTask();
  const deleteTask = useDeleteCreativeTask();

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState({ category: "social", title: "", description: "", template_type: "", tone: "", context_modules: [1, 2, 3, 4, 5, 6, 7, 8] as number[] });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const activeTask = tasks?.find(t => t.id === activeTaskId);

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) { toast.error("Título obrigatório"); return; }
    const task = await createTask.mutateAsync({
      project_id: projectId,
      category: newTask.category,
      title: newTask.title,
      description: newTask.description || undefined,
      template_type: newTask.template_type || undefined,
      tone: newTask.tone || undefined,
      context_modules: newTask.context_modules,
    });
    setNewTaskOpen(false);
    setNewTask({ category: "social", title: "", description: "", template_type: "", tone: "", context_modules: [1, 2, 3, 4, 5, 6, 7, 8] });
    setActiveTaskId(task.id);
  };

  const handleSelectTemplate = (categoryId: string, template: { id: string; label: string; description: string }) => {
    setNewTask(prev => ({ ...prev, category: categoryId, template_type: template.id, title: template.label, description: template.description }));
    setNewTaskOpen(true);
  };

  const handleDeleteTask = async (id: string) => {
    await deleteTask.mutateAsync({ id, project_id: projectId });
    if (activeTaskId === id) setActiveTaskId(null);
    setDeleteConfirm(null);
  };

  const toggleContextModule = (num: number) => {
    setNewTask(prev => ({
      ...prev,
      context_modules: prev.context_modules.includes(num)
        ? prev.context_modules.filter(n => n !== num)
        : [...prev.context_modules, num].sort(),
    }));
  };

  if (activeTask) {
    return <CreativeTaskWorkspace task={activeTask} projectId={projectId} project={project} onBack={() => setActiveTaskId(null)} />;
  }

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Hub Criativo</h2>
            <Badge variant="secondary" className="text-xs">{tasks?.length || 0} tasks</Badge>
          </div>
          <Button size="sm" onClick={() => setNewTaskOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Nova Task
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Templates por categoria */}
          {CATEGORIES.map(cat => (
            <div key={cat.id}>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <cat.icon className={`h-4 w-4 ${cat.color}`} />
                {cat.label}
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
                {TEMPLATES[cat.id].map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(cat.id, template)}
                    className="text-left p-3 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                  >
                    <span className="text-sm font-medium group-hover:text-primary transition-colors">{template.label}</span>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
                  </button>
                ))}
              </div>

              {/* Tasks existentes da categoria */}
              {tasks?.filter(t => t.category === cat.id).map(task => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:border-primary/20 bg-card/50 mb-2 cursor-pointer group"
                  onClick={() => setActiveTaskId(task.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{task.title}</span>
                      {task.template_type && <Badge variant="outline" className="text-[10px]">{task.template_type}</Badge>}
                    </div>
                    {task.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{task.description}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-[10px]">{task.status}</Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(task.id); }}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* New Task Dialog */}
      <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Task Criativa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Categoria</label>
              <Select value={newTask.category} onValueChange={v => setNewTask(p => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Input placeholder="Título da task" value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} />
            <Textarea placeholder="Descreva o que deseja criar... (ex: carrossel sobre gerenciamento de tempo para CLT)" value={newTask.description} onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))} rows={3} />
            <Input placeholder="Tom desejado (ex: informal e provocativo)" value={newTask.tone} onChange={e => setNewTask(p => ({ ...p, tone: e.target.value }))} />
            <div>
              <label className="text-sm font-medium mb-2 block">Módulos de contexto</label>
              <div className="flex flex-wrap gap-2">
                {MODULE_CONFIG.filter(m => m.number >= 1 && m.number <= 8).map(m => (
                  <label key={m.number} className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <Checkbox checked={newTask.context_modules.includes(m.number)} onCheckedChange={() => toggleContextModule(m.number)} />
                    M{m.number}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateTask} disabled={createTask.isPending} className="gap-1.5">
              <Plus className="h-4 w-4" /> Criar Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir task?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação removerá a task e todas as suas versões.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && handleDeleteTask(deleteConfirm)} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ===== Task Workspace with chat + versions =====
function CreativeTaskWorkspace({ task, projectId, project, onBack }: { task: CreativeTask; projectId: string; project: Props["project"]; onBack: () => void }) {
  const { data: versions, isLoading: versionsLoading } = useCreativeVersions(task.id);
  const createVersion = useCreateCreativeVersion();
  const toggleFav = useToggleFavoriteVersion();

  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);

  const handleGenerate = useCallback(async (refinementPrompt?: string) => {
    setIsGenerating(true);
    setStreamText("");
    try {
      const context = await buildProjectContext(projectId);

      // Filter context to only selected modules
      const contextModules = task.context_modules || [1, 2, 3, 4, 5, 6, 7, 8];

      const systemPrompt = `Você é um especialista criativo em marketing digital e infoprodutos no mercado brasileiro.
Sua tarefa é criar peças de conteúdo profissionais, criativas e estratégicas.

CONTEXTO DO PROJETO:
${context.briefing}

${context.fullContext}

REGRAS:
- Crie conteúdo original, prático e direto
- Adapte o tom conforme solicitado
- Use dados e estratégias dos módulos como base
- Formate em Markdown
- Seja específico e acionável
${task.tone ? `- TOM DESEJADO: ${task.tone}` : ""}`;

      const previousVersionsText = versions?.filter(v => v.content).map(v => `VERSÃO ${v.version_number}:\n${v.content}`).join("\n\n---\n\n") || "";

      const userMessage = refinementPrompt
        ? `VERSÕES ANTERIORES:\n${previousVersionsText}\n\nREFINAMENTO SOLICITADO: ${refinementPrompt}`
        : `TASK: ${task.title}\n${task.description ? `DESCRIÇÃO: ${task.description}` : ""}\n${task.template_type ? `TIPO: ${task.template_type}` : ""}\n\nCrie o conteúdo solicitado com qualidade profissional.`;

      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ];

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-creative`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages, model: "google/gemini-2.5-flash" }),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Erro ${res.status}`);
      }
      if (!res.body) throw new Error("Stream não disponível");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ") || line.trim() === "") continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content || parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (delta) { text += delta; setStreamText(text); }
          } catch {}
        }
      }

      // Save version
      const nextVersion = (versions?.length || 0) + 1;
      await createVersion.mutateAsync({
        task_id: task.id,
        version_number: nextVersion,
        content: text,
        refinement_prompt: refinementPrompt || task.description || undefined,
      });

      toast.success(`Versão ${nextVersion} criada!`);
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setIsGenerating(false);
      setStreamText("");
    }
  }, [projectId, task, versions, createVersion]);

  const handleSubmitPrompt = () => {
    if (!prompt.trim() && (!versions || versions.length === 0)) {
      handleGenerate();
    } else if (prompt.trim()) {
      handleGenerate(prompt.trim());
      setPrompt("");
    } else {
      handleGenerate();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  const displayText = isGenerating ? streamText : "";

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-border/50 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold truncate">{task.title}</h3>
            <Badge variant="outline" className="text-[10px]">{CATEGORIES.find(c => c.id === task.category)?.label}</Badge>
          </div>
          {task.description && <p className="text-xs text-muted-foreground truncate">{task.description}</p>}
        </div>
        <Button size="sm" variant="default" className="gap-1.5" onClick={() => handleGenerate()} disabled={isGenerating}>
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {versions && versions.length > 0 ? "Nova Versão" : "Gerar"}
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Versions list + Prompt */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Prompt input */}
          <div className="p-3 border-b border-border/50">
            <div className="flex gap-2">
              <Textarea
                placeholder={versions && versions.length > 0 ? "Peça refinamentos... (ex: torne mais informal, adicione emoji)" : "Descreva detalhes adicionais ou clique Gerar..."}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={2}
                className="text-sm resize-none"
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmitPrompt(); } }}
              />
              <Button size="sm" onClick={handleSubmitPrompt} disabled={isGenerating} className="shrink-0 self-end">
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Streaming preview */}
          {isGenerating && streamText && (
            <div className="p-4 border-b border-border/50 bg-accent/30 max-h-64 overflow-y-auto">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                <span className="text-xs text-primary font-medium">Gerando...</span>
              </div>
              <div className="text-sm whitespace-pre-wrap text-foreground/80">{streamText}</div>
            </div>
          )}

          {/* Versions */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {versionsLoading ? (
                <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></div>
              ) : versions && versions.length > 0 ? (
                versions.map(v => (
                  <div key={v.id} className={`rounded-lg border p-4 ${v.is_favorite ? "border-primary/40 bg-primary/5" : "border-border/50 bg-card/50"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">v{v.version_number}</Badge>
                        {v.refinement_prompt && <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">"{v.refinement_prompt}"</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(v.content)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleFav.mutate({ id: v.id, task_id: task.id, is_favorite: !v.is_favorite })}>
                          <Star className={`h-3 w-3 ${v.is_favorite ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">{v.content}</div>
                  </div>
                ))
              ) : !isGenerating ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Palette className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Nenhuma versão ainda</p>
                  <p className="text-xs mt-1">Clique em "Gerar" para criar a primeira versão</p>
                </div>
              ) : null}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
