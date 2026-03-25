import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MidiaKPICards } from '../MidiaKPICards';
import { MidiaBrandChart } from '../MidiaBrandChart';
import { MidiaOffMonthlyChart } from '../MidiaOffMonthlyChart';
import { MidiaOffMap } from '@/components/maps/MidiaOffMap';
import { Map } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

interface MidiaOffTabProps {
  kpis: {
    totalOrcado: number;
    totalRealizado: number;
    saldoRemanescente: number;
    percentualExecutado: number;
  };
  tipoMidiaBreakdown: Array<{ name: string; value: number; color: string }>;
  brandBreakdown: Array<{ marca: string; orcado: number; realizado: number }>;
  fornecedorBreakdown: Array<{ fornecedor: string; valor: number }>;
  monthlyEvolution: Array<{ month: string; orcado: number; realizado: number }>;
  marcas: string[];
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
  return `R$ ${value}`;
};

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-6))',
];

export const MidiaOffTab = ({ kpis, tipoMidiaBreakdown, brandBreakdown, fornecedorBreakdown, monthlyEvolution, marcas }: MidiaOffTabProps) => {
  return (
    <div className="space-y-6">
      <MidiaKPICards kpis={kpis} />
      
      {/* Gráfico de Distribuição Mensal */}
      <MidiaOffMonthlyChart data={monthlyEvolution} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mapa */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5" />
              Mapa de Pontos de Mídia Off
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MidiaOffMap marcas={marcas} className="h-[400px]" />
          </CardContent>
        </Card>

        {/* Tipos de Mídia */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tipos de Mídia</CardTitle>
          </CardHeader>
          <CardContent>
            {tipoMidiaBreakdown.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Sem dados para exibir
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={tipoMidiaBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {tipoMidiaBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Fornecedores */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Investimento por Fornecedor</CardTitle>
          </CardHeader>
          <CardContent>
            {fornecedorBreakdown.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Sem dados para exibir
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={fornecedorBreakdown} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tickFormatter={formatCurrency} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis type="category" dataKey="fornecedor" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} width={100} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="valor" name="Valor Investido" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Marca */}
      <MidiaBrandChart data={brandBreakdown} />
    </div>
  );
};
