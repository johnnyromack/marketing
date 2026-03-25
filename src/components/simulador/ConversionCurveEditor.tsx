import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, BarChart3, Calendar } from "lucide-react";

const ALL_MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

interface ConversionCurveEditorProps {
  curve: { month: string; percentage: number }[];
  onChange: (curve: { month: string; percentage: number }[]) => void;
  startMonth: number;
  endMonth: number;
  onStartMonthChange: (month: number) => void;
  onEndMonthChange: (month: number) => void;
}

export function ConversionCurveEditor({
  curve,
  onChange,
  startMonth,
  endMonth,
  onStartMonthChange,
  onEndMonthChange,
}: ConversionCurveEditorProps) {
  const getMonthsInPeriod = (): string[] => {
    const months: string[] = [];
    if (startMonth <= endMonth) {
      for (let i = startMonth; i <= endMonth; i++) {
        months.push(ALL_MONTHS[i]);
      }
    } else {
      for (let i = startMonth; i < 12; i++) {
        months.push(ALL_MONTHS[i]);
      }
      for (let i = 0; i <= endMonth; i++) {
        months.push(ALL_MONTHS[i]);
      }
    }
    return months;
  };

  const monthsInPeriod = getMonthsInPeriod();
  
  const orderedCurve = monthsInPeriod.map((month) => {
    const existing = curve.find((item) => item.month === month);
    return existing || { month, percentage: 0 };
  });

  const total = orderedCurve.reduce((sum, item) => sum + item.percentage, 0);
  const isValid = Math.abs(total - 100) < 0.1;

  const handlePercentageChange = (month: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newCurve = curve.map((item) =>
      item.month === month ? { ...item, percentage: numValue } : item
    );
    onChange(newCurve);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--chart-3))]">
        <BarChart3 className="h-4 w-4" />
        Curva de Conversão
      </div>

      <div className="space-y-3 rounded-lg border bg-background p-3">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          Período da Campanha
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Início</Label>
            <Select
              value={startMonth.toString()}
              onValueChange={(v) => onStartMonthChange(parseInt(v))}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-50 bg-popover">
                {ALL_MONTHS.map((month, index) => (
                  <SelectItem key={month} value={index.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Fim</Label>
            <Select
              value={endMonth.toString()}
              onValueChange={(v) => onEndMonthChange(parseInt(v))}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-50 bg-popover">
                {ALL_MONTHS.map((month, index) => (
                  <SelectItem key={month} value={index.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
          isValid
            ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]"
            : "bg-destructive/10 text-destructive"
        )}
      >
        {isValid ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <AlertCircle className="h-4 w-4" />
        )}
        <span>Total: {total.toFixed(1)}%</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {orderedCurve.map((item) => (
          <div key={item.month} className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">
              {item.month.substring(0, 3)}
            </Label>
            <div className="relative">
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={item.percentage}
                onChange={(e) => handlePercentageChange(item.month, e.target.value)}
                className="h-8 pr-6 text-right text-xs"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                %
              </span>
            </div>
            <Progress value={item.percentage} className="h-1" />
          </div>
        ))}
      </div>

      {!isValid && (
        <p className="text-xs text-destructive">
          Diferença: {(100 - total).toFixed(1)}%
        </p>
      )}
    </div>
  );
}
