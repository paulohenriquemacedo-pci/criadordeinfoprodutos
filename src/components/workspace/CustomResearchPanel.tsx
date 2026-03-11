import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { FileText, Loader2, Save, Trash2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Props {
  moduleId: string;
  savedCustomResearch: string;
  onCustomResearchChange: (text: string) => void;
}

const BINARY_EXTENSIONS = [".pdf", ".docx", ".xlsx", ".xls"];
const BINARY_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];
const TEXT_EXTENSIONS = [".txt", ".md", ".csv", ".json"];
const ALL_EXTENSIONS = [...TEXT_EXTENSIONS, ...BINARY_EXTENSIONS];
const ALL_ACCEPT = ALL_EXTENSIONS.join(",");

function getMimeType(file: File, ext: string): string {
  if (file.type) return file.type;
  const map: Record<string, string> = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".xls": "application/vnd.ms-excel",
  };
  return map[ext] || "application/octet-stream";
}

function isBinaryFile(ext: string, type: string): boolean {
  return BINARY_EXTENSIONS.includes(ext) || BINARY_TYPES.includes(type);
}

export default function CustomResearchPanel({ moduleId, savedCustomResearch, onCustomResearchChange }: Props) {
  const [text, setText] = useState(savedCustomResearch);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingLabel, setProcessingLabel] = useState("");

  const fileToBase64 = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  };

  const processFile = async (file: File): Promise<{ name: string; content: string } | null> => {
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

    if (!ALL_EXTENSIONS.includes(ext)) {
      toast.error(`"${file.name}": formato não suportado.`);
      return null;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error(`"${file.name}": muito grande (máx. 20MB).`);
      return null;
    }

    // Text files: read directly
    if (!isBinaryFile(ext, file.type)) {
      const content = await file.text();
      return { name: file.name, content };
    }

    // Binary files: extract via edge function
    const base64 = await fileToBase64(file);
    const mimeType = getMimeType(file, ext);

    const { data, error } = await supabase.functions.invoke("extract-upload-text", {
      body: { base64, fileName: file.name, mimeType },
    });

    if (error || !data?.text) {
      toast.error(`"${file.name}": falha na extração de texto.`);
      return null;
    }

    return { name: file.name, content: data.text };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsProcessing(true);
    setProcessingProgress(0);

    let currentText = text;
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProcessingLabel(`Processando ${file.name} (${i + 1}/${files.length})...`);
      setProcessingProgress(Math.round(((i) / files.length) * 100));

      const result = await processFile(file);
      if (result) {
        const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
        const typeLabel = BINARY_EXTENSIONS.includes(ext) ? ext.toUpperCase().replace(".", "") : "";
        const separator = `--- Importado de: ${result.name}${typeLabel ? ` (${typeLabel})` : ""} ---`;
        currentText = currentText
          ? `${currentText}\n\n${separator}\n\n${result.content}`
          : result.content;
        successCount++;
      }
    }

    setText(currentText);
    setProcessingProgress(100);

    if (successCount > 0) {
      toast.success(`${successCount} arquivo(s) importado(s) com sucesso!`);
    }

    setIsProcessing(false);
    setProcessingLabel("");
    setProcessingProgress(0);
    e.target.value = "";
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("modules")
        .update({ custom_research: text } as any)
        .eq("id", moduleId);
      if (error) throw error;
      onCustomResearchChange(text);
      toast.success("Pesquisa externa salva!");
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    setText("");
    await supabase
      .from("modules")
      .update({ custom_research: null } as any)
      .eq("id", moduleId);
    onCustomResearchChange("");
    toast.info("Pesquisa externa removida.");
  };

  return (
    <div className="border-b border-border/50 px-4 py-3 bg-muted/20 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Pesquisa Externa do Usuário</span>
          {savedCustomResearch && (
            <Badge variant="secondary" className="text-xs">Salva</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label>
            <input
              type="file"
              accept={ALL_ACCEPT}
              className="hidden"
              onChange={handleFileUpload}
              disabled={isProcessing}
              multiple
            />
            <Button variant="outline" size="sm" className="gap-1 cursor-pointer" disabled={isProcessing} asChild>
              <span>
                {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                {isProcessing ? "Processando..." : "Importar arquivos"}
              </span>
            </Button>
          </label>
          {text && (
            <Button variant="ghost" size="sm" onClick={handleClear} className="gap-1 text-destructive" disabled={isProcessing}>
              <Trash2 className="h-3 w-3" /> Limpar
            </Button>
          )}
          <Button size="sm" onClick={handleSave} disabled={isSaving || isProcessing} className="gap-1">
            <Save className="h-3 w-3" /> Salvar
          </Button>
        </div>
      </div>

      {isProcessing && (
        <div className="space-y-1">
          <Progress value={processingProgress} className="h-2" />
          <p className="text-xs text-muted-foreground">{processingLabel}</p>
        </div>
      )}

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Cole aqui sua pesquisa de mercado, análise de concorrência, dados de audiência ou qualquer informação relevante que você já possua..."
        className="min-h-[120px] text-sm bg-card/30 border-border/30 resize-y"
      />
      <p className="text-xs text-muted-foreground">
        Importe múltiplos arquivos (.txt, .md, .csv, .json, .pdf, .docx, .xlsx). Documentos binários terão texto extraído via IA. Dados integrados à geração final com pesquisas Perplexity e Lovable IA.
      </p>
    </div>
  );
}
