import { CanvasElement } from "./types";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Lock, Unlock, Type, Image, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  elements: CanvasElement[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdate: (id: string, changes: Partial<CanvasElement>) => void;
}

const TYPE_ICONS: Record<string, React.FC<{ className?: string }>> = {
  text: Type,
  image: Image,
  logo: Image,
  shape: Square,
};

function getLabel(el: CanvasElement): string {
  if (el.type === "text") return el.text?.slice(0, 25) || "Texto";
  if (el.type === "logo") return "Logo";
  if (el.type === "image") return "Imagem";
  if (el.type === "shape") return "Forma";
  return "Elemento";
}

export default function LayersPanel({ elements, selectedId, onSelect, onUpdate }: Props) {
  const sorted = [...elements].sort((a, b) => b.zIndex - a.zIndex);
  const Icon = (type: string) => TYPE_ICONS[type] || Square;

  return (
    <div className="space-y-1">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Camadas</h4>
      {sorted.map(el => {
        const TypeIcon = Icon(el.type);
        return (
          <button
            key={el.id}
            onClick={() => onSelect(el.id)}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors",
              selectedId === el.id
                ? "bg-primary/15 text-primary border border-primary/30"
                : "hover:bg-muted/50 text-foreground"
            )}
          >
            <TypeIcon className="h-3 w-3 shrink-0 opacity-60" />
            <span className="flex-1 text-left truncate">{getLabel(el)}</span>
            <Button
              variant="ghost" size="icon" className="h-5 w-5 p-0"
              onClick={e => { e.stopPropagation(); onUpdate(el.id, { visible: !el.visible }); }}
            >
              {el.visible ? <Eye className="h-3 w-3 opacity-40" /> : <EyeOff className="h-3 w-3 opacity-40" />}
            </Button>
          </button>
        );
      })}
    </div>
  );
}
