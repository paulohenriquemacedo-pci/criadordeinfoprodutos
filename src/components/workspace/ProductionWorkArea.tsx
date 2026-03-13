import { useState, useCallback } from "react";
import { useProductionChapters, useCreateChapter, useUpdateChapter, useDeleteChapter, ProductionChapter } from "@/hooks/useProduction";
import { useProjectModules } from "@/hooks/useProjects";
import { buildProjectContext } from "@/lib/context-builder";
import { DEFAULT_GENERATION_PROMPTS, QUALITY_DIRECTIVES } from "@/lib/default-prompts";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Plus, Sparkles, Save, Trash2, BookOpen, ChevronRight, Loader2, RefreshCw, Download, GripVertical, CheckCircle2, Clock, Zap } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import jsPDF from "jspdf";

interface Props {
  projectId: string;
  project: { name: string; niche: string | null; promise: string | null; target_audience: string | null };
}

export default function ProductionWorkArea({ projectId, project }: Props) {
  const { data: chapters, isLoading } = useProductionChapters(projectId);
  const { data: modules } = useProjectModules(projectId);
  const createChapter = useCreateChapter();
  const updateChapter = useUpdateChapter();
  const deleteChapter = useDeleteChapter();

  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [generatingChapterId, setGeneratingChapterId] = useState<string | null>(null);
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-pro");

  const activeChapter = chapters?.find(c => c.id === activeChapterId);
  const m2Module = modules?.find(m => m.module_number === 2);
  const hasStructure = !!m2Module?.generated_content;

  // Detect product type from M2
  const detectProductType = (): string => {
    const content = m2Module?.generated_content?.toLowerCase() || "";
    if (content.includes("ebook") || content.includes("e-book") || content.includes("livro")) return "ebook";
    if (content.includes("curso") || content.includes("aula") || content.includes("módulo de ensino")) return "curso";
    if (content.includes("mentoria") || content.includes("consultoria") || content.includes("coaching")) return "mentoria";
    return "ebook";
  };

  const productType = detectProductType();
  const chapterLabel = productType === "curso" ? "Aula" : productType === "mentoria" ? "Sessão" : "Capítulo";
  const chapterLabelPlural = productType === "curso" ? "Aulas" : productType === "mentoria" ? "Sessões" : "Capítulos";

  // Extract structure from M2 to suggest chapters
  const extractChaptersFromM2 = (): string[] => {
    const content = m2Module?.generated_content || "";
    const titles: string[] = [];
    
    // Try patterns like "Módulo 1:", "Capítulo 1:", "Aula 1:", numbered lists
    const patterns = [
      /(?:módulo|capítulo|aula|sessão|unidade)\s*\d+[:\s-]+([^\n]+)/gi,
      /^\d+\.\s+(.+?)$/gm,
      /^[-•]\s+(.+?)$/gm,
    ];
    
    for (const pattern of patterns) {
      const matches = [...content.matchAll(pattern)];
      if (matches.length >= 3) {
        titles.push(...matches.map(m => m[1].trim()).filter(t => t.length > 5 && t.length < 120));
        break;
      }
    }
    
    return titles.length > 0 ? titles : [];
  };

  const handleImportFromM2 = async () => {
    const suggested = extractChaptersFromM2();
    if (suggested.length === 0) {
      toast.error("Não foi possível extrair a estrutura do M2. Adicione capítulos manualmente.");
      return;
    }

    const existingCount = chapters?.length || 0;
    for (let i = 0; i < suggested.length; i++) {
      await createChapter.mutateAsync({
        project_id: projectId,
        chapter_order: existingCount + i + 1,
        title: suggested[i],
      });
    }
    toast.success(`${suggested.length} ${chapterLabelPlural.toLowerCase()} importados do M2!`);
  };

  const handleAddChapter = async () => {
    const nextOrder = (chapters?.length || 0) + 1;
    const chapter = await createChapter.mutateAsync({
      project_id: projectId,
      chapter_order: nextOrder,
      title: `${chapterLabel} ${nextOrder}`,
    });
    setActiveChapterId(chapter.id);
    setEditTitle(chapter.title);
    setEditContent("");
  };

  const handleSelectChapter = (chapter: ProductionChapter) => {
    setActiveChapterId(chapter.id);
    setEditTitle(chapter.title);
    setEditContent(chapter.generated_content || "");
  };

  const handleSaveTitle = async () => {
    if (!activeChapter) return;
    await updateChapter.mutateAsync({ id: activeChapter.id, project_id: projectId, title: editTitle });
    toast.success("Título salvo!");
  };

  const handleSaveContent = async () => {
    if (!activeChapter) return;
    await updateChapter.mutateAsync({ id: activeChapter.id, project_id: projectId, generated_content: editContent, status: "completed" });
    toast.success("Conteúdo salvo!");
  };

  const handleDeleteChapter = async (id: string) => {
    await deleteChapter.mutateAsync({ id, project_id: projectId });
    if (activeChapterId === id) {
      setActiveChapterId(null);
      setEditContent("");
      setEditTitle("");
    }
  };

  // Stream generation for a single chapter
  const generateChapter = useCallback(async (chapter: ProductionChapter, allChapters: ProductionChapter[]) => {
    const context = await buildProjectContext(projectId);
    
    const previousChaptersText = allChapters
      .filter(c => c.chapter_order < chapter.chapter_order && c.generated_content)
      .map(c => `${chapterLabel} ${c.chapter_order} — ${c.title}:\n${c.generated_content}`)
      .join("\n\n---\n\n");

    const upcomingChapters = allChapters
      .filter(c => c.chapter_order > chapter.chapter_order)
      .map(c => `${c.chapter_order}. ${c.title}`)
      .join("\n");

    const systemPrompt = `Você é um escritor especialista em criar conteúdo profissional para infoprodutos digitais no mercado brasileiro.
Sua tarefa é escrever o conteúdo completo de um ${chapterLabel.toLowerCase()} de um ${productType}.

REGRAS:
- Escreva conteúdo original, profundo e prático
- Mantenha coerência com capítulos anteriores já escritos
- Use tom de voz consistente com o briefing do projeto
- Inclua exemplos práticos, exercícios ou reflexões quando apropriado
- O conteúdo deve ser completo e publicável
- Formate em Markdown com headers, listas e destaques
${QUALITY_DIRECTIVES}`;

    const userMessage = `${context.fullContext}

========

ESTRUTURA COMPLETA DO PRODUTO (do M2):
${m2Module?.generated_content || "Não disponível"}

========

${previousChaptersText ? `${chapterLabelPlural.toUpperCase()} ANTERIORES JÁ ESCRITOS:\n${previousChaptersText}\n\n========\n\n` : ""}
${upcomingChapters ? `PRÓXIMOS ${chapterLabelPlural.toUpperCase()} (títulos planejados):\n${upcomingChapters}\n\n========\n\n` : ""}

TAREFA: Escreva o conteúdo completo do "${chapterLabel} ${chapter.chapter_order} — ${chapter.title}".
Garanta profundidade, exemplos práticos e coerência com o restante do produto.`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ];

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-chapter`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages, model: `google/${selectedModel}` }),
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
    let textBuffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "" || !line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;
        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta?.content || parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (delta) {
            text += delta;
            if (chapter.id === generatingChapterId || !generatingChapterId) {
              setStreamText(text);
            }
          }
        } catch { /* partial JSON */ }
      }
    }

    return text;
  }, [projectId, m2Module, chapterLabel, chapterLabelPlural, productType, selectedModel, generatingChapterId]);

  const handleGenerateChapter = async () => {
    if (!activeChapter || !chapters) return;
    setIsGenerating(true);
    setGeneratingChapterId(activeChapter.id);
    setStreamText("");
    try {
      const text = await generateChapter(activeChapter, chapters);
      await updateChapter.mutateAsync({ id: activeChapter.id, project_id: projectId, generated_content: text, status: "completed" });
      setEditContent(text);
      toast.success(`${chapterLabel} gerado com sucesso!`);
    } catch (err: any) {
      toast.error("Erro na geração: " + err.message);
    } finally {
      setIsGenerating(false);
      setGeneratingChapterId(null);
      setStreamText("");
    }
  };

  const handleGenerateAll = async () => {
    if (!chapters || chapters.length === 0) return;
    setBatchGenerating(true);
    setBatchProgress(0);
    const pendingChapters = chapters.filter(c => !c.generated_content);
    if (pendingChapters.length === 0) {
      toast.info("Todos os capítulos já foram gerados!");
      setBatchGenerating(false);
      return;
    }

    for (let i = 0; i < pendingChapters.length; i++) {
      const chapter = pendingChapters[i];
      setGeneratingChapterId(chapter.id);
      setStreamText("");
      try {
        // Re-fetch chapters for up-to-date previous content
        const { data: freshChapters } = await (await import("@/integrations/supabase/client")).supabase
          .from("production_chapters" as any)
          .select("*")
          .eq("project_id", projectId)
          .order("chapter_order");

        const text = await generateChapter(chapter, (freshChapters || []) as unknown as ProductionChapter[]);
        await updateChapter.mutateAsync({ id: chapter.id, project_id: projectId, generated_content: text, status: "completed" });
      } catch (err: any) {
        toast.error(`Erro no ${chapterLabel} ${chapter.chapter_order}: ${err.message}`);
      }
      setBatchProgress(((i + 1) / pendingChapters.length) * 100);
    }

    setBatchGenerating(false);
    setGeneratingChapterId(null);
    setStreamText("");
    toast.success(`Todos os ${chapterLabelPlural.toLowerCase()} foram gerados!`);
  };

  const handleExportPdf = () => {
    if (!chapters || chapters.length === 0) return;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;

    // Cover page
    doc.setFontSize(28);
    doc.text(project.name, pageWidth / 2, 80, { align: "center" });
    doc.setFontSize(14);
    if (project.niche) doc.text(project.niche, pageWidth / 2, 100, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")}`, pageWidth / 2, 120, { align: "center" });

    // Chapters
    for (const chapter of chapters.filter(c => c.generated_content)) {
      doc.addPage();
      doc.setFontSize(18);
      doc.text(`${chapterLabel} ${chapter.chapter_order}: ${chapter.title}`, margin, 30);
      doc.setFontSize(11);
      const lines = doc.splitTextToSize(chapter.generated_content!, maxWidth);
      let y = 45;
      for (const line of lines) {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, margin, y);
        y += 5;
      }
    }

    doc.save(`${project.name.replace(/[^a-zA-Z0-9]/g, "_")}_produto_final.pdf`);
    toast.success("PDF do produto exportado!");
  };

  const displayContent = isGenerating && generatingChapterId === activeChapterId ? streamText : editContent;

  const completedCount = chapters?.filter(c => c.generated_content).length || 0;
  const totalCount = chapters?.length || 0;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Chapter list sidebar */}
      <div className="w-64 border-r border-border/50 flex flex-col bg-card/30">
        <div className="p-3 border-b border-border/50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-primary" />
              {chapterLabelPlural}
            </h3>
            <Badge variant="secondary" className="text-xs">{completedCount}/{totalCount}</Badge>
          </div>
          {totalCount > 0 && (
            <Progress value={progressPercent} className="h-1.5 mb-2" />
          )}
          <div className="flex gap-1">
            <Button size="sm" variant="outline" className="flex-1 text-xs gap-1" onClick={handleAddChapter}>
              <Plus className="h-3 w-3" /> Adicionar
            </Button>
            {hasStructure && (!chapters || chapters.length === 0) && (
              <Button size="sm" variant="secondary" className="flex-1 text-xs gap-1" onClick={handleImportFromM2}>
                <RefreshCw className="h-3 w-3" /> Importar M2
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {chapters?.map((chapter) => (
              <button
                key={chapter.id}
                onClick={() => handleSelectChapter(chapter)}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-sm transition-all ${
                  activeChapterId === chapter.id
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold shrink-0"
                  style={{
                    backgroundColor: chapter.generated_content
                      ? "hsl(var(--primary) / 0.2)"
                      : generatingChapterId === chapter.id
                      ? "hsl(var(--accent))"
                      : "hsl(var(--secondary))",
                    color: chapter.generated_content ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                  }}
                >
                  {generatingChapterId === chapter.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : chapter.generated_content ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <Clock className="h-3 w-3" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-muted-foreground">#{chapter.chapter_order}</span>
                  <span className="block truncate text-xs">{chapter.title}</span>
                </div>
              </button>
            ))}

            {(!chapters || chapters.length === 0) && (
              <div className="text-center py-8 text-muted-foreground text-xs">
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
                {hasStructure ? (
                  <p>Importe a estrutura do M2 ou adicione capítulos manualmente.</p>
                ) : (
                  <p>Gere o M2 primeiro para definir a estrutura do produto.</p>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Bottom actions */}
        {chapters && chapters.length > 0 && (
          <div className="p-2 border-t border-border/50 space-y-1">
            <Button
              size="sm"
              variant="default"
              className="w-full text-xs gap-1"
              onClick={handleGenerateAll}
              disabled={batchGenerating || isGenerating}
            >
              {batchGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
              Gerar Todos
            </Button>
            <Button size="sm" variant="outline" className="w-full text-xs gap-1" onClick={handleExportPdf} disabled={completedCount === 0}>
              <Download className="h-3 w-3" /> Exportar PDF
            </Button>
          </div>
        )}
      </div>

      {/* Chapter editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeChapter ? (
          <>
            <div className="border-b border-border/50 px-4 py-3 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Badge variant="outline" className="text-xs shrink-0">#{activeChapter.chapter_order}</Badge>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleSaveTitle}
                    className="text-sm font-semibold border-0 bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                    placeholder="Título do capítulo..."
                  />
                </div>
                <div className="flex items-center gap-1">
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="text-xs border border-border rounded px-2 py-1 bg-background text-foreground"
                  >
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                  </select>
                  <Button size="sm" variant="outline" className="gap-1" onClick={handleSaveContent} disabled={isGenerating}>
                    <Save className="h-3.5 w-3.5" /> Salvar
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1"
                    onClick={handleGenerateChapter}
                    disabled={isGenerating || batchGenerating}
                  >
                    {isGenerating && generatingChapterId === activeChapter.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    {activeChapter.generated_content ? "Regenerar" : "Gerar"}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover {chapterLabel.toLowerCase()}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Isso removerá permanentemente "{activeChapter.title}" e todo seu conteúdo.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteChapter(activeChapter.id)} className="bg-destructive text-destructive-foreground">
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              {batchGenerating && (
                <Progress value={batchProgress} className="h-1.5" />
              )}
            </div>

            <div className="flex-1 overflow-hidden p-4">
              <Textarea
                value={displayContent}
                onChange={(e) => setEditContent(e.target.value)}
                readOnly={isGenerating && generatingChapterId === activeChapter.id}
                className="h-full resize-none font-mono text-sm leading-relaxed"
                placeholder={`Clique em "Gerar" para criar o conteúdo deste ${chapterLabel.toLowerCase()} com IA, ou escreva manualmente...`}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div className="max-w-md">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="text-lg font-semibold mb-2">M9 — Produção de Conteúdo</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Crie o produto final {chapterLabel.toLowerCase()} a {chapterLabel.toLowerCase()}.
                {!hasStructure && " Gere o M2 (Estrutura do Produto) primeiro para definir a estrutura."}
              </p>
              {hasStructure && (!chapters || chapters.length === 0) && (
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleImportFromM2} className="gap-1.5">
                    <RefreshCw className="h-4 w-4" /> Importar Estrutura do M2
                  </Button>
                  <Button variant="outline" onClick={handleAddChapter} className="gap-1.5">
                    <Plus className="h-4 w-4" /> Adicionar Manualmente
                  </Button>
                </div>
              )}
              {chapters && chapters.length > 0 && (
                <p className="text-xs text-muted-foreground">Selecione um {chapterLabel.toLowerCase()} na lista à esquerda.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
