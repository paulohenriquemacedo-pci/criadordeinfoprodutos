import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Brain, User, Package, Pen, Megaphone, TrendingUp, Zap, RefreshCw, Loader2, Wand2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { jsPDF } from "jspdf";

interface Props {
  projectId: string;
}

interface StrategicMemory {
  identidade_posicionamento?: Record<string, unknown>;
  publico_alvo?: Record<string, unknown>;
  produto?: Record<string, unknown>;
  copy_mensagem?: Record<string, unknown>;
  marketing?: Record<string, unknown>;
  funil_monetizacao?: Record<string, unknown>;
  automacoes?: Record<string, unknown>;
  _meta?: {
    last_updated?: string;
    last_module?: number;
    modules_processed?: number[];
  };
}

const CATEGORY_CONFIG = [
  { key: "identidade_posicionamento", label: "Identidade & Posicionamento", icon: Brain, color: "text-purple-500" },
  { key: "publico_alvo", label: "Público-Alvo", icon: User, color: "text-blue-500" },
  { key: "produto", label: "Produto", icon: Package, color: "text-emerald-500" },
  { key: "copy_mensagem", label: "Copy & Mensagem", icon: Pen, color: "text-orange-500" },
  { key: "marketing", label: "Marketing", icon: Megaphone, color: "text-pink-500" },
  { key: "funil_monetizacao", label: "Funil & Monetização", icon: TrendingUp, color: "text-amber-500" },
  { key: "automacoes", label: "Automações", icon: Zap, color: "text-cyan-500" },
];

