import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useRealAds } from "@/hooks/useRealAdsData";
import { useAds } from "@/hooks/usePlatformAdsData";
import { formatCurrency, getPlatformLabel } from "@/lib/mock-data";
import { TrendingUp, TrendingDown, Image, Sparkles, ExternalLink } from "lucide-react";
import { Platform } from "@/types/platform";
import { CampaignInsightsDialog } from "./CampaignInsightsDialog";

interface TopAdsProps {
  type: "best" | "worst";
  className?: string;
  brandId?: string;
  platform?: Platform;
  onlyActive?: boolean;
}

export function TopAds({ type, className, brandId, platform, onlyActive = false }: TopAdsProps) {
  // Try real ads first, fallback to campaign-simulated ads
  const { data: realAds = [], isLoading: realLoading } = useRealAds(platform, brandId, onlyActive);
  const { data: fallbackAds = [], isLoading: fallbackLoading } = useAds(platform, brandId, onlyActive);
  
  const ads = realAds.length > 0 ? realAds : fallbackAds;
  const isLoading = realLoading && fallbackLoading;
  
  const [selectedAd, setSelectedAd] = useState<any>(null);
  const [insightsOpen, setInsightsOpen] = useState(false);

  // Filter active ads if requested, then sort by CTR and get top 5
  const sortedAds = [...ads]
    .filter((a) => {
      const hasActivity = a.impressions > 0 && a.ctr > 0;
      const isActive = !onlyActive || a.status === "active";
      return hasActivity && isActive;
    })
    .sort((a, b) => (type === "best" ? b.ctr - a.ctr : a.ctr - b.ctr))
    .slice(0, 5);

  const Icon = type === "best" ? TrendingUp : TrendingDown;
  const iconColor = type === "best" ? "text-success" : "text-danger";

  const handleInsightsClick = (ad: any) => {
    setSelectedAd({
      name: ad.name,
      platform: ad.platform,
      spend: ad.spend,
      impressions: ad.impressions,
      clicks: ad.clicks,
      conversions: ad.conversions,
      ctr: ad.ctr,
      roas: ad.spend > 0 ? (ad.conversions * 100) / ad.spend : 0, // Estimate ROAS
      type: 'ad' as const,
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
              {type === "best" ? "Melhores Anúncios" : "Anúncios para Otimizar"}
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
              {type === "best" ? "Melhores Anúncios" : "Anúncios para Otimizar"}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedAds.length > 0 ? (
            sortedAds.map((ad, index) => (
              <div
                key={ad.id}
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  {(ad as any).thumbnail_url ? (
                    <img 
                      src={(ad as any).thumbnail_url} 
                      alt={ad.name}
                      className="h-10 w-10 rounded object-cover border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <span className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium shrink-0",
                    (ad as any).thumbnail_url && "hidden"
                  )}>
                    {index + 1}
                  </span>
                  {(ad as any).thumbnail_url && (
                    <span className="hidden flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium shrink-0">
                      {index + 1}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{ad.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {getPlatformLabel(ad.platform as Platform)} • {formatCurrency(ad.spend)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "font-mono",
                      ad.ctr >= 3 && "bg-success/10 text-success",
                      ad.ctr >= 1.5 && ad.ctr < 3 && "bg-warning/10 text-warning",
                      ad.ctr < 1.5 && "bg-danger/10 text-danger"
                    )}
                  >
                    CTR {ad.ctr.toFixed(2)}%
                  </Badge>
                  {(ad as any).preview_url && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      asChild
                    >
                      <a href={(ad as any).preview_url} target="_blank" rel="noopener noreferrer" title="Ver anúncio">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-7 px-2"
                    onClick={() => handleInsightsClick(ad)}
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Image className="mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Nenhum anúncio {onlyActive ? 'ativo ' : ''}com métricas ainda.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Sincronize dados para ver o ranking.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <CampaignInsightsDialog 
        open={insightsOpen} 
        onOpenChange={setInsightsOpen}
        campaign={selectedAd}
      />
    </>
  );
}
