import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface BrandSentiment {
  brand: string;
  positive: number;
  neutral: number;
  negative: number;
  total: number;
}

interface SentimentComparisonProps {
  data: BrandSentiment[];
  isLoading?: boolean;
  className?: string;
}

export function SentimentComparison({
  data,
  isLoading = false,
  className = '',
}: SentimentComparisonProps) {
  if (isLoading) {
    return (
      <Card className={className} data-testid="sentiment-comparison-loading">
        <CardContent className="p-4">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-full rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className={className} data-testid="sentiment-comparison-empty">
        <CardContent className="p-4">
          <h3 className="text-base font-semibold text-foreground mb-4">
            Comparação de Sentimento
          </h3>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <TrendingUp className="w-12 h-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Sem dados de sentimento
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className} data-testid="sentiment-comparison-chart">
      <CardContent className="p-4">
        <h3 className="text-base font-semibold text-foreground mb-4">
          Comparação de Sentimento
        </h3>

        <div className="space-y-4" data-testid="sentiment-bars">
          {data.map(item => {
            const positivePercent = item.total > 0 ? (item.positive / item.total) * 100 : 0;
            const neutralPercent = item.total > 0 ? (item.neutral / item.total) * 100 : 0;
            const negativePercent = item.total > 0 ? (item.negative / item.total) * 100 : 0;

            // Determine overall sentiment trend
            const netSentiment = positivePercent - negativePercent;
            const TrendIcon =
              netSentiment > 10 ? TrendingUp : netSentiment < -10 ? TrendingDown : Minus;
            const trendColor =
              netSentiment > 10
                ? 'text-green-600'
                : netSentiment < -10
                ? 'text-red-600'
                : 'text-muted-foreground';

            return (
              <div key={item.brand} data-testid={`sentiment-bar-${item.brand}`}>
                {/* Brand header */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">
                    {item.brand}
                  </span>
                  <div className="flex items-center gap-1">
                    <TrendIcon className={`w-4 h-4 ${trendColor}`} />
                    <span className={`text-xs ${trendColor}`}>
                      {netSentiment > 0 ? '+' : ''}{netSentiment.toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Stacked bar */}
                <div className="h-6 flex rounded-md overflow-hidden">
                  {positivePercent > 0 && (
                    <div
                      className="bg-green-600 flex items-center justify-center transition-all"
                      style={{ width: `${positivePercent}%` }}
                      title={`Positivo: ${positivePercent.toFixed(1)}%`}
                    >
                      {positivePercent > 15 && (
                        <span className="text-[10px] text-white font-medium">
                          {positivePercent.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  )}
                  {neutralPercent > 0 && (
                    <div
                      className="bg-muted-foreground/30 flex items-center justify-center transition-all"
                      style={{ width: `${neutralPercent}%` }}
                      title={`Neutro: ${neutralPercent.toFixed(1)}%`}
                    >
                      {neutralPercent > 15 && (
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {neutralPercent.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  )}
                  {negativePercent > 0 && (
                    <div
                      className="bg-red-600 flex items-center justify-center transition-all"
                      style={{ width: `${negativePercent}%` }}
                      title={`Negativo: ${negativePercent.toFixed(1)}%`}
                    >
                      {negativePercent > 15 && (
                        <span className="text-[10px] text-white font-medium">
                          {negativePercent.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 mt-1 text-xs">
                  <span className="text-green-600">
                    {item.positive} positivas
                  </span>
                  <span className="text-muted-foreground">
                    {item.neutral} neutras
                  </span>
                  <span className="text-red-600">
                    {item.negative} negativas
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-2 border-t border-border" data-testid="sentiment-legend">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-green-600" />
            <span className="text-xs text-muted-foreground">
              Positivo
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-muted-foreground/30" />
            <span className="text-xs text-muted-foreground">
              Neutro
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-red-600" />
            <span className="text-xs text-muted-foreground">
              Negativo
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
