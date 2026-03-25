import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

interface ReportMetrics {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  avgCtr: number;
  activeCampaigns: number;
  platform: string;
  brand: string;
  period: string;
}

interface ReportInsightsProps {
  metrics: ReportMetrics;
}

export function ReportInsights({ metrics }: ReportInsightsProps) {
  const [insights, setInsights] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const generateInsights = async () => {
    setIsLoading(true);
    setInsights("");

    try {
      const prompt = `Analise os seguintes dados de performance de mídia paga e gere insights acionáveis em formato de bullet points:

**Contexto:**
- Marca: ${metrics.brand}
- Plataforma: ${metrics.platform}
- Período: ${metrics.period}

**Métricas:**
- Investimento total: R$ ${metrics.totalSpend.toLocaleString("pt-BR")}
- Impressões: ${metrics.totalImpressions.toLocaleString("pt-BR")}
- Cliques: ${metrics.totalClicks.toLocaleString("pt-BR")}
- Conversões: ${metrics.totalConversions.toLocaleString("pt-BR")}
- CTR médio: ${metrics.avgCtr.toFixed(2)}%
- Campanhas ativas: ${metrics.activeCampaigns}

Por favor, forneça:
1. 📊 **Análise Geral** - Uma visão resumida da performance
2. ✅ **Pontos Positivos** - O que está funcionando bem (2-3 bullets)
3. ⚠️ **Pontos de Atenção** - O que precisa de melhoria (2-3 bullets)
4. 💡 **Recomendações** - Ações específicas para otimizar (3-4 bullets)
5. 🎯 **Próximos Passos** - Ações imediatas prioritárias (2-3 bullets)

Use linguagem clara, objetiva e formatação markdown com emojis para facilitar a leitura.`;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
            context: {
              platform: metrics.platform,
              campaignsCount: metrics.activeCampaigns,
              totalSpend: metrics.totalSpend,
              totalImpressions: metrics.totalImpressions,
              totalClicks: metrics.totalClicks,
              avgCtr: metrics.avgCtr,
            },
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast.error("Limite de requisições excedido. Tente novamente em alguns segundos.");
          return;
        }
        if (response.status === 402) {
          toast.error("Créditos insuficientes. Adicione créditos na sua conta.");
          return;
        }
        throw new Error("Erro ao gerar insights");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Stream não disponível");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const json = JSON.parse(line.slice(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                fullText += content;
                setInsights(fullText);
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error("Error generating insights:", error);
      toast.error("Erro ao gerar insights. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Insights com IA
            </CardTitle>
            <CardDescription>
              Análise inteligente baseada nos dados do relatório
            </CardDescription>
          </div>
          <Button
            onClick={generateInsights}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : insights ? (
              <>
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Gerar Insights
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {insights ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                ul: ({ children }) => (
                  <ul className="space-y-2 list-none pl-0">{children}</ul>
                ),
                li: ({ children }) => (
                  <li className="flex items-start gap-2 text-sm">
                    <span className="mt-1 text-primary">•</span>
                    <span>{children}</span>
                  </li>
                ),
                h2: ({ children }) => (
                  <h2 className="text-lg font-semibold mt-4 mb-2 text-foreground">{children}</h2>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-foreground">{children}</strong>
                ),
                p: ({ children }) => (
                  <p className="text-muted-foreground mb-3">{children}</p>
                ),
              }}
            >
              {insights}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              Clique em "Gerar Insights" para obter uma análise inteligente dos dados.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
