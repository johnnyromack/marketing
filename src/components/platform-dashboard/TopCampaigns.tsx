import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCampaigns } from "@/hooks/usePlatformData";
import { formatCurrency, getPlatformLabel } from "@/lib/mock-data";
import { TrendingUp, TrendingDown, BarChart3, Sparkles } from "lucide-react";
import { Platform } from "@/types/platform";
import { CampaignInsightsDialog } from "./CampaignInsightsDialog";

interface TopCampaignsProps {
  type: "best" | "worst";
  className?: string;
  brandId?: string;
  platform?: Platform;
  onlyActive?: boolean;
}

export function TopCampaigns({ type, className, brandId, platform, onlyActive = false }: TopCampaignsProps) {
  const { data: campaigns = [], isLoading } = useCampaigns(platform, brandId);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [insightsOpen, setInsightsOpen] = useState(false);

  // Filter active campaigns if requested, then sort by CTR and get top 5
  const sortedCampaigns = [...campaigns]
    .filter((c) => {
      const hasActivity = c.impressions > 0 && c.ctr > 0;
      const isActive = !onlyActive || c.status === "active";
      return hasActivity && isActive;
    })
    .sort((a, b) => (type === "best" ? b.ctr - a.ctr : a.ctr - b.ctr))
    .slice(0, 5);

  const Icon = type === "best" ? TrendingUp : TrendingDown;
  const iconColor = type === "best" ? "text-success" : "text-danger";

  const handleInsightsClick = (campaign: any) => {
    setSelectedCampaign({
      name: campaign.name,
      platform: campaign.platform,
      spend: campaign.spend,
      impressions: campaign.impressions,
      clicks: campaign.clicks,
      conversions: campaign.conversions,
      ctr: campaign.ctr,
      roas: campaign.roas,
      objective: campaign.objective,
      type: 'campaign' as const,
    });
    setInsightsOpen(true);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Icon className={cn("h-5 w-5", iconColor)} />
            <CardTitle className="text-base font-semibold">
              {type === "best" ? "Melhores Campanhas" : "Campanhas para Otimizar"}
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
              {type === "best" ? "Melhores Campanhas" : "Campanhas para Otimizar"}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedCampaigns.length > 0 ? (
            sortedCampaigns.map((campaign, index) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium line-clamp-1">{campaign.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {getPlatformLabel(campaign.platform as Platform)} • {formatCurrency(campaign.spend)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "font-mono",
                      campaign.ctr >= 3 && "bg-success/10 text-success",
                      campaign.ctr >= 1.5 && campaign.ctr < 3 && "bg-warning/10 text-warning",
                      campaign.ctr < 1.5 && "bg-danger/10 text-danger"
                    )}
                  >
                    CTR {campaign.ctr.toFixed(2)}%
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-7 px-2"
                    onClick={() => handleInsightsClick(campaign)}
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <BarChart3 className="mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Nenhuma campanha {onlyActive ? 'ativa ' : ''}com métricas ainda.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Envie métricas via webhook para ver o ranking.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <CampaignInsightsDialog 
        open={insightsOpen} 
        onOpenChange={setInsightsOpen}
        campaign={selectedCampaign}
      />
    </>
  );
}
