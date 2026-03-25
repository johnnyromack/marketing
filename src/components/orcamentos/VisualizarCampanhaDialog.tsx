import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/components/midia/shared/formatters';
import { MONTHS, TIPOS_MIDIA } from '@/components/midia/shared/constants';
import { CampanhaCompleta, useCampanhas } from '@/hooks/useCampanhas';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campanhaId: string;
}

export const VisualizarCampanhaDialog = ({ open, onOpenChange, campanhaId }: Props) => {
  const { getCampanhaCompleta } = useCampanhas();
  const [loading, setLoading] = useState(true);
  const [campanha, setCampanha] = useState<CampanhaCompleta | null>(null);

  useEffect(() => {
    if (open && campanhaId) {
      loadCampanha();
    }
  }, [open, campanhaId]);

  const loadCampanha = async () => {
    setLoading(true);
    const data = await getCampanhaCompleta(campanhaId);
    setCampanha(data);
    setLoading(false);
  };

  const getTipoLabel = (value: string) => {
    return TIPOS_MIDIA.find(t => t.value === value)?.label || value;
  };

  const getMesLabel = (mes: number) => {
    return MONTHS.find(m => m.value === mes)?.label || '';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'rascunho':
        return <Badge variant="secondary">Rascunho</Badge>;
      case 'pendente':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Pendente</Badge>;
      case 'aprovado':
        return <Badge className="bg-green-600">Aprovado</Badge>;
      case 'rejeitado':
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!campanha) {
    return null;
  }

  const totalDistribuido = campanha.distribuicoes.reduce((sum, d) => sum + Number(d.valor_alocado), 0);
  const saldo = campanha.orcamento_total - totalDistribuido;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            📊 Visualização da Campanha
          </DialogTitle>
          <DialogDescription>
            Detalhes completos do orçamento e distribuição
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações da campanha */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                Dados Gerais
                {getStatusBadge(campanha.status)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Marca</p>
                  <p className="font-medium">{campanha.marca}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Unidade</p>
                  <p className="font-medium">{campanha.unidade || 'Geral'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Início</p>
                  <p className="font-medium">{getMesLabel(campanha.mes_inicio)}/{campanha.ano_inicio}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fim</p>
                  <p className="font-medium">{getMesLabel(campanha.mes_fim)}/{campanha.ano_fim}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumo financeiro */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Orçamento Total</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(campanha.orcamento_total)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Distribuído</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalDistribuido)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saldo</p>
                  <p className={`text-2xl font-bold ${saldo < 0 ? 'text-destructive' : 'text-green-600'}`}>
                    {formatCurrency(saldo)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Distribuição por tipo de mídia */}
          {campanha.distribuicoes.length > 0 ? (
            <div className="space-y-4">
              <h3 className="font-semibold">Distribuição por Tipo de Mídia</h3>
              
              {campanha.distribuicoes.map((dist) => (
                <Card key={dist.id}>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      {getTipoLabel(dist.tipo_midia)}
                      <span className="text-primary font-mono">{formatCurrency(Number(dist.valor_alocado))}</span>
                    </CardTitle>
                  </CardHeader>

                  {dist.mensais.length > 0 && (
                    <CardContent className="pt-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Mês/Ano</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead className="text-right">Verba Extra</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead>Observações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dist.mensais.map((mensal) => (
                            <TableRow key={mensal.id}>
                              <TableCell className="font-medium">
                                {getMesLabel(mensal.mes)}/{mensal.ano}
                              </TableCell>
                              <TableCell className="text-right">{formatCurrency(Number(mensal.valor_alocado))}</TableCell>
                              <TableCell className="text-right">{formatCurrency(Number(mensal.verba_extra))}</TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(Number(mensal.valor_alocado) + Number(mensal.verba_extra))}
                              </TableCell>
                              <TableCell className="text-muted-foreground">{mensal.observacoes || '-'}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/50">
                            <TableCell className="font-bold">Total</TableCell>
                            <TableCell className="text-right font-bold">
                              {formatCurrency(dist.mensais.reduce((s, m) => s + Number(m.valor_alocado), 0))}
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              {formatCurrency(dist.mensais.reduce((s, m) => s + Number(m.verba_extra), 0))}
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              {formatCurrency(dist.mensais.reduce((s, m) => s + Number(m.valor_alocado) + Number(m.verba_extra), 0))}
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">Nenhuma distribuição cadastrada ainda.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
