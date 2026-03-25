import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { MetricCard } from "@/components/platform-dashboard/MetricCard";
import { BrandBudgetCard } from "@/components/platform-dashboard/BrandBudgetCard";
import { PlatformChart } from "@/components/platform-dashboard/PlatformChart";
import { TopCampaigns } from "@/components/platform-dashboard/TopCampaigns";
import { TopAds } from "@/components/platform-dashboard/TopAds";
import { TopKeywords } from "@/components/platform-dashboard/TopKeywords";
import { BrandFilter } from "@/components/filters/BrandFilter";
import { PeriodSelector, PeriodPreset, getDateRangeForPreset } from "@/components/filters/PeriodSelector";
import { SingleMetricChart } from "@/components/platform-charts/SingleMetricChart";
import { useDailyMetrics } from "@/hooks/useDailyMetrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MetaIcon, GoogleAdsIcon, TikTokIcon, PlatformLogo } from "@/components/icons/PlatformIcons";
import { usePlatformAccounts, useCampaigns, useBrands, getBrandDisplayName, useCampaignStats } from "@/hooks/usePlatformData";
import { useRealAdStats } from "@/hooks/useRealAdsData";
import { usePeriodMetrics } from "@/hooks/usePeriodMetrics";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/mock-data";
import { Platform } from "@/types/platform";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Eye, MousePointerClick, ShoppingCart, Sparkles, Megaphone, Layers, BarChart3, TrendingUp, TrendingDown, Minus, Loader2, RefreshCw, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { format, subDays } from "date-fns";

