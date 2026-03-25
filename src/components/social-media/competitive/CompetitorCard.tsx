import { TrendingUp, TrendingDown, Minus, BarChart2, MessageSquare, ThumbsUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface CompetitorData {
  brand: string;
  mentions: number;
  shareOfVoice: number;
  sentimentAvg: number;
  trend: 'up' | 'down' | 'stable';
  trendValue?: number;
}

interface CompetitorCardProps {
  competitor: CompetitorData;
  isOwnBrand?: boolean;
  onClick?: () => void;
  className?: string;
}

export function CompetitorCard({
  competitor,
  isOwnBrand = false,
  onClick,
  className = '',
}: CompetitorCardProps) {
  const TrendIcon =
    competitor.trend === 'up'
      ? TrendingUp
      : competitor.trend === 'down'
      ? TrendingDown
      : Minus;

  const trendColor =
    competitor.trend === 'up'
      ? 'text-green-600'
      : competitor.trend === 'down'
      ? 'text-red-600'
      : 'text-muted-foreground';

  const sentimentColor =
    competitor.sentimentAvg > 0.2
      ? 'text-green-600'
      : competitor.sentimentAvg < -0.2
      ? 'text-red-600'
      : 'text-muted-foreground';

  return (
    <Card
      onClick={onClick}
      className={`
        ${onClick ? 'cursor-pointer hover:border-primary transition-colors' : ''}
        ${isOwnBrand ? 'ring-2 ring-primary' : ''}
        ${className}
      `}
      data-testid={`competitor-card-${competitor.brand}`}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2" data-testid="competitor-header">
          <div className="flex items-center gap-2">
            <h4 className="text-base font-semibold text-foreground">
              {competitor.brand}
            </h4>
            {isOwnBrand && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded">
                Sua marca
              </span>
            )}
          </div>
          <div className={`flex items-center gap-1 ${trendColor}`}>
            <TrendIcon className="w-4 h-4" />
            {competitor.trendValue !== undefined && (
              <span className="text-xs">
                {competitor.trendValue > 0 ? '+' : ''}
                {competitor.trendValue}%
              </span>
            )}
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2" data-testid="competitor-metrics">
          {/* Mentions */}
          <div className="flex flex-col items-center p-2 rounded-md bg-muted" data-testid="metric-mentions">
            <MessageSquare className="w-4 h-4 text-muted-foreground mb-1" />
            <span className="text-base font-semibold text-foreground" data-testid="mentions-value">
              {competitor.mentions.toLocaleString('pt-BR')}
            </span>
            <span className="text-[10px] text-muted-foreground">mencoes</span>
          </div>

          {/* Share of Voice */}
          <div className="flex flex-col items-center p-2 rounded-md bg-muted" data-testid="metric-share">
            <BarChart2 className="w-4 h-4 text-muted-foreground mb-1" />
            <span className="text-base font-semibold text-foreground" data-testid="share-value">
              {competitor.shareOfVoice.toFixed(1)}%
            </span>
            <span className="text-[10px] text-muted-foreground">share</span>
          </div>

          {/* Sentiment */}
          <div className="flex flex-col items-center p-2 rounded-md bg-muted" data-testid="metric-sentiment">
            <ThumbsUp className={`w-4 h-4 ${sentimentColor} mb-1`} />
            <span className={`text-base font-semibold ${sentimentColor}`} data-testid="sentiment-value">
              {competitor.sentimentAvg > 0 ? '+' : ''}
              {(competitor.sentimentAvg * 100).toFixed(0)}%
            </span>
            <span className="text-[10px] text-muted-foreground">sentimento</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CompetitorCardSkeleton() {
  return (
    <Card className="animate-pulse" data-testid="competitor-card-skeleton">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-2 rounded-md bg-muted">
              <Skeleton className="w-4 h-4 rounded-full mx-auto mb-1" />
              <Skeleton className="h-5 w-12 mx-auto mb-1" />
              <Skeleton className="h-3 w-10 mx-auto" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
