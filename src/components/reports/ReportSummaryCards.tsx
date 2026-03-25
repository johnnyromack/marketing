import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Eye, MousePointer, Target, Wallet } from "lucide-react";
import { PeriodType } from "@/components/filters/PeriodFilter";

interface DailyData {
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  ctr: number;
}

interface ReportSummaryCardsProps {
  data: DailyData[];
  period: PeriodType;
}

export function ReportSummaryCards({ data, period }: ReportSummaryCardsProps) {
  const daysInPeriod = period === "weekly" ? 7 : period === "biweekly" ? 15 : 30;
  const periodLabel = period === "weekly" ? "semana" : period === "biweekly" ? "quinzena" : "mês";
  
  const currentData = data.slice(-daysInPeriod);
  const previousData = data.slice(-daysInPeriod * 2, -daysInPeriod);

  const sumMetrics = (arr: DailyData[]) => ({
    impressions: arr.reduce((s, d) => s + d.impressions, 0),
    clicks: arr.reduce((s, d) => s + d.clicks, 0),
    spend: arr.reduce((s, d) => s + d.spend, 0),
    conversions: arr.reduce((s, d) => s + d.conversions, 0),
    ctr: arr.length > 0 ? arr.reduce((s, d) => s + d.ctr, 0) / arr.length : 0,
  });

  const current = sumMetrics(currentData);
  const previous = sumMetrics(previousData);

  const calcChange = (curr: number, prev: number) => 
    prev > 0 ? ((curr - prev) / prev) * 100 : 0;

  const metrics = [
    {
      title: "Impressões",
      value: current.impressions,
      change: calcChange(current.impressions, previous.impressions),
      icon: Eye,
      format: (v: number) => v.toLocaleString("pt-BR"),
    },
    {
      title: "Cliques",
      value: current.clicks,
      change: calcChange(current.clicks, previous.clicks),
      icon: MousePointer,
      format: (v: number) => v.toLocaleString("pt-BR"),
    },
    {
      title: "CTR Médio",
      value: current.ctr,
      change: calcChange(current.ctr, previous.ctr),
      icon: Target,
      format: (v: number) => `${v.toFixed(2)}%`,
    },
    {
      title: "Investimento",
      value: current.spend,
      change: calcChange(current.spend, previous.spend),
      icon: Wallet,
      format: (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    },
    {
      title: "Conversões",
      value: current.conversions,
      change: calcChange(current.conversions, previous.conversions),
      icon: TrendingUp,
      format: (v: number) => v.toLocaleString("pt-BR"),
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        const isPositive = metric.change >= 0;
        const TrendIcon = isPositive ? TrendingUp : TrendingDown;

        return (
          <Card key={metric.title}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">{metric.title}</span>
                </div>
                <div className={`flex items-center gap-1 text-xs ${isPositive ? "text-green-600" : "text-red-600"}`}>
                  <TrendIcon className="h-3 w-3" />
                  {Math.abs(metric.change).toFixed(1)}%
                </div>
              </div>
              <p className="text-xl font-bold">{metric.format(metric.value)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                vs {periodLabel} anterior
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
