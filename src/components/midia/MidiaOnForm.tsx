import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { FornecedorCombobox } from '@/components/ui/fornecedor-combobox';
import { useToast } from '@/hooks/use-toast';
import { useActivityLog } from '@/hooks/useActivityLog';
import { Loader2, Save, Trash2, Edit, Send } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { MONTHS, YEARS } from './shared/constants';
import { useMarcasUnidadesData } from '@/hooks/useMarcasUnidadesData';
import { useStatusBadge } from './shared/useStatusBadge';
import { formatCurrency } from './shared/formatters';
import { OrcamentoIndicator } from './OrcamentoIndicator';
import { useOrcamentoSaldo } from '@/hooks/useOrcamentos';
import { CsvImportDialog } from './CsvImportDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type MidiaOn = Tables<'midia_on'>;

interface FormData {
  mes_numero: number;
  mes: string;
  ano: number;
  marca: string;
  unidade: string;
  fornecedor: string;
  orcamento_on: number;
  valor_midia: number;
  valor_realizado: number;
  diario: number;
  observacoes: string;
}

const initialFormData: FormData = {
  mes_numero: 1,
  mes: 'Janeiro',
  ano: 2025,
  marca: '',
  unidade: 'Geral',
  fornecedor: '',
  orcamento_on: 0,
  valor_midia: 0,
  valor_realizado: 0,
  diario: 0,
  observacoes: '',
};

