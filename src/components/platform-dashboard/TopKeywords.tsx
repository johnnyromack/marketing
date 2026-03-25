import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useKeywords } from "@/hooks/useKeywordsData";
import { formatCurrency } from "@/lib/mock-data";
import { TrendingUp, TrendingDown, Search, Sparkles } from "lucide-react";
import { CampaignInsightsDialog } from "./CampaignInsightsDialog";

interface TopKeywordsProps {
  type: "best" | "worst";
  className?: string;
  brandId?: string;
  onlyActive?: boolean;
}

export function TopKeywords({ type, className, brandId, onlyActive = false }: TopKeywordsProps) {
  const { data: keywords = [], isLoading } = useKeywords(brandId, onlyActive);
  const [selectedKeyword, setSelectedKeyword] = useState<any>(null);
  const [insightsOpen, setInsightsOpen] = useState(false);

  // Filter keywords with activity, then sort by CTR and get top 5
  const sortedKeywords = [...keywords]
    .filter((k) => k.impressions > 0 && k.ctr > 0)
    .sort((a, b) => (type === "best" ? b.ctr - a.ctr : a.ctr - b.ctr))
    .slice(0, 5);

  const Icon = type === "best" ? TrendingUp : TrendingDown;
  const iconColor = type === "best" ? "text-success" : "text-danger";

  const handleInsightsClick = (kw: any) => {
    setSelectedKeyword({
      name: kw.keyword_text,
      platform: "google",
      spend: kw.spend,
      impressions: kw.impressions,
      clicks: kw.clicks,
      conversions: kw.conversions,
      ctr: kw.ctr,
      roas: kw.spend > 0 ? (kw.conversions * 100) / kw.spend : 0,
      type: 'keyword' as const,
      objective: `Match Type: ${kw.match_type}`,
    });
    setInsightsOpen(true);
  };

  const getMatchTypeBadge = (matchType: string) => {
    const types: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      EXACT: { label: "Exata", variant: "default" },
      PHRASE: { label: "Frase", variant: "secondary" },
      BROAD: { label: "Ampla", variant: "outline" },
    };
    return types[matchType] || { label: matchType, variant: "outline" as const };
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Icon className={cn("h-5 w-5", iconColor)} />
            <CardTitle className="text-base font-semibold">
              {type === "best" ? "Melhores Palavras-chave" : "Palavras-chave para Otimizar"}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-6 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Icon className={cn("h-5 w-5", iconColor)} />
            <CardTitle className="text-base font-semibold">
              {type === "best" ? "Melhores Palavras-chave" : "Palavras-chave para Otimizar"}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedKeywords.length > 0 ? (
            sortedKeywords.map((kw, index) => {
              const matchBadge = getMatchTypeBadge(kw.match_type);
              return (
                <div
                  key={kw.id}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium line-clamp-1">{kw.keyword_text}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant={matchBadge.variant} className="text-[10px] h-4 px-1">
                          {matchBadge.label}
                        </Badge>
                        <span>{formatCurrency(kw.spend)}</span>
                        {kw.quality_score && (
                          <span className="text-primary">QS: {kw.quality_score}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "font-mono",
                        kw.ctr >= 5 && "bg-success/10 text-success",
                        kw.ctr >= 2 && kw.ctr < 5 && "bg-warning/10 text-warning",
                        kw.ctr < 2 && "bg-danger/10 text-danger"
                      )}
                    >
                      CTR {kw.ctr.toFixed(2)}%
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      onClick={() => handleInsightsClick(kw)}
                    >
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Search className="mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Nenhuma palavra-chave com métricas ainda.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Sincronize dados do Google Ads para ver o ranking.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <CampaignInsightsDialog
        open={insightsOpen}
        onOpenChange={setInsightsOpen}
        campaign={selectedKeyword}
      />
    </>
  );
}
