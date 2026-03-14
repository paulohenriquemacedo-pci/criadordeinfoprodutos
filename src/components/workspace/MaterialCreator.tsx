import { useState, useRef, useCallback, useEffect } from "react";
import { useBrandSettings, DEFAULT_BRAND, BrandSettings } from "@/hooks/useBrandSettings";
import { PostContentData } from "./PostTemplate1080x1350";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Download, ArrowLeft, Loader2, Image, RefreshCw, Sparkles, Search,
  FileText, Copy, Check, Type, Square, Plus, Layers,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Konva from "konva";

import CanvasEditor, { exportStageToPNG } from "./canvas/CanvasEditor";
import StylePanel from "./canvas/StylePanel";
import LayersPanel from "./canvas/LayersPanel";
import { CanvasElement, CanvasConfig } from "./canvas/types";
import { buildInitialElements, useCanvasElements } from "./canvas/useCanvasElements";

type TemplateFormat = "feed" | "story";

const FORMAT_CONFIG: Record<TemplateFormat, { label: string; badge: string; width: number; height: number }> = {
  feed: { label: "Feed Post", badge: "1080×1350", width: 1080, height: 1350 },
  story: { label: "Story", badge: "1080×1920", width: 1080, height: 1920 },
};

interface StockImage {
  id: string; url: string; thumbUrl: string; alt: string; author: string; authorUrl: string;
}

interface Props {
  projectId: string;
  versionContent: string;
  taskTitle: string;
  onBack: () => void;
  projectNiche?: string;
  projectAudience?: string;
}

interface ExtractedContent extends PostContentData {
  imagePromptSuggestion?: string;
  searchKeywords?: string;
}

function normalizeLabel(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\*/g, "").trim();
}

function lineMatchesLabel(line: string, labels: string[]): boolean {
  const norm = normalizeLabel(line);
  return labels.some(label => {
    const nl = normalizeLabel(label);
    return new RegExp(`^\\*{0,2}${nl}\\*{0,2}\\s*[:：]`, "i").test(norm) ||
           norm.startsWith(nl + ":") || norm.startsWith(nl + " :");
  });
}

const ALL_LABELS = [
  "título", "titulo", "headline", "gancho", "hook",
  "subtítulo", "subtitulo", "sub-headline", "subhead",
  "corpo", "body", "texto", "descrição", "descricao",
  "cta", "call to action", "chamada para ação", "chamada",
  "prompt de imagem", "image prompt", "prompt imagem", "prompt",
  "palavras-chave", "palavras chave", "keywords", "busca", "search",
  "legenda", "caption", "hashtags", "formato", "tom", "plataforma",
];

function isLabelLine(line: string): boolean {
  return lineMatchesLabel(line, ALL_LABELS);
}

function extractMultiLineField(lines: string[], labels: string[]): string {
  let startIdx = -1;
  let inlineValue = "";
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (lineMatchesLabel(trimmed, labels)) {
      startIdx = i;
      const colonIdx = trimmed.search(/[:：]/);
      if (colonIdx !== -1) inlineValue = trimmed.slice(colonIdx + 1).replace(/\*\*/g, "").replace(/\*/g, "").trim();
      break;
    }
  }
  if (startIdx === -1) return "";
  const parts: string[] = [];
  if (inlineValue) parts.push(inlineValue);
  for (let i = startIdx + 1; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;
    if (isLabelLine(trimmed)) break;
    if (trimmed.startsWith("---")) break;
    parts.push(trimmed.replace(/\*\*/g, "").replace(/\*/g, "").trim());
  }
  return parts.join(" ").trim();
}

