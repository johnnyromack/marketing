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
import { NumericInput } from '@/components/ui/numeric-input';
import { FornecedorCombobox } from '@/components/ui/fornecedor-combobox';
import { useToast } from '@/hooks/use-toast';
import { useActivityLog } from '@/hooks/useActivityLog';
import { Loader2, Save, Trash2, Edit } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { MONTHS, YEARS, CATEGORIAS_BRINDE } from './shared/constants';
import { useMarcasUnidadesData } from '@/hooks/useMarcasUnidadesData';
import { useStatusBadge } from './shared/useStatusBadge';
import { formatCurrency } from './shared/formatters';
import { OrcamentoIndicator } from './OrcamentoIndicator';
import { useOrcamentoSaldo } from '@/hooks/useOrcamentos';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Brinde = Tables<'brindes'>;

interface FormData {
  mes_numero: number;
  mes: string;
  ano: number;
  marca: string;
  unidade: string;
  descricao: string;
  categoria: string;
  fornecedor: string;
  quantidade: number;
  valor_unitario: number;
  valor_orcado: number;
  valor_realizado: number;
  observacoes: string;
}

const initialFormData: FormData = {
  mes_numero: 1,
  mes: 'Janeiro',
  ano: 2025,
  marca: '',
  unidade: 'Geral',
  descricao: '',
  categoria: '',
  fornecedor: '',
  quantidade: 0,
  valor_unitario: 0,
  valor_orcado: 0,
  valor_realizado: 0,
  observacoes: '',
};

export const BrindesForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { logActivity } = useActivityLog();
  const { getStatusBadge } = useStatusBadge();
  const { marcasNomes, getUnidadesByMarcaNome, loading: loadingMarcas } = useMarcasUnidadesData();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [existingData, setExistingData] = useState<Brinde[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Hook para buscar orçamento aprovado
  const { saldo: orcamentoSaldo } = useOrcamentoSaldo(
    'brindes',
    formData.marca,
    formData.unidade || null,
    formData.mes_numero,
    formData.ano
  );

  // Auto-preencher orçamento quando tiver saldo disponível e não estiver editando
  useEffect(() => {
    if (orcamentoSaldo && !editingId) {
      const totalOrcamento = orcamentoSaldo.valor_orcado + orcamentoSaldo.verba_extra;
      setFormData(prev => ({ ...prev, valor_orcado: totalOrcamento }));
    }
  }, [orcamentoSaldo, editingId]);

  useEffect(() => {
    if (user) fetchExistingData();
  }, [user]);

  const fetchExistingData = async () => {
    if (!user) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('brindes')
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

  // Auto-calculate valor_realizado based on quantidade * valor_unitario
  const valorCalculado = formData.quantidade * formData.valor_unitario;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.marca || !formData.descricao || !formData.categoria) {
      toast({ title: 'Erro', description: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    const dataToSave = { ...formData, user_id: user.id };

    if (editingId) {
      const { error } = await supabase.from('brindes').update(dataToSave).eq('id', editingId);
      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      } else {
        await logActivity('update', 'brindes', editingId, { descricao: formData.descricao, categoria: formData.categoria });
        toast({ title: 'Sucesso', description: 'Dados atualizados!' });
        setEditingId(null);
        setFormData(initialFormData);
        fetchExistingData();
      }
    } else {
      const { data, error } = await supabase.from('brindes').insert(dataToSave).select('id').single();
      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      } else {
        await logActivity('insert', 'brindes', data?.id || null, { descricao: formData.descricao, categoria: formData.categoria });
        toast({ title: 'Sucesso', description: 'Dados salvos!' });
        setFormData(initialFormData);
        fetchExistingData();
      }
    }
    setIsSaving(false);
  };

  const handleEdit = (item: Brinde) => {
    setEditingId(item.id);
    setFormData({
      mes_numero: item.mes_numero,
      mes: item.mes,
      ano: item.ano,
      marca: item.marca,
      unidade: item.unidade,
      descricao: item.descricao,
      categoria: item.categoria,
      fornecedor: item.fornecedor || '',
      quantidade: item.quantidade,
      valor_unitario: Number(item.valor_unitario),
      valor_orcado: Number(item.valor_orcado),
      valor_realizado: Number(item.valor_realizado),
      observacoes: item.observacoes || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;
    const item = existingData.find(d => d.id === id);
    const { error } = await supabase.from('brindes').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      await logActivity('delete', 'brindes', id, { descricao: item?.descricao, categoria: item?.categoria });
      toast({ title: 'Sucesso', description: 'Registro excluído!' });
      fetchExistingData();
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(initialFormData);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {editingId ? 'Editar Brinde' : 'Novo Brinde'}
            {editingId && (
              <Button variant="outline" size="sm" onClick={cancelEdit}>Cancelar</Button>
            )}
          </CardTitle>
          <CardDescription>Cadastre brindes e materiais promocionais</CardDescription>
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
                <Label>Categoria *</Label>
                <Select value={formData.categoria} onValueChange={(v) => setFormData(prev => ({ ...prev, categoria: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_BRINDE.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Indicador de Orçamento */}
            {formData.marca && (
              <OrcamentoIndicator
                tipo="brindes"
                marca={formData.marca}
                unidade={formData.unidade || null}
                mesNumero={formData.mes_numero}
                ano={formData.ano}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Descrição do Brinde *</Label>
                <Input value={formData.descricao} onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))} placeholder="Ex: Caneta personalizada" />
              </div>
              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <FornecedorCombobox
                  value={formData.fornecedor}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, fornecedor: v }))}
                  tipo="brindes"
                  placeholder="Selecione o fornecedor"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <NumericInput value={formData.quantidade} onChange={(v) => setFormData(prev => ({ ...prev, quantidade: v }))} />
              </div>
              <div className="space-y-2">
                <Label>Valor Unitário</Label>
                <CurrencyInput value={formData.valor_unitario} onChange={(v) => setFormData(prev => ({ ...prev, valor_unitario: v }))} />
              </div>
              <div className="space-y-2">
                <Label>Total Calculado</Label>
                <Input value={formatCurrency(valorCalculado)} disabled />
              </div>
              <div className="space-y-2">
                <Label>Valor Orçado</Label>
                <CurrencyInput value={formData.valor_orcado} onChange={(v) => setFormData(prev => ({ ...prev, valor_orcado: v }))} />
              </div>
              <div className="space-y-2">
                <Label>Valor Realizado</Label>
                <CurrencyInput value={formData.valor_realizado} onChange={(v) => setFormData(prev => ({ ...prev, valor_realizado: v }))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={formData.observacoes} onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))} rows={2} />
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
          <CardTitle>Brindes Cadastrados</CardTitle>
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
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Orçado</TableHead>
                    <TableHead className="text-right">Realizado</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {existingData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.mes}/{item.ano}</TableCell>
                      <TableCell>{item.marca}</TableCell>
                      <TableCell>{item.descricao}</TableCell>
                      <TableCell>{item.categoria}</TableCell>
                      <TableCell className="text-right">{item.quantidade}</TableCell>
                      <TableCell className="text-right">{formatCurrency(Number(item.valor_orcado))}</TableCell>
                      <TableCell className="text-right">{formatCurrency(Number(item.valor_realizado))}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} disabled={item.status === 'aprovado'}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
