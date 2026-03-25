import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Building, Users, TrendingUp, TrendingDown, Minus, PieChart } from 'lucide-react';
import { formatCurrency } from '@/components/midia/shared/formatters';
import { TipoCusto } from './TiposCustoManager';
import { 
  ChartContainer, 
  ChartConfig, 
  ChartTooltip, 
  ChartTooltipContent 
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';

interface OrcamentoArea {
  id: string;
  ano: number;
  marca: string;
  tipo_custo_id: string;
  tipo_custo_nome: string;
  valor_orcado: number;
  valor_utilizado: number;
  saldo_disponivel: number;
}

interface ResumoCentroCustoProps {
  tiposCusto: TipoCusto[];
  orcamentos: OrcamentoArea[];
  filtroAno: number;
  filtroMarca: string;
}

export const ResumoCentroCusto = ({ 
  tiposCusto, 
  orcamentos, 
  filtroAno, 
  filtroMarca 
}: ResumoCentroCustoProps) => {
  // Filtrar orçamentos
  const orcamentosFiltrados = useMemo(() => {
    return orcamentos.filter(orc => {
      if (filtroAno && orc.ano !== filtroAno) return false;
      if (filtroMarca !== 'todas' && orc.marca !== filtroMarca) return false;
      return true;
    });
  }, [orcamentos, filtroAno, filtroMarca]);

  // Resumo por centro de custo
  const resumoPorCentro = useMemo(() => {
    const resumo: Record<string, {
      id: string;
      nome: string;
      tipo_orcamento: 'proprio' | 'compartilhado';
      orcado: number;
      utilizado: number;
      saldo: number;
      percentual: number;
    }> = {};

    orcamentosFiltrados.forEach(orc => {
      const tipoCusto = tiposCusto.find(t => t.id === orc.tipo_custo_id);
      if (!tipoCusto) return;

      if (!resumo[orc.tipo_custo_id]) {
        resumo[orc.tipo_custo_id] = {
          id: orc.tipo_custo_id,
          nome: tipoCusto.nome,
          tipo_orcamento: tipoCusto.tipo_orcamento,
          orcado: 0,
          utilizado: 0,
          saldo: 0,
          percentual: 0,
        };
      }
      resumo[orc.tipo_custo_id].orcado += orc.valor_orcado;
      resumo[orc.tipo_custo_id].utilizado += orc.valor_utilizado;
      resumo[orc.tipo_custo_id].saldo += orc.saldo_disponivel;
    });

    // Calcular percentuais
    Object.values(resumo).forEach(item => {
      item.percentual = item.orcado > 0 ? (item.utilizado / item.orcado) * 100 : 0;
    });

    return Object.values(resumo).sort((a, b) => b.orcado - a.orcado);
  }, [orcamentosFiltrados, tiposCusto]);

  // Totais
  const totais = useMemo(() => {
    const proprio = resumoPorCentro
      .filter(r => r.tipo_orcamento === 'proprio')
      .reduce((acc, r) => ({
        orcado: acc.orcado + r.orcado,
        utilizado: acc.utilizado + r.utilizado,
        saldo: acc.saldo + r.saldo,
      }), { orcado: 0, utilizado: 0, saldo: 0 });

    const compartilhado = resumoPorCentro
      .filter(r => r.tipo_orcamento === 'compartilhado')
      .reduce((acc, r) => ({
        orcado: acc.orcado + r.orcado,
        utilizado: acc.utilizado + r.utilizado,
        saldo: acc.saldo + r.saldo,
      }), { orcado: 0, utilizado: 0, saldo: 0 });

    const total = {
      orcado: proprio.orcado + compartilhado.orcado,
      utilizado: proprio.utilizado + compartilhado.utilizado,
      saldo: proprio.saldo + compartilhado.saldo,
    };

    return { proprio, compartilhado, total };
  }, [resumoPorCentro]);

  // Dados para gráfico
  const chartData = resumoPorCentro.map((item, index) => ({
    name: item.nome.length > 12 ? item.nome.substring(0, 12) + '...' : item.nome,
    orcado: item.orcado,
    utilizado: item.utilizado,
    fill: item.tipo_orcamento === 'proprio' ? 'hsl(var(--primary))' : 'hsl(280 65% 60%)',
  }));

  const chartConfig: ChartConfig = {
    orcado: { label: 'Orçado', color: 'hsl(var(--muted))' },
    utilizado: { label: 'Utilizado', color: 'hsl(var(--primary))' },
  };

  const getDeltaIcon = (delta: number) => {
    if (delta > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (delta < 0) return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-4">
      {/* Totais por tipo de orçamento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Building className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Orçamento Próprio</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Orçado</span>
                <span className="font-medium">{formatCurrency(totais.proprio.orcado)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Utilizado</span>
                <span>{formatCurrency(totais.proprio.utilizado)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span>Saldo</span>
                <span className={totais.proprio.saldo >= 0 ? 'text-green-600' : 'text-destructive'}>
                  {formatCurrency(totais.proprio.saldo)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Orçamento Compartilhado</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Orçado</span>
                <span className="font-medium">{formatCurrency(totais.compartilhado.orcado)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Utilizado</span>
                <span>{formatCurrency(totais.compartilhado.utilizado)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span>Saldo</span>
                <span className={totais.compartilhado.saldo >= 0 ? 'text-green-600' : 'text-destructive'}>
                  {formatCurrency(totais.compartilhado.saldo)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <PieChart className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Total Geral</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Orçado</span>
                <span className="font-medium">{formatCurrency(totais.total.orcado)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Utilizado</span>
                <span>{formatCurrency(totais.total.utilizado)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span>Saldo</span>
                <span className={totais.total.saldo >= 0 ? 'text-green-600' : 'text-destructive'}>
                  {formatCurrency(totais.total.saldo)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de barras */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Utilização por Centro de Custo</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20 }}>
                <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  formatter={(value) => formatCurrency(Number(value))}
                />
                <Bar dataKey="orcado" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} name="Orçado" />
                <Bar dataKey="utilizado" radius={[0, 4, 4, 0]} name="Utilizado">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Lista detalhada por centro */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalhamento por Centro de Custo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {resumoPorCentro.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum orçamento cadastrado para os filtros selecionados
              </p>
            ) : (
              resumoPorCentro.map((item) => (
                <div key={item.id} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.nome}</span>
                      <Badge 
                        variant="outline" 
                        className={item.tipo_orcamento === 'proprio' 
                          ? 'border-blue-500/50 text-blue-600 text-xs' 
                          : 'border-purple-500/50 text-purple-600 text-xs'}
                      >
                        {item.tipo_orcamento === 'proprio' ? 'Próprio' : 'Compartilhado'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      {getDeltaIcon(item.saldo)}
                      <span className={`font-semibold ${item.saldo >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                        {formatCurrency(item.saldo)}
                      </span>
                    </div>
                  </div>
                  
                  <Progress 
                    value={Math.min(item.percentual, 100)} 
                    className={`h-2 mb-2 ${item.percentual > 100 ? '[&>div]:bg-destructive' : ''}`}
                  />
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Orçado</span>
                      <p className="font-medium">{formatCurrency(item.orcado)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Utilizado</span>
                      <p className="font-medium">{formatCurrency(item.utilizado)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">% Utilizado</span>
                      <p className={`font-medium ${item.percentual > 100 ? 'text-destructive' : ''}`}>
                        {item.percentual.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
