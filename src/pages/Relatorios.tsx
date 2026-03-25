import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandFilter } from "@/components/filters/BrandFilter";
import { PlatformFilter } from "@/components/filters/PlatformFilter";
import { PeriodFilter, PeriodType } from "@/components/filters/PeriodFilter";
import { ReportCharts } from "@/components/reports/ReportCharts";
import { ReportSummaryCards } from "@/components/reports/ReportSummaryCards";
import { ReportInsights } from "@/components/reports/ReportInsights";
import { useBrands, getBrandDisplayName } from "@/hooks/usePlatformData";
import { historicalData } from "@/lib/mock-data";
import { FileBarChart } from "lucide-react";
import { Platform } from "@/types/platform";

const Relatorios = () => {
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [period, setPeriod] = useState<PeriodType>("weekly");

  const { data: brands = [] } = useBrands();

  const chartData = useMemo(() => {
    if (selectedPlatform === "all") {
      return historicalData.global;
    }
    return historicalData[selectedPlatform as Platform] || historicalData.global;
  }, [selectedPlatform]);

  const insightMetrics = useMemo(() => {
    const daysInPeriod = period === "weekly" ? 7 : period === "biweekly" ? 15 : 30;
    const currentData = chartData.slice(-daysInPeriod);

    const totalSpend = currentData.reduce((s, d) => s + d.spend, 0);
    const totalImpressions = currentData.reduce((s, d) => s + d.impressions, 0);
    const totalClicks = currentData.reduce((s, d) => s + d.clicks, 0);
    const totalConversions = currentData.reduce((s, d) => s + d.conversions, 0);
    const avgCtr = currentData.length > 0
      ? currentData.reduce((s, d) => s + d.ctr, 0) / currentData.length
      : 0;

    const brandName = selectedBrand === "all"
      ? "Todas as marcas"
      : getBrandDisplayName(brands.find(b => b.id === selectedBrand) || { id: "", name: "Desconhecida", display_name: null, logo_url: null, is_active: true, manual_balance: null, daily_budget: null, last_balance_update: null });

    const platformName = selectedPlatform === "all"
      ? "Todas as plataformas"
      : selectedPlatform === "meta"
        ? "Meta Ads"
        : selectedPlatform === "google"
          ? "Google Ads"
          : "TikTok Ads";

    const periodLabel = period === "weekly"
      ? "Ultimos 7 dias"
      : period === "biweekly"
        ? "Ultimos 15 dias"
        : "Ultimos 30 dias";

    return {
      totalSpend,
      totalImpressions,
      totalClicks,
      totalConversions,
      avgCtr,
      activeCampaigns: Math.floor(Math.random() * 10) + 5,
      platform: platformName,
      brand: brandName,
      period: periodLabel,
    };
  }, [chartData, period, selectedBrand, selectedPlatform, brands]);

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatorios</h1>
          <p className="text-muted-foreground">
            Visualize e analise a performance das suas campanhas
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileBarChart className="h-4 w-4" />
              Filtros do Relatorio
            </CardTitle>
            <CardDescription>
              Selecione marca, plataforma e periodo para gerar o relatorio
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

        {/* Summary Cards */}
        <ReportSummaryCards data={chartData} period={period} />

        {/* Charts */}
        <ReportCharts data={chartData} period={period} />

        {/* AI Insights */}
        <ReportInsights metrics={insightMetrics} />
      </div>
    </AppLayout>
  );
};

export default Relatorios;
