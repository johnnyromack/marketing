import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Line, ComposedChart } from "recharts";
import { getAggregatedBalanceHistory, adAccounts, formatCurrency } from "@/lib/mock-data";
import { Wallet } from "lucide-react";

interface BalanceEvolutionChartProps {
  accountId?: string;
  className?: string;
}

const chartConfig: ChartConfig = {
  spent: {
    label: "Gasto",
    color: "hsl(var(--chart-1))",
  },
  balance: {
    label: "Saldo",
    color: "hsl(var(--chart-2))",
  },
};

export function BalanceEvolutionChart({ accountId, className }: BalanceEvolutionChartProps) {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [selectedAccount, setSelectedAccount] = useState(accountId || adAccounts[0]?.id || "");

  const data = useMemo(() => {
    return getAggregatedBalanceHistory(selectedAccount, period);
  }, [selectedAccount, period]);

  const account = adAccounts.find(a => a.id === selectedAccount);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">Evolução de Gastos</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {!accountId && (
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Selecione conta" />
                </SelectTrigger>
                <SelectContent>
                  {adAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Tabs value={period} onValueChange={(v) => setPeriod(v as "daily" | "weekly" | "monthly")}>
              <TabsList>
                <TabsTrigger value="daily">Diário</TabsTrigger>
                <TabsTrigger value="weekly">Semanal</TabsTrigger>
                <TabsTrigger value="monthly">Mensal</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        {account && (
          <p className="text-sm text-muted-foreground">
            Saldo atual: <span className="font-medium text-foreground">{formatCurrency(account.currentBalance)}</span>
          </p>
        )}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ComposedChart data={data} margin={{ left: 10, right: 10 }}>
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
              width={80}
              tickFormatter={(v) => formatCurrency(v)}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11 }} 
              tickLine={false}
              axisLine={false}
              width={80}
              tickFormatter={(v) => formatCurrency(v)}
            />
            <ChartTooltip 
              content={<ChartTooltipContent />}
              formatter={(value) => formatCurrency(value as number)}
            />
            <Bar 
              yAxisId="left"
              dataKey="spent" 
              name="Gasto"
              fill="var(--color-spent)"
              radius={[4, 4, 0, 0]}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="balance" 
              name="Saldo"
              stroke="var(--color-balance)"
              strokeWidth={2}
              dot={{ r: 4, fill: "var(--color-balance)" }}
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
