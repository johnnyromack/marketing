import { MessageSquare, TrendingUp, AlertTriangle, Calendar, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { StatsCardsProps } from './types';

export function StatsCards({ className, stats, isLoading }: StatsCardsProps) {
  const statItems = [
    {
      title: 'Mencoes Hoje',
      value: stats?.mentions.today ?? 0,
      change: stats?.mentions.change ?? 0,
      icon: MessageSquare,
    },
    {
      title: 'Sentimento Medio',
      value: stats?.sentiment.average !== undefined
        ? `${(stats.sentiment.average * 100).toFixed(0)}%`
        : '—',
      change: stats?.sentiment.change ?? 0,
      icon: TrendingUp,
    },
    {
      title: 'Alertas Ativos',
      value: stats?.alerts.active ?? 0,
      change: 0,
      icon: AlertTriangle,
    },
    {
      title: 'Posts Agendados',
      value: stats?.posts.scheduled ?? 0,
      change: 0,
      icon: Calendar,
    },
  ];

  return (
    <div className={className}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statItems.map((stat) => {
          const TrendIcon = stat.change > 0 ? TrendingUp : stat.change < 0 ? TrendingDown : Minus;
          const trendColor = stat.change > 0 ? 'text-green-600' : stat.change < 0 ? 'text-red-600' : 'text-muted-foreground';
          return (
            <Card key={stat.title}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{stat.title}</span>
                  <stat.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-bold text-foreground">
                    {isLoading ? '...' : String(stat.value)}
                  </span>
                  {stat.change !== 0 && (
                    <span className={`flex items-center gap-0.5 text-xs ${trendColor}`}>
                      <TrendIcon className="w-3 h-3" />
                      {stat.change > 0 ? '+' : ''}{stat.change}%
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
