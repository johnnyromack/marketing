import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, startOfMonth, endOfMonth, subMonths, subYears, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DateRangeFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  comparisonRange?: DateRange;
  onComparisonRangeChange?: (range: DateRange | undefined) => void;
  showComparison?: boolean;
}

const presetOptions = [
  { label: 'Este mês', value: 'thisMonth' },
  { label: 'Últimos 3 meses', value: 'last3Months' },
  { label: 'Últimos 6 meses', value: 'last6Months' },
  { label: 'Este ano', value: 'thisYear' },
  { label: 'Ano anterior', value: 'lastYear' },
  { label: 'Ciclo atual', value: 'currentCycle' },
  { label: 'Personalizado', value: 'custom' },
];

export const DateRangeFilter = ({
  dateRange,
  onDateRangeChange,
  comparisonRange,
  onComparisonRangeChange,
  showComparison = true,
}: DateRangeFilterProps) => {
  const [preset, setPreset] = useState<string>('custom');
  const [showComparisonPicker, setShowComparisonPicker] = useState(false);

  const handlePresetChange = (value: string) => {
    setPreset(value);
    const now = new Date();
    
    switch (value) {
      case 'thisMonth':
        onDateRangeChange({ from: startOfMonth(now), to: endOfMonth(now) });
        break;
      case 'last3Months':
        onDateRangeChange({ from: startOfMonth(subMonths(now, 2)), to: endOfMonth(now) });
        break;
      case 'last6Months':
        onDateRangeChange({ from: startOfMonth(subMonths(now, 5)), to: endOfMonth(now) });
        break;
      case 'thisYear':
        onDateRangeChange({ from: startOfYear(now), to: endOfYear(now) });
        break;
      case 'lastYear':
        const lastYear = subYears(now, 1);
        onDateRangeChange({ from: startOfYear(lastYear), to: endOfYear(lastYear) });
        break;
      case 'currentCycle':
        // Ciclo de campanha: Agosto a Julho
        const currentMonth = now.getMonth();
        let cycleStart: Date;
        let cycleEnd: Date;
        if (currentMonth >= 7) { // Agosto em diante
          cycleStart = new Date(now.getFullYear(), 7, 1); // Agosto deste ano
          cycleEnd = new Date(now.getFullYear() + 1, 6, 31); // Julho próximo ano
        } else {
          cycleStart = new Date(now.getFullYear() - 1, 7, 1); // Agosto ano anterior
          cycleEnd = new Date(now.getFullYear(), 6, 31); // Julho deste ano
        }
        onDateRangeChange({ from: cycleStart, to: cycleEnd });
        break;
      default:
        break;
    }
  };

  const clearDateRange = () => {
    onDateRangeChange({ from: undefined, to: undefined });
    setPreset('custom');
  };

  const clearComparison = () => {
    onComparisonRangeChange?.(undefined);
    setShowComparisonPicker(false);
  };

  const formatDateRange = (range: DateRange) => {
    if (!range.from && !range.to) return null;
    if (range.from && !range.to) return format(range.from, "dd MMM yyyy", { locale: ptBR });
    if (range.from && range.to) {
      return `${format(range.from, "dd MMM", { locale: ptBR })} - ${format(range.to, "dd MMM yyyy", { locale: ptBR })}`;
    }
    return null;
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Preset selector */}
      <Select value={preset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[150px] bg-card">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          {presetOptions.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Main date range picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "bg-card min-w-[200px] justify-start text-left font-normal",
              !dateRange.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange(dateRange) || "Selecionar período"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange.from}
            selected={{ from: dateRange.from, to: dateRange.to }}
            onSelect={(range) => {
              onDateRangeChange({ from: range?.from, to: range?.to });
              setPreset('custom');
            }}
            numberOfMonths={2}
            locale={ptBR}
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      {dateRange.from && (
        <Button variant="ghost" size="icon" onClick={clearDateRange} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      )}

      {/* Comparison period */}
      {showComparison && (
        <>
          {!showComparisonPicker ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowComparisonPicker(true)}
              className="text-xs"
            >
              + Comparar período
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">vs</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "bg-card min-w-[180px] justify-start text-left font-normal",
                      !comparisonRange?.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {comparisonRange ? formatDateRange(comparisonRange) || "Período anterior" : "Período anterior"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={comparisonRange?.from}
                    selected={comparisonRange ? { from: comparisonRange.from, to: comparisonRange.to } : undefined}
                    onSelect={(range) => {
                      onComparisonRangeChange?.({ from: range?.from, to: range?.to });
                    }}
                    numberOfMonths={2}
                    locale={ptBR}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <Button variant="ghost" size="icon" onClick={clearComparison} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Display selected ranges as badges */}
      {(dateRange.from || comparisonRange?.from) && (
        <div className="flex gap-1 flex-wrap">
          {dateRange.from && (
            <Badge variant="secondary" className="text-xs">
              Período: {formatDateRange(dateRange)}
            </Badge>
          )}
          {comparisonRange?.from && (
            <Badge variant="outline" className="text-xs">
              Comparação: {formatDateRange(comparisonRange)}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
