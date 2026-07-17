import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, pdfParts, model: requestedModel, provider } = await req.json();

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

    // Determine provider and model
    const p = (provider || "gemini").toLowerCase();
    let apiKey = "";
    let apiUrl = "";
    let activeModel = requestedModel;

    if (p === "groq") {
      apiKey = Deno.env.get("GROQ_API_KEY") || "";
      apiUrl = "https://api.groq.com/openai/v1/chat/completions";
      if (!apiKey) throw new Error("Chave GROQ_API_KEY não configurada no Supabase.");
      if (!activeModel || activeModel.includes("gemini")) activeModel = "llama-3.3-70b-versatile";
    } else if (p === "openrouter") {
      apiKey = Deno.env.get("OPENROUTER_API_KEY") || "";
      apiUrl = "https://openrouter.ai/api/v1/chat/completions";
      if (!apiKey) throw new Error("Chave OPENROUTER_API_KEY não configurada no Supabase.");
      if (!activeModel || activeModel.includes("gemini")) {
        activeModel = "anthropic/claude-3.5-sonnet:beta";
      }
    } else if (p === "perplexity") {
      apiKey = Deno.env.get("PERPLEXITY_API_KEY") || "";
      if (!apiKey) {
        apiKey = Deno.env.get("OPENROUTER_API_KEY") || "";
      }
      if (!apiKey) throw new Error("Chave de API para Perplexity (ou OpenRouter) não configurada no Supabase.");

      if (apiKey.startsWith("sk-or-v1")) {
        apiUrl = "https://openrouter.ai/api/v1/chat/completions";
        if (!activeModel || activeModel.includes("gemini")) {
          activeModel = "perplexity/sonar-pro";
        } else if (!activeModel.startsWith("perplexity/")) {
          activeModel = `perplexity/${activeModel}`;
        }
      } else {
        apiUrl = "https://api.perplexity.ai/chat/completions";
        if (!activeModel || activeModel.includes("gemini")) {
          activeModel = "sonar-pro";
        }
      }
    } else {
      // Default: Gemini
      apiKey = Deno.env.get("GEMINI_API_KEY") || "";
      apiUrl = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
      if (!apiKey) throw new Error("Chave GEMINI_API_KEY não configurada no Supabase.");
      
      // Clean model name for Google API
      if (activeModel) {
        if (activeModel.startsWith("google/")) {
          activeModel = activeModel.slice(7);
        }
      } else {
        activeModel = "gemini-2.5-flash";
      }
    }

    console.log(`[generate-module] Provider: ${p}, Model: ${activeModel}, Messages: ${aiMessages.length}`);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: activeModel,
        messages: aiMessages,
        max_tokens: p === "gemini" ? 65536 : 8192,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Erro na API (${p}):`, response.status, errText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: `Limite de requisições excedido na API (${p}). Tente novamente em alguns instantes.` }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: `Erro na API (${p}): ${errText}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      },
    });
  } catch (e) {
    console.error("generate-module error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
