import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, Building2, Store, Download, FileSpreadsheet, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useMemo, useCallback, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface TableRowData {
  marca: string;
  unidade: string;
  month?: string;
  leadsReal: number;
  leadsOrcado: number;
  leadsA1: number;
  leadsProdReal: number;
  leadsProdOrcado: number;
  leadsProdA1: number;
  matriculasReal: number;
  matriculasOrcado: number;
  matriculasA1: number;
  cacReal: number;
  cacOrcado: number;
  cacA1: number;
  cplReal: number;
  cplOrcado: number;
  cplA1: number;
  cplProdReal: number;
  cplProdOrcado: number;
  cplProdA1: number;
  investMeta: number;
  investGoogle: number;
  investOff: number;
  investEventos: number;
}

interface AggregatedData {
  label: string;
  marca?: string;
  unidade?: string;
  count: number;
  leadsReal: number;
  leadsOrcado: number;
  leadsA1: number;
  leadsProdReal: number;
  leadsProdOrcado: number;
  leadsProdA1: number;
  matriculasReal: number;
  matriculasOrcado: number;
  matriculasA1: number;
  cacRealSum: number;
  cacOrcadoSum: number;
  cacA1Sum: number;
  cplRealSum: number;
  cplOrcadoSum: number;
  cplA1Sum: number;
  cplProdRealSum: number;
  cplProdOrcadoSum: number;
  cplProdA1Sum: number;
  investTotal: number;
}

interface DashboardTableProps {
  data: TableRowData[];
  showAccumulated?: boolean;
}

const DiffCell = ({ 
  real, 
  comparativo, 
  isCost = false,
  showPercent = true
}: { 
  real: number; 
  comparativo: number; 
  isCost?: boolean;
  showPercent?: boolean;
}) => {
  if (comparativo === 0) {
    return (
      <div className="flex items-center justify-end">
        <Minus className="h-3 w-3 text-muted-foreground" />
      </div>
    );
  }

  const diff = real - comparativo;
  const percentDiff = (diff / comparativo) * 100;
  const isPositive = isCost ? diff < 0 : diff > 0;
  const isNeutral = Math.abs(percentDiff) < 0.5;

  if (isNeutral) {
    return (
      <div className="flex items-center justify-end">
        <Minus className="h-3 w-3 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={cn(
      'flex items-center gap-1 justify-end text-xs font-medium',
      isPositive ? 'text-green-600' : 'text-red-600'
    )}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {showPercent ? `${Math.abs(percentDiff).toFixed(0)}%` : Math.abs(diff).toLocaleString('pt-BR')}
    </div>
  );
};

