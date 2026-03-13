import { useState, useRef, useCallback } from "react";
import html2canvas from "html2canvas";
import { useBrandSettings, DEFAULT_BRAND, BrandSettings } from "@/hooks/useBrandSettings";
import PostTemplate1080x1350, { PostContentData } from "./PostTemplate1080x1350";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Download, ArrowLeft, Loader2, Image, RefreshCw, Eye } from "lucide-react";

interface Props {
  projectId: string;
  versionContent: string;
  taskTitle: string;
  onBack: () => void;
}

function extractContentFromMarkdown(markdown: string): PostContentData {
  const lines = markdown.split("\n").filter(l => l.trim());
  
  // Try to extract structured content
  let headline = "";
  let subheadline = "";
  let body = "";
  let cta = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("# ") && !headline) {
      headline = trimmed.replace(/^#+\s*/, "");
    } else if (trimmed.startsWith("## ") && !subheadline) {
      subheadline = trimmed.replace(/^#+\s*/, "");
    } else if ((trimmed.startsWith("**") && trimmed.includes("CTA")) || trimmed.toLowerCase().includes("cta:")) {
      cta = trimmed.replace(/\*\*/g, "").replace(/cta:?\s*/i, "").trim();
    } else if (!body && !trimmed.startsWith("#") && !trimmed.startsWith("-") && !trimmed.startsWith("*") && trimmed.length > 20) {
      body = trimmed.replace(/\*\*/g, "").slice(0, 150);
    }
  }

  // Fallback
  if (!headline) {
    headline = lines[0]?.replace(/[#*]/g, "").trim().slice(0, 80) || "Seu Título Aqui";
  }

  return { headline, subheadline, body, cta };
}

export default function MaterialCreator({ projectId, versionContent, taskTitle, onBack }: Props) {
  const { data: savedBrand } = useBrandSettings(projectId);
  const templateRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Use saved brand or defaults
  const brand: BrandSettings = savedBrand || {
    id: "", project_id: projectId, created_at: "", updated_at: "",
    ...DEFAULT_BRAND,
  };

  const extracted = extractContentFromMarkdown(versionContent);

  const [content, setContent] = useState<PostContentData>({
    headline: extracted.headline,
    subheadline: extracted.subheadline || "",
    body: extracted.body || "",
    cta: extracted.cta || "",
    footer: "",
    imageUrl: "",
  });

  const handleExport = useCallback(async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(exportRef.current, {
        scale: 1,
        useCORS: true,
        backgroundColor: null,
        width: 1080,
        height: 1350,
      });
      const link = document.createElement("a");
      link.download = `${taskTitle.replace(/[^a-zA-Z0-9]/g, "_")}_1080x1350.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Imagem exportada em 1080×1350!");
    } catch (err: any) {
      toast.error("Erro ao exportar: " + err.message);
    } finally {
      setIsExporting(false);
    }
  }, [taskTitle]);

  const handleReExtract = () => {
    const re = extractContentFromMarkdown(versionContent);
    setContent(prev => ({
      headline: re.headline,
      subheadline: re.subheadline || "",
      body: re.body || "",
      cta: re.cta || "",
      footer: "",
      imageUrl: prev.imageUrl || "",
    }));
    toast.success("Conteúdo re-extraído do texto!");
  };

  // Scale for preview area
  const previewScale = 0.32;

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
            <Badge variant="outline" className="text-[10px]">1080×1350</Badge>
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
        <div className="w-72 border-r border-border/50 shrink-0">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-3">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Conteúdo</h4>
              <p className="text-[10px] text-muted-foreground">
                Use <code className="bg-muted px-1 rounded">*texto*</code> para destaque amarelo e <code className="bg-muted px-1 rounded">**texto**</code> para vermelho.
              </p>
              
              <div className="space-y-1">
                <Label className="text-xs">Título Principal</Label>
                <Textarea
                  value={content.headline}
                  onChange={e => setContent(p => ({ ...p, headline: e.target.value }))}
                  rows={2}
                  className="text-xs resize-none"
                  placeholder="Use *destaque* e **forte** para hierarquia de cores"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Subtítulo</Label>
                <Textarea
                  value={content.subheadline || ""}
                  onChange={e => setContent(p => ({ ...p, subheadline: e.target.value }))}
                  rows={2}
                  className="text-xs resize-none"
                  placeholder="Complemento do título..."
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Corpo</Label>
                <Textarea
                  value={content.body || ""}
                  onChange={e => setContent(p => ({ ...p, body: e.target.value }))}
                  rows={3}
                  className="text-xs resize-none"
                  placeholder="Texto complementar..."
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">CTA (Botão)</Label>
                <Input
                  value={content.cta || ""}
                  onChange={e => setContent(p => ({ ...p, cta: e.target.value }))}
                  className="text-xs h-8"
                  placeholder="Ex: Saiba mais →"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Rodapé</Label>
                <Input
                  value={content.footer || ""}
                  onChange={e => setContent(p => ({ ...p, footer: e.target.value }))}
                  className="text-xs h-8"
                  placeholder="@seuinstagram"
                />
              </div>

              {!savedBrand && (
                <div className="p-2 bg-accent/30 rounded-lg border border-border/30">
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
          <div style={{ width: 1080 * previewScale, height: 1350 * previewScale }} className="shadow-2xl rounded-lg overflow-hidden relative">
            <PostTemplate1080x1350
              ref={templateRef}
              brand={brand}
              content={content}
              scale={previewScale}
            />
          </div>
        </div>
      </div>

      {/* Hidden full-size template for export */}
      <div style={{ position: "absolute", left: -9999, top: -9999 }}>
        <PostTemplate1080x1350
          ref={exportRef}
          brand={brand}
          content={content}
          scale={1}
        />
      </div>
    </div>
  );
}
