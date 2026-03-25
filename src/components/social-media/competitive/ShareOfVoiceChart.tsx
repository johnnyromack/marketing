import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3 } from 'lucide-react';

interface ShareOfVoiceData {
  brand: string;
  mentions: number;
  percentage: number;
  sentiment_avg: number;
}

interface ShareOfVoiceChartProps {
  data: ShareOfVoiceData[];
  isLoading?: boolean;
  highlightBrand?: string;
  className?: string;
}

const BRAND_COLORS = [
  'bg-primary',
  'bg-blue-500',
  'bg-yellow-500',
  'bg-green-600',
  'bg-red-600',
  'bg-purple-500',
  'bg-pink-500',
  'bg-teal-500',
];

export function ShareOfVoiceChart({
  data,
  isLoading = false,
  highlightBrand,
  className = '',
}: ShareOfVoiceChartProps) {
  const maxMentions = useMemo(
    () => Math.max(...data.map(d => d.mentions), 1),
    [data]
  );

  const totalMentions = useMemo(
    () => data.reduce((sum, d) => sum + d.mentions, 0),
    [data]
  );

  if (isLoading) {
    return (
      <Card className={className} data-testid="share-of-voice-loading">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="w-5 h-5 rounded" />
            <Skeleton className="h-6 w-40" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-full rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className={className} data-testid="share-of-voice-empty">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="text-base font-semibold text-foreground">
              Share of Voice
            </h3>
          </div>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <BarChart3 className="w-12 h-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Nenhum dado disponível
            </p>
            <p className="text-xs text-muted-foreground">
              Configure marcas para monitorar
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className} data-testid="share-of-voice-chart">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4" data-testid="share-of-voice-header">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="text-base font-semibold text-foreground">
              Share of Voice
            </h3>
          </div>
          <span className="text-xs text-muted-foreground" data-testid="total-mentions">
            {totalMentions.toLocaleString('pt-BR')} mencoes totais
          </span>
        </div>

        {/* Chart */}
        <div className="space-y-4 max-h-[500px] overflow-y-auto" data-testid="share-of-voice-bars">
          {data.map((item, index) => {
            const barWidth = (item.mentions / maxMentions) * 100;
            const isHighlighted = highlightBrand === item.brand;
            const colorClass = BRAND_COLORS[index % BRAND_COLORS.length];

            return (
              <div
                key={item.brand}
                className={`transition-opacity ${
                  highlightBrand && !isHighlighted ? 'opacity-50' : ''
                }`}
                data-testid={`sov-bar-${item.brand}`}
              >
                {/* Brand info */}
                <div className="flex items-center justify-between mb-1 min-w-0">
                  <span
                    className={`text-sm truncate flex-1 min-w-0 ${
                      isHighlighted
                        ? 'font-semibold text-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {item.brand}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-semibold text-foreground">
                      {item.percentage.toFixed(1)}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({item.mentions.toLocaleString('pt-BR')})
                    </span>
                  </div>
                </div>

                {/* Bar */}
                <div className="h-8 bg-muted rounded-md overflow-hidden">
                  <div
                    className={`h-full ${colorClass} transition-all duration-500 ease-out flex items-center justify-end pr-2`}
                    style={{ width: `${barWidth}%` }}
                  >
                    {barWidth > 15 && (
                      <span className="text-xs text-white font-medium">
                        {item.percentage.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Sentiment indicator */}
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-muted-foreground">
                    Sentimento:
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      item.sentiment_avg > 0.2
                        ? 'text-green-600'
                        : item.sentiment_avg < -0.2
                        ? 'text-red-600'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {item.sentiment_avg > 0 ? '+' : ''}
                    {(item.sentiment_avg * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
