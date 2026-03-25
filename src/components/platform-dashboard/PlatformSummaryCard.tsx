import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetaIcon, GoogleAdsIcon, TikTokIcon } from "@/components/icons/PlatformIcons";
import { useCampaigns } from "@/hooks/usePlatformData";
import { formatCurrency, formatNumber } from "@/lib/mock-data";
import { TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { Platform } from "@/types/platform";

interface PlatformSummaryCardProps {
  brandId?: string;
}

interface PlatformMetrics {
  platform: Platform;
  label: string;
  icon: React.ReactNode;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  campaigns: number;
}

export function PlatformSummaryCard({ brandId }: PlatformSummaryCardProps) {
  const { data: campaigns = [], isLoading } = useCampaigns(undefined, brandId);

  const platformData = useMemo(() => {
    const platforms: { platform: Platform; label: string; icon: React.ReactNode }[] = [
      { platform: "meta", label: "Meta Ads", icon: <MetaIcon className="h-5 w-5" /> },
      { platform: "google", label: "Google Ads", icon: <GoogleAdsIcon className="h-5 w-5" /> },
      { platform: "tiktok", label: "TikTok Ads", icon: <TikTokIcon className="h-5 w-5" /> },
    ];

    return platforms.map(({ platform, label, icon }) => {
      const platformCampaigns = campaigns.filter((c) => c.platform === platform);
      const spend = platformCampaigns.reduce((sum, c) => sum + c.spend, 0);
      const impressions = platformCampaigns.reduce((sum, c) => sum + c.impressions, 0);
      const clicks = platformCampaigns.reduce((sum, c) => sum + c.clicks, 0);
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

      return {
        platform,
        label,
        icon,
        spend,
        impressions,
        clicks,
        ctr,
        campaigns: platformCampaigns.length,
      } as PlatformMetrics;
    });
  }, [campaigns]);

  // Calculate total for percentage comparison
  const totalSpend = platformData.reduce((sum, p) => sum + p.spend, 0);

  const getSpendPercentage = (spend: number) => {
    if (totalSpend === 0) return 0;
    return (spend / totalSpend) * 100;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo por Plataforma</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Resumo por Plataforma</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {platformData.map((platform) => {
          const spendPercent = getSpendPercentage(platform.spend);
          const hasData = platform.campaigns > 0;

          return (
            <div key={platform.platform} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {platform.icon}
                  <span className="text-sm font-medium">{platform.label}</span>
                  <Badge variant="secondary" className="text-xs">
                    {platform.campaigns} campanhas
                  </Badge>
                </div>
                <span className="text-sm font-semibold">
                  {formatCurrency(platform.spend)}
                </span>
              </div>

              {/* Progress bar showing spend distribution */}
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    platform.platform === "meta" && "bg-meta",
                    platform.platform === "google" && "bg-google",
                    platform.platform === "tiktok" && "bg-tiktok"
                  )}
                  style={{ width: `${spendPercent}%` }}
                />
              </div>

              {/* Metrics row */}
              {hasData && (
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{formatNumber(platform.impressions)} impressões</span>
                  <span>{formatNumber(platform.clicks)} cliques</span>
                  <span>CTR {platform.ctr.toFixed(2)}%</span>
                  <span className="ml-auto font-medium text-foreground">
                    {spendPercent.toFixed(0)}% do total
                  </span>
                </div>
              )}

              {!hasData && (
                <p className="text-xs text-muted-foreground">Sem dados disponíveis</p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
