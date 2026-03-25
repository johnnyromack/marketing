import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MidiaKPICards } from '../MidiaKPICards';
import { MidiaBrandChart } from '../MidiaBrandChart';
import { Calendar, MapPin, Users } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface EventosTabProps {
  kpis: {
    totalOrcado: number;
    totalRealizado: number;
    saldoRemanescente: number;
    percentualExecutado: number;
  };
  categoriaBreakdown: Array<{ categoria: string; orcado: number; realizado: number }>;
  brandBreakdown: Array<{ marca: string; orcado: number; realizado: number }>;
  proximosEventos: Array<{ nome: string; data: string; marca: string; endereco: string | null }>;
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
  return `R$ ${value}`;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const EventosTab = ({ kpis, categoriaBreakdown, brandBreakdown, proximosEventos }: EventosTabProps) => {
  return (
    <div className="space-y-6">
      <MidiaKPICards kpis={kpis} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximos Eventos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              Próximos Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {proximosEventos.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Nenhum evento programado
              </div>
            ) : (
              <div className="space-y-3 max-h-[250px] overflow-y-auto">
                {proximosEventos.slice(0, 5).map((evento, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{evento.nome}</p>
                      <p className="text-xs text-muted-foreground">{evento.marca} • {formatDate(evento.data)}</p>
                      {evento.endereco && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{evento.endereco}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Investimento por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {categoriaBreakdown.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Sem dados para exibir
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={categoriaBreakdown} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="categoria" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis tickFormatter={formatCurrency} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="orcado" name="Orçado" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="realizado" name="Realizado" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
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
