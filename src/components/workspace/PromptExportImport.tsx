import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface PromptData {
  version: 1;
  exported_at: string;
  modules: Array<{
    module_number: number;
    research_prompt: string | null;
    generation_prompt: string | null;
  }>;
}

interface Props {
  projectId: string;
}

export default function PromptExportImport({ projectId }: Props) {
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleExport = async () => {
    try {
      const { data: modules, error } = await supabase
        .from("modules")
        .select("module_number, research_prompt, generation_prompt")
        .eq("project_id", projectId)
        .order("module_number");

      if (error) throw error;

      const exportData: PromptData = {
        version: 1,
        exported_at: new Date().toISOString(),
        modules: modules.map((m) => ({
          module_number: m.module_number,
          research_prompt: m.research_prompt,
          generation_prompt: m.generation_prompt,
        })),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prompts-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Prompts exportados com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao exportar: " + err.message);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const data: PromptData = JSON.parse(text);

      if (!data.version || !Array.isArray(data.modules)) {
        throw new Error("Formato de arquivo inválido");
      }

      // Get existing modules for this project
      const { data: existingModules, error: fetchError } = await supabase
        .from("modules")
        .select("id, module_number")
        .eq("project_id", projectId);

      if (fetchError) throw fetchError;

      // Update each module's prompts
      let updated = 0;
      for (const importedModule of data.modules) {
        const existing = existingModules?.find((m) => m.module_number === importedModule.module_number);
        if (!existing) continue;

        const updateData: Record<string, any> = {};
        if (importedModule.research_prompt !== null) updateData.research_prompt = importedModule.research_prompt;
        if (importedModule.generation_prompt !== null) updateData.generation_prompt = importedModule.generation_prompt;

        if (Object.keys(updateData).length === 0) continue;

        const { error } = await supabase
          .from("modules")
          .update(updateData)
          .eq("id", existing.id);

        if (error) throw error;
        updated++;
      }

      queryClient.invalidateQueries({ queryKey: ["modules", projectId] });
      toast.success(`${updated} módulos atualizados com sucesso!`);
    } catch (err: any) {
      toast.error("Erro ao importar: " + err.message);
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5 h-8 text-xs">
        <Download className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Exportar Prompts</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileRef.current?.click()}
        disabled={importing}
        className="gap-1.5 h-8 text-xs"
      >
        <Upload className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{importing ? "Importando..." : "Importar Prompts"}</span>
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
      />
    </div>
  );
}
