import { useState, useRef, useCallback } from "react";
import html2canvas from "html2canvas";
import { useBrandSettings, DEFAULT_BRAND, BrandSettings } from "@/hooks/useBrandSettings";
import PostTemplate1080x1350, { PostContentData } from "./PostTemplate1080x1350";
import StoryTemplate1080x1920 from "./StoryTemplate1080x1920";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Download, ArrowLeft, Loader2, Image, RefreshCw, Sparkles, Search, FileText, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type TemplateFormat = "feed" | "story";

const FORMAT_CONFIG: Record<TemplateFormat, { label: string; badge: string; width: number; height: number }> = {
  feed: { label: "Feed Post", badge: "1080×1350", width: 1080, height: 1350 },
  story: { label: "Story", badge: "1080×1920", width: 1080, height: 1920 },
};

interface StockImage {
  id: string;
  url: string;
  thumbUrl: string;
  alt: string;
  author: string;
  authorUrl: string;
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

/**
 * Normalize a string for label comparison: lowercase, remove accents and markdown.
 */
function normalizeLabel(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\*/g, "")
    .trim();
}

/**
 * Check if a line starts with any of the given labels (with optional ** and :).
 */
function lineMatchesLabel(line: string, labels: string[]): boolean {
  const norm = normalizeLabel(line);
  return labels.some(label => {
    const nl = normalizeLabel(label);
    // Match patterns: "label:", "**label:**", "label :"
    return new RegExp(`^\\*{0,2}${nl}\\*{0,2}\\s*[:：]`, "i").test(norm) ||
           norm.startsWith(nl + ":") || norm.startsWith(nl + " :");
  });
}

/**
 * All known field labels to detect section boundaries.
 */
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

/**
 * Extract a multi-line field value: gets the value after "Label:" on the first matching line,
 * then collects subsequent lines until the next label or end.
 */
function extractMultiLineField(lines: string[], labels: string[]): string {
  let startIdx = -1;
  let inlineValue = "";

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (lineMatchesLabel(trimmed, labels)) {
      startIdx = i;
      // Extract value after the colon on the same line
      const colonIdx = trimmed.search(/[:：]/);
      if (colonIdx !== -1) {
        inlineValue = trimmed.slice(colonIdx + 1).replace(/\*\*/g, "").replace(/\*/g, "").trim();
      }
      break;
    }
  }

  if (startIdx === -1) return "";

  // Collect continuation lines (lines after label that aren't new labels)
  const parts: string[] = [];
  if (inlineValue) parts.push(inlineValue);

  for (let i = startIdx + 1; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;
    if (isLabelLine(trimmed)) break; // Next section starts
    if (trimmed.startsWith("---")) break;
    parts.push(trimmed.replace(/\*\*/g, "").replace(/\*/g, "").trim());
  }

  return parts.join(" ").trim();
}

