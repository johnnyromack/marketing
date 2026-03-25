import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Calendar, BarChart3, RefreshCw } from 'lucide-react';
import {
  ShareOfVoiceChart,
  SentimentComparison,
  CompetitorCard,
  CompetitorCardSkeleton,
} from '@/components/social-media';

interface ShareOfVoiceData {
  brand: string;
  mentions: number;
  percentage: number;
  sentiment_avg: number;
}

interface TrendData {
  date: string;
  brand: string;
  mentions: number;
}

/**
 * Date Range Picker
 */
function DateRangePicker({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}) {
  const presets = [
    { label: '7 dias', days: 7 },
    { label: '30 dias', days: 30 },
    { label: '90 dias', days: 90 },
  ];

  const setPreset = (days: number) => {
    const now = new Date();
    const fromDate = new Date(now);
    fromDate.setDate(fromDate.getDate() - days);
    onChange(fromDate.toISOString().split('T')[0], now.toISOString().split('T')[0]);
  };

  return (
    <div className="flex items-center gap-[var(--qi-spacing-sm)]" data-testid="date-range-picker">
      <Calendar className="h-4 w-4 text-[var(--qi-text-tertiary)]" />
      <div
        className="flex items-center gap-1 rounded-[var(--qi-radius-md)] bg-[var(--qi-bg-secondary)] p-1"
        data-testid="date-presets"
      >
        {presets.map((preset) => (
          <button
            key={preset.days}
            onClick={() => setPreset(preset.days)}
            className="rounded-[var(--qi-radius-sm)] px-3 py-1.5 text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)] transition-colors hover:bg-[var(--qi-surface)] hover:text-[var(--qi-text-primary)]"
            data-testid={`btn-preset-${preset.days}d`}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <span
        className="text-[var(--qi-font-size-caption)] text-[var(--qi-text-tertiary)]"
        data-testid="date-range-display"
      >
        {from} - {to}
      </span>
    </div>
  );
}

/**
 * Brands Manager
 */
function BrandsManager({
  brands,
  onAdd,
  onRemove,
}: {
  brands: string[];
  onAdd: (brand: string) => void;
  onRemove: (brand: string) => void;
}) {
  const [newBrand, setNewBrand] = useState('');

  const handleAdd = () => {
    if (newBrand.trim() && !brands.includes(newBrand.trim())) {
      onAdd(newBrand.trim());
      setNewBrand('');
    }
  };

  return (
    <div
      className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] p-4"
      data-testid="brands-manager-card"
    >
      <h3 className="mb-[var(--qi-spacing-md)] font-[var(--qi-font-weight-semibold)] text-[var(--qi-font-size-body-md)] text-[var(--qi-text-primary)]">
        Marcas Monitoradas
      </h3>
      <div
        className="mb-[var(--qi-spacing-md)] flex max-h-[200px] flex-wrap gap-2 overflow-y-auto"
        data-testid="tracked-brands-list"
      >
        {brands.map((brand) => (
          <span
            key={brand}
            className="bg-[var(--qi-accent)]/10 inline-flex max-w-full items-center gap-1 rounded-full px-3 py-1.5 text-[var(--qi-accent)] text-[var(--qi-font-size-body-sm)]"
            data-testid={`brand-tag-${brand}`}
          >
            <span className="truncate">{brand}</span>
            <button
              onClick={() => onRemove(brand)}
              className="hover:bg-[var(--qi-accent)]/20 ml-1 flex-shrink-0 rounded-full p-0.5"
              data-testid={`btn-remove-brand-${brand}`}
            >
              <span className="sr-only">Remover</span>×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2" data-testid="add-brand-form">
        <input
          value={newBrand}
          onChange={(e) => setNewBrand(e.target.value)}
          placeholder="Adicionar marca..."
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="flex-1 rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] px-3 py-2 text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-primary)] outline-none focus:border-[var(--qi-accent)]"
          data-testid="input-new-brand"
        />
        <button
          onClick={handleAdd}
          className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] p-2 transition-colors hover:bg-[var(--qi-bg-secondary)]"
          data-testid="btn-add-brand"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Competitive Intelligence Page
 */
export default function CompetitivePage() {
  const { user } = useAuth(); const businessUnitId = user?.id;

  const [shareOfVoice, setShareOfVoice] = useState<ShareOfVoiceData[]>([]);
  const [_trend, setTrend] = useState<TrendData[]>([]);
  const [trackedBrands, setTrackedBrands] = useState<string[]>([
    'raiz',
    'competitor1',
    'competitor2',
  ]);
  const [isLoading, setIsLoading] = useState(true);

  // Date range
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(now.toISOString().split('T')[0]);

  // Fetch competitive data
  const fetchData = useCallback(async () => {
    if (!businessUnitId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        business_unit_id: businessUnitId,
        brands: trackedBrands.join(','),
        from: new Date(dateFrom).toISOString(),
        to: new Date(dateTo).toISOString(),
      });

      const res = await fetch(`/api/social-media/analytics/competitive?${params}`);
      const data = await res.json();

      if (data.success) {
        setShareOfVoice(data.data.shareOfVoice || []);
        setTrend(data.data.trend || []);
      }
    } catch (error) {
      console.error('Error fetching competitive data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [businessUnitId, trackedBrands, dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Transform data for sentiment comparison
  const sentimentData = shareOfVoice.map((item) => ({
    brand: item.brand,
    positive: Math.round(item.mentions * (item.sentiment_avg > 0 ? item.sentiment_avg : 0)),
    neutral: Math.round(item.mentions * (1 - Math.abs(item.sentiment_avg))),
    negative: Math.round(
      item.mentions * (item.sentiment_avg < 0 ? Math.abs(item.sentiment_avg) : 0)
    ),
    total: item.mentions,
  }));

  // Transform data for competitor cards
  const competitorData = shareOfVoice.map((item) => ({
    brand: item.brand,
    mentions: item.mentions,
    shareOfVoice: item.percentage,
    sentimentAvg: item.sentiment_avg,
    trend: (item.percentage > 20 ? 'up' : item.percentage < 10 ? 'down' : 'stable') as 'up' | 'down' | 'stable',
    trendValue: Math.round((Math.random() - 0.5) * 20),
  }));

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-6" data-testid="competitive-page">
        {/* Header */}
        <div
          className="mb-[var(--qi-spacing-lg)] flex flex-col gap-[var(--qi-spacing-md)] md:flex-row md:items-center md:justify-between"
          data-testid="competitive-header"
        >
          <PageHeader
            title="Competitive Intelligence"
            description="Análise o share of voice e compare sua marca com concorrentes"
          />
          <button
            onClick={fetchData}
            disabled={isLoading}
            data-testid="btn-refresh"
            className="flex items-center gap-2 rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] px-[var(--qi-spacing-md)] py-[var(--qi-spacing-sm)] text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)] transition-colors hover:bg-[var(--qi-bg-secondary)] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {/* Date range picker */}
        <div className="mb-[var(--qi-spacing-lg)]" data-testid="date-range-section">
          <DateRangePicker
            from={dateFrom}
            to={dateTo}
            onChange={(from, to) => {
              setDateFrom(from);
              setDateTo(to);
            }}
          />
        </div>

        {/* Main content */}
        <div
          className="mb-[var(--qi-spacing-lg)] grid grid-cols-1 gap-[var(--qi-spacing-md)] lg:grid-cols-3"
          data-testid="main-content-grid"
        >
          {/* Share of Voice Chart - 2 cols */}
          <div className="lg:col-span-2" data-testid="share-of-voice-section">
            <ShareOfVoiceChart data={shareOfVoice} isLoading={isLoading} highlightBrand="raiz" />
          </div>

          {/* Brands Manager - 1 col */}
          <div data-testid="brands-manager-section">
            <BrandsManager
              brands={trackedBrands}
              onAdd={(brand) => setTrackedBrands([...trackedBrands, brand])}
              onRemove={(brand) => setTrackedBrands(trackedBrands.filter((b) => b !== brand))}
            />
          </div>
        </div>

        {/* Sentiment comparison */}
        <div className="mb-[var(--qi-spacing-lg)]" data-testid="sentiment-comparison-section">
          <SentimentComparison data={sentimentData} isLoading={isLoading} />
        </div>

        {/* Competitor cards */}
        <div data-testid="competitor-cards-section">
          <h2 className="mb-[var(--qi-spacing-md)] font-[var(--qi-font-weight-semibold)] text-[var(--qi-font-size-body-lg)] text-[var(--qi-text-primary)]">
            Resumo por Marca
          </h2>
          {isLoading ? (
            <div
              className="grid grid-cols-1 gap-[var(--qi-spacing-md)] md:grid-cols-2 lg:grid-cols-3"
              data-testid="competitor-cards-loading"
            >
              {[1, 2, 3].map((i) => (
                <CompetitorCardSkeleton key={i} />
              ))}
            </div>
          ) : competitorData.length === 0 ? (
            <div
              className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] p-4"
              data-testid="empty-state"
            >
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <BarChart3 className="mb-2 h-12 w-12 text-[var(--qi-text-tertiary)]" />
                <p className="text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]">
                  Nenhum dado disponível
                </p>
                <p className="text-[var(--qi-font-size-caption)] text-[var(--qi-text-tertiary)]">
                  Configure marcas e aguarde as mencoes serem coletadas
                </p>
              </div>
            </div>
          ) : (
            <div
              className="grid grid-cols-1 gap-[var(--qi-spacing-md)] md:grid-cols-2 lg:grid-cols-3"
              data-testid="competitor-cards-grid"
            >
              {competitorData.map((competitor) => (
                <CompetitorCard
                  key={competitor.brand}
                  competitor={competitor}
                  isOwnBrand={competitor.brand.toLowerCase() === 'raiz'}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
