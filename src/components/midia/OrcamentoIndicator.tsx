import { useOrcamentoSaldo } from '@/hooks/useOrcamentos';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/components/midia/shared/formatters';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface OrcamentoIndicatorProps {
  tipo: 'midia_on' | 'midia_off' | 'eventos' | 'brindes';
  marca: string;
  unidade: string | null;
  mesNumero: number;
  ano: number;
}

export const OrcamentoIndicator = ({ tipo, marca, unidade, mesNumero, ano }: OrcamentoIndicatorProps) => {
  const { saldo, loading } = useOrcamentoSaldo(tipo, marca, unidade, mesNumero, ano);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Carregando orçamento...</span>
      </div>
    );
  }

  if (!saldo) {
    return (
      <div className="flex items-center gap-2 text-yellow-600 text-sm">
        <AlertCircle className="h-4 w-4" />
        <span>Nenhum orçamento aprovado para este período</span>
      </div>
    );
  }

  const totalOrcamento = saldo.valor_orcado + saldo.verba_extra;
  const percentualUtilizado = totalOrcamento > 0 ? (saldo.valor_utilizado / totalOrcamento) * 100 : 0;
  const isOverBudget = saldo.saldo_disponivel < 0;
  const isNearLimit = percentualUtilizado >= 80 && !isOverBudget;

  return (
    <div className="p-4 rounded-lg border bg-card space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Orçamento Disponível</span>
        {isOverBudget ? (
          <Badge variant="destructive">Excedido</Badge>
        ) : isNearLimit ? (
          <Badge variant="outline" className="border-yellow-500 text-yellow-600">Atenção</Badge>
        ) : (
          <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Dentro do limite</Badge>
        )}
      </div>

      <Progress 
        value={Math.min(percentualUtilizado, 100)} 
        className={`h-2 ${isOverBudget ? '[&>div]:bg-destructive' : isNearLimit ? '[&>div]:bg-yellow-500' : ''}`}
      />

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground block">Orçado</span>
          <span className="font-medium">{formatCurrency(saldo.valor_orcado)}</span>
          {saldo.verba_extra > 0 && (
            <span className="text-green-600 block">+{formatCurrency(saldo.verba_extra)} extra</span>
          )}
        </div>
        <div>
          <span className="text-muted-foreground block">Utilizado</span>
          <span className="font-medium">{formatCurrency(saldo.valor_utilizado)}</span>
          <span className="text-muted-foreground block">({percentualUtilizado.toFixed(1)}%)</span>
        </div>
        <div>
          <span className="text-muted-foreground block">Saldo</span>
          <span className={`font-medium ${isOverBudget ? 'text-destructive' : 'text-green-600'}`}>
            {formatCurrency(saldo.saldo_disponivel)}
          </span>
        </div>
      </div>
    </div>
  );
};
