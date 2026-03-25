import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createAIClient } from "../_shared/ai-provider.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface RequestBody {
  messages: Message[];
  context?: {
    platform?: string;
    campaignsCount?: number;
    totalSpend?: number;
    totalImpressions?: number;
    totalClicks?: number;
    avgCtr?: number;
    brandId?: string;
    brandName?: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json() as RequestBody;

    // Build context-aware system prompt
    let systemPrompt = `Você é um assistente especialista em mídia paga e performance de campanhas digitais. Você ajuda gestores de tráfego a otimizar suas campanhas no Meta Ads, Google Ads e TikTok Ads.

Suas capacidades:
- Analisar métricas de performance (CTR, CPC, ROAS, conversões)
- Identificar oportunidades de otimização
- Sugerir melhorias técnicas e de copy/criativo
- Comparar performance entre plataformas
- Recomendar estratégias de budget e lance

Responda de forma clara, objetiva e acionável. Use formatação markdown quando apropriado para organizar as informações.`;

    if (context) {
      systemPrompt += `\n\nContexto atual do usuário:
- Plataforma visualizada: ${context.platform || 'todas'}
- Campanhas ativas: ${context.campaignsCount || 0}
- Investimento total: R$ ${context.totalSpend?.toLocaleString('pt-BR') || '0'}
- Impressões totais: ${context.totalImpressions?.toLocaleString('pt-BR') || '0'}
- Cliques totais: ${context.totalClicks?.toLocaleString('pt-BR') || '0'}
- CTR médio: ${context.avgCtr?.toFixed(2) || '0'}%`;

      // Fetch brand knowledge if brandId provided
      if (context.brandId) {
        try {
          const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
          const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
          const supabase = createClient(supabaseUrl, supabaseKey);
          const { data: knowledge } = await supabase
            .from("brand_knowledge")
            .select("title, content")
            .eq("marca_id", context.brandId);
          if (knowledge && knowledge.length > 0) {
            systemPrompt += `\n\n## Conhecimento da marca "${context.brandName || ''}":\n${knowledge.map((k: any) => `### ${k.title}\n${k.content}`).join("\n\n")}`;
            systemPrompt += `\n\nUse este conhecimento para personalizar suas respostas de acordo com a identidade, público-alvo e tom de comunicação da marca.`;
          }
        } catch (e) {
          console.error("Error fetching brand knowledge:", e);
        }
      }
    }

    // Use the unified AI provider
    const { callAIStream, provider } = await createAIClient();
    console.log(`ai-chat using provider: ${provider}, messages: ${messages.length}`);

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    try {
      const streamResponse = await callAIStream(apiMessages);

      return new Response(streamResponse.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    } catch (aiError) {
      const errorMsg = aiError instanceof Error ? aiError.message : String(aiError);
      if (errorMsg.includes("429")) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (errorMsg.includes("402")) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos na sua conta Lovable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = aiError instanceof Error ? aiError.message : "Unknown error";
      console.error("AI provider error:", errorText);
      return new Response(JSON.stringify({ error: "Erro ao processar sua solicitação." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("AI chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
