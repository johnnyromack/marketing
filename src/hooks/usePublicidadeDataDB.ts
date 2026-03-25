import { useMemo, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { FilterState, KPIData, InvestmentBreakdown } from '@/types/publicidade';
import { Tables } from '@/integrations/supabase/types';
import { isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';

type PublicidadeDados = Tables<'publicidade_dados'>;

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export interface PublicidadeFiltersState extends FilterState {
  dateRange?: DateRange;
  comparisonRange?: DateRange;
  // Multi-select support
  marcas?: string[];
  unidades?: string[];
}

export const usePublicidadeDataDB = () => {
  const { user } = useAuth();
  const [rawData, setRawData] = useState<PublicidadeDados[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PublicidadeFiltersState>({
    month: 'Todas',
    marca: 'Todas',
    unidade: 'Todas',
    marcas: [],
    unidades: [],
    dateRange: { from: undefined, to: undefined },
    comparisonRange: undefined,
  });

  // Fetch all approved data using pagination to bypass 1000 row limit
  const fetchAllApprovedData = useCallback(async (): Promise<PublicidadeDados[]> => {
    const allData: PublicidadeDados[] = [];
    let offset = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('publicidade_dados')
        .select('*')
        .eq('status', 'aprovado')
        .order('year', { ascending: true })
        .order('month_number', { ascending: true })
        .range(offset, offset + batchSize - 1);

      if (error) {
        console.error('Error fetching publicidade data:', error);
        break;
      }

      if (data && data.length > 0) {
        allData.push(...data);
        offset += batchSize;
        hasMore = data.length === batchSize;
      } else {
        hasMore = false;
      }
    }

    return allData;
  }, []);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      // Try RPC function first (most efficient)
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_all_publicidade_dados', { p_status: 'aprovado' });

      if (!rpcError && rpcData) {
        setRawData(rpcData as PublicidadeDados[]);
        console.log(`Loaded ${(rpcData as PublicidadeDados[]).length} rows via RPC`);
      } else {
        // Fallback to paginated fetch if RPC fails
        console.warn('RPC failed, using pagination fallback:', rpcError);
        const allData = await fetchAllApprovedData();
        setRawData(allData);
        console.log(`Loaded ${allData.length} rows via pagination`);
      }
    } catch (error) {
      console.error('Error fetching publicidade data:', error);
      // Ultimate fallback - single query (may be truncated if >1000 rows)
      const { data } = await supabase
        .from('publicidade_dados')
        .select('*')
        .eq('status', 'aprovado')
        .order('year', { ascending: true })
        .order('month_number', { ascending: true });
      setRawData(data || []);
    }
    
    setLoading(false);
  }, [user, fetchAllApprovedData]);

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setRawData([]);
      setLoading(false);
    }
  }, [user, fetchData]);

  // Derive available options from data
  const months = useMemo(() => {
    const uniqueMonths = [...new Set(rawData.map(d => d.month))];
    return ['Todas', ...uniqueMonths];
  }, [rawData]);

  // Get available months with year for the month picker
  const availableMonths = useMemo(() => {
    const monthNames: Record<number, string> = {
      1: 'Jan', 2: 'Fev', 3: 'Mar', 4: 'Abr', 5: 'Mai', 6: 'Jun',
      7: 'Jul', 8: 'Ago', 9: 'Set', 10: 'Out', 11: 'Nov', 12: 'Dez'
    };
    
    const uniqueMonthYears = new Map<string, { year: number; monthNumber: number }>();
    rawData.forEach(d => {
      const key = `${d.year}-${d.month_number}`;
      if (!uniqueMonthYears.has(key)) {
        uniqueMonthYears.set(key, { year: d.year, monthNumber: d.month_number });
      }
    });
    
    return Array.from(uniqueMonthYears.values())
      .map(item => ({
        year: item.year,
        monthNumber: item.monthNumber,
        label: monthNames[item.monthNumber] || item.monthNumber.toString(),
        date: new Date(item.year, item.monthNumber - 1, 1),
      }))
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return a.monthNumber - b.monthNumber;
      });
  }, [rawData]);

  const marcas = useMemo(() => {
    const uniqueMarcas = [...new Set(rawData.map(d => d.marca))];
    return ['Todas', ...uniqueMarcas.sort()];
  }, [rawData]);

  // Get unique unidades from data, with "Geral" first (represents brand totals)
  const unidades = useMemo(() => {
    const uniqueUnidades = [...new Set(rawData.map(d => d.unidade))];
    const sortedUnidades = uniqueUnidades.sort((a, b) => {
      if (a === 'Geral') return -1;
      if (b === 'Geral') return 1;
      return a.localeCompare(b);
    });
    return ['Todas', ...sortedUnidades];
  }, [rawData]);

  // Helper to check if item is within date range
  const isWithinDateRange = useCallback((item: PublicidadeDados, range: DateRange | undefined) => {
    if (!range?.from && !range?.to) return true;
    
    // Create date from year and month_number
    const itemDate = new Date(item.year, item.month_number - 1, 15); // Middle of month
    
    if (range.from && range.to) {
      return isWithinInterval(itemDate, { start: startOfMonth(range.from), end: endOfMonth(range.to) });
    }
    if (range.from) {
      return itemDate >= startOfMonth(range.from);
    }
    if (range.to) {
      return itemDate <= endOfMonth(range.to);
    }
    return true;
  }, []);

  // Apply filters
  // When unidade filter is "Todas", use only "Geral" records to avoid double counting
  // When a specific unidade is selected (including "Geral"), show that specific unidade
  // Multi-select aware marca/unidade matching
  const matchMarca = useCallback((itemMarca: string) => {
    if (filters.marcas && filters.marcas.length > 0) {
      return filters.marcas.includes(itemMarca);
    }
    return filters.marca === 'Todas' || itemMarca === filters.marca;
  }, [filters.marca, filters.marcas]);

  const matchUnidade = useCallback((itemUnidade: string) => {
    if (filters.unidades && filters.unidades.length > 0) {
      return filters.unidades.includes(itemUnidade);
    }
    return filters.unidade === 'Todas' 
      ? itemUnidade === 'Geral' 
      : itemUnidade === filters.unidade;
  }, [filters.unidade, filters.unidades]);

  const filteredData = useMemo(() => {
    return rawData.filter(item => {
      const monthMatch = filters.month === 'Todas' || item.month === filters.month;
      const marcaMatch = matchMarca(item.marca);
      // When no unidades selected in multi-select, use "Geral" records
      const unidadeMatch = (filters.unidades && filters.unidades.length > 0)
        ? filters.unidades.includes(item.unidade)
        : (filters.unidade === 'Todas' ? item.unidade === 'Geral' : item.unidade === filters.unidade);
      const dateMatch = isWithinDateRange(item, filters.dateRange);
      return monthMatch && marcaMatch && unidadeMatch && dateMatch;
    });
  }, [rawData, filters, isWithinDateRange, matchMarca]);

  // Full data including all units (for DashboardTable which needs both brands and units)
  const fullTableData = useMemo(() => {
    return rawData.filter(item => {
      const monthMatch = filters.month === 'Todas' || item.month === filters.month;
      const marcaMatch = matchMarca(item.marca);
      const dateMatch = isWithinDateRange(item, filters.dateRange);
      return monthMatch && marcaMatch && dateMatch;
    });
  }, [rawData, filters.month, filters.marca, filters.marcas, filters.dateRange, isWithinDateRange, matchMarca]);

  // Comparison period data
  // Same logic - when unidade is "Todas", only use "Geral" records
  const comparisonData = useMemo(() => {
    if (!filters.comparisonRange?.from) {
      return [];
    }
    return rawData.filter(item => {
      const marcaMatch = matchMarca(item.marca);
      const unidadeMatch = (filters.unidades && filters.unidades.length > 0)
        ? filters.unidades.includes(item.unidade)
        : (filters.unidade === 'Todas' ? item.unidade === 'Geral' : item.unidade === filters.unidade);
      const dateMatch = isWithinDateRange(item, filters.comparisonRange);
      return marcaMatch && unidadeMatch && dateMatch;
    });
  }, [rawData, filters.comparisonRange, filters.marca, filters.marcas, filters.unidade, filters.unidades, isWithinDateRange, matchMarca]);

  // Calculate KPIs
  // Calculate KPIs using correct formulas:
  // CPL = Total Investment / Total Leads (weighted average, not arithmetic average)
  // CAC = Total Investment / Total Enrollments
  const kpis = useMemo((): KPIData[] => {
    if (filteredData.length === 0) {
      return [
        { label: 'Total de Leads', value: 0, orcado: 0, ca: 0, format: 'number' },
        { label: 'Total Matrículas', value: 0, orcado: 0, ca: 0, format: 'number' },
        { label: 'CAC Raiz', value: 0, orcado: 0, ca: 0, prefix: 'R$', format: 'currency' },
        { label: 'CPL Médio', value: 0, orcado: 0, ca: 0, prefix: 'R$', format: 'currency' },
        { label: 'CPL Produtivo', value: 0, orcado: 0, ca: 0, prefix: 'R$', format: 'currency' },
        { label: 'Investimento Total', value: 0, orcado: 0, ca: 0, prefix: 'R$', format: 'currency' },
      ];
    }

    // Totals for leads
    const totalLeadsReal = filteredData.reduce((sum, b) => sum + b.leads_real, 0);
    const totalLeadsOrcado = filteredData.reduce((sum, b) => sum + b.leads_orcado, 0);
    const totalLeadsA1 = filteredData.reduce((sum, b) => sum + b.leads_a1, 0);

    // Totals for enrollments
    const totalMatriculasReal = filteredData.reduce((sum, b) => sum + b.matriculas_real, 0);
    const totalMatriculasOrcado = filteredData.reduce((sum, b) => sum + b.matriculas_orcado, 0);
    const totalMatriculasA1 = filteredData.reduce((sum, b) => sum + b.matriculas_a1, 0);

    // Total investment (current period)
    const totalInvest = filteredData.reduce(
      (sum, b) => sum + Number(b.invest_meta) + Number(b.invest_google) + Number(b.invest_off) + Number(b.invest_eventos),
      0
    );

    // For budgeted/A-1 investments, we use the stored CPL/CAC values to reverse-calculate
    // since we don't have separate investment columns for those periods
    // CPL_orcado and CAC_orcado from database are per-brand values
    const totalInvestOrcado = filteredData.reduce((sum, b) => sum + (Number(b.cpl_orcado) * b.leads_orcado), 0);
    const totalInvestA1 = filteredData.reduce((sum, b) => sum + (Number(b.cpl_a1) * b.leads_a1), 0);

    // CPL = Total Investment / Total Leads (correct weighted calculation)
    const cplReal = totalLeadsReal > 0 ? totalInvest / totalLeadsReal : 0;
    const cplOrcado = totalLeadsOrcado > 0 ? totalInvestOrcado / totalLeadsOrcado : 0;
    const cplA1 = totalLeadsA1 > 0 ? totalInvestA1 / totalLeadsA1 : 0;

    // CAC = Total Investment / Total Enrollments (correct weighted calculation)
    const cacReal = totalMatriculasReal > 0 ? totalInvest / totalMatriculasReal : 0;
    const cacOrcado = totalMatriculasOrcado > 0 ? totalInvestOrcado / totalMatriculasOrcado : 0;
    const cacA1 = totalMatriculasA1 > 0 ? totalInvestA1 / totalMatriculasA1 : 0;

    // CPL Produtivo - only if there are productive leads
    const totalLeadsProd = filteredData.reduce((sum, b) => sum + b.leads_prod_real, 0);
    const totalLeadsProdOrcado = filteredData.reduce((sum, b) => sum + b.leads_prod_orcado, 0);
    const totalLeadsProdA1 = filteredData.reduce((sum, b) => sum + b.leads_prod_a1, 0);
    
    const cplProdReal = totalLeadsProd > 0 ? totalInvest / totalLeadsProd : 0;
    const cplProdOrcado = totalLeadsProdOrcado > 0 ? totalInvestOrcado / totalLeadsProdOrcado : 0;
    const cplProdA1 = totalLeadsProdA1 > 0 ? totalInvestA1 / totalLeadsProdA1 : 0;

    return [
      { label: 'Total de Leads', value: totalLeadsReal, orcado: totalLeadsOrcado, ca: totalLeadsA1, format: 'number' },
      { label: 'Total Matrículas', value: totalMatriculasReal, orcado: totalMatriculasOrcado, ca: totalMatriculasA1, format: 'number' },
      { label: 'CAC Raiz', value: cacReal, orcado: cacOrcado, ca: cacA1, prefix: 'R$', format: 'currency' },
      { label: 'CPL Médio', value: cplReal, orcado: cplOrcado, ca: cplA1, prefix: 'R$', format: 'currency' },
      { label: 'CPL Produtivo', value: cplProdReal, orcado: cplProdOrcado, ca: cplProdA1, prefix: 'R$', format: 'currency' },
      { label: 'Investimento Total', value: totalInvest, orcado: totalInvestOrcado, ca: totalInvestA1, prefix: 'R$', format: 'currency' },
    ];
  }, [filteredData]);

  // Leads evolution by month - with comparison support
  // Uses month_number for proper ordering
  const leadsEvolution = useMemo(() => {
    // filteredData is already filtered by marca(s), use it directly
    const dataToUse = filteredData;

    const byMonth: Record<number, { name: string; real: number; orcado: number; a1: number; comparison?: number }> = {};
    
    dataToUse.forEach(item => {
      const key = item.month_number;
      if (!byMonth[key]) {
        byMonth[key] = { name: item.month.substring(0, 3), real: 0, orcado: 0, a1: 0 };
      }
      byMonth[key].real += item.leads_real;
      byMonth[key].orcado += item.leads_orcado;
      byMonth[key].a1 += item.leads_a1;
    });

    // Add comparison data if available - align by month number (relative position)
    if (comparisonData && comparisonData.length > 0) {
      const compDataFiltered = comparisonData;
      
      // Group comparison data by month number
      const compByMonth: Record<number, number> = {};
      compDataFiltered.forEach(item => {
        compByMonth[item.month_number] = (compByMonth[item.month_number] || 0) + item.leads_real;
      });
      
      // Add comparison values to existing months
      Object.keys(byMonth).forEach(monthKey => {
        const monthNum = parseInt(monthKey);
        if (compByMonth[monthNum] !== undefined) {
          byMonth[monthNum].comparison = compByMonth[monthNum];
        }
      });
    }

    // Sort by month number and return
    return Object.entries(byMonth)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([_, values]) => values);
  }, [filteredData, comparisonData, filters.marca]);

  // Brand performance - with comparison support
  const brandPerformance = useMemo(() => {
    const byBrand: Record<string, { real: number; orcado: number; a1: number; comparison?: number }> = {};
    
    filteredData.forEach(item => {
      if (!byBrand[item.marca]) {
        byBrand[item.marca] = { real: 0, orcado: 0, a1: 0 };
      }
      byBrand[item.marca].real += item.leads_real;
      byBrand[item.marca].orcado += item.leads_orcado;
      byBrand[item.marca].a1 += item.leads_a1;
    });

    // Add comparison data if available
    if (comparisonData.length > 0) {
      comparisonData.forEach(item => {
        if (!byBrand[item.marca]) {
          byBrand[item.marca] = { real: 0, orcado: 0, a1: 0, comparison: 0 };
        }
        byBrand[item.marca].comparison = (byBrand[item.marca].comparison || 0) + item.leads_real;
      });
    }

    return Object.entries(byBrand).map(([name, values]) => ({
      name,
      ...values,
    }));
  }, [filteredData, comparisonData]);

  // Investment breakdown
  const investmentBreakdown = useMemo((): InvestmentBreakdown[] => {
    const meta = filteredData.reduce((sum, b) => sum + Number(b.invest_meta), 0);
    const google = filteredData.reduce((sum, b) => sum + Number(b.invest_google), 0);
    const off = filteredData.reduce((sum, b) => sum + Number(b.invest_off), 0);
    const eventos = filteredData.reduce((sum, b) => sum + Number(b.invest_eventos), 0);

    return [
      { name: 'Meta', value: meta, color: 'hsl(var(--chart-1))' },
      { name: 'Google', value: google, color: 'hsl(var(--chart-2))' },
      { name: 'Off', value: off, color: 'hsl(var(--chart-3))' },
      { name: 'Eventos', value: eventos, color: 'hsl(var(--chart-4))' },
    ];
  }, [filteredData]);

  // CAC/CPL by brand
  const cacCplByBrand = useMemo(() => {
    const dataToUse = filters.month === 'Todas'
      ? filteredData
      : filteredData.filter(d => d.month === filters.month);

    const byBrand: Record<string, { cac: number; cpl: number; cplProd: number; count: number }> = {};
    
    dataToUse.forEach(item => {
      if (!byBrand[item.marca]) {
        byBrand[item.marca] = { cac: 0, cpl: 0, cplProd: 0, count: 0 };
      }
      byBrand[item.marca].cac += Number(item.cac_real);
      byBrand[item.marca].cpl += Number(item.cpl_real);
      byBrand[item.marca].cplProd += Number(item.cpl_prod_real);
      byBrand[item.marca].count += 1;
    });

    return Object.entries(byBrand).map(([name, values]) => ({
      name,
      cac: values.cac / values.count,
      cpl: values.cpl / values.count,
      cplProd: values.cplProd / values.count,
    }));
  }, [filteredData, filters.month]);

  // Convert filtered data to BrandData format for table
  const tableData = useMemo(() => {
    return filteredData.map(item => ({
      marca: item.marca,
      unidade: item.unidade,
      leadsReal: item.leads_real,
      leadsOrcado: item.leads_orcado,
      leadsA1: item.leads_a1,
      leadsProdReal: item.leads_prod_real,
      leadsProdOrcado: item.leads_prod_orcado,
      leadsProdA1: item.leads_prod_a1,
      matriculasReal: item.matriculas_real,
      matriculasOrcado: item.matriculas_orcado,
      matriculasA1: item.matriculas_a1,
      cacReal: Number(item.cac_real),
      cacOrcado: Number(item.cac_orcado),
      cacA1: Number(item.cac_a1),
      cplReal: Number(item.cpl_real),
      cplOrcado: Number(item.cpl_orcado),
      cplA1: Number(item.cpl_a1),
      cplProdReal: Number(item.cpl_prod_real),
      cplProdOrcado: Number(item.cpl_prod_orcado),
      cplProdA1: Number(item.cpl_prod_a1),
      investMeta: Number(item.invest_meta),
      investGoogle: Number(item.invest_google),
      investOff: Number(item.invest_off),
      investEventos: Number(item.invest_eventos),
    }));
  }, [filteredData]);

  // Full table data with all brands AND units (for DashboardTable tabs)
  const fullTableDataFormatted = useMemo(() => {
    return fullTableData.map(item => ({
      marca: item.marca,
      unidade: item.unidade,
      leadsReal: item.leads_real,
      leadsOrcado: item.leads_orcado,
      leadsA1: item.leads_a1,
      leadsProdReal: item.leads_prod_real,
      leadsProdOrcado: item.leads_prod_orcado,
      leadsProdA1: item.leads_prod_a1,
      matriculasReal: item.matriculas_real,
      matriculasOrcado: item.matriculas_orcado,
      matriculasA1: item.matriculas_a1,
      cacReal: Number(item.cac_real),
      cacOrcado: Number(item.cac_orcado),
      cacA1: Number(item.cac_a1),
      cplReal: Number(item.cpl_real),
      cplOrcado: Number(item.cpl_orcado),
      cplA1: Number(item.cpl_a1),
      cplProdReal: Number(item.cpl_prod_real),
      cplProdOrcado: Number(item.cpl_prod_orcado),
      cplProdA1: Number(item.cpl_prod_a1),
      investMeta: Number(item.invest_meta),
      investGoogle: Number(item.invest_google),
      investOff: Number(item.invest_off),
      investEventos: Number(item.invest_eventos),
    }));
  }, [fullTableData]);

  // Dados de eventos
  const eventsData = useMemo(() => {
    return filteredData.map(item => {
      const numEventos = item.num_eventos || 0;
      const leadsEventos = item.leads_eventos || 0;
      const investEventos = Number(item.invest_eventos) || 0;
      const cplEventos = leadsEventos > 0 ? investEventos / leadsEventos : 0;
      
      return {
        marca: item.marca,
        month: item.month,
        numEventos,
        investEventos,
        leadsEventos,
        cplEventos,
      };
    });
  }, [filteredData]);

  return {
    loading,
    filters,
    setFilters,
    filteredData: tableData,
    fullTableData: fullTableDataFormatted,
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
    hasData: rawData.length > 0,
    hasComparison: comparisonData.length > 0,
    refetch: fetchData,
    // Debug info
    totalRowsLoaded: rawData.length,
  };
};
