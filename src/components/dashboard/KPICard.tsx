import { Card, CardContent } from '@/components/ui/card';
import { KPIData } from '@/types/publicidade';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
interface KPICardProps {
  data: KPIData;
  icon: React.ReactNode;
}
const formatValue = (value: number, format?: string, prefix?: string, label?: string) => {
  // Show "—" for CPL Produtivo when value is 0 (no data available)
  if (label?.includes('CPL Produtivo') && value === 0) {
    return '—';
  }
  if (format === 'currency') {
    return `${prefix || ''}${value.toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  }
  return value.toLocaleString('pt-BR');
};
// Helper to safely calculate percentage variation
const safeVariation = (value: number, base: number): number | null => {
  if (!base || base === 0 || !isFinite(value) || !isFinite(base)) return null;
  const result = ((value - base) / base) * 100;
  return isFinite(result) ? result : null;
};

// Helper to format variation for display
const formatVariation = (variation: number | null): string => {
  if (variation === null) return '—';
  return `${variation > 0 ? '+' : ''}${variation.toFixed(1)}%`;
};

export const KPICard = ({
  data,
  icon
}: KPICardProps) => {
  const variation = safeVariation(data.value, data.orcado);
  const variationCA = safeVariation(data.value, data.ca);

  // For costs (CAC, CPL), lower is better
  const isCostMetric = data.label.includes('CAC') || data.label.includes('CPL');
  const isPositive = variation !== null && (isCostMetric ? variation < 0 : variation > 0);
  const isNeutral = variation === null || Math.abs(variation) < 2;
  return <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">{data.label}</p>
            <p className="text-2xl font-bold text-foreground">
              {formatValue(data.value, data.format, data.prefix, data.label)}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
        
        <div className="mt-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            {isNeutral ? <Minus className="h-3.5 w-3.5 text-muted-foreground" /> : isPositive ? <TrendingUp className="h-3.5 w-3.5 text-success" /> : <TrendingDown className="h-3.5 w-3.5 text-destructive" />}
            <span className={cn('font-medium', isNeutral ? 'text-muted-foreground' : isPositive ? 'text-success' : 'text-destructive')}>
              {formatVariation(variation)}
            </span>
            <span className="text-muted-foreground">vs Orçado</span>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <span>C.A.: </span>
          <span className={cn('font-medium', variationCA === null ? 'text-muted-foreground' : variationCA > 0 ? 'text-success' : 'text-destructive')}>
            {formatVariation(variationCA)}
          </span>
        </div>
      </CardContent>
    </Card>;
};