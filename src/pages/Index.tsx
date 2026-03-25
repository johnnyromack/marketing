import { usePublicidadeData } from '@/hooks/usePublicidadeData';
import {
  DashboardFilters,
  KPICard,
  LeadsEvolutionChart,
  BrandPerformanceChart,
  InvestmentPieChart,
  CACCPLChart,
  PerformanceTable,
} from '@/components/dashboard';
import { Users, DollarSign, Target, TrendingUp, PiggyBank } from 'lucide-react';

const Index = () => {
  const {
    filters,
    setFilters,
    filteredData,
    kpis,
    leadsEvolution,
    brandPerformance,
    investmentBreakdown,
    cacCplByBrand,
    months,
    marcas,
  } = usePublicidadeData();

  const kpiIcons = [
    <Users className="h-5 w-5" />,
    <DollarSign className="h-5 w-5" />,
    <Target className="h-5 w-5" />,
    <TrendingUp className="h-5 w-5" />,
    <PiggyBank className="h-5 w-5" />,
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Análise estratégica de marketing • Jul-Nov 2025</p>
            </div>
            <DashboardFilters
              filters={filters}
              onFilterChange={setFilters}
              months={months}
              marcas={marcas}
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* KPI Cards */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {kpis.map((kpi, index) => (
              <KPICard key={kpi.label} data={kpi} icon={kpiIcons[index]} />
            ))}
          </div>
        </section>

        {/* Charts Row 1 */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LeadsEvolutionChart data={leadsEvolution} />
          <BrandPerformanceChart data={brandPerformance} />
        </section>

        {/* Charts Row 2 */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InvestmentPieChart data={investmentBreakdown} />
          <CACCPLChart data={cacCplByBrand} />
        </section>

        {/* Performance Table */}
        <section>
          <PerformanceTable data={filteredData} />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Romack Vision • Dados consolidados Jul-Nov 2025
        </div>
      </footer>
    </div>
  );
};

export default Index;
