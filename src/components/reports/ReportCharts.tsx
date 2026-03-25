import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { PeriodType } from "@/components/filters/PeriodFilter";

interface DailyData {
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  ctr: number;
}

interface ReportChartsProps {
  data: DailyData[];
  period: PeriodType;
}

const COLORS = {
  impressions: "hsl(var(--chart-impressions))",
  clicks: "hsl(var(--chart-clicks))",
  ctr: "hsl(var(--chart-ctr))",
  spend: "hsl(var(--chart-spend))",
  conversions: "hsl(var(--chart-conversions))",
};

const PIE_COLORS = [
  "hsl(var(--chart-impressions))",
  "hsl(var(--chart-clicks))",
  "hsl(var(--chart-ctr))",
  "hsl(var(--chart-spend))",
];

export function ReportCharts({ data, period }: ReportChartsProps) {
  const daysInPeriod = period === "weekly" ? 7 : period === "biweekly" ? 15 : 30;
  const currentData = data.slice(-daysInPeriod);

  // Calculate totals for pie chart
  const totalImpressions = currentData.reduce((sum, d) => sum + d.impressions, 0);
  const totalClicks = currentData.reduce((sum, d) => sum + d.clicks, 0);
  const totalSpend = currentData.reduce((sum, d) => sum + d.spend, 0);
  const totalConversions = currentData.reduce((sum, d) => sum + d.conversions, 0);

  const distributionData = [
    { name: "Impressões", value: totalImpressions, formatted: totalImpressions.toLocaleString("pt-BR") },
    { name: "Cliques", value: totalClicks, formatted: totalClicks.toLocaleString("pt-BR") },
    { name: "Conversões", value: totalConversions, formatted: totalConversions.toLocaleString("pt-BR") },
  ];

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString("pt-BR");
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Impressions & Clicks Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Impressões e Cliques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentData}>
                <defs>
                  <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.impressions} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.impressions} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.clicks} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.clicks} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  yAxisId="left"
                  tickFormatter={formatNumber}
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={formatNumber}
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelFormatter={formatDate}
                  formatter={(value: number, name: string) => [
                    value.toLocaleString("pt-BR"),
                    name === "impressions" ? "Impressões" : "Cliques"
                  ]}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="impressions"
                  stroke={COLORS.impressions}
                  fill="url(#colorImpressions)"
                  strokeWidth={2}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="clicks"
                  stroke={COLORS.clicks}
                  fill="url(#colorClicks)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Spend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Investimento Diário</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tickFormatter={formatCurrency}
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelFormatter={formatDate}
                  formatter={(value: number) => [formatCurrency(value), "Investimento"]}
                />
                <Bar 
                  dataKey="spend" 
                  fill={COLORS.spend}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* CTR Evolution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolução do CTR</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentData}>
                <defs>
                  <linearGradient id="colorCtr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.ctr} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.ctr} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tickFormatter={(v) => `${v.toFixed(1)}%`}
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                  domain={[0, 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelFormatter={formatDate}
                  formatter={(value: number) => [`${value.toFixed(2)}%`, "CTR"]}
                />
                <Area
                  type="monotone"
                  dataKey="ctr"
                  stroke={COLORS.ctr}
                  fill="url(#colorCtr)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Distribution Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribuição de Resultados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number, name: string) => [value.toLocaleString("pt-BR"), name]}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
