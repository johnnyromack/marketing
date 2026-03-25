import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Calendar } from "lucide-react";

export type PeriodType = "weekly" | "biweekly" | "monthly";

interface PeriodFilterProps {
  value: PeriodType;
  onChange: (value: PeriodType) => void;
}

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <ToggleGroup type="single" value={value} onValueChange={(v) => v && onChange(v as PeriodType)} className="border rounded-lg p-1">
        <ToggleGroupItem value="weekly" className="text-xs px-3">Semanal</ToggleGroupItem>
        <ToggleGroupItem value="biweekly" className="text-xs px-3">Quinzenal</ToggleGroupItem>
        <ToggleGroupItem value="monthly" className="text-xs px-3">Mensal</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
