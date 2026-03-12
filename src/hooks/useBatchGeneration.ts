import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { buildProjectContext, buildPdfParts } from "@/lib/context-builder";
import { DEFAULT_GENERATION_PROMPTS, DEFAULT_RESEARCH_PROMPTS, QUALITY_DIRECTIVES } from "@/lib/default-prompts";
import { MODULE_CONFIG } from "@/lib/modules";

export interface BatchLogEntry {
  timestamp: Date;
  moduleNumber: number;
  phase: "research" | "context" | "generation" | "saving" | "done" | "error";
  message: string;
}

export interface BatchState {
  isRunning: boolean;
  currentModule: number;
  completedModules: number[];
  failedModule: number | null;
  logs: BatchLogEntry[];
  totalModules: number;
  isDone: boolean;
  error: string | null;
}

const INTERDEPENDENCY_MAP: Record<number, string> = {
  2: "IMPORTANTE: Baseie a estrutura do produto nos insights do Módulo 1 (Briefing Estratégico) — posicionamento, persona e diferenciação.",
  3: "IMPORTANTE: A copy e VSL devem refletir a estrutura definida no Módulo 2 e o posicionamento do Módulo 1. Use os mesmos termos, promessas e ângulos.",
  4: "IMPORTANTE: O conteúdo orgânico deve atrair o público definido no Módulo 1, nutrir com base na estrutura do Módulo 2 e usar ganchos da copy do Módulo 3.",
  5: "IMPORTANTE: Os criativos devem usar os ângulos e headlines do Módulo 3, direcionados ao público do Módulo 1.",
  6: "IMPORTANTE: As sequências de email devem seguir o funil definido, usar a copy do Módulo 3 e a estratégia de conteúdo do Módulo 4.",
  7: "IMPORTANTE: Os scripts de WhatsApp devem complementar o email (Módulo 6) e usar abordagem alinhada à copy (Módulo 3).",
  8: "IMPORTANTE: O funil de vendas deve integrar TODOS os canais anteriores (copy, conteúdo, ads, email, WhatsApp) em uma jornada coesa.",
};

export type ResearchEngine = "perplexity" | "gemini" | "qwen";

