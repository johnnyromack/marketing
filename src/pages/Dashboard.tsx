import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePublicidadeDataDB, DateRange } from '@/hooks/usePublicidadeDataDB';
import { useMarcasUnidadesData } from '@/hooks/useMarcasUnidadesData';
import {
  DashboardFilters,
  MonthFilter,
  KPICard,
  LeadsEvolutionChart,
  BrandPerformanceChart,
  InvestmentPieChart,
  CACCPLChart,
  DashboardTable,
  EventsSection,
} from '@/components/dashboard';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, DollarSign, Target, TrendingUp, PiggyBank, Plus, Loader2, Table2, BarChart3, GraduationCap, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AIAnalysisButton } from '@/components/ai';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'table' | 'charts' | 'events'>('table');
  const { getUnidadesByMarcaNome } = useMarcasUnidadesData();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const {
    loading,
    filters,
    setFilters,
    filteredData,
    fullTableData,
    eventsData,
    kpis,
    leadsEvolution,
    brandPerformance,
    investmentBreakdown,
    cacCplByBrand,
    months,
    availableMonths,
    marcas,
    unidades,
    hasData,
    hasComparison,
  } = usePublicidadeDataDB();

  const handleDateRangeChange = (range: DateRange) => {
    setFilters({ ...filters, dateRange: range });
  };

  const handleComparisonRangeChange = (range: DateRange | undefined) => {
    setFilters({ ...filters, comparisonRange: range });
  };

  const handleMultiFilterChange = (multiFilters: { month: string; marcas: string[]; unidades: string[] }) => {
    setFilters({ 
      ...filters, 
      month: multiFilters.month,
      marcas: multiFilters.marcas,
      unidades: multiFilters.unidades,
      // Keep single-select in sync for backward compat
      marca: multiFilters.marcas.length === 1 ? multiFilters.marcas[0] : 'Todas',
      unidade: multiFilters.unidades.length === 1 ? multiFilters.unidades[0] : 'Todas',
    });
  };

  const multiFilters = useMemo(() => ({
    month: filters.month,
    marcas: filters.marcas || [],
    unidades: filters.unidades || [],
  }), [filters.month, filters.marcas, filters.unidades]);

  const kpiIcons = [
    <Users className="h-5 w-5" />,
    <GraduationCap className="h-5 w-5" />,
    <DollarSign className="h-5 w-5" />,
    <Target className="h-5 w-5" />,
    <TrendingUp className="h-5 w-5" />,
    <PiggyBank className="h-5 w-5" />,
  ];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AppLayout>
      {/* Sub-header with filters */}
      <div className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
                <p className="text-sm text-muted-foreground">Análise estratégica de marketing</p>
              </div>
              {hasData && (
                <DashboardFilters
                  filters={filters}
                  onFilterChange={setFilters}
                  months={months}
                  marcas={marcas}
                  unidades={unidades}
                  multiSelectMode={true}
                  multiFilters={multiFilters}
                  onMultiFilterChange={handleMultiFilterChange}
                />
              )}
            </div>
            {hasData && (
              <MonthFilter
                dateRange={filters.dateRange || { from: undefined, to: undefined }}
                onDateRangeChange={handleDateRangeChange}
                comparisonRange={filters.comparisonRange}
                onComparisonRangeChange={handleComparisonRangeChange}
                showComparison={true}
                availableMonths={availableMonths}
              />
            )}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold">Nenhum dado cadastrado ainda</h2>
              <p className="text-muted-foreground">Comece adicionando seus dados de publicidade</p>
            </div>
            <Link to="/entrada-dados">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Dados
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <section>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                {kpis.map((kpi, index) => (
                  <KPICard key={kpi.label} data={kpi} icon={kpiIcons[index]} />
                ))}
              </div>
            </section>

            {/* View Toggle */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'table' | 'charts')} className="w-full">
              <TabsList className="grid w-full max-w-lg grid-cols-3">
                <TabsTrigger value="table" className="flex items-center gap-2">
                  <Table2 className="h-4 w-4" />
                  Tabela
                </TabsTrigger>
                <TabsTrigger value="charts" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Gráficos
                </TabsTrigger>
                <TabsTrigger value="events" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Eventos
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="table" className="mt-6">
                <DashboardTable data={fullTableData} showAccumulated={true} />
              </TabsContent>
              
              <TabsContent value="charts" className="mt-6 space-y-6">
                {/* Charts Row 1 */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <LeadsEvolutionChart data={leadsEvolution} hasComparison={hasComparison} />
                  <BrandPerformanceChart data={brandPerformance} hasComparison={hasComparison} />
                </section>

                {/* Charts Row 2 */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <InvestmentPieChart data={investmentBreakdown} />
                  <CACCPLChart data={cacCplByBrand} />
                </section>
              </TabsContent>

              <TabsContent value="events" className="mt-6">
                <EventsSection data={eventsData} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>

      {hasData && (
        <AIAnalysisButton
          dashboardData={{
            kpis,
            filteredData: filteredData.slice(0, 50),
            leadsEvolution,
            brandPerformance,
            investmentBreakdown,
            filters,
          }}
          analysisType="publicidade"
          title="Análise de Publicidade com IA"
        />
      )}

      {/* Footer */}
      <footer className="border-t border-border py-4 mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          {user?.email}
        </div>
      </footer>
    </AppLayout>
  );
};

export default Dashboard;
