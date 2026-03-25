import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  Calendar,
  Clock,
  TrendingUp,
  RefreshCw,
  Info,
  Zap,
  Instagram,
  Facebook,
  Linkedin,
  Building2,
  ChevronDown,
  Lightbulb,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';

// ============================================
// Types
// ============================================

interface TimeSlot {
  dayOfWeek: number;
  hour: number;
  score: number;
  avgEngagement: number;
  avgReach: number;
  sampleSize: number;
}

interface DayRecommendation {
  dayOfWeek: number;
  dayName: string;
  bestHours: Array<{
    hour: number;
    hourLabel: string;
    score: number;
    confidence: string;
  }>;
  averageScore: number;
}

interface PlatformRecommendation {
  platform: string;
  bestTimes: DayRecommendation[];
  overallBestSlots: TimeSlot[];
  insights: string[];
}

interface BestTimeAnalysis {
  brandId: string;
  analyzedPeriodDays: number;
  totalPostsAnalyzed: number;
  platforms: PlatformRecommendation[];
  globalBestTimes: Array<{
    dayOfWeek: number;
    dayName: string;
    hour: number;
    hourLabel: string;
    score: number;
    platforms: string[];
  }>;
  lastUpdated: string;
}

interface PostTimeSuggestion {
  platform: string;
  suggestedTime: string;
  suggestedTimeLocal: string;
  score: number;
  reason: string;
}

// ============================================
// Constants
// ============================================

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const PLATFORM_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  instagram: { icon: Instagram, label: 'Instagram', color: 'text-pink-500' },
  facebook: { icon: Facebook, label: 'Facebook', color: 'text-blue-600' },
  linkedin: { icon: Linkedin, label: 'LinkedIn', color: 'text-blue-700' },
  google_business: { icon: Building2, label: 'Google Business', color: 'text-green-600' },
  tiktok: { icon: Zap, label: 'TikTok', color: 'text-black dark:text-white' },
};

// ============================================
// Components
// ============================================

function HeatmapCell({
  score,
  hour,
  day,
  isSelected,
  onClick,
}: {
  score: number;
  hour: number;
  day: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const getColor = (s: number) => {
    if (s >= 80) return 'bg-emerald-500';
    if (s >= 60) return 'bg-emerald-400';
    if (s >= 40) return 'bg-yellow-400';
    if (s >= 20) return 'bg-orange-300';
    return 'bg-gray-200 dark:bg-gray-700';
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'aspect-square w-full rounded-sm transition-all',
        getColor(score),
        isSelected && 'ring-2 ring-blue-500 ring-offset-1',
        'hover:ring-2 hover:ring-gray-400 hover:ring-offset-1'
      )}
      title={`${DAY_NAMES[day]} ${hour}:00 - Score: ${score}`}
    />
  );
}

function PlatformSelector({
  platforms,
  selected,
  onSelect,
}: {
  platforms: string[];
  selected: string | null;
  onSelect: (platform: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" data-testid="platform-selector">
      <button
        onClick={() => onSelect(null)}
        data-testid="btn-platform-all"
        className={cn(
          'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
          selected === null
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
        )}
      >
        Todas
      </button>
      {platforms.map((platform) => {
        const config = PLATFORM_CONFIG[platform] || {
          icon: Target,
          label: platform,
          color: 'text-gray-600',
        };
        const Icon = config.icon;

        return (
          <button
            key={platform}
            onClick={() => onSelect(platform)}
            data-testid={`btn-platform-${platform}`}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              selected === platform
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
            )}
          >
            <Icon className={cn('h-4 w-4', selected !== platform && config.color)} />
            {config.label}
          </button>
        );
      })}
    </div>
  );
}

