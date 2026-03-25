import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown, Square } from "lucide-react";
import { BenchmarkStatus } from "@/hooks/usePeriodMetrics";

interface BenchmarkInfo {
  status: BenchmarkStatus;
  range: string;
  invertColors?: boolean; // For metrics like CPC where lower is better
}

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  className?: string;
  benchmark?: BenchmarkInfo;
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  changeLabel, 
  icon, 
  className,
  benchmark 
}: MetricCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  const getBenchmarkIcon = (status: BenchmarkStatus) => {
    switch (status) {
      case "above":
        return <ArrowUp className="h-3 w-3" />;
      case "below":
        return <ArrowDown className="h-3 w-3" />;
      case "within":
        return <Square className="h-3 w-3 fill-current" />;
    }
  };

  const getBenchmarkColor = (status: BenchmarkStatus, invert?: boolean) => {
    // For inverted metrics (like CPC), below is good (green) and above is bad (red)
    if (invert) {
      switch (status) {
        case "above":
          return "text-red-600 dark:text-red-400"; // Above market = paying more = bad
        case "below":
          return "text-green-600 dark:text-green-400"; // Below market = paying less = good
        case "within":
          return "text-blue-600 dark:text-blue-400";
      }
    }
    // Normal metrics (like CTR), above is good, below is bad
    switch (status) {
      case "above":
        return "text-green-600 dark:text-green-400";
      case "below":
        return "text-red-600 dark:text-red-400";
      case "within":
        return "text-blue-600 dark:text-blue-400";
    }
  };

  const getBenchmarkLabel = (status: BenchmarkStatus, invert?: boolean) => {
    if (invert) {
      switch (status) {
        case "above":
          return "Acima do mercado"; // Still shows position, color indicates good/bad
        case "below":
          return "Abaixo do mercado";
        case "within":
          return "Dentro do mercado";
      }
    }
    switch (status) {
      case "above":
        return "Acima do mercado";
      case "below":
        return "Abaixo do mercado";
      case "within":
        return "Dentro do mercado";
    }
  };

  return (
    <Card className={cn("transition-shadow hover:shadow-md", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground truncate">{title}</p>
            <p className="text-xl font-bold tracking-tight">{value}</p>
            
            {/* Period comparison */}
            {change !== undefined && (
              <div className="flex items-center gap-1 text-xs">
                {isPositive && <TrendingUp className="h-3 w-3 text-success flex-shrink-0" />}
                {isNegative && <TrendingDown className="h-3 w-3 text-danger flex-shrink-0" />}
                {!isPositive && !isNegative && <Minus className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
                <span
                  className={cn(
                    "font-medium",
                    isPositive && "text-success",
                    isNegative && "text-danger",
                    !isPositive && !isNegative && "text-muted-foreground"
                  )}
                >
                  {isPositive && "+"}
                  {change.toFixed(1)}%
                </span>
                {changeLabel && <span className="text-muted-foreground truncate">{changeLabel}</span>}
              </div>
            )}
            
            {/* Benchmark comparison */}
            {benchmark && (
              <div className={cn("flex items-center gap-1 text-xs mt-1", getBenchmarkColor(benchmark.status, benchmark.invertColors))}>
                {getBenchmarkIcon(benchmark.status)}
                <span className="font-medium truncate">
                  {getBenchmarkLabel(benchmark.status, benchmark.invertColors)}
                </span>
                <span className="text-muted-foreground truncate">
                  ({benchmark.range})
                </span>
              </div>
            )}
          </div>
          
          {icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0 ml-2">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
