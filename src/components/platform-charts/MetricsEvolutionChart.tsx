import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, Legend } from "recharts";
import { historicalData, formatNumber } from "@/lib/mock-data";
import { Platform } from "@/types/platform";
import { TrendingUp, GitCompare } from "lucide-react";

interface MetricsEvolutionChartProps {
  platform?: Platform;
  compact?: boolean;
  className?: string;
  showComparison?: boolean;
}

const chartConfig: ChartConfig = {
  impressions: {
    label: "Impressões",
    color: "hsl(var(--chart-1))",
  },
  clicks: {
    label: "Cliques",
    color: "hsl(var(--chart-2))",
  },
  ctr: {
    label: "CTR",
    color: "hsl(var(--chart-3))",
  },
  impressions_prev: {
    label: "Impressões (anterior)",
    color: "hsl(var(--chart-1) / 0.4)",
  },
  clicks_prev: {
    label: "Cliques (anterior)",
    color: "hsl(var(--chart-2) / 0.4)",
  },
  ctr_prev: {
    label: "CTR (anterior)",
    color: "hsl(var(--chart-3) / 0.4)",
  },
};

type MetricKey = "impressions" | "clicks" | "ctr";
type ComparisonType = "none" | "previous_period" | "previous_year";

export function MetricsEvolutionChart({ platform, compact = false, className, showComparison = false }: MetricsEvolutionChartProps) {
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("impressions");
  const [comparison, setComparison] = useState<ComparisonType>("none");

  const data = useMemo(() => {
    const rawData = platform ? historicalData[platform] : historicalData.global;
    const daysToShow = period === "weekly" ? 7 : 30;
    const currentData = rawData.slice(-daysToShow);
    
    // Generate comparison data (simulated - in real app, fetch from backend)
    const generateComparisonData = (current: typeof currentData, type: ComparisonType) => {
      if (type === "none") return current.map(d => ({ ...d, label: new Date(d.date).toLocaleDateString("pt-BR", { day: "numeric", month: "short" }) }));
      
      const variationFactor = type === "previous_year" ? 0.85 : 0.92; // Previous year typically lower
      
      return current.map((d) => {
        const prevImpressions = Math.round(d.impressions * (variationFactor + Math.random() * 0.1));
        const prevClicks = Math.round(d.clicks * (variationFactor + Math.random() * 0.1));
        const prevCtr = prevClicks / prevImpressions * 100;
        
        return {
          ...d,
          label: new Date(d.date).toLocaleDateString("pt-BR", { day: "numeric", month: "short" }),
          impressions_prev: prevImpressions,
          clicks_prev: prevClicks,
          ctr_prev: prevCtr,
        };
      });
    };
    
    return generateComparisonData(currentData, comparison);
  }, [platform, period, comparison]);

  const formatValue = (value: number, metric: MetricKey) => {
    if (metric === "ctr") return `${value.toFixed(2)}%`;
    return formatNumber(value);
  };

  const getComparisonLabel = () => {
    if (comparison === "previous_period") return period === "weekly" ? "Semana anterior" : "Mês anterior";
    if (comparison === "previous_year") return "Ano anterior";
    return "";
  };

  if (compact) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">Evolução</CardTitle>
            </div>
            <Tabs value={period} onValueChange={(v) => setPeriod(v as "weekly" | "monthly")}>
              <TabsList className="h-8">
                <TabsTrigger value="weekly" className="text-xs px-2">7 dias</TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs px-2">30 dias</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs value={selectedMetric} onValueChange={(v) => setSelectedMetric(v as MetricKey)} className="mb-2">
            <TabsList className="w-full h-8">
              <TabsTrigger value="impressions" className="text-xs flex-1">Impressões</TabsTrigger>
              <TabsTrigger value="clicks" className="text-xs flex-1">Cliques</TabsTrigger>
              <TabsTrigger value="ctr" className="text-xs flex-1">CTR</TabsTrigger>
            </TabsList>
          </Tabs>
          <ChartContainer config={chartConfig} className="h-[180px] w-full">
            <LineChart data={data} margin={{ left: 0, right: 0 }}>
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 10 }} 
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis 
                tick={{ fontSize: 10 }} 
                tickLine={false}
                axisLine={false}
                width={45}
                tickFormatter={(v) => selectedMetric === "ctr" ? `${v}%` : formatNumber(v)}
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                formatter={(value) => formatValue(value as number, selectedMetric)}
              />
              <Line 
                type="monotone" 
                dataKey={selectedMetric} 
                stroke={`var(--color-${selectedMetric})`}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">Evolução de Métricas</CardTitle>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {showComparison && (
              <Select value={comparison} onValueChange={(v) => setComparison(v as ComparisonType)}>
                <SelectTrigger className="w-[180px] h-9">
                  <GitCompare className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Comparar com..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem comparação</SelectItem>
                  <SelectItem value="previous_period">Período anterior</SelectItem>
                  <SelectItem value="previous_year">Ano anterior</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Tabs value={period} onValueChange={(v) => setPeriod(v as "weekly" | "monthly")}>
              <TabsList>
                <TabsTrigger value="weekly">Semanal</TabsTrigger>
                <TabsTrigger value="monthly">Mensal</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        {comparison !== "none" && (
          <div className="flex items-center gap-4 mt-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-chart-1" />
              <span>Período atual</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-chart-1/40" />
              <span>{getComparisonLabel()}</span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart data={data} margin={{ left: 10, right: 10 }}>
            <XAxis 
              dataKey="label" 
              tick={{ fontSize: 11 }} 
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 11 }} 
              tickLine={false}
              axisLine={false}
              width={60}
              tickFormatter={(v) => formatNumber(v)}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11 }} 
              tickLine={false}
              axisLine={false}
              width={50}
              tickFormatter={(v) => `${v}%`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="impressions" 
              name="Impressões"
              stroke="var(--color-impressions)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            {comparison !== "none" && (
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="impressions_prev" 
                name={`Impressões (${getComparisonLabel()})`}
                stroke="var(--color-impressions)"
                strokeWidth={2}
                strokeDasharray="5 5"
                strokeOpacity={0.4}
                dot={false}
              />
            )}
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="clicks" 
              name="Cliques"
              stroke="var(--color-clicks)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            {comparison !== "none" && (
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="clicks_prev" 
                name={`Cliques (${getComparisonLabel()})`}
                stroke="var(--color-clicks)"
                strokeWidth={2}
                strokeDasharray="5 5"
                strokeOpacity={0.4}
                dot={false}
              />
            )}
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="ctr" 
              name="CTR"
              stroke="var(--color-ctr)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            {comparison !== "none" && (
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="ctr_prev" 
                name={`CTR (${getComparisonLabel()})`}
                stroke="var(--color-ctr)"
                strokeWidth={2}
                strokeDasharray="5 5"
                strokeOpacity={0.4}
                dot={false}
              />
            )}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
