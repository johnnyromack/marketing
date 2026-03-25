import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMidiaData, DateRange } from '@/hooks/useMidiaData';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, LayoutDashboard, Monitor, Radio, Calendar, Gift } from 'lucide-react';
import { MidiaFilters, MidiaConsolidatedTable } from '@/components/midia-dashboard';
import { ResumoTab, MidiaOnTab, MidiaOffTab, EventosTab, BrindesTab } from '@/components/midia-dashboard/tabs';
import { AIAnalysisButton } from '@/components/ai';

const MidiaDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Date range state for period comparison
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [comparisonRange, setComparisonRange] = useState<DateRange | undefined>(undefined);
  const {
    loading,
    filters,
    setFilters,
    // KPIs
    kpis,
    midiaOnKpis,
    midiaOffKpis,
    eventosKpis,
    brindesKpis,
    // Charts data
    investmentEvolution,
    investmentBreakdown,
    brandBreakdown,
    // Mídia On specific
    midiaOnFornecedorBreakdown,
    midiaOnBrandBreakdown,
    midiaOnEvolution,
    // Mídia Off specific
    midiaOffTipoBreakdown,
    midiaOffFornecedorBreakdown,
    midiaOffBrandBreakdown,
    midiaOffEvolution,
    // Eventos specific
    eventosCategoriaBreakdown,
    eventosBrandBreakdown,
    proximosEventos,
    // Brindes specific
    brindesCategoriaBreakdown,
    brindesBrandBreakdown,
    // Table
    consolidatedTable,
    // Filter options
    availableMonths,
    availableMarcas,
    availableUnidades,
    availableYears,
    hasData,
  } = useMidiaData();

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background transition-[margin] duration-200" style={{ marginLeft: 'var(--sidebar-w, 15rem)' }}>
      <AppHeader />

      {/* Sub-header with filters */}
      <div className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Dashboard de Mídia</h1>
              <p className="text-sm text-muted-foreground">Controle orçamentário de mídia e eventos</p>
            </div>
            {hasData && (
              <MidiaFilters
                filters={filters}
                onFilterChange={setFilters}
                months={availableMonths}
                years={availableYears.length > 0 ? availableYears : [2025]}
                availableMarcas={availableMarcas}
                availableUnidades={availableUnidades}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                comparisonRange={comparisonRange}
                onComparisonRangeChange={setComparisonRange}
                showDateFilter={true}
              />
            )}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold">Nenhum dado de mídia cadastrado</h2>
              <p className="text-muted-foreground">Comece adicionando seus dados de mídia on, off, eventos e brindes</p>
            </div>
            <Link to="/midia">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Mídia
              </Button>
            </Link>
          </div>
        ) : (
          <Tabs defaultValue="resumo" className="w-full">
            <TabsList className="grid w-full max-w-3xl grid-cols-5 mb-6">
              <TabsTrigger value="resumo" className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Resumo</span>
              </TabsTrigger>
              <TabsTrigger value="midia-on" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                <span className="hidden sm:inline">Mídia On</span>
              </TabsTrigger>
              <TabsTrigger value="midia-off" className="flex items-center gap-2">
                <Radio className="h-4 w-4" />
                <span className="hidden sm:inline">Mídia Off</span>
              </TabsTrigger>
              <TabsTrigger value="eventos" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Eventos</span>
              </TabsTrigger>
              <TabsTrigger value="brindes" className="flex items-center gap-2">
                <Gift className="h-4 w-4" />
                <span className="hidden sm:inline">Brindes</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="resumo">
              <ResumoTab
                kpis={kpis}
                investmentEvolution={investmentEvolution}
                investmentBreakdown={investmentBreakdown}
                brandBreakdown={brandBreakdown}
              />
              {/* Tabela consolidada abaixo do resumo */}
              <div className="mt-6">
                <MidiaConsolidatedTable data={consolidatedTable} />
              </div>
            </TabsContent>

            <TabsContent value="midia-on">
              <MidiaOnTab
                kpis={midiaOnKpis}
                fornecedorBreakdown={midiaOnFornecedorBreakdown}
                brandBreakdown={midiaOnBrandBreakdown}
                investmentEvolution={midiaOnEvolution}
              />
            </TabsContent>

            <TabsContent value="midia-off">
              <MidiaOffTab
                kpis={midiaOffKpis}
                tipoMidiaBreakdown={midiaOffTipoBreakdown}
                brandBreakdown={midiaOffBrandBreakdown}
                fornecedorBreakdown={midiaOffFornecedorBreakdown}
                monthlyEvolution={midiaOffEvolution}
                marcas={filters.marcas}
              />
            </TabsContent>

            <TabsContent value="eventos">
              <EventosTab
                kpis={eventosKpis}
                categoriaBreakdown={eventosCategoriaBreakdown}
                brandBreakdown={eventosBrandBreakdown}
                proximosEventos={proximosEventos}
              />
            </TabsContent>

            <TabsContent value="brindes">
              <BrindesTab
                kpis={brindesKpis}
                categoriaBreakdown={brindesCategoriaBreakdown}
                brandBreakdown={brindesBrandBreakdown}
              />
            </TabsContent>
          </Tabs>
        )}
      </main>

      {hasData && (
        <AIAnalysisButton
          dashboardData={{
            kpis,
            midiaOnKpis,
            midiaOffKpis,
            eventosKpis,
            brindesKpis,
            investmentEvolution,
            investmentBreakdown,
            brandBreakdown,
            consolidatedTable: consolidatedTable.slice(0, 30),
            filters,
          }}
          analysisType="midia"
          title="Análise de Mídia com IA"
        />
      )}

      <footer className="border-t border-border py-4 mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Dashboard de Mídia • {user?.email}
        </div>
      </footer>
    </div>
  );
};

export default MidiaDashboard;
