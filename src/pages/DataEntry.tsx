import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { NumericInput } from '@/components/ui/numeric-input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Trash2, Send, Edit, Calculator } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { useMarcasUnidadesData } from '@/hooks/useMarcasUnidadesData';

type PublicidadeDados = Tables<'publicidade_dados'>;

const MONTHS = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

const YEARS = [2024, 2025, 2026];

interface FormData {
  month_number: number;
  month: string;
  year: number;
  marca: string;
  unidade: string;
  // Campos manuais
  leads_real: number;
  leads_orcado: number;
  leads_a1: number;
  leads_prod_real: number;
  leads_prod_orcado: number;
  leads_prod_a1: number;
  matriculas_real: number;
  matriculas_orcado: number;
  matriculas_a1: number;
  invest_meta: number;
  invest_google: number;
  invest_off: number;
  invest_eventos: number;
  // Campos de eventos
  num_eventos: number;
  leads_eventos: number;
  // Campos manuais de CPL (antes calculados)
  cpl_orcado: number;
  cpl_a1: number;
  cpl_prod_orcado: number;
  cpl_prod_a1: number;
  // Campos manuais de CAC
  cac_orcado: number;
  cac_a1: number;
}

const initialFormData: FormData = {
  month_number: 1,
  month: 'Janeiro',
  year: 2025,
  marca: '',
  unidade: 'Geral',
  leads_real: 0,
  leads_orcado: 0,
  leads_a1: 0,
  leads_prod_real: 0,
  leads_prod_orcado: 0,
  leads_prod_a1: 0,
  matriculas_real: 0,
  matriculas_orcado: 0,
  matriculas_a1: 0,
  invest_meta: 0,
  invest_google: 0,
  invest_off: 0,
  invest_eventos: 0,
  num_eventos: 0,
  leads_eventos: 0,
  cpl_orcado: 0,
  cpl_a1: 0,
  cpl_prod_orcado: 0,
  cpl_prod_a1: 0,
  cac_orcado: 0,
  cac_a1: 0,
};

