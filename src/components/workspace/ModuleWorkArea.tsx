import { useState, useCallback, useEffect } from "react";
import { useUpdateModule, useModuleVersions } from "@/hooks/useProjects";
import { supabase } from "@/integrations/supabase/client";
import { buildProjectContext, buildPdfParts } from "@/lib/context-builder";
import { DEFAULT_GENERATION_PROMPTS, DEFAULT_RESEARCH_PROMPTS, QUALITY_DIRECTIVES } from "@/lib/default-prompts";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Sparkles, Save, History, AlertTriangle, Loader2, Search, FileText, Trash2, ChevronDown, ChevronRight, MessageSquare, MoreHorizontal } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import PromptEditor from "./PromptEditor";
import ResearchPanel from "./ResearchPanel";
import ResearchChat from "./ResearchChat";
import CustomResearchPanel from "./CustomResearchPanel";
import ResearchViewPanel from "./ResearchViewPanel";

function combineEngineResearch(mod: any): string {
  if (!mod) return "";
  const parts: string[] = [];
  for (const col of ["research_perplexity", "research_gemini", "research_qwen", "research_result"]) {
    const val = mod[col];
    if (val && !parts.includes(val)) parts.push(val);
  }
  return parts.join("\n\n---\n\n");
}

function combineEngineCitations(mod: any): string[] {
  if (!mod) return [];
  const all: string[] = [];
  for (const col of ["research_perplexity_citations", "research_gemini_citations", "research_qwen_citations", "research_citations"]) {
    const cits = mod[col] as string[] | null;
    if (cits) all.push(...cits.filter(c => !all.includes(c)));
  }
  return all;
}

interface ModuleConfig {
  number: number;
  title: string;
  description: string;
}

interface Module {
  id: string;
  module_number: number;
  generated_content: string | null;
  is_outdated: boolean;
  project_id: string;
  research_prompt: string | null;
  generation_prompt: string | null;
}

interface Props {
  projectId: string;
  module: Module | undefined;
  moduleConfig: ModuleConfig;
}

