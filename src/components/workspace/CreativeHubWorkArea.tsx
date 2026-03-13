import { useState, useCallback } from "react";
import { useCreativeTasks, useCreateCreativeTask, useDeleteCreativeTask, useCreateCreativeVersion, useCreativeVersions, useToggleFavoriteVersion, useUpdateCreativeTask, CreativeTask } from "@/hooks/useCreativeHub";
import MaterialCreator from "./MaterialCreator";
import { useProducts } from "@/hooks/useOffers";
import { buildProjectContext } from "@/lib/context-builder";
import { MODULE_CONFIG } from "@/lib/modules";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Sparkles, Trash2, Palette, Loader2, Star, ArrowLeft, RefreshCw, ChevronRight, Instagram, Megaphone, FileText, Copy, Download, MessageSquare, ShoppingBag, Heart, Image } from "lucide-react";
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
  const [newTask, setNewTask] = useState({
    category: "social", title: "", description: "", template_type: "", tone: "",
    context_modules: [1, 2, 3, 4, 5, 6, 7, 8] as number[],
    content_focus: "engagement" as string,
    product_id: "" as string,
    prompt_input: "" as string,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: products } = useProducts(projectId);

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
      content_focus: newTask.content_focus,
      product_id: newTask.product_id || undefined,
      prompt_input: newTask.prompt_input || undefined,
    } as any);
    setNewTaskOpen(false);
    setNewTask({ category: "social", title: "", description: "", template_type: "", tone: "", context_modules: [1, 2, 3, 4, 5, 6, 7, 8], content_focus: "engagement", product_id: "", prompt_input: "" });
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
                      {(task as any).content_focus === "product" && <Badge variant="outline" className="text-[10px] border-primary/30"><ShoppingBag className="h-2.5 w-2.5 mr-0.5" />Produto</Badge>}
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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

            {/* Content Focus Toggle */}
            <div>
              <label className="text-sm font-medium mb-2 block">Foco do conteúdo</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setNewTask(p => ({ ...p, content_focus: "engagement", product_id: "" }))}
                  className={`flex-1 p-3 rounded-lg border text-left transition-all ${newTask.content_focus === "engagement" ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/30"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Heart className="h-4 w-4 text-pink-500" />
                    <span className="text-sm font-medium">Engajamento</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Autoridade, visibilidade e conexão com a audiência</p>
                </button>
                <button
                  onClick={() => setNewTask(p => ({ ...p, content_focus: "product" }))}
                  className={`flex-1 p-3 rounded-lg border text-left transition-all ${newTask.content_focus === "product" ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/30"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <ShoppingBag className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Produto</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Conversão, venda direta com detalhes da oferta do M9</p>
                </button>
              </div>
            </div>

            {/* Product Selector (when product focus) */}
            {newTask.content_focus === "product" && products && products.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-1 block">Produto do M9</label>
                <Select value={newTask.product_id} onValueChange={v => setNewTask(p => ({ ...p, product_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione um produto..." /></SelectTrigger>
                  <SelectContent>
                    {products.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.name} {p.price ? `- R$ ${p.price}` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Custom Prompt */}
            <div>
              <label className="text-sm font-medium mb-1 block">Prompt personalizado (opcional)</label>
              <Textarea
                placeholder="Instruções adicionais para a IA... (ex: use metáforas esportivas, mencione cases reais, foque na dor de perder tempo)"
                value={newTask.prompt_input}
                onChange={e => setNewTask(p => ({ ...p, prompt_input: e.target.value }))}
                rows={3}
                className="text-xs"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Esse prompt será injetado em todas as gerações desta task</p>
            </div>

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
  const { data: products } = useProducts(projectId);

  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [showRefinementFor, setShowRefinementFor] = useState<string | null>(null);
  const [materialVersion, setMaterialVersion] = useState<{ content: string } | null>(null);

  const taskAny = task as any;
  const contentFocus = taskAny.content_focus || "engagement";
  const productId = taskAny.product_id;
  const customPromptInput = taskAny.prompt_input || "";

  // Fetch product details if product focus
  const selectedProduct = products?.find((p: any) => p.id === productId);

  const handleGenerate = useCallback(async (refinementPrompt?: string) => {
    setIsGenerating(true);
    setStreamText("");
    try {
      const context = await buildProjectContext(projectId);

      // Build product context if product-focused
      let productContext = "";
      if (contentFocus === "product" && selectedProduct) {
        const sp = selectedProduct as any;
        productContext = `\n\nCONTEXTO DO PRODUTO (M9 - Oferta):
- Nome: ${sp.name}
- Preço: R$ ${sp.price || "não definido"}
- Tipo: ${sp.product_type}
- Descrição: ${sp.description || "N/A"}
- Posicionamento: ${sp.positioning || "N/A"}
- Transformação alvo: ${sp.target_transformation || "N/A"}
- Formato de entrega: ${sp.delivery_format || "N/A"}`;

        // Try to fetch bonuses and bumps
        try {
          const [bonusRes, bumpRes] = await Promise.all([
            supabase.from("product_bonuses" as any).select("*").eq("product_id", sp.id),
            supabase.from("product_bumps" as any).select("*").eq("product_id", sp.id),
          ]);
          if (bonusRes.data?.length) {
            productContext += `\n\nBÔNUS DA OFERTA:\n${(bonusRes.data as any[]).map((b: any) => `- ${b.name}: ${b.description || ""} (Valor percebido: R$ ${b.perceived_value || "N/A"})`).join("\n")}`;
          }
          if (bumpRes.data?.length) {
            productContext += `\n\nORDER BUMPS/UPSELLS:\n${(bumpRes.data as any[]).map((b: any) => `- ${b.name} (${b.bump_type}): R$ ${b.price || "N/A"} - ${b.description || ""}`).join("\n")}`;
          }
        } catch {}
      }

      const focusInstruction = contentFocus === "product"
        ? "FOCO: PRODUTO/CONVERSÃO. Priorize a venda direta, destaque a oferta, bônus, urgência e transformação. Use os detalhes do produto para criar copy persuasiva."
        : "FOCO: ENGAJAMENTO/AUTORIDADE. Priorize conexão com a audiência, construção de autoridade e visibilidade. NÃO faça pitch de venda direta.";

      const customPromptSection = customPromptInput
        ? `\nINSTRUÇÕES PERSONALIZADAS DO USUÁRIO:\n${customPromptInput}\n`
        : "";

      const systemPrompt = `Você é um especialista criativo em marketing digital e infoprodutos no mercado brasileiro.
Sua tarefa é criar peças de conteúdo profissionais, criativas e estratégicas.

${focusInstruction}

CONTEXTO DO PROJETO:
${context.briefing}

${context.fullContext}${productContext}
${customPromptSection}
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
  }, [projectId, task, versions, createVersion, contentFocus, selectedProduct, customPromptInput]);

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

  const downloadVersion = (version: { version_number: number; content: string }) => {
    const filename = `${task.title.replace(/[^a-zA-Z0-9]/g, "_")}_v${version.version_number}.md`;
    const blob = new Blob([version.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Download iniciado!");
  };

  if (materialVersion) {
    return (
      <MaterialCreator
        projectId={projectId}
        versionContent={materialVersion.content}
        taskTitle={task.title}
        onBack={() => setMaterialVersion(null)}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-border/50 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold truncate">{task.title}</h3>
            <Badge variant="outline" className="text-[10px]">{CATEGORIES.find(c => c.id === task.category)?.label}</Badge>
            {contentFocus === "product" && <Badge variant="outline" className="text-[10px] border-primary/30"><ShoppingBag className="h-2.5 w-2.5 mr-0.5" />Produto</Badge>}
            {contentFocus === "engagement" && <Badge variant="outline" className="text-[10px] border-pink-500/30"><Heart className="h-2.5 w-2.5 mr-0.5" />Engajamento</Badge>}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {task.description && <p className="text-xs text-muted-foreground truncate">{task.description}</p>}
            {selectedProduct && <Badge variant="secondary" className="text-[10px]">{(selectedProduct as any).name}</Badge>}
          </div>
        </div>
        <Button size="sm" variant="default" className="gap-1.5" onClick={() => handleGenerate()} disabled={isGenerating}>
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {versions && versions.length > 0 ? "Nova Versão" : "Gerar"}
        </Button>
      </div>

      {/* Custom prompt indicator */}
      {customPromptInput && (
        <div className="px-3 py-1.5 bg-accent/30 border-b border-border/30 flex items-center gap-2">
          <MessageSquare className="h-3 w-3 text-primary" />
          <span className="text-[10px] text-muted-foreground truncate">Prompt personalizado: "{customPromptInput.slice(0, 80)}{customPromptInput.length > 80 ? "..." : ""}"</span>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
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
                        {v.refinement_prompt && (
                          <button
                            onClick={() => setShowRefinementFor(showRefinementFor === v.id ? null : v.id)}
                            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
                          >
                            <MessageSquare className="h-2.5 w-2.5" />
                            <span className="truncate max-w-[180px]">"{v.refinement_prompt}"</span>
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMaterialVersion({ content: v.content })} title="Criar Material Visual">
                          <Image className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => downloadVersion(v)} title="Download .md">
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(v.content)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleFav.mutate({ id: v.id, task_id: task.id, is_favorite: !v.is_favorite })}>
                          <Star className={`h-3 w-3 ${v.is_favorite ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                        </Button>
                      </div>
                    </div>
                    {/* Expanded refinement prompt */}
                    {showRefinementFor === v.id && v.refinement_prompt && (
                      <div className="mb-3 p-2 rounded bg-accent/40 border border-border/30">
                        <p className="text-[11px] text-muted-foreground font-medium mb-0.5">Prompt usado nesta versão:</p>
                        <p className="text-xs text-foreground/80">{v.refinement_prompt}</p>
                      </div>
                    )}
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
