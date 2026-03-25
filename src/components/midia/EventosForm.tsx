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
import { AddressAutocomplete } from '@/components/maps/AddressAutocomplete';
import { useToast } from '@/hooks/use-toast';
import { useActivityLog } from '@/hooks/useActivityLog';
import { Loader2, Save, Trash2, Edit, Plus, X, MapPin } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { MONTHS, YEARS, CATEGORIAS_EVENTO, TIPOS_CUSTO_EVENTO } from './shared/constants';
import { useMarcasUnidadesData } from '@/hooks/useMarcasUnidadesData';
import { useStatusBadge } from './shared/useStatusBadge';
import { formatCurrency, formatDate } from './shared/formatters';
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

type Evento = Tables<'eventos'>;
type EventoCusto = Tables<'evento_custos'>;

interface CustoItem {
  id?: string;
  tipo_custo: string;
  descricao: string;
  valor_orcado: number;
  valor_realizado: number;
}

interface FormData {
  mes_numero: number;
  mes: string;
  ano: number;
  marca: string;
  unidade: string;
  nome_evento: string;
  data_evento: string;
  categoria: string;
  orcamento_evento: number;
  observacoes: string;
  custos: CustoItem[];
  endereco: string;
  latitude: number | null;
  longitude: number | null;
}

const initialFormData: FormData = {
  mes_numero: 1,
  mes: 'Janeiro',
  ano: 2025,
  marca: '',
  unidade: 'Geral',
  nome_evento: '',
  data_evento: '',
  categoria: '',
  orcamento_evento: 0,
  observacoes: '',
  custos: [],
  endereco: '',
  latitude: null,
  longitude: null,
};

const initialCusto: CustoItem = {
  tipo_custo: '',
  descricao: '',
  valor_orcado: 0,
  valor_realizado: 0,
};