export default function ModuleWorkArea({ projectId, module, moduleConfig }: Props) {
  const [content, setContent] = useState(module?.generated_content || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [researchOpen, setResearchOpen] = useState(false);
  const [researchContext, setResearchContext] = useState(() => combineEngineResearch(module));
  const [researchCitations, setResearchCitations] = useState<string[]>(() => combineEngineCitations(module));
  const [projectData, setProjectData] = useState<{ niche: string; promise: string; target_audience: string } | null>(null);
  const [refinedContext, setRefinedContext] = useState("");
  const [customResearch, setCustomResearch] = useState((module as any)?.custom_research || "");
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-pro");
  const updateModule = useUpdateModule();
  const { data: versions } = useModuleVersions(module?.id);

  const [prevModuleId, setPrevModuleId] = useState(module?.id);
  if (module?.id !== prevModuleId) {
    setPrevModuleId(module?.id);
    setContent(module?.generated_content || "");
    // Load persisted research from DB for the new module
    setResearchContext(combineEngineResearch(module));
    setResearchCitations(combineEngineCitations(module));
    setCustomResearch((module as any)?.custom_research || "");
    setResearchOpen(false);
  }

  // Load project data for research panel
  const ensureProjectData = useCallback(async () => {
    if (projectData) return projectData;
    const { data } = await supabase
      .from("projects")
      .select("niche, promise, target_audience")
      .eq("id", projectId)
      .single();
    const pd = {
      niche: data?.niche || "",
      promise: data?.promise || "",
      target_audience: data?.target_audience || "",
    };
    setProjectData(pd);
    return pd;
  }, [projectData, projectId]);

  // Auto-load project data on mount
  useEffect(() => { ensureProjectData(); }, [ensureProjectData]);

  const handleResearchReady = async (research: string, citations: string[]) => {
    setResearchContext(research);
    setResearchCitations(citations);
    // Persist to DB — save to engine-specific columns to avoid overwrites
    if (module?.id) {
      const updateData: Record<string, any> = {
        research_result: research,
        research_citations: citations,
      };
      // Detect engines present in the combined text and save to their specific columns
      if (research.includes("[Pesquisa via Perplexity")) {
        updateData.research_perplexity = research;
        updateData.research_perplexity_citations = citations;
      }
      if (research.includes("[Pesquisa via Gemini")) {
        updateData.research_gemini = research;
        updateData.research_gemini_citations = citations;
      }
      if (research.includes("[Pesquisa via Qwen")) {
        updateData.research_qwen = research;
        updateData.research_qwen_citations = citations;
      }
      await supabase.from("modules").update(updateData as any).eq("id", module.id);
    }
  };

  const [generationPhase, setGenerationPhase] = useState<string>("");

  const autoResearch = useCallback(async (niche: string, promise: string, targetAudience: string): Promise<{ research: string; citations: string[] } | null> => {
    // Use Perplexity as default for individual module auto-research
    const engineMap: Record<string, { fn: string; label: string }> = {
      perplexity: { fn: "market-research", label: "Perplexity" },
      gemini: { fn: "ai-research", label: "Gemini" },
      qwen: { fn: "qwen-research", label: "Qwen" },
    };
    // Detect preferred engine from existing research pattern or default to perplexity
    const engine = engineMap["perplexity"];
    try {
      setGenerationPhase(`Pesquisando mercado via ${engine.label}...`);
      const researchPrompt = module?.research_prompt || DEFAULT_RESEARCH_PROMPTS[moduleConfig.number] || "";
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${engine.fn}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            niche,
            promise,
            targetAudience,
            moduleTitle: moduleConfig.title,
            moduleNumber: moduleConfig.number,
            customPrompt: researchPrompt,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        console.warn("Auto-research failed, continuing without:", err.error || response.status);
        toast.warning("Pesquisa de mercado falhou — gerando sem dados externos.");
        return null;
      }

      const data = await response.json();
      toast.success("Pesquisa de mercado concluída!");
      return { research: data.research || "", citations: data.citations || [] };
    } catch (err) {
      console.warn("Auto-research error:", err);
      toast.warning("Pesquisa de mercado indisponível — gerando sem dados externos.");
      return null;
    }
  }, [module, moduleConfig]);

  const handleGenerate = useCallback(async () => {
    if (!module) return;
    setIsGenerating(true);
    setStreamText("");

    try {
      // Step 1: Auto-research if no research is applied yet
      let activeResearch = researchContext;
      let activeCitations = researchCitations;

      if (!activeResearch) {
        const pd = await ensureProjectData();
        const result = await autoResearch(pd.niche, pd.promise, pd.target_audience);
        if (result) {
          activeResearch = `[Pesquisa via Perplexity (web)]\n${result.research}`;
          activeCitations = result.citations;
          setResearchContext(activeResearch);
          setResearchCitations(activeCitations);
          // Persist to DB (engine-specific + legacy)
          if (module?.id) {
            await supabase.from("modules").update({
              research_perplexity: activeResearch,
              research_perplexity_citations: activeCitations,
              research_result: activeResearch,
              research_citations: activeCitations,
            } as any).eq("id", module.id);
          }
        }
      }

      // Step 2: Build context and generate
      setGenerationPhase("Construindo contexto do projeto...");
      const context = await buildProjectContext(projectId);
      const pdfParts = await buildPdfParts(context.files);

      let systemPrompt = module.generation_prompt || DEFAULT_GENERATION_PROMPTS[moduleConfig.number] || "";
      if (!systemPrompt) {
        const { data: promptData } = await supabase
          .from("prompts")
          .select("prompt_text")
          .eq("module_number", moduleConfig.number)
          .single();
        systemPrompt = promptData?.prompt_text || "Gere conteúdo estratégico para este módulo.";
      }
      // Append quality directives to every system prompt
      systemPrompt += QUALITY_DIRECTIVES;

      setGenerationPhase("Gerando conteúdo com IA...");
      let userMessage = context.fullContext;
      if (activeResearch) {
        userMessage += `\n\n========\n\nPESQUISA DE MERCADO (DADOS EXTERNOS ATUALIZADOS):\n${activeResearch}`;
        userMessage += `\n\nINSTRUÇÃO CRÍTICA: Você DEVE integrar os dados da pesquisa de mercado acima com o material do projeto. Compare, contraste e enriqueça suas recomendações com dados reais de mercado. NÃO se limite a resumir o material do projeto — use os dados externos para fundamentar, validar ou questionar as premissas do material.`;
        if (activeCitations.length > 0) {
          userMessage += `\n\nFONTES DA PESQUISA:\n${activeCitations.map((c, i) => `[${i + 1}] ${c}`).join("\n")}`;
        }
      }
      // Add refined context from chat interactions
      if (refinedContext) {
        userMessage += `\n\n========\n\nREFINAMENTOS E DADOS COMPLEMENTARES (INTERAÇÕES DO USUÁRIO COM A IA):\n${refinedContext}`;
        userMessage += `\n\nINSTRUÇÃO: Incorpore os refinamentos e dados complementares acima ao conteúdo final. Esses foram pontos específicos aprofundados pelo usuário e devem ser refletidos na geração.`;
      }
      // Add user's own external research
      if (customResearch) {
        userMessage += `\n\n========\n\nPESQUISA EXTERNA DO USUÁRIO (DADOS PRÓPRIOS):\n${customResearch}`;
        userMessage += `\n\nINSTRUÇÃO: O usuário forneceu dados próprios de pesquisa acima. Integre essas informações com as demais fontes para enriquecer e fundamentar o conteúdo final.`;
      }
      // Add interdependency instructions
      const interdependencyMap: Record<number, string> = {
        2: "IMPORTANTE: Baseie a estrutura do produto nos insights do Módulo 1 (Briefing Estratégico) — posicionamento, persona e diferenciação.",
        3: "IMPORTANTE: A copy e VSL devem refletir a estrutura definida no Módulo 2 e o posicionamento do Módulo 1. Use os mesmos termos, promessas e ângulos.",
        4: "IMPORTANTE: O conteúdo orgânico deve atrair o público definido no Módulo 1, nutrir com base na estrutura do Módulo 2 e usar ganchos da copy do Módulo 3.",
        5: "IMPORTANTE: Os criativos devem usar os ângulos e headlines do Módulo 3, direcionados ao público do Módulo 1.",
        6: "IMPORTANTE: As sequências de email devem seguir o funil definido, usar a copy do Módulo 3 e a estratégia de conteúdo do Módulo 4.",
        7: "IMPORTANTE: Os scripts de WhatsApp devem complementar o email (Módulo 6) e usar abordagem alinhada à copy (Módulo 3).",
        8: "IMPORTANTE: O funil de vendas deve integrar TODOS os canais anteriores (copy, conteúdo, ads, email, WhatsApp) em uma jornada coesa.",
      };
      const interdependency = interdependencyMap[moduleConfig.number] || "";

      userMessage += `\n\n---\n\n${interdependency ? interdependency + "\n\n" : ""}Com base em todo o contexto acima${activeResearch ? " (incluindo a pesquisa de mercado com dados reais e atualizados)" : ""}, execute a tarefa do módulo ${moduleConfig.number} - ${moduleConfig.title}. ${activeResearch ? "OBRIGATÓRIO: Incorpore e cruze os dados da pesquisa de mercado com o material do projeto para tornar o conteúdo mais fundamentado e realista." : ""} Garanta coerência e continuidade com os módulos anteriores já gerados.`;



      // Helpers para detectar truncamento e stream interrompido
      const isTokenLimitFinishReason = (reason: string) => {
        const normalized = (reason || "").toLowerCase();
        return normalized === "length" || normalized === "max_tokens" || normalized === "max_output_tokens";
      };

      const shouldAutoContinue = (reason: string, sawDone: boolean, text: string) => {
        if (isTokenLimitFinishReason(reason)) return true;
        // Stream pode encerrar sem [DONE] e sem finish_reason quando há corte/interrupção
        return !sawDone && !reason && text.trim().length > 0;
      };

      // Helper to stream one call and return { text, finishReason, sawDone }
      const streamOneCall = async (msgs: any[], pdfs: any[]) => {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-module`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              messages: msgs,
              pdfParts: pdfs.length > 0 ? pdfs : undefined,
              model: `google/${selectedModel}`,
            }),
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
        let lastFinishReason = "";
        let sawDone = false;

        const processSseLine = (rawLine: string) => {
          let line = rawLine;
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") return true;
          if (!line.startsWith("data: ")) return true;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            sawDone = true;
            return true;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            const fr = parsed.choices?.[0]?.finish_reason;
            if (fr) lastFinishReason = fr;
            if (delta) text += delta;
            return true;
          } catch {
            return false;
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            const line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);
            const ok = processSseLine(line);
            if (!ok) {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }

        // Flush final buffer (pode conter último finish_reason sem newline)
        if (textBuffer.trim()) {
          for (let raw of textBuffer.split("\n")) {
            if (!raw) continue;
            processSseLine(raw);
          }
        }

        return { text, finishReason: lastFinishReason, sawDone };
      };

      // Initial generation
      let fullText = "";
      const initialMessages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ];
      
      const result = await streamOneCall(initialMessages, pdfParts);
      fullText = result.text;
      setStreamText(fullText);

      // Auto-continuation robusta para limites de token e streams interrompidos
      const MAX_CONTINUATIONS = 6;
      let continuations = 0;
      let lastFinishReason = result.finishReason;
      let sawDone = result.sawDone;

      while (shouldAutoContinue(lastFinishReason, sawDone, fullText) && continuations < MAX_CONTINUATIONS) {
        continuations++;
        console.log(`[Auto-continuation ${continuations}] finish_reason: ${lastFinishReason || "(vazio)"}, sawDone: ${sawDone}, chars: ${fullText.length}.`);
        toast.info(`Conteúdo extenso — continuando geração (parte ${continuations + 1})...`);
        
        // Send only the TAIL of previous content to avoid filling the context window
        const TAIL_SIZE = 8000;
        const contentTail = fullText.length > TAIL_SIZE
          ? `[...conteúdo anterior omitido por brevidade — ${fullText.length} caracteres já gerados...]\n\n${fullText.slice(-TAIL_SIZE)}`
          : fullText;
        
        const contMessages = [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
          { role: "assistant", content: contentTail },
          { role: "user", content: "Continue EXATAMENTE de onde parou, sem repetir nenhum conteúdo anterior. Continue a geração do ponto exato onde foi interrompida." },
        ];
        
        const contResult = await streamOneCall(contMessages, []);
        fullText += contResult.text;
        setStreamText(fullText);
        lastFinishReason = contResult.finishReason;
        sawDone = contResult.sawDone;
      }

      if (shouldAutoContinue(lastFinishReason, sawDone, fullText)) {
        toast.warning("O conteúdo pode estar incompleto — limite máximo de continuações atingido.");
      }

      console.log(`[Generation complete] finish_reason: ${lastFinishReason || "(vazio)"}, sawDone: ${sawDone}, length: ${fullText.length} chars, continuations: ${continuations}`);

      if (module.generated_content) {
        await supabase.from("module_versions").insert({
          module_id: module.id,
          content: module.generated_content,
        });
      }

      await updateModule.mutateAsync({
        id: module.id,
        generated_content: fullText,
        is_outdated: false,
      });

      setContent(fullText);
      toast.success("Conteúdo gerado com sucesso!");
    } catch (err: any) {
      toast.error("Erro na geração: " + err.message);
    } finally {
      setIsGenerating(false);
      setGenerationPhase("");
    }
  }, [module, projectId, moduleConfig, updateModule, researchContext, researchCitations, customResearch, refinedContext, ensureProjectData, autoResearch, selectedModel]);

  const handleSave = async () => {
    if (!module) return;
    if (module.generated_content) {
      await supabase.from("module_versions").insert({
        module_id: module.id,
        content: module.generated_content,
      });
    }
    await updateModule.mutateAsync({ id: module.id, generated_content: content });
    toast.success("Conteúdo salvo!");
  };

  const handleOpenResearch = async () => {
    await ensureProjectData();
    setResearchOpen(!researchOpen);
  };

  const handleClearGeneration = async () => {
    if (!module) return;
    // Backup current content before clearing
    if (module.generated_content) {
      await supabase.from("module_versions").insert({
        module_id: module.id,
        content: module.generated_content,
      });
    }
    await supabase.from("modules").update({
      generated_content: null,
      is_outdated: false,
    } as any).eq("id", module.id);
    setContent("");
    setStreamText("");
    updateModule.reset();
    toast.success("Geração limpa! Pesquisas mantidas para nova geração.");
  };

  const handleClearModule = async () => {
    if (!module) return;
    // Backup current content before clearing
    if (module.generated_content) {
      await supabase.from("module_versions").insert({
        module_id: module.id,
        content: module.generated_content,
      });
    }
    await supabase.from("modules").update({
      generated_content: null,
      research_result: null,
      research_citations: null,
      research_perplexity: null,
      research_perplexity_citations: null,
      research_gemini: null,
      research_gemini_citations: null,
      research_qwen: null,
      research_qwen_citations: null,
      research_chat: null,
      custom_research: null,
      is_outdated: false,
    } as any).eq("id", module.id);
    setContent("");
    setResearchContext("");
    setResearchCitations([]);
    setCustomResearch("");
    setRefinedContext("");
    updateModule.reset();
    toast.success("Módulo limpo! Pronto para nova pesquisa e geração.");
  };

  const [researchPanelOpen, setResearchPanelOpen] = useState(false);
  const [researchViewOpen, setResearchViewOpen] = useState(false);
  const [customResearchOpen, setCustomResearchOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const displayContent = isGenerating ? streamText : content;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Compact module header with toolbar */}
      <div className="border-b border-border/50 px-4 py-3 shrink-0">
        {/* Row 1: Title + status badges */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant="outline" className="text-xs shrink-0">M{moduleConfig.number}</Badge>
            <h2 className="text-base font-semibold truncate">{moduleConfig.title}</h2>
            {module?.is_outdated && (
              <Badge variant="destructive" className="text-xs gap-1 shrink-0">
                <AlertTriangle className="h-3 w-3" /> Desatualizado
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground hidden md:block shrink-0 ml-2">{moduleConfig.description}</p>
        </div>

        {/* Row 2: Actions toolbar */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: toggle panels */}
          <div className="flex items-center gap-1.5">
            {researchContext && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Search className="h-3 w-3" /> Pesquisa
              </Badge>
            )}
            {customResearch && (
              <Badge variant="secondary" className="text-xs gap-1">
                <FileText className="h-3 w-3" /> Externa
              </Badge>
            )}
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-1.5">
            {module && (
              <PromptEditor
                moduleId={module.id}
                moduleNumber={moduleConfig.number}
                researchPrompt={module.research_prompt}
                generationPrompt={module.generation_prompt}
                onSaved={() => {}}
              />
            )}
            <Button
              variant={researchOpen ? "default" : "outline"}
              size="sm"
              onClick={handleOpenResearch}
              className="gap-1 h-8 text-xs"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Pesquisar</span>
            </Button>

            {/* Secondary actions in dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setHistoryOpen(true)} disabled={!versions?.length}>
                  <History className="h-4 w-4 mr-2" /> Histórico de versões
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSave} disabled={!content || updateModule.isPending}>
                  <Save className="h-4 w-4 mr-2" /> Salvar conteúdo
                </DropdownMenuItem>
                {module?.generated_content && (
                  <DropdownMenuItem
                    className="text-orange-600 focus:text-orange-600"
                    onClick={() => {
                      const trigger = document.getElementById("clear-generation-trigger");
                      trigger?.click();
                    }}
                  >
                    <Sparkles className="h-4 w-4 mr-2" /> Limpar geração (manter pesquisas)
                  </DropdownMenuItem>
                )}
                {module?.generated_content && (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => {
                      const trigger = document.getElementById("clear-module-trigger");
                      trigger?.click();
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Limpar tudo (geração + pesquisas)
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Hidden alert dialog triggers */}
            {module?.generated_content && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button id="clear-generation-trigger" className="hidden" />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Limpar geração do M{moduleConfig.number}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Isso apagará apenas o conteúdo gerado. As pesquisas (IA e externa) serão mantidas para a próxima geração. O conteúdo atual será salvo no histórico.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearGeneration} className="bg-orange-600 text-white hover:bg-orange-700">
                      Limpar geração
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {module?.generated_content && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button id="clear-module-trigger" className="hidden" />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Limpar módulo M{moduleConfig.number}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Isso apagará o conteúdo gerado, pesquisas e dados do chat. O conteúdo atual será salvo no histórico de versões.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearModule} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Limpar módulo
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {/* Model selector + Generate */}
            <div className="flex items-center gap-1 ml-1">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="h-8 text-xs rounded-md border border-border/50 bg-background px-2 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
                disabled={isGenerating}
              >
                <option value="gemini-2.5-pro">Gemini Pro</option>
                <option value="gemini-2.5-flash">Gemini Flash</option>
              </select>
              <Button size="sm" onClick={handleGenerate} disabled={isGenerating} className="gap-1 h-8">
                {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {isGenerating ? "Gerando..." : "Gerar com IA"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        {/* Research panel (collapsible) */}
        {researchOpen && module && projectData && (
          <Collapsible open={researchPanelOpen} onOpenChange={setResearchPanelOpen} defaultOpen>
            <CollapsibleTrigger className="flex items-center gap-2 w-full px-4 py-2 border-b border-border/50 hover:bg-muted/30 transition-colors text-left">
              {researchPanelOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              <Search className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Pesquisa de Mercado</span>
              {researchContext && <Badge variant="secondary" className="text-xs ml-auto">Concluída</Badge>}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ResearchPanel
                projectId={projectId}
                moduleNumber={moduleConfig.number}
                moduleTitle={moduleConfig.title}
                niche={projectData.niche}
                promise={projectData.promise}
                targetAudience={projectData.target_audience}
                customResearchPrompt={module.research_prompt}
                savedResearch={researchContext}
                savedCitations={researchCitations}
                onResearchReady={handleResearchReady}
                onClearResearch={async () => {
                  if (module?.id) {
                    await supabase.from("modules").update({
                      research_result: null,
                      research_citations: null,
                      research_perplexity: null,
                      research_perplexity_citations: null,
                      research_gemini: null,
                      research_gemini_citations: null,
                      research_qwen: null,
                      research_qwen_citations: null,
                    } as any).eq("id", module.id);
                    setResearchContext("");
                    setResearchCitations([]);
                  }
                }}
              />
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Custom research panel (collapsible) */}
        {module && (
          <Collapsible open={customResearchOpen} onOpenChange={setCustomResearchOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full px-4 py-2 border-b border-border/50 hover:bg-muted/30 transition-colors text-left">
              {customResearchOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Pesquisa Externa do Usuário</span>
              {customResearch && <Badge variant="secondary" className="text-xs ml-auto">Salva</Badge>}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CustomResearchPanel
                key={module.id}
                moduleId={module.id}
                savedCustomResearch={customResearch}
                onCustomResearchChange={setCustomResearch}
              />
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Research viewer panel - view saved research by engine */}
        {module && (researchContext || customResearch) && (
          <Collapsible open={researchViewOpen} onOpenChange={setResearchViewOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full px-4 py-2 border-b border-border/50 hover:bg-muted/30 transition-colors text-left">
              {researchViewOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              <Search className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Visualizar Pesquisas por IA</span>
              <Badge variant="secondary" className="text-xs ml-auto">Salvas</Badge>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ResearchViewPanel moduleId={module.id} />
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Generation progress */}
        {isGenerating && (
          <div className="border-b border-border/50 px-4 py-3 flex items-center gap-3 bg-accent/10">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <div className="flex-1">
              <p className="text-sm font-medium">{generationPhase || "Processando..."}</p>
              <p className="text-xs text-muted-foreground">
                {researchContext ? "Contexto do projeto + pesquisa de mercado integrada" : "Pesquisa automática + contexto do projeto"}
              </p>
              <Progress value={
                generationPhase.includes("Pesquisando") ? 15 :
                generationPhase.includes("Construindo") ? 25 :
                generationPhase.includes("Continuando") ? 60 :
                generationPhase.includes("Gerando") ? 40 :
                generationPhase.includes("Salvando") ? 90 :
                35
              } className="mt-2 h-1.5" />
            </div>
          </div>
        )}

        {/* Content area - takes maximum space */}
        <div className="p-4">
          {displayContent ? (
            <Textarea
              value={displayContent}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[60vh] resize-vertical border-border/30 bg-card/30 text-sm leading-relaxed font-mono"
              readOnly={isGenerating}
            />
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
              <Sparkles className="h-12 w-12 text-muted-foreground/20 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">Nenhum conteúdo gerado</h3>
              <p className="text-sm text-muted-foreground/70 mt-1 max-w-md">
                Clique em "Pesquisar" para pesquisa de mercado, depois "Gerar com IA" para criar o conteúdo.
              </p>
            </div>
          )}
        </div>

        {/* Research Chat (collapsible) */}
        {module && projectData && (
          <Collapsible open={chatOpen} onOpenChange={setChatOpen}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full px-4 py-2 border-t border-border/50 hover:bg-muted/30 transition-colors text-left sticky bottom-0 bg-background/95 backdrop-blur-sm">
              {chatOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Refinar & Aprofundar</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ResearchChat
                moduleId={module.id}
                moduleNumber={moduleConfig.number}
                moduleTitle={moduleConfig.title}
                niche={projectData.niche}
                promise={projectData.promise}
                targetAudience={projectData.target_audience}
                researchContext={researchContext}
                generatedContent={content}
                onRefinedContext={setRefinedContext}
              />
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>

      {/* History dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Histórico de Versões - M{moduleConfig.number}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              {versions?.map((v) => (
                <div key={v.id} className="border border-border/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(v.created_at), "dd MMM yyyy HH:mm", { locale: ptBR })}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setContent(v.content);
                        setHistoryOpen(false);
                        toast.info("Versão restaurada no editor.");
                      }}
                    >
                      Restaurar
                    </Button>
                  </div>
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-6">{v.content}</pre>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
