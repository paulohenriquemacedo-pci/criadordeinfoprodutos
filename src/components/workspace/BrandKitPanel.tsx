import { useState, useEffect } from "react";
import { useBrandSettings, useUpsertBrandSettings, DEFAULT_BRAND, BrandSettings } from "@/hooks/useBrandSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Palette, Save, Loader2, RotateCcw } from "lucide-react";
import { Palette, Save, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface Props {
  projectId: string;
}

const FONTS = [
  "Inter", "Poppins", "Montserrat", "Roboto", "Open Sans", "Lato",
  "Playfair Display", "Merriweather", "Oswald", "Raleway", "Bebas Neue",
  "DM Sans", "Space Grotesk", "Sora", "Outfit", "Manrope",
];

const VISUAL_STYLES = [
  { id: "clean", label: "Clean & Minimalista", desc: "Linhas limpas, muito espaço, tons suaves" },
  { id: "bold", label: "Bold & Vibrante", desc: "Cores fortes, tipografia grande, alto contraste" },
  { id: "dark", label: "Dark & Premium", desc: "Fundo escuro, elegante, dourado ou neon" },
  { id: "minimal", label: "Minimal & Moderno", desc: "Ultra-minimalista, poucos elementos, sofisticado" },
];

export default function BrandKitPanel({ projectId }: Props) {
  const { data: brand, isLoading } = useBrandSettings(projectId);
  const upsert = useUpsertBrandSettings();

  const [form, setForm] = useState({
    primary_color: DEFAULT_BRAND.primary_color,
    secondary_color: DEFAULT_BRAND.secondary_color,
    accent_color: DEFAULT_BRAND.accent_color,
    background_color: DEFAULT_BRAND.background_color,
    text_color: DEFAULT_BRAND.text_color,
    heading_font: DEFAULT_BRAND.heading_font,
    body_font: DEFAULT_BRAND.body_font,
    visual_style: DEFAULT_BRAND.visual_style,
  });

  useEffect(() => {
    if (brand) {
      setForm({
        primary_color: brand.primary_color,
        secondary_color: brand.secondary_color,
        accent_color: brand.accent_color,
        background_color: brand.background_color,
        text_color: brand.text_color,
        heading_font: brand.heading_font,
        body_font: brand.body_font,
        visual_style: brand.visual_style,
      });
    }
  }, [brand]);

  const handleSave = () => {
    upsert.mutate({ project_id: projectId, ...form });
  };

  const handleReset = () => {
    setForm({
      primary_color: DEFAULT_BRAND.primary_color,
      secondary_color: DEFAULT_BRAND.secondary_color,
      accent_color: DEFAULT_BRAND.accent_color,
      background_color: DEFAULT_BRAND.background_color,
      text_color: DEFAULT_BRAND.text_color,
      heading_font: DEFAULT_BRAND.heading_font,
      body_font: DEFAULT_BRAND.body_font,
      visual_style: DEFAULT_BRAND.visual_style,
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Brand Kit</h3>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1 text-xs">
              <RotateCcw className="h-3 w-3" /> Reset
            </Button>
            <Button size="sm" onClick={handleSave} disabled={upsert.isPending} className="gap-1 text-xs">
              {upsert.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Salvar
            </Button>
          </div>
        </div>

        {/* Colors */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cores</h4>
          <div className="grid grid-cols-2 gap-3">
            {([
              ["primary_color", "Primária"],
              ["secondary_color", "Secundária"],
              ["accent_color", "Acento"],
              ["background_color", "Fundo"],
              ["text_color", "Texto"],
            ] as const).map(([key, label]) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs">{label}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form[key]}
                    onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    className="w-8 h-8 rounded border border-border cursor-pointer"
                  />
                  <Input
                    value={form[key]}
                    onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    className="text-xs h-8 font-mono"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fonts */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipografia</h4>
          <div className="space-y-2">
            <div>
              <Label className="text-xs">Fonte de Título</Label>
              <Select value={form.heading_font} onValueChange={v => setForm(p => ({ ...p, heading_font: v }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FONTS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Fonte de Corpo</Label>
              <Select value={form.body_font} onValueChange={v => setForm(p => ({ ...p, body_font: v }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FONTS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Visual Style */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Estilo Visual</h4>
          <div className="grid grid-cols-2 gap-2">
            {VISUAL_STYLES.map(s => (
              <button
                key={s.id}
                onClick={() => setForm(p => ({ ...p, visual_style: s.id }))}
                className={`text-left p-2.5 rounded-lg border transition-all text-xs ${
                  form.visual_style === s.id
                    ? "border-primary bg-primary/10"
                    : "border-border/50 hover:border-primary/30"
                }`}
              >
                <span className="font-medium block">{s.label}</span>
                <span className="text-muted-foreground text-[10px] mt-0.5 block">{s.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Preview</h4>
          <div
            className="rounded-lg border border-border/50 p-4 space-y-2"
            style={{ backgroundColor: form.background_color, color: form.text_color }}
          >
            <div
              className="text-lg font-bold"
              style={{ fontFamily: form.heading_font, color: form.primary_color }}
            >
              Título de Exemplo
            </div>
            <p className="text-sm" style={{ fontFamily: form.body_font }}>
              Este é um texto de exemplo com a identidade visual configurada.
            </p>
            <div className="flex gap-2 pt-1">
              <div className="px-3 py-1 rounded text-xs text-white font-medium" style={{ backgroundColor: form.primary_color }}>
                Botão Principal
              </div>
              <div className="px-3 py-1 rounded text-xs font-medium border" style={{ borderColor: form.secondary_color, color: form.secondary_color }}>
                Secundário
              </div>
            </div>
            <div className="text-xs font-semibold mt-1" style={{ color: form.accent_color }}>
              ★ Destaque com cor de acento
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
