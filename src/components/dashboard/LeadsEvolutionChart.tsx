import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ChartDataPoint {
  name: string;
  real: number;
  orcado: number;
  a1?: number;
  comparison?: number;
}

interface LeadsEvolutionChartProps {
  data: ChartDataPoint[];
  hasComparison?: boolean;
}

export const LeadsEvolutionChart = ({ data, hasComparison = false }: LeadsEvolutionChartProps) => {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Evolução de Leads</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickFormatter={(value) => value.toLocaleString('pt-BR')}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [value.toLocaleString('pt-BR'), '']}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="real"
                name="Real"
                stroke="hsl(var(--chart-1))"
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--chart-1))', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="orcado"
                name="Orçado"
                stroke="hsl(var(--chart-3))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: 'hsl(var(--chart-3))', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="a1"
                name="Ano Anterior"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--muted-foreground))', strokeWidth: 2 }}
              />
              {hasComparison && (
                <Line
                  type="monotone"
                  dataKey="comparison"
                  name="Período Comparado"
                  stroke="hsl(var(--chart-4))"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  dot={{ fill: 'hsl(var(--chart-4))', strokeWidth: 2 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
