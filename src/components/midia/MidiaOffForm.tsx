import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { FornecedorCombobox } from '@/components/ui/fornecedor-combobox';
import { AddressAutocomplete } from '@/components/maps/AddressAutocomplete';
import { useToast } from '@/hooks/use-toast';
import { useActivityLog } from '@/hooks/useActivityLog';
import { Loader2, Save, Trash2, Edit, MapPin } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { MONTHS, YEARS, TIPOS_MIDIA_OFF } from './shared/constants';
import { useMarcasUnidadesData } from '@/hooks/useMarcasUnidadesData';
import { useStatusBadge } from './shared/useStatusBadge';
import { formatCurrency } from './shared/formatters';
import { OrcamentoIndicator } from './OrcamentoIndicator';
import { useOrcamentoSaldo } from '@/hooks/useOrcamentos';
import { Checkbox } from '@/components/ui/checkbox';
import { MidiaOffAIImportDialog } from './MidiaOffAIImportDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type MidiaOff = Tables<'midia_off'>;

interface FormData {
  mes_numero: number;
  mes: string;
  ano: number;
  marca: string;
  unidade: string;
  localizacao: string;
  latitude: number | null;
  longitude: number | null;
  tipo_midia: string;
  fornecedor: string;
  orcamento_off: number;
  valor_midia: number;
  valor_realizado: number;
  saving_midia: number;
  valor_producao: number;
  realizado_producao: number;
  saving_producao: number;
  observacoes: string;
  data_contratacao: string;
  data_veiculacao_inicio: string;
  data_veiculacao_fim: string;
  bonificacao: boolean;
  anuncio_volante: boolean;
}

const initialFormData: FormData = {
  mes_numero: 1,
  mes: 'Janeiro',
  ano: 2026,
  marca: '',
  unidade: 'Geral',
  localizacao: '',
  latitude: null,
  longitude: null,
  tipo_midia: '',
  fornecedor: '',
  orcamento_off: 0,
  valor_midia: 0,
  valor_realizado: 0,
  saving_midia: 0,
  valor_producao: 0,
  realizado_producao: 0,
  saving_producao: 0,
  observacoes: '',
  data_contratacao: '',
  data_veiculacao_inicio: '',
  data_veiculacao_fim: '',
  bonificacao: false,
  anuncio_volante: false,
};

