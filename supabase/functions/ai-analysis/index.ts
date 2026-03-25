import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.0";
import { createAIClient } from "../_shared/ai-provider.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido ou expirado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { messages, dashboardData, analysisType } = await req.json();

    if (messages && !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Formato de mensagens inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (messages && messages.length > 50) {
      return new Response(
        JSON.stringify({ error: 'Limite de mensagens excedido (máx. 50)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build system prompt based on analysis type
    let systemPrompt = `Você é um analista de marketing digital especializado em análise de dados de campanhas publicitárias.
Seu papel é analisar os dados fornecidos e fornecer insights acionáveis, detectar anomalias e sugerir melhorias.

Diretrizes:
- Seja objetivo e direto
- Use dados concretos para embasar suas análises
- Destaque anomalias (valores fora do padrão)
- Sugira ações práticas de melhoria
- Formate suas respostas com markdown para melhor legibilidade
- Use emojis relevantes para destacar pontos importantes
- Valores monetários devem usar formato brasileiro (R$ X.XXX,XX)`;

    if (analysisType === 'publicidade') {
      systemPrompt += `

Você está analisando dados de publicidade com as seguintes métricas:
- Leads: quantidade de leads gerados
- Matrículas: conversões finais
- Investimento: valores gastos em diferentes canais (Meta, Google, eventos, mídia off)
- CPL (Custo por Lead): investimento / leads
- CAC (Custo de Aquisição de Cliente): investimento / matrículas

Foque em:
1. Eficiência de cada canal de investimento
2. Tendências de leads e matrículas ao longo do tempo
3. Comparação entre marcas/unidades
4. Anomalias em custos ou conversões`;
    } else if (analysisType === 'midia') {
      systemPrompt += `

Você está analisando dados de mídia e orçamento com as seguintes métricas:
- Mídia On: investimentos em canais digitais
- Mídia Off: investimentos em mídia tradicional (outdoor, rádio, etc)
- Eventos: custos com eventos promocionais
- Brindes: custos com materiais promocionais
- Orçado vs Realizado: comparação entre planejamento e execução

Foque em:
1. Aderência ao orçamento planejado
2. Eficiência de cada tipo de mídia
3. Distribuição de investimento por marca
4. Oportunidades de saving e otimização`;
    }

    const apiMessages: { role: string; content: string }[] = [
      { role: 'system', content: systemPrompt },
    ];

    if (dashboardData) {
      apiMessages.push({
        role: 'user',
        content: `Aqui estão os dados atuais do dashboard para sua análise:\n\n${JSON.stringify(dashboardData, null, 2)}`
      });
      apiMessages.push({
        role: 'assistant',
        content: 'Recebi os dados do dashboard. Estou pronto para analisá-los. Como posso ajudar?'
      });
    }

    if (messages && messages.length > 0) {
      apiMessages.push(...messages);
    }

    // Use the unified AI provider
    const { callAIStream, provider } = await createAIClient();
    console.log(`ai-analysis using provider: ${provider}`);

    try {
      const streamResponse = await callAIStream(apiMessages);

      return new Response(streamResponse.body, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      });
    } catch (aiError) {
      const errorMsg = aiError instanceof Error ? aiError.message : String(aiError);
      if (errorMsg.includes('429')) {
        return new Response(JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns instantes.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (errorMsg.includes('402')) {
        return new Response(JSON.stringify({ error: 'Créditos de IA esgotados. Adicione créditos ao workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      console.error('AI provider error:', errorMsg);
      return new Response(JSON.stringify({ error: 'Erro no serviço de IA' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in ai-analysis function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
