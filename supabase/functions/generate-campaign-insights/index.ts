import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createAIClient } from "../_shared/ai-provider.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface CampaignData {
  name: string;
  platform: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  roas: number;
  objective?: string;
  type: 'campaign' | 'ad';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { campaign, brand_id } = await req.json() as { campaign: CampaignData; brand_id?: string }

    if (!campaign) {
      return new Response(
        JSON.stringify({ error: 'Campaign data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch brand knowledge if brand_id provided
    let brandContext = "";
    if (brand_id) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: knowledge } = await supabase
          .from("brand_knowledge")
          .select("title, content, source_type")
          .eq("marca_id", brand_id);
        if (knowledge && knowledge.length > 0) {
          brandContext = `\n\n## CONHECIMENTO DA MARCA (use para personalizar os insights):\n${knowledge.map((k: any) => `### ${k.title}\n${k.content}`).join("\n\n")}`;
        }
      } catch (e) {
        console.error("Error fetching brand knowledge:", e);
      }
    }

    const systemPrompt = `Você é um especialista em mídia paga e performance de campanhas digitais. Analise os dados e forneça insights de forma VISUAL e ORGANIZADA usando markdown.
${brandContext ? "\nIMPORTANTE: Você tem acesso ao conhecimento detalhado desta marca. Use essas informações para personalizar suas recomendações de acordo com o público-alvo, a identidade pedagógica, o tom de comunicação e os diferenciais da marca. Sugira headlines, CTAs e estratégias que estejam alinhados com o posicionamento da marca." : ""}

FORMATO OBRIGATÓRIO DE RESPOSTA:

## 📊 Diagnóstico Rápido

| Métrica | Valor | Status |
|---------|-------|--------|
| CTR | X% | 🟢/🟡/🔴 |
| Conversões | X | 🟢/🟡/🔴 |
| Custo/Conversão | R$ X | 🟢/🟡/🔴 |

## 🎯 Recomendações Prioritárias

### 1. [Título da Ação]
**Impacto esperado:** Alto/Médio
- Passo específico 1
- Passo específico 2

### 2. [Título da Ação]
**Impacto esperado:** Alto/Médio
- Passo específico 1
- Passo específico 2

## 💡 Melhorias de Criativo

**Headlines sugeridas:**
- "Exemplo de headline 1"
- "Exemplo de headline 2"

**CTAs mais eficazes:**
- "CTA sugerido 1"
- "CTA sugerido 2"

## ⚡ Ação Imediata

> [Uma única ação prioritária que o gestor deve fazer AGORA]

Use emojis de forma moderada. Seja direto e prático. Forneça números e benchmarks quando possível.${brandContext}`

    const performanceLevel = campaign.ctr >= 2
      ? 'ACIMA da média'
      : campaign.ctr >= 1
        ? 'NA média'
        : 'ABAIXO da média'

    const cpc = campaign.clicks > 0 ? campaign.spend / campaign.clicks : 0
    const costPerConversion = campaign.conversions > 0 ? campaign.spend / campaign.conversions : 0
    const conversionRate = campaign.clicks > 0 ? (campaign.conversions / campaign.clicks) * 100 : 0

    const userMessage = `Analise ${campaign.type === 'ad' ? 'este ANÚNCIO' : 'esta CAMPANHA'} de ${campaign.platform.toUpperCase()}:

📌 **Identificação**
- Nome: ${campaign.name}
- Plataforma: ${campaign.platform}
- Objetivo: ${campaign.objective || 'Não especificado'}
- Tipo: ${campaign.type === 'ad' ? 'Anúncio' : 'Campanha'}

💰 **Métricas Financeiras**
- Investimento: R$ ${campaign.spend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- CPC: R$ ${cpc.toFixed(2)}
- Custo/Conversão: R$ ${costPerConversion.toFixed(2)}

📈 **Métricas de Performance**
- Impressões: ${campaign.impressions.toLocaleString('pt-BR')}
- Cliques: ${campaign.clicks.toLocaleString('pt-BR')}
- CTR: ${campaign.ctr.toFixed(2)}% (${performanceLevel})
- Conversões: ${campaign.conversions.toLocaleString('pt-BR')}
- Taxa de Conversão: ${conversionRate.toFixed(2)}%

Forneça insights VISUAIS e ACIONÁVEIS seguindo o formato estruturado.`

    // Use the unified AI provider
    const { callAI, provider } = await createAIClient();
    console.log(`generate-campaign-insights using provider: ${provider} for: ${campaign.name}`);

    try {
      const insights = await callAI(systemPrompt, userMessage);

      console.log('Insights generated successfully for:', campaign.name);

      return new Response(
        JSON.stringify({
          insights,
          campaign: campaign.name,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (aiError) {
      const errorMsg = aiError instanceof Error ? aiError.message : String(aiError);
      if (errorMsg.includes('429')) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Aguarde alguns segundos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      if (errorMsg.includes('402')) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos na sua conta.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      console.error('AI provider error:', errorMsg);
      throw new Error(`AI API error: ${errorMsg}`);
    }
  } catch (error) {
    console.error('Error generating insights:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Falha ao gerar insights' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
