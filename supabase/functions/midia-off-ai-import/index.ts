import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MidiaOffData {
  mes: string;
  mes_numero: number;
  ano: number;
  marca: string;
  unidade: string;
  localizacao: string;
  tipo_midia: string;
  fornecedor: string;
  valor_midia: number;
  valor_realizado: number;
  valor_producao: number;
  observacoes: string;
  data_veiculacao_inicio?: string;
  data_veiculacao_fim?: string;
  bonificacao: boolean;
}

const SYSTEM_PROMPT = `Você é um assistente especializado em interpretar dados de planilhas de mídia offline (outdoor, rádio, TV, jornal, etc).

Sua tarefa é extrair informações de linhas de uma planilha e mapear para o formato padronizado.

CAMPOS OBRIGATÓRIOS:
- localizacao: endereço ou local do ponto de mídia (rua, cidade, estado)
- tipo_midia: tipo de mídia (Outdoor, Busdoor, Empena, Painéis LED, Rádio, TV, Jornal, Revista, etc)
- valor_midia: valor contratado/orçado da mídia

CAMPOS OPCIONAIS:
- marca: nome da marca/empresa (se disponível na planilha)
- unidade: nome da unidade/filial (se disponível na planilha)
- mes: nome do mês (Janeiro, Fevereiro, etc) - se não encontrar, use o mês atual
- ano: ano (2024, 2025, 2026) - se não encontrar, use o ano atual
- fornecedor: nome do fornecedor/veículo
- valor_realizado: valor efetivamente pago (se não encontrar, use valor_midia)
- valor_producao: custo de produção do material
- observacoes: informações adicionais
- data_veiculacao_inicio: data de início (formato YYYY-MM-DD)
- data_veiculacao_fim: data de fim (formato YYYY-MM-DD)
- bonificacao: se é bonificação/gratuito (true/false)

REGRAS:
1. Se valor estiver em formato brasileiro (1.234,56), converta para número
2. Se houver datas, extraia no formato YYYY-MM-DD
3. Inferir tipo de mídia pelo contexto quando possível
4. Localização deve ser o mais completa possível (endereço + cidade + estado)
5. Se encontrar "bonificação", "gratuito", "bônus", marque bonificacao=true e valor_realizado=0

IMPORTANTE: Retorne APENAS um array JSON válido com os objetos extraídos. Sem explicações adicionais.`;

const SYSTEM_PROMPT_EXTRACT = `Você é um assistente especializado em interpretar dados de planilhas de mídia offline (outdoor, rádio, TV, jornal, etc).

Sua tarefa é extrair informações de linhas de uma planilha e mapear para o formato padronizado, INCLUINDO marca e unidade de cada linha.

CAMPOS OBRIGATÓRIOS:
- marca: nome da marca/empresa (extraia da planilha)
- unidade: nome da unidade/filial (extraia da planilha, use "Geral" se não encontrar)
- localizacao: endereço ou local do ponto de mídia (rua, cidade, estado)
- tipo_midia: tipo de mídia (Outdoor, Busdoor, Empena, Painéis LED, Rádio, TV, Jornal, Revista, etc)
- valor_midia: valor contratado/orçado da mídia

CAMPOS OPCIONAIS:
- mes: nome do mês (Janeiro, Fevereiro, etc) - se não encontrar, use o mês atual
- ano: ano (2024, 2025, 2026) - se não encontrar, use o ano atual
- fornecedor: nome do fornecedor/veículo
- valor_realizado: valor efetivamente pago (se não encontrar, use valor_midia)
- valor_producao: custo de produção do material
- observacoes: informações adicionais
- data_veiculacao_inicio: data de início (formato YYYY-MM-DD)
- data_veiculacao_fim: data de fim (formato YYYY-MM-DD)
- bonificacao: se é bonificação/gratuito (true/false)

REGRAS:
1. Se valor estiver em formato brasileiro (1.234,56), converta para número
2. Se houver datas, extraia no formato YYYY-MM-DD
3. Inferir tipo de mídia pelo contexto quando possível
4. Localização deve ser o mais completa possível (endereço + cidade + estado)
5. Se encontrar "bonificação", "gratuito", "bônus", marque bonificacao=true e valor_realizado=0
6. SEMPRE extraia marca e unidade de cada linha - procure por colunas como "Marca", "Brand", "Empresa", "Unidade", "Filial", "Loja"

IMPORTANTE: Retorne APENAS um array JSON válido com os objetos extraídos. Sem explicações adicionais.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({ error: "Não autorizado. Faça login para continuar." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("Token validation failed:", claimsError?.message);
      return new Response(
        JSON.stringify({ error: "Token inválido ou expirado. Faça login novamente." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log(`Authenticated user: ${userId}`);

    const { rows, marca, unidade, headers, extractFromFile } = await req.json();
    
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhuma linha de dados fornecida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isExtractMode = extractFromFile === true;
    console.log(`Processing ${rows.length} rows, extractFromFile: ${isExtractMode}, marca: ${marca}, unidade: ${unidade}`);
    console.log("Headers detected:", headers);

    // Build context with headers and sample data
    const dataContext = `
CABEÇALHOS DA PLANILHA: ${headers?.join(" | ") || "Não identificados"}

