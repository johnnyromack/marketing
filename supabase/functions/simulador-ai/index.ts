import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, prompt, currentData, data } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userMessage = "";

    if (type === "simulation") {
      systemPrompt = `Você é um especialista em marketing educacional e mídia paga. Analise a solicitação do usuário e sugira parâmetros otimizados para a simulação de campanhas.

Dados atuais da simulação:
- Orçamento: R$ ${currentData.budget?.toLocaleString("pt-BR")}
- Meta de Matrículas: ${currentData.enrollmentTarget}
- Taxa de Conversão Meta: ${currentData.targetConversionRate}%
- Ticket Médio Anual: R$ ${currentData.averageTicket?.toLocaleString("pt-BR")}
- Faixa CPL: R$ ${currentData.cplRange?.min} - R$ ${currentData.cplRange?.max}
- Faixa CAC: R$ ${currentData.cacRange?.min} - R$ ${currentData.cacRange?.max}

Campanha Anterior:
- Orçamento: R$ ${currentData.previousCampaign?.budget?.toLocaleString("pt-BR")}
- Matrículas: ${currentData.previousCampaign?.enrollments}
- Leads: ${currentData.previousCampaign?.leads}
- Taxa de Conversão: ${currentData.previousCampaign?.conversionRate}%
- CPL: R$ ${currentData.previousCampaign?.cpl}
- CAC: R$ ${currentData.previousCampaign?.cac}

Responda APENAS em formato JSON com os parâmetros sugeridos:
{
  "suggestions": {
    "budget": número,
    "enrollmentTarget": número,
    "targetConversionRate": número,
    "averageTicket": número
  },
  "reasoning": "breve explicação"
}`;
      userMessage = prompt;
    } else if (type === "insights") {
      systemPrompt = `Você é um analista de marketing educacional especializado em campanhas de captação de alunos. Gere insights estratégicos e acionáveis baseados nos dados da simulação.

Retorne APENAS um JSON com array de insights (máximo 5):
{
  "insights": [
    "insight 1",
    "insight 2",
    ...
  ]
}

Cada insight deve:
- Ser conciso (máximo 2 frases)
- Ser acionável e específico
- Relacionar-se com os dados fornecidos
- Incluir números quando relevante`;

      const { brandName, budget, enrollmentTarget, targetConversionRate, averageTicket, previousCampaign, result } = data;
      
      userMessage = `Marca: ${brandName || "Não especificada"}
Orçamento: R$ ${budget?.toLocaleString("pt-BR")}
Meta de Matrículas: ${enrollmentTarget}
Taxa de Conversão Meta: ${targetConversionRate}%
Ticket Médio: R$ ${averageTicket?.toLocaleString("pt-BR")}

Projeções:
- CPL Projetado: R$ ${result?.projectedCPL?.toFixed(2)}
- CAC Projetado: R$ ${result?.projectedCAC?.toFixed(2)}
- Leads Necessários: ${result?.requiredLeads}
- ROI Projetado: ${result?.roi?.toFixed(1)}%
- Faturamento Projetado: R$ ${result?.projectedRevenue?.toLocaleString("pt-BR")}

Campanha Anterior:
- CPL: R$ ${previousCampaign?.cpl}
- CAC: R$ ${previousCampaign?.cac}
- Taxa de Conversão: ${previousCampaign?.conversionRate}%

Variações vs anterior:
- CPL: ${result?.comparison?.cplVariation?.toFixed(1)}%
- CAC: ${result?.comparison?.cacVariation?.toFixed(1)}%
- Leads: ${result?.comparison?.leadsVariation?.toFixed(1)}%`;
    } else {
      throw new Error("Invalid request type");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";

    // Parse JSON response
    let parsedContent;
    try {
      // Extract JSON from response if wrapped in markdown code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                        content.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, content];
      parsedContent = JSON.parse(jsonMatch[1] || content);
    } catch {
      console.error("Failed to parse AI response:", content);
      parsedContent = type === "insights" 
        ? { insights: ["Não foi possível gerar insights neste momento."] }
        : { suggestions: {}, reasoning: "Não foi possível processar a resposta." };
    }

    return new Response(
      JSON.stringify(parsedContent),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in simulador-ai function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
