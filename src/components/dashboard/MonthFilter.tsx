import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface AvailableMonth {
  year: number;
  monthNumber: number;
  label: string;
  date: Date;
}

interface MonthFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  comparisonRange?: DateRange;
  onComparisonRangeChange?: (range: DateRange | undefined) => void;
  showComparison?: boolean;
  availableMonths: AvailableMonth[];
}

const MonthButton = ({ 
  month, 
  isSelected, 
  onClick 
}: { 
  month: AvailableMonth; 
  isSelected: boolean;
  onClick: () => void;
}) => (
  <Button
    variant={isSelected ? "default" : "outline"}
    size="sm"
    className={cn(
      "text-xs h-8",
      isSelected && "bg-primary text-primary-foreground"
    )}
    onClick={onClick}
  >
    {month.label}
  </Button>
);

export const MonthFilter = ({
  dateRange,
  onDateRangeChange,
  comparisonRange,
  onComparisonRangeChange,
  showComparison = true,
  availableMonths,
}: MonthFilterProps) => {
  const [showComparisonPicker, setShowComparisonPicker] = useState(false);
  const [mainOpen, setMainOpen] = useState(false);
  const [compOpen, setCompOpen] = useState(false);

  // Group months by year
  const monthsByYear = useMemo(() => {
    const grouped: Record<number, AvailableMonth[]> = {};
    availableMonths.forEach(month => {
      if (!grouped[month.year]) {
        grouped[month.year] = [];
      }
      grouped[month.year].push(month);
    });
    // Sort years descending, months ascending within year
    const sortedYears = Object.keys(grouped).map(Number).sort((a, b) => b - a);
    sortedYears.forEach(year => {
      grouped[year].sort((a, b) => a.monthNumber - b.monthNumber);
    });
    return { grouped, sortedYears };
  }, [availableMonths]);

  const isMonthSelected = (month: AvailableMonth, range: DateRange | undefined) => {
    if (!range?.from) return false;
    return range.from.getFullYear() === month.year && 
           range.from.getMonth() + 1 === month.monthNumber;
  };

  const handleMonthSelect = (month: AvailableMonth, isComparison: boolean) => {
    const startOfMonth = new Date(month.year, month.monthNumber - 1, 1);
    const endOfMonth = new Date(month.year, month.monthNumber, 0);
    
    if (isComparison) {
      onComparisonRangeChange?.({ from: startOfMonth, to: endOfMonth });
      setCompOpen(false);
    } else {
      onDateRangeChange({ from: startOfMonth, to: endOfMonth });
      setMainOpen(false);
    }
  };

  const clearDateRange = () => {
    onDateRangeChange({ from: undefined, to: undefined });
  };

  const clearComparison = () => {
    onComparisonRangeChange?.(undefined);
    setShowComparisonPicker(false);
  };

  const formatSelectedMonth = (range: DateRange | undefined) => {
    if (!range?.from) return null;
    return format(range.from, "MMMM yyyy", { locale: ptBR });
  };

  const MonthGrid = ({ 
    onSelect, 
    selectedRange,
    isComparison = false 
  }: { 
    onSelect: (month: AvailableMonth) => void;
    selectedRange: DateRange | undefined;
    isComparison?: boolean;
  }) => (
    <ScrollArea className="h-[300px]">
      <div className="p-3 space-y-4">
        {monthsByYear.sortedYears.map(year => (
          <div key={year}>
            <div className="text-sm font-semibold text-muted-foreground mb-2">
              {year}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {monthsByYear.grouped[year].map(month => (
                <MonthButton
                  key={`${month.year}-${month.monthNumber}`}
                  month={month}
                  isSelected={isMonthSelected(month, selectedRange)}
                  onClick={() => onSelect(month)}
                />
              ))}
            </div>
          </div>
        ))}
        {availableMonths.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-4">
            Nenhum mês com dados cadastrados
          </div>
        )}
      </div>
    </ScrollArea>
  );

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Main month picker */}
      <Popover open={mainOpen} onOpenChange={setMainOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "bg-card min-w-[180px] justify-between text-left font-normal",
              !dateRange.from && "text-muted-foreground"
            )}
          >
            <div className="flex items-center">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formatSelectedMonth(dateRange) || "Selecionar mês"}
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <MonthGrid 
            onSelect={(month) => handleMonthSelect(month, false)}
            selectedRange={dateRange}
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
          {!showComparisonPicker && !comparisonRange?.from ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowComparisonPicker(true)}
              className="text-xs"
            >
              + Comparar
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">vs</span>
              <Popover open={compOpen} onOpenChange={setCompOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "bg-card min-w-[160px] justify-between text-left font-normal",
                      !comparisonRange?.from && "text-muted-foreground"
                    )}
                  >
                    <div className="flex items-center">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formatSelectedMonth(comparisonRange) || "Mês anterior"}
                    </div>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0" align="start">
                  <MonthGrid 
                    onSelect={(month) => handleMonthSelect(month, true)}
                    selectedRange={comparisonRange}
                    isComparison
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
    </div>
  );
};