function extractContentFromMarkdown(markdown: string): ExtractedContent {
  const lines = markdown.split("\n");

  // Try structured multi-line extraction
  let headline = extractMultiLineField(lines, ["título", "titulo", "headline", "gancho", "hook"]);
  let subheadline = extractMultiLineField(lines, ["subtítulo", "subtitulo", "sub-headline", "subhead"]);
  let body = extractMultiLineField(lines, ["corpo", "body", "texto", "descrição", "descricao"]);
  let cta = extractMultiLineField(lines, ["cta", "call to action", "chamada para ação", "chamada"]);
  let imagePromptSuggestion = extractMultiLineField(lines, ["prompt de imagem", "image prompt", "prompt imagem"]);
  let searchKeywords = extractMultiLineField(lines, ["palavras-chave", "palavras chave", "keywords", "busca"]);

  const cleanLines = lines.filter(l => l.trim());

  // Fallback headline: first heading or first meaningful line
  if (!headline) {
    const headingLine = cleanLines.find(l => l.trim().startsWith("# "));
    if (headingLine) {
      headline = headingLine.replace(/^#+\s*/, "").replace(/\*\*/g, "").trim();
    } else {
      const first = cleanLines[0]?.replace(/[#*]/g, "").trim().slice(0, 80);
      headline = first || "Seu Título Aqui";
    }
  }

  // Fallback body: collect non-labeled paragraphs
  if (!body) {
    const bodyParts: string[] = [];
    for (const line of cleanLines) {
      const trimmed = line.trim();
      const clean = trimmed.replace(/\*\*/g, "").replace(/\*/g, "");
      if (
        !trimmed.startsWith("#") &&
        !trimmed.startsWith("---") &&
        clean.length > 15 &&
        !isLabelLine(trimmed)
      ) {
        bodyParts.push(clean);
      }
    }
    body = bodyParts.slice(0, 3).join(" ").slice(0, 200);
  }

  // Fallback CTA
  if (!cta) {
    const ctaLine = cleanLines.find(l => {
      const c = l.trim().toLowerCase();
      return c.includes("clique") || c.includes("acesse") || c.includes("saiba mais") || c.includes("link na bio") || c.includes("arraste") || c.includes("comente");
    });
    if (ctaLine) {
      cta = ctaLine.replace(/\*\*/g, "").replace(/\*/g, "").trim().slice(0, 80);
    }
  }

  console.log("[MaterialCreator] Extracted:", { headline, subheadline, body: body?.slice(0, 50), cta, imagePromptSuggestion: imagePromptSuggestion?.slice(0, 50), searchKeywords });

  return {
    headline: headline.slice(0, 120),
    subheadline: subheadline.slice(0, 120),
    body,
    cta,
    imagePromptSuggestion,
    searchKeywords,
  };
}

export default function MaterialCreator({ projectId, versionContent, taskTitle, onBack, projectNiche, projectAudience }: Props) {
  const { data: savedBrand } = useBrandSettings(projectId);
  const templateRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [format, setFormat] = useState<TemplateFormat>("feed");

  const extracted = extractContentFromMarkdown(versionContent);

  // Image generation states — pre-fill with AI-suggested prompt or headline
  const [imagePrompt, setImagePrompt] = useState(extracted.imagePromptSuggestion || extracted.headline?.replace(/\*+/g, "").slice(0, 80) || "");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Stock image search states — pre-fill with suggested keywords
  const [stockQuery, setStockQuery] = useState(extracted.searchKeywords || "");
  const [stockImages, setStockImages] = useState<StockImage[]>([]);
  const [isSearchingStock, setIsSearchingStock] = useState(false);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);

  // Caption generation states
  const [caption, setCaption] = useState("");
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [captionCopied, setCaptionCopied] = useState(false);

  const brand: BrandSettings = savedBrand || {
    id: "", project_id: projectId, created_at: "", updated_at: "",
    ...DEFAULT_BRAND,
  };

  const [content, setContent] = useState<PostContentData>({
    headline: extracted.headline,
    subheadline: extracted.subheadline || "",
    body: extracted.body || "",
    cta: extracted.cta || "",
    footer: "",
    imageUrl: "",
    logoUrl: brand.logo_url || "",
  });

  const cfg = FORMAT_CONFIG[format];

  const handleExport = useCallback(async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(exportRef.current, {
        scale: 1, useCORS: true, backgroundColor: null,
        width: cfg.width, height: cfg.height,
      });
      const link = document.createElement("a");
      link.download = `${taskTitle.replace(/[^a-zA-Z0-9]/g, "_")}_${cfg.width}x${cfg.height}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success(`Imagem exportada em ${cfg.badge}!`);
    } catch (err: any) {
      toast.error("Erro ao exportar: " + err.message);
    } finally {
      setIsExporting(false);
    }
  }, [taskTitle, cfg]);

  const handleReExtract = () => {
    const re = extractContentFromMarkdown(versionContent);
    setContent(prev => ({
      headline: re.headline, subheadline: re.subheadline || "",
      body: re.body || "", cta: re.cta || "", footer: "",
      imageUrl: prev.imageUrl || "",
      logoUrl: prev.logoUrl || "",
    }));
    if (re.imagePromptSuggestion) setImagePrompt(re.imagePromptSuggestion);
    if (re.searchKeywords) setStockQuery(re.searchKeywords);
    toast.success("Conteúdo re-extraído do texto!");
  };

  // AI Image Generation
  const handleGenerateImage = async () => {
    const prompt = imagePrompt || content.headline || projectNiche || "professional background";
    setIsGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-post-image", {
        body: {
          prompt,
          style: brand.visual_style === "dark" ? "dark premium, cinematic lighting, moody" : "clean, bright, professional",
          width: cfg.width,
          height: cfg.height,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.imageUrl) {
        setContent(p => ({ ...p, imageUrl: data.imageUrl }));
        toast.success("Imagem gerada com IA!");
      }
    } catch (err: any) {
      toast.error("Erro ao gerar imagem: " + err.message);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Stock Image Search
  const handleSearchStock = async () => {
    const query = stockQuery || content.headline || projectNiche || "";
    if (!query) { toast.error("Digite um termo de busca."); return; }
    setIsSearchingStock(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-stock-images", {
        body: { query, perPage: 12, orientation: format === "story" ? "portrait" : "portrait" },
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
    setContent(p => ({ ...p, imageUrl: img.url }));
    setStockDialogOpen(false);
    toast.success(`Imagem selecionada! Foto de ${img.author}`);
  };

  // Caption Generation
  const handleGenerateCaption = async () => {
    setIsGeneratingCaption(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-post-caption", {
        body: {
          headline: content.headline,
          subheadline: content.subheadline,
          body: content.body,
          niche: projectNiche,
          targetAudience: projectAudience,
          tone: "profissional e engajante",
          platform: "Instagram",
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.caption) {
        setCaption(data.caption);
        toast.success("Legenda gerada com sucesso!");
      }
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

  const previewScale = format === "story" ? 0.24 : 0.32;
  const TemplateComponent = format === "story" ? StoryTemplate1080x1920 : PostTemplate1080x1350;

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
            <h3 className="text-sm font-semibold">Criar Material Visual</h3>
            <Badge variant="outline" className="text-[10px]">{cfg.badge}</Badge>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleReExtract} className="gap-1 text-xs">
          <RefreshCw className="h-3 w-3" /> Re-extrair
        </Button>
        <Button size="sm" onClick={handleExport} disabled={isExporting} className="gap-1">
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Exportar PNG
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Editor Panel */}
        <div className="w-80 border-r border-border/50 shrink-0">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-3">
              {/* Format selector */}
              <div className="space-y-1">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Formato</h4>
                <div className="flex gap-1">
                  {(Object.entries(FORMAT_CONFIG) as [TemplateFormat, typeof cfg][]).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => setFormat(key)}
                      className={`flex-1 text-xs py-1.5 px-2 rounded-md border transition-all ${
                        format === key
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border/50 text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      {val.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content fields */}
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Conteúdo do Post</h4>
              <p className="text-[10px] text-muted-foreground">
                Use <code className="bg-muted px-1 rounded">*texto*</code> para amarelo e <code className="bg-muted px-1 rounded">**texto**</code> para vermelho.
              </p>

              <div className="space-y-1">
                <Label className="text-xs">Título Principal</Label>
                <Textarea value={content.headline} onChange={e => setContent(p => ({ ...p, headline: e.target.value }))} rows={2} className="text-xs resize-none" />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Subtítulo</Label>
                <Textarea value={content.subheadline || ""} onChange={e => setContent(p => ({ ...p, subheadline: e.target.value }))} rows={2} className="text-xs resize-none" />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Corpo</Label>
                <Textarea value={content.body || ""} onChange={e => setContent(p => ({ ...p, body: e.target.value }))} rows={2} className="text-xs resize-none" />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">CTA (Barra inferior)</Label>
                <Input value={content.cta || ""} onChange={e => setContent(p => ({ ...p, cta: e.target.value }))} className="text-xs h-8" placeholder="Ex: Saiba mais →" />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Rodapé</Label>
                <Input value={content.footer || ""} onChange={e => setContent(p => ({ ...p, footer: e.target.value }))} className="text-xs h-8" placeholder="@seuinstagram" />
              </div>

              {/* === LOGO SECTION === */}
              <div className="border-t border-border/30 pt-3">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">🏷️ Logomarca</h4>
                {content.logoUrl && (
                  <div className="mb-2 p-2 bg-muted/30 rounded-lg flex items-center gap-2">
                    <img src={content.logoUrl} alt="Logo" className="h-8 object-contain" />
                    <Button variant="ghost" size="sm" className="text-xs text-destructive ml-auto h-6"
                      onClick={() => setContent(p => ({ ...p, logoUrl: "" }))}>
                      Remover
                    </Button>
                  </div>
                )}
                <Input
                  value={content.logoUrl || ""}
                  onChange={e => setContent(p => ({ ...p, logoUrl: e.target.value }))}
                  className="text-xs h-8 mb-1.5"
                  placeholder="Cole a URL da logomarca..."
                />
                <input type="file" accept="image/*" className="hidden" id="logo-upload"
                  onChange={e => { const file = e.target.files?.[0]; if (file) setContent(p => ({ ...p, logoUrl: URL.createObjectURL(file) })); }}
                />
                <Button variant="outline" size="sm" className="w-full text-xs gap-1"
                  onClick={() => document.getElementById("logo-upload")?.click()}>
                  <Image className="h-3 w-3" /> Upload Logo
                </Button>
              </div>

              <div className="border-t border-border/30 pt-3">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">🖼️ Imagem de Fundo</h4>

                {/* AI Image Generation */}
                <div className="space-y-1.5 mb-2">
                  <Input
                    value={imagePrompt}
                    onChange={e => setImagePrompt(e.target.value)}
                    className="text-xs h-8"
                    placeholder="Descreva a imagem (ex: academia escura com luzes neon)"
                  />
                  <Button
                    variant="outline" size="sm"
                    className="w-full text-xs gap-1"
                    onClick={handleGenerateImage}
                    disabled={isGeneratingImage}
                  >
                    {isGeneratingImage ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    {isGeneratingImage ? "Gerando com IA..." : "Gerar Imagem com IA"}
                  </Button>
                </div>

                {/* Stock Image Search */}
                <Button
                  variant="outline" size="sm"
                  className="w-full text-xs gap-1 mb-2"
                  onClick={() => { setStockDialogOpen(true); setStockQuery(content.headline?.replace(/\*+/g, "") || projectNiche || ""); }}
                >
                  <Search className="h-3 w-3" /> Buscar no Banco de Imagens
                </Button>

                {/* Manual upload/URL */}
                <Input
                  value={content.imageUrl || ""}
                  onChange={e => setContent(p => ({ ...p, imageUrl: e.target.value }))}
                  className="text-xs h-8 mb-1.5"
                  placeholder="Ou cole a URL da imagem..."
                />
                <input type="file" accept="image/*" className="hidden" id="bg-image-upload"
                  onChange={e => { const file = e.target.files?.[0]; if (file) setContent(p => ({ ...p, imageUrl: URL.createObjectURL(file) })); }}
                />
                <Button variant="outline" size="sm" className="w-full text-xs gap-1"
                  onClick={() => document.getElementById("bg-image-upload")?.click()}>
                  <Image className="h-3 w-3" /> Upload do Computador
                </Button>

                {content.imageUrl && (
                  <Button variant="ghost" size="sm" className="w-full text-xs text-destructive mt-1"
                    onClick={() => setContent(p => ({ ...p, imageUrl: "" }))}>
                    Remover imagem
                  </Button>
                )}
              </div>

              {/* === CAPTION SECTION === */}
              <div className="border-t border-border/30 pt-3">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">📝 Legenda com CTA & Hashtags</h4>
                <Button
                  variant="default" size="sm"
                  className="w-full text-xs gap-1 mb-2"
                  onClick={handleGenerateCaption}
                  disabled={isGeneratingCaption}
                >
                  {isGeneratingCaption ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
                  {isGeneratingCaption ? "Gerando legenda..." : "Gerar Legenda Completa"}
                </Button>

                {caption && (
                  <div className="space-y-1.5">
                    <Textarea
                      value={caption}
                      onChange={e => setCaption(e.target.value)}
                      rows={8}
                      className="text-xs resize-none"
                    />
                    <Button variant="outline" size="sm" className="w-full text-xs gap-1" onClick={handleCopyCaption}>
                      {captionCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {captionCopied ? "Copiada!" : "Copiar Legenda"}
                    </Button>
                  </div>
                )}
              </div>

              {!savedBrand && (
                <div className="p-2 bg-accent/30 rounded-lg border border-border/30 mt-2">
                  <p className="text-[10px] text-muted-foreground">
                    <span className="font-medium">Dica:</span> Configure o Brand Kit na barra lateral para personalizar cores e fontes.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Preview */}
        <div className="flex-1 flex items-center justify-center bg-muted/30 overflow-auto p-4">
          <div
            style={{ width: cfg.width * previewScale, height: cfg.height * previewScale }}
            className="shadow-2xl rounded-lg overflow-hidden relative"
          >
            <TemplateComponent
              ref={templateRef}
              brand={brand}
              content={content}
              scale={previewScale}
              onContentChange={(field, value) => setContent(p => ({ ...p, [field]: value }))}
            />
          </div>
        </div>
      </div>

      {/* Hidden full-size template for export */}
      <div style={{ position: "absolute", left: -9999, top: -9999 }}>
        <TemplateComponent ref={exportRef} brand={brand} content={content} scale={1} />
      </div>

      {/* Stock Image Search Dialog */}
      <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-4 w-4" /> Banco de Imagens (Unsplash)
            </DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 mb-3">
            <Input
              value={stockQuery}
              onChange={e => setStockQuery(e.target.value)}
              placeholder="Buscar imagens..."
              className="text-sm"
              onKeyDown={e => e.key === "Enter" && handleSearchStock()}
            />
            <Button onClick={handleSearchStock} disabled={isSearchingStock} className="gap-1 shrink-0">
              {isSearchingStock ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Buscar
            </Button>
          </div>
          <ScrollArea className="flex-1">
            {stockImages.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {stockImages.map(img => (
                  <button
                    key={img.id}
                    onClick={() => selectStockImage(img)}
                    className="relative group rounded-lg overflow-hidden border border-border/30 hover:border-primary transition-all aspect-[3/4]"
                  >
                    <img src={img.thumbUrl} alt={img.alt} className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end">
                      <span className="text-[10px] text-white p-1.5 opacity-0 group-hover:opacity-100 transition-opacity truncate w-full">
                        📷 {img.author}
                      </span>
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
