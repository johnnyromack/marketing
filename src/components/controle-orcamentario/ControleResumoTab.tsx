import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ControleRegistro } from '@/hooks/useControleOrcamentario';
import { DollarSign, TrendingUp, FileText, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { MONTHS } from '@/components/midia/shared/constants';

interface ControleResumoTabProps {
  registros: ControleRegistro[];
  anoFiltro: number;
  marcaFiltro: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatCurrencyShort = (value: number) => {
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
];

export const ControleResumoTab = ({
  registros,
  anoFiltro,
  marcaFiltro,
}: ControleResumoTabProps) => {
  const registrosFiltrados = useMemo(() => {
    return registros.filter((r) => {
      const matchAno = r.ano === anoFiltro;
      const matchMarca = marcaFiltro === 'todas' || r.marca === marcaFiltro;
      return matchAno && matchMarca;
    });
  }, [registros, anoFiltro, marcaFiltro]);

  const stats = useMemo(() => {
    const total = registrosFiltrados.reduce((sum, r) => sum + Number(r.valor || 0), 0);
    const pago = registrosFiltrados
      .filter((r) => r.status === 'pago')
      .reduce((sum, r) => sum + Number(r.valor || 0), 0);
    const previsto = registrosFiltrados
      .filter((r) => r.status === 'previsto')
      .reduce((sum, r) => sum + Number(r.valor || 0), 0);
    const atrasado = registrosFiltrados
      .filter((r) => r.status === 'atrasado')
      .reduce((sum, r) => sum + Number(r.valor || 0), 0);

    return { total, pago, previsto, atrasado, count: registrosFiltrados.length };
  }, [registrosFiltrados]);

  const porTipoCusto = useMemo(() => {
    const map = new Map<string, number>();
    registrosFiltrados.forEach((r) => {
      const current = map.get(r.tipo_custo) || 0;
      map.set(r.tipo_custo, current + Number(r.valor || 0));
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [registrosFiltrados]);

  const porMarca = useMemo(() => {
    const map = new Map<string, number>();
    registrosFiltrados.forEach((r) => {
      const current = map.get(r.marca) || 0;
      map.set(r.marca, current + Number(r.valor || 0));
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [registrosFiltrados]);

  // Top 5 fornecedores
  const topFornecedores = useMemo(() => {
    const map = new Map<string, number>();
    registrosFiltrados.forEach((r) => {
      if (r.fornecedor) {
        const current = map.get(r.fornecedor) || 0;
        map.set(r.fornecedor, current + Number(r.valor || 0));
      }
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([fornecedor, valor], index) => ({
        fornecedor,
        valor,
        fill: COLORS[index % COLORS.length],
      }));
  }, [registrosFiltrados]);

  // Valores por mês (orçado total, pago, previsto, atrasado)
  const valoresPorMes = useMemo(() => {
    const monthData = MONTHS.map((month) => {
      const registrosMes = registrosFiltrados.filter((r) => r.mes_numero === month.numero);
      
      const total = registrosMes.reduce((sum, r) => sum + Number(r.valor || 0), 0);
      const pago = registrosMes
        .filter((r) => r.status === 'pago')
        .reduce((sum, r) => sum + Number(r.valor || 0), 0);
      const previsto = registrosMes
        .filter((r) => r.status === 'previsto')
        .reduce((sum, r) => sum + Number(r.valor || 0), 0);
      const atrasado = registrosMes
        .filter((r) => r.status === 'atrasado')
        .reduce((sum, r) => sum + Number(r.valor || 0), 0);

      return {
        month: month.label.substring(0, 3),
        total,
        pago,
        previsto,
        atrasado,
      };
    });

    return monthData;
  }, [registrosFiltrados]);

  return (
    <div className="space-y-6">
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Geral</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total)}</div>
            <p className="text-xs text-muted-foreground">{stats.count} registros</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pago</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.pago)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.pago / stats.total) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Previsto</CardTitle>
            <FileText className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(stats.previsto)}
            </div>
            <p className="text-xs text-muted-foreground">A pagar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atrasado</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(stats.atrasado)}
            </div>
            <p className="text-xs text-muted-foreground">Requer atenção</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de valores por mês */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Valores por Mês</CardTitle>
        </CardHeader>
        <CardContent>
          {valoresPorMes.every(m => m.total === 0) ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Nenhum registro encontrado
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={valoresPorMes} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <YAxis tickFormatter={formatCurrencyShort} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="pago" name="Pago" stackId="a" fill="hsl(142, 76%, 36%)" />
                <Bar dataKey="previsto" name="Previsto" stackId="a" fill="hsl(48, 96%, 53%)" />
                <Bar dataKey="atrasado" name="Atrasado" stackId="a" fill="hsl(0, 84%, 60%)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Gráficos de distribuição */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Fornecedores */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 5 Fornecedores</CardTitle>
          </CardHeader>
          <CardContent>
            {topFornecedores.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Nenhum registro encontrado
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart 
                  data={topFornecedores} 
                  layout="vertical" 
                  margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={true} vertical={false} />
                  <XAxis 
                    type="number" 
                    tickFormatter={formatCurrencyShort} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
                  />
                  <YAxis 
                    type="category" 
                    dataKey="fornecedor" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
                    width={100}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="valor" name="Valor" radius={[0, 4, 4, 0]} barSize={24}>
                    {topFornecedores.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Por Tipo de Custo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por Tipo de Custo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {porTipoCusto.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum registro encontrado</p>
              ) : (
                porTipoCusto.map(([tipo, valor]) => (
                  <div key={tipo} className="flex items-center justify-between">
                    <span className="text-sm">{tipo}</span>
                    <span className="font-medium">{formatCurrency(valor)}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Por Marca */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Por Marca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {porMarca.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum registro encontrado</p>
            ) : (
              porMarca.map(([marca, valor]) => (
                <div key={marca} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">{marca}</span>
                  <span className="font-bold">{formatCurrency(valor)}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
