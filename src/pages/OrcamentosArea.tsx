import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useMarcasUnidadesData } from '@/hooks/useMarcasUnidadesData';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Loader2, Plus, Pencil, Trash2, Wallet, Calendar, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { YEARS } from '@/components/midia/shared/constants';
import { formatCurrency } from '@/components/midia/shared/formatters';
import { useActivityLog } from '@/hooks/useActivityLog';
import { TiposCustoManager, TipoCusto, ResumoCentroCusto, BudgetAlertBadge, OrcamentoAreaDistribuicaoDialog } from '@/components/orcamentos-area';

interface OrcamentoArea {
  id: string;
  ano: number;
  marca: string;
  tipo_custo_id: string;
  tipo_custo_nome: string;
  valor_orcado: number;
  valor_utilizado: number;
  saldo_disponivel: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

const OrcamentosArea = () => {
  const { user, loading: authLoading } = useAuth();
  const { canEditForms, isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { logActivity } = useActivityLog();
  const { marcasNomes, loading: marcasLoading } = useMarcasUnidadesData();

  const [tiposCusto, setTiposCusto] = useState<TipoCusto[]>([]);
  const [orcamentos, setOrcamentos] = useState<OrcamentoArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formAno, setFormAno] = useState(new Date().getFullYear());
  const [formMarca, setFormMarca] = useState('');
  const [formTipoCusto, setFormTipoCusto] = useState('');
  const [formValor, setFormValor] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Filtros
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear());
  const [filtroMarca, setFiltroMarca] = useState('todas');
  
