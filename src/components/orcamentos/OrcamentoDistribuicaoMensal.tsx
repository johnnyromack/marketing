import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Save, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { MONTHS, YEARS } from '@/components/midia/shared/constants';
import { formatCurrency } from '@/components/midia/shared/formatters';
import { toast } from 'sonner';

export interface DistribuicaoMensal {
  id?: string;
  mes_numero: number;
  mes: string;
  ano: number;
  valor_orcado: number;
  verba_extra: number;
  observacoes: string;
  status: string;
}

interface Props {
  orcamentoTotalId: string;
  marca: string;
  tipo: string;
  unidade: string | null;
  orcamentoAnoVigente: number;
  anoVigente: number;
  orcamentoAnoSeguinte: number;
  anoSeguinte: number;
  distribuicoes: DistribuicaoMensal[];
  onSaveDistribuicoes: (items: DistribuicaoMensal[]) => Promise<void>;
  onClose: () => void;
  loading?: boolean;
}

export const OrcamentoDistribuicaoMensal = ({
  marca,
  tipo,
  unidade,
  orcamentoAnoVigente,
  anoVigente,
  orcamentoAnoSeguinte,
  anoSeguinte,
  distribuicoes,
  onSaveDistribuicoes,
  onClose,
  loading = false
}: Props) => {
  const [items, setItems] = useState<DistribuicaoMensal[]>(distribuicoes);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setItems(distribuicoes);
  }, [distribuicoes]);

  // Calculate totals by year
  const totalAnoVigente = items
    .filter(i => i.ano === anoVigente)
    .reduce((sum, i) => sum + i.valor_orcado + i.verba_extra, 0);

  const totalAnoSeguinte = items
    .filter(i => i.ano === anoSeguinte)
    .reduce((sum, i) => sum + i.valor_orcado + i.verba_extra, 0);

  const saldoAnoVigente = orcamentoAnoVigente - totalAnoVigente;
  const saldoAnoSeguinte = orcamentoAnoSeguinte - totalAnoSeguinte;

  const addItem = () => {
    const nextMonth = items.length > 0 
      ? (items[items.length - 1].mes_numero % 12) + 1 
      : 1;
    const year = nextMonth === 1 && items.length > 0 
      ? items[items.length - 1].ano + 1 
      : (items.length > 0 ? items[items.length - 1].ano : anoVigente);
    
    setItems([...items, {
      mes_numero: nextMonth,
      mes: MONTHS.find(m => m.value === nextMonth)?.label || '',
      ano: year,
      valor_orcado: 0,
      verba_extra: 0,
      observacoes: '',
      status: 'rascunho'
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof DistribuicaoMensal, value: string | number) => {
    const updated = [...items];
    if (field === 'mes_numero') {
      updated[index] = {
        ...updated[index],
        mes_numero: value as number,
        mes: MONTHS.find(m => m.value === value)?.label || ''
      };
    } else if (field === 'ano') {
      updated[index] = { ...updated[index], ano: value as number };
    } else if (field === 'valor_orcado') {
      updated[index] = { ...updated[index], valor_orcado: value as number };
    } else if (field === 'verba_extra') {
      updated[index] = { ...updated[index], verba_extra: value as number };
    } else if (field === 'observacoes') {
      updated[index] = { ...updated[index], observacoes: value as string };
    } else if (field === 'status') {
      updated[index] = { ...updated[index], status: value as string };
    }
    setItems(updated);
  };

  const handleSave = async () => {
    // Validate no negative balance
    if (saldoAnoVigente < 0) {
      toast.error(`Distribuição do ano ${anoVigente} excede o orçamento em ${formatCurrency(Math.abs(saldoAnoVigente))}`);
      return;
    }
    if (saldoAnoSeguinte < 0) {
      toast.error(`Distribuição do ano ${anoSeguinte} excede o orçamento em ${formatCurrency(Math.abs(saldoAnoSeguinte))}`);
      return;
    }

    setIsSaving(true);
    try {
      await onSaveDistribuicoes(items);
      toast.success('Distribuição mensal salva com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar distribuição');
    } finally {
      setIsSaving(false);
    }
  };

  const tipoLabel = {
    midia_on: 'Mídia On',
    midia_off: 'Mídia Off',
    eventos: 'Eventos',
    brindes: 'Brindes'
  }[tipo] || tipo;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">📅</span>
          Distribuição Mensal
        </CardTitle>
        <CardDescription>
          {marca} - {tipoLabel} {unidade ? `(${unidade})` : '(Geral)'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className={`${saldoAnoVigente < 0 ? 'border-destructive bg-destructive/5' : 'border-primary/20 bg-primary/5'}`}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                {saldoAnoVigente < 0 ? (
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-primary" />
                )}
                <span className="font-semibold text-lg">{anoVigente}</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Orçamento:</span>
                  <span className="font-medium">{formatCurrency(orcamentoAnoVigente)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Distribuído:</span>
                  <span className="font-medium">{formatCurrency(totalAnoVigente)}</span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span className="text-muted-foreground">Saldo:</span>
                  <span className={`font-bold ${saldoAnoVigente < 0 ? 'text-destructive' : 'text-primary'}`}>
                    {formatCurrency(saldoAnoVigente)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {orcamentoAnoSeguinte > 0 && (
            <Card className={`${saldoAnoSeguinte < 0 ? 'border-destructive bg-destructive/5' : 'border-primary/20 bg-primary/5'}`}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  {saldoAnoSeguinte < 0 ? (
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  )}
                  <span className="font-semibold text-lg">{anoSeguinte}</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Orçamento:</span>
                    <span className="font-medium">{formatCurrency(orcamentoAnoSeguinte)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Distribuído:</span>
                    <span className="font-medium">{formatCurrency(totalAnoSeguinte)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span className="text-muted-foreground">Saldo:</span>
                    <span className={`font-bold ${saldoAnoSeguinte < 0 ? 'text-destructive' : 'text-primary'}`}>
                      {formatCurrency(saldoAnoSeguinte)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Distribution Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Mês</TableHead>
                <TableHead className="w-24">Ano</TableHead>
                <TableHead>Valor Orçado</TableHead>
                <TableHead>Verba Extra</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground mb-4">Nenhuma distribuição mensal cadastrada.</p>
                    <Button variant="outline" onClick={addItem} disabled={loading}>
                      <Plus className="h-4 w-4 mr-2" /> Adicionar primeiro mês
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Select
                        value={item.mes_numero.toString()}
                        onValueChange={(v) => updateItem(index, 'mes_numero', parseInt(v))}
                      >
                        <SelectTrigger className="h-8 w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MONTHS.map(m => (
                            <SelectItem key={m.value} value={m.value.toString()}>
                              {m.label.substring(0, 3)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={item.ano.toString()}
                        onValueChange={(v) => updateItem(index, 'ano', parseInt(v))}
                      >
                        <SelectTrigger className="h-8 w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {YEARS.map(y => (
                            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <CurrencyInput
                        value={item.valor_orcado}
                        onChange={(v) => updateItem(index, 'valor_orcado', v)}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <CurrencyInput
                        value={item.verba_extra}
                        onChange={(v) => updateItem(index, 'verba_extra', v)}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.observacoes}
                        onChange={(e) => updateItem(index, 'observacoes', e.target.value)}
                        className="h-8"
                        placeholder="Obs..."
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        className="h-8 w-8 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Add Row Button */}
        <Button variant="outline" onClick={addItem} disabled={loading} className="w-full">
          <Plus className="h-4 w-4 mr-2" /> Adicionar Mês
        </Button>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <Button onClick={handleSave} disabled={isSaving || loading}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Distribuição
          </Button>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
