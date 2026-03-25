import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { subDays, subMonths, startOfDay, endOfDay } from "date-fns";
import { DateRange } from "react-day-picker";

export type PeriodPreset = "today" | "yesterday" | "7d" | "15d" | "30d" | "3m" | "all";

interface PeriodSelectorProps {
  value: PeriodPreset;
  onChange: (preset: PeriodPreset, range: DateRange) => void;
}

const presets: { key: PeriodPreset; label: string }[] = [
  { key: "today", label: "Hoje" },
  { key: "yesterday", label: "Ontem" },
  { key: "7d", label: "Ultimos 7 dias" },
  { key: "15d", label: "Ultimos 15 dias" },
  { key: "30d", label: "Ultimos 30 dias" },
  { key: "3m", label: "Ultimos 3 meses" },
  { key: "all", label: "Todo o periodo" },
];

export function getDateRangeForPreset(preset: PeriodPreset): DateRange {
  const now = new Date();
  switch (preset) {
    case "today": return { from: startOfDay(now), to: endOfDay(now) };
    case "yesterday": return { from: startOfDay(subDays(now, 1)), to: endOfDay(subDays(now, 1)) };
    case "7d": return { from: subDays(now, 6), to: now };
    case "15d": return { from: subDays(now, 14), to: now };
    case "30d": return { from: subDays(now, 29), to: now };
    case "3m": return { from: subMonths(now, 3), to: now };
    case "all": return { from: new Date("2020-01-01"), to: now };
  }
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const currentLabel = presets.find((p) => p.key === value)?.label || "Selecionar";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 min-w-[160px]">
          <CalendarIcon className="h-4 w-4" />
          {currentLabel}
          <ChevronDown className="h-3 w-3 ml-auto opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {presets.map((preset) => (
          <DropdownMenuItem key={preset.key} onClick={() => onChange(preset.key, getDateRangeForPreset(preset.key))} className={value === preset.key ? "bg-accent" : ""}>
            {preset.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
