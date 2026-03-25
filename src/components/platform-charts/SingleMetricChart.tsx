import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis } from "recharts";
import { formatNumber } from "@/lib/mock-data";
import { Eye, MousePointerClick, Percent } from "lucide-react";

interface DailyMetric {
  date: string;
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
}

interface SingleMetricChartProps {
  metric: "impressions" | "clicks" | "ctr";
  currentData: DailyMetric[];
  previousData: DailyMetric[];
  className?: string;
}

const metricConfig = {
  impressions: {
    label: "Impressões",
    icon: Eye,
    color: "hsl(var(--chart-1))",
    prevColor: "hsl(var(--chart-4))",
    format: (v: number) => formatNumber(Math.round(v)),
  },
  clicks: {
    label: "Cliques",
    icon: MousePointerClick,
    color: "hsl(var(--chart-2))",
    prevColor: "hsl(var(--chart-5))",
    format: (v: number) => formatNumber(Math.round(v)),
  },
  ctr: {
    label: "CTR",
    icon: Percent,
    color: "hsl(var(--chart-3))",
    prevColor: "hsl(var(--chart-5))",
    format: (v: number) => `${v.toFixed(2)}%`,
  },
};

export function SingleMetricChart({ metric, currentData, previousData, className }: SingleMetricChartProps) {
  const config = metricConfig[metric];
  const Icon = config.icon;

  const chartConfig: ChartConfig = {
    [metric]: { label: config.label, color: config.color },
    [`${metric}_prev`]: { label: `${config.label} (anterior)`, color: config.prevColor },
  };

  const { data, stats } = useMemo(() => {
    // Build chart data aligning current and previous by index
    const chartData = currentData.map((d, index) => {
      const prevDay = previousData[index];
      return {
        date: d.date,
        label: new Date(d.date).toLocaleDateString("pt-BR", { day: "numeric", month: "short" }),
        [metric]: d[metric],
        [`${metric}_prev`]: prevDay ? prevDay[metric] : 0,
      };
    });

    // Calculate totals
    const currentValues = currentData.map((d) => d[metric]);
    const previousValues = previousData.map((d) => d[metric]);

    let currentTotal: number;
    let previousTotal: number;

    if (metric === "ctr") {
      currentTotal = currentValues.length > 0 ? currentValues.reduce((a, b) => a + b, 0) / currentValues.length : 0;
      previousTotal = previousValues.length > 0 ? previousValues.reduce((a, b) => a + b, 0) / previousValues.length : 0;
    } else {
      currentTotal = currentValues.reduce((a, b) => a + b, 0);
      previousTotal = previousValues.reduce((a, b) => a + b, 0);
    }

    const change = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;

    return {
      data: chartData,
      stats: { current: currentTotal, change },
    };
  }, [currentData, previousData, metric]);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">{config.label}</CardTitle>
              <p className="text-2xl font-bold">{config.format(stats.current)}</p>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-sm font-medium ${stats.change >= 0 ? "text-success" : "text-destructive"}`}>
              {stats.change >= 0 ? "+" : ""}{stats.change.toFixed(1)}%
            </span>
            <p className="text-xs text-muted-foreground">vs período anterior</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4 mb-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: config.color }} />
            <span className="text-muted-foreground">Período atual</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: config.prevColor }} />
            <span className="text-muted-foreground">Período anterior</span>
          </div>
        </div>

        <ChartContainer config={chartConfig} className="h-[140px] w-full">
          <AreaChart data={data} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id={`fill-${metric}-current`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={config.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={config.color} stopOpacity={0} />
              </linearGradient>
              <linearGradient id={`fill-${metric}-prev`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={config.prevColor} stopOpacity={0.2} />
                <stop offset="95%" stopColor={config.prevColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis hide domain={metric === "ctr" ? [0, "auto"] : ["dataMin", "dataMax"]} />
            <ChartTooltip
              content={<ChartTooltipContent />}
              formatter={(value) => config.format(value as number)}
            />
            <Area
              type="monotone"
              dataKey={`${metric}_prev`}
              name="Período anterior"
              stroke={config.prevColor}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fill={`url(#fill-${metric}-prev)`}
              fillOpacity={0.3}
            />
            <Area
              type="monotone"
              dataKey={metric}
              name="Período atual"
              stroke={config.color}
              strokeWidth={2}
              fill={`url(#fill-${metric}-current)`}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
