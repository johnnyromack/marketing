import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrendDataPoint {
  date: string;
  value: number;
  label?: string;
}

interface TrendChartProps {
  title: string;
  data: TrendDataPoint[];
  valueLabel?: string;
  isLoading?: boolean;
  showChange?: boolean;
  color?: 'accent' | 'success' | 'warning' | 'error';
  className?: string;
}

const COLORS = {
  accent: 'bg-primary',
  success: 'bg-green-600',
  warning: 'bg-yellow-500',
  error: 'bg-red-600',
};

export function TrendChart({
  title,
  data,
  valueLabel = '',
  isLoading = false,
  showChange = true,
  color = 'accent',
  className = '',
}: TrendChartProps) {
  const stats = useMemo(() => {
    if (data.length === 0) return null;

    const values = data.map(d => d.value);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const latest = values[values.length - 1];
    const previous = values.length > 1 ? values[values.length - 2] : latest;
    const change = previous !== 0 ? ((latest - previous) / previous) * 100 : 0;
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;

    return { max, min, latest, change, avg, sum };
  }, [data]);

  if (isLoading) {
    return <TrendChartSkeleton className={className} />;
  }

  if (!stats) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <h4 className="text-sm font-medium text-foreground mb-4">
            {title}
          </h4>
          <div className="h-24 flex items-center justify-center text-muted-foreground">
            Sem dados
          </div>
        </CardContent>
      </Card>
    );
  }

  const TrendIcon = stats.change > 0 ? TrendingUp : stats.change < 0 ? TrendingDown : Minus;
  const trendColor = stats.change > 0 ? 'text-green-600' : stats.change < 0 ? 'text-red-600' : 'text-muted-foreground';

  return (
    <Card className={className} data-testid="trend-chart">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="text-sm font-medium text-foreground" data-testid="trend-chart-title">
              {title}
            </h4>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-foreground" data-testid="trend-chart-value">
                {stats.latest.toLocaleString('pt-BR')}
              </span>
              {valueLabel && (
                <span className="text-xs text-muted-foreground">
                  {valueLabel}
                </span>
              )}
            </div>
          </div>

          {showChange && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${stats.change > 0 ? 'bg-green-600/10' : stats.change < 0 ? 'bg-red-600/10' : 'bg-muted'}`} data-testid="trend-chart-change">
              <TrendIcon className={`w-3.5 h-3.5 ${trendColor}`} />
              <span className={`text-xs font-medium ${trendColor}`}>
                {Math.abs(stats.change).toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="h-20 flex items-end gap-1" data-testid="trend-chart-bars">
          {data.map((point, idx) => {
            const height = stats.max > 0 ? (point.value / stats.max) * 100 : 0;
            const isLast = idx === data.length - 1;

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center group relative"
              >
                <div
                  className={`w-full rounded-t-sm transition-all ${COLORS[color]} ${isLast ? 'opacity-100' : 'opacity-40'} group-hover:opacity-100`}
                  style={{ height: `${Math.max(height, 4)}%` }}
                />

                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                  <div className="px-2 py-1 rounded bg-card shadow-lg border border-border text-xs whitespace-nowrap">
                    <div className="font-medium">{point.value.toLocaleString('pt-BR')}</div>
                    <div className="text-muted-foreground">
                      {new Date(point.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer stats */}
        <div className="flex justify-between mt-3 pt-3 border-t border-border" data-testid="trend-chart-stats">
          <div className="text-center" data-testid="trend-stat-min">
            <span className="block text-xs text-muted-foreground">Min</span>
            <span className="text-sm font-medium text-foreground">
              {stats.min.toLocaleString('pt-BR')}
            </span>
          </div>
          <div className="text-center" data-testid="trend-stat-avg">
            <span className="block text-xs text-muted-foreground">Media</span>
            <span className="text-sm font-medium text-foreground">
              {Math.round(stats.avg).toLocaleString('pt-BR')}
            </span>
          </div>
          <div className="text-center" data-testid="trend-stat-max">
            <span className="block text-xs text-muted-foreground">Max</span>
            <span className="text-sm font-medium text-foreground">
              {stats.max.toLocaleString('pt-BR')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TrendChartSkeleton({ className = '' }: { className?: string }) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex justify-between mb-4">
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="h-20 flex items-end gap-1">
          {Array.from({ length: 14 }).map((_, i) => (
            <Skeleton
              key={i}
              className="flex-1 rounded-t-sm"
              style={{ height: `${((i * 7 + 20) % 60) + 20}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-3 pt-3 border-t border-border">
          {[1, 2, 3].map(i => (
            <div key={i} className="text-center">
              <Skeleton className="h-3 w-8 mx-auto mb-1" />
              <Skeleton className="h-4 w-12 mx-auto" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
