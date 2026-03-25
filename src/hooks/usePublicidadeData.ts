import { useMemo, useState } from 'react';
import { monthlyData, months, marcas, unidades } from '@/data/publicidadeData';
import { FilterState, KPIData, ChartDataPoint, InvestmentBreakdown } from '@/types/publicidade';

export const usePublicidadeData = () => {
  const [filters, setFilters] = useState<FilterState>({
    month: 'Novembro',
    marca: 'Todas',
    unidade: 'Todas',
  });

  const filteredData = useMemo(() => {
    const monthData = monthlyData.find(m => m.month === filters.month);
    if (!monthData) return [];

    return monthData.brands.filter(brand => {
      const marcaMatch = filters.marca === 'Todas' || brand.marca === filters.marca;
      const unidadeMatch = filters.unidade === 'Todas' || brand.unidade === filters.unidade;
      return marcaMatch && unidadeMatch;
    });
  }, [filters]);

  const kpis = useMemo((): KPIData[] => {
    if (filteredData.length === 0) return [];

    const totalLeadsReal = filteredData.reduce((sum, b) => sum + b.leadsReal, 0);
    const totalLeadsOrcado = filteredData.reduce((sum, b) => sum + b.leadsOrcado, 0);
    const totalLeadsA1 = filteredData.reduce((sum, b) => sum + b.leadsA1, 0);

    const avgCAC = filteredData.reduce((sum, b) => sum + b.cacReal, 0) / filteredData.length;
    const avgCACOrcado = filteredData.reduce((sum, b) => sum + b.cacOrcado, 0) / filteredData.length;
    const avgCACA1 = filteredData.reduce((sum, b) => sum + b.cacA1, 0) / filteredData.length;

    const avgCPL = filteredData.reduce((sum, b) => sum + b.cplReal, 0) / filteredData.length;
    const avgCPLOrcado = filteredData.reduce((sum, b) => sum + b.cplOrcado, 0) / filteredData.length;
    const avgCPLA1 = filteredData.reduce((sum, b) => sum + b.cplA1, 0) / filteredData.length;

    const avgCPLProd = filteredData.reduce((sum, b) => sum + b.cplProdReal, 0) / filteredData.length;
    const avgCPLProdOrcado = filteredData.reduce((sum, b) => sum + b.cplProdOrcado, 0) / filteredData.length;
    const avgCPLProdA1 = filteredData.reduce((sum, b) => sum + b.cplProdA1, 0) / filteredData.length;

    const totalInvest = filteredData.reduce(
      (sum, b) => sum + b.investMeta + b.investGoogle + b.investOff + b.investEventos,
      0
    );
    const totalInvestOrcado = totalInvest * 1.05; // Estimate
    const totalInvestA1 = totalInvest * 0.88; // Estimate

    return [
      { label: 'Total de Leads', value: totalLeadsReal, orcado: totalLeadsOrcado, ca: totalLeadsA1, format: 'number' },
      { label: 'CAC Raiz', value: avgCAC, orcado: avgCACOrcado, ca: avgCACA1, prefix: 'R$', format: 'currency' },
      { label: 'CPL Médio', value: avgCPL, orcado: avgCPLOrcado, ca: avgCPLA1, prefix: 'R$', format: 'currency' },
      { label: 'CPL Produtivo', value: avgCPLProd, orcado: avgCPLProdOrcado, ca: avgCPLProdA1, prefix: 'R$', format: 'currency' },
      { label: 'Investimento Total', value: totalInvest, orcado: totalInvestOrcado, ca: totalInvestA1, prefix: 'R$', format: 'currency' },
    ];
  }, [filteredData]);

  const leadsEvolution = useMemo((): ChartDataPoint[] => {
    return monthlyData.map(month => {
      const brands = filters.marca === 'Todas' 
        ? month.brands 
        : month.brands.filter(b => b.marca === filters.marca);
      
      return {
        name: month.month.substring(0, 3),
        real: brands.reduce((sum, b) => sum + b.leadsReal, 0),
        orcado: brands.reduce((sum, b) => sum + b.leadsOrcado, 0),
        a1: brands.reduce((sum, b) => sum + b.leadsA1, 0),
      };
    });
  }, [filters.marca]);

  const brandPerformance = useMemo((): ChartDataPoint[] => {
    const monthData = monthlyData.find(m => m.month === filters.month);
    if (!monthData) return [];

    return monthData.brands.map(brand => ({
      name: brand.marca,
      real: brand.leadsReal,
      orcado: brand.leadsOrcado,
      a1: brand.leadsA1,
    }));
  }, [filters.month]);

  const investmentBreakdown = useMemo((): InvestmentBreakdown[] => {
    const meta = filteredData.reduce((sum, b) => sum + b.investMeta, 0);
    const google = filteredData.reduce((sum, b) => sum + b.investGoogle, 0);
    const off = filteredData.reduce((sum, b) => sum + b.investOff, 0);
    const eventos = filteredData.reduce((sum, b) => sum + b.investEventos, 0);

    return [
      { name: 'Meta', value: meta, color: 'hsl(var(--chart-1))' },
      { name: 'Google', value: google, color: 'hsl(var(--chart-2))' },
      { name: 'Off', value: off, color: 'hsl(var(--chart-3))' },
      { name: 'Eventos', value: eventos, color: 'hsl(var(--chart-4))' },
    ];
  }, [filteredData]);

  const cacCplByBrand = useMemo(() => {
    const monthData = monthlyData.find(m => m.month === filters.month);
    if (!monthData) return [];

    return monthData.brands.map(brand => ({
      name: brand.marca,
      cac: brand.cacReal,
      cpl: brand.cplReal,
      cplProd: brand.cplProdReal,
    }));
  }, [filters.month]);

  return {
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
  };
};