function safeString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function renderValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined) return <span className="text-muted-foreground/50 italic">—</span>;
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted-foreground/50 italic">—</span>;
    return (
      <ul className="space-y-1">
        {value.map((item, i) => (
          <li key={i} className="flex items-start gap-1.5 text-xs">
            <span className="text-primary mt-0.5">•</span>
            <span>{safeString(item)}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (typeof value === "object") {
    return (
      <div className="space-y-1.5">
        {Object.entries(value).map(([k, v]) => (
          <div key={k}>
            <span className="text-xs font-medium text-muted-foreground capitalize">{k.replace(/_/g, " ")}: </span>
            {renderValue(v)}
          </div>
        ))}
      </div>
    );
  }
  return <span className="text-sm">{safeString(value)}</span>;
}

function CategoryCard({ config, data }: { config: typeof CATEGORY_CONFIG[0]; data: Record<string, unknown> | undefined }) {
  const Icon = config.icon;
  const hasData = data && Object.values(data).some(v => v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0));

  return (
    <div className={`rounded-lg border ${hasData ? "border-border/50" : "border-border/20 opacity-50"} overflow-hidden`}>
      <div className="p-3 flex items-center gap-2 border-b border-border/30 bg-card/50">
        <Icon className={`h-4 w-4 ${config.color}`} />
        <h3 className="text-sm font-semibold">{config.label}</h3>
        {!hasData && <Badge variant="outline" className="text-[10px] ml-auto">Aguardando</Badge>}
      </div>
      {hasData && data && (
        <div className="p-3 space-y-2">
          {Object.entries(data)
            .filter(([, v]) => v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0))
            .map(([key, value]) => (
              <div key={key}>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
                  {key.replace(/_/g, " ")}
                </p>
                {renderValue(value)}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function generateMemoryPdf(memory: StrategicMemory) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const maxWidth = pageWidth - margin * 2;
  let y = 20;

  const checkPage = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - 15) {
      doc.addPage();
      y = 20;
    }
  };

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Memória Estratégica", margin, y);
  y += 8;

  if (memory._meta?.last_updated) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120);
    doc.text(`Atualizado: ${new Date(memory._meta.last_updated).toLocaleString("pt-BR")}`, margin, y);
    doc.setTextColor(0);
    y += 10;
  }

  for (const config of CATEGORY_CONFIG) {
    const data = memory[config.key as keyof StrategicMemory] as Record<string, unknown> | undefined;
    if (!data || typeof data !== "object") continue;
    const entries = Object.entries(data).filter(([, v]) => v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0));
    if (entries.length === 0) continue;

    checkPage(20);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(60, 60, 60);
    doc.text(config.label, margin, y);
    y += 2;
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    for (const [key, value] of entries) {
      checkPage(12);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100);
      doc.text(key.replace(/_/g, " ").toUpperCase(), margin + 2, y);
      y += 4;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(30);
      doc.setFontSize(10);

      if (Array.isArray(value)) {
        for (const item of value) {
          checkPage(6);
          const lines = doc.splitTextToSize(`• ${safeString(item)}`, maxWidth - 6);
          doc.text(lines, margin + 4, y);
          y += lines.length * 5;
        }
      } else {
        const text = safeString(value);
        const lines = doc.splitTextToSize(text, maxWidth - 4);
        checkPage(lines.length * 5);
        doc.text(lines, margin + 2, y);
        y += lines.length * 5;
      }
      y += 3;
    }
    y += 4;
  }

  doc.save("memoria-estrategica.pdf");
  toast.success("PDF da memória estratégica baixado!");
}

export default function StrategicMemoryPanel({ projectId }: Props) {
  const [memory, setMemory] = useState<StrategicMemory | null>(null);
  const [loading, setLoading] = useState(true);
  const [reprocessing, setReprocessing] = useState(false);

  const fetchMemory = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("projects")
      .select("strategic_memory")
      .eq("id", projectId)
      .single();
    setMemory((data as any)?.strategic_memory || null);
    setLoading(false);
  };

  const reprocessMemory = async () => {
    setReprocessing(true);
    try {
      const { data: modules } = await supabase
        .from("modules")
        .select("module_number, generated_content, research_perplexity, research_gemini, research_qwen, research_result, custom_research")
        .eq("project_id", projectId)
        .order("module_number");

      const modulesWithData = (modules || []).filter(m =>
        m.generated_content || m.research_perplexity || m.research_gemini || m.research_qwen || m.research_result || m.custom_research
      );

      if (modulesWithData.length === 0) {
        toast.error("Nenhum módulo possui conteúdo ou pesquisa para processar.");
        setReprocessing(false);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      let currentMemory: any = null;

      for (const mod of modulesWithData) {
        const parts: string[] = [];
        if (mod.generated_content) parts.push(`[CONTEÚDO GERADO]\n${mod.generated_content}`);
        if (mod.research_perplexity) parts.push(`[PESQUISA PERPLEXITY]\n${mod.research_perplexity}`);
        if (mod.research_gemini) parts.push(`[PESQUISA GEMINI]\n${mod.research_gemini}`);
        if (mod.research_qwen) parts.push(`[PESQUISA QWEN]\n${mod.research_qwen}`);
        if (mod.research_result) parts.push(`[PESQUISA LEGADA]\n${mod.research_result}`);
        if (mod.custom_research) parts.push(`[PESQUISA PERSONALIZADA]\n${mod.custom_research}`);

        const combinedContent = parts.join("\n\n---\n\n");

        toast.info(`Processando M${mod.module_number}...`);
        const memResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/strategic-memory`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({
              moduleNumber: mod.module_number,
              moduleContent: combinedContent,
              existingMemory: currentMemory,
            }),
          }
        );

        if (memResponse.ok) {
          const memData = await memResponse.json();
          currentMemory = memData.memory;
        } else if (memResponse.status === 402) {
          toast.error("Créditos de IA insuficientes. Aguarde a renovação ou configure uma chave Gemini.");
          break;
        } else if (memResponse.status === 429) {
          toast.error("Limite de requisições atingido. Aguarde alguns instantes e tente novamente.");
          break;
        } else {
          const errText = await memResponse.text().catch(() => "");
          console.error(`Strategic memory error for M${mod.module_number}:`, memResponse.status, errText);
          toast.error(`Erro ao processar M${mod.module_number} (${memResponse.status})`);
        }
      }

      if (currentMemory) {
        const { error } = await supabase.from("projects").update({
          strategic_memory: currentMemory,
        } as any).eq("id", projectId);
        if (error) {
          toast.error("Erro ao salvar memória: " + error.message);
        } else {
          setMemory(currentMemory);
          toast.success(`Memória estratégica reprocessada com ${modulesWithData.length} módulo(s)!`);
        }
      }
    } catch (err: any) {
      toast.error("Erro ao reprocessar: " + (err.message || "Erro desconhecido"));
    }
    setReprocessing(false);
  };

  useEffect(() => {
    fetchMemory();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!memory || Object.keys(memory).filter(k => k !== "_meta").length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <Brain className="h-12 w-12 text-muted-foreground/20 mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground">Memória estratégica vazia</h3>
        <p className="text-sm text-muted-foreground/70 mt-1 max-w-md">
          A memória será preenchida automaticamente conforme os módulos M1-M8 forem gerados. Se já possui módulos gerados, clique abaixo para reprocessar.
        </p>
        <Button onClick={reprocessMemory} disabled={reprocessing} className="mt-4 gap-2">
          {reprocessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          {reprocessing ? "Reprocessando..." : "Reprocessar Memória dos Módulos"}
        </Button>
      </div>
    );
  }

  const meta = memory._meta;
  const processedCount = meta?.modules_processed?.length || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs gap-1">
            <Brain className="h-3 w-3" />
            {processedCount}/8 módulos processados
          </Badge>
          {meta?.last_updated && (
            <span className="text-xs text-muted-foreground">
              Atualizado: {new Date(meta.last_updated).toLocaleString("pt-BR")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => generateMemoryPdf(memory)} className="h-7 gap-1 text-xs">
            <Download className="h-3 w-3" /> PDF
          </Button>
          <Button variant="ghost" size="sm" onClick={reprocessMemory} disabled={reprocessing} className="h-7 gap-1 text-xs">
            {reprocessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
            {reprocessing ? "Reprocessando..." : "Reprocessar"}
          </Button>
          <Button variant="ghost" size="sm" onClick={fetchMemory} className="h-7 gap-1 text-xs">
            <RefreshCw className="h-3 w-3" /> Atualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {CATEGORY_CONFIG.map((config) => (
          <CategoryCard
            key={config.key}
            config={config}
            data={memory[config.key as keyof StrategicMemory] as Record<string, unknown> | undefined}
          />
        ))}
      </div>
    </div>
  );
}
