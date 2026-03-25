import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FilterState } from '@/types/publicidade';
import { Calendar, Building2, MapPin, X, RotateCcw } from 'lucide-react';
import { useMarcasUnidadesData } from '@/hooks/useMarcasUnidadesData';
import { useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

interface MultiSelectFilterState {
  month: string;
  marcas: string[];
  unidades: string[];
}

interface DashboardFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  months: string[];
  marcas: string[];
  unidades?: string[];
  // New props for multi-select mode
  multiSelectMode?: boolean;
  multiFilters?: MultiSelectFilterState;
  onMultiFilterChange?: (filters: MultiSelectFilterState) => void;
}

export const DashboardFilters = ({
  filters,
  onFilterChange,
  months,
  marcas,
  unidades: unidadesProp,
  multiSelectMode = false,
  multiFilters,
  onMultiFilterChange,
}: DashboardFiltersProps) => {
  const { getUnidadesByMarcaNome, marcas: allMarcasFromDB, unidades: allUnidadesFromDB } = useMarcasUnidadesData();
  
  // Use unidades from prop if provided (from database), otherwise fallback to marca-based logic
  const unidades = unidadesProp && unidadesProp.length > 0
    ? unidadesProp
    : (filters.marca === 'Todas' 
      ? ['Todas', 'Geral'] 
      : ['Todas', 'Geral', ...getUnidadesByMarcaNome(filters.marca)]);

  // All unidades for multi-select mode - filtered by selected marcas
  const filteredUnidadesForMultiSelect = useMemo(() => {
    // If no marcas selected, show all unidades
    if (!multiFilters || multiFilters.marcas.length === 0) {
      if (unidadesProp && unidadesProp.length > 0) {
        return unidadesProp.filter(u => u !== 'Todas');
      }
      return ['Geral', ...marcas.filter(m => m !== 'Todas').flatMap(m => getUnidadesByMarcaNome(m))];
    }
    
    // Filter unidades by selected marcas
    const unidadesFromSelectedMarcas = multiFilters.marcas.flatMap(m => getUnidadesByMarcaNome(m));
    return [...new Set(unidadesFromSelectedMarcas)];
  }, [multiFilters?.marcas, marcas, getUnidadesByMarcaNome, unidadesProp]);

  const uniqueUnidades = [...new Set(filteredUnidadesForMultiSelect)];

  // Resetar unidade quando marca muda e unidade atual não existe (single select mode)
  useEffect(() => {
    if (!multiSelectMode && !unidades.includes(filters.unidade)) {
      onFilterChange({ ...filters, unidade: 'Todas' });
    }
  }, [filters.marca]);

  // Multi-select handlers
  const toggleMarca = (marca: string) => {
    if (!multiFilters || !onMultiFilterChange) return;
    const newMarcas = multiFilters.marcas.includes(marca)
      ? multiFilters.marcas.filter(m => m !== marca)
      : [...multiFilters.marcas, marca];
    
    // Get valid unidades for the new marcas selection
    const validUnidades = newMarcas.length === 0
      ? [] // Clear all unidades when no marca selected
      : newMarcas.flatMap(m => getUnidadesByMarcaNome(m));
    const validUnidadesSet = new Set(validUnidades);
    
    // Filter out unidades that don't belong to the selected marcas
    const filteredUnidades = multiFilters.unidades.filter(u => validUnidadesSet.has(u));
    
    onMultiFilterChange({ ...multiFilters, marcas: newMarcas, unidades: filteredUnidades });
  };

  const toggleUnidade = (unidade: string) => {
    if (!multiFilters || !onMultiFilterChange) return;
    const newUnidades = multiFilters.unidades.includes(unidade)
      ? multiFilters.unidades.filter(u => u !== unidade)
      : [...multiFilters.unidades, unidade];
    onMultiFilterChange({ ...multiFilters, unidades: newUnidades });
  };

  const clearMarcas = () => {
    if (onMultiFilterChange && multiFilters) {
      onMultiFilterChange({ ...multiFilters, marcas: [] });
    }
  };

  const clearUnidades = () => {
    if (onMultiFilterChange && multiFilters) {
      onMultiFilterChange({ ...multiFilters, unidades: [] });
    }
  };

  const clearAllFilters = () => {
    if (multiSelectMode && onMultiFilterChange) {
      onMultiFilterChange({ month: 'Todas', marcas: [], unidades: [] });
    } else {
      onFilterChange({ month: 'Todas', marca: 'Todas', unidade: 'Todas' });
    }
  };

  const availableMarcasFiltered = marcas.filter(m => m !== 'Todas');

  const hasActiveFilters = multiSelectMode 
    ? (multiFilters?.marcas.length || 0) > 0 || (multiFilters?.unidades.length || 0) > 0 || multiFilters?.month !== 'Todas'
    : filters.marca !== 'Todas' || filters.unidade !== 'Todas' || filters.month !== 'Todas';

  // Multi-select mode rendering
  if (multiSelectMode && multiFilters && onMultiFilterChange) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Month Filter */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select
              value={multiFilters.month}
              onValueChange={(value) => onMultiFilterChange({ ...multiFilters, month: value })}
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
                {multiFilters.marcas.length === 0 ? (
                  <span>Todas marcas</span>
                ) : (
                  <span>{multiFilters.marcas.length} marca(s)</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start">
              <div className="flex items-center justify-between mb-2 pb-2 border-b">
                <span className="text-sm font-medium">Marcas</span>
                {multiFilters.marcas.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearMarcas} className="h-7 text-xs">
                    Limpar
                  </Button>
                )}
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {availableMarcasFiltered.map((marca) => (
                  <label
                    key={marca}
                    className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                  >
                    <Checkbox
                      checked={multiFilters.marcas.includes(marca)}
                      onCheckedChange={() => toggleMarca(marca)}
                    />
                    <span className="text-sm">{marca}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Multi-select Unidade Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="bg-card min-w-[140px] justify-start">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                {multiFilters.unidades.length === 0 ? (
                  <span>Todas unidades</span>
                ) : (
                  <span>{multiFilters.unidades.length} unidade(s)</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start">
              <div className="flex items-center justify-between mb-2 pb-2 border-b">
                <span className="text-sm font-medium">Unidades</span>
                {multiFilters.unidades.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearUnidades} className="h-7 text-xs">
                    Limpar
                  </Button>
                )}
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
              {uniqueUnidades.map((unidade: string) => (
                <label
                  key={unidade}
                  className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                >
                  <Checkbox
                    checked={multiFilters.unidades.includes(unidade)}
                    onCheckedChange={() => toggleUnidade(unidade)}
                  />
                  <span className="text-sm">{unidade}</span>
                </label>
              ))}
            </div>
            </PopoverContent>
          </Popover>

          {/* Clear all filters button */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-1">
              <RotateCcw className="h-3 w-3" />
              Limpar
            </Button>
          )}
        </div>

        {/* Selected filters badges */}
        {(multiFilters.marcas.length > 0 || multiFilters.unidades.length > 0) && (
          <div className="flex flex-wrap gap-1 items-center">
            {multiFilters.marcas.map((marca) => (
              <Badge key={marca} variant="secondary" className="gap-1">
                {marca}
                <X className="h-3 w-3 cursor-pointer" onClick={() => toggleMarca(marca)} />
              </Badge>
            ))}
            {multiFilters.unidades.map((unidade) => (
              <Badge key={unidade} variant="outline" className="gap-1">
                {unidade}
                <X className="h-3 w-3 cursor-pointer" onClick={() => toggleUnidade(unidade)} />
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Single-select mode (original behavior)
  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <Select
          value={filters.month}
          onValueChange={(value) => onFilterChange({ ...filters, month: value })}
        >
          <SelectTrigger className="w-[140px] bg-card">
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

      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <Select
          value={filters.marca}
          onValueChange={(value) => onFilterChange({ ...filters, marca: value })}
        >
          <SelectTrigger className="w-[160px] bg-card">
            <SelectValue placeholder="Marca" />
          </SelectTrigger>
          <SelectContent>
            {marcas.map((marca) => (
              <SelectItem key={marca} value={marca}>
                {marca}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <Select
          value={filters.unidade}
          onValueChange={(value) => onFilterChange({ ...filters, unidade: value })}
        >
          <SelectTrigger className="w-[180px] bg-card">
            <SelectValue placeholder="Unidade" />
          </SelectTrigger>
          <SelectContent>
            {unidades.map((unidade) => (
              <SelectItem key={unidade} value={unidade}>
                {unidade}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear all filters button */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-1">
          <RotateCcw className="h-3 w-3" />
          Limpar
        </Button>
      )}
    </div>
  );
};
