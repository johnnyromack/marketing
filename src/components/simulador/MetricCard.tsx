import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  variation?: number;
  showVariation?: boolean;
  icon?: React.ReactNode;
  className?: string;
  invertVariationLogic?: boolean;
}

export function MetricCard({
  title,
  value,
  subtitle,
  variation,
  showVariation = false,
  icon,
  className,
  invertVariationLogic = false,
}: MetricCardProps) {
  const getVariationColor = (val: number) => {
    if (invertVariationLogic) {
      if (val < 0) return "text-destructive";
      if (val > 0) return "text-[hsl(var(--success))]";
    } else {
      if (val < 0) return "text-[hsl(var(--success))]";
      if (val > 0) return "text-destructive";
    }
    return "text-muted-foreground";
  };

  const getVariationIcon = (val: number) => {
    if (val < 0) return <TrendingDown className="h-4 w-4" />;
    if (val > 0) return <TrendingUp className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {icon && (
            <div className="rounded-full bg-muted p-3 text-muted-foreground">
              {icon}
            </div>
          )}
        </div>
        {showVariation && variation !== undefined && (
          <div
            className={cn(
              "mt-4 flex items-center gap-1 text-sm font-medium",
              getVariationColor(variation)
            )}
          >
            {getVariationIcon(variation)}
            <span>
              {variation >= 0 ? "+" : ""}
              {variation.toFixed(1)}% vs campanha anterior
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
