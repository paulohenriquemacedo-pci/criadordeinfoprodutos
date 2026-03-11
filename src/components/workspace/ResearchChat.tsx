import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Send, Loader2, MessageSquare, Brain, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Props {
  moduleId: string;
  moduleNumber: number;
  moduleTitle: string;
  niche: string;
  promise: string;
  targetAudience: string;
  researchContext: string;
  generatedContent: string;
  onRefinedContext: (additionalContext: string) => void;
}

export default function ResearchChat({
  moduleId,
  moduleNumber,
  moduleTitle,
  niche,
  promise,
  targetAudience,
  researchContext,
  generatedContent,
  onRefinedContext,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load persisted chat from DB on mount / module change
  const [prevModuleId, setPrevModuleId] = useState(moduleId);
  if (moduleId !== prevModuleId) {
    setPrevModuleId(moduleId);
    setMessages([]);
    loadPersistedChat(moduleId);
  }

  useEffect(() => {
    loadPersistedChat(moduleId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadPersistedChat(id: string) {
    const { data } = await supabase
      .from("modules")
      .select("research_chat")
      .eq("id", id)
      .single();
    if ((data as any)?.research_chat) {
      try {
        const parsed = JSON.parse((data as any).research_chat);
        setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      } catch { /* ignore */ }
    }
  }

  async function persistChat(msgs: ChatMessage[]) {
    await supabase.from("modules").update({
      research_chat: JSON.stringify(msgs),
    } as any).eq("id", moduleId);
  }

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Build accumulated refinement context from all assistant messages
  useEffect(() => {
    if (messages.length === 0) {
      onRefinedContext("");
      return;
    }
    const refinements = messages
      .filter((m) => m.role === "assistant")
      .map((m, i) => `[Refinamento ${i + 1}]\n${m.content}`)
      .join("\n\n---\n\n");
    onRefinedContext(refinements);
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = { role: "user", content: text, timestamp: new Date() };
    const updatedMsgs = [...messages, userMsg];
    setMessages(updatedMsgs);
    setInput("");
    setIsLoading(true);

    try {
      // Build conversation history for the AI
      const conversationHistory = updatedMsgs.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const systemPrompt = `Você é um assistente de pesquisa e estratégia para infoprodutos digitais no Brasil.
Contexto do projeto:
- Nicho: ${niche || "não definido"}
- Promessa: ${promise || "não definida"}
- Público-alvo: ${targetAudience || "não definido"}
- Módulo: ${moduleNumber} - ${moduleTitle}

${researchContext ? `PESQUISA DE MERCADO JÁ REALIZADA:\n${researchContext}\n\n` : ""}
${generatedContent ? `CONTEÚDO JÁ GERADO PARA ESTE MÓDULO:\n${generatedContent.slice(0, 3000)}\n\n` : ""}

Seu papel é:
1. Responder dúvidas sobre o conteúdo gerado ou a pesquisa de mercado
2. Fornecer dados complementares quando solicitado
3. Aprofundar pontos específicos da estratégia
4. Sugerir melhorias baseadas em dados de mercado
5. Ser conciso mas completo nas respostas

Responda em português do Brasil. Use dados concretos sempre que possível.`;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-research`,
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
            customPrompt: `${systemPrompt}\n\n${conversationHistory.map((m) => `${m.role === "user" ? "USUÁRIO" : "ASSISTENTE"}: ${m.content}`).join("\n\n")}`,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Erro ${response.status}`);
      }

      const data = await response.json();
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.research || "Sem resposta.",
        timestamp: new Date(),
      };

      const finalMsgs = [...updatedMsgs, assistantMsg];
      setMessages(finalMsgs);
      await persistChat(finalMsgs);
      toast.success("Resposta recebida!");
    } catch (err: any) {
      toast.error("Erro: " + err.message);
      // Remove the user message on error
      setMessages(messages);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleClearChat = async () => {
    setMessages([]);
    onRefinedContext("");
    await persistChat([]);
    toast.info("Histórico de refinamento limpo.");
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="border-t border-border/50 bg-card/30">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-accent/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Refinar & Aprofundar</span>
          {hasMessages && (
            <Badge variant="secondary" className="text-xs">
              {messages.filter((m) => m.role === "assistant").length} refinamento(s)
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasMessages && (
            <Badge variant="outline" className="text-xs text-green-600">
              Dados incluídos na geração
            </Badge>
          )}
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </div>
      </button>

      {isExpanded && (
        <>
          {/* Messages */}
          {hasMessages && (
            <ScrollArea className="max-h-[300px]" ref={scrollRef as any}>
              <div className="px-4 py-2 space-y-3">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted border border-border/30"
                      }`}
                    >
                      {msg.role === "assistant" && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <Brain className="h-3 w-3 text-primary" />
                          <span className="text-xs font-medium text-primary">IA</span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {msg.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      )}
                      <pre className="whitespace-pre-wrap text-xs leading-relaxed">{msg.content}</pre>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted border border-border/30 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin text-primary" />
                        <span className="text-xs text-muted-foreground">Pesquisando...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          {/* Input */}
          <div className="px-4 py-3 flex gap-2 items-center border-t border-border/30">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte, refine ou peça mais dados... ex: 'Detalhe os preços dos concorrentes' ou 'Explique melhor o ponto sobre funis'"
              className="text-xs h-8"
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              disabled={isLoading}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="gap-1 text-xs shrink-0"
            >
              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              Enviar
            </Button>
            {hasMessages && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClearChat}
                className="text-xs shrink-0 text-muted-foreground"
                title="Limpar histórico de refinamento"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
