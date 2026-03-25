import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { formatNumber, formatCurrency } from "@/lib/mock-data";
import ReactMarkdown from "react-markdown";

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

interface CampaignInsightsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: CampaignData | null;
}

export function CampaignInsightsDialog({ open, onOpenChange, campaign }: CampaignInsightsDialogProps) {
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsights = async () => {
    if (!campaign) return;

    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-campaign-insights', {
        body: { campaign }
      });

      if (fnError) throw fnError;
      
      if (data?.error) {
        setError(data.error);
        toast.error(data.error);
        return;
      }

      setInsights(data.insights);
    } catch (err) {
      console.error('Error generating insights:', err);
      const message = 'Erro ao gerar insights. Tente novamente.';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (isOpen && !insights && !isLoading) {
      generateInsights();
    }
    if (!isOpen) {
      setInsights(null);
      setError(null);
    }
  };

  if (!campaign) return null;

  const cpc = campaign.clicks > 0 ? campaign.spend / campaign.clicks : 0;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-ai">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-lg">Insights com IA</span>
              <p className="text-sm font-normal text-muted-foreground">{campaign.name}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Campaign Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="rounded-lg border bg-muted/30 p-3 text-center">
              <p className="text-xs text-muted-foreground">Investimento</p>
              <p className="text-sm font-bold text-primary">{formatCurrency(campaign.spend)}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-center">
              <p className="text-xs text-muted-foreground">Impressões</p>
              <p className="text-sm font-bold">{formatNumber(campaign.impressions)}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-center">
              <p className="text-xs text-muted-foreground">Cliques</p>
              <p className="text-sm font-bold">{formatNumber(campaign.clicks)}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-center">
              <p className="text-xs text-muted-foreground">CTR</p>
              <p className={`text-sm font-bold ${campaign.ctr >= 2 ? 'text-success' : campaign.ctr >= 1 ? 'text-warning' : 'text-destructive'}`}>
                {campaign.ctr.toFixed(2)}%
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-center">
              <p className="text-xs text-muted-foreground">CPC</p>
              <p className="text-sm font-bold">{formatCurrency(cpc)}</p>
            </div>
          </div>

          {/* Insights Content */}
          <div className="mt-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full gradient-ai animate-pulse" />
                  <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-white" />
                </div>
                <p className="mt-4 text-muted-foreground font-medium">Analisando métricas...</p>
                <p className="text-sm text-muted-foreground">Gerando insights personalizados</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-destructive mb-3" />
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={generateInsights} variant="outline">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Tentar novamente
                </Button>
              </div>
            ) : insights ? (
              <ScrollArea className="h-[450px] pr-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      h2: ({ children }) => (
                        <h2 className="text-lg font-bold mt-6 mb-3 pb-2 border-b first:mt-0">{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-base font-semibold mt-4 mb-2">{children}</h3>
                      ),
                      table: ({ children }) => (
                        <div className="my-4 overflow-x-auto">
                          <table className="w-full border-collapse text-sm">{children}</table>
                        </div>
                      ),
                      thead: ({ children }) => (
                        <thead className="bg-muted/50">{children}</thead>
                      ),
                      th: ({ children }) => (
                        <th className="border px-3 py-2 text-left font-medium">{children}</th>
                      ),
                      td: ({ children }) => (
                        <td className="border px-3 py-2">{children}</td>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-primary bg-primary/5 pl-4 py-3 my-4 italic">
                          {children}
                        </blockquote>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc pl-5 space-y-1 my-2">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-5 space-y-1 my-2">{children}</ol>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-foreground">{children}</strong>
                      ),
                      p: ({ children }) => (
                        <p className="my-2 leading-relaxed">{children}</p>
                      ),
                    }}
                  >
                    {insights}
                  </ReactMarkdown>
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Button onClick={generateInsights} className="gradient-ai text-white">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Gerar Insights
                </Button>
              </div>
            )}
          </div>

          {/* Regenerate Button */}
          {insights && !isLoading && (
            <div className="flex justify-end pt-2 border-t">
              <Button 
                variant="outline" 
                size="sm"
                onClick={generateInsights}
                disabled={isLoading}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Regenerar análise
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
