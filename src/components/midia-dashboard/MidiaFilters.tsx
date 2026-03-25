import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MidiaFilterState } from '@/hooks/useMidiaData';
import { Calendar, Building2, X, Store, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { MidiaDateRangeFilter, DateRange } from './MidiaDateRangeFilter';

interface MidiaFiltersProps {
  filters: MidiaFilterState;
  onFilterChange: (filters: MidiaFilterState) => void;
  months: string[];
  years: number[];
  availableMarcas: string[];
  availableUnidades: string[];
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange) => void;
  comparisonRange?: DateRange;
  onComparisonRangeChange?: (range: DateRange | undefined) => void;
  showDateFilter?: boolean;
}

export const MidiaFilters = ({
  filters,
  onFilterChange,
  months,
  years,
  availableMarcas,
  availableUnidades,
  dateRange,
  onDateRangeChange,
  comparisonRange,
  onComparisonRangeChange,
  showDateFilter = true,
}: MidiaFiltersProps) => {
  const toggleMarca = (marca: string) => {
    const newMarcas = filters.marcas.includes(marca)
      ? filters.marcas.filter(m => m !== marca)
      : [...filters.marcas, marca];
    onFilterChange({ ...filters, marcas: newMarcas });
  };

  const toggleUnidade = (unidade: string) => {
    const newUnidades = filters.unidades.includes(unidade)
      ? filters.unidades.filter(u => u !== unidade)
      : [...filters.unidades, unidade];
    onFilterChange({ ...filters, unidades: newUnidades });
  };

  const clearMarcas = () => onFilterChange({ ...filters, marcas: [] });
  const clearUnidades = () => onFilterChange({ ...filters, unidades: [] });
  
  const clearAllFilters = () => {
    onFilterChange({
      ...filters,
      month: 'Todos',
      marcas: [],
      unidades: [],
    });
    if (onDateRangeChange) {
      onDateRangeChange({ from: undefined, to: undefined });
    }
    if (onComparisonRangeChange) {
      onComparisonRangeChange(undefined);
    }
  };

  const selectAllMarcas = () => {
    onFilterChange({ ...filters, marcas: [...availableMarcas] });
  };

  const selectAllUnidades = () => {
    onFilterChange({ ...filters, unidades: [...availableUnidades] });
  };

  const hasActiveFilters = filters.marcas.length > 0 || 
    filters.unidades.length > 0 || 
    filters.month !== 'Todos' ||
    (dateRange?.from !== undefined);

  return (
    <div className="flex flex-col gap-3">
      {/* Row 1: Basic filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Year Filter - now supports 'Todos' */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select
            value={filters.ano === 'Todos' ? 'Todos' : filters.ano.toString()}
            onValueChange={(value) => 
              onFilterChange({ 
                ...filters, 
                ano: value === 'Todos' ? 'Todos' : parseInt(value) 
              })
            }
          >
            <SelectTrigger className="w-[120px] bg-card">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos</SelectItem>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Month Filter */}
        <div className="flex items-center gap-2">
          <Select
            value={filters.month}
            onValueChange={(value) => onFilterChange({ ...filters, month: value })}
          >
            <SelectTrigger className="w-[130px] bg-card">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Multi-select Marca Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="bg-card min-w-[140px] justify-start">
              <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
              {filters.marcas.length === 0 ? (
                <span>Todas marcas</span>
              ) : (
                <span>{filters.marcas.length} marca(s)</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="start">
            <div className="flex items-center justify-between mb-2 pb-2 border-b">
              <span className="text-sm font-medium">Marcas</span>
              <div className="flex gap-1">
                {filters.marcas.length > 0 ? (
                  <Button variant="ghost" size="sm" onClick={clearMarcas} className="h-7 text-xs">
                    Limpar
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={selectAllMarcas} className="h-7 text-xs">
                    Todas
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {availableMarcas.map((marca) => (
                <label
                  key={marca}
                  className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                >
                  <Checkbox
                    checked={filters.marcas.includes(marca)}
                    onCheckedChange={() => toggleMarca(marca)}
                  />
                  <span className="text-sm">{marca}</span>
                </label>
              ))}
              {availableMarcas.length === 0 && (
                <p className="text-sm text-muted-foreground p-2">Nenhuma marca disponível</p>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Multi-select Unidade Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="bg-card min-w-[140px] justify-start">
              <Store className="h-4 w-4 mr-2 text-muted-foreground" />
              {filters.unidades.length === 0 ? (
                <span>Todas unidades</span>
              ) : (
                <span>{filters.unidades.length} unidade(s)</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="start">
            <div className="flex items-center justify-between mb-2 pb-2 border-b">
              <span className="text-sm font-medium">Unidades</span>
              <div className="flex gap-1">
                {filters.unidades.length > 0 ? (
                  <Button variant="ghost" size="sm" onClick={clearUnidades} className="h-7 text-xs">
                    Limpar
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={selectAllUnidades} className="h-7 text-xs">
                    Todas
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {availableUnidades.map((unidade) => (
                <label
                  key={unidade}
                  className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                >
                  <Checkbox
                    checked={filters.unidades.includes(unidade)}
                    onCheckedChange={() => toggleUnidade(unidade)}
                  />
                  <span className="text-sm">{unidade}</span>
                </label>
              ))}
              {availableUnidades.length === 0 && (
                <p className="text-sm text-muted-foreground p-2">Nenhuma unidade disponível</p>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear all filters button */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-1">
            <RotateCcw className="h-3 w-3" />
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Row 2: Date range filter */}
      {showDateFilter && dateRange && onDateRangeChange && (
        <MidiaDateRangeFilter
          dateRange={dateRange}
          onDateRangeChange={onDateRangeChange}
          comparisonRange={comparisonRange}
          onComparisonRangeChange={onComparisonRangeChange}
          showComparison={true}
        />
      )}

      {/* Selected filters badges */}
      {(filters.marcas.length > 0 || filters.unidades.length > 0) && (
        <div className="flex flex-wrap gap-1 items-center">
          {filters.marcas.map((marca) => (
            <Badge key={marca} variant="secondary" className="gap-1">
              {marca}
              <X className="h-3 w-3 cursor-pointer" onClick={() => toggleMarca(marca)} />
            </Badge>
          ))}
          {filters.unidades.map((unidade) => (
            <Badge key={unidade} variant="outline" className="gap-1">
              {unidade}
              <X className="h-3 w-3 cursor-pointer" onClick={() => toggleUnidade(unidade)} />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