export function useBatchGeneration() {
  const [state, setState] = useState<BatchState>({
    isRunning: false,
    currentModule: 0,
    completedModules: [],
    failedModule: null,
    logs: [],
    totalModules: 8,
    isDone: false,
    error: null,
  });

  const abortRef = useRef(false);

  const addLog = useCallback((moduleNumber: number, phase: BatchLogEntry["phase"], message: string) => {
    setState(prev => ({
      ...prev,
      logs: [...prev.logs, { timestamp: new Date(), moduleNumber, phase, message }],
    }));
  }, []);

  const autoResearch = useCallback(async (
    moduleNumber: number,
    moduleTitle: string,
    niche: string,
    promise: string,
    targetAudience: string,
    customPrompt: string | null,
    engine: ResearchEngine = "perplexity"
  ): Promise<{ research: string; citations: string[] } | null> => {
    const researchPrompt = customPrompt || DEFAULT_RESEARCH_PROMPTS[moduleNumber] || "";
    
    const functionName = engine === "qwen" ? "qwen-research" : engine === "gemini" ? "ai-research" : "market-research";
    
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`,
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
          moduleTitle,
          moduleNumber,
          customPrompt: researchPrompt,
        }),
      }
    );

    if (!response.ok) {
      console.warn("Auto-research failed for module", moduleNumber);
      return null;
    }

    const data = await response.json();
    return { research: data.research || "", citations: data.citations || [] };
  }, []);

  const streamOneCall = useCallback(async (
    messages: any[],
    pdfParts: any[],
    model?: string
  ): Promise<{ text: string; finishReason: string; sawDone: boolean }> => {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-module`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages,
          pdfParts: pdfParts.length > 0 ? pdfParts : undefined,
          model: model || undefined,
        }),
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Erro ${response.status}`);
    }
    if (!response.body) throw new Error("Stream não disponível");

    const reader = response.body.getReader();
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
      for (const raw of textBuffer.split("\n")) {
        if (!raw) continue;
        processSseLine(raw);
      }
    }

    return { text, finishReason: lastFinishReason, sawDone };
  }, []);

  const generateModule = useCallback(async (
    moduleNumber: number,
    systemPrompt: string,
    userMessage: string,
    pdfParts: any[],
    model?: string
  ): Promise<string> => {
    const isTokenLimitFinishReason = (reason: string) => {
      const normalized = (reason || "").toLowerCase();
      return normalized === "length" || normalized === "max_tokens" || normalized === "max_output_tokens";
    };

    const shouldAutoContinue = (reason: string, sawDone: boolean, text: string) => {
      if (isTokenLimitFinishReason(reason)) return true;
      return !sawDone && !reason && text.trim().length > 0;
    };

    const initialMessages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ];

    const result = await streamOneCall(initialMessages, pdfParts, model);
    let fullText = result.text;

    // Auto-continuation if model stopped due to token limit or interrupted stream
    const MAX_CONTINUATIONS = 3;
    let continuations = 0;
    let lastFinishReason = result.finishReason;
    let sawDone = result.sawDone;

    while (shouldAutoContinue(lastFinishReason, sawDone, fullText) && continuations < MAX_CONTINUATIONS) {
      continuations++;
      console.log(`[Batch auto-continuation ${continuations}] Module ${moduleNumber} - finish_reason: ${lastFinishReason || "(vazio)"}, sawDone: ${sawDone}`);
      
      const contMessages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
        { role: "assistant", content: fullText },
        { role: "user", content: "Continue EXATAMENTE de onde parou, sem repetir nenhum conteúdo anterior. Continue a geração do ponto exato onde foi interrompida." },
      ];
      
      const contResult = await streamOneCall(contMessages, [], model);
      fullText += contResult.text;
      lastFinishReason = contResult.finishReason;
      sawDone = contResult.sawDone;
    }

    console.log(`[Module ${moduleNumber} complete] finish_reason: ${lastFinishReason || "(vazio)"}, sawDone: ${sawDone}, length: ${fullText.length}, continuations: ${continuations}`);
    return fullText;
  }, [streamOneCall]);

  const runResearchOnly = useCallback(async (projectId: string, options?: { researchEngine?: ResearchEngine; forceReResearch?: boolean }) => {
    abortRef.current = false;
    setState({
      isRunning: true,
      currentModule: 1,
      completedModules: [],
      failedModule: null,
      logs: [],
      totalModules: 8,
      isDone: false,
      error: null,
    });

    try {
      const { data: project } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
      if (!project) throw new Error("Projeto não encontrado");

      const niche = project.niche || "";
      const promise = project.promise || "";
      const targetAudience = project.target_audience || "";

      const { data: modules } = await supabase
        .from("modules")
        .select("*")
        .eq("project_id", projectId)
        .order("module_number");
      if (!modules) throw new Error("Módulos não encontrados");

      const researchEngine = options?.researchEngine || "perplexity";
      const engineLabel = researchEngine === "perplexity" ? "Perplexity" : researchEngine === "gemini" ? "Gemini" : "Qwen";

      for (let num = 1; num <= 8; num++) {
        if (abortRef.current) {
          addLog(num, "error", "Execução cancelada pelo usuário");
          throw new Error("Cancelado pelo usuário");
        }

        const moduleConfig = MODULE_CONFIG.find(m => m.number === num)!;
        const module = modules.find(m => m.module_number === num);
        if (!module) continue;

        // Skip modules that already have research for this engine (unless force re-research)
        const engineColumn = researchEngine === "perplexity" ? "research_perplexity" : researchEngine === "gemini" ? "research_gemini" : "research_qwen";
        const existingEngineResearch = (module as any)[engineColumn];
        if (existingEngineResearch && !options?.forceReResearch) {
          addLog(num, "done", `${moduleConfig.title} já possui pesquisa ${engineLabel} — pulando ✓`);
          setState(prev => ({
            ...prev,
            completedModules: [...prev.completedModules, num],
          }));
          continue;
        }

        setState(prev => ({ ...prev, currentModule: num }));
        addLog(num, "research", `Pesquisando via ${engineLabel} para ${moduleConfig.title}...`);

        const researchResult = await autoResearch(
          num, moduleConfig.title, niche, promise, targetAudience, module.research_prompt, researchEngine
        );

        if (researchResult) {
          const researchText = `[Pesquisa via ${engineLabel}]\n${researchResult.research}`;
          const citationsColumn = `${engineColumn}_citations`;
          // Save to engine-specific column AND legacy research_result for backward compat
          await supabase.from("modules").update({
            [engineColumn]: researchText,
            [citationsColumn]: researchResult.citations,
            research_result: researchText,
            research_citations: researchResult.citations,
          } as any).eq("id", module.id);
          addLog(num, "done", `Pesquisa para ${moduleConfig.title} concluída ✓`);
        } else {
          addLog(num, "error", `Pesquisa indisponível para ${moduleConfig.title}`);
        }

        setState(prev => ({
          ...prev,
          completedModules: [...prev.completedModules, num],
        }));
      }

      addLog(0, "done", "🎉 Pesquisa em lote concluída para todos os módulos!");
      setState(prev => ({ ...prev, isRunning: false, isDone: true }));
    } catch (err: any) {
      const errorMsg = err.message || "Erro desconhecido";
      setState(prev => ({
        ...prev,
        isRunning: false,
        failedModule: prev.currentModule,
        error: errorMsg,
      }));
      addLog(0, "error", `❌ Erro: ${errorMsg}`);
    }
  }, [addLog, autoResearch]);

  const runGenerationOnly = useCallback(async (projectId: string, options?: { generationModel?: string; researchEngine?: ResearchEngine }) => {
    abortRef.current = false;
    setState({
      isRunning: true,
      currentModule: 1,
      completedModules: [],
      failedModule: null,
      logs: [],
      totalModules: 8,
      isDone: false,
      error: null,
    });

    try {
      const { data: project } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
      if (!project) throw new Error("Projeto não encontrado");

      const { data: modules } = await supabase
        .from("modules")
        .select("*")
        .eq("project_id", projectId)
        .order("module_number");
      if (!modules) throw new Error("Módulos não encontrados");

      for (let num = 1; num <= 8; num++) {
        if (abortRef.current) {
          addLog(num, "error", "Execução cancelada pelo usuário");
          throw new Error("Cancelado pelo usuário");
        }

        const moduleConfig = MODULE_CONFIG.find(m => m.number === num)!;
        const module = modules.find(m => m.module_number === num);
        if (!module) continue;

        // Skip modules that already have generated content
        if (module.generated_content) {
          addLog(num, "done", `${moduleConfig.title} já possui conteúdo — pulando ✓`);
          setState(prev => ({
            ...prev,
            completedModules: [...prev.completedModules, num],
          }));
          continue;
        }

        setState(prev => ({ ...prev, currentModule: num }));

        // Build context
        addLog(num, "context", "Construindo contexto do projeto...");
        const context = await buildProjectContext(projectId);
        const pdfParts = await buildPdfParts(context.files);

        // Build prompt
        let systemPrompt = module.generation_prompt || DEFAULT_GENERATION_PROMPTS[num] || "";
        if (!systemPrompt) {
          const { data: promptData } = await supabase
            .from("prompts")
            .select("prompt_text")
            .eq("module_number", num)
            .single();
          systemPrompt = promptData?.prompt_text || "Gere conteúdo estratégico para este módulo.";
        }
        systemPrompt += QUALITY_DIRECTIVES;

        let userMessage = context.fullContext;
        
        // Combine research from all engines
        const engineResearches: string[] = [];
        const allCitations: string[] = [];
        for (const eng of ["research_perplexity", "research_gemini", "research_qwen", "research_result"] as const) {
          const val = (module as any)[eng];
          if (val && !engineResearches.includes(val)) engineResearches.push(val);
        }
        for (const eng of ["research_perplexity_citations", "research_gemini_citations", "research_qwen_citations", "research_citations"] as const) {
          const cits = (module as any)[eng] as string[] | null;
          if (cits) allCitations.push(...cits.filter(c => !allCitations.includes(c)));
        }
        const activeResearch = engineResearches.join("\n\n---\n\n");

        if (activeResearch) {
          userMessage += `\n\n========\n\nPESQUISA DE MERCADO (DADOS EXTERNOS ATUALIZADOS — MÚLTIPLAS FONTES):\n${activeResearch}`;
          userMessage += `\n\nINSTRUÇÃO CRÍTICA: Você DEVE integrar os dados da pesquisa de mercado acima com o material do projeto.`;
          if (allCitations.length > 0) {
            userMessage += `\n\nFONTES DA PESQUISA:\n${allCitations.map((c, i) => `[${i + 1}] ${c}`).join("\n")}`;
          }
        }

        const interdependency = INTERDEPENDENCY_MAP[num] || "";
        userMessage += `\n\n---\n\n${interdependency ? interdependency + "\n\n" : ""}Com base em todo o contexto acima${activeResearch ? " (incluindo a pesquisa de mercado)" : ""}, execute a tarefa do módulo ${num} - ${moduleConfig.title}. ${activeResearch ? "OBRIGATÓRIO: Incorpore os dados da pesquisa de mercado." : ""} Garanta coerência e continuidade com os módulos anteriores já gerados.`;

        // Generate
        const genModel = options?.generationModel;
        addLog(num, "generation", `Gerando conteúdo com ${genModel?.includes("pro") ? "Gemini Pro" : genModel?.includes("3-flash") ? "Gemini 3 Flash" : "Gemini 2.5 Flash"} para ${moduleConfig.title}...`);
        const fullText = await generateModule(num, systemPrompt, userMessage, pdfParts, genModel);

        if (abortRef.current) throw new Error("Cancelado pelo usuário");

        // Save
        addLog(num, "saving", "Salvando conteúdo gerado...");
        if (module.generated_content) {
          await supabase.from("module_versions").insert({
            module_id: module.id,
            content: module.generated_content,
          });
        }

        await supabase.from("modules").update({
          generated_content: fullText,
          is_outdated: false,
        }).eq("id", module.id);

        // Update strategic memory (M0)
        addLog(num, "saving", "Atualizando memória estratégica (M0)...");
        try {
          const { data: currentProject } = await supabase
            .from("projects")
            .select("strategic_memory")
            .eq("id", projectId)
            .single();

          const memResponse = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/strategic-memory`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              },
              body: JSON.stringify({
                moduleNumber: num,
                moduleContent: fullText,
                existingMemory: (currentProject as any)?.strategic_memory || null,
              }),
            }
          );

          if (memResponse.ok) {
            const memData = await memResponse.json();
            await supabase.from("projects").update({
              strategic_memory: memData.memory,
            } as any).eq("id", projectId);
            addLog(num, "done", "Memória estratégica atualizada ✓");
          }
        } catch (memErr) {
          console.warn("Strategic memory error (non-fatal):", memErr);
        }

        addLog(num, "done", `${moduleConfig.title} concluído ✓`);
        setState(prev => ({
          ...prev,
          completedModules: [...prev.completedModules, num],
        }));
      }

      addLog(0, "done", "🎉 Todos os módulos foram gerados com sucesso!");
      setState(prev => ({ ...prev, isRunning: false, isDone: true }));
    } catch (err: any) {
      const errorMsg = err.message || "Erro desconhecido";
      setState(prev => ({
        ...prev,
        isRunning: false,
        failedModule: prev.currentModule,
        error: errorMsg,
      }));
      addLog(0, "error", `❌ Erro: ${errorMsg}`);
    }
  }, [addLog, generateModule]);

  const cancel = useCallback(() => {
    abortRef.current = true;
  }, []);

  const reset = useCallback(() => {
    setState({
      isRunning: false,
      currentModule: 0,
      completedModules: [],
      failedModule: null,
      logs: [],
      totalModules: 8,
      isDone: false,
      error: null,
    });
  }, []);

  return { state, runResearchOnly, runGenerationOnly, cancel, reset };
}
