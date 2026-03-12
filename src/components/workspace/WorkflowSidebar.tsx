import { MODULE_CONFIG, ModuleNumber } from "@/lib/modules";
import { cn } from "@/lib/utils";
import { FileText, LayoutGrid, Megaphone, Rss, Image, Mail, MessageCircle, TrendingUp, AlertTriangle, Shield, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const iconMap: Record<string, any> = {
  FileText, LayoutGrid, Megaphone, Rss, Image, Mail, MessageCircle, TrendingUp, Shield,
};

interface Props {
  activeModule: ModuleNumber;
  onSelectModule: (n: ModuleNumber) => void;
  modules: Array<{ module_number: number; generated_content: string | null; is_outdated: boolean }>;
}

export default function WorkflowSidebar({ activeModule, onSelectModule, modules }: Props) {
  return (
    <aside className="w-64 border-r border-border/50 bg-card/50 shrink-0 overflow-y-auto hidden md:block">
      <div className="p-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Workflow</h2>
        <nav className="space-y-1">
          {MODULE_CONFIG.map((config, index) => {
            const Icon = iconMap[config.icon];
            const isM0 = config.number === 0;
            const mod = !isM0 ? modules.find((m) => m.module_number === config.number) : undefined;
            const isActive = activeModule === config.number;
            const hasContent = !!mod?.generated_content;
            const isOutdated = mod?.is_outdated;

            return (
              <div key={config.number}>
                <button
                  onClick={() => onSelectModule(config.number as ModuleNumber)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold shrink-0",
                    isM0 ? "bg-accent text-accent-foreground" :
                    hasContent && !isOutdated ? "bg-primary/20 text-primary" :
                    isOutdated ? "bg-destructive/20 text-destructive" :
                    "bg-secondary text-muted-foreground"
                  )}>
                    {Icon && <Icon className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-medium text-muted-foreground">M{config.number}</span>
                      {isOutdated && <AlertTriangle className="h-3 w-3 text-destructive" />}
                    </div>
                    <span className="block truncate text-xs">{config.title}</span>
                  </div>
                  {hasContent && !isOutdated && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-0">✓</Badge>
                  )}
                </button>
                {isM0 && <div className="my-2 border-t border-border/30" />}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
