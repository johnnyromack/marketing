import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useMarcasUnidadesData } from '@/hooks/useMarcasUnidadesData';

type MidiaOn = Tables<'midia_on'>;
type MidiaOff = Tables<'midia_off'>;
type Evento = Tables<'eventos'>;
type Brinde = Tables<'brindes'>;
type Orcamento = Tables<'orcamentos'>;
type PublicidadeDados = Tables<'publicidade_dados'>;

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export interface MidiaFilterState {
  month: string;
  marcas: string[];
  unidades: string[];
  ano: number | 'Todos'; // 'Todos' = show entire campaign, number = filter by year
  tipo: 'Todos' | 'Mídia On' | 'Mídia Off' | 'Eventos' | 'Brindes';
  dateRange?: DateRange;
  comparisonRange?: DateRange;
}

// Campaign cycle months order: June (start) to March (end)
const CAMPAIGN_CYCLE_MONTHS = [
  { name: 'Junho', abbr: 'Jun', num: 6 },
  { name: 'Julho', abbr: 'Jul', num: 7 },
  { name: 'Agosto', abbr: 'Ago', num: 8 },
  { name: 'Setembro', abbr: 'Set', num: 9 },
  { name: 'Outubro', abbr: 'Out', num: 10 },
  { name: 'Novembro', abbr: 'Nov', num: 11 },
  { name: 'Dezembro', abbr: 'Dez', num: 12 },
  { name: 'Janeiro', abbr: 'Jan', num: 1 },
  { name: 'Fevereiro', abbr: 'Fev', num: 2 },
  { name: 'Março', abbr: 'Mar', num: 3 },
];

interface ConsolidatedRow {
  marca: string;
  mes: string;
  mes_numero: number;
  orcado: number;
  realizado: number;
  saldo: number;
  tipo: string;
}

