import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type TrendDirection = 'rising' | 'stable' | 'falling';

interface TrendIndicatorProps {
  trend: TrendDirection | null;
  value?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const TREND_CONFIG: Record<
  TrendDirection,
  { icon: typeof TrendingUp; label: string; color: string; bgColor: string }
> = {
  rising: {
    icon: TrendingUp,
    label: 'Em alta',
    color: 'text-green-600',
    bgColor: 'bg-green-600/10',
  },
  stable: {
    icon: Minus,
    label: 'Estavel',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
  falling: {
    icon: TrendingDown,
    label: 'Em queda',
    color: 'text-red-600',
    bgColor: 'bg-red-600/10',
  },
};

export function TrendIndicator({
  trend,
  value,
  showLabel = false,
  size = 'md',
  className = '',
}: TrendIndicatorProps) {
  if (!trend) return null;

  const config = TREND_CONFIG[trend];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
  };

  if (showLabel) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color} ${className}`}
      >
        <Icon className={sizeClasses[size]} />
        {config.label}
        {value !== undefined && (
          <span>
            ({value > 0 ? '+' : ''}{value}%)
          </span>
        )}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-0.5 ${config.color} ${className}`}>
      <Icon className={sizeClasses[size]} />
      {value !== undefined && (
        <span className="text-xs">
          {value > 0 ? '+' : ''}{value}%
        </span>
      )}
    </span>
  );
}
