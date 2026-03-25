import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MidiaKPICards } from '../MidiaKPICards';
import { MidiaBrandChart } from '../MidiaBrandChart';
import { MidiaEvolutionChart } from '../MidiaEvolutionChart';
import { SyncedCampaignsSection } from '../SyncedCampaignsSection';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

interface MidiaOnTabProps {
  kpis: {
    totalOrcado: number;
    totalRealizado: number;
    saldoRemanescente: number;
    percentualExecutado: number;
  };
  fornecedorBreakdown: Array<{ fornecedor: string; valor: number; quantidade: number }>;
  brandBreakdown: Array<{ marca: string; orcado: number; realizado: number }>;
  investmentEvolution: Array<{ month: string; orcado: number; realizado: number }>;
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

// Mapeamento de fornecedores para tipos de mídia
const getTipoMidiaFromFornecedor = (fornecedor: string): string => {
  const lower = fornecedor.toLowerCase();
  if (lower.includes('meta') || lower.includes('facebook') || lower.includes('instagram')) return 'Meta';
  if (lower.includes('google') && (lower.includes('search') || lower.includes('pesquisa'))) return 'Google Search';
  if (lower.includes('google') && (lower.includes('display') || lower.includes('rede de display'))) return 'Google Display';
  if (lower.includes('google')) return 'Google Ads';
  if (lower.includes('tiktok')) return 'TikTok';
  if (lower.includes('linkedin')) return 'LinkedIn';
  if (lower.includes('twitter') || lower.includes('x ads')) return 'X (Twitter)';
  if (lower.includes('youtube')) return 'YouTube';
  return fornecedor || 'Outros';
};

export const MidiaOnTab = ({ kpis, fornecedorBreakdown, brandBreakdown, investmentEvolution }: MidiaOnTabProps) => {
  // Agrupar por tipo de mídia
  const tipoMidiaData = fornecedorBreakdown.reduce((acc, item) => {
    const tipo = getTipoMidiaFromFornecedor(item.fornecedor);
    const existing = acc.find(t => t.name === tipo);
    if (existing) {
      existing.value += item.valor;
      existing.quantidade += item.quantidade;
    } else {
      acc.push({ name: tipo, value: item.valor, quantidade: item.quantidade });
    }
    return acc;
  }, [] as Array<{ name: string; value: number; quantidade: number }>);

  return (
    <div className="space-y-6">
      <MidiaKPICards kpis={kpis} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução Mensal */}
        <MidiaEvolutionChart data={investmentEvolution} />

        {/* Investimento por Tipo de Mídia (Pie Chart) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Investimento por Tipo de Mídia</CardTitle>
          </CardHeader>
          <CardContent>
            {tipoMidiaData.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Sem dados para exibir
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={tipoMidiaData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {tipoMidiaData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Quantidade de Anúncios por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quantidade de Anúncios por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            {tipoMidiaData.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Sem dados para exibir
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={tipoMidiaData.sort((a, b) => b.quantidade - a.quantidade)} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="quantidade" name="Quantidade" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Investimento por Fornecedor */}
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
                <BarChart data={fornecedorBreakdown.slice(0, 10)} layout="vertical" margin={{ left: 20, right: 20 }}>
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

        {/* Quantidade de Anúncios por Fornecedor */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quantidade de Anúncios por Fornecedor</CardTitle>
          </CardHeader>
          <CardContent>
            {fornecedorBreakdown.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Sem dados para exibir
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={fornecedorBreakdown.slice(0, 10).sort((a, b) => b.quantidade - a.quantidade)} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis type="category" dataKey="fornecedor" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="quantidade" name="Quantidade" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Marca */}
      <MidiaBrandChart data={brandBreakdown} />

      {/* Campanhas Sincronizadas */}
      <SyncedCampaignsSection />
    </div>
  );
};