export const MidiaOffForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { logActivity } = useActivityLog();
  const { getStatusBadge } = useStatusBadge();
  const { marcasNomes, getUnidadesByMarcaNome, loading: loadingMarcas } = useMarcasUnidadesData();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [existingData, setExistingData] = useState<MidiaOff[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Hook para buscar orçamento aprovado
  const { saldo: orcamentoSaldo } = useOrcamentoSaldo(
    'midia_off',
    formData.marca,
    formData.unidade || null,
    formData.mes_numero,
    formData.ano
  );

  // Auto-preencher orçamento quando tiver saldo disponível e não estiver editando
  useEffect(() => {
    if (orcamentoSaldo && !editingId) {
      const totalOrcamento = orcamentoSaldo.valor_orcado + orcamentoSaldo.verba_extra;
      setFormData(prev => ({ ...prev, orcamento_off: totalOrcamento }));
    }
  }, [orcamentoSaldo, editingId]);

  useEffect(() => {
    if (user) fetchExistingData();
  }, [user]);

  const fetchExistingData = async () => {
    if (!user) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('midia_off')
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
    // Localização só é obrigatória se NÃO for anúncio volante
    if (!user || !formData.marca || !formData.tipo_midia || (!formData.anuncio_volante && !formData.localizacao)) {
      toast({ title: 'Erro', description: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    const dataToSave = { ...formData, user_id: user.id };

    if (editingId) {
      const { error } = await supabase.from('midia_off').update(dataToSave).eq('id', editingId);
      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      } else {
        await logActivity('update', 'midia_off', editingId, { marca: formData.marca, tipo: formData.tipo_midia, local: formData.localizacao });
        toast({ title: 'Sucesso', description: 'Dados atualizados!' });
        setEditingId(null);
        setFormData(initialFormData);
        fetchExistingData();
      }
    } else {
      const { data, error } = await supabase.from('midia_off').insert(dataToSave).select('id').single();
      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      } else {
        await logActivity('insert', 'midia_off', data?.id || null, { marca: formData.marca, tipo: formData.tipo_midia, local: formData.localizacao });
        toast({ title: 'Sucesso', description: 'Dados salvos!' });
        setFormData(initialFormData);
        fetchExistingData();
      }
    }
    setIsSaving(false);
  };

  const handleAddressChange = (address: string, coordinates?: { lat: number; lng: number }) => {
    setFormData(prev => ({
      ...prev,
      localizacao: address,
      latitude: coordinates?.lat ?? null,
      longitude: coordinates?.lng ?? null,
    }));
  };

  const handleEdit = (item: MidiaOff) => {
    setEditingId(item.id);
    setFormData({
      mes_numero: item.mes_numero,
      mes: item.mes,
      ano: item.ano,
      marca: item.marca,
      unidade: item.unidade,
      localizacao: item.localizacao,
      latitude: item.latitude ? Number(item.latitude) : null,
      longitude: item.longitude ? Number(item.longitude) : null,
      tipo_midia: item.tipo_midia,
      fornecedor: item.fornecedor || '',
      orcamento_off: Number(item.orcamento_off),
      valor_midia: Number(item.valor_midia),
      valor_realizado: Number(item.valor_realizado),
      saving_midia: Number(item.saving_midia),
      valor_producao: Number(item.valor_producao),
      realizado_producao: Number(item.realizado_producao),
      saving_producao: Number(item.saving_producao),
      observacoes: item.observacoes || '',
      data_contratacao: item.data_contratacao || '',
      data_veiculacao_inicio: item.data_veiculacao_inicio || '',
      data_veiculacao_fim: item.data_veiculacao_fim || '',
      bonificacao: item.bonificacao || false,
      anuncio_volante: (item as any).anuncio_volante || false,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;
    const item = existingData.find(d => d.id === id);
    const { error } = await supabase.from('midia_off').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      await logActivity('delete', 'midia_off', id, { marca: item?.marca, tipo: item?.tipo_midia });
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                {editingId ? 'Editar Mídia Off' : 'Nova Mídia Off'}
                {editingId && (
                  <Button variant="outline" size="sm" onClick={cancelEdit}>Cancelar</Button>
                )}
              </CardTitle>
              <CardDescription>Cadastre investimentos em mídia offline (outdoor, rádio, TV, etc.)</CardDescription>
            </div>
            <MidiaOffAIImportDialog 
              onImportSuccess={fetchExistingData}
              marcas={marcasNomes}
              getUnidadesByMarca={getUnidadesByMarcaNome}
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
                <Label>Tipo de Mídia *</Label>
                <Select value={formData.tipo_midia} onValueChange={(v) => setFormData(prev => ({ ...prev, tipo_midia: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_MIDIA_OFF.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Data de Contratação</Label>
                <Input 
                  type="date" 
                  value={formData.data_contratacao} 
                  onChange={(e) => setFormData(prev => ({ ...prev, data_contratacao: e.target.value }))} 
                />
              </div>
              <div className="space-y-2">
                <Label>Veiculação - De</Label>
                <Input 
                  type="date" 
                  value={formData.data_veiculacao_inicio} 
                  onChange={(e) => setFormData(prev => ({ ...prev, data_veiculacao_inicio: e.target.value }))} 
                />
              </div>
              <div className="space-y-2">
                <Label>Veiculação - Até</Label>
                <Input 
                  type="date" 
                  value={formData.data_veiculacao_fim} 
                  onChange={(e) => setFormData(prev => ({ ...prev, data_veiculacao_fim: e.target.value }))} 
                />
              </div>
              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <FornecedorCombobox
                  value={formData.fornecedor}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, fornecedor: v }))}
                  tipo="midia_off"
                  placeholder="Selecione o fornecedor"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-start">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  Localização {!formData.anuncio_volante && '*'}
                </Label>
                <AddressAutocomplete
                  value={formData.localizacao}
                  onChange={handleAddressChange}
                  placeholder={formData.anuncio_volante ? "Não aplicável para anúncio volante" : "Digite o endereço do ponto de mídia..."}
                  disabled={formData.anuncio_volante}
                />
                {formData.latitude && formData.longitude && !formData.anuncio_volante && (
                  <p className="text-xs text-muted-foreground">
                    📍 Coordenadas: {formData.latitude.toFixed(5)}, {formData.longitude.toFixed(5)}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Checkbox 
                  id="anuncio_volante" 
                  checked={formData.anuncio_volante}
                  onCheckedChange={(checked) => setFormData(prev => ({ 
                    ...prev, 
                    anuncio_volante: checked === true,
                    // Limpar localização e coordenadas quando for volante
                    localizacao: checked === true ? 'Anúncio Volante' : '',
                    latitude: checked === true ? null : prev.latitude,
                    longitude: checked === true ? null : prev.longitude,
                  }))}
                />
                <Label htmlFor="anuncio_volante" className="text-sm font-medium cursor-pointer whitespace-nowrap">
                  Anúncio Volante
                </Label>
              </div>
            </div>

            {/* Indicador de Orçamento */}
            {formData.marca && (
              <OrcamentoIndicator
                tipo="midia_off"
                marca={formData.marca}
                unidade={formData.unidade}
                mesNumero={formData.mes_numero}
                ano={formData.ano}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <Label>Valor Mídia</Label>
                <CurrencyInput value={formData.valor_midia} onChange={(v) => setFormData(prev => ({ ...prev, valor_midia: v }))} />
              </div>
              <div className="space-y-2">
                <Label>Valor Realizado</Label>
                <CurrencyInput 
                  value={formData.valor_realizado} 
                  onChange={(v) => setFormData(prev => ({ 
                    ...prev, 
                    valor_realizado: v,
                    // Recalcular saving baseado na bonificação
                    saving_midia: prev.bonificacao ? prev.valor_midia : (prev.valor_midia - v)
                  }))} 
                />
              </div>
              <div className="space-y-2">
                <Label>Saving Mídia</Label>
                <CurrencyInput 
                  value={formData.bonificacao ? formData.valor_midia : formData.saving_midia} 
                  onChange={(v) => setFormData(prev => ({ ...prev, saving_midia: v }))}
                  disabled={formData.bonificacao}
                />
                {formData.bonificacao && (
                  <p className="text-xs text-green-600 font-medium">100% Bonificação</p>
                )}
              </div>
              <div className="flex items-center space-x-2 pb-2">
                <Checkbox 
                  id="bonificacao" 
                  checked={formData.bonificacao}
                  onCheckedChange={(checked) => setFormData(prev => ({ 
                    ...prev, 
                    bonificacao: checked === true,
                    // Se bonificação, valor realizado é 0 e saving é 100% do valor
                    valor_realizado: checked === true ? 0 : prev.valor_realizado,
                    saving_midia: checked === true ? prev.valor_midia : prev.saving_midia
                  }))}
                />
                <Label htmlFor="bonificacao" className="text-sm font-medium cursor-pointer">
                  Bonificação
                </Label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Valor Produção</Label>
                <CurrencyInput value={formData.valor_producao} onChange={(v) => setFormData(prev => ({ ...prev, valor_producao: v }))} />
              </div>
              <div className="space-y-2">
                <Label>Realizado Produção</Label>
                <CurrencyInput value={formData.realizado_producao} onChange={(v) => setFormData(prev => ({ ...prev, realizado_producao: v }))} />
              </div>
              <div className="space-y-2">
                <Label>Saving Produção</Label>
                <CurrencyInput value={formData.saving_producao} onChange={(v) => setFormData(prev => ({ ...prev, saving_producao: v }))} />
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
          <CardTitle>Registros de Mídia Off</CardTitle>
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
                    <TableHead>Tipo</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead className="text-right">Orçamento</TableHead>
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
                      <TableCell>{item.tipo_midia}</TableCell>
                      <TableCell>{item.localizacao}</TableCell>
                      <TableCell className="text-right">{formatCurrency(Number(item.orcamento_off))}</TableCell>
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