LINHAS DE DADOS (${rows.length} linhas):
${rows.map((row: string[], idx: number) => `[${idx + 1}] ${row.join(" | ")}`).join("\n")}
`;

    let userPrompt: string;
    let systemPrompt: string;

    if (isExtractMode) {
      // Extract marca/unidade from file
      systemPrompt = SYSTEM_PROMPT_EXTRACT;
      userPrompt = `Analise estes dados de mídia offline e extraia as informações no formato JSON.
IMPORTANTE: Extraia a MARCA e UNIDADE de cada linha da planilha.

${dataContext}

Para cada linha válida, retorne um objeto com os campos mapeados, incluindo marca e unidade extraídos da planilha.

Retorne APENAS o array JSON, exemplo:
[{"marca": "Marca X", "unidade": "São Paulo", "localizacao": "Av. Paulista 1000, São Paulo, SP", "tipo_midia": "Outdoor", "valor_midia": 5000, ...}]`;
    } else {
      // Fixed marca/unidade
      systemPrompt = SYSTEM_PROMPT;
      userPrompt = `Analise estes dados de mídia offline e extraia as informações no formato JSON.

${dataContext}

Para cada linha válida, retorne um objeto com os campos mapeados. 
${marca ? `A marca será: "${marca}"` : ""}
A unidade será: "${unidade || 'Geral'}"

Retorne APENAS o array JSON, exemplo:
[{"localizacao": "Av. Paulista 1000, São Paulo, SP", "tipo_midia": "Outdoor", "valor_midia": 5000, ...}]`;
    }

    console.log("Sending request to Lovable AI...");
    
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
          { role: "user", content: userPrompt }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit excedido. Aguarde alguns segundos e tente novamente." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos em Settings > Workspace > Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Erro ao processar com IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";
    
    console.log("AI response received, parsing JSON...");

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    } else {
      // Try to find raw JSON array
      const arrayMatch = content.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        jsonStr = arrayMatch[0];
      }
    }

    let parsedItems: MidiaOffData[];
    try {
      parsedItems = JSON.parse(jsonStr);
      if (!Array.isArray(parsedItems)) {
        parsedItems = [parsedItems];
      }
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      console.error("Raw content:", content);
      return new Response(
        JSON.stringify({ 
          error: "Não foi possível interpretar os dados. Verifique o formato da planilha.",
          rawResponse: content.substring(0, 500)
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate and normalize data
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    const MONTH_NAMES = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const normalizedItems = parsedItems.map((item: any, index: number) => {
      // Determine month
      let mesNumero = currentMonth;
      let mes = MONTH_NAMES[currentMonth - 1];
      
      if (item.mes_numero && item.mes_numero >= 1 && item.mes_numero <= 12) {
        mesNumero = item.mes_numero;
        mes = MONTH_NAMES[mesNumero - 1];
      } else if (item.mes) {
        const monthIndex = MONTH_NAMES.findIndex(m => 
          m.toLowerCase() === item.mes?.toLowerCase()
        );
        if (monthIndex !== -1) {
          mesNumero = monthIndex + 1;
          mes = MONTH_NAMES[monthIndex];
        }
      }

      return {
        mes,
        mes_numero: mesNumero,
        ano: item.ano || currentYear,
        marca: isExtractMode ? (item.marca || "Marca não identificada") : (marca || item.marca || "Marca não identificada"),
        unidade: isExtractMode ? (item.unidade || "Geral") : (unidade || "Geral"),
        localizacao: item.localizacao || item.endereco || item.local || `Local não identificado (linha ${index + 1})`,
        tipo_midia: item.tipo_midia || item.tipo || "Outdoor",
        fornecedor: item.fornecedor || item.veiculo || "",
        valor_midia: parseFloat(item.valor_midia) || parseFloat(item.valor) || 0,
        valor_realizado: item.bonificacao ? 0 : (parseFloat(item.valor_realizado) || parseFloat(item.valor_midia) || parseFloat(item.valor) || 0),
        saving_midia: item.bonificacao ? (parseFloat(item.valor_midia) || 0) : 0,
        valor_producao: parseFloat(item.valor_producao) || 0,
        realizado_producao: parseFloat(item.realizado_producao) || 0,
        saving_producao: 0,
        observacoes: item.observacoes || item.obs || "",
        data_veiculacao_inicio: item.data_veiculacao_inicio || item.data_inicio || null,
        data_veiculacao_fim: item.data_veiculacao_fim || item.data_fim || null,
        bonificacao: item.bonificacao === true || item.bonificacao === "true" || false,
        orcamento_off: parseFloat(item.valor_midia) || parseFloat(item.valor) || 0,
      };
    });

    // Filter out items without valid location
    const validItems = normalizedItems.filter((item: any) => 
      item.localizacao && !item.localizacao.includes("não identificado")
    );

    console.log(`Processed ${normalizedItems.length} items, ${validItems.length} valid`);

    return new Response(
      JSON.stringify({ 
        success: true,
        items: normalizedItems,
        validCount: validItems.length,
        totalCount: normalizedItems.length,
        warnings: normalizedItems.length > validItems.length 
          ? [`${normalizedItems.length - validItems.length} item(s) sem localização identificada`]
          : []
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in midia-off-ai-import:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
