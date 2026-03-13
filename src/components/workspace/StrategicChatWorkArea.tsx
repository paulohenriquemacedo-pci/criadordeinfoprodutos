import { useState, useRef, useEffect, useCallback } from "react";
import { useConversations, useMessages, useCreateConversation, useUpdateConversation, useDeleteConversation, useSaveMessage, ChatConversation, ChatMessage } from "@/hooks/useStrategicChat";
import { buildProjectContext } from "@/lib/context-builder";
import { MODULE_CONFIG } from "@/lib/modules";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { Plus, Trash2, MessageSquare, Send, Loader2, Settings2, Sparkles, Bot, User, Copy, Download } from "lucide-react";

interface Props {
  projectId: string;
  project: any;
}

const PROMPT_TEMPLATES = [
  { label: "Revisar copy do produto", prompt: "Analise criticamente a copy e o script de vendas (M3) deste projeto. Identifique pontos fracos, oportunidades de melhoria e sugira versões mais persuasivas." },
  { label: "Analisar funil de vendas", prompt: "Faça uma análise profunda do funil de vendas (M8) deste projeto. Identifique gargalos, pontos de fricção e sugira otimizações para aumentar a taxa de conversão." },
  { label: "Otimizar oferta", prompt: "Analise a oferta (M9) e sugira melhorias no posicionamento, precificação, bônus e order bumps para maximizar o valor percebido e a conversão." },
  { label: "Estratégia de conteúdo", prompt: "Com base no briefing (M1) e na persona, crie uma estratégia de conteúdo orgânico (M4) detalhada para os próximos 30 dias, incluindo temas, formatos e calendário." },
  { label: "Diagnóstico geral", prompt: "Faça um diagnóstico completo de todo o projeto, identificando os pontos mais fortes e os que precisam de mais atenção. Priorize as ações por impacto na conversão." },
  { label: "Criar sequência de emails", prompt: "Baseado na estratégia de email marketing (M6) e na copy (M3), sugira uma sequência de 7 emails de lançamento com assuntos, hooks e CTAs." },
];