function extractContentFromMarkdown(markdown: string): ExtractedContent {
  const lines = markdown.split("\n");
  let headline = extractMultiLineField(lines, ["título", "titulo", "headline", "gancho", "hook"]);
  let subheadline = extractMultiLineField(lines, ["subtítulo", "subtitulo", "sub-headline", "subhead"]);
  let body = extractMultiLineField(lines, ["corpo", "body", "texto", "descrição", "descricao"]);
  let cta = extractMultiLineField(lines, ["cta", "call to action", "chamada para ação", "chamada"]);
  let imagePromptSuggestion = extractMultiLineField(lines, ["prompt de imagem", "image prompt", "prompt imagem"]);
  let searchKeywords = extractMultiLineField(lines, ["palavras-chave", "palavras chave", "keywords", "busca"]);
  const cleanLines = lines.filter(l => l.trim());
  if (!headline) {
    const headingLine = cleanLines.find(l => l.trim().startsWith("# "));
    if (headingLine) headline = headingLine.replace(/^#+\s*/, "").replace(/\*\*/g, "").trim();
    else headline = cleanLines[0]?.replace(/[#*]/g, "").trim().slice(0, 80) || "Seu Título Aqui";
  }
  if (!body) {
    const bodyParts: string[] = [];
    for (const line of cleanLines) {
      const trimmed = line.trim();
      const clean = trimmed.replace(/\*\*/g, "").replace(/\*/g, "");
      if (!trimmed.startsWith("#") && !trimmed.startsWith("---") && clean.length > 15 && !isLabelLine(trimmed)) bodyParts.push(clean);
    }
    body = bodyParts.slice(0, 3).join(" ").slice(0, 200);
  }
  if (!cta) {
    const ctaLine = cleanLines.find(l => {
      const c = l.trim().toLowerCase();
      return c.includes("clique") || c.includes("acesse") || c.includes("saiba mais") || c.includes("link na bio") || c.includes("arraste") || c.includes("comente");
    });
    if (ctaLine) cta = ctaLine.replace(/\*\*/g, "").replace(/\*/g, "").trim().slice(0, 80);
  }
  return { headline: headline.slice(0, 120), subheadline: subheadline.slice(0, 120), body, cta, imagePromptSuggestion, searchKeywords };
}

export default function MaterialCreator({ projectId, versionContent, taskTitle, onBack, projectNiche, projectAudience }: Props) {
  const { data: savedBrand } = useBrandSettings(projectId);
  const [format, setFormat] = useState<TemplateFormat>("feed");
  const cfg = FORMAT_CONFIG[format];

  const brand: BrandSettings = savedBrand || { id: "", project_id: projectId, created_at: "", updated_at: "", ...DEFAULT_BRAND };
  const extracted = extractContentFromMarkdown(versionContent);

  const [imagePrompt, setImagePrompt] = useState(extracted.imagePromptSuggestion || extracted.headline?.replace(/\*+/g, "").slice(0, 80) || "");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [stockQuery, setStockQuery] = useState(extracted.searchKeywords || "");
  const [stockImages, setStockImages] = useState<StockImage[]>([]);
  const [isSearchingStock, setIsSearchingStock] = useState(false);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [captionCopied, setCaptionCopied] = useState(false);
  const [bgColor, setBgColor] = useState("#FFFFFF");

  // Canvas elements
  const initialContent: PostContentData = {
    headline: extracted.headline, subheadline: extracted.subheadline || "",
    body: extracted.body || "", cta: extracted.cta || "", footer: "",
    imageUrl: "", logoUrl: brand.logo_url || "",
  };
  const initialElements = buildInitialElements(initialContent, brand, cfg.width, cfg.height);
  const {
    elements, setElements, selectedId, setSelectedId, selectedElement,
    updateElement, deleteElement, addElement, duplicateElement, moveLayer,
  } = useCanvasElements(initialElements);

  const canvasConfig: CanvasConfig = { width: cfg.width, height: cfg.height, backgroundColor: bgColor };

  // Stage ref for export
  const stageRef = useRef<Konva.Stage | null>(null);

  const previewScale = format === "story" ? 0.24 : 0.32;

  // Export PNG via Konva
  const handleExport = useCallback(() => {
    if (!stageRef.current) {
      toast.error("Canvas não encontrado.");
      return;
    }

    try {
      exportStageToPNG(
        stageRef,
        canvasConfig,
        `${taskTitle.replace(/[^a-zA-Z0-9]/g, "_")}_${format}_${cfg.width}x${cfg.height}.png`
      );
      toast.success(`Imagem exportada em ${cfg.badge}!`);
    } catch (err: any) {
      toast.error("Erro ao exportar: " + (err?.message || "falha inesperada"));
    }
  }, [canvasConfig, cfg, format, taskTitle]);

  // AI Image Generation
  const handleGenerateImage = async () => {
    const prompt = imagePrompt || extracted.headline || projectNiche || "professional background";
    setIsGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-post-image", {
        body: { prompt, style: brand.visual_style === "dark" ? "dark premium, cinematic" : "clean, professional", width: cfg.width, height: cfg.height },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.imageUrl) {
        // Add as background image element (always at bottom)
        setElements(prev => {
          const minZ = Math.min(0, ...prev.map(el => el.zIndex)) - 1;
          return [...prev, {
            id: `img_${Date.now()}`, type: "image" as const, x: 0, y: 0,
            width: cfg.width, height: cfg.height, rotation: 0,
            opacity: 0.3, locked: false, visible: true, zIndex: minZ,
            src: data.imageUrl,
          }];
        });
        toast.success("Imagem adicionada ao canvas!");
      }
    } catch (err: any) {
      toast.error("Erro ao gerar imagem: " + err.message);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Stock Image Search
  const handleSearchStock = async () => {
    const query = stockQuery || projectNiche || "";
    if (!query) { toast.error("Digite um termo de busca."); return; }
    setIsSearchingStock(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-stock-images", {
        body: { query, perPage: 12, orientation: "portrait" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setStockImages(data?.images || []);
      if (!data?.images?.length) toast.info("Nenhuma imagem encontrada.");
    } catch (err: any) {
      toast.error("Erro na busca: " + err.message);
    } finally {
      setIsSearchingStock(false);
    }
  };

  const selectStockImage = (img: StockImage) => {
    setElements(prev => {
      const minZ = Math.min(0, ...prev.map(el => el.zIndex)) - 1;
      return [...prev, {
        id: `img_${Date.now()}`, type: "image" as const, x: 0, y: 0,
        width: cfg.width, height: cfg.height, rotation: 0,
        opacity: 0.3, locked: false, visible: true, zIndex: minZ,
        src: img.url,
      }];
    });
    setStockDialogOpen(false);
    toast.success(`Imagem adicionada! Foto de ${img.author}`);
  };

  // Caption Generation
  const handleGenerateCaption = async () => {
    setIsGeneratingCaption(true);
    try {
      const headlineEl = elements.find(el => el.type === "text" && el.fontStyle?.includes("bold") && (el.fontSize || 0) > 40);
      const { data, error } = await supabase.functions.invoke("generate-post-caption", {
        body: {
          headline: headlineEl?.text || extracted.headline,
          niche: projectNiche, targetAudience: projectAudience,
          tone: "profissional e engajante", platform: "Instagram",
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.caption) { setCaption(data.caption); toast.success("Legenda gerada!"); }
    } catch (err: any) {
      toast.error("Erro ao gerar legenda: " + err.message);
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(caption);
    setCaptionCopied(true);
    toast.success("Legenda copiada!");
    setTimeout(() => setCaptionCopied(false), 2000);
  };

  // Add new elements
  const addTextElement = () => {
    addElement({
      id: `txt_${Date.now()}`, type: "text",
      x: 100, y: 200, width: 500, height: 100,
      rotation: 0, opacity: 1, locked: false, visible: true,
      zIndex: elements.length,
      text: "Novo texto", fontSize: 36, fontFamily: brand.body_font,
      fontStyle: "normal", fill: brand.text_color, align: "left", lineHeight: 1.2,
    });
  };

  const addShapeElement = () => {
    addElement({
      id: `shp_${Date.now()}`, type: "shape",
      x: 100, y: 100, width: 200, height: 200,
      rotation: 0, opacity: 1, locked: false, visible: true,
      zIndex: elements.length,
      shapeType: "rect", fill: brand.primary_color, cornerRadius: 0,
    });
  };

  const addLogoElement = () => {
    const url = brand.logo_url;
    if (!url) { toast.error("Configure o logo no Brand Kit primeiro."); return; }
    addElement({
      id: `logo_${Date.now()}`, type: "logo",
      x: 72, y: 64, width: 180, height: 56,
      rotation: 0, opacity: 1, locked: false, visible: true,
      zIndex: elements.length, src: url,
    });
  };

  const handleReExtract = () => {
    const re = extractContentFromMarkdown(versionContent);
    const newElements = buildInitialElements(
      { headline: re.headline, subheadline: re.subheadline || "", body: re.body || "", cta: re.cta || "", footer: "", imageUrl: "", logoUrl: brand.logo_url || "" },
      brand, cfg.width, cfg.height
    );
    setElements(newElements);
    setSelectedId(null);
    if (re.imagePromptSuggestion) setImagePrompt(re.imagePromptSuggestion);
    if (re.searchKeywords) setStockQuery(re.searchKeywords);
    toast.success("Canvas recriado com conteúdo re-extraído!");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-border/50 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Image className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Editor Visual</h3>
            <Badge variant="outline" className="text-[10px]">{cfg.badge}</Badge>
            <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary">Canvas Interativo</Badge>
          </div>
        </div>

        {/* Format selector */}
        <div className="flex gap-1">
          {(Object.entries(FORMAT_CONFIG) as [TemplateFormat, typeof cfg][]).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setFormat(key)}
              className={`text-xs py-1 px-2.5 rounded-md border transition-all ${
                format === key ? "border-primary bg-primary/10 text-primary font-medium" : "border-border/50 text-muted-foreground hover:border-primary/30"
              }`}
            >
              {val.label}
            </button>
          ))}
        </div>

        <Button variant="outline" size="sm" onClick={handleReExtract} className="gap-1 text-xs">
          <RefreshCw className="h-3 w-3" /> Re-extrair
        </Button>
        <Button size="sm" onClick={handleExport} className="gap-1">
          <Download className="h-4 w-4" /> Exportar PNG
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Tools & Properties */}
        <div className="w-72 border-r border-border/50 shrink-0">
          <ScrollArea className="h-full">
            <Tabs defaultValue="elements" className="w-full">
              <TabsList className="w-full grid grid-cols-3 h-9">
                <TabsTrigger value="elements" className="text-xs gap-1"><Plus className="h-3 w-3" /> Adicionar</TabsTrigger>
                <TabsTrigger value="style" className="text-xs gap-1"><Sparkles className="h-3 w-3" /> Estilo</TabsTrigger>
                <TabsTrigger value="layers" className="text-xs gap-1"><Layers className="h-3 w-3" /> Camadas</TabsTrigger>
              </TabsList>

              {/* ADD ELEMENTS */}
              <TabsContent value="elements" className="p-3 space-y-3">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Adicionar Elementos</h4>
                <div className="grid grid-cols-3 gap-1.5">
                  <Button variant="outline" size="sm" className="flex-col h-16 text-[10px] gap-1" onClick={addTextElement}>
                    <Type className="h-4 w-4" /> Texto
                  </Button>
                  <Button variant="outline" size="sm" className="flex-col h-16 text-[10px] gap-1" onClick={addShapeElement}>
                    <Square className="h-4 w-4" /> Forma
                  </Button>
                  <Button variant="outline" size="sm" className="flex-col h-16 text-[10px] gap-1" onClick={addLogoElement}>
                    <Image className="h-4 w-4" /> Logo
                  </Button>
                </div>

                {/* Background color */}
                <div className="border-t border-border/30 pt-3 space-y-2">
                  <Label className="text-xs">Cor de Fundo</Label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="h-8 w-12 rounded border border-border cursor-pointer" />
                    <Input value={bgColor} onChange={e => setBgColor(e.target.value)} className="h-7 text-xs flex-1" />
                  </div>
                </div>

                {/* Image section */}
                <div className="border-t border-border/30 pt-3 space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">🖼️ Imagem de Fundo</h4>
                  <Input value={imagePrompt} onChange={e => setImagePrompt(e.target.value)} className="text-xs h-8" placeholder="Descreva a imagem..." />
                  <Button variant="outline" size="sm" className="w-full text-xs gap-1" onClick={handleGenerateImage} disabled={isGeneratingImage}>
                    {isGeneratingImage ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    {isGeneratingImage ? "Gerando..." : "Gerar com IA"}
                  </Button>
                  <Button variant="outline" size="sm" className="w-full text-xs gap-1" onClick={() => { setStockDialogOpen(true); if (!stockQuery) setStockQuery(extracted.searchKeywords || projectNiche || ""); }}>
                    <Search className="h-3 w-3" /> Banco de Imagens
                  </Button>
                  <input type="file" accept="image/*" className="hidden" id="bg-image-upload"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = URL.createObjectURL(file);
                        setElements(prev => {
                          const minZ = Math.min(0, ...prev.map(el => el.zIndex)) - 1;
                          return [...prev, {
                            id: `img_${Date.now()}`, type: "image" as const, x: 0, y: 0,
                            width: cfg.width, height: cfg.height, rotation: 0,
                            opacity: 0.3, locked: false, visible: true, zIndex: minZ, src: url,
                          }];
                        });
                      }
                    }}
                  />
                  <Button variant="outline" size="sm" className="w-full text-xs gap-1" onClick={() => document.getElementById("bg-image-upload")?.click()}>
                    <Image className="h-3 w-3" /> Upload
                  </Button>
                </div>

                {/* Caption */}
                <div className="border-t border-border/30 pt-3 space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">📝 Legenda</h4>
                  <Button variant="default" size="sm" className="w-full text-xs gap-1" onClick={handleGenerateCaption} disabled={isGeneratingCaption}>
                    {isGeneratingCaption ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
                    {isGeneratingCaption ? "Gerando..." : "Gerar Legenda"}
                  </Button>
                  {caption && (
                    <>
                      <Textarea value={caption} onChange={e => setCaption(e.target.value)} rows={6} className="text-xs resize-none" />
                      <Button variant="outline" size="sm" className="w-full text-xs gap-1" onClick={handleCopyCaption}>
                        {captionCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {captionCopied ? "Copiada!" : "Copiar"}
                      </Button>
                    </>
                  )}
                </div>
              </TabsContent>

              {/* STYLE PANEL */}
              <TabsContent value="style" className="p-3">
                {selectedElement ? (
                  <StylePanel
                    element={selectedElement}
                    onUpdate={updateElement}
                    onDelete={deleteElement}
                    onDuplicate={duplicateElement}
                    onMoveLayer={moveLayer}
                  />
                ) : (
                  <div className="text-center py-12 text-muted-foreground text-xs">
                    Selecione um elemento no canvas para editar suas propriedades.
                  </div>
                )}
              </TabsContent>

              {/* LAYERS PANEL */}
              <TabsContent value="layers" className="p-3">
                <LayersPanel
                  elements={elements}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onUpdate={updateElement}
                />
              </TabsContent>
            </Tabs>
          </ScrollArea>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center bg-muted/30 overflow-auto p-4" data-canvas-export>
          <CanvasEditor
            config={canvasConfig}
            elements={elements}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onUpdate={updateElement}
            scale={previewScale}
          />
        </div>
      </div>

      {/* Stock Image Dialog */}
      <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-4 w-4" /> Banco de Imagens (Unsplash)
            </DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 mb-3">
            <Input value={stockQuery} onChange={e => setStockQuery(e.target.value)} placeholder="Buscar imagens..." className="text-sm" onKeyDown={e => e.key === "Enter" && handleSearchStock()} />
            <Button onClick={handleSearchStock} disabled={isSearchingStock} className="gap-1 shrink-0">
              {isSearchingStock ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Buscar
            </Button>
          </div>
          <ScrollArea className="flex-1">
            {stockImages.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {stockImages.map(img => (
                  <button key={img.id} onClick={() => selectStockImage(img)} className="relative group rounded-lg overflow-hidden border border-border/30 hover:border-primary transition-all aspect-[3/4]">
                    <img src={img.thumbUrl} alt={img.alt} className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end">
                      <span className="text-[10px] text-white p-1.5 opacity-0 group-hover:opacity-100 transition-opacity truncate w-full">📷 {img.author}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : !isSearchingStock ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Digite um termo e clique em buscar para encontrar imagens gratuitas.
              </div>
            ) : null}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
