import { Suspense } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import {
  BarChart3,
  RefreshCw,
  TrendingUp,
  Users,
  MessageSquare,
  Activity,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import {
  HealthScoreCard,
  HealthScoreCardSkeleton,
  ReportGenerator,
  TrendChart,
  TrendChartSkeleton,
  SentimentBadge,
} from '@/components/social-media';
import { useSocialMediaAnalytics } from '@/hooks/social-media';

interface DashboardData {
  overview: {
    total_mentions: number;
    total_reach: number;
    avg_sentiment: number;
    engagement_rate: number;
    period_comparison: {
      mentions_change_pct: number;
      reach_change_pct: number;
      sentiment_change_pct: number;
      engagement_change_pct: number;
    };
  };
  sentiment_distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  platform_breakdown: Array<{
    platform: string;
    mentions: number;
    reach: number;
    engagement: number;
    sentiment: number;
  }>;
  mentions_trend: Array<{
    date: string;
    mentions: number;
    reach: number;
  }>;
  top_topics: Array<{
    name: string;
    mentions: number;
    sentiment: number;
    trend: 'rising' | 'stable' | 'falling';
  }>;
  alerts: Array<{
    id: string;
    type: 'spike' | 'crisis' | 'opportunity';
    severity: 'low' | 'medium' | 'high';
    message: string;
    created_at: string;
  }>;
  health_score: {
    overall: number;
    components: {
      sentiment: number;
      reach: number;
      engagement: number;
      response_time: number;
    };
  };
}

/**
 * Platform Breakdown Table
 */
function PlatformBreakdown({
  data,
  isLoading,
}: {
  data: DashboardData['platform_breakdown'];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] p-4">
        <div className="animate-pulse">
          <div className="mb-4 h-5 w-32 rounded bg-[var(--qi-bg-secondary)]" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="mb-2 h-12 rounded bg-[var(--qi-bg-secondary)]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] p-4">
      <h3 className="mb-[var(--qi-spacing-md)] font-[var(--qi-font-weight-semibold)] text-[var(--qi-font-size-body-md)] text-[var(--qi-text-primary)]">
        Desempenho por Plataforma
      </h3>
      <div className="max-h-[400px] overflow-x-auto overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-[var(--qi-surface)]">
            <tr className="border-b border-[var(--qi-border)] text-left text-[var(--qi-font-size-caption)] text-[var(--qi-text-tertiary)]">
              <th className="pb-2">Plataforma</th>
              <th className="pb-2 text-right">Mencoes</th>
              <th className="pb-2 text-right">Alcance</th>
              <th className="pb-2 text-right">Engajamento</th>
              <th className="pb-2 text-right">Sentimento</th>
            </tr>
          </thead>
          <tbody>
            {data.map((platform) => (
              <tr
                key={platform.platform}
                className="border-b border-[var(--qi-border)] last:border-0"
              >
                <td className="py-3">
                  <span className="block truncate font-[var(--qi-font-weight-medium)] capitalize text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-primary)]">
                    {platform.platform.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-3 text-right text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]">
                  {platform.mentions.toLocaleString('pt-BR')}
                </td>
                <td className="py-3 text-right text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]">
                  {(platform.reach / 1000).toFixed(1)}k
                </td>
                <td className="py-3 text-right text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]">
                  {platform.engagement.toFixed(1)}%
                </td>
                <td className="py-3 text-right">
                  <SentimentBadge
                    sentiment={
                      platform.sentiment > 0.2
                        ? 'positive'
                        : platform.sentiment < -0.2
                          ? 'negative'
                          : 'neutral'
                    }
                    size="sm"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Alerts Panel
 */
function AlertsPanel({
  alerts,
  isLoading,
}: {
  alerts: DashboardData['alerts'];
  isLoading: boolean;
}) {
  const ALERT_CONFIG = {
    spike: { icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    crisis: { icon: AlertTriangle, color: 'text-semantic-error', bg: 'bg-semantic-error/10' },
    opportunity: { icon: Activity, color: 'text-semantic-success', bg: 'bg-semantic-success/10' },
  };

  if (isLoading) {
    return (
      <div className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] p-4">
        <div className="animate-pulse">
          <div className="mb-4 h-5 w-24 rounded bg-[var(--qi-bg-secondary)]" />
          {[1, 2].map((i) => (
            <div key={i} className="mb-2 h-16 rounded bg-[var(--qi-bg-secondary)]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] p-4">
      <h3 className="mb-[var(--qi-spacing-md)] font-[var(--qi-font-weight-semibold)] text-[var(--qi-font-size-body-md)] text-[var(--qi-text-primary)]">
        Alertas Recentes
      </h3>
      {alerts.length === 0 ? (
        <div className="py-6 text-center">
          <Activity className="mx-auto mb-2 h-8 w-8 text-[var(--qi-text-tertiary)]" />
          <p className="text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]">
            Nenhum alerta no momento
          </p>
        </div>
      ) : (
        <div className="max-h-[400px] space-y-2 overflow-y-auto">
          {alerts.map((alert) => {
            const config = ALERT_CONFIG[alert.type];
            const Icon = config.icon;

            return (
              <div
                key={alert.id}
                className={`flex items-start gap-3 rounded-[var(--qi-radius-sm)] p-3 ${config.bg} min-w-0`}
              >
                <Icon className={`mt-0.5 h-5 w-5 ${config.color} flex-shrink-0`} />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-primary)]">
                    {alert.message}
                  </p>
                  <span className="text-[var(--qi-font-size-caption)] text-[var(--qi-text-tertiary)]">
                    {new Date(alert.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Analytics Page
 */
export default function AnalyticsPage() {
  const { isLoading: isLoadingUser } = useAuth();
  const { user } = useAuth(); const businessUnitId = user?.id;

  const { data, isLoading, refresh } = useSocialMediaAnalytics({
    businessUnitId: businessUnitId || null,
  });

  // Transform mentions trend for chart
  const mentionsTrendData =
    data?.mentions_trend.map((d) => ({
      date: d.date,
      value: d.mentions,
    })) || [];

  // Show loading state while user is being fetched
  if (isLoadingUser) {
    return (
      <AppLayout>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--qi-accent)]" />
          </div>
        </div>
      </AppLayout>
    );
  }

  // Show message if no business unit is set
  if (!businessUnitId) {
    return (
      <AppLayout>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <BarChart3 className="mb-4 h-12 w-12 text-[var(--qi-text-tertiary)]" />
            <h2 className="mb-2 font-[var(--qi-font-weight-semibold)] text-[var(--qi-font-size-body-lg)] text-[var(--qi-text-primary)]">
              Unidade de Negocio Não Configurada
            </h2>
            <p className="text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]">
              Configure sua unidade de negocio para ver as métricas de social media
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-6" data-testid="analytics-page">
        {/* Header */}
        <div className="mb-[var(--qi-spacing-lg)] flex flex-col gap-[var(--qi-spacing-md)] md:flex-row md:items-center md:justify-between">
          <PageHeader
            title="Analytics"
            description="Dashboard avancado com métricas e insights"
          />
          <div className="flex items-center gap-[var(--qi-spacing-sm)]">
            <button
              onClick={refresh}
              disabled={isLoading}
              data-testid="btn-refresh-analytics"
              className="flex items-center gap-2 rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] px-[var(--qi-spacing-md)] py-[var(--qi-spacing-sm)] text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)] transition-colors hover:bg-[var(--qi-bg-secondary)] disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>

        {/* Stats overview */}
        <div
          className="mb-[var(--qi-spacing-lg)] grid grid-cols-2 gap-[var(--qi-spacing-md)] md:grid-cols-4"
          data-testid="analytics-stats-grid"
        >
          {[
            {
              title: 'Mencoes Totais',
              value: data?.overview.total_mentions.toLocaleString('pt-BR') || '0',
              icon: MessageSquare,
              testId: 'stat-mentions',
            },
            {
              title: 'Alcance Total',
              value: data?.overview.total_reach
                ? `${(data.overview.total_reach / 1000000).toFixed(2)}M`
                : '0',
              icon: Users,
              testId: 'stat-reach',
            },
            {
              title: 'Sentimento Medio',
              value: data?.overview.avg_sentiment
                ? `${(data.overview.avg_sentiment * 100).toFixed(0)}%`
                : '0%',
              icon: Activity,
              testId: 'stat-sentiment',
            },
            {
              title: 'Engajamento',
              value: data?.overview.engagement_rate
                ? `${data.overview.engagement_rate.toFixed(1)}%`
                : '0%',
              icon: BarChart3,
              testId: 'stat-engagement',
            },
          ].map(({ title, value, icon: Icon, testId }) => (
            <div
              key={testId}
              data-testid={testId}
              className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] p-4"
            >
              <div className="mb-2 flex items-center gap-2 text-[var(--qi-text-tertiary)]">
                <Icon className="h-4 w-4" />
                <span className="text-[var(--qi-font-size-caption)]">{title}</span>
              </div>
              <p className="text-2xl font-bold text-[var(--qi-text-primary)]">{value}</p>
            </div>
          ))}
        </div>

        {/* Main content grid */}
        <div
          className="mb-[var(--qi-spacing-lg)] grid grid-cols-1 gap-[var(--qi-spacing-md)] lg:grid-cols-3"
          data-testid="analytics-main-grid"
        >
          {/* Health Score */}
          <div className="lg:col-span-1" data-testid="health-score-section">
            {isLoading || !data ? (
              <HealthScoreCardSkeleton />
            ) : (
              <HealthScoreCard score={data.health_score} />
            )}
          </div>

          {/* Mentions Trend */}
          <div className="lg:col-span-2" data-testid="trend-chart-section">
            {isLoading ? (
              <TrendChartSkeleton />
            ) : (
              <TrendChart
                title="Tendencia de Mencoes"
                data={mentionsTrendData}
                valueLabel="mencoes"
                color="accent"
              />
            )}
          </div>
        </div>

        {/* Platform breakdown and Alerts */}
        <div
          className="mb-[var(--qi-spacing-lg)] grid grid-cols-1 gap-[var(--qi-spacing-md)] lg:grid-cols-2"
          data-testid="analytics-details-grid"
        >
          <div data-testid="platform-breakdown-section">
            <PlatformBreakdown data={data?.platform_breakdown || []} isLoading={isLoading} />
          </div>
          <div data-testid="alerts-panel-section">
            <AlertsPanel alerts={data?.alerts || []} isLoading={isLoading} />
          </div>
        </div>

        {/* Report Generator */}
        <div data-testid="report-generator-section">
          <Suspense
            fallback={
              <div className="animate-pulse">
                <div
                  className="h-48 rounded-lg"
                  style={{ backgroundColor: 'var(--qi-bg-tertiary)' }}
                />
              </div>
            }
          >
            <ReportGenerator businessUnitId={businessUnitId} />
          </Suspense>
        </div>
      </div>
    </AppLayout>
  );
}
