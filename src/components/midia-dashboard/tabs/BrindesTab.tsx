import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MidiaKPICards } from '../MidiaKPICards';
import { MidiaBrandChart } from '../MidiaBrandChart';
import { Gift } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface BrindesTabProps {
  kpis: {
    totalOrcado: number;
    totalRealizado: number;
    saldoRemanescente: number;
    percentualExecutado: number;
  };
  categoriaBreakdown: Array<{ categoria: string; orcado: number; realizado: number }>;
  brandBreakdown: Array<{ marca: string; orcado: number; realizado: number }>;
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
  return `R$ ${value}`;
};

export const BrindesTab = ({ kpis, categoriaBreakdown, brandBreakdown }: BrindesTabProps) => {
  return (
    <div className="space-y-6">
      <MidiaKPICards kpis={kpis} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Por Categoria */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gift className="h-5 w-5" />
              Investimento por Categoria de Brinde
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoriaBreakdown.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sem dados para exibir
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoriaBreakdown} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="categoria" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis tickFormatter={formatCurrency} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="orcado" name="Orçado" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="realizado" name="Realizado" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
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
