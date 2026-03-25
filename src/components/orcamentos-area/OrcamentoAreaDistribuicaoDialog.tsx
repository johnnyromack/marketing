import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Save, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { MONTHS, YEARS } from '@/components/midia/shared/constants';
import { formatCurrency } from '@/components/midia/shared/formatters';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface DistribuicaoItem {
  id?: string;
  mes: number;
  ano: number;
  valor_orcado: number;
  verba_extra: number;
  observacoes: string;
}

interface OrcamentoAreaDistribuicaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orcamentoId: string;
  marca: string;
  tipoCustoNome: string;
  valorTotal: number;
  ano: number;
  onSaved?: () => void;
}

export const OrcamentoAreaDistribuicaoDialog = ({
  open,
  onOpenChange,
  orcamentoId,
  marca,
  tipoCustoNome,
  valorTotal,
  ano,
  onSaved,
}: OrcamentoAreaDistribuicaoDialogProps) => {
  const [items, setItems] = useState<DistribuicaoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && orcamentoId) {
      fetchDistribuicao();
    }
  }, [open, orcamentoId]);

  const fetchDistribuicao = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orcamento_area_distribuicao')
        .select('*')
        .eq('orcamento_id', orcamentoId)
        .order('ano')
        .order('mes');

      if (error) throw error;

      setItems((data || []).map(d => ({
        id: d.id,
        mes: d.mes,
        ano: d.ano,
        valor_orcado: Number(d.valor_orcado),
        verba_extra: Number(d.verba_extra),
        observacoes: d.observacoes || '',
      })));
    } catch (error) {
      console.error('Erro ao buscar distribuição:', error);
      toast.error('Erro ao carregar distribuição');
    } finally {
      setLoading(false);
    }
  };

  const totalDistribuido = items.reduce((sum, i) => sum + i.valor_orcado + i.verba_extra, 0);
  const saldo = valorTotal - totalDistribuido;

  const addItem = () => {
    const nextMonth = items.length > 0 
      ? (items[items.length - 1].mes % 12) + 1 
      : 1;
    const year = nextMonth === 1 && items.length > 0 
      ? items[items.length - 1].ano + 1 
      : (items.length > 0 ? items[items.length - 1].ano : ano);
    
    setItems([...items, {
      mes: nextMonth,
      ano: year,
      valor_orcado: 0,
      verba_extra: 0,
      observacoes: '',
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof DistribuicaoItem, value: string | number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSave = async () => {
    if (saldo < 0) {
      toast.error(`Distribuição excede o orçamento em ${formatCurrency(Math.abs(saldo))}`);
      return;
    }

    setSaving(true);
    try {
      // Delete existing
      await supabase
        .from('orcamento_area_distribuicao')
        .delete()
        .eq('orcamento_id', orcamentoId);

      // Insert new
      if (items.length > 0) {
        const toInsert = items.map(i => ({
          orcamento_id: orcamentoId,
          mes: i.mes,
          ano: i.ano,
          valor_orcado: i.valor_orcado,
          verba_extra: i.verba_extra,
          observacoes: i.observacoes || null,
        }));

        const { error } = await supabase
          .from('orcamento_area_distribuicao')
          .insert(toInsert);

        if (error) throw error;
      }

      toast.success('Distribuição salva!');
      onSaved?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast.error(error.message || 'Erro ao salvar distribuição');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            📅 Distribuição Mensal
          </DialogTitle>
          <DialogDescription>
            {marca} - {tipoCustoNome} ({ano})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Card */}
          <Card className={saldo < 0 ? 'border-destructive bg-destructive/5' : 'border-primary/20 bg-primary/5'}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                {saldo < 0 ? (
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-primary" />
                )}
                <span className="font-semibold">Resumo do Orçamento</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Orçado:</span>
                  <p className="font-medium">{formatCurrency(valorTotal)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Distribuído:</span>
                  <p className="font-medium">{formatCurrency(totalDistribuido)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Saldo:</span>
                  <p className={`font-bold ${saldo < 0 ? 'text-destructive' : 'text-primary'}`}>
                    {formatCurrency(saldo)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
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
                        <Button variant="outline" onClick={addItem}>
                          <Plus className="h-4 w-4 mr-2" /> Adicionar primeiro mês
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Select
                            value={String(item.mes)}
                            onValueChange={(v) => updateItem(index, 'mes', parseInt(v))}
                          >
                            <SelectTrigger className="h-8 w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {MONTHS.map(m => (
                                <SelectItem key={m.value} value={String(m.value)}>
                                  {m.label.substring(0, 3)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={String(item.ano)}
                            onValueChange={(v) => updateItem(index, 'ano', parseInt(v))}
                          >
                            <SelectTrigger className="h-8 w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {YEARS.map(y => (
                                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
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
          )}

          {/* Add Button */}
          {items.length > 0 && (
            <Button variant="outline" onClick={addItem} className="w-full">
              <Plus className="h-4 w-4 mr-2" /> Adicionar Mês
            </Button>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar Distribuição
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