export default function StrategicChatWorkArea({ projectId, project }: Props) {
  const { data: conversations, isLoading: loadingConvs } = useConversations(projectId);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const { data: messages } = useMessages(activeConvId || undefined);
  const createConv = useCreateConversation();
  const updateConv = useUpdateConversation();
  const deleteConv = useDeleteConversation();
  const saveMessage = useSaveMessage();

  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [contextModules, setContextModules] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeConv = conversations?.find(c => c.id === activeConvId);

  // Auto-select first conversation
  useEffect(() => {
    if (conversations?.length && !activeConvId) {
      setActiveConvId(conversations[0].id);
    }
  }, [conversations, activeConvId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamText]);

  // Sync context modules from active conversation
  useEffect(() => {
    if (activeConv) setContextModules(activeConv.context_modules || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  }, [activeConv]);

  const handleNewConversation = async () => {
    const conv = await createConv.mutateAsync({ project_id: projectId, context_modules: contextModules });
    setActiveConvId(conv.id);
  };

  const handleDeleteConversation = async (id: string) => {
    await deleteConv.mutateAsync(id);
    if (activeConvId === id) {
      setActiveConvId(conversations?.find(c => c.id !== id)?.id || null);
    }
  };

  const toggleModule = (num: number) => {
    const next = contextModules.includes(num)
      ? contextModules.filter(n => n !== num)
      : [...contextModules, num].sort((a, b) => a - b);
    setContextModules(next);
    if (activeConvId) {
      updateConv.mutate({ id: activeConvId, context_modules: next });
    }
  };

  const handleSend = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || streaming) return;
    if (!activeConvId) {
      const conv = await createConv.mutateAsync({ project_id: projectId, context_modules: contextModules });
      setActiveConvId(conv.id);
      // Save user message and then send
      await saveMessage.mutateAsync({ conversation_id: conv.id, role: "user", content: msg });
      setInput("");
      await streamResponse(conv.id, msg);
      return;
    }

    await saveMessage.mutateAsync({ conversation_id: activeConvId, role: "user", content: msg });
    setInput("");

    // Auto-title on first message
    if (messages?.length === 0 || !messages?.length) {
      const title = msg.length > 50 ? msg.slice(0, 50) + "..." : msg;
      updateConv.mutate({ id: activeConvId, title });
    }

    await streamResponse(activeConvId, msg);
  }, [input, streaming, activeConvId, messages, contextModules, projectId]);

  const streamResponse = async (convId: string, userMessage: string) => {
    setStreaming(true);
    setStreamText("");

    try {
      const context = await buildProjectContext(projectId, contextModules);

      // Get full conversation history
      const { data: historyData } = await supabase
        .from("chat_messages" as any)
        .select("role, content")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });

      const history = (historyData as unknown as { role: string; content: string }[]) || [];

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/strategic-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            messages: history,
            projectContext: context.fullContext,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Erro ${response.status}`);
      }

      if (!response.body) throw new Error("Stream não disponível");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let result = "";

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
            const content = parsed.choices?.[0]?.delta?.content
              || parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (content) {
              result += content;
              setStreamText(result);
            }
          } catch { /* partial json */ }
        }
      }

      // Save assistant message
      if (result) {
        await saveMessage.mutateAsync({ conversation_id: convId, role: "assistant", content: result });
      }
    } catch (err: any) {
      toast.error("Erro no chat: " + err.message);
    } finally {
      setStreaming(false);
      setStreamText("");
    }
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copiado!");
  };

  const handleExportToModule = async (content: string, moduleNumber: number) => {
    const { data: mods } = await supabase
      .from("modules")
      .select("id, custom_research")
      .eq("project_id", projectId)
      .eq("module_number", moduleNumber)
      .single();
    if (!mods) { toast.error("Módulo não encontrado"); return; }

    const existing = (mods as any).custom_research || "";
    const separator = existing ? "\n\n---\n[Nota do Consultor IA]\n" : "[Nota do Consultor IA]\n";
    await supabase.from("modules").update({ custom_research: existing + separator + content } as any).eq("id", mods.id);
    toast.success(`Nota salva no M${moduleNumber}!`);
  };

  const allMessages: Array<ChatMessage & { isStreaming?: boolean }> = [
    ...(messages || []),
    ...(streaming && streamText ? [{ id: "streaming", conversation_id: activeConvId || "", role: "assistant" as const, content: streamText, created_at: new Date().toISOString(), isStreaming: true }] : []),
  ];

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Conversations sidebar */}
      <div className="w-64 border-r border-border/50 flex flex-col bg-card/30">
        <div className="p-3 border-b border-border/30 flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-primary" /> Conversas
          </h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNewConversation} disabled={createConv.isPending}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {conversations?.map(conv => (
              <div
                key={conv.id}
                className={`group flex items-center gap-2 px-2.5 py-2 rounded-md cursor-pointer text-sm transition-colors ${activeConvId === conv.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"}`}
                onClick={() => setActiveConvId(conv.id)}
              >
                <Bot className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1 truncate text-xs">{conv.title}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 shrink-0"
                  onClick={e => { e.stopPropagation(); handleDeleteConversation(conv.id); }}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}
            {!conversations?.length && !loadingConvs && (
              <div className="text-center py-8 px-3">
                <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/20 mb-2" />
                <p className="text-xs text-muted-foreground">Nenhuma conversa</p>
                <Button variant="outline" size="sm" className="mt-2 text-xs" onClick={handleNewConversation}>
                  <Plus className="h-3 w-3 mr-1" /> Nova Conversa
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Templates section */}
        <div className="p-2 border-t border-border/30">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-2 mb-1">Templates</p>
          <div className="space-y-0.5 max-h-36 overflow-y-auto">
            {PROMPT_TEMPLATES.map((t, i) => (
              <button
                key={i}
                onClick={() => { setInput(t.prompt); inputRef.current?.focus(); }}
                className="w-full text-left text-[11px] px-2 py-1.5 rounded text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors truncate"
              >
                ✨ {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="p-3 border-b border-border/30 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {activeConv?.title || "Consultor Estratégico IA"}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Contexto: {contextModules.length === 11 ? "Todos os módulos" : `${contextModules.length} módulos selecionados`}
            </p>
          </div>

          {/* Context selector */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Settings2 className="h-3.5 w-3.5" /> Contexto
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="end">
              <p className="text-xs font-semibold mb-2">Módulos no contexto:</p>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {MODULE_CONFIG.filter(m => m.number >= 1).map(m => (
                  <label key={m.number} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-secondary/50 px-1.5 py-1 rounded">
                    <Checkbox
                      checked={contextModules.includes(m.number)}
                      onCheckedChange={() => toggleModule(m.number)}
                    />
                    <span>M{m.number} — {m.title}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-1 mt-2 pt-2 border-t border-border/30">
                <Button variant="ghost" size="sm" className="text-[10px] h-6" onClick={() => {
                  const all = MODULE_CONFIG.filter(m => m.number >= 1).map(m => m.number);
                  setContextModules(all);
                  if (activeConvId) updateConv.mutate({ id: activeConvId, context_modules: all });
                }}>Todos</Button>
                <Button variant="ghost" size="sm" className="text-[10px] h-6" onClick={() => {
                  setContextModules([]);
                  if (activeConvId) updateConv.mutate({ id: activeConvId, context_modules: [] });
                }}>Nenhum</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {allMessages.length === 0 && !streaming && (
              <div className="text-center py-16">
                <Bot className="h-16 w-16 mx-auto text-muted-foreground/15 mb-4" />
                <h3 className="text-base font-semibold text-foreground mb-1">Consultor Estratégico IA</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Converse sobre qualquer aspecto do seu projeto. Eu tenho acesso a todo o contexto estratégico dos módulos selecionados.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-2 max-w-lg mx-auto">
                  {PROMPT_TEMPLATES.slice(0, 4).map((t, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(t.prompt)}
                      className="text-left p-3 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-colors"
                    >
                      <p className="text-xs font-medium text-foreground">✨ {t.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{t.prompt.slice(0, 80)}...</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {allMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={`max-w-[80%] ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5" : "bg-card border border-border/50 rounded-2xl rounded-bl-md px-4 py-3"}`}>
                  <div className={`text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "assistant" ? "prose prose-sm dark:prose-invert max-w-none" : ""}`}>
                    {msg.content}
                  </div>
                  {msg.role === "assistant" && !msg.isStreaming && (
                    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/20">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopyMessage(msg.content)} title="Copiar">
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6" title="Exportar para módulo">
                            <Download className="h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2" align="start">
                          <p className="text-[10px] font-semibold mb-1 text-muted-foreground">Salvar como nota em:</p>
                          <div className="space-y-0.5 max-h-48 overflow-y-auto">
                            {MODULE_CONFIG.filter(m => m.number >= 1 && m.number <= 11).map(m => (
                              <button
                                key={m.number}
                                onClick={() => handleExportToModule(msg.content, m.number)}
                                className="w-full text-left text-[11px] px-2 py-1 rounded hover:bg-secondary transition-colors"
                              >
                                M{m.number} — {m.title}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                  {msg.isStreaming && (
                    <div className="flex items-center gap-1.5 mt-2 text-primary">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-[10px]">Gerando...</span>
                    </div>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input bar */}
        <div className="p-3 border-t border-border/30">
          <form
            onSubmit={e => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Pergunte sobre qualquer aspecto do projeto..."
              className="flex-1 text-sm"
              disabled={streaming}
            />
            <Button type="submit" size="icon" disabled={streaming || !input.trim()}>
              {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