const ValueCell = ({ 
  value, 
  prefix = '',
  decimals = 0
}: { 
  value: number; 
  prefix?: string;
  decimals?: number;
}) => (
  <span>{prefix}{value.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</span>
);

// Sort configuration
type SortField = 'label' | 'leadsReal' | 'leadsOrcado' | 'leadsA1' | 'cplReal' | 'cplOrcado' | 'cplA1' | 'leadsProdReal' | 'leadsProdOrcado' | 'leadsProdA1' | 'cplProdReal' | 'cplProdOrcado' | 'cplProdA1' | 'matriculasReal' | 'matriculasOrcado' | 'matriculasA1' | 'cacReal' | 'cacOrcado' | 'cacA1' | 'investTotal';
type SortDir = 'asc' | 'desc';
interface SortConfig { field: SortField; dir: SortDir; }

// Define metric groups with their colors
const metricGroups = [
  { name: 'LEADS', color: 'bg-blue-100 dark:bg-blue-900/30', borderColor: 'border-blue-300 dark:border-blue-700', isSum: true },
  { name: 'CPL', color: 'bg-purple-100 dark:bg-purple-900/30', borderColor: 'border-purple-300 dark:border-purple-700', isCost: true, prefix: 'R$ ' },
  { name: 'LEADS PROD.', color: 'bg-cyan-100 dark:bg-cyan-900/30', borderColor: 'border-cyan-300 dark:border-cyan-700', isSum: true },
  { name: 'CPL PROD.', color: 'bg-pink-100 dark:bg-pink-900/30', borderColor: 'border-pink-300 dark:border-pink-700', isCost: true, prefix: 'R$ ' },
  { name: 'MATRÍCULAS', color: 'bg-green-100 dark:bg-green-900/30', borderColor: 'border-green-300 dark:border-green-700', isSum: true },
  { name: 'CAC', color: 'bg-orange-100 dark:bg-orange-900/30', borderColor: 'border-orange-300 dark:border-orange-700', isCost: true, prefix: 'R$ ' },
];

const subColumns: { label: string; field: SortField }[][] = [
  [{ label: 'Real', field: 'leadsReal' }, { label: 'Orçado', field: 'leadsOrcado' }, { label: 'Δ Orç.', field: 'leadsReal' }, { label: 'C.A.', field: 'leadsA1' }, { label: 'Δ C.A.', field: 'leadsReal' }, { label: 'Acum.', field: 'leadsReal' }],
  [{ label: 'Real', field: 'cplReal' }, { label: 'Orçado', field: 'cplOrcado' }, { label: 'Δ Orç.', field: 'cplReal' }, { label: 'C.A.', field: 'cplA1' }, { label: 'Δ C.A.', field: 'cplReal' }, { label: 'Acum.', field: 'cplReal' }],
  [{ label: 'Real', field: 'leadsProdReal' }, { label: 'Orçado', field: 'leadsProdOrcado' }, { label: 'Δ Orç.', field: 'leadsProdReal' }, { label: 'C.A.', field: 'leadsProdA1' }, { label: 'Δ C.A.', field: 'leadsProdReal' }, { label: 'Acum.', field: 'leadsProdReal' }],
  [{ label: 'Real', field: 'cplProdReal' }, { label: 'Orçado', field: 'cplProdOrcado' }, { label: 'Δ Orç.', field: 'cplProdReal' }, { label: 'C.A.', field: 'cplProdA1' }, { label: 'Δ C.A.', field: 'cplProdReal' }, { label: 'Acum.', field: 'cplProdReal' }],
  [{ label: 'Real', field: 'matriculasReal' }, { label: 'Orçado', field: 'matriculasOrcado' }, { label: 'Δ Orç.', field: 'matriculasReal' }, { label: 'C.A.', field: 'matriculasA1' }, { label: 'Δ C.A.', field: 'matriculasReal' }, { label: 'Acum.', field: 'matriculasReal' }],
  [{ label: 'Real', field: 'cacReal' }, { label: 'Orçado', field: 'cacOrcado' }, { label: 'Δ Orç.', field: 'cacReal' }, { label: 'C.A.', field: 'cacA1' }, { label: 'Δ C.A.', field: 'cacReal' }, { label: 'Acum.', field: 'cacReal' }],
];

const SortIcon = ({ field, sort }: { field: SortField; sort: SortConfig }) => {
  if (sort.field !== field) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
  return sort.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
};

// Table Header Component
const MetricTableHeader = ({ firstColumnLabel, sort, onSort }: { firstColumnLabel: string; sort: SortConfig; onSort: (field: SortField) => void }) => (
  <TableHeader>
    <TableRow className="border-b-0">
      <TableHead 
        rowSpan={2} 
        className="font-bold bg-muted/50 border-r align-middle sticky left-0 z-[5] bg-background cursor-pointer select-none"
        onClick={() => onSort('label')}
      >
        <div className="flex items-center gap-1">
          {firstColumnLabel}
          <SortIcon field="label" sort={sort} />
        </div>
      </TableHead>
      {metricGroups.map((group) => (
        <TableHead 
          key={group.name} 
          colSpan={6} 
          className={cn(
            'text-center font-bold border-l-2 border-r-2',
            group.color,
            group.borderColor
          )}
        >
          {group.name}
        </TableHead>
      ))}
      <TableHead 
        rowSpan={2} 
        className="font-bold bg-muted/50 border-l text-right align-middle cursor-pointer select-none"
        onClick={() => onSort('investTotal')}
      >
        <div className="flex items-center gap-1 justify-end">
          Invest. Total
          <SortIcon field="investTotal" sort={sort} />
        </div>
      </TableHead>
    </TableRow>
    
    <TableRow className="bg-muted/30">
      {metricGroups.map((group, gi) => (
        <>
          {subColumns[gi].map((col, ci) => (
            <TableHead 
              key={`${group.name}-${ci}`} 
              className={cn(
                'text-right text-xs font-medium cursor-pointer select-none hover:bg-muted/50',
                ci === 0 && `border-l-2 ${group.borderColor}`,
                ci === 5 && `bg-muted/50 border-r-2 ${group.borderColor}`,
              )}
              onClick={() => onSort(col.field)}
            >
              <div className="flex items-center gap-0.5 justify-end">
                {col.label}
                <SortIcon field={col.field} sort={sort} />
              </div>
            </TableHead>
          ))}
        </>
      ))}
    </TableRow>
  </TableHeader>
);

// Data Row Component
const DataRow = ({ item, isAccumulated = false }: { item: AggregatedData; isAccumulated?: boolean }) => {
  const cacRealAvg = item.count > 0 ? item.cacRealSum / item.count : 0;
  const cacOrcadoAvg = item.count > 0 ? item.cacOrcadoSum / item.count : 0;
  const cacA1Avg = item.count > 0 ? item.cacA1Sum / item.count : 0;
  const cplRealAvg = item.count > 0 ? item.cplRealSum / item.count : 0;
  const cplOrcadoAvg = item.count > 0 ? item.cplOrcadoSum / item.count : 0;
  const cplA1Avg = item.count > 0 ? item.cplA1Sum / item.count : 0;
  const cplProdRealAvg = item.count > 0 ? item.cplProdRealSum / item.count : 0;
  const cplProdOrcadoAvg = item.count > 0 ? item.cplProdOrcadoSum / item.count : 0;
  const cplProdA1Avg = item.count > 0 ? item.cplProdA1Sum / item.count : 0;

  const bgClass = isAccumulated ? 'bg-primary/10 font-semibold border-t-2 border-primary/20' : 'hover:bg-muted/30';
  const cellBgClass = isAccumulated ? 'bg-muted/50' : 'bg-muted/30';

  return (
    <TableRow className={bgClass}>
      <TableCell className={cn("border-r sticky left-0 z-[5]", isAccumulated ? "font-bold bg-primary/10" : "bg-background")}>{item.label}</TableCell>
      
      {/* LEADS */}
      <TableCell className="text-right border-l-2 border-blue-300 dark:border-blue-700">
        <ValueCell value={item.leadsReal} />
      </TableCell>
      <TableCell className="text-right">
        <ValueCell value={item.leadsOrcado} />
      </TableCell>
      <TableCell className="text-right">
        <DiffCell real={item.leadsReal} comparativo={item.leadsOrcado} />
      </TableCell>
      <TableCell className="text-right">
        <ValueCell value={item.leadsA1} />
      </TableCell>
      <TableCell className="text-right">
        <DiffCell real={item.leadsReal} comparativo={item.leadsA1} />
      </TableCell>
      <TableCell className={cn("text-right border-r-2 border-blue-300 dark:border-blue-700", cellBgClass)}>
        <ValueCell value={item.leadsReal} />
      </TableCell>
      
      {/* CPL */}
      <TableCell className="text-right border-l-2 border-purple-300 dark:border-purple-700">
        <ValueCell value={cplRealAvg} prefix="R$ " decimals={2} />
      </TableCell>
      <TableCell className="text-right">
        <ValueCell value={cplOrcadoAvg} prefix="R$ " decimals={2} />
      </TableCell>
      <TableCell className="text-right">
        <DiffCell real={cplRealAvg} comparativo={cplOrcadoAvg} isCost />
      </TableCell>
      <TableCell className="text-right">
        <ValueCell value={cplA1Avg} prefix="R$ " decimals={2} />
      </TableCell>
      <TableCell className="text-right">
        <DiffCell real={cplRealAvg} comparativo={cplA1Avg} isCost />
      </TableCell>
      <TableCell className={cn("text-right border-r-2 border-purple-300 dark:border-purple-700", cellBgClass)}>
        <ValueCell value={cplRealAvg} prefix="R$ " decimals={2} />
      </TableCell>
      
      {/* LEADS PROD */}
      <TableCell className="text-right border-l-2 border-cyan-300 dark:border-cyan-700">
        <ValueCell value={item.leadsProdReal} />
      </TableCell>
      <TableCell className="text-right">
        <ValueCell value={item.leadsProdOrcado} />
      </TableCell>
      <TableCell className="text-right">
        <DiffCell real={item.leadsProdReal} comparativo={item.leadsProdOrcado} />
      </TableCell>
      <TableCell className="text-right">
        <ValueCell value={item.leadsProdA1} />
      </TableCell>
      <TableCell className="text-right">
        <DiffCell real={item.leadsProdReal} comparativo={item.leadsProdA1} />
      </TableCell>
      <TableCell className={cn("text-right border-r-2 border-cyan-300 dark:border-cyan-700", cellBgClass)}>
        <ValueCell value={item.leadsProdReal} />
      </TableCell>
      
      {/* CPL PROD */}
      <TableCell className="text-right border-l-2 border-pink-300 dark:border-pink-700">
        <ValueCell value={cplProdRealAvg} prefix="R$ " decimals={2} />
      </TableCell>
      <TableCell className="text-right">
        <ValueCell value={cplProdOrcadoAvg} prefix="R$ " decimals={2} />
      </TableCell>
      <TableCell className="text-right">
        <DiffCell real={cplProdRealAvg} comparativo={cplProdOrcadoAvg} isCost />
      </TableCell>
      <TableCell className="text-right">
        <ValueCell value={cplProdA1Avg} prefix="R$ " decimals={2} />
      </TableCell>
      <TableCell className="text-right">
        <DiffCell real={cplProdRealAvg} comparativo={cplProdA1Avg} isCost />
      </TableCell>
      <TableCell className={cn("text-right border-r-2 border-pink-300 dark:border-pink-700", cellBgClass)}>
        <ValueCell value={cplProdRealAvg} prefix="R$ " decimals={2} />
      </TableCell>
      
      {/* MATRÍCULAS */}
      <TableCell className="text-right border-l-2 border-green-300 dark:border-green-700">
        <ValueCell value={item.matriculasReal} />
      </TableCell>
      <TableCell className="text-right">
        <ValueCell value={item.matriculasOrcado} />
      </TableCell>
      <TableCell className="text-right">
        <DiffCell real={item.matriculasReal} comparativo={item.matriculasOrcado} />
      </TableCell>
      <TableCell className="text-right">
        <ValueCell value={item.matriculasA1} />
      </TableCell>
      <TableCell className="text-right">
        <DiffCell real={item.matriculasReal} comparativo={item.matriculasA1} />
      </TableCell>
      <TableCell className={cn("text-right border-r-2 border-green-300 dark:border-green-700", cellBgClass)}>
        <ValueCell value={item.matriculasReal} />
      </TableCell>
      
      {/* CAC */}
      <TableCell className="text-right border-l-2 border-orange-300 dark:border-orange-700">
        <ValueCell value={cacRealAvg} prefix="R$ " decimals={2} />
      </TableCell>
      <TableCell className="text-right">
        <ValueCell value={cacOrcadoAvg} prefix="R$ " decimals={2} />
      </TableCell>
      <TableCell className="text-right">
        <DiffCell real={cacRealAvg} comparativo={cacOrcadoAvg} isCost />
      </TableCell>
      <TableCell className="text-right">
        <ValueCell value={cacA1Avg} prefix="R$ " decimals={2} />
      </TableCell>
      <TableCell className="text-right">
        <DiffCell real={cacRealAvg} comparativo={cacA1Avg} isCost />
      </TableCell>
      <TableCell className={cn("text-right border-r-2 border-orange-300 dark:border-orange-700", cellBgClass)}>
        <ValueCell value={cacRealAvg} prefix="R$ " decimals={2} />
      </TableCell>
      
      {/* INVEST TOTAL */}
      <TableCell className={cn("text-right border-l", isAccumulated && "font-bold")}>
        R$ {item.investTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </TableCell>
    </TableRow>
  );
};

export const DashboardTable = ({ data, showAccumulated = true }: DashboardTableProps) => {
  const [brandSort, setBrandSort] = useState<SortConfig>({ field: 'label', dir: 'asc' });
  const [unitSort, setUnitSort] = useState<SortConfig>({ field: 'label', dir: 'asc' });

  const toggleSort = useCallback((setter: React.Dispatch<React.SetStateAction<SortConfig>>) => (field: SortField) => {
    setter(prev => prev.field === field ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' });
  }, []);

  const getSortValue = useCallback((item: AggregatedData, field: SortField): number | string => {
    switch (field) {
      case 'label': return item.label;
      case 'leadsReal': return item.leadsReal;
      case 'leadsOrcado': return item.leadsOrcado;
      case 'leadsA1': return item.leadsA1;
      case 'leadsProdReal': return item.leadsProdReal;
      case 'leadsProdOrcado': return item.leadsProdOrcado;
      case 'leadsProdA1': return item.leadsProdA1;
      case 'matriculasReal': return item.matriculasReal;
      case 'matriculasOrcado': return item.matriculasOrcado;
      case 'matriculasA1': return item.matriculasA1;
      case 'cplReal': return item.count > 0 ? item.cplRealSum / item.count : 0;
      case 'cplOrcado': return item.count > 0 ? item.cplOrcadoSum / item.count : 0;
      case 'cplA1': return item.count > 0 ? item.cplA1Sum / item.count : 0;
      case 'cplProdReal': return item.count > 0 ? item.cplProdRealSum / item.count : 0;
      case 'cplProdOrcado': return item.count > 0 ? item.cplProdOrcadoSum / item.count : 0;
      case 'cplProdA1': return item.count > 0 ? item.cplProdA1Sum / item.count : 0;
      case 'cacReal': return item.count > 0 ? item.cacRealSum / item.count : 0;
      case 'cacOrcado': return item.count > 0 ? item.cacOrcadoSum / item.count : 0;
      case 'cacA1': return item.count > 0 ? item.cacA1Sum / item.count : 0;
      case 'investTotal': return item.investTotal;
      default: return item.label;
    }
  }, []);

  const sortItems = useCallback((items: AggregatedData[], sort: SortConfig) => {
    return [...items].sort((a, b) => {
      const aVal = getSortValue(a, sort.field);
      const bVal = getSortValue(b, sort.field);
      const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal as string, 'pt-BR') : (aVal as number) - (bVal as number);
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [getSortValue]);
  // Separate data: Brand-level data (unidade === 'Geral' or directly marca entries) vs Unit data
  const { brandData, unitData } = useMemo(() => {
    // Brand data: entries where unidade is 'Geral' (marca-level data)
    const brandEntries = data.filter(item => item.unidade === 'Geral');
    // Unit data: entries where unidade is NOT 'Geral' (actual unit data)
    const unitEntries = data.filter(item => item.unidade !== 'Geral');
    
    return { brandData: brandEntries, unitData: unitEntries };
  }, [data]);

  // Aggregate brand data by marca (for Marcas table)
  const aggregatedBrands = useMemo(() => {
    const brandMap = new Map<string, AggregatedData>();
    
    brandData.forEach(item => {
      const existing = brandMap.get(item.marca);
      const totalInvest = item.investMeta + item.investGoogle + item.investOff + item.investEventos;
      
      if (existing) {
        existing.count++;
        existing.leadsReal += item.leadsReal;
        existing.leadsOrcado += item.leadsOrcado;
        existing.leadsA1 += item.leadsA1;
        existing.leadsProdReal += item.leadsProdReal;
        existing.leadsProdOrcado += item.leadsProdOrcado;
        existing.leadsProdA1 += item.leadsProdA1;
        existing.matriculasReal += item.matriculasReal;
        existing.matriculasOrcado += item.matriculasOrcado;
        existing.matriculasA1 += item.matriculasA1;
        existing.cacRealSum += item.cacReal;
        existing.cacOrcadoSum += item.cacOrcado;
        existing.cacA1Sum += item.cacA1;
        existing.cplRealSum += item.cplReal;
        existing.cplOrcadoSum += item.cplOrcado;
        existing.cplA1Sum += item.cplA1;
        existing.cplProdRealSum += item.cplProdReal;
        existing.cplProdOrcadoSum += item.cplProdOrcado;
        existing.cplProdA1Sum += item.cplProdA1;
        existing.investTotal += totalInvest;
      } else {
        brandMap.set(item.marca, {
          label: item.marca,
          marca: item.marca,
          count: 1,
          leadsReal: item.leadsReal,
          leadsOrcado: item.leadsOrcado,
          leadsA1: item.leadsA1,
          leadsProdReal: item.leadsProdReal,
          leadsProdOrcado: item.leadsProdOrcado,
          leadsProdA1: item.leadsProdA1,
          matriculasReal: item.matriculasReal,
          matriculasOrcado: item.matriculasOrcado,
          matriculasA1: item.matriculasA1,
          cacRealSum: item.cacReal,
          cacOrcadoSum: item.cacOrcado,
          cacA1Sum: item.cacA1,
          cplRealSum: item.cplReal,
          cplOrcadoSum: item.cplOrcado,
          cplA1Sum: item.cplA1,
          cplProdRealSum: item.cplProdReal,
          cplProdOrcadoSum: item.cplProdOrcado,
          cplProdA1Sum: item.cplProdA1,
          investTotal: totalInvest,
        });
      }
    });
    
    return Array.from(brandMap.values());
  }, [brandData]);

  // Aggregate unit data by unidade (for Unidades table)
  const aggregatedUnits = useMemo(() => {
    const unitMap = new Map<string, AggregatedData>();
    
    unitData.forEach(item => {
      const key = `${item.marca}-${item.unidade}`;
      const existing = unitMap.get(key);
      const totalInvest = item.investMeta + item.investGoogle + item.investOff + item.investEventos;
      
      if (existing) {
        existing.count++;
        existing.leadsReal += item.leadsReal;
        existing.leadsOrcado += item.leadsOrcado;
        existing.leadsA1 += item.leadsA1;
        existing.leadsProdReal += item.leadsProdReal;
        existing.leadsProdOrcado += item.leadsProdOrcado;
        existing.leadsProdA1 += item.leadsProdA1;
        existing.matriculasReal += item.matriculasReal;
        existing.matriculasOrcado += item.matriculasOrcado;
        existing.matriculasA1 += item.matriculasA1;
        existing.cacRealSum += item.cacReal;
        existing.cacOrcadoSum += item.cacOrcado;
        existing.cacA1Sum += item.cacA1;
        existing.cplRealSum += item.cplReal;
        existing.cplOrcadoSum += item.cplOrcado;
        existing.cplA1Sum += item.cplA1;
        existing.cplProdRealSum += item.cplProdReal;
        existing.cplProdOrcadoSum += item.cplProdOrcado;
        existing.cplProdA1Sum += item.cplProdA1;
        existing.investTotal += totalInvest;
      } else {
        unitMap.set(key, {
          label: `${item.marca} - ${item.unidade}`,
          marca: item.marca,
          unidade: item.unidade,
          count: 1,
          leadsReal: item.leadsReal,
          leadsOrcado: item.leadsOrcado,
          leadsA1: item.leadsA1,
          leadsProdReal: item.leadsProdReal,
          leadsProdOrcado: item.leadsProdOrcado,
          leadsProdA1: item.leadsProdA1,
          matriculasReal: item.matriculasReal,
          matriculasOrcado: item.matriculasOrcado,
          matriculasA1: item.matriculasA1,
          cacRealSum: item.cacReal,
          cacOrcadoSum: item.cacOrcado,
          cacA1Sum: item.cacA1,
          cplRealSum: item.cplReal,
          cplOrcadoSum: item.cplOrcado,
          cplA1Sum: item.cplA1,
          cplProdRealSum: item.cplProdReal,
          cplProdOrcadoSum: item.cplProdOrcado,
          cplProdA1Sum: item.cplProdA1,
          investTotal: totalInvest,
        });
      }
    });
    
    return Array.from(unitMap.values());
  }, [unitData]);

  // Calculate accumulated for brands
  const brandAccumulated = useMemo(() => {
    if (aggregatedBrands.length === 0) return null;
    
    const totals = aggregatedBrands.reduce((acc, brand) => ({
      leadsReal: acc.leadsReal + brand.leadsReal,
      leadsOrcado: acc.leadsOrcado + brand.leadsOrcado,
      leadsA1: acc.leadsA1 + brand.leadsA1,
      leadsProdReal: acc.leadsProdReal + brand.leadsProdReal,
      leadsProdOrcado: acc.leadsProdOrcado + brand.leadsProdOrcado,
      leadsProdA1: acc.leadsProdA1 + brand.leadsProdA1,
      matriculasReal: acc.matriculasReal + brand.matriculasReal,
      matriculasOrcado: acc.matriculasOrcado + brand.matriculasOrcado,
      matriculasA1: acc.matriculasA1 + brand.matriculasA1,
      cacRealSum: acc.cacRealSum + brand.cacRealSum,
      cacOrcadoSum: acc.cacOrcadoSum + brand.cacOrcadoSum,
      cacA1Sum: acc.cacA1Sum + brand.cacA1Sum,
      cplRealSum: acc.cplRealSum + brand.cplRealSum,
      cplOrcadoSum: acc.cplOrcadoSum + brand.cplOrcadoSum,
      cplA1Sum: acc.cplA1Sum + brand.cplA1Sum,
      cplProdRealSum: acc.cplProdRealSum + brand.cplProdRealSum,
      cplProdOrcadoSum: acc.cplProdOrcadoSum + brand.cplProdOrcadoSum,
      cplProdA1Sum: acc.cplProdA1Sum + brand.cplProdA1Sum,
      investTotal: acc.investTotal + brand.investTotal,
      totalCount: acc.totalCount + brand.count,
    }), {
      leadsReal: 0, leadsOrcado: 0, leadsA1: 0,
      leadsProdReal: 0, leadsProdOrcado: 0, leadsProdA1: 0,
      matriculasReal: 0, matriculasOrcado: 0, matriculasA1: 0,
      cacRealSum: 0, cacOrcadoSum: 0, cacA1Sum: 0,
      cplRealSum: 0, cplOrcadoSum: 0, cplA1Sum: 0,
      cplProdRealSum: 0, cplProdOrcadoSum: 0, cplProdA1Sum: 0,
      investTotal: 0, totalCount: 0,
    });
    
    return {
      label: 'MÉDIA RAIZ',
      count: totals.totalCount,
      ...totals,
    } as AggregatedData;
  }, [aggregatedBrands]);

  // Calculate accumulated for units
  const unitAccumulated = useMemo(() => {
    if (aggregatedUnits.length === 0) return null;
    
    const totals = aggregatedUnits.reduce((acc, unit) => ({
      leadsReal: acc.leadsReal + unit.leadsReal,
      leadsOrcado: acc.leadsOrcado + unit.leadsOrcado,
      leadsA1: acc.leadsA1 + unit.leadsA1,
      leadsProdReal: acc.leadsProdReal + unit.leadsProdReal,
      leadsProdOrcado: acc.leadsProdOrcado + unit.leadsProdOrcado,
      leadsProdA1: acc.leadsProdA1 + unit.leadsProdA1,
      matriculasReal: acc.matriculasReal + unit.matriculasReal,
      matriculasOrcado: acc.matriculasOrcado + unit.matriculasOrcado,
      matriculasA1: acc.matriculasA1 + unit.matriculasA1,
      cacRealSum: acc.cacRealSum + unit.cacRealSum,
      cacOrcadoSum: acc.cacOrcadoSum + unit.cacOrcadoSum,
      cacA1Sum: acc.cacA1Sum + unit.cacA1Sum,
      cplRealSum: acc.cplRealSum + unit.cplRealSum,
      cplOrcadoSum: acc.cplOrcadoSum + unit.cplOrcadoSum,
      cplA1Sum: acc.cplA1Sum + unit.cplA1Sum,
      cplProdRealSum: acc.cplProdRealSum + unit.cplProdRealSum,
      cplProdOrcadoSum: acc.cplProdOrcadoSum + unit.cplProdOrcadoSum,
      cplProdA1Sum: acc.cplProdA1Sum + unit.cplProdA1Sum,
      investTotal: acc.investTotal + unit.investTotal,
      totalCount: acc.totalCount + unit.count,
    }), {
      leadsReal: 0, leadsOrcado: 0, leadsA1: 0,
      leadsProdReal: 0, leadsProdOrcado: 0, leadsProdA1: 0,
      matriculasReal: 0, matriculasOrcado: 0, matriculasA1: 0,
      cacRealSum: 0, cacOrcadoSum: 0, cacA1Sum: 0,
      cplRealSum: 0, cplOrcadoSum: 0, cplA1Sum: 0,
      cplProdRealSum: 0, cplProdOrcadoSum: 0, cplProdA1Sum: 0,
      investTotal: 0, totalCount: 0,
    });
    
    return {
      label: 'MÉDIA RAIZ',
      count: totals.totalCount,
      ...totals,
    } as AggregatedData;
  }, [aggregatedUnits]);

  // Convert data to CSV format
  const convertToCSV = useCallback((items: AggregatedData[], firstColumn: string) => {
    const headers = [
      firstColumn,
      'Leads Real', 'Leads Orçado', 'Leads C.A.',
      'CPL Real', 'CPL Orçado', 'CPL C.A.',
      'Leads Prod. Real', 'Leads Prod. Orçado', 'Leads Prod. C.A.',
      'CPL Prod. Real', 'CPL Prod. Orçado', 'CPL Prod. C.A.',
      'Matrículas Real', 'Matrículas Orçado', 'Matrículas C.A.',
      'CAC Real', 'CAC Orçado', 'CAC C.A.',
      'Investimento Total'
    ];

    const rows = items.map(item => {
      const cacRealAvg = item.count > 0 ? item.cacRealSum / item.count : 0;
      const cacOrcadoAvg = item.count > 0 ? item.cacOrcadoSum / item.count : 0;
      const cacA1Avg = item.count > 0 ? item.cacA1Sum / item.count : 0;
      const cplRealAvg = item.count > 0 ? item.cplRealSum / item.count : 0;
      const cplOrcadoAvg = item.count > 0 ? item.cplOrcadoSum / item.count : 0;
      const cplA1Avg = item.count > 0 ? item.cplA1Sum / item.count : 0;
      const cplProdRealAvg = item.count > 0 ? item.cplProdRealSum / item.count : 0;
      const cplProdOrcadoAvg = item.count > 0 ? item.cplProdOrcadoSum / item.count : 0;
      const cplProdA1Avg = item.count > 0 ? item.cplProdA1Sum / item.count : 0;

      return [
        item.label,
        item.leadsReal, item.leadsOrcado, item.leadsA1,
        cplRealAvg.toFixed(2), cplOrcadoAvg.toFixed(2), cplA1Avg.toFixed(2),
        item.leadsProdReal, item.leadsProdOrcado, item.leadsProdA1,
        cplProdRealAvg.toFixed(2), cplProdOrcadoAvg.toFixed(2), cplProdA1Avg.toFixed(2),
        item.matriculasReal, item.matriculasOrcado, item.matriculasA1,
        cacRealAvg.toFixed(2), cacOrcadoAvg.toFixed(2), cacA1Avg.toFixed(2),
        item.investTotal.toFixed(2)
      ].join(';');
    });

    return [headers.join(';'), ...rows].join('\n');
  }, []);

  // Download file
  const downloadFile = useCallback((content: string, filename: string, type: string) => {
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + content], { type: `${type};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  // Export handlers
  const handleExportCSV = useCallback((type: 'marcas' | 'unidades') => {
    const items = type === 'marcas' 
      ? [...aggregatedBrands, ...(brandAccumulated ? [brandAccumulated] : [])]
      : [...aggregatedUnits, ...(unitAccumulated ? [unitAccumulated] : [])];
    
    const firstColumn = type === 'marcas' ? 'Marca' : 'Marca - Unidade';
    const csv = convertToCSV(items, firstColumn);
    const filename = type === 'marcas' ? 'performance_marcas.csv' : 'performance_unidades.csv';
    
    downloadFile(csv, filename, 'text/csv');
    toast.success(`Arquivo ${filename} exportado com sucesso!`);
  }, [aggregatedBrands, aggregatedUnits, brandAccumulated, unitAccumulated, convertToCSV, downloadFile]);

  const handleExportExcel = useCallback((type: 'marcas' | 'unidades') => {
    const items = type === 'marcas' 
      ? [...aggregatedBrands, ...(brandAccumulated ? [brandAccumulated] : [])]
      : [...aggregatedUnits, ...(unitAccumulated ? [unitAccumulated] : [])];
    
    const firstColumn = type === 'marcas' ? 'Marca' : 'Marca - Unidade';
    const csv = convertToCSV(items, firstColumn);
    const filename = type === 'marcas' ? 'performance_marcas.xls' : 'performance_unidades.xls';
    
    // Create HTML table for Excel compatibility
    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head><meta charset="UTF-8"></head>
      <body>
        <table border="1">
          ${csv.split('\n').map((row, i) => 
            `<tr>${row.split(';').map(cell => 
              i === 0 ? `<th>${cell}</th>` : `<td>${cell}</td>`
            ).join('')}</tr>`
          ).join('')}
        </table>
      </body>
      </html>
    `;
    
    downloadFile(htmlContent, filename, 'application/vnd.ms-excel');
    toast.success(`Arquivo ${filename} exportado com sucesso!`);
  }, [aggregatedBrands, aggregatedUnits, brandAccumulated, unitAccumulated, convertToCSV, downloadFile]);

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Tabelas de Performance</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="marcas" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="marcas" className="gap-2">
                <Building2 className="h-4 w-4" />
                Por Marca
              </TabsTrigger>
              <TabsTrigger value="unidades" className="gap-2">
                <Store className="h-4 w-4" />
                Por Unidade
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="marcas">
            {aggregatedBrands.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum dado de marca disponível. Adicione dados com unidade "Geral" para visualizar aqui.
              </div>
            ) : (
              <>
                <div className="flex justify-end mb-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        Exportar
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleExportCSV('marcas')} className="gap-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        Exportar CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportExcel('marcas')} className="gap-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        Exportar Excel
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <MetricTableHeader firstColumnLabel="Marca" sort={brandSort} onSort={toggleSort(setBrandSort)} />
                    <TableBody>
                      {sortItems(aggregatedBrands, brandSort).map((brand) => (
                        <DataRow key={brand.label} item={brand} />
                      ))}
                      {showAccumulated && brandAccumulated && (
                        <DataRow item={brandAccumulated} isAccumulated />
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="unidades">
            {aggregatedUnits.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum dado de unidade disponível. Adicione dados com unidades específicas para visualizar aqui.
              </div>
            ) : (
              <>
                <div className="flex justify-end mb-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        Exportar
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleExportCSV('unidades')} className="gap-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        Exportar CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportExcel('unidades')} className="gap-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        Exportar Excel
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <MetricTableHeader firstColumnLabel="Marca - Unidade" sort={unitSort} onSort={toggleSort(setUnitSort)} />
                    <TableBody>
                      {sortItems(aggregatedUnits, unitSort).map((unit) => (
                        <DataRow key={unit.label} item={unit} />
                      ))}
                      {showAccumulated && unitAccumulated && (
                        <DataRow item={unitAccumulated} isAccumulated />
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
