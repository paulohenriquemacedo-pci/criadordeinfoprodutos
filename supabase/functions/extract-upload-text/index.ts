import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { extractText, getDocumentProxy } from "https://esm.sh/unpdf@0.12.1";
import { PDFDocument } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PAGES_PER_BATCH = 12;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function geminiExtract(pdfBytes: Uint8Array, fileName: string, apiKey: string): Promise<string> {
  const dataUrl = `data:application/pdf;base64,${bytesToBase64(pdfBytes)}`;
  const resp = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gemini-2.5-flash",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: `Extraia TODO o texto deste trecho do documento (${fileName}). Retorne apenas o texto puro, preservando a ordem e estrutura. Sem comentários.` },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      }],
    }),
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Gemini ${resp.status}: ${errText.slice(0, 300)}`);
  }
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "";
}

async function extractPdfNative(bytes: Uint8Array): Promise<string> {
  try {
    const pdf = await getDocumentProxy(bytes);
    const { text } = await extractText(pdf, { mergePages: true });
    return typeof text === "string" ? text : (text as string[]).join("\n\n");
  } catch (e) {
    console.warn("Native PDF extraction failed:", e);
    return "";
  }
}

async function extractPdfWithGeminiBatched(bytes: Uint8Array, fileName: string, apiKey: string): Promise<string> {
  const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const total = srcDoc.getPageCount();
  const parts: string[] = [];

  for (let start = 0; start < total; start += PAGES_PER_BATCH) {
    const end = Math.min(start + PAGES_PER_BATCH, total);
    const batchDoc = await PDFDocument.create();
    const indices = Array.from({ length: end - start }, (_, i) => start + i);
    const copied = await batchDoc.copyPages(srcDoc, indices);
    copied.forEach((p) => batchDoc.addPage(p));
    const batchBytes = await batchDoc.save();
    console.log(`Gemini OCR batch ${start + 1}-${end} of ${total}`);
    const text = await geminiExtract(batchBytes, `${fileName} [págs ${start + 1}-${end}]`, apiKey);
    parts.push(text);
  }

  return parts.join("\n\n");
}

function looksGoodEnough(text: string, pageCount?: number): boolean {
  const letters = (text.match(/[a-zA-ZÀ-ÿ]/g) || []).length;
  const minLetters = pageCount ? Math.min(200, pageCount * 30) : 200;
  return text.length > 400 && letters > minLetters;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { base64, storagePath, fileName, mimeType } = body as {
      base64?: string;
      storagePath?: string;
      fileName?: string;
      mimeType?: string;
    };

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY não configurada.");

    // 1) Get the file bytes (storage preferred for large files)
    let bytes: Uint8Array | null = null;
    if (storagePath) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const { data, error } = await supabase.storage.from("project-files").download(storagePath);
      if (error || !data) throw new Error(`Falha ao baixar do storage: ${error?.message || "sem dados"}`);
      bytes = new Uint8Array(await data.arrayBuffer());
    } else if (base64) {
      bytes = base64ToBytes(base64);
    } else {
      throw new Error("Nenhum arquivo enviado (base64 ou storagePath ausente)");
    }

    const isPdf = (mimeType || "").includes("pdf") || (fileName || "").toLowerCase().endsWith(".pdf");
    let extractedText = "";
    let method = "";

    if (isPdf) {
      // 2a) Try native text extraction first (fast, free, works on real text PDFs)
      const native = await extractPdfNative(bytes);
      let pageCount: number | undefined;
      try {
        const probe = await PDFDocument.load(bytes, { ignoreEncryption: true });
        pageCount = probe.getPageCount();
      } catch { /* ignore */ }

      if (looksGoodEnough(native, pageCount)) {
        extractedText = native;
        method = "native";
      } else {
        // 2b) Fallback to Gemini OCR in batches
        extractedText = await extractPdfWithGeminiBatched(bytes, fileName || "documento.pdf", GEMINI_API_KEY);
        method = "gemini-batched";
      }
    } else {
      // Non-PDF binary (docx/xlsx): single Gemini call
      const dataUrl = `data:${mimeType || "application/octet-stream"};base64,${bytesToBase64(bytes)}`;
      const aiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gemini-2.5-flash",
          messages: [{
            role: "user",
            content: [
              { type: "text", text: `Extraia todo o texto deste documento (${fileName || "documento"}). Retorne apenas o texto puro. Se for planilha, formate como tabela legível.` },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          }],
        }),
      });
      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        throw new Error(`Gemini ${aiResponse.status}: ${errText.slice(0, 300)}`);
      }
      const aiData = await aiResponse.json();
      extractedText = aiData.choices?.[0]?.message?.content || "";
      method = "gemini-single";
    }

    console.log(`Extraction done: ${method}, chars=${extractedText.length}`);

    return new Response(JSON.stringify({ text: extractedText, method }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-upload-text error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
