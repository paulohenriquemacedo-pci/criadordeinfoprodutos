import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `Você é o **Consultor Estratégico IA** de uma plataforma avançada de criação de infoprodutos. Você tem acesso a todo o contexto estratégico do projeto do usuário, incluindo módulos M1 a M11.

Seu papel:
1. **Responder perguntas** sobre qualquer aspecto do projeto com profundidade e coerência
2. **Analisar e sugerir melhorias** em qualquer área do planejamento
3. **Criar conteúdo sob demanda** alinhado à estratégia definida
4. **Conectar insights** entre diferentes módulos para maximizar resultados

REGRAS DE CONDUTA:
- Seja direto, profundo e acionável
- Use dados do contexto do projeto para fundamentar suas respostas
- Referencie módulos específicos quando relevante (ex: "conforme definido no M1...")
- Use formatação markdown rica (títulos, listas, negrito, emojis)
- Adapte o tom ao estilo do projeto

IMPORTANTE — SUGESTÃO DE MÓDULO:
Ao final de CADA resposta, adicione um bloco separado com:

---
💡 **Próximo passo recomendado:** [Indique qual módulo (M1-M11) seria mais produtivo o usuário trabalhar agora, com uma breve justificativa de 1-2 frases baseada no que foi discutido]`;

async function callLovableAI(messages: any[], apiKey: string) {
  return await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages,
      stream: true,
    }),
  });
}

async function callGeminiFallback(messages: any[], apiKey: string) {
  const contents = messages
    .filter((m: any) => m.role !== "system")
    .map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const systemInstruction = messages.find((m: any) => m.role === "system");
  const body: any = { contents };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction.content }] };
  }

  return await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, projectContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    const fullMessages = [
      { role: "system", content: `${systemPrompt}\n\n========\nCONTEXTO COMPLETO DO PROJETO:\n${projectContext}` },
      ...messages,
    ];

    let streamResponse: Response | null = null;

    if (LOVABLE_API_KEY) {
      const response = await callLovableAI(fullMessages, LOVABLE_API_KEY);
      if (response.ok) {
        streamResponse = response;
      } else if ((response.status === 402 || response.status === 429) && GEMINI_API_KEY) {
        console.log(`Lovable AI returned ${response.status}, falling back to Gemini`);
      } else {
        const t = await response.text();
        console.error("AI gateway error:", response.status, t);
        if (!GEMINI_API_KEY) {
          return new Response(
            JSON.stringify({ error: response.status === 402 ? "Créditos insuficientes." : "Erro no gateway de IA" }),
            { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    if (!streamResponse) {
      if (!GEMINI_API_KEY) {
        return new Response(
          JSON.stringify({ error: "Nenhuma chave de IA configurada" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const response = await callGeminiFallback(fullMessages, GEMINI_API_KEY);
      if (!response.ok) {
        const t = await response.text();
        console.error("Gemini fallback error:", response.status, t);
        return new Response(
          JSON.stringify({ error: "Erro no gateway de IA (fallback)" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      streamResponse = response;
    }

    return new Response(streamResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("strategic-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