const DataEntry = () => {
  const { user, loading: authLoading } = useAuth();
  const { canEditForms, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { marcasNomes, getUnidadesByMarcaNome, loading: loadingMarcas } = useMarcasUnidadesData();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [existingData, setExistingData] = useState<PublicidadeDados[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set());

  // Check access permission
  useEffect(() => {
    if (!roleLoading && user && !canEditForms) {
      toast({ title: 'Acesso negado', description: 'Você não tem permissão para editar dados', variant: 'destructive' });
      navigate('/');
    }
  }, [canEditForms, roleLoading, user, navigate, toast]);

  // Calcular investimento total
  const totalInvestment = useMemo(() => {
    return formData.invest_meta + formData.invest_google + formData.invest_off + formData.invest_eventos;
  }, [formData.invest_meta, formData.invest_google, formData.invest_off, formData.invest_eventos]);

  // Contar unidades da marca selecionada para divisão igual
  const numUnidades = useMemo(() => {
    if (!formData.marca) return 1;
    const unidades = getUnidadesByMarcaNome(formData.marca).filter(u => u !== 'Geral');
    return unidades.length || 1;
  }, [formData.marca, getUnidadesByMarcaNome]);

  // Investimento por unidade (divisão igual)
  const investimentoPorUnidade = useMemo(() => {
    // Se for unidade 'Geral', usa investimento total
    if (formData.unidade === 'Geral') {
      return totalInvestment;
    }
    // Senão, divide igualmente entre as unidades
    return totalInvestment / numUnidades;
  }, [totalInvestment, numUnidades, formData.unidade]);

  // Valores calculados automaticamente (apenas CPL Real, CPL Prod Real, CAC Real e CPL Eventos)
  const calculatedValues = useMemo(() => {
    const inv = investimentoPorUnidade;
    
    // CPL Real = Investimento / Leads Real
    const cpl_real = formData.leads_real > 0 ? Math.round(inv / formData.leads_real) : 0;
    
    // CPL Produtivo Real = Investimento / Lead Produtivo Real
    const cpl_prod_real = formData.leads_prod_real > 0 ? Math.round(inv / formData.leads_prod_real) : 0;
    
    // CAC Real = Investimento / Matrículas (se não houver matrículas, mostra investimento)
    const cac_real = formData.matriculas_real > 0 ? Math.round(inv / formData.matriculas_real) : Math.round(inv);
    
    // CPL Eventos = Investimento Eventos / Leads Eventos
    const cpl_eventos = formData.leads_eventos > 0 ? Math.round(formData.invest_eventos / formData.leads_eventos) : 0;
    
    return {
      cpl_real,
      cpl_prod_real,
      cac_real,
      cpl_eventos
    };
  }, [formData, investimentoPorUnidade]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchExistingData();
    }
  }, [user]);

  const fetchExistingData = async () => {
    if (!user) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('publicidade_dados')
      .select('*')
      .eq('user_id', user.id)
      .order('year', { ascending: false })
      .order('month_number', { ascending: false });
    
    if (error) {
      toast({ title: 'Erro', description: 'Erro ao carregar dados', variant: 'destructive' });
    } else {
      setExistingData(data || []);
    }
    setIsLoading(false);
  };

  const handleInputChange = (field: keyof FormData, value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMonthChange = (monthNumber: number) => {
    const month = MONTHS.find(m => m.value === monthNumber)?.label || '';
    setFormData(prev => ({ ...prev, month_number: monthNumber, month }));
  };

  const handleMarcaChange = (marca: string) => {
    const unidadesDisponiveis = getUnidadesByMarcaNome(marca);
    setFormData(prev => ({ 
      ...prev, 
      marca, 
      unidade: unidadesDisponiveis[0] || 'Geral' 
    }));
  };

  // Unidades disponíveis para a marca selecionada
  const unidadesDisponiveis = formData.marca 
    ? getUnidadesByMarcaNome(formData.marca)
    : ['Geral'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!formData.marca) {
      toast({ title: 'Erro', description: 'Selecione uma marca', variant: 'destructive' });
      return;
    }

    setIsSaving(true);

    // Montar dados para salvar (incluindo valores calculados)
    const dataToSave = {
      month_number: formData.month_number,
      month: formData.month,
      year: formData.year,
      marca: formData.marca,
      unidade: formData.unidade,
      leads_real: formData.leads_real,
      leads_orcado: formData.leads_orcado,
      leads_a1: formData.leads_a1,
      leads_prod_real: formData.leads_prod_real,
      leads_prod_orcado: formData.leads_prod_orcado,
      leads_prod_a1: formData.leads_prod_a1,
      matriculas_real: formData.matriculas_real,
      matriculas_orcado: formData.matriculas_orcado,
      matriculas_a1: formData.matriculas_a1,
      invest_meta: formData.invest_meta,
      invest_google: formData.invest_google,
      invest_off: formData.invest_off,
      invest_eventos: formData.invest_eventos,
      num_eventos: formData.num_eventos,
      leads_eventos: formData.leads_eventos,
      // Valores calculados (apenas Real) + manuais (Orçado e A-1)
      cpl_real: calculatedValues.cpl_real,
      cpl_orcado: formData.cpl_orcado,
      cpl_a1: formData.cpl_a1,
      cpl_prod_real: calculatedValues.cpl_prod_real,
      cpl_prod_orcado: formData.cpl_prod_orcado,
      cpl_prod_a1: formData.cpl_prod_a1,
      cac_real: calculatedValues.cac_real,
      cac_orcado: formData.cac_orcado,
      cac_a1: formData.cac_a1,
      user_id: user.id,
    };

    if (editingId) {
      const { error } = await supabase
        .from('publicidade_dados')
        .update(dataToSave)
        .eq('id', editingId);

      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Sucesso', description: 'Dados atualizados!' });
        setEditingId(null);
        setFormData(initialFormData);
        fetchExistingData();
      }
    } else {
      const { error } = await supabase
        .from('publicidade_dados')
        .insert(dataToSave);

      if (error) {
        if (error.code === '23505') {
          toast({ title: 'Erro', description: 'Já existe um registro para esta marca/mês/ano', variant: 'destructive' });
        } else {
          toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        }
      } else {
        toast({ title: 'Sucesso', description: 'Dados salvos!' });
        setFormData(initialFormData);
        fetchExistingData();
      }
    }
    setIsSaving(false);
  };

  const handleEdit = (item: PublicidadeDados) => {
    setEditingId(item.id);
    const itemAny = item as any;
    setFormData({
      month_number: item.month_number,
      month: item.month,
      year: item.year,
      marca: item.marca,
      unidade: item.unidade,
      leads_real: item.leads_real,
      leads_orcado: item.leads_orcado,
      leads_a1: item.leads_a1,
      leads_prod_real: itemAny.leads_prod_real || 0,
      leads_prod_orcado: itemAny.leads_prod_orcado || 0,
      leads_prod_a1: itemAny.leads_prod_a1 || 0,
      matriculas_real: itemAny.matriculas_real || 0,
      matriculas_orcado: itemAny.matriculas_orcado || 0,
      matriculas_a1: itemAny.matriculas_a1 || 0,
      invest_meta: Number(item.invest_meta),
      invest_google: Number(item.invest_google),
      invest_off: Number(item.invest_off),
      invest_eventos: Number(item.invest_eventos),
      num_eventos: itemAny.num_eventos || 0,
      leads_eventos: itemAny.leads_eventos || 0,
      cpl_orcado: Number(item.cpl_orcado) || 0,
      cpl_a1: Number(item.cpl_a1) || 0,
      cpl_prod_orcado: Number(item.cpl_prod_orcado) || 0,
      cpl_prod_a1: Number(item.cpl_prod_a1) || 0,
      cac_orcado: Number(item.cac_orcado) || 0,
      cac_a1: Number(item.cac_a1) || 0,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const logActivity = async (action: string, recordId: string, details: Record<string, unknown>) => {
    if (!user) return;
    await supabase.from('activity_logs' as any).insert({
      user_id: user.id,
      action,
      table_name: 'publicidade_dados',
      record_id: recordId,
      details,
    } as any);
  };

  const handleDelete = async (id: string, item: PublicidadeDados) => {
    const confirmMsg = item.status === 'aprovado' 
      ? 'Este registro está APROVADO e aparece no Dashboard. Tem certeza que deseja excluí-lo?' 
      : 'Tem certeza que deseja excluir este registro?';
    
    if (!confirm(confirmMsg)) return;
    
    const { error } = await supabase
      .from('publicidade_dados')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      await logActivity('delete', id, { 
        marca: item.marca, 
        month: item.month, 
        year: item.year, 
        status: item.status 
      });
      toast({ title: 'Sucesso', description: 'Registro excluído!' });
      fetchExistingData();
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(initialFormData);
  };

  const handleSendForApproval = async (id: string) => {
    setSendingIds(prev => new Set(prev).add(id));
    
    const { error } = await supabase
      .from('publicidade_dados')
      .update({ status: 'pendente' })
      .eq('id', id);

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ 
        title: 'Enviado para aprovação!', 
        description: 'O gestor será notificado para aprovar os dados.' 
      });
      fetchExistingData();
    }
    setSendingIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'rascunho':
        return <Badge variant="outline">Rascunho</Badge>;
      case 'pendente':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Aguardando Aprovação</Badge>;
      case 'aprovado':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Aprovado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background transition-[margin] duration-200" style={{ marginLeft: 'var(--sidebar-w, 15rem)' }}>
      <AppHeader />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {editingId ? 'Editar Registro' : 'Novo Registro'}
              {editingId && (
                <Button variant="outline" size="sm" onClick={cancelEdit}>
                  Cancelar
                </Button>
              )}
            </CardTitle>
            <CardDescription>Preencha os dados de publicidade para uma marca específica</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Identification */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Mês</Label>
                  <Select
                    value={formData.month_number.toString()}
                    onValueChange={(v) => handleMonthChange(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m) => (
                        <SelectItem key={m.value} value={m.value.toString()}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ano</Label>
                  <Select
                    value={formData.year.toString()}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, year: parseInt(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map((y) => (
                        <SelectItem key={y} value={y.toString()}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Marca</Label>
                  <Select
                    value={formData.marca}
                    onValueChange={handleMarcaChange}
                    disabled={loadingMarcas}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingMarcas ? "Carregando..." : "Selecione"} />
                    </SelectTrigger>
                    <SelectContent>
                      {marcasNomes.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Unidade</Label>
                  <Select
                    value={formData.unidade}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, unidade: v }))}
                    disabled={!formData.marca}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a marca primeiro" />
                    </SelectTrigger>
                    <SelectContent>
                      {unidadesDisponiveis.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Investimentos Section - Primeiro porque é base para cálculos */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Investimentos (R$)</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2 pb-4">
                    <Label>Meta</Label>
                    <NumericInput
                      value={formData.invest_meta}
                      onChange={(v) => handleInputChange('invest_meta', v)}
                      allowDecimals
                      decimalPlaces={2}
                      required
                    />
                  </div>
                  <div className="space-y-2 pb-4">
                    <Label>Google</Label>
                    <NumericInput
                      value={formData.invest_google}
                      onChange={(v) => handleInputChange('invest_google', v)}
                      allowDecimals
                      decimalPlaces={2}
                      required
                    />
                  </div>
                  <div className="space-y-2 pb-4">
                    <Label>Off</Label>
                    <NumericInput
                      value={formData.invest_off}
                      onChange={(v) => handleInputChange('invest_off', v)}
                      allowDecimals
                      decimalPlaces={2}
                      required
                    />
                  </div>
                  <div className="space-y-2 pb-4">
                    <Label>Eventos (R$)</Label>
                    <NumericInput
                      value={formData.invest_eventos}
                      onChange={(v) => handleInputChange('invest_eventos', v)}
                      allowDecimals
                      decimalPlaces={2}
                      required
                    />
                  </div>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm font-medium">
                    Investimento Total: {formatCurrency(totalInvestment)}
                    {formData.unidade !== 'Geral' && numUnidades > 1 && (
                      <span className="text-muted-foreground ml-2">
                        (÷ {numUnidades} unidades = {formatCurrency(investimentoPorUnidade)} por unidade)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Eventos Section */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Eventos</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 pb-4">
                    <Label>Número de Eventos</Label>
                    <NumericInput
                      value={formData.num_eventos}
                      onChange={(v) => handleInputChange('num_eventos', v)}
                      required
                    />
                  </div>
                  <div className="space-y-2 pb-4">
                    <Label>Leads de Eventos</Label>
                    <NumericInput
                      value={formData.leads_eventos}
                      onChange={(v) => handleInputChange('leads_eventos', v)}
                      required
                    />
                  </div>
                  <div className="space-y-2 pb-4">
                    <Label>CPL Eventos (calculado)</Label>
                    <div className="bg-muted/50 p-2 rounded text-center font-medium">
                      {formatCurrency(calculatedValues.cpl_eventos)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Leads Section */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Leads</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 pb-4">
                    <Label>Real</Label>
                    <NumericInput
                      value={formData.leads_real}
                      onChange={(v) => handleInputChange('leads_real', v)}
                      required
                    />
                  </div>
                  <div className="space-y-2 pb-4">
                    <Label>Orçado</Label>
                    <NumericInput
                      value={formData.leads_orcado}
                      onChange={(v) => handleInputChange('leads_orcado', v)}
                      required
                    />
                  </div>
                  <div className="space-y-2 pb-4">
                    <Label>C.A.</Label>
                    <NumericInput
                      value={formData.leads_a1}
                      onChange={(v) => handleInputChange('leads_a1', v)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Leads Produtivo Section */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Leads Produtivo</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 pb-4">
                    <Label>Real</Label>
                    <NumericInput
                      value={formData.leads_prod_real}
                      onChange={(v) => handleInputChange('leads_prod_real', v)}
                      required
                    />
                  </div>
                  <div className="space-y-2 pb-4">
                    <Label>Orçado</Label>
                    <NumericInput
                      value={formData.leads_prod_orcado}
                      onChange={(v) => handleInputChange('leads_prod_orcado', v)}
                      required
                    />
                  </div>
                  <div className="space-y-2 pb-4">
                    <Label>C.A.</Label>
                    <NumericInput
                      value={formData.leads_prod_a1}
                      onChange={(v) => handleInputChange('leads_prod_a1', v)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Matrículas Section */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Matrículas</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 pb-4">
                    <Label>Real</Label>
                    <NumericInput
                      value={formData.matriculas_real}
                      onChange={(v) => handleInputChange('matriculas_real', v)}
                      required
                    />
                  </div>
                  <div className="space-y-2 pb-4">
                    <Label>Orçado</Label>
                    <NumericInput
                      value={formData.matriculas_orcado}
                      onChange={(v) => handleInputChange('matriculas_orcado', v)}
                      required
                    />
                  </div>
                  <div className="space-y-2 pb-4">
                    <Label>C.A.</Label>
                    <NumericInput
                      value={formData.matriculas_a1}
                      onChange={(v) => handleInputChange('matriculas_a1', v)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* CPL Section - Campos manuais para Orçado e A-1 */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">CPL (R$)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 pb-4">
                    <Label>Real (calculado)</Label>
                    <div className="bg-muted/50 p-2 rounded text-center font-medium">
                      {formatCurrency(calculatedValues.cpl_real)}
                    </div>
                  </div>
                  <div className="space-y-2 pb-4">
                    <Label>Orçado (Meta)</Label>
                    <NumericInput
                      value={formData.cpl_orcado}
                      onChange={(v) => handleInputChange('cpl_orcado', v)}
                      required
                    />
                  </div>
                  <div className="space-y-2 pb-4">
                    <Label>C.A.</Label>
                    <NumericInput
                      value={formData.cpl_a1}
                      onChange={(v) => handleInputChange('cpl_a1', v)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* CPL Produtivo Section - Campos manuais para Orçado e A-1 */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">CPL Produtivo (R$)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 pb-4">
                    <Label>Real (calculado)</Label>
                    <div className="bg-muted/50 p-2 rounded text-center font-medium">
                      {formatCurrency(calculatedValues.cpl_prod_real)}
                    </div>
                  </div>
                  <div className="space-y-2 pb-4">
                    <Label>Orçado (Meta)</Label>
                    <NumericInput
                      value={formData.cpl_prod_orcado}
                      onChange={(v) => handleInputChange('cpl_prod_orcado', v)}
                      required
                    />
                  </div>
                  <div className="space-y-2 pb-4">
                    <Label>C.A.</Label>
                    <NumericInput
                      value={formData.cpl_prod_a1}
                      onChange={(v) => handleInputChange('cpl_prod_a1', v)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* CAC Section - Real calculado, Orçado e C.A. manuais */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">CAC Raiz (R$)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 pb-4">
                    <Label>Real (calculado)</Label>
                    <div className="bg-muted/50 p-2 rounded text-center font-medium">
                      {formatCurrency(calculatedValues.cac_real)}
                      {formData.matriculas_real === 0 && (
                        <span className="text-xs text-orange-600 block">(investimento)</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 pb-4">
                    <Label>Orçado (Meta)</Label>
                    <NumericInput
                      value={formData.cac_orcado}
                      onChange={(v) => handleInputChange('cac_orcado', v)}
                      required
                    />
                  </div>
                  <div className="space-y-2 pb-4">
                    <Label>C.A.</Label>
                    <NumericInput
                      value={formData.cac_a1}
                      onChange={(v) => handleInputChange('cac_a1', v)}
                      required
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                {editingId ? 'Atualizar' : 'Salvar'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Existing Data */}
        <Card>
          <CardHeader>
            <CardTitle>Registros Salvos</CardTitle>
            <CardDescription>{existingData.length} registro(s) encontrado(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : existingData.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhum registro ainda. Preencha o formulário acima.</p>
            ) : (
              <div className="space-y-2">
                {existingData.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{item.marca}</p>
                        {getStatusBadge(item.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.month} {item.year} • {item.unidade}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Leads: {item.leads_real} | CAC: {formatCurrency(Number(item.cac_real))} | CPL: {formatCurrency(Number(item.cpl_real))}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {item.status === 'rascunho' && (
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={() => handleSendForApproval(item.id)}
                          disabled={sendingIds.has(item.id)}
                        >
                          {sendingIds.has(item.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <Send className="h-4 w-4 mr-1" />
                          )}
                          Dados Inseridos
                        </Button>
                      )}
                      {item.status === 'pendente' && (
                        <span className="text-sm text-muted-foreground">Aguardando gestor...</span>
                      )}
                      {item.status === 'aprovado' && (
                        <span className="text-sm text-green-600">✓ No Dashboard</span>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        onClick={() => handleDelete(item.id, item)}
                        title="Excluir registro"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DataEntry;
