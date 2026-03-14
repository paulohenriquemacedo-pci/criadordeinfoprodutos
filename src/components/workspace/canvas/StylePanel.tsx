import { CanvasElement } from "./types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Trash2, Copy, ChevronUp, ChevronDown, Lock, Unlock,
  Eye, EyeOff, Bold, Italic, AlignLeft, AlignCenter, AlignRight
} from "lucide-react";

const FONT_OPTIONS = [
  "Inter", "Bebas Neue", "Montserrat", "Playfair Display", "Roboto",
  "Oswald", "Raleway", "Poppins", "Lato", "Open Sans",
  "Space Grotesk", "DM Sans", "Sora", "Archivo Black",
];

interface Props {
  element: CanvasElement;
  onUpdate: (id: string, changes: Partial<CanvasElement>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMoveLayer: (id: string, dir: "up" | "down") => void;
}

export default function StylePanel({ element, onUpdate, onDelete, onDuplicate, onMoveLayer }: Props) {
  const u = (changes: Partial<CanvasElement>) => onUpdate(element.id, changes);

  return (
    <div className="space-y-3">
      {/* Actions bar */}
      <div className="flex items-center gap-1 flex-wrap">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => u({ locked: !element.locked })} title={element.locked ? "Desbloquear" : "Bloquear"}>
          {element.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => u({ visible: !element.visible })} title="Visibilidade">
          {element.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onMoveLayer(element.id, "up")} title="Mover acima">
          <ChevronUp className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onMoveLayer(element.id, "down")} title="Mover abaixo">
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDuplicate(element.id)} title="Duplicar">
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(element.id)} title="Excluir">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Opacity */}
      <div className="space-y-1">
        <Label className="text-xs">Opacidade</Label>
        <Slider
          value={[element.opacity * 100]}
          onValueChange={([v]) => u({ opacity: v / 100 })}
          min={0} max={100} step={1}
        />
      </div>

      {/* Position */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px]">X</Label>
          <Input type="number" className="h-7 text-xs" value={Math.round(element.x)} onChange={e => u({ x: +e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Y</Label>
          <Input type="number" className="h-7 text-xs" value={Math.round(element.y)} onChange={e => u({ y: +e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Largura</Label>
          <Input type="number" className="h-7 text-xs" value={Math.round(element.width)} onChange={e => u({ width: +e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Altura</Label>
          <Input type="number" className="h-7 text-xs" value={Math.round(element.height)} onChange={e => u({ height: +e.target.value })} />
        </div>
      </div>

      {/* Rotation */}
      <div className="space-y-1">
        <Label className="text-xs">Rotação: {Math.round(element.rotation)}°</Label>
        <Slider
          value={[element.rotation]}
          onValueChange={([v]) => u({ rotation: v })}
          min={-180} max={180} step={1}
        />
      </div>

      {/* TEXT-specific controls */}
      {element.type === "text" && (
        <>
          <div className="border-t border-border/30 pt-3 space-y-2">
            <Label className="text-xs font-medium">{element.name || "Texto"}</Label>
            <Textarea
              value={element.text || ""}
              onChange={e => u({ text: e.target.value })}
              rows={3}
              className="text-xs resize-none"
            />
          </div>

          {/* Font family */}
          <div className="space-y-1">
            <Label className="text-xs">Fonte</Label>
            <Select value={element.fontFamily || "Inter"} onValueChange={v => u({ fontFamily: v })}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map(f => (
                  <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Font size */}
          <div className="space-y-1">
            <Label className="text-xs">Tamanho: {element.fontSize}px</Label>
            <Slider
              value={[element.fontSize || 24]}
              onValueChange={([v]) => u({ fontSize: v })}
              min={12} max={120} step={1}
            />
          </div>

          {/* Style buttons */}
          <div className="flex gap-1">
            <Button
              variant={element.fontStyle?.includes("bold") ? "default" : "outline"}
              size="icon" className="h-7 w-7"
              onClick={() => {
                const isBold = element.fontStyle?.includes("bold");
                const isItalic = element.fontStyle?.includes("italic");
                u({ fontStyle: `${isBold ? "" : "bold"} ${isItalic ? "italic" : ""}`.trim() || "normal" });
              }}
            >
              <Bold className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={element.fontStyle?.includes("italic") ? "default" : "outline"}
              size="icon" className="h-7 w-7"
              onClick={() => {
                const isBold = element.fontStyle?.includes("bold");
                const isItalic = element.fontStyle?.includes("italic");
                u({ fontStyle: `${isBold ? "bold" : ""} ${isItalic ? "" : "italic"}`.trim() || "normal" });
              }}
            >
              <Italic className="h-3.5 w-3.5" />
            </Button>
            <div className="w-px bg-border/50 mx-1" />
            <Button variant={element.align === "left" ? "default" : "outline"} size="icon" className="h-7 w-7" onClick={() => u({ align: "left" })}>
              <AlignLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant={element.align === "center" ? "default" : "outline"} size="icon" className="h-7 w-7" onClick={() => u({ align: "center" })}>
              <AlignCenter className="h-3.5 w-3.5" />
            </Button>
            <Button variant={element.align === "right" ? "default" : "outline"} size="icon" className="h-7 w-7" onClick={() => u({ align: "right" })}>
              <AlignRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Color */}
          <div className="space-y-1">
            <Label className="text-xs">Cor do texto</Label>
            <div className="flex gap-2 items-center">
              <input type="color" value={element.fill || "#000000"} onChange={e => u({ fill: e.target.value })} className="h-7 w-10 rounded border border-border cursor-pointer" />
              <Input value={element.fill || "#000000"} onChange={e => u({ fill: e.target.value })} className="h-7 text-xs flex-1" />
            </div>
          </div>

          {/* Line height */}
          <div className="space-y-1">
            <Label className="text-xs">Entrelinha: {(element.lineHeight || 1.2).toFixed(1)}</Label>
            <Slider
              value={[(element.lineHeight || 1.2) * 10]}
              onValueChange={([v]) => u({ lineHeight: v / 10 })}
              min={8} max={30} step={1}
            />
          </div>

          {/* Shadow */}
          <div className="border-t border-border/30 pt-2 space-y-2">
            <Label className="text-xs font-medium">Sombra</Label>
            <div className="flex gap-2 items-center">
              <input type="color" value={element.shadowColor || "#000000"} onChange={e => u({ shadowColor: e.target.value })} className="h-7 w-10 rounded border border-border cursor-pointer" />
              <div className="flex-1 space-y-1">
                <Label className="text-[10px]">Blur: {element.shadowBlur || 0}</Label>
                <Slider
                  value={[element.shadowBlur || 0]}
                  onValueChange={([v]) => u({ shadowBlur: v })}
                  min={0} max={30} step={1}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* SHAPE-specific controls */}
      {element.type === "shape" && (
        <div className="border-t border-border/30 pt-3 space-y-2">
          <Label className="text-xs font-medium">Forma</Label>
          <div className="space-y-1">
            <Label className="text-xs">Cor de preenchimento</Label>
            <div className="flex gap-2 items-center">
              <input type="color" value={element.fill || "#000000"} onChange={e => u({ fill: e.target.value })} className="h-7 w-10 rounded border border-border cursor-pointer" />
              <Input value={element.fill || "#000000"} onChange={e => u({ fill: e.target.value })} className="h-7 text-xs flex-1" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Arredondamento: {element.cornerRadius || 0}px</Label>
            <Slider
              value={[element.cornerRadius || 0]}
              onValueChange={([v]) => u({ cornerRadius: v })}
              min={0} max={100} step={1}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Borda</Label>
            <div className="flex gap-2 items-center">
              <input type="color" value={element.stroke || "#000000"} onChange={e => u({ stroke: e.target.value })} className="h-7 w-10 rounded border border-border cursor-pointer" />
              <Slider
                value={[element.strokeWidth || 0]}
                onValueChange={([v]) => u({ strokeWidth: v })}
                min={0} max={10} step={1}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