const Plataformas = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);

  const getInitialPlatform = (): "all" | Platform => {
    const platformParam = searchParams.get("platform");
    if (platformParam && ["meta", "google", "tiktok"].includes(platformParam)) {
      return platformParam as Platform;
    }
    if (location.pathname === "/meta") return "meta";
    if (location.pathname === "/google") return "google";
    if (location.pathname === "/tiktok") return "tiktok";
    return "all";
  };

  const [selectedPlatform, setSelectedPlatform] = useState<"all" | Platform>(getInitialPlatform());
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("30d");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(getDateRangeForPreset("30d"));

  const handlePeriodChange = (preset: PeriodPreset, range: DateRange) => {
    setPeriodPreset(preset);
    setDateRange(range);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const platformToSync = selectedPlatform === "all" ? "google" : selectedPlatform;
      let functionName = "";
      if (platformToSync === "google") {
        functionName = "sync-google-ads";
      } else if (platformToSync === "meta") {
        functionName = "sync-meta-ads";
      } else {
        toast({
          title: "Sincronizacao nao disponivel",
          description: "A sincronizacao automatica para esta plataforma ainda nao esta configurada.",
          variant: "destructive"
        });
        setIsSyncing(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          sync_type: "manual",
          start_date: dateRange?.from?.toISOString().split("T")[0],
          end_date: dateRange?.to?.toISOString().split("T")[0],
          date_preset: "last_30d"
        }
      });

      if (error) {
        const isTimeout = error.message?.includes("context canceled") || error.message?.includes("timeout");
        if (isTimeout) {
          toast({
            title: "Sincronizacao parcial",
            description: "A sincronizacao demorou mais que o esperado mas os dados processados foram salvos. Execute novamente para completar."
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Sincronizacao concluida!",
          description: data?.message || "Dados atualizados com sucesso."
        });
      }

      queryClient.invalidateQueries({ queryKey: ["platform_accounts"] });
      queryClient.invalidateQueries({ queryKey: ["platform_campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["marcas"] });
      queryClient.invalidateQueries({ queryKey: ["campaign_stats"] });
      queryClient.invalidateQueries({ queryKey: ["real_ads"] });
      queryClient.invalidateQueries({ queryKey: ["real_ad_stats"] });
      queryClient.invalidateQueries({ queryKey: ["platform_ads"] });
      queryClient.invalidateQueries({ queryKey: ["brand_daily_spending"] });
      queryClient.invalidateQueries({ queryKey: ["account_daily_spending"] });
    } catch (error: any) {
      console.error("Sync error:", error);
      toast({
        title: "Erro na sincronizacao",
        description: error.message || "Nao foi possivel sincronizar os dados.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const platformFilter = selectedPlatform === "all" ? undefined : selectedPlatform;
  const brandFilter = selectedBrand === "all" ? undefined : selectedBrand;
  const isAllPeriod = periodPreset === "all";
  const fromDate = !isAllPeriod && dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined;
  const toDate = !isAllPeriod && dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined;

  const { data: accounts = [], isLoading: accountsLoading } = usePlatformAccounts(platformFilter);
  const { data: campaigns = [], isLoading: campaignsLoading } = useCampaigns(platformFilter, brandFilter);
  const { data: brands = [] } = useBrands();
  const { data: campaignStats } = useCampaignStats(platformFilter, brandFilter, fromDate, toDate);
  const { data: adStats } = useRealAdStats(platformFilter, brandFilter, fromDate, toDate);
  const { data: periodMetrics } = usePeriodMetrics(dateRange, brandFilter, platformFilter);
  const { data: dailyMetrics } = useDailyMetrics(dateRange, brandFilter, platformFilter);
  const isLoading = accountsLoading || campaignsLoading;

  useEffect(() => {
    setSelectedPlatform(getInitialPlatform());
  }, [searchParams, location.pathname]);

  const handlePlatformChange = (platform: "all" | Platform) => {
    setSelectedPlatform(platform);
    if (platform === "all") {
      searchParams.delete("platform");
    } else {
      searchParams.set("platform", platform);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const filteredAccounts = useMemo(() => {
    if (selectedBrand === "all") return accounts;
    const brandIds = selectedBrand.split(",");
    return accounts.filter(a => a.marca_id && brandIds.includes(a.marca_id));
  }, [accounts, selectedBrand]);

  const filteredCampaigns = useMemo(() => {
    const activeCampaigns = campaigns.filter(c => c.status === "active");
    if (selectedBrand === "all") return activeCampaigns;
    const brandIds = selectedBrand.split(",");
    return activeCampaigns.filter(c => c.marca_id && brandIds.includes(c.marca_id));
  }, [campaigns, selectedBrand]);

  const allFilteredCampaigns = useMemo(() => {
    if (selectedBrand === "all") return campaigns;
    const brandIds = selectedBrand.split(",");
    return campaigns.filter(c => c.marca_id && brandIds.includes(c.marca_id));
  }, [campaigns, selectedBrand]);

  const metrics = useMemo(() => {
    const spend = allFilteredCampaigns.reduce((sum, c) => sum + c.spend, 0);
    const impressions = allFilteredCampaigns.reduce((sum, c) => sum + c.impressions, 0);
    const clicks = allFilteredCampaigns.reduce((sum, c) => sum + c.clicks, 0);
    const conversions = allFilteredCampaigns.reduce((sum, c) => sum + c.conversions, 0);
    const roas = allFilteredCampaigns.length > 0 ? allFilteredCampaigns.reduce((sum, c) => sum + c.roas, 0) / allFilteredCampaigns.length : 0;
    return {
      totalSpend: spend,
      totalImpressions: impressions,
      totalClicks: clicks,
      totalConversions: conversions,
      avgRoas: roas,
      activeCampaigns: campaignStats?.active || filteredCampaigns.length,
      activeAds: adStats?.active || 0
    };
  }, [allFilteredCampaigns, filteredCampaigns, campaignStats, adStats]);

  const brandBudgetData = useMemo(() => {
    const relevantBrands = selectedBrand === "all"
      ? brands.filter(b => b.is_active && ((b.manual_balance || 0) > 0 || (b.daily_budget || 0) > 0))
      : brands.filter(b => b.id === selectedBrand);
    return relevantBrands.map(brand => {
      const brandCampaigns = campaigns.filter(c => c.marca_id === brand.id);
      const totalSpend = brandCampaigns.reduce((sum, c) => sum + c.spend, 0);
      const todaySpend = totalSpend > 0 ? totalSpend / 7 : 0;
      const manualBalance = brand.manual_balance || 0;
      const dailyBudget = brand.daily_budget || 0;
      const daysRemaining = dailyBudget > 0 ? Math.floor(manualBalance / dailyBudget) : 999;
      return {
        id: brand.id,
        name: getBrandDisplayName(brand),
        manualBalance,
        dailyBudget,
        todaySpend,
        daysRemaining
      };
    });
  }, [brands, campaigns, selectedBrand]);

  const getPlatformTitle = () => {
    switch (selectedPlatform) {
      case "meta": return "Meta Ads";
      case "google": return "Google Ads";
      case "tiktok": return "TikTok Ads";
      default: return "Todas as Plataformas";
    }
  };

  const getPlatformSubtitle = () => {
    switch (selectedPlatform) {
      case "meta": return "Facebook e Instagram";
      case "google": return "Search, Display e YouTube";
      case "tiktok": return "Videos e In-Feed";
      default: return "Visao consolidada de todas as plataformas";
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case "active": return "Ativa";
      case "paused": return "Pausada";
      case "completed": return "Finalizada";
      case "archived": return "Arquivada";
      default: return status || "Desconhecido";
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              {selectedPlatform === "all" ? <BarChart3 className="h-6 w-6 text-primary" /> : <PlatformLogo platform={selectedPlatform} size={24} showBackground={false} />}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{getPlatformTitle()}</h1>
              <p className="text-muted-foreground">
                {getPlatformSubtitle()} - {campaignStats?.total || campaigns.length} campanhas ({campaignStats?.active || filteredCampaigns.length} ativas)
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" size="sm" onClick={handleManualSync} disabled={isSyncing} className="gap-2">
              <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
              {isSyncing ? "Sincronizando..." : "Sincronizar"}
            </Button>
            <PeriodSelector value={periodPreset} onChange={handlePeriodChange} />
            <BrandFilter value={selectedBrand} onChange={setSelectedBrand} />
          </div>
        </div>

        {/* Platform Tabs */}
        <Tabs value={selectedPlatform} onValueChange={v => handlePlatformChange(v as "all" | Platform)}>
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="all" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Todas</span>
            </TabsTrigger>
            <TabsTrigger value="meta" className="gap-2">
              <MetaIcon size={16} className="text-meta" />
              <span className="hidden sm:inline">Meta</span>
            </TabsTrigger>
            <TabsTrigger value="google" className="gap-2">
              <GoogleAdsIcon size={16} />
              <span className="hidden sm:inline">Google</span>
            </TabsTrigger>
            <TabsTrigger value="tiktok" className="gap-2">
              <TikTokIcon size={16} />
              <span className="hidden sm:inline">TikTok</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Carregando dados...</span>
          </div>
        ) : (
          <>
            {/* Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <MetricCard title="Campanhas Ativas" value={formatNumber(metrics.activeCampaigns)} icon={<Megaphone className="h-5 w-5" />} />
              <MetricCard title="Anuncios Ativos" value={formatNumber(metrics.activeAds)} icon={<Image className="h-5 w-5" />} />
              <MetricCard title="Investimento" value={formatCurrency(periodMetrics?.current.spend || 0)} change={periodMetrics?.changes.spend} icon={<DollarSign className="h-5 w-5" />} />
              <MetricCard title="Impressoes" value={formatNumber(periodMetrics?.current.impressions || 0)} change={periodMetrics?.changes.impressions} icon={<Eye className="h-5 w-5" />} />
              <MetricCard title="Cliques" value={formatNumber(periodMetrics?.current.clicks || 0)} change={periodMetrics?.changes.clicks} icon={<MousePointerClick className="h-5 w-5" />} />
              <MetricCard title="Conversoes" value={formatNumber(periodMetrics?.current.conversions || 0)} change={periodMetrics?.changes.conversions} icon={<ShoppingCart className="h-5 w-5" />} />
            </div>

            {/* Evolution Charts */}
            <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
              <SingleMetricChart metric="impressions" currentData={dailyMetrics?.current || []} previousData={dailyMetrics?.previous || []} />
              <SingleMetricChart metric="clicks" currentData={dailyMetrics?.current || []} previousData={dailyMetrics?.previous || []} />
              <SingleMetricChart metric="ctr" currentData={dailyMetrics?.current || []} previousData={dailyMetrics?.previous || []} />
            </div>

            {/* Platform Performance & Top Campaigns */}
            {selectedPlatform === "all" && (
              <div className="grid gap-6 lg:grid-cols-3">
                <PlatformChart brandId={selectedBrand === "all" ? undefined : selectedBrand} />
                <TopCampaigns type="best" brandId={selectedBrand === "all" ? undefined : selectedBrand} onlyActive />
                <TopCampaigns type="worst" brandId={selectedBrand === "all" ? undefined : selectedBrand} onlyActive />
              </div>
            )}

            {selectedPlatform !== "all" && (
              <div className="grid gap-6 md:grid-cols-2">
                <TopCampaigns type="best" platform={selectedPlatform} brandId={selectedBrand === "all" ? undefined : selectedBrand} onlyActive />
                <TopCampaigns type="worst" platform={selectedPlatform} brandId={selectedBrand === "all" ? undefined : selectedBrand} onlyActive />
              </div>
            )}

            {/* Top Ads */}
            <div className="grid gap-6 md:grid-cols-2">
              <TopAds type="best" platform={platformFilter} brandId={selectedBrand === "all" ? undefined : selectedBrand} onlyActive />
              <TopAds type="worst" platform={platformFilter} brandId={selectedBrand === "all" ? undefined : selectedBrand} onlyActive />
            </div>

            {/* Top Keywords - Google Only */}
            {selectedPlatform === "google" && (
              <div className="grid gap-6 md:grid-cols-2">
                <TopKeywords type="best" brandId={selectedBrand === "all" ? undefined : selectedBrand} onlyActive />
                <TopKeywords type="worst" brandId={selectedBrand === "all" ? undefined : selectedBrand} onlyActive />
              </div>
            )}

            {/* Brand Budgets */}
            {brandBudgetData.length > 0 && (
              <div>
                <h2 className="mb-4 text-lg font-semibold">Orcamentos por Marca</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {brandBudgetData.map(brand => (
                    <BrandBudgetCard key={brand.id} brandName={brand.name} manualBalance={brand.manualBalance} dailyBudget={brand.dailyBudget} todaySpend={brand.todaySpend} daysRemaining={brand.daysRemaining} />
                  ))}
                </div>
              </div>
            )}

            {/* Campaigns Table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Campanhas</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredCampaigns.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campanha</TableHead>
                        <TableHead>Plataforma</TableHead>
                        <TableHead>Marca</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Gasto</TableHead>
                        <TableHead className="text-right">Impressoes</TableHead>
                        <TableHead className="text-right">CTR</TableHead>
                        <TableHead className="text-right">Acoes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCampaigns.map(campaign => (
                        <TableRow key={campaign.id}>
                          <TableCell className="font-medium">{campaign.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {campaign.platform !== "unknown" && <PlatformLogo platform={campaign.platform as Platform} size={16} showBackground={false} />}
                              <span className="capitalize">{campaign.platform}</span>
                            </div>
                          </TableCell>
                          <TableCell>{campaign.brand_name || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={cn(
                              campaign.status === "active" && "bg-success/10 text-success",
                              campaign.status === "paused" && "bg-warning/10 text-warning",
                              campaign.status === "completed" && "bg-muted text-muted-foreground",
                              campaign.status === "archived" && "bg-muted text-muted-foreground"
                            )}>
                              {getStatusLabel(campaign.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(campaign.spend)}</TableCell>
                          <TableCell className="text-right">{formatNumber(campaign.impressions)}</TableCell>
                          <TableCell className="text-right">{formatPercentage(campaign.ctr)}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost" className="gap-1">
                              <Sparkles className="h-4 w-4" />
                              Analisar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <BarChart3 className="mb-4 h-12 w-12 text-muted-foreground/50" />
                    <p className="text-muted-foreground">Nenhuma campanha encontrada com os filtros selecionados.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Plataformas;
