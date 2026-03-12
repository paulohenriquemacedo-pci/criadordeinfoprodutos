import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Brain, User, Package, Pen, Megaphone, TrendingUp, Zap, RefreshCw, Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  projectId: string;
}

interface StrategicMemory {
  identidade_posicionamento?: {
    nicho?: string;
    subnicho?: string;
    posicionamento?: string;
    big_idea?: string;
    promessa_principal?: string;
  };
  publico_alvo?: {
    avatar_principal?: string;
    dores_principais?: string[];
    desejos_principais?: string[];
    objecoes?: string[];
  };
  produto?: {
    nome_produto?: string;
    formato_produto?: string;
    estrutura_modulos?: string[];
    bonus?: string[];
    preco?: string;
    ticket_medio?: string;
  };
  copy_mensagem?: {
    headline_principal?: string;
    angulo_principal?: string;
    mecanismo_unico?: string;
    ctas?: string[];
  };
  marketing?: {
    pilares_conteudo?: string[];
    plataformas_prioritarias?: string[];
    criativos_principais?: string[];
  };
  funil_monetizacao?: {
    tipo_funil?: string;
    escada_valor?: string[];
    order_bump?: string;
    upsell?: string;
    downsell?: string;
  };
  automacoes?: {
    sequencias_email?: string[];
    funil_whatsapp?: string;
    remarketing?: string[];
  };
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

function renderValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined) return <span className="text-muted-foreground/50 italic">—</span>;
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted-foreground/50 italic">—</span>;
    return (
      <ul className="space-y-1">
        {value.map((item, i) => (
          <li key={i} className="flex items-start gap-1.5 text-xs">
            <span className="text-primary mt-0.5">•</span>
            <span>{String(item)}</span>
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
  return <span className="text-sm">{String(value)}</span>;
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
        .select("module_number, generated_content")
        .eq("project_id", projectId)
        .order("module_number");

      const modulesWithContent = (modules || []).filter(m => m.generated_content);
      if (modulesWithContent.length === 0) {
        toast.error("Nenhum módulo possui conteúdo gerado para processar.");
        setReprocessing(false);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      let currentMemory: any = null;

      for (const mod of modulesWithContent) {
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
              moduleContent: mod.generated_content,
              existingMemory: currentMemory,
            }),
          }
        );

        if (memResponse.ok) {
          const memData = await memResponse.json();
          currentMemory = memData.memory;
        } else {
          console.error("Strategic memory error for M" + mod.module_number, memResponse.status);
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
          toast.success(`Memória estratégica reprocessada com ${modulesWithContent.length} módulo(s)!`);
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
          A memória será preenchida automaticamente conforme os módulos M1-M8 forem gerados. Execute a geração em lote para começar.
        </p>
      </div>
    );
  }

  const meta = memory._meta;
  const processedCount = meta?.modules_processed?.length || 0;

  return (
    <div className="space-y-4">
      {/* Meta info */}
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
        <Button variant="ghost" size="sm" onClick={fetchMemory} className="h-7 gap-1 text-xs">
          <RefreshCw className="h-3 w-3" /> Atualizar
        </Button>
      </div>

      {/* Category cards */}
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