export const MidiaOnForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { logActivity } = useActivityLog();
  const { getStatusBadge } = useStatusBadge();
  const { marcasNomes, getUnidadesByMarcaNome, loading: loadingMarcas } = useMarcasUnidadesData();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [existingData, setExistingData] = useState<MidiaOn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Hook para buscar orçamento aprovado
  const { saldo: orcamentoSaldo } = useOrcamentoSaldo(
    'midia_on',
    formData.marca,
    formData.unidade || null,
    formData.mes_numero,
    formData.ano
  );

  // Auto-preencher orçamento quando tiver saldo disponível e não estiver editando
  useEffect(() => {
    if (orcamentoSaldo && !editingId) {
      const totalOrcamento = orcamentoSaldo.valor_orcado + orcamentoSaldo.verba_extra;
      setFormData(prev => ({ ...prev, orcamento_on: totalOrcamento }));
    }
  }, [orcamentoSaldo, editingId]);

  useEffect(() => {
    if (user) fetchExistingData();
  }, [user]);

  const fetchExistingData = async () => {
    if (!user) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('midia_on')
      .select('*')
      .order('ano', { ascending: false })
      .order('mes_numero', { ascending: false });

    if (error) {
      toast({ title: 'Erro', description: 'Erro ao carregar dados', variant: 'destructive' });
    } else {
      setExistingData(data || []);
    }
    setIsLoading(false);
  };

  const handleMonthChange = (monthNumber: number) => {
    const month = MONTHS.find(m => m.value === monthNumber)?.label || '';
    setFormData(prev => ({ ...prev, mes_numero: monthNumber, mes: month }));
  };

  const handleMarcaChange = (marca: string) => {
    const unidadesDisponiveis = getUnidadesByMarcaNome(marca);
    setFormData(prev => ({ ...prev, marca, unidade: unidadesDisponiveis[0] || 'Geral' }));
  };

  const unidadesDisponiveis = formData.marca
    ? getUnidadesByMarcaNome(formData.marca)
    : ['Geral'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.marca || !formData.fornecedor) {
      toast({ title: 'Erro', description: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    const dataToSave = { ...formData, user_id: user.id };

    if (editingId) {
      const { error } = await supabase.from('midia_on').update(dataToSave).eq('id', editingId);
      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      } else {
        await logActivity('update', 'midia_on', editingId, { marca: formData.marca, fornecedor: formData.fornecedor, valor: formData.valor_realizado });
        toast({ title: 'Sucesso', description: 'Dados atualizados!' });
        setEditingId(null);
        setFormData(initialFormData);
        fetchExistingData();
      }
    } else {
      const { data, error } = await supabase.from('midia_on').insert(dataToSave).select('id').single();
      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      } else {
        await logActivity('insert', 'midia_on', data?.id || null, { marca: formData.marca, fornecedor: formData.fornecedor, valor: formData.valor_realizado });
        toast({ title: 'Sucesso', description: 'Dados salvos!' });
        setFormData(initialFormData);
        fetchExistingData();
      }
    }
    setIsSaving(false);
  };

  const handleEdit = (item: MidiaOn) => {
    setEditingId(item.id);
    setFormData({
      mes_numero: item.mes_numero,
      mes: item.mes,
      ano: item.ano,
      marca: item.marca,
      unidade: item.unidade,
      fornecedor: item.fornecedor,
      orcamento_on: Number(item.orcamento_on),
      valor_midia: Number(item.valor_midia),
      valor_realizado: Number(item.valor_realizado),
      diario: Number(item.diario),
      observacoes: item.observacoes || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;
    const item = existingData.find(d => d.id === id);
    const { error } = await supabase.from('midia_on').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      await logActivity('delete', 'midia_on', id, { marca: item?.marca, fornecedor: item?.fornecedor });
      toast({ title: 'Sucesso', description: 'Registro excluído!' });
      fetchExistingData();
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(initialFormData);
  };

  const handleSendForApproval = async (id: string) => {
    const { error } = await supabase.from('midia_on').update({ status: 'pendente' }).eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      await logActivity('status_change', 'midia_on', id, { new_status: 'pendente' });
      toast({ title: 'Sucesso', description: 'Enviado para aprovação!' });
      fetchExistingData();
    }
  };

  // Calculate delta
  const delta = formData.orcamento_on - formData.valor_realizado;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {editingId ? 'Editar Mídia On' : 'Nova Mídia On'}
                {editingId && (
                  <Button variant="outline" size="sm" onClick={cancelEdit}>Cancelar</Button>
                )}
              </CardTitle>
              <CardDescription>Cadastre investimentos em mídia online</CardDescription>
            </div>
            <CsvImportDialog 
              onImportSuccess={fetchExistingData} 
              marcas={marcasNomes}
            />
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Mês</Label>
                <Select value={formData.mes_numero.toString()} onValueChange={(v) => handleMonthChange(parseInt(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ano</Label>
                <Select value={formData.ano.toString()} onValueChange={(v) => setFormData(prev => ({ ...prev, ano: parseInt(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Marca *</Label>
                <Select value={formData.marca} onValueChange={handleMarcaChange} disabled={loadingMarcas}>
                  <SelectTrigger><SelectValue placeholder={loadingMarcas ? "Carregando..." : "Selecione"} /></SelectTrigger>
                  <SelectContent>
                    {marcasNomes.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unidade</Label>
                <Select value={formData.unidade} onValueChange={(v) => setFormData(prev => ({ ...prev, unidade: v }))} disabled={!formData.marca}>
                  <SelectTrigger><SelectValue placeholder="Selecione a marca primeiro" /></SelectTrigger>
                  <SelectContent>
                    {unidadesDisponiveis.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fornecedor *</Label>
                <FornecedorCombobox
                  value={formData.fornecedor}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, fornecedor: v }))}
                  tipo="midia_on"
                  placeholder="Selecione o fornecedor"
                />
              </div>
            </div>

            {/* Budget Indicator */}
            {formData.marca && (
              <OrcamentoIndicator
                tipo="midia_on"
                marca={formData.marca}
                unidade={formData.unidade || null}
                mesNumero={formData.mes_numero}
                ano={formData.ano}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Orçamento On</Label>
                <CurrencyInput value={formData.orcamento_on} onChange={(v) => setFormData(prev => ({ ...prev, orcamento_on: v }))} />
              </div>
              <div className="space-y-2">
                <Label>Valor Mídia</Label>
                <CurrencyInput value={formData.valor_midia} onChange={(v) => setFormData(prev => ({ ...prev, valor_midia: v }))} />
              </div>
              <div className="space-y-2">
                <Label>Valor Realizado</Label>
                <CurrencyInput value={formData.valor_realizado} onChange={(v) => setFormData(prev => ({ ...prev, valor_realizado: v }))} />
              </div>
              <div className="space-y-2">
                <Label>Delta (calculado)</Label>
                <Input value={formatCurrency(delta)} disabled className={delta >= 0 ? 'text-green-600' : 'text-red-600'} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Diário</Label>
                <CurrencyInput value={formData.diario} onChange={(v) => setFormData(prev => ({ ...prev, diario: v }))} />
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea value={formData.observacoes} onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))} rows={2} />
              </div>
            </div>

            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {editingId ? 'Atualizar' : 'Salvar'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registros de Mídia On</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : existingData.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum registro encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês/Ano</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead className="text-right">Orçamento</TableHead>
                    <TableHead className="text-right">Realizado</TableHead>
                    <TableHead className="text-right">Delta</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {existingData.map((item) => {
                    const itemDelta = Number(item.orcamento_on) - Number(item.valor_realizado);
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{item.mes}/{item.ano}</TableCell>
                        <TableCell>{item.marca}</TableCell>
                        <TableCell>{item.unidade}</TableCell>
                        <TableCell>{item.fornecedor}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(item.orcamento_on))}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(item.valor_realizado))}</TableCell>
                        <TableCell className={`text-right ${itemDelta >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(itemDelta)}</TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {item.status === 'rascunho' && (
                              <>
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} title="Editar">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleSendForApproval(item.id)} title="Enviar para aprovação">
                                  <Send className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} disabled={item.status === 'aprovado'}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
