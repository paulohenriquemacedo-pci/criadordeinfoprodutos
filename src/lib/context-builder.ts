import { supabase } from "@/integrations/supabase/client";

const MODULE_CONFIG_LABELS: Record<number, string> = {
  1: "Briefing Estratégico",
  2: "Estrutura do Produto",
  3: "Copy e VSL",
  4: "Conteúdo Orgânico",
  5: "Criativos de Anúncio",
  6: "E-mail Marketing",
  7: "Funil WhatsApp",
  8: "Funil de Vendas",
  9: "Definição de Oferta",
  10: "Hub Criativo",
  11: "Produção de Conteúdo",
  12: "Consultor Estratégico",
};

export interface PdfPart {
  base64: string;
  fileName: string;
  fileType: string;
}

/**
 * Extracts key decisions from a module's generated content.
 * Looks for "DECISÕES-CHAVE" section and extracts bullet points.
 */
function extractKeyDecisions(content: string, moduleNumber: number): string {
  // Try to find the DECISÕES-CHAVE section
  const decisionsMatch = content.match(/##\s*DECISÕES[- ]CHAVE[^\n]*\n([\s\S]*?)(?=\n##\s|\n---|\n========|$)/i);
  if (decisionsMatch) {
    return `DECISÕES-CHAVE DO MÓDULO ${moduleNumber} (${MODULE_CONFIG_LABELS[moduleNumber]}):\n${decisionsMatch[1].trim()}`;
  }

  // Fallback: extract key data points heuristically
  const keyPatterns = [
    /(?:preço|ticket|precificação)[^.]*?R\$[\s]?[\d.,]+[^.]*/gi,
    /persona[^:]*:\s*([^\n]+)/gi,
    /público[- ]alvo[^:]*:\s*([^\n]+)/gi,
    /posicionamento[^:]*:\s*([^\n]+)/gi,
    /formato[^:]*:\s*([^\n]+)/gi,
    /promessa[^:]*:\s*([^\n]+)/gi,
  ];

  const extracted: string[] = [];
  for (const pattern of keyPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      extracted.push(...matches.slice(0, 2).map(m => m.trim()));
    }
  }

  if (extracted.length > 0) {
    return `DECISÕES EXTRAÍDAS DO MÓDULO ${moduleNumber} (${MODULE_CONFIG_LABELS[moduleNumber]}):\n${extracted.map(e => `- ${e}`).join("\n")}`;
  }

  return "";
}

export async function buildProjectContext(projectId: string, filterModules?: number[]) {
  // Fetch project briefing
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  // Fetch all modules with content
  const { data: modules } = await supabase
    .from("modules")
    .select("*")
    .eq("project_id", projectId)
    .order("module_number");

  // Fetch completed PDF files (for text context fallback)
  const { data: files } = await supabase
    .from("project_files")
    .select("*")
    .eq("project_id", projectId);

  const briefing = project
    ? `BRIEFING DO PROJETO:
Nome: ${project.name}
Nicho: ${project.niche || "Não definido"}
Promessa Principal: ${project.promise || "Não definida"}
Público-Alvo: ${project.target_audience || "Não definido"}`
    : "";

  // Strategic memory (M0) - consolidated decisions from all modules
  const strategicMemory = (project as any)?.strategic_memory;
  const strategicMemoryBlock = strategicMemory
    ? `MEMÓRIA ESTRATÉGICA CONSOLIDADA (M0 — USE COMO REFERÊNCIA OBRIGATÓRIA):
${JSON.stringify(strategicMemory, null, 2)}`
    : "";

  // Build previous outputs with explicit dependency markers
  // Combine research from all engines for each module
  const getModuleResearch = (m: any): string => {
    const parts: string[] = [];
    for (const col of ["research_perplexity", "research_gemini", "research_qwen", "research_result"]) {
      const val = m[col];
      if (val && !parts.includes(val)) parts.push(val);
    }
    return parts.join("\n\n---\n\n");
  };

  const filteredModules = filterModules
    ? (modules || []).filter(m => filterModules.includes(m.module_number))
    : (modules || []);

  const previousOutputs = filteredModules
    .filter((m) => m.generated_content)
    .map((m) => `MÓDULO ${m.module_number} (${MODULE_CONFIG_LABELS[m.module_number] || ""}):\n${m.generated_content}`)
    .join("\n\n---\n\n");

  // Extract key decisions from all completed modules for quick reference
  const keyDecisions = filteredModules
    .filter((m) => m.generated_content)
    .map((m) => extractKeyDecisions(m.generated_content!, m.module_number))
    .filter(Boolean)
    .join("\n\n");

  // Text fallback for files that have extracted text
  const pdfContent = (files || [])
    .filter((f) => f.extracted_text && f.processing_status === "completed")
    .map((f) => `MATERIAL (${f.file_type} - ${f.file_name}):\n${f.extracted_text}`)
    .join("\n\n---\n\n");

  return {
    briefing,
    previousOutputs,
    pdfContent,
    keyDecisions,
    files: files || [],
    fullContext: [
      briefing,
      strategicMemoryBlock,
      keyDecisions && `RESUMO DE DECISÕES ESTRATÉGICAS DOS MÓDULOS ANTERIORES (USE COMO REFERÊNCIA OBRIGATÓRIA):\n${keyDecisions}`,
      previousOutputs && `CONTEÚDO GERADO ANTERIORMENTE:\n${previousOutputs}`,
      pdfContent && `MATERIAIS DE REFERÊNCIA (texto extraído):\n${pdfContent}`,
    ]
      .filter(Boolean)
      .join("\n\n========\n\n"),
  };
}

/**
 * Downloads PDF files from storage and converts them to base64 for inline AI consumption.
 * This gives the AI full fidelity access to the original document.
 */
export async function buildPdfParts(files: Array<{ file_url: string; file_name: string | null; file_type: string }>): Promise<PdfPart[]> {
  const parts: PdfPart[] = [];

  for (const file of files) {
    try {
      // Extract storage path from the public URL
      const urlObj = new URL(file.file_url);
      const pathMatch = urlObj.pathname.match(/\/object\/public\/project-files\/(.+)/);
      if (!pathMatch) continue;

      const storagePath = decodeURIComponent(pathMatch[1]);
      const { data, error } = await supabase.storage
        .from("project-files")
        .download(storagePath);

      if (error || !data) {
        console.warn(`Failed to download ${file.file_name}:`, error);
        continue;
      }

      const arrayBuffer = await data.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      // Convert to base64 in chunks to avoid call stack issues
      let binary = "";
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.slice(i, i + chunkSize));
      }
      const base64 = btoa(binary);

      parts.push({
        base64,
        fileName: file.file_name || "document.pdf",
        fileType: file.file_type,
      });
    } catch (err) {
      console.warn(`Error processing ${file.file_name}:`, err);
    }
  }

  return parts;
}
