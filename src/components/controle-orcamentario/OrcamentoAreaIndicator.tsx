import { useOrcamentoAreaSaldo } from '@/hooks/useOrcamentoAreaSaldo';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface OrcamentoAreaIndicatorProps {
  tipoCustoId?: string;
  tipoCustoNome: string;
  marca: string;
  ano: number;
  valorAtual?: number;
}

export const OrcamentoAreaIndicator = ({
  tipoCustoId,
  tipoCustoNome,
  marca,
  ano,
  valorAtual = 0,
}: OrcamentoAreaIndicatorProps) => {
  const { saldo, loading } = useOrcamentoAreaSaldo(tipoCustoId, tipoCustoNome, marca, ano);

  if (!tipoCustoNome || !marca) return null;

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Carregando orçamento...</span>
        </div>
      </Card>
    );
  }

  if (!saldo) {
    return (
      <Alert variant="destructive" className="bg-destructive/10">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Nenhum orçamento aprovado encontrado para <strong>{tipoCustoNome}</strong> - <strong>{marca}</strong> em {ano}.
        </AlertDescription>
      </Alert>
    );
  }

  const percentualUtilizado = saldo.valorOrcado > 0 
    ? Math.min((saldo.valorUtilizado / saldo.valorOrcado) * 100, 100) 
    : 0;
  
  const saldoDisponivel = saldo.saldoDisponivel;
  const saldoAposLancamento = saldoDisponivel - valorAtual;
  
  const isOverBudget = saldoDisponivel < 0;
  const willExceed = saldoAposLancamento < 0 && saldoDisponivel >= 0;
  const isNearLimit = percentualUtilizado >= 80 && !isOverBudget;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">Orçamento: {tipoCustoNome}</span>
          <Badge variant="outline" className="text-xs">{marca}</Badge>
        </div>
        <div className="flex items-center gap-1">
          {isOverBudget ? (
            <>
              <XCircle className="h-4 w-4 text-destructive" />
              <Badge variant="destructive">Excedido</Badge>
            </>
          ) : willExceed ? (
            <>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <Badge className="bg-orange-500 hover:bg-orange-600">Vai Exceder</Badge>
            </>
          ) : isNearLimit ? (
            <>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">Atenção</Badge>
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <Badge className="bg-green-500 hover:bg-green-600">Disponível</Badge>
            </>
          )}
        </div>
      </div>

      <Progress 
        value={percentualUtilizado} 
        className={`h-2 ${isOverBudget ? 'bg-destructive/20' : isNearLimit ? 'bg-yellow-100' : 'bg-muted'}`}
      />

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Orçado</span>
          <p className="font-semibold">{formatCurrency(saldo.valorOrcado)}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Utilizado</span>
          <p className="font-semibold">{formatCurrency(saldo.valorUtilizado)}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Saldo</span>
          <p className={`font-semibold ${saldoDisponivel < 0 ? 'text-destructive' : 'text-green-600'}`}>
            {formatCurrency(saldoDisponivel)}
          </p>
        </div>
      </div>

      {valorAtual > 0 && (
        <div className="pt-2 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Após este lançamento:</span>
            <span className={`font-semibold ${saldoAposLancamento < 0 ? 'text-destructive' : 'text-green-600'}`}>
              {formatCurrency(saldoAposLancamento)}
            </span>
          </div>
          {willExceed && (
            <p className="text-xs text-orange-600 mt-1">
              ⚠️ Este lançamento fará o orçamento ser excedido em {formatCurrency(Math.abs(saldoAposLancamento))}
            </p>
          )}
        </div>
      )}
    </Card>
  );
};