function InsightCard({ insights }: { insights: string[] }) {
  if (insights.length === 0) return null;

  return (
    <div
      className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-4 dark:border-amber-800 dark:from-amber-950/30 dark:to-yellow-950/30"
      data-testid="insights-card"
    >
      <div className="mb-3 flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-amber-500" />
        <span className="font-semibold text-amber-800 dark:text-amber-200">Insights</span>
      </div>
      <ul className="space-y-2" data-testid="insights-list">
        {insights.map((insight, idx) => (
          <li
            key={idx}
            className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300"
            data-testid={`insight-${idx}`}
          >
            <span className="text-amber-400">•</span>
            {insight}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TopTimesCard({
  times,
}: {
  times: Array<{
    dayOfWeek: number;
    dayName: string;
    hour: number;
    hourLabel: string;
    score: number;
    platforms: string[];
  }>;
}) {
  return (
    <div
      className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
      data-testid="top-times-card"
    >
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-emerald-500" />
        <span className="font-semibold">Melhores Horários</span>
      </div>
      <div className="space-y-3" data-testid="top-times-list">
        {times.slice(0, 5).map((time, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-900"
            data-testid={`top-time-${idx}`}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
                  idx === 0
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                )}
              >
                {idx + 1}
              </span>
              <div>
                <p className="font-medium">{time.dayName}</p>
                <p className="text-sm text-gray-500">{time.hourLabel}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-emerald-600">{time.score}%</p>
              <div className="flex gap-1">
                {time.platforms.slice(0, 3).map((p) => {
                  const config = PLATFORM_CONFIG[p];
                  if (!config) return null;
                  const Icon = config.icon;
                  return <Icon key={p} className={cn('h-3 w-3', config.color)} />;
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickSuggestCard({
  businessUnitId,
  platforms,
}: {
  businessUnitId: string;
  platforms: string[];
}) {
  const [selectedPlatform, setSelectedPlatform] = useState(platforms[0] || 'instagram');
  const [suggestion, setSuggestion] = useState<PostTimeSuggestion | null>(null);
  const [loading, setLoading] = useState(false);

  const getSuggestion = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/social-media/best-time?action=suggest&business_unit_id=${businessUnitId}&platform=${selectedPlatform}`
      );
      const data = await res.json();
      if (data.success) {
        setSuggestion(data.data);
      }
    } catch (error) {
      console.error('Failed to get suggestion:', error);
    } finally {
      setLoading(false);
    }
  }, [businessUnitId, selectedPlatform]);

  useEffect(() => {
    if (businessUnitId && selectedPlatform) {
      getSuggestion();
    }
  }, [businessUnitId, selectedPlatform, getSuggestion]);

  return (
    <div
      className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 dark:border-blue-800 dark:from-blue-950/30 dark:to-indigo-950/30"
      data-testid="quick-suggest-card"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-500" />
          <span className="font-semibold text-blue-800 dark:text-blue-200">Sugestão Rápida</span>
        </div>
        <div className="relative">
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="appearance-none rounded-lg border border-gray-300 bg-white px-3 py-1.5 pr-8 text-sm dark:border-gray-600 dark:bg-gray-800"
            data-testid="select-quick-platform"
          >
            {platforms.map((p) => (
              <option key={p} value={p}>
                {PLATFORM_CONFIG[p]?.label || p}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8" data-testid="quick-suggest-loading">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      ) : suggestion ? (
        <div className="space-y-3" data-testid="quick-suggest-result">
          <div className="py-4 text-center">
            <p
              className="text-3xl font-bold text-blue-700 dark:text-blue-300"
              data-testid="suggestion-time"
            >
              {new Date(suggestion.suggestedTime).toLocaleString('pt-BR', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <p
              className="mt-1 text-sm text-blue-600 dark:text-blue-400"
              data-testid="suggestion-score"
            >
              Score esperado: {suggestion.score}%
            </p>
          </div>
          <p
            className="rounded-lg bg-blue-100 p-3 text-center text-sm text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
            data-testid="suggestion-reason"
          >
            {suggestion.reason}
          </p>
        </div>
      ) : (
        <p className="py-4 text-center text-gray-500" data-testid="quick-suggest-empty">
          Selecione uma plataforma
        </p>
      )}
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function BestTimePage() {
  const { user } = useAuth(); const businessUnitId = user?.id;
  const [analysis, setAnalysis] = useState<BestTimeAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; hour: number } | null>(null);

  const fetchAnalysis = useCallback(async () => {
    if (!businessUnitId) {
      setLoading(false);
      setError('Unidade de negocio não configurada');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/social-media/best-time?business_unit_id=${businessUnitId}`);
      const data = await res.json();

      if (data.success) {
        setAnalysis(data.data);
      } else {
        setError(data.error || 'Failed to fetch analysis');
      }
    } catch {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }, [businessUnitId]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  // Build heatmap data
  const getHeatmapData = (): number[][] => {
    if (!analysis) return Array(7).fill(Array(24).fill(0));

    const heatmap: number[][] = Array(7)
      .fill(null)
      .map(() => Array(24).fill(0));

    const platformData = selectedPlatform
      ? analysis.platforms.find((p) => p.platform === selectedPlatform)
      : null;

    if (platformData) {
      for (const slot of platformData.overallBestSlots) {
        heatmap[slot.dayOfWeek][slot.hour] = slot.score;
      }
    } else {
      // Aggregate all platforms
      for (const platform of analysis.platforms) {
        for (const slot of platform.overallBestSlots) {
          heatmap[slot.dayOfWeek][slot.hour] = Math.max(
            heatmap[slot.dayOfWeek][slot.hour],
            slot.score
          );
        }
      }
    }

    return heatmap;
  };

  const heatmapData = getHeatmapData();

  const selectedPlatformData = selectedPlatform
    ? analysis?.platforms.find((p) => p.platform === selectedPlatform)
    : null;

  const insights = selectedPlatformData?.insights || [];

  if (loading) {
    return (
      <AppLayout>
        <div
          className="flex min-h-[400px] flex-1 items-center justify-center p-6"
          data-testid="best-time-loading"
        >
          <div className="text-center">
            <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-500" />
            <p className="text-gray-500">Analisando dados de engajamento...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div
          className="flex min-h-[400px] flex-1 items-center justify-center p-6"
          data-testid="best-time-error"
        >
          <div className="text-center">
            <Info className="mx-auto mb-4 h-8 w-8 text-red-500" />
            <p className="mb-4 text-red-600 dark:text-red-400" data-testid="error-message">
              {error}
            </p>
            <button
              onClick={fetchAnalysis}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              data-testid="btn-retry"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-6 space-y-6" data-testid="best-time-page">
        {/* Header */}
        <div className="flex items-center justify-between" data-testid="best-time-header">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold">
              <Clock className="h-7 w-7 text-blue-500" />
              Melhor Horário para Publicar
            </h1>
            <p className="mt-1 text-gray-500">
              Descubra os horários ideais baseados no engajamento do seu público
            </p>
          </div>
          <button
            onClick={fetchAnalysis}
            className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
            data-testid="btn-refresh-analysis"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </button>
        </div>

        {/* Stats */}
        {analysis && (
          <div className="grid grid-cols-3 gap-4" data-testid="stats-grid">
            <div
              className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
              data-testid="stat-posts"
            >
              <p className="text-sm text-gray-500">Posts Analisados</p>
              <p className="text-2xl font-bold" data-testid="stat-posts-value">
                {analysis.totalPostsAnalyzed}
              </p>
            </div>
            <div
              className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
              data-testid="stat-period"
            >
              <p className="text-sm text-gray-500">Período</p>
              <p className="text-2xl font-bold" data-testid="stat-period-value">
                {analysis.analyzedPeriodDays} dias
              </p>
            </div>
            <div
              className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
              data-testid="stat-platforms"
            >
              <p className="text-sm text-gray-500">Plataformas</p>
              <p className="text-2xl font-bold" data-testid="stat-platforms-value">
                {analysis.platforms.length}
              </p>
            </div>
          </div>
        )}

        {/* Platform Selector */}
        {analysis && (
          <div
            className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
            data-testid="platform-selector-section"
          >
            <p className="mb-3 text-sm font-medium text-gray-500">Filtrar por plataforma</p>
            <PlatformSelector
              platforms={analysis.platforms.map((p) => p.platform)}
              selected={selectedPlatform}
              onSelect={setSelectedPlatform}
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3" data-testid="main-content-grid">
          {/* Heatmap */}
          <div
            className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800 lg:col-span-2"
            data-testid="heatmap-section"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold">
                <Calendar className="h-5 w-5 text-blue-500" />
                Mapa de Engajamento
              </h2>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Baixo</span>
                <div className="flex gap-0.5">
                  <div className="h-4 w-4 rounded-sm bg-gray-200" />
                  <div className="h-4 w-4 rounded-sm bg-orange-300" />
                  <div className="h-4 w-4 rounded-sm bg-yellow-400" />
                  <div className="h-4 w-4 rounded-sm bg-emerald-400" />
                  <div className="h-4 w-4 rounded-sm bg-emerald-500" />
                </div>
                <span>Alto</span>
              </div>
            </div>

            {/* Heatmap Grid */}
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {/* Hour labels */}
                <div className="mb-1 ml-12 flex">
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="flex-1 text-center text-xs text-gray-400"
                      style={{ minWidth: '20px' }}
                    >
                      {hour % 3 === 0 ? `${hour}h` : ''}
                    </div>
                  ))}
                </div>

                {/* Grid rows */}
                {DAY_NAMES.map((dayName, dayIdx) => (
                  <div key={dayIdx} className="mb-1 flex items-center gap-2">
                    <span className="w-10 text-right text-xs text-gray-500">{dayName}</span>
                    <div className="grid-cols-24 grid flex-1 gap-0.5">
                      {HOURS.map((hour) => (
                        <HeatmapCell
                          key={hour}
                          score={heatmapData[dayIdx][hour]}
                          hour={hour}
                          day={dayIdx}
                          isSelected={selectedSlot?.day === dayIdx && selectedSlot?.hour === hour}
                          onClick={() => setSelectedSlot({ day: dayIdx, hour })}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected slot info */}
            {selectedSlot && (
              <div
                className="mt-4 rounded-lg bg-blue-50 p-3 text-sm dark:bg-blue-950/30"
                data-testid="selected-slot-info"
              >
                <p
                  className="font-medium text-blue-700 dark:text-blue-300"
                  data-testid="selected-slot-time"
                >
                  {DAY_NAMES[selectedSlot.day]} às {selectedSlot.hour}:00
                </p>
                <p className="text-blue-600 dark:text-blue-400" data-testid="selected-slot-score">
                  Score de engajamento: {heatmapData[selectedSlot.day][selectedSlot.hour]}%
                </p>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6" data-testid="right-column">
            {/* Quick Suggest */}
            {analysis && businessUnitId && (
              <QuickSuggestCard
                businessUnitId={businessUnitId}
                platforms={analysis.platforms.map((p) => p.platform)}
              />
            )}

            {/* Top Times */}
            {analysis && analysis.globalBestTimes.length > 0 && (
              <TopTimesCard times={analysis.globalBestTimes} />
            )}

            {/* Insights */}
            {insights.length > 0 && <InsightCard insights={insights} />}
          </div>
        </div>

        {/* Platform Details */}
        {analysis && selectedPlatformData && (
          <div
            className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
            data-testid="platform-details-section"
          >
            <h2 className="mb-4 flex items-center gap-2 font-semibold">
              {(() => {
                const config = PLATFORM_CONFIG[selectedPlatform!];
                if (config) {
                  const Icon = config.icon;
                  return <Icon className={cn('h-5 w-5', config.color)} />;
                }
                return null;
              })()}
              Detalhes - {PLATFORM_CONFIG[selectedPlatform!]?.label || selectedPlatform}
            </h2>

            <div className="grid grid-cols-7 gap-4">
              {selectedPlatformData.bestTimes.map((day) => (
                <div key={day.dayOfWeek} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
                  <p className="mb-2 text-center font-medium">{day.dayName}</p>
                  <p className="mb-3 text-center text-xs text-gray-500">
                    Média: {day.averageScore}%
                  </p>
                  <div className="space-y-2">
                    {day.bestHours.slice(0, 2).map((hour, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          'rounded p-2 text-center text-sm',
                          idx === 0
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        )}
                      >
                        <p className="font-medium">{hour.hourLabel}</p>
                        <p className="text-xs opacity-75">{hour.score}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
