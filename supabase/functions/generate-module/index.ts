import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function toGeminiModel(model: string): string {
  return model.startsWith("google/") ? model.slice(7) : model;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, pdfParts, model: requestedModel } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY não configurada. Adicione sua chave pessoal do Google Gemini.");

    // Build messages with inline PDF data if available
    const aiMessages = [...messages];
    
    if (pdfParts && pdfParts.length > 0) {
      const lastUserIdx = aiMessages.findLastIndex((m: any) => m.role === "user");
      if (lastUserIdx !== -1) {
        const originalText = aiMessages[lastUserIdx].content;
        const contentParts: any[] = [];
        
        for (const pdf of pdfParts) {
          contentParts.push({
            type: "image_url",
            image_url: {
              url: `data:application/pdf;base64,${pdf.base64}`,
            },
          });
        }
        
        contentParts.push({
          type: "text",
          text: originalText,
        });
        
        aiMessages[lastUserIdx] = {
          role: "user",
          content: contentParts,
        };
      }
    }

    const geminiModel = toGeminiModel(requestedModel || "google/gemini-2.5-pro");
    console.log(`[generate-module] Model: ${geminiModel}, Messages: ${aiMessages.length}`);

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: geminiModel,
        messages: aiMessages,
        max_tokens: 65536,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido na API Gemini. Tente novamente em alguns instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 401 || response.status === 403) {
        return new Response(JSON.stringify({ error: "Chave Gemini inválida ou sem permissão." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("Gemini API error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro na API do Gemini" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stream-through: pass the response body directly but also log finish_reason
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-module error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
