import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppHeader } from '@/components/AppHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Loader2, Save, Pencil, Trash2, Send, CheckCircle, XCircle, Wallet, Eye, SplitSquareHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { useCampanhas, Campanha } from '@/hooks/useCampanhas';
import { useUserRole } from '@/hooks/useUserRole';
import { useMarcasUnidadesData } from '@/hooks/useMarcasUnidadesData';
import { MONTHS, YEARS } from '@/components/midia/shared/constants';
import { formatCurrency } from '@/components/midia/shared/formatters';
import { DistribuirVerbaDialog } from '@/components/orcamentos/DistribuirVerbaDialog';
import { VisualizarCampanhaDialog } from '@/components/orcamentos/VisualizarCampanhaDialog';

interface FormData {
  marca: string;
  unidade: string;
  orcamento_total: number;
  mes_inicio: number;
  ano_inicio: number;
  mes_fim: number;
  ano_fim: number;
}

const currentYear = new Date().getFullYear();

const initialFormData: FormData = {
  marca: '',
  unidade: '',
  orcamento_total: 0,
  mes_inicio: 1,
  ano_inicio: currentYear,
  mes_fim: 12,
  ano_fim: currentYear,
};

const Orcamentos = () => {
  const { user, loading: authLoading } = useAuth();
  const { canEditForms, canApprove, isGestor, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { campanhas, loading, createCampanha, updateCampanha, deleteCampanha, submitForApproval, approveCampanha, rejectCampanha, refetch } = useCampanhas();
  const { marcasNomes, getUnidadesByMarcaNome, loading: marcasLoading } = useMarcasUnidadesData();
  
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [availableUnidades, setAvailableUnidades] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Dialogs
  const [distribuirDialogOpen, setDistribuirDialogOpen] = useState(false);
  const [visualizarDialogOpen, setVisualizarDialogOpen] = useState(false);
  const [selectedCampanhaId, setSelectedCampanhaId] = useState<string>('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (formData.marca) {
      setAvailableUnidades(getUnidadesByMarcaNome(formData.marca));
    } else {
      setAvailableUnidades([]);
    }
  }, [formData.marca, getUnidadesByMarcaNome]);

  const handleMarcaChange = (value: string) => {
    setFormData(prev => ({ ...prev, marca: value, unidade: '' }));
  };

  const handleSave = async () => {
    if (!formData.marca) {
      toast.error('Selecione a marca');
      return;
    }

    if (formData.orcamento_total <= 0) {
      toast.error('Informe o orçamento total');
      return;
    }

    // Validate period
    const startDate = formData.ano_inicio * 12 + formData.mes_inicio;
    const endDate = formData.ano_fim * 12 + formData.mes_fim;
    if (endDate < startDate) {
      toast.error('A data final deve ser posterior à data inicial');
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        const success = await updateCampanha(editingId, {
          marca: formData.marca,
          unidade: formData.unidade || null,
          orcamento_total: formData.orcamento_total,
          mes_inicio: formData.mes_inicio,
          ano_inicio: formData.ano_inicio,
          mes_fim: formData.mes_fim,
          ano_fim: formData.ano_fim,
        });
        if (success) {
          toast.success('Campanha atualizada!');
          setEditingId(null);
          setFormData(initialFormData);
        }
      } else {
        // Admin/Gestor: auto-aprovar | Editor: rascunho
        const autoApprove = isGestor;
        const created = await createCampanha({
          marca: formData.marca,
          unidade: formData.unidade || null,
          orcamento_total: formData.orcamento_total,
          mes_inicio: formData.mes_inicio,
          ano_inicio: formData.ano_inicio,
          mes_fim: formData.mes_fim,
          ano_fim: formData.ano_fim,
          status: 'rascunho',
          observacoes: null,
        }, autoApprove);
        if (created) {
          toast.success(autoApprove ? 'Campanha criada e aprovada!' : 'Campanha criada!');
          setFormData(initialFormData);
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (campanha: Campanha) => {
    setEditingId(campanha.id);
    setFormData({
      marca: campanha.marca,
      unidade: campanha.unidade || '',
      orcamento_total: Number(campanha.orcamento_total),
      mes_inicio: campanha.mes_inicio,
      ano_inicio: campanha.ano_inicio,
      mes_fim: campanha.mes_fim,
      ano_fim: campanha.ano_fim,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(initialFormData);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta campanha?')) {
      await deleteCampanha(id);
    }
  };

  const handleDistribuir = (campanhaId: string) => {
    setSelectedCampanhaId(campanhaId);
    setDistribuirDialogOpen(true);
  };

  const handleVisualizar = (campanhaId: string) => {
    setSelectedCampanhaId(campanhaId);
    setVisualizarDialogOpen(true);
  };

  const handleSendForApproval = async (id: string) => {
    const success = await submitForApproval(id);
    if (success) toast.success('Enviado para aprovação!');
  };

  const handleApprove = async (id: string) => {
    await approveCampanha(id);
  };

  const handleReject = async (id: string) => {
    await rejectCampanha(id);
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

  const getMesLabel = (mes: number) => {
    return MONTHS.find(m => m.value === mes)?.label || '';
  };

  const isLoading = authLoading || roleLoading || marcasLoading || loading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background transition-[margin] duration-200" style={{ marginLeft: 'var(--sidebar-w, 15rem)' }}>
      <AppHeader />

      <main className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Cadastro de Orçamentos de Mídia</h1>
        
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Formulário */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                {editingId ? 'Editar Campanha' : 'Nova Campanha'}
              </CardTitle>
              <CardDescription>
                Defina o orçamento total e período da campanha
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Marca e Unidade */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="marca">Marca *</Label>
                  <Select value={formData.marca} onValueChange={handleMarcaChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a marca" />
                    </SelectTrigger>
                    <SelectContent>
                      {marcasNomes.map(marca => (
                        <SelectItem key={marca} value={marca}>{marca}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="unidade">Unidade (opcional)</Label>
                  <Select 
                    value={formData.unidade || '__geral__'} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, unidade: v === '__geral__' ? '' : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Geral" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__geral__">Geral (todas)</SelectItem>
                      {availableUnidades.map(unidade => (
                        <SelectItem key={unidade} value={unidade}>{unidade}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Orçamento Total */}
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <Label className="text-primary font-medium">Orçamento Total *</Label>
                <CurrencyInput
                  value={formData.orcamento_total}
                  onChange={(v) => setFormData(prev => ({ ...prev, orcamento_total: v }))}
                  placeholder="0,00"
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Valor total da campanha (será distribuído por tipo de mídia e mês)
                </p>
              </div>

              {/* Período */}
              <div className="space-y-3">
                <Label>Período da Campanha</Label>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted rounded-lg space-y-2">
                    <p className="text-sm font-medium">Começa em</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        value={formData.mes_inicio.toString()}
                        onValueChange={(v) => setFormData(prev => ({ ...prev, mes_inicio: parseInt(v) }))}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MONTHS.map(m => (
                            <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={formData.ano_inicio.toString()}
                        onValueChange={(v) => setFormData(prev => ({ ...prev, ano_inicio: parseInt(v) }))}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {YEARS.map(y => (
                            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="p-3 bg-muted rounded-lg space-y-2">
                    <p className="text-sm font-medium">Até</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        value={formData.mes_fim.toString()}
                        onValueChange={(v) => setFormData(prev => ({ ...prev, mes_fim: parseInt(v) }))}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MONTHS.map(m => (
                            <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={formData.ano_fim.toString()}
                        onValueChange={(v) => setFormData(prev => ({ ...prev, ano_fim: parseInt(v) }))}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {YEARS.map(y => (
                            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  {editingId ? 'Atualizar' : 'Salvar'}
                </Button>
                {editingId && (
                  <Button variant="outline" onClick={handleCancelEdit}>
                    Cancelar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lista de campanhas */}
          <Card>
            <CardHeader>
              <CardTitle>Campanhas Cadastradas</CardTitle>
              <CardDescription>
                Gerencie suas campanhas e distribua as verbas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {campanhas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma campanha cadastrada ainda.
                </div>
              ) : (
                <div className="space-y-3">
                  {campanhas.map((campanha) => (
                    <Card key={campanha.id} className="border shadow-none">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{campanha.marca}</span>
                              {campanha.unidade && (
                                <span className="text-muted-foreground">- {campanha.unidade}</span>
                              )}
                              {getStatusBadge(campanha.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {getMesLabel(campanha.mes_inicio)}/{campanha.ano_inicio} até {getMesLabel(campanha.mes_fim)}/{campanha.ano_fim}
                            </p>
                            <p className="text-lg font-mono font-bold text-primary">
                              {formatCurrency(Number(campanha.orcamento_total))}
                            </p>
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Visualizar - sempre disponível */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleVisualizar(campanha.id)}
                              title="Visualizar"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {/* Distribuir Verba - disponível para campanhas aprovadas ou rascunho/pendente para gestor/admin */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDistribuir(campanha.id)}
                              title="Distribuir Verba"
                            >
                              <SplitSquareHorizontal className="h-4 w-4" />
                            </Button>

                            {/* Editar - gestor/admin podem editar qualquer campanha, editor só rascunho/pendente/rejeitado */}
                            {(isGestor || campanha.status === 'rascunho' || campanha.status === 'pendente' || campanha.status === 'rejeitado') && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(campanha)}
                                title="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}

                            {/* Enviar para aprovação - só rascunho e apenas para editores (não gestor/admin) */}
                            {campanha.status === 'rascunho' && !isGestor && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleSendForApproval(campanha.id)}
                                title="Enviar para Aprovação"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            )}

                            {/* Aprovar/Rejeitar - só pendente e se tiver permissão de aprovação */}
                            {campanha.status === 'pendente' && canApprove && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleApprove(campanha.id)}
                                  title="Aprovar"
                                  className="text-green-600"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleReject(campanha.id)}
                                  title="Rejeitar"
                                  className="text-destructive"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}

                            {/* Excluir - somente gestor/admin podem excluir */}
                            {isGestor && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(campanha.id)}
                                title="Excluir"
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Dialogs */}
      <DistribuirVerbaDialog
        open={distribuirDialogOpen}
        onOpenChange={setDistribuirDialogOpen}
        campanhaId={selectedCampanhaId}
        onSave={refetch}
      />

      <VisualizarCampanhaDialog
        open={visualizarDialogOpen}
        onOpenChange={setVisualizarDialogOpen}
        campanhaId={selectedCampanhaId}
      />
    </div>
  );
};

export default Orcamentos;
