import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, TrendingUp, PiggyBank, Percent } from 'lucide-react';

interface MidiaKPICardsProps {
  kpis: {
    totalOrcado: number;
    totalRealizado: number;
    saldoRemanescente: number;
    percentualExecutado: number;
  };
}

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
};

export const MidiaKPICards = ({ kpis }: MidiaKPICardsProps) => {
  const cards = [
    {
      label: 'Orçamento Total',
      value: formatCurrency(kpis.totalOrcado),
      icon: <DollarSign className="h-5 w-5" />,
      color: 'text-primary',
    },
    {
      label: 'Total Realizado',
      value: formatCurrency(kpis.totalRealizado),
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-info',
    },
    {
      label: 'Saldo Remanescente',
      value: formatCurrency(kpis.saldoRemanescente),
      icon: <PiggyBank className="h-5 w-5" />,
      color: kpis.saldoRemanescente >= 0 ? 'text-success' : 'text-destructive',
    },
    {
      label: '% Executado',
      value: `${kpis.percentualExecutado.toFixed(1)}%`,
      icon: <Percent className="h-5 w-5" />,
      color: 'text-warning',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              </div>
              <div className={`p-3 rounded-full bg-muted ${card.color}`}>
                {card.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