export const useMidiaData = () => {
  const { user } = useAuth();
  const { marcasNomes, unidades: unidadesData, loading: marcasLoading, refreshData: refreshMarcas } = useMarcasUnidadesData();
  const [dataLoading, setDataLoading] = useState(true);
  const [midiaOn, setMidiaOn] = useState<MidiaOn[]>([]);
  const [midiaOff, setMidiaOff] = useState<MidiaOff[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [brindes, setBrindes] = useState<Brinde[]>([]);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [campanhas, setCampanhas] = useState<any[]>([]);
  const [campanhaDistribuicoes, setCampanhaDistribuicoes] = useState<any[]>([]);
  const [publicidadeDados, setPublicidadeDados] = useState<PublicidadeDados[]>([]);
  const [filters, setFilters] = useState<MidiaFilterState>({
    month: 'Todos',
    marcas: [],
    unidades: [],
    ano: 'Todos', // Default: show entire campaign budget
    tipo: 'Todos',
    dateRange: undefined,
    comparisonRange: undefined,
  });

  // Combined loading state - wait for both marcas and data to load
  const loading = dataLoading || marcasLoading;

  // No longer auto-select a year - default is 'Todos' (show entire campaign)

  useEffect(() => {
    if (user) fetchAllData();
  }, [user]);


  const fetchAllData = async () => {
    setDataLoading(true);
    
    try {
      // Fetch all media data with pagination to bypass 1000 row limit
      // Using individual paginated fetches for each table
      const fetchMidiaOn = async (): Promise<MidiaOn[]> => {
        const allData: MidiaOn[] = [];
        let offset = 0;
        const batchSize = 1000;
        let hasMore = true;
        while (hasMore) {
          const { data, error } = await supabase
            .from('midia_on')
            .select('*')
            .order('mes_numero')
            .range(offset, offset + batchSize - 1);
          if (error || !data) break;
          allData.push(...data);
          offset += batchSize;
          hasMore = data.length === batchSize;
        }
        return allData;
      };

      const fetchMidiaOff = async (): Promise<MidiaOff[]> => {
        const allData: MidiaOff[] = [];
        let offset = 0;
        const batchSize = 1000;
        let hasMore = true;
        while (hasMore) {
          const { data, error } = await supabase
            .from('midia_off')
            .select('*')
            .order('mes_numero')
            .range(offset, offset + batchSize - 1);
          if (error || !data) break;
          allData.push(...data);
          offset += batchSize;
          hasMore = data.length === batchSize;
        }
        return allData;
      };

      const fetchEventos = async (): Promise<Evento[]> => {
        const allData: Evento[] = [];
        let offset = 0;
        const batchSize = 1000;
        let hasMore = true;
        while (hasMore) {
          const { data, error } = await supabase
            .from('eventos')
            .select('*')
            .order('mes_numero')
            .range(offset, offset + batchSize - 1);
          if (error || !data) break;
          allData.push(...data);
          offset += batchSize;
          hasMore = data.length === batchSize;
        }
        return allData;
      };

      const fetchBrindes = async (): Promise<Brinde[]> => {
        const allData: Brinde[] = [];
        let offset = 0;
        const batchSize = 1000;
        let hasMore = true;
        while (hasMore) {
          const { data, error } = await supabase
            .from('brindes')
            .select('*')
            .order('mes_numero')
            .range(offset, offset + batchSize - 1);
          if (error || !data) break;
          allData.push(...data);
          offset += batchSize;
          hasMore = data.length === batchSize;
        }
        return allData;
      };

      const fetchOrcamentos = async (): Promise<Orcamento[]> => {
        const allData: Orcamento[] = [];
        let offset = 0;
        const batchSize = 1000;
        let hasMore = true;
        while (hasMore) {
          const { data, error } = await supabase
            .from('orcamentos')
            .select('*')
            .in('tipo', ['midia_on', 'midia_off', 'eventos', 'brindes'])
            .gt('mes_numero', 0)
            .order('mes_numero')
            .range(offset, offset + batchSize - 1);
          if (error || !data) break;
          allData.push(...data);
          offset += batchSize;
          hasMore = data.length === batchSize;
        }
        return allData;
      };

      const fetchCampanhas = async (): Promise<any[]> => {
        const allData: any[] = [];
        let offset = 0;
        const batchSize = 1000;
        let hasMore = true;
        while (hasMore) {
          const { data, error } = await supabase
            .from('campanhas')
            .select('*')
            .eq('status', 'aprovado')
            .range(offset, offset + batchSize - 1);
          if (error || !data) break;
          allData.push(...data);
          offset += batchSize;
          hasMore = data.length === batchSize;
        }
        return allData;
      };

      // Fetch publicidade_dados for online media investments
      const fetchPublicidadeDados = async (): Promise<PublicidadeDados[]> => {
        const allData: PublicidadeDados[] = [];
        let offset = 0;
        const batchSize = 1000;
        let hasMore = true;
        while (hasMore) {
          const { data, error } = await supabase
            .from('publicidade_dados')
            .select('*')
            .eq('unidade', 'Geral') // Only get brand-level data to avoid duplicates
            .order('month_number')
            .range(offset, offset + batchSize - 1);
          if (error || !data) break;
          allData.push(...data);
          offset += batchSize;
          hasMore = data.length === batchSize;
        }
        return allData;
      };

      const [onData, offData, eventosData, brindesData, orcamentosData, campanhasData, campanhaDistRes, pubDados] = await Promise.all([
        fetchMidiaOn(),
        fetchMidiaOff(),
        fetchEventos(),
        fetchBrindes(),
        fetchOrcamentos(),
        fetchCampanhas(),
        // This one has a join, so we use regular query (usually smaller dataset)
        supabase.from('campanha_midia_distribuicao').select('*, campanhas!inner(*)'),
        fetchPublicidadeDados(),
      ]);

      setMidiaOn(onData);
      setMidiaOff(offData);
      setEventos(eventosData);
      setBrindes(brindesData);
      setOrcamentos(orcamentosData);
      setCampanhas(campanhasData);
      setCampanhaDistribuicoes(campanhaDistRes.data || []);
      setPublicidadeDados(pubDados);
      
      console.log(`Loaded: midia_on=${onData.length}, midia_off=${offData.length}, eventos=${eventosData.length}, brindes=${brindesData.length}, publicidade_dados=${pubDados.length}`);
    } catch (error) {
      console.error('Error fetching midia data:', error);
    }
    
    setDataLoading(false);
  };

  // Refetch data when needed
  const refetchData = async () => {
    if (user) {
      await Promise.all([
        fetchAllData(),
        refreshMarcas(),
      ]);
    }
  };

  // Extract unique values for filters
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    [...midiaOn, ...midiaOff, ...eventos, ...brindes].forEach(item => {
      monthSet.add(item.mes);
    });
    return ['Todos', ...Array.from(monthSet).sort((a, b) => {
      const order = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      return order.indexOf(a) - order.indexOf(b);
    })];
  }, [midiaOn, midiaOff, eventos, brindes]);

  // Use marcas from useMarcasUnidadesData (integrated with marcas/unidades page)
  // IMPORTANT: Marcas should always be available from the database, even without media data
  const availableMarcas = useMemo(() => {
    const marcaSet = new Set<string>();
    
    // PRIMARY SOURCE: Active marcas from database (always available)
    marcasNomes.forEach(nome => {
      if (nome) marcaSet.add(nome);
    });
    
    // SECONDARY: Add marcas from approved campanhas
    campanhas.forEach(c => {
      if (c.marca) marcaSet.add(c.marca);
    });
    
    // FALLBACK: Add marcas from media data (for legacy/unregistered brands)
    [...midiaOn, ...midiaOff, ...eventos, ...brindes].forEach(item => {
      if (item.marca) marcaSet.add(item.marca);
    });
    
    const result = Array.from(marcaSet).sort();
    console.log('[useMidiaData] Available marcas:', result.length, 'items. From DB:', marcasNomes.length, ', Campanhas:', campanhas.length);
    return result;
  }, [marcasNomes, campanhas, midiaOn, midiaOff, eventos, brindes]);

  const marcasWithMidiaOff = useMemo(() => {
    const marcaSet = new Set<string>();
    midiaOff.forEach(item => {
      if (item.latitude && item.longitude) {
        marcaSet.add(item.marca);
      }
    });
    return Array.from(marcaSet).sort();
  }, [midiaOff]);

  // Use unidades from useMarcasUnidadesData
  // IMPORTANT: Unidades should always be available from the database, even without media data
  const availableUnidades = useMemo(() => {
    const unidadeSet = new Set<string>();
    // Add 'Geral' as default option
    unidadeSet.add('Geral');
    // PRIMARY SOURCE: Active unidades from database (always available)
    unidadesData.forEach(u => {
      if (u.nome) unidadeSet.add(u.nome);
    });
    // SECONDARY: Add unidades from approved campanhas
    campanhas.forEach(c => {
      if (c.unidade) unidadeSet.add(c.unidade);
    });
    
    const result = Array.from(unidadeSet).sort();
    console.log('[useMidiaData] Available unidades:', result.length, 'items. From DB:', unidadesData.length);
    return result;
  }, [unidadesData, campanhas]);

  // Get years from campanhas, media data, and publicidade_dados
  const availableYears = useMemo(() => {
    const yearSet = new Set<number>();
    [...midiaOn, ...midiaOff, ...eventos, ...brindes].forEach(item => {
      yearSet.add(item.ano);
    });
    campanhas.forEach(c => {
      yearSet.add(c.ano_inicio);
      if (c.ano_fim) yearSet.add(c.ano_fim);
    });
    // Add years from publicidade_dados
    publicidadeDados.forEach(pd => {
      yearSet.add(pd.year);
    });
    // If no years found, add current year
    if (yearSet.size === 0) {
      yearSet.add(new Date().getFullYear());
    }
    return Array.from(yearSet).sort();
  }, [midiaOn, midiaOff, eventos, brindes, campanhas, publicidadeDados]);

  // Filter function - now supports 'Todos' for ano to show entire campaign
  const applyFilters = <T extends { mes: string; marca: string; unidade: string; ano: number }>(data: T[]): T[] => {
    return data.filter(item => {
      if (filters.month !== 'Todos' && item.mes !== filters.month) return false;
      if (filters.marcas.length > 0 && !filters.marcas.includes(item.marca)) return false;
      if (filters.unidades.length > 0 && !filters.unidades.includes(item.unidade)) return false;
      // Only filter by year if a specific year is selected (not 'Todos')
      if (filters.ano !== 'Todos' && item.ano !== filters.ano) return false;
      return true;
    });
  };

  // Filtered data
  const filteredMidiaOn = useMemo(() => applyFilters(midiaOn), [midiaOn, filters]);
  const filteredMidiaOff = useMemo(() => applyFilters(midiaOff), [midiaOff, filters]);
  const filteredEventos = useMemo(() => applyFilters(eventos), [eventos, filters]);
  const filteredBrindes = useMemo(() => applyFilters(brindes), [brindes, filters]);

  // Transform publicidade_dados into virtual midia_on entries
  // This creates synthetic records from invest_meta and invest_google
  const MONTH_MAP: Record<number, string> = {
    1: 'Janeiro', 2: 'Fevereiro', 3: 'Março', 4: 'Abril',
    5: 'Maio', 6: 'Junho', 7: 'Julho', 8: 'Agosto',
    9: 'Setembro', 10: 'Outubro', 11: 'Novembro', 12: 'Dezembro'
  };

  const virtualMidiaOnFromPublicidade = useMemo(() => {
    const virtualRecords: Array<{
      id: string;
      marca: string;
      unidade: string;
      mes: string;
      mes_numero: number;
      ano: number;
      fornecedor: string;
      valor_realizado: number;
      valor_midia: number;
      orcamento_on: number;
      diario: number;
      status: string;
    }> = [];

    publicidadeDados.forEach((pd) => {
      const mes = MONTH_MAP[pd.month_number] || pd.month;
      
      // Create Meta entry if invest_meta > 0
      if (Number(pd.invest_meta) > 0) {
        virtualRecords.push({
          id: `pub-meta-${pd.id}`,
          marca: pd.marca,
          unidade: pd.unidade,
          mes,
          mes_numero: pd.month_number,
          ano: pd.year,
          fornecedor: 'Meta',
          valor_realizado: Number(pd.invest_meta),
          valor_midia: Number(pd.invest_meta),
          orcamento_on: 0, // Budget comes from orcamentos table
          diario: 0,
          status: 'realizado',
        });
      }

      // Create Google entry if invest_google > 0
      if (Number(pd.invest_google) > 0) {
        virtualRecords.push({
          id: `pub-google-${pd.id}`,
          marca: pd.marca,
          unidade: pd.unidade,
          mes,
          mes_numero: pd.month_number,
          ano: pd.year,
          fornecedor: 'Google',
          valor_realizado: Number(pd.invest_google),
          valor_midia: Number(pd.invest_google),
          orcamento_on: 0,
          diario: 0,
          status: 'realizado',
        });
      }
    });

    return virtualRecords;
  }, [publicidadeDados]);

  // Filter virtual midia on records
  const filteredVirtualMidiaOn = useMemo(() => {
    return virtualMidiaOnFromPublicidade.filter(item => {
      if (filters.month !== 'Todos' && item.mes !== filters.month) return false;
      if (filters.marcas.length > 0 && !filters.marcas.includes(item.marca)) return false;
      if (filters.unidades.length > 0 && !filters.unidades.includes(item.unidade)) return false;
      if (filters.ano !== 'Todos' && item.ano !== filters.ano) return false;
      return true;
    });
  }, [virtualMidiaOnFromPublicidade, filters]);

  // Combined Mídia On data: manual entries + virtual from publicidade_dados
  // Prefer publicidade_dados as primary source for online media investments
  const combinedMidiaOnRealizado = useMemo(() => {
    // If we have publicidade data, use it as the primary source
    if (filteredVirtualMidiaOn.length > 0) {
      return filteredVirtualMidiaOn.reduce((sum, i) => sum + Number(i.valor_realizado), 0);
    }
    // Fallback to manual midia_on entries
    return filteredMidiaOn.reduce((sum, i) => sum + Number(i.valor_realizado), 0);
  }, [filteredVirtualMidiaOn, filteredMidiaOn]);

  // Helper to get budget from orcamentos table - now supports 'Todos' for ano
  const getOrcadoFromBudget = (tipo: string, mes?: string) => {
    return orcamentos
      .filter(o => {
        if (o.tipo !== tipo) return false;
        // Only filter by year if a specific year is selected (not 'Todos')
        if (filters.ano !== 'Todos' && o.ano !== filters.ano) return false;
        if (mes && o.mes !== mes) return false;
        if (filters.marcas.length > 0 && !filters.marcas.includes(o.marca)) return false;
        if (filters.unidades.length > 0 && o.unidade && !filters.unidades.includes(o.unidade)) return false;
        return true;
      })
      .reduce((sum, o) => sum + Number(o.valor_orcado) + Number(o.verba_extra), 0);
  };

  // Global KPIs - now using orcamentos table for budgeted values
  // and publicidade_dados for realized online media
  const kpis = useMemo(() => {
    // Get budgeted values from orcamentos table
    const onOrcado = filters.month === 'Todos' 
      ? getOrcadoFromBudget('midia_on') 
      : getOrcadoFromBudget('midia_on', filters.month);
    const offOrcado = filters.month === 'Todos' 
      ? getOrcadoFromBudget('midia_off') 
      : getOrcadoFromBudget('midia_off', filters.month);
    const eventosOrcado = filters.month === 'Todos' 
      ? getOrcadoFromBudget('eventos') 
      : getOrcadoFromBudget('eventos', filters.month);
    const brindesOrcado = filters.month === 'Todos' 
      ? getOrcadoFromBudget('brindes') 
      : getOrcadoFromBudget('brindes', filters.month);

    // Get realized values - use combined data for midia on (from publicidade_dados)
    const onRealizado = combinedMidiaOnRealizado;
    const offRealizado = filteredMidiaOff.reduce((sum, i) => sum + Number(i.valor_realizado), 0);
    const eventosRealizado = filteredEventos.reduce((sum, i) => sum + Number(i.orcamento_evento), 0);
    const brindesRealizado = filteredBrindes.reduce((sum, i) => sum + Number(i.valor_realizado), 0);

    const totalOrcado = onOrcado + offOrcado + eventosOrcado + brindesOrcado;
    const totalRealizado = onRealizado + offRealizado + eventosRealizado + brindesRealizado;
    const saldoRemanescente = totalOrcado - totalRealizado;
    const percentualExecutado = totalOrcado > 0 ? (totalRealizado / totalOrcado) * 100 : 0;

    // Debug log for troubleshooting
    console.log('[useMidiaData] KPIs computed for year:', filters.ano, {
      orcamentosCount: orcamentos.length,
      publicidadeDadosCount: publicidadeDados.length,
      virtualMidiaOnCount: filteredVirtualMidiaOn.length,
      totalOrcado,
      totalRealizado,
      breakdown: { onOrcado, onRealizado, offOrcado, offRealizado, eventosOrcado, brindesOrcado },
    });

    return {
      totalOrcado,
      totalRealizado,
      saldoRemanescente,
      percentualExecutado,
      midiaOnOrcado: onOrcado,
      midiaOnRealizado: onRealizado,
      midiaOffOrcado: offOrcado,
      midiaOffRealizado: offRealizado,
      eventosOrcado,
      eventosRealizado,
      brindesOrcado,
      brindesRealizado,
    };
  }, [combinedMidiaOnRealizado, filteredMidiaOff, filteredEventos, filteredBrindes, orcamentos, filters, publicidadeDados, filteredVirtualMidiaOn]);

  // KPIs específicos por tipo - now using orcamentos table
  const midiaOnKpis = useMemo(() => {
    const orcado = filters.month === 'Todos' 
      ? getOrcadoFromBudget('midia_on') 
      : getOrcadoFromBudget('midia_on', filters.month);
    const realizado = combinedMidiaOnRealizado;
    return {
      totalOrcado: orcado,
      totalRealizado: realizado,
      saldoRemanescente: orcado - realizado,
      percentualExecutado: orcado > 0 ? (realizado / orcado) * 100 : 0,
    };
  }, [combinedMidiaOnRealizado, orcamentos, filters]);

  const midiaOffKpis = useMemo(() => {
    const orcado = filters.month === 'Todos' 
      ? getOrcadoFromBudget('midia_off') 
      : getOrcadoFromBudget('midia_off', filters.month);
    const realizado = filteredMidiaOff.reduce((sum, i) => sum + Number(i.valor_realizado), 0);
    return {
      totalOrcado: orcado,
      totalRealizado: realizado,
      saldoRemanescente: orcado - realizado,
      percentualExecutado: orcado > 0 ? (realizado / orcado) * 100 : 0,
    };
  }, [filteredMidiaOff, orcamentos, filters]);

  const eventosKpis = useMemo(() => {
    const orcado = filters.month === 'Todos' 
      ? getOrcadoFromBudget('eventos') 
      : getOrcadoFromBudget('eventos', filters.month);
    const realizado = filteredEventos.reduce((sum, i) => sum + Number(i.orcamento_evento), 0);
    return {
      totalOrcado: orcado,
      totalRealizado: realizado,
      saldoRemanescente: orcado - realizado,
      percentualExecutado: orcado > 0 ? (realizado / orcado) * 100 : 0,
    };
  }, [filteredEventos, orcamentos, filters]);

  const brindesKpis = useMemo(() => {
    const orcado = filters.month === 'Todos' 
      ? getOrcadoFromBudget('brindes') 
      : getOrcadoFromBudget('brindes', filters.month);
    const realizado = filteredBrindes.reduce((sum, i) => sum + Number(i.valor_realizado), 0);
    return {
      totalOrcado: orcado,
      totalRealizado: realizado,
      saldoRemanescente: orcado - realizado,
      percentualExecutado: orcado > 0 ? (realizado / orcado) * 100 : 0,
    };
  }, [filteredBrindes, orcamentos, filters]);

  // Investment evolution by month - shows data based on filter
  // If 'Todos' is selected, show aggregated data across all years
  // If a specific year is selected, show campaign cycle (Aug-Jul) for that year
  // Investment evolution by month - shows data based on filter
  // Campaign cycle: June to March (Jun, Jul, Aug, Sep, Oct, Nov, Dec, Jan, Feb, Mar)
  // Now using publicidade_dados for online media realized values
  const investmentEvolution = useMemo(() => {
    // If showing all data ('Todos'), aggregate by month across all years in campaign cycle order
    if (filters.ano === 'Todos') {
      return CAMPAIGN_CYCLE_MONTHS.map(({ name: mes, abbr }) => {
        const filterOrcamentos = (tipo: string) => 
          orcamentos.filter(o => o.tipo === tipo && o.mes === mes)
            .reduce((s, o) => s + Number(o.valor_orcado) + Number(o.verba_extra), 0);

        const orcado = filterOrcamentos('midia_on') + 
                       filterOrcamentos('midia_off') + 
                       filterOrcamentos('eventos') + 
                       filterOrcamentos('brindes');

        // Use virtual records from publicidade_dados for online media
        const onRealizado = virtualMidiaOnFromPublicidade.length > 0
          ? virtualMidiaOnFromPublicidade.filter(i => i.mes === mes).reduce((s, i) => s + Number(i.valor_realizado), 0)
          : midiaOn.filter(i => i.mes === mes).reduce((s, i) => s + Number(i.valor_realizado), 0);
        const offRealizado = midiaOff.filter(i => i.mes === mes).reduce((s, i) => s + Number(i.valor_realizado), 0);
        const eventosRealizado = eventos.filter(i => i.mes === mes).reduce((s, i) => s + Number(i.orcamento_evento), 0);
        const brindesRealizado = brindes.filter(i => i.mes === mes).reduce((s, i) => s + Number(i.valor_realizado), 0);

        return {
          month: abbr,
          orcado,
          realizado: onRealizado + offRealizado + eventosRealizado + brindesRealizado,
        };
      });
    }
    
    // For a specific year, show the campaign cycle starting in that year
    // Campaign year X = June of year X through March of year X+1
    const currentYear = filters.ano as number;
    const cycleStartYear = currentYear;
    const cycleEndYear = currentYear + 1;
    
    return CAMPAIGN_CYCLE_MONTHS.map(({ name: mes, abbr, num }) => {
      // June-December belongs to cycleStartYear, January-March belongs to cycleEndYear
      const year = num >= 6 ? cycleStartYear : cycleEndYear;
      
      // Get budgeted from orcamentos table
      const filterOrcamentos = (tipo: string) => 
        orcamentos.filter(o => o.tipo === tipo && o.mes === mes && o.ano === year)
          .reduce((s, o) => s + Number(o.valor_orcado) + Number(o.verba_extra), 0);

      const orcado = filterOrcamentos('midia_on') + 
                     filterOrcamentos('midia_off') + 
                     filterOrcamentos('eventos') + 
                     filterOrcamentos('brindes');

      // Get realized - use publicidade_dados for online media
      const onRealizado = virtualMidiaOnFromPublicidade.length > 0
        ? virtualMidiaOnFromPublicidade.filter(i => i.mes === mes && i.ano === year).reduce((s, i) => s + Number(i.valor_realizado), 0)
        : midiaOn.filter(i => i.mes === mes && i.ano === year).reduce((s, i) => s + Number(i.valor_realizado), 0);
      const offRealizado = midiaOff.filter(i => i.mes === mes && i.ano === year).reduce((s, i) => s + Number(i.valor_realizado), 0);
      const eventosRealizado = eventos.filter(i => i.mes === mes && i.ano === year).reduce((s, i) => s + Number(i.orcamento_evento), 0);
      const brindesRealizado = brindes.filter(i => i.mes === mes && i.ano === year).reduce((s, i) => s + Number(i.valor_realizado), 0);

      return {
        month: abbr,
        orcado,
        realizado: onRealizado + offRealizado + eventosRealizado + brindesRealizado,
      };
    });
  }, [virtualMidiaOnFromPublicidade, midiaOn, midiaOff, eventos, brindes, orcamentos, filters.ano]);

  // Investment breakdown by type (for pie chart)
  const investmentBreakdown = useMemo(() => {
    return [
      { name: 'Mídia On', value: kpis.midiaOnRealizado, color: 'hsl(var(--chart-1))' },
      { name: 'Mídia Off', value: kpis.midiaOffRealizado, color: 'hsl(var(--chart-2))' },
      { name: 'Eventos', value: kpis.eventosOrcado, color: 'hsl(var(--chart-3))' },
      { name: 'Brindes', value: kpis.brindesRealizado, color: 'hsl(var(--chart-4))' },
    ].filter(item => item.value > 0);
  }, [kpis]);

  // Mídia Off - Breakdown por tipo de mídia
  const midiaOffTipoBreakdown = useMemo(() => {
    const tipoMap = new Map<string, number>();
    filteredMidiaOff.forEach(item => {
      const current = tipoMap.get(item.tipo_midia) || 0;
      tipoMap.set(item.tipo_midia, current + Number(item.valor_realizado));
    });
    const colors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
    return Array.from(tipoMap.entries())
      .filter(([_, value]) => value > 0)
      .map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length],
      }));
  }, [filteredMidiaOff]);

  // Mídia Off - Breakdown por fornecedor
  const midiaOffFornecedorBreakdown = useMemo(() => {
    const fornecedorMap = new Map<string, number>();
    filteredMidiaOff.forEach(item => {
      const fornecedor = item.fornecedor || 'Sem fornecedor';
      const current = fornecedorMap.get(fornecedor) || 0;
      fornecedorMap.set(fornecedor, current + Number(item.valor_realizado));
    });
    return Array.from(fornecedorMap.entries())
      .filter(([_, value]) => value > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([fornecedor, valor]) => ({ fornecedor, valor }));
  }, [filteredMidiaOff]);

  // Mídia Off - Brand breakdown using orcamentos table
  const midiaOffBrandBreakdown = useMemo(() => {
    const marcaMap = new Map<string, { orcado: number; realizado: number }>();
    
    // Get budgeted from orcamentos - filter by year only if specific year selected
    orcamentos
      .filter(o => o.tipo === 'midia_off' && (filters.ano === 'Todos' || o.ano === filters.ano))
      .forEach(o => {
        const existing = marcaMap.get(o.marca) || { orcado: 0, realizado: 0 };
        marcaMap.set(o.marca, {
          orcado: existing.orcado + Number(o.valor_orcado) + Number(o.verba_extra),
          realizado: existing.realizado,
        });
      });
    
    // Add realized values
    filteredMidiaOff.forEach(item => {
      const existing = marcaMap.get(item.marca) || { orcado: 0, realizado: 0 };
      marcaMap.set(item.marca, {
        orcado: existing.orcado,
        realizado: existing.realizado + Number(item.valor_realizado),
      });
    });
    
    return Array.from(marcaMap.entries()).map(([marca, data]) => ({
      marca,
      orcado: data.orcado,
      realizado: data.realizado,
    }));
  }, [filteredMidiaOff, orcamentos, filters.ano]);

  // Mídia On - Breakdown por fornecedor (com quantidade)
  // Uses virtual records from publicidade_dados as primary source
  const midiaOnFornecedorBreakdown = useMemo(() => {
    const fornecedorMap = new Map<string, { valor: number; quantidade: number }>();
    
    // Use virtual records from publicidade_dados as primary source
    if (filteredVirtualMidiaOn.length > 0) {
      filteredVirtualMidiaOn.forEach(item => {
        const fornecedor = item.fornecedor || 'Sem fornecedor';
        const existing = fornecedorMap.get(fornecedor) || { valor: 0, quantidade: 0 };
        fornecedorMap.set(fornecedor, {
          valor: existing.valor + Number(item.valor_realizado),
          quantidade: existing.quantidade + 1,
        });
      });
    } else {
      // Fallback to manual midia_on entries
      filteredMidiaOn.forEach(item => {
        const fornecedor = item.fornecedor || 'Sem fornecedor';
        const existing = fornecedorMap.get(fornecedor) || { valor: 0, quantidade: 0 };
        fornecedorMap.set(fornecedor, {
          valor: existing.valor + Number(item.valor_realizado),
          quantidade: existing.quantidade + 1,
        });
      });
    }
    
    return Array.from(fornecedorMap.entries())
      .filter(([_, data]) => data.valor > 0)
      .sort((a, b) => b[1].valor - a[1].valor)
      .map(([fornecedor, data]) => ({ fornecedor, valor: data.valor, quantidade: data.quantidade }));
  }, [filteredVirtualMidiaOn, filteredMidiaOn]);

  // Mídia On - Brand breakdown using orcamentos table and publicidade_dados
  const midiaOnBrandBreakdown = useMemo(() => {
    const marcaMap = new Map<string, { orcado: number; realizado: number }>();
    
    // Get budgeted from orcamentos - filter by year only if specific year selected
    orcamentos
      .filter(o => o.tipo === 'midia_on' && (filters.ano === 'Todos' || o.ano === filters.ano))
      .forEach(o => {
        const existing = marcaMap.get(o.marca) || { orcado: 0, realizado: 0 };
        marcaMap.set(o.marca, {
          orcado: existing.orcado + Number(o.valor_orcado) + Number(o.verba_extra),
          realizado: existing.realizado,
        });
      });
    
    // Add realized values from publicidade_dados (virtual records) or midia_on
    const sourceData = filteredVirtualMidiaOn.length > 0 ? filteredVirtualMidiaOn : filteredMidiaOn;
    sourceData.forEach(item => {
      const existing = marcaMap.get(item.marca) || { orcado: 0, realizado: 0 };
      marcaMap.set(item.marca, {
        orcado: existing.orcado,
        realizado: existing.realizado + Number(item.valor_realizado),
      });
    });
    
    return Array.from(marcaMap.entries()).map(([marca, data]) => ({
      marca,
      orcado: data.orcado,
      realizado: data.realizado,
    }));
  }, [filteredVirtualMidiaOn, filteredMidiaOn, orcamentos, filters.ano]);

  // Mídia On - Evolução mensal using orcamentos table and publicidade_dados
  // Uses campaign cycle order (Jun-Mar) instead of calendar year
  const midiaOnEvolution = useMemo(() => {
    // When 'Todos' is selected, aggregate all years without year filtering
    if (filters.ano === 'Todos') {
      return CAMPAIGN_CYCLE_MONTHS.map(({ name: mes, abbr }) => {
        const orcado = orcamentos
          .filter(o => o.tipo === 'midia_on' && o.mes === mes)
          .reduce((s, o) => s + Number(o.valor_orcado) + Number(o.verba_extra), 0);
        
        let realizado = 0;
        if (virtualMidiaOnFromPublicidade.length > 0) {
          realizado = virtualMidiaOnFromPublicidade
            .filter(i => i.mes === mes)
            .reduce((s, i) => s + Number(i.valor_realizado), 0);
        } else {
          realizado = midiaOn
            .filter(i => i.mes === mes)
            .reduce((s, i) => s + Number(i.valor_realizado), 0);
        }
        
        return { month: abbr, orcado, realizado };
      });
    }
    
    // For a specific year, show campaign cycle (Jun year X to Mar year X+1)
    const currentYear = filters.ano as number;
    const cycleStartYear = currentYear;
    const cycleEndYear = currentYear + 1;
    
    return CAMPAIGN_CYCLE_MONTHS.map(({ name: mes, abbr, num }) => {
      const year = num >= 6 ? cycleStartYear : cycleEndYear;
      
      const orcado = orcamentos
        .filter(o => o.tipo === 'midia_on' && o.mes === mes && o.ano === year)
        .reduce((s, o) => s + Number(o.valor_orcado) + Number(o.verba_extra), 0);
      
      let realizado = 0;
      if (virtualMidiaOnFromPublicidade.length > 0) {
        realizado = virtualMidiaOnFromPublicidade
          .filter(i => i.mes === mes && i.ano === year)
          .reduce((s, i) => s + Number(i.valor_realizado), 0);
      } else {
        realizado = midiaOn
          .filter(i => i.mes === mes && i.ano === year)
          .reduce((s, i) => s + Number(i.valor_realizado), 0);
      }
      
      return { month: abbr, orcado, realizado };
    });
  }, [virtualMidiaOnFromPublicidade, midiaOn, orcamentos, filters.ano]);

  // Mídia Off - Evolução mensal using orcamentos table
  // Uses campaign cycle order (Jun-Mar) instead of calendar year
  const midiaOffEvolution = useMemo(() => {
    // When 'Todos' is selected, aggregate all years without year filtering
    if (filters.ano === 'Todos') {
      return CAMPAIGN_CYCLE_MONTHS.map(({ name: mes, abbr }) => {
        const orcado = orcamentos
          .filter(o => o.tipo === 'midia_off' && o.mes === mes)
          .reduce((s, o) => s + Number(o.valor_orcado) + Number(o.verba_extra), 0);
        const realizado = midiaOff
          .filter(i => i.mes === mes)
          .reduce((s, i) => s + Number(i.valor_realizado), 0);
        
        return { month: abbr, orcado, realizado };
      });
    }
    
    // For a specific year, show campaign cycle (Jun year X to Mar year X+1)
    const currentYear = filters.ano as number;
    const cycleStartYear = currentYear;
    const cycleEndYear = currentYear + 1;
    
    return CAMPAIGN_CYCLE_MONTHS.map(({ name: mes, abbr, num }) => {
      const year = num >= 6 ? cycleStartYear : cycleEndYear;
      
      const orcado = orcamentos
        .filter(o => o.tipo === 'midia_off' && o.mes === mes && o.ano === year)
        .reduce((s, o) => s + Number(o.valor_orcado) + Number(o.verba_extra), 0);
      const realizado = midiaOff
        .filter(i => i.mes === mes && i.ano === year)
        .reduce((s, i) => s + Number(i.valor_realizado), 0);
      
      return { month: abbr, orcado, realizado };
    });
  }, [midiaOff, orcamentos, filters.ano]);

  // Eventos - Breakdown por categoria
  const eventosCategoriaBreakdown = useMemo(() => {
    const catMap = new Map<string, { orcado: number; realizado: number }>();
    filteredEventos.forEach(item => {
      const existing = catMap.get(item.categoria) || { orcado: 0, realizado: 0 };
      catMap.set(item.categoria, {
        orcado: existing.orcado + Number(item.orcamento_evento),
        realizado: existing.realizado + Number(item.orcamento_evento),
      });
    });
    return Array.from(catMap.entries()).map(([categoria, data]) => ({
      categoria,
      orcado: data.orcado,
      realizado: data.realizado,
    }));
  }, [filteredEventos]);

  // Eventos - Brand breakdown using orcamentos table
  const eventosBrandBreakdown = useMemo(() => {
    const marcaMap = new Map<string, { orcado: number; realizado: number }>();
    
    // Get budgeted from orcamentos - filter by year only if specific year selected
    orcamentos
      .filter(o => o.tipo === 'eventos' && (filters.ano === 'Todos' || o.ano === filters.ano))
      .forEach(o => {
        const existing = marcaMap.get(o.marca) || { orcado: 0, realizado: 0 };
        marcaMap.set(o.marca, {
          orcado: existing.orcado + Number(o.valor_orcado) + Number(o.verba_extra),
          realizado: existing.realizado,
        });
      });
    
    // Add realized values
    filteredEventos.forEach(item => {
      const existing = marcaMap.get(item.marca) || { orcado: 0, realizado: 0 };
      marcaMap.set(item.marca, {
        orcado: existing.orcado,
        realizado: existing.realizado + Number(item.orcamento_evento),
      });
    });
    
    return Array.from(marcaMap.entries()).map(([marca, data]) => ({
      marca,
      orcado: data.orcado,
      realizado: data.realizado,
    }));
  }, [filteredEventos, orcamentos, filters.ano]);

  // Próximos eventos (futuros)
  const proximosEventos = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return filteredEventos
      .filter(e => new Date(e.data_evento) >= today)
      .sort((a, b) => new Date(a.data_evento).getTime() - new Date(b.data_evento).getTime())
      .slice(0, 10)
      .map(e => ({
        nome: e.nome_evento,
        data: e.data_evento,
        marca: e.marca,
        endereco: e.endereco,
      }));
  }, [filteredEventos]);

  // Brindes - Breakdown por categoria
  const brindesCategoriaBreakdown = useMemo(() => {
    const catMap = new Map<string, { orcado: number; realizado: number }>();
    filteredBrindes.forEach(item => {
      const existing = catMap.get(item.categoria) || { orcado: 0, realizado: 0 };
      catMap.set(item.categoria, {
        orcado: existing.orcado + Number(item.valor_orcado),
        realizado: existing.realizado + Number(item.valor_realizado),
      });
    });
    return Array.from(catMap.entries()).map(([categoria, data]) => ({
      categoria,
      orcado: data.orcado,
      realizado: data.realizado,
    }));
  }, [filteredBrindes]);

  // Brindes - Brand breakdown using orcamentos table
  const brindesBrandBreakdown = useMemo(() => {
    const marcaMap = new Map<string, { orcado: number; realizado: number }>();
    
    // Get budgeted from orcamentos - filter by year only if specific year selected
    orcamentos
      .filter(o => o.tipo === 'brindes' && (filters.ano === 'Todos' || o.ano === filters.ano))
      .forEach(o => {
        const existing = marcaMap.get(o.marca) || { orcado: 0, realizado: 0 };
        marcaMap.set(o.marca, {
          orcado: existing.orcado + Number(o.valor_orcado) + Number(o.verba_extra),
          realizado: existing.realizado,
        });
      });
    
    // Add realized values
    filteredBrindes.forEach(item => {
      const existing = marcaMap.get(item.marca) || { orcado: 0, realizado: 0 };
      marcaMap.set(item.marca, {
        orcado: existing.orcado,
        realizado: existing.realizado + Number(item.valor_realizado),
      });
    });
    
    return Array.from(marcaMap.entries()).map(([marca, data]) => ({
      marca,
      orcado: data.orcado,
      realizado: data.realizado,
    }));
  }, [filteredBrindes, orcamentos, filters.ano]);

  // Consolidated table data - now using orcamentos table for budgeted values
  const consolidatedTable = useMemo((): ConsolidatedRow[] => {
    const rows: ConsolidatedRow[] = [];
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    // Get unique brands from both orcamentos and media data
    const marcaSet = new Set([
      ...midiaOn.map(i => i.marca), 
      ...midiaOff.map(i => i.marca), 
      ...eventos.map(i => i.marca), 
      ...brindes.map(i => i.marca),
      ...orcamentos.filter(o => o.ano === filters.ano).map(o => o.marca)
    ]);
    
    marcaSet.forEach(marca => {
      months.forEach((mes, mesIndex) => {
        const filterByMarcaMes = (item: { marca: string; mes: string; ano: number }) => 
          item.marca === marca && item.mes === mes && item.ano === filters.ano;

        // Get budgeted from orcamentos table
        const orcadoFromBudget = orcamentos
          .filter(o => o.marca === marca && o.mes === mes && o.ano === filters.ano)
          .reduce((s, o) => s + Number(o.valor_orcado) + Number(o.verba_extra), 0);

        // Get realized from individual tables
        const onData = midiaOn.filter(filterByMarcaMes);
        const offData = midiaOff.filter(filterByMarcaMes);
        const eventosData = eventos.filter(filterByMarcaMes);
        const brindesData = brindes.filter(filterByMarcaMes);

        const realizado = 
          onData.reduce((s, i) => s + Number(i.valor_realizado), 0) +
          offData.reduce((s, i) => s + Number(i.valor_realizado), 0) +
          eventosData.reduce((s, i) => s + Number(i.orcamento_evento), 0) +
          brindesData.reduce((s, i) => s + Number(i.valor_realizado), 0);

        if (orcadoFromBudget > 0 || realizado > 0) {
          rows.push({
            marca,
            mes,
            mes_numero: mesIndex + 1,
            orcado: orcadoFromBudget,
            realizado,
            saldo: orcadoFromBudget - realizado,
            tipo: 'Consolidado',
          });
        }
      });
    });

    return rows.filter(row => {
      if (filters.month !== 'Todos' && row.mes !== filters.month) return false;
      if (filters.marcas.length > 0 && !filters.marcas.includes(row.marca)) return false;
      return true;
    }).sort((a, b) => a.mes_numero - b.mes_numero);
  }, [midiaOn, midiaOff, eventos, brindes, orcamentos, filters]);

  // Brand breakdown (global)
  const brandBreakdown = useMemo(() => {
    const marcaMap = new Map<string, { orcado: number; realizado: number }>();
    
    consolidatedTable.forEach(row => {
      const existing = marcaMap.get(row.marca) || { orcado: 0, realizado: 0 };
      marcaMap.set(row.marca, {
        orcado: existing.orcado + row.orcado,
        realizado: existing.realizado + row.realizado,
      });
    });

    return Array.from(marcaMap.entries()).map(([marca, data]) => ({
      marca,
      orcado: data.orcado,
      realizado: data.realizado,
    }));
  }, [consolidatedTable]);

  const hasData = midiaOn.length > 0 || midiaOff.length > 0 || eventos.length > 0 || brindes.length > 0 || orcamentos.length > 0 || publicidadeDados.length > 0;

  return {
    loading,
    filters,
    setFilters,
    refetchData,
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
    marcasWithMidiaOff,
    availableYears,
    hasData,
    // Raw data for map
    midiaOff,
    eventos,
  };
};
