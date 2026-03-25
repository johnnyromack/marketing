import { useState } from "react";
import { format, subDays, startOfDay, endOfDay, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  className?: string;
}

const presets = [
  { label: "Hoje", getValue: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
  { label: "Ontem", getValue: () => ({ from: startOfDay(subDays(new Date(), 1)), to: endOfDay(subDays(new Date(), 1)) }) },
  { label: "Ultimos 7 dias", getValue: () => ({ from: subDays(new Date(), 6), to: new Date() }) },
  { label: "Ultimos 30 dias", getValue: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
  { label: "Ultimos 3 meses", getValue: () => ({ from: subMonths(new Date(), 3), to: new Date() }) },
];

export function DateRangePicker({ dateRange, onDateRangeChange, className }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);

  const handlePreset = (getValue: () => DateRange) => {
    onDateRangeChange(getValue());
    setOpen(false);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button id="date" variant="outline" className={cn("w-[280px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>{format(dateRange.from, "dd MMM yyyy", { locale: ptBR })} - {format(dateRange.to, "dd MMM yyyy", { locale: ptBR })}</>
              ) : (
                format(dateRange.from, "dd MMM yyyy", { locale: ptBR })
              )
            ) : (
              <span>Selecione um periodo</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            <div className="border-r p-2 space-y-1 min-w-[140px]">
              <p className="text-xs font-medium text-muted-foreground px-2 py-1">Atalhos</p>
              {presets.map((preset) => (
                <Button key={preset.label} variant="ghost" size="sm" className="w-full justify-start text-xs font-normal h-8" onClick={() => handlePreset(preset.getValue)}>
                  {preset.label}
                </Button>
              ))}
            </div>
            <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={onDateRangeChange} numberOfMonths={2} className="pointer-events-auto" />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