export const EventosForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { logActivity } = useActivityLog();
  const { getStatusBadge } = useStatusBadge();
  const { marcasNomes, getUnidadesByMarcaNome, loading: loadingMarcas } = useMarcasUnidadesData();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [existingData, setExistingData] = useState<(Evento & { custos?: EventoCusto[] })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Hook para buscar orçamento aprovado
  const { saldo: orcamentoSaldo } = useOrcamentoSaldo(
    'eventos',
    formData.marca,
    formData.unidade || null,
    formData.mes_numero,
    formData.ano
  );

  // Auto-preencher orçamento quando tiver saldo disponível e não estiver editando
  useEffect(() => {
    if (orcamentoSaldo && !editingId) {
      const totalOrcamento = orcamentoSaldo.valor_orcado + orcamentoSaldo.verba_extra;
      setFormData(prev => ({ ...prev, orcamento_evento: totalOrcamento }));
    }
  }, [orcamentoSaldo, editingId]);

  useEffect(() => {
    if (user) fetchExistingData();
  }, [user]);

  const fetchExistingData = async () => {
    if (!user) return;
    setIsLoading(true);
    const { data: eventos, error } = await supabase
      .from('eventos')
      .select('*')
      .order('ano', { ascending: false })
      .order('mes_numero', { ascending: false });

    if (error) {
      toast({ title: 'Erro', description: 'Erro ao carregar dados', variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    // Fetch custos for each evento
    const eventosWithCustos = await Promise.all(
      (eventos || []).map(async (evento) => {
        const { data: custos } = await supabase
          .from('evento_custos')
          .select('*')
          .eq('evento_id', evento.id);
        return { ...evento, custos: custos || [] };
      })
    );

    setExistingData(eventosWithCustos);
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

  const addCusto = () => {
    setFormData(prev => ({ ...prev, custos: [...prev.custos, { ...initialCusto }] }));
  };

  const removeCusto = (index: number) => {
    setFormData(prev => ({ ...prev, custos: prev.custos.filter((_, i) => i !== index) }));
  };

  const updateCusto = (index: number, field: keyof CustoItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      custos: prev.custos.map((c, i) => i === index ? { ...c, [field]: value } : c),
    }));
  };

  const totalCustosOrcado = formData.custos.reduce((sum, c) => sum + c.valor_orcado, 0);
  const totalCustosRealizado = formData.custos.reduce((sum, c) => sum + c.valor_realizado, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.marca || !formData.nome_evento || !formData.categoria || !formData.data_evento) {
      toast({ title: 'Erro', description: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    const { custos, ...eventoData } = formData;
    const dataToSave = { ...eventoData, user_id: user.id };

    if (editingId) {
      // Update evento
      const { error: eventoError } = await supabase.from('eventos').update(dataToSave).eq('id', editingId);
      if (eventoError) {
        toast({ title: 'Erro', description: eventoError.message, variant: 'destructive' });
        setIsSaving(false);
        return;
      }

      // Delete old custos and insert new ones
      await supabase.from('evento_custos').delete().eq('evento_id', editingId);
      if (custos.length > 0) {
        const custosToInsert = custos.map(c => ({ ...c, evento_id: editingId }));
        const { error: custosError } = await supabase.from('evento_custos').insert(custosToInsert);
        if (custosError) {
          toast({ title: 'Aviso', description: 'Evento salvo, mas houve erro ao salvar custos', variant: 'destructive' });
        }
      }

      await logActivity('update', 'eventos', editingId, { nome: formData.nome_evento, categoria: formData.categoria });
      toast({ title: 'Sucesso', description: 'Evento atualizado!' });
      setEditingId(null);
      setFormData(initialFormData);
      fetchExistingData();
    } else {
      // Insert evento
      const { data: newEvento, error: eventoError } = await supabase
        .from('eventos')
        .insert(dataToSave)
        .select()
        .single();

      if (eventoError || !newEvento) {
        toast({ title: 'Erro', description: eventoError?.message || 'Erro ao salvar', variant: 'destructive' });
        setIsSaving(false);
        return;
      }

      // Insert custos
      if (custos.length > 0) {
        const custosToInsert = custos.map(c => ({ ...c, evento_id: newEvento.id }));
        const { error: custosError } = await supabase.from('evento_custos').insert(custosToInsert);
        if (custosError) {
          toast({ title: 'Aviso', description: 'Evento salvo, mas houve erro ao salvar custos', variant: 'destructive' });
        }
      }

      await logActivity('insert', 'eventos', newEvento.id, { nome: formData.nome_evento, categoria: formData.categoria });
      toast({ title: 'Sucesso', description: 'Evento salvo!' });
      setFormData(initialFormData);
      fetchExistingData();
    }
    setIsSaving(false);
  };

  const handleEdit = async (item: Evento & { custos?: EventoCusto[] }) => {
    setEditingId(item.id);
    setFormData({
      mes_numero: item.mes_numero,
      mes: item.mes,
      ano: item.ano,
      marca: item.marca,
      unidade: item.unidade,
      nome_evento: item.nome_evento,
      data_evento: item.data_evento,
      categoria: item.categoria,
      orcamento_evento: Number(item.orcamento_evento),
      observacoes: item.observacoes || '',
      custos: (item.custos || []).map(c => ({
        id: c.id,
        tipo_custo: c.tipo_custo,
        descricao: c.descricao,
        valor_orcado: Number(c.valor_orcado),
        valor_realizado: Number(c.valor_realizado),
      })),
      endereco: item.endereco || '',
      latitude: item.latitude ? Number(item.latitude) : null,
      longitude: item.longitude ? Number(item.longitude) : null,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este evento e todos os seus custos?')) return;
    const item = existingData.find(d => d.id === id);
    // Custos are deleted automatically due to CASCADE
    const { error } = await supabase.from('eventos').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      await logActivity('delete', 'eventos', id, { nome: item?.nome_evento, categoria: item?.categoria });
      toast({ title: 'Sucesso', description: 'Evento excluído!' });
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
            {editingId ? 'Editar Evento' : 'Novo Evento'}
            {editingId && (
              <Button variant="outline" size="sm" onClick={cancelEdit}>Cancelar</Button>
            )}
          </CardTitle>
          <CardDescription>Cadastre eventos com detalhamento de custos</CardDescription>
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
                    {CATEGORIAS_EVENTO.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Nome do Evento *</Label>
                <Input value={formData.nome_evento} onChange={(e) => setFormData(prev => ({ ...prev, nome_evento: e.target.value }))} placeholder="Ex: Feira de Profissões 2025" />
              </div>
              <div className="space-y-2">
                <Label>Data do Evento *</Label>
                <Input type="date" value={formData.data_evento} onChange={(e) => setFormData(prev => ({ ...prev, data_evento: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Orçamento do Evento</Label>
                <CurrencyInput value={formData.orcamento_evento} onChange={(v) => setFormData(prev => ({ ...prev, orcamento_evento: v }))} />
              </div>
            </div>

            {/* Indicador de Orçamento */}
            {formData.marca && (
              <OrcamentoIndicator
                tipo="eventos"
                marca={formData.marca}
                unidade={formData.unidade || null}
                mesNumero={formData.mes_numero}
                ano={formData.ano}
              />
            )}

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                Endereço do Evento
              </Label>
              <AddressAutocomplete
                value={formData.endereco}
                onChange={(address, coordinates) => setFormData(prev => ({
                  ...prev,
                  endereco: address,
                  latitude: coordinates?.lat ?? null,
                  longitude: coordinates?.lng ?? null,
                }))}
                placeholder="Digite o endereço do evento..."
              />
              {formData.latitude && formData.longitude && (
                <p className="text-xs text-muted-foreground">
                  📍 Coordenadas: {formData.latitude.toFixed(5)}, {formData.longitude.toFixed(5)}
                </p>
              )}
            </div>

            {/* Custos Section */}
            <Card className="bg-muted/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Detalhamento de Custos</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addCusto}>
                    <Plus className="h-4 w-4 mr-1" /> Adicionar Custo
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.custos.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">Nenhum custo adicionado. Clique em "Adicionar Custo" para incluir.</p>
                ) : (
                  <>
                    {formData.custos.map((custo, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end p-3 bg-background rounded-lg border">
                        <div className="space-y-1">
                          <Label className="text-xs">Tipo de Custo</Label>
                          <Select value={custo.tipo_custo} onValueChange={(v) => updateCusto(index, 'tipo_custo', v)}>
                            <SelectTrigger className="h-9"><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              {TIPOS_CUSTO_EVENTO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Descrição</Label>
                          <Input className="h-9" value={custo.descricao} onChange={(e) => updateCusto(index, 'descricao', e.target.value)} placeholder="Descrição" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Valor Orçado</Label>
                          <CurrencyInput value={custo.valor_orcado} onChange={(v) => updateCusto(index, 'valor_orcado', v)} className="h-9" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Valor Realizado</Label>
                          <CurrencyInput value={custo.valor_realizado} onChange={(v) => updateCusto(index, 'valor_realizado', v)} className="h-9" />
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeCusto(index)} className="h-9 w-9">
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex justify-end gap-6 pt-2 border-t">
                      <div className="text-sm"><span className="text-muted-foreground">Total Orçado:</span> <span className="font-semibold">{formatCurrency(totalCustosOrcado)}</span></div>
                      <div className="text-sm"><span className="text-muted-foreground">Total Realizado:</span> <span className="font-semibold">{formatCurrency(totalCustosRealizado)}</span></div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

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
          <CardTitle>Eventos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : existingData.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum evento encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Orçamento</TableHead>
                    <TableHead className="text-right">Custos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {existingData.map((item) => {
                    const totalCustos = (item.custos || []).reduce((sum, c) => sum + Number(c.valor_realizado), 0);
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{formatDate(item.data_evento)}</TableCell>
                        <TableCell>{item.nome_evento}</TableCell>
                        <TableCell>{item.marca}</TableCell>
                        <TableCell>{item.categoria}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(item.orcamento_evento))}</TableCell>
                        <TableCell className="text-right">{formatCurrency(totalCustos)}</TableCell>
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