  // Dialog de distribuição
  const [distribuicaoDialogOpen, setDistribuicaoDialogOpen] = useState(false);
  const [selectedOrcamento, setSelectedOrcamento] = useState<OrcamentoArea | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: tiposData, error: tiposError } = await supabase
        .from('tipos_custo')
        .select('*')
        .order('nome');
      
      if (tiposError) throw tiposError;
      setTiposCusto((tiposData || []).map(t => ({
        id: t.id,
        nome: t.nome,
        descricao: t.descricao,
        tipo_orcamento: (t.tipo_orcamento === 'compartilhado' ? 'compartilhado' : 'proprio') as 'proprio' | 'compartilhado',
        ativo: t.ativo,
      })));

      const { data: orcData, error: orcError } = await supabase
        .from('orcamentos')
        .select('*')
        .like('tipo', 'area_%')
        .order('created_at', { ascending: false });
      
      if (orcError) throw orcError;

      const { data: registros } = await supabase
        .from('controle_orcamentario')
        .select('marca, tipo_custo, ano, valor, status')
        .neq('status', 'cancelado');

      const utilizadoMap = new Map<string, number>();
      (registros || []).forEach(r => {
        const key = `${r.marca}|${r.tipo_custo}|${r.ano}`;
        utilizadoMap.set(key, (utilizadoMap.get(key) || 0) + Number(r.valor || 0));
      });
      
      const mappedOrcamentos = (orcData || []).map(orc => {
        const tipoCustoId = orc.tipo.replace('area_', '');
        const tipoCusto = tiposData?.find(t => t.id === tipoCustoId);
        const tipoCustoNome = tipoCusto?.nome || 'Desconhecido';
        const valorOrcado = Number(orc.valor_orcado);
        const utilizadoKey = `${orc.marca}|${tipoCustoNome}|${orc.ano}`;
        const valorUtilizado = utilizadoMap.get(utilizadoKey) || 0;
        
        return {
          id: orc.id,
          ano: orc.ano,
          marca: orc.marca,
          tipo_custo_id: tipoCustoId,
          tipo_custo_nome: tipoCustoNome,
          valor_orcado: valorOrcado,
          valor_utilizado: valorUtilizado,
          saldo_disponivel: valorOrcado - valorUtilizado,
          user_id: orc.user_id,
          created_at: orc.created_at,
          updated_at: orc.updated_at,
        };
      });
      setOrcamentos(mappedOrcamentos);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMarca || !formTipoCusto || formValor <= 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        ano: formAno,
        mes_numero: 1,
        mes: 'Anual',
        marca: formMarca,
        unidade: null,
        tipo: `area_${formTipoCusto}`,
        valor_orcado: formValor,
        verba_extra: 0,
        observacoes: null,
        status: 'aprovado',
        user_id: user?.id,
      };

      if (editingId) {
        const { error } = await supabase.from('orcamentos').update(dataToSave).eq('id', editingId);
        if (error) throw error;
        toast.success('Orçamento atualizado!');
        await logActivity('update', 'orcamentos', editingId, { tipo: 'area', marca: formMarca });
      } else {
        const { error } = await supabase.from('orcamentos').insert(dataToSave);
        if (error) throw error;
        toast.success('Orçamento criado!');
        await logActivity('insert', 'orcamentos', null, { tipo: 'area', marca: formMarca });
      }
      
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormMarca('');
    setFormTipoCusto('');
    setFormValor(0);
    setEditingId(null);
  };

  const handleEdit = (orc: OrcamentoArea) => {
    setFormAno(orc.ano);
    setFormMarca(orc.marca);
    setFormTipoCusto(orc.tipo_custo_id);
    setFormValor(orc.valor_orcado);
    setEditingId(orc.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este orçamento?')) return;
    try {
      const { error } = await supabase.from('orcamentos').delete().eq('id', id);
      if (error) throw error;
      toast.success('Orçamento excluído!');
      await logActivity('delete', 'orcamentos', id, { tipo: 'area' });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir');
    }
  };

  const orcamentosFiltrados = useMemo(() => {
    return orcamentos.filter(orc => {
      if (filtroAno && orc.ano !== filtroAno) return false;
      if (filtroMarca !== 'todas' && orc.marca !== filtroMarca) return false;
      return true;
    });
  }, [orcamentos, filtroAno, filtroMarca]);

  const tiposCustoAtivos = useMemo(() => tiposCusto.filter(t => t.ativo), [tiposCusto]);

  const isLoading = authLoading || roleLoading || marcasLoading || loading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AppLayout>
      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Wallet className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">Orçamento de Área</h1>
        </div>

        <Tabs defaultValue="resumo" className="space-y-6">
          <TabsList>
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="orcamentos">Orçamentos</TabsTrigger>
            {isAdmin && <TabsTrigger value="centros">Centros de Custo</TabsTrigger>}
          </TabsList>

          {/* Tab Resumo */}
          <TabsContent value="resumo" className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Select value={String(filtroAno)} onValueChange={(v) => setFiltroAno(Number(v))}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filtroMarca} onValueChange={setFiltroMarca}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as marcas</SelectItem>
                  {marcasNomes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <ResumoCentroCusto 
              tiposCusto={tiposCusto} 
              orcamentos={orcamentos} 
              filtroAno={filtroAno} 
              filtroMarca={filtroMarca} 
            />
          </TabsContent>

          {/* Tab Orçamentos */}
          <TabsContent value="orcamentos">
            <div className="grid gap-6 lg:grid-cols-3">
              {canEditForms && (
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle>{editingId ? 'Editar' : 'Novo'} Orçamento</CardTitle>
                    <CardDescription>Defina o orçamento por tipo de custo e marca</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label>Ano *</Label>
                        <Select value={String(formAno)} onValueChange={(v) => setFormAno(Number(v))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Marca *</Label>
                        <Select value={formMarca} onValueChange={setFormMarca}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {marcasNomes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Centro de Custo *</Label>
                        <Select value={formTipoCusto} onValueChange={setFormTipoCusto}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {tiposCustoAtivos.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Valor Orçado *</Label>
                        <CurrencyInput value={formValor} onChange={setFormValor} placeholder="0,00" />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" disabled={saving} className="flex-1">
                          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : editingId ? <Pencil className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                          {editingId ? 'Atualizar' : 'Adicionar'}
                        </Button>
                        {editingId && <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>}
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              <Card className={canEditForms ? 'lg:col-span-2' : 'lg:col-span-3'}>
                <CardHeader>
                  <div className="flex justify-between">
                    <CardTitle>Orçamentos Cadastrados</CardTitle>
                    <div className="flex gap-2">
                      <Select value={String(filtroAno)} onValueChange={(v) => setFiltroAno(Number(v))}>
                        <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>{YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={filtroMarca} onValueChange={setFiltroMarca}>
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todas">Todas</SelectItem>
                          {marcasNomes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ano</TableHead>
                        <TableHead>Marca</TableHead>
                        <TableHead>Centro de Custo</TableHead>
                        <TableHead className="text-right">Orçado</TableHead>
                        <TableHead className="text-right">Utilizado</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Utilização</TableHead>
                        {canEditForms && <TableHead className="w-32">Ações</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orcamentosFiltrados.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={canEditForms ? 9 : 8} className="text-center text-muted-foreground py-8">
                            Nenhum orçamento cadastrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        orcamentosFiltrados.map((orc) => {
                          const percentual = orc.valor_orcado > 0 ? (orc.valor_utilizado / orc.valor_orcado) * 100 : 0;
                          const isWarning = percentual >= 80 && percentual < 100;
                          const isExceeded = percentual >= 100;
                          
                          return (
                            <TableRow key={orc.id} className={isExceeded ? 'bg-destructive/5' : isWarning ? 'bg-orange-50 dark:bg-orange-950/10' : ''}>
                              <TableCell>{orc.ano}</TableCell>
                              <TableCell>{orc.marca}</TableCell>
                              <TableCell><Badge variant="secondary">{orc.tipo_custo_nome}</Badge></TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(orc.valor_orcado)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(orc.valor_utilizado)}</TableCell>
                              <TableCell className={`text-right font-medium ${orc.saldo_disponivel >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                                {formatCurrency(orc.saldo_disponivel)}
                              </TableCell>
                              <TableCell>
                                <BudgetAlertBadge 
                                  valorOrcado={orc.valor_orcado} 
                                  valorUtilizado={orc.valor_utilizado}
                                  size="sm"
                                />
                              </TableCell>
                              <TableCell className="w-32">
                                <div className="flex items-center gap-2">
                                  <Progress 
                                    value={Math.min(percentual, 100)} 
                                    className={`h-2 flex-1 ${isExceeded ? 'bg-destructive/20' : isWarning ? 'bg-orange-100' : ''}`}
                                  />
                                  {(isWarning || isExceeded) && (
                                    <AlertTriangle className={`h-4 w-4 ${isExceeded ? 'text-destructive' : 'text-orange-500'}`} />
                                  )}
                                </div>
                              </TableCell>
                              {canEditForms && (
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => {
                                        setSelectedOrcamento(orc);
                                        setDistribuicaoDialogOpen(true);
                                      }}
                                      title="Distribuição Mensal"
                                    >
                                      <Calendar className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(orc)} title="Editar">
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(orc.id)} title="Excluir">
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </TableCell>
                              )}
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Centros de Custo */}
          {isAdmin && (
            <TabsContent value="centros">
              <TiposCustoManager tiposCusto={tiposCusto} canEdit={isAdmin} onRefresh={fetchData} />
            </TabsContent>
          )}
        </Tabs>

        {/* Dialog de Distribuição Mensal */}
        {selectedOrcamento && (
          <OrcamentoAreaDistribuicaoDialog
            open={distribuicaoDialogOpen}
            onOpenChange={setDistribuicaoDialogOpen}
            orcamentoId={selectedOrcamento.id}
            marca={selectedOrcamento.marca}
            tipoCustoNome={selectedOrcamento.tipo_custo_nome}
            valorTotal={selectedOrcamento.valor_orcado}
            ano={selectedOrcamento.ano}
            onSaved={fetchData}
          />
        )}
      </main>
    </AppLayout>
  );
};

export default OrcamentosArea;
