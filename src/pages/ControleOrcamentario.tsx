import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useControleOrcamentario, ControleFormData } from '@/hooks/useControleOrcamentario';
import { useMarcasUnidadesData } from '@/hooks/useMarcasUnidadesData';
import { useFornecedores } from '@/hooks/useFornecedores';
import { useActivityLog } from '@/hooks/useActivityLog';
import { AppLayout } from '@/components/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, LayoutDashboard, List, PlusCircle } from 'lucide-react';
import { ControleResumoTab } from '@/components/controle-orcamentario/ControleResumoTab';
import { ControleDetalhamentoTab } from '@/components/controle-orcamentario/ControleDetalhamentoTab';
import { ControleInserirCustosTab } from '@/components/controle-orcamentario/ControleInserirCustosTab';
import { supabase } from '@/integrations/supabase/client';
import { YEARS } from '@/components/midia/shared/constants';

const ControleOrcamentario = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { logActivity } = useActivityLog();
  const [activeTab, setActiveTab] = useState('resumo');
  const [anoFiltro, setAnoFiltro] = useState(new Date().getFullYear());
  const [marcaFiltro, setMarcaFiltro] = useState('todas');

  const {
    registros,
    tiposCusto,
    tiposCustoAtivos,
    loading: controleLoading,
    fetchRegistros,
    createRegistro,
    createMultipleRegistros,
    updateRegistro,
    deleteRegistro,
  } = useControleOrcamentario();

  const { marcasNomes, getUnidadesByMarcaNome, loading: marcasLoading } = useMarcasUnidadesData();
  const { fornecedores, isLoading: fornecedoresLoading } = useFornecedores();

  // Fetch orçamentos de área para mostrar saldos
  const [orcamentosArea, setOrcamentosArea] = useState<
    Array<{
      tipo_custo: string;
      marca: string;
      ano: number;
      valor_orcado: number;
      valor_utilizado: number;
      saldo_disponivel: number;
    }>
  >([]);

  const fetchOrcamentosArea = useCallback(async () => {
    try {
      const { data: orcamentos } = await supabase
        .from('orcamentos')
        .select('*')
        .like('tipo', 'area_%')
        .eq('status', 'aprovado');

      if (!orcamentos || orcamentos.length === 0) {
        setOrcamentosArea([]);
        return;
      }

      const { data: tiposCustoData } = await supabase.from('tipos_custo').select('id, nome');

      const tiposMap = new Map((tiposCustoData || []).map((t) => [t.id, t.nome]));

      const { data: gastosRegistros } = await supabase
        .from('controle_orcamentario')
        .select('tipo_custo, marca, ano, valor, status')
        .neq('status', 'cancelado');

      const gastosMap = new Map<string, number>();
      (gastosRegistros || []).forEach((r) => {
        const key = `${r.tipo_custo}_${r.marca}_${r.ano}`;
        gastosMap.set(key, (gastosMap.get(key) || 0) + Number(r.valor || 0));
      });

      const dados = orcamentos
        .map((orc) => {
          const tipoCustoId = orc.tipo.replace('area_', '');
          const tipoCustoNome = tiposMap.get(tipoCustoId) || '';
          const valorOrcado = Number(orc.valor_orcado) + Number(orc.verba_extra || 0);
          const key = `${tipoCustoNome}_${orc.marca}_${orc.ano}`;
          const valorUtilizado = gastosMap.get(key) || 0;

          return {
            tipo_custo: tipoCustoNome,
            marca: orc.marca,
            ano: orc.ano,
            valor_orcado: valorOrcado,
            valor_utilizado: valorUtilizado,
            saldo_disponivel: valorOrcado - valorUtilizado,
          };
        })
        .filter((d) => d.tipo_custo);

      setOrcamentosArea(dados);
    } catch (error) {
      console.error('Erro ao buscar orçamentos de área:', error);
    }
  }, []);

  useEffect(() => {
    fetchOrcamentosArea();
  }, [fetchOrcamentosArea, registros]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const solicitante = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';

  const isLoading = authLoading || roleLoading || controleLoading || marcasLoading || fornecedoresLoading;

  const handleCreateRegistro = async (formData: ControleFormData) => {
    const result = await createRegistro(formData);
    if (result) {
      await logActivity('insert', 'controle_orcamentario', null, {
        descricao: formData.descricao,
        valor: formData.valor,
        tipo_custo: formData.tipo_custo,
        marca: formData.marca,
      });
    }
    return result;
  };

  const handleCreateMultipleRegistros = async (registrosData: ControleFormData[]) => {
    const result = await createMultipleRegistros(registrosData);
    if (result) {
      await logActivity('insert', 'controle_orcamentario', null, {
        quantidade: registrosData.length,
        tipo: 'inserção em massa',
      });
    }
    return result;
  };

  const handleDeleteRegistro = async (id: string) => {
    const registro = registros.find((r) => r.id === id);
    const result = await deleteRegistro(id);
    if (result && registro) {
      await logActivity('delete', 'controle_orcamentario', id, {
        descricao: registro.descricao,
        valor: registro.valor,
        tipo_custo: registro.tipo_custo,
      });
    }
    return result;
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    const registro = registros.find((r) => r.id === id);
    const result = await updateRegistro(id, { status });
    if (result && registro) {
      await logActivity('update', 'controle_orcamentario', id, {
        campo: 'status',
        valor_anterior: registro.status,
        valor_novo: status,
      });
    }
    return result;
  };

  const fornecedoresList = useMemo(
    () => fornecedores.map((f) => ({ id: f.id, nome: f.nome })),
    [fornecedores]
  );

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="flex-1 container py-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Controle Orçamentário</h1>
            <p className="text-muted-foreground">Gerencie custos de área e acompanhe o orçamento</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={String(anoFiltro)} onValueChange={(v) => setAnoFiltro(Number(v))}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={marcaFiltro} onValueChange={setMarcaFiltro}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Marca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as marcas</SelectItem>
                {marcasNomes.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="resumo" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Resumo
            </TabsTrigger>
            <TabsTrigger value="detalhamento" className="gap-2">
              <List className="h-4 w-4" />
              Detalhamento
            </TabsTrigger>
            <TabsTrigger value="inserir" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Inserir Custos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resumo">
            <ControleResumoTab
              registros={registros}
              anoFiltro={anoFiltro}
              marcaFiltro={marcaFiltro}
            />
          </TabsContent>

          <TabsContent value="detalhamento">
            <ControleDetalhamentoTab
              registros={registros}
              anoFiltro={anoFiltro}
              marcaFiltro={marcaFiltro}
              onDelete={handleDeleteRegistro}
              onUpdateStatus={handleUpdateStatus}
            />
          </TabsContent>

          <TabsContent value="inserir">
            <ControleInserirCustosTab
              marcas={marcasNomes}
              getUnidadesByMarca={getUnidadesByMarcaNome}
              fornecedores={fornecedoresList}
              tiposCusto={tiposCustoAtivos}
              solicitante={solicitante}
              onSave={handleCreateRegistro}
              onSaveMultiple={handleCreateMultipleRegistros}
              orcamentosArea={orcamentosArea}
            />
          </TabsContent>

        </Tabs>
      </main>
    </AppLayout>
  );
};

export default ControleOrcamentario;
