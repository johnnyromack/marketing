import { useState, useMemo } from "react";
import { subDays } from "date-fns";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandFilter } from "@/components/filters/BrandFilter";
import { PlatformFilter } from "@/components/filters/PlatformFilter";
import { PeriodFilter, PeriodType } from "@/components/filters/PeriodFilter";
import { ReportCharts } from "@/components/reports/ReportCharts";
import { ReportSummaryCards } from "@/components/reports/ReportSummaryCards";
import { ReportInsights } from "@/components/reports/ReportInsights";
import { useBrands, getBrandDisplayName } from "@/hooks/usePlatformData";
import { useDailyMetrics } from "@/hooks/useDailyMetrics";
import { usePeriodMetrics } from "@/hooks/usePeriodMetrics";
import { FileBarChart, Loader2 } from "lucide-react";

const Relatorios = () => {
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [period, setPeriod] = useState<PeriodType>("weekly");

  const { data: brands = [] } = useBrands();

  const dateRange = useMemo(() => {
    const to = new Date();
    const days = period === "weekly" ? 7 : period === "biweekly" ? 15 : 30;
    return { from: subDays(to, days - 1), to };
  }, [period]);

  const marcaId = selectedBrand === "all" ? undefined : selectedBrand;
  const platform = selectedPlatform === "all" ? undefined : selectedPlatform as "meta" | "google" | "tiktok";

  const { data: dailyData, isLoading } = useDailyMetrics(dateRange, marcaId, platform);
  const { data: periodData } = usePeriodMetrics(dateRange, marcaId, platform);

  // Combina período anterior + atual para os componentes que fatiam pelo fim do array
  const chartData = useMemo(() => {
    const prev = (dailyData?.previous || []).map(d => ({ ...d, conversions: 0 }));
    const curr = (dailyData?.current || []).map(d => ({ ...d, conversions: 0 }));
    return [...prev, ...curr];
  }, [dailyData]);

  const insightMetrics = useMemo(() => {
    const m = periodData?.current;
    const days = period === "weekly" ? 7 : period === "biweekly" ? 15 : 30;

    const brandName = selectedBrand === "all"
      ? "Todas as marcas"
      : getBrandDisplayName(brands.find(b => b.id === selectedBrand) || { id: "", nome: "Desconhecida", display_name: null, logo_url: null, ativo: true, manual_balance: null, daily_budget: null, last_balance_update: null });

    const platformName = selectedPlatform === "all"
      ? "Todas as plataformas"
      : selectedPlatform === "meta" ? "Meta Ads"
      : selectedPlatform === "google" ? "Google Ads"
      : "TikTok Ads";

    const periodLabel = `Últimos ${days} dias`;

    return {
      totalSpend: m?.spend ?? 0,
      totalImpressions: m?.impressions ?? 0,
      totalClicks: m?.clicks ?? 0,
      totalConversions: m?.conversions ?? 0,
      avgCtr: m?.ctr ?? 0,
      activeCampaigns: 0,
      platform: platformName,
      brand: brandName,
      period: periodLabel,
    };
  }, [periodData, period, selectedBrand, selectedPlatform, brands]);

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">
            Visualize e analise a performance das suas campanhas
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileBarChart className="h-4 w-4" />
              Filtros do Relatório
            </CardTitle>
            <CardDescription>
              Selecione marca, plataforma e período para gerar o relatório
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <BrandFilter value={selectedBrand} onChange={setSelectedBrand} />
              <PlatformFilter value={selectedPlatform} onChange={setSelectedPlatform} />
              <PeriodFilter value={period} onChange={setPeriod} />
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <ReportSummaryCards data={chartData} period={period} />
            <ReportCharts data={chartData} period={period} />
            <ReportInsights metrics={insightMetrics} />
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Relatorios;
