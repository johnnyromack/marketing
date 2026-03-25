import { useState, useMemo } from 'react';
import {
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  RefreshCw,
  X,
  Shield,
  Target,
  AlertCircle,
  Maximize2,
} from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { useSocialVisual } from '@/hooks/social-media/useSocialVisual';
import { cn } from '@/lib/utils';
import type {
  VisualDetection,
  DetectionType,
  RiskLevel,
  ProcessingStatus,
} from '@/lib/schemas/social-visual.schema';

// ============================================
// Constants
// ============================================

const DETECTION_TYPE_CONFIG: Record<DetectionType, { label: string; color: string }> = {
  logo: { label: 'Logo', color: 'bg-blue-100 text-blue-700' },
  text: { label: 'Texto', color: 'bg-purple-100 text-purple-700' },
  product: { label: 'Produto', color: 'bg-green-100 text-green-700' },
  scene: { label: 'Cena', color: 'bg-orange-100 text-orange-700' },
  face: { label: 'Face', color: 'bg-pink-100 text-pink-700' },
  object: { label: 'Objeto', color: 'bg-gray-100 text-gray-700' },
};

const RISK_LEVEL_CONFIG: Record<RiskLevel, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Baixo', color: 'text-green-600', bgColor: 'bg-green-100' },
  medium: { label: 'Médio', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  high: { label: 'Alto', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  critical: { label: 'Crítico', color: 'text-red-600', bgColor: 'bg-red-100' },
};

const STATUS_CONFIG: Record<
  ProcessingStatus,
  { label: string; color: string; icon: typeof CheckCircle }
> = {
  pending: { label: 'Pendente', color: 'bg-gray-100 text-gray-700', icon: Clock },
  processing: { label: 'Processando', color: 'bg-blue-100 text-blue-700', icon: Loader2 },
  completed: { label: 'Concluído', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  failed: { label: 'Falhou', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  skipped: { label: 'Ignorado', color: 'bg-gray-100 text-gray-500', icon: X },
};

type RiskFilter = 'all' | 'high_risk' | 'logo_detected' | 'no_brand';

// ============================================
// Sub-Components
// ============================================

function StatsBar({ detections }: { detections: VisualDetection[] }) {
  const stats = useMemo(() => {
    const total = detections.length;
    const withLogo = detections.filter((d) => d.logos_count > 0).length;
    const highRisk = detections.filter((d) => d.risk_score && d.risk_score >= 70).length;
    const ourBrand = detections.filter((d) => d.our_brand_detected).length;

    return { total, withLogo, highRisk, ourBrand };
  }, [detections]);

  return (
    <div data-testid="visual-stats-bar" className="mb-6 grid grid-cols-4 gap-4">
      <div
        data-testid="stat-total-images"
        className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] p-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]">
              Total Imagens
            </p>
            <p
              data-testid="stat-total-images-value"
              className="text-[var(--qi-font-size-title)] font-[var(--qi-font-weight-semibold)] text-[var(--qi-text-primary)]"
            >
              {stats.total}
            </p>
          </div>
          <ImageIcon className="h-8 w-8 text-[var(--qi-text-tertiary)]" />
        </div>
      </div>
      <div
        data-testid="stat-with-logo"
        className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] p-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]">
              Com Logo
            </p>
            <p
              data-testid="stat-with-logo-value"
              className="text-[var(--qi-font-size-title)] font-[var(--qi-font-weight-semibold)] text-blue-600"
            >
              {stats.withLogo}
            </p>
          </div>
          <Target className="h-8 w-8 text-blue-400" />
        </div>
      </div>
      <div
        data-testid="stat-high-risk"
        className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] p-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]">
              Alto Risco
            </p>
            <p
              data-testid="stat-high-risk-value"
              className="text-[var(--qi-font-size-title)] font-[var(--qi-font-weight-semibold)] text-red-600"
            >
              {stats.highRisk}
            </p>
          </div>
          <AlertTriangle className="h-8 w-8 text-red-400" />
        </div>
      </div>
      <div
        data-testid="stat-our-brand"
        className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] p-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]">
              Nossa Marca
            </p>
            <p
              data-testid="stat-our-brand-value"
              className="text-[var(--qi-font-size-title)] font-[var(--qi-font-weight-semibold)] text-green-600"
            >
              {stats.ourBrand}
            </p>
          </div>
          <Shield className="h-8 w-8 text-green-400" />
        </div>
      </div>
    </div>
  );
}

function RiskFilterBar({
  activeFilter,
  setActiveFilter,
  counts,
}: {
  activeFilter: RiskFilter;
  setActiveFilter: (filter: RiskFilter) => void;
  counts: { all: number; high_risk: number; logo_detected: number; no_brand: number };
}) {
  const filters: { id: RiskFilter; label: string; count: number }[] = [
    { id: 'all', label: 'Todos', count: counts.all },
    { id: 'high_risk', label: 'Alto Risco', count: counts.high_risk },
    { id: 'logo_detected', label: 'Logo Detectado', count: counts.logo_detected },
    { id: 'no_brand', label: 'Sem Marca', count: counts.no_brand },
  ];

  return (
    <div data-testid="risk-filter-bar" className="mb-6 flex items-center gap-2">
      {filters.map((filter) => (
        <button
          key={filter.id}
          data-testid={`risk-filter-${filter.id}`}
          data-active={activeFilter === filter.id}
          onClick={() => setActiveFilter(filter.id)}
          className={cn(
            'rounded-[var(--qi-radius-md)] px-4 py-2 text-[var(--qi-font-size-body-sm)] font-[var(--qi-font-weight-medium)] transition-colors',
            activeFilter === filter.id
              ? 'bg-[var(--qi-accent)] text-white'
              : 'bg-[var(--qi-bg-secondary)] text-[var(--qi-text-secondary)] hover:text-[var(--qi-text-primary)]'
          )}
        >
          {filter.label}
          <span
            data-testid={`risk-filter-count-${filter.id}`}
            className="ml-2 rounded-full bg-white/20 px-1.5 py-0.5 text-xs"
          >
            {filter.count}
          </span>
        </button>
      ))}
    </div>
  );
}

function DetectionCard({
  detection,
  isSelected,
  onClick,
}: {
  detection: VisualDetection;
  isSelected: boolean;
  onClick: () => void;
}) {
  const riskScore = detection.risk_score ?? 0;
  const riskLevel =
    detection.risk_level || (riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low');
  const riskConfig = RISK_LEVEL_CONFIG[riskLevel];

  const getRiskIndicator = (score: number) => {
    if (score >= 70) return { color: 'bg-red-500', ring: 'ring-red-500/20' };
    if (score >= 40) return { color: 'bg-yellow-500', ring: 'ring-yellow-500/20' };
    return { color: 'bg-green-500', ring: 'ring-green-500/20' };
  };

  const riskIndicator = getRiskIndicator(riskScore);

  return (
    <div
      data-testid={`detection-card-${detection.id}`}
      data-selected={isSelected}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      role="button"
      tabIndex={0}
      className={cn(
        'cursor-pointer overflow-hidden rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] transition-all hover:shadow-md',
        isSelected && 'ring-2 ring-[var(--qi-accent)]'
      )}
    >
      <div
        data-testid={`detection-thumbnail-${detection.id}`}
        className="relative aspect-video bg-[var(--qi-bg-secondary)]"
      >
        {detection.thumbnail_url || detection.image_url ? (
          <img
            src={detection.thumbnail_url || detection.image_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-8 w-8 text-[var(--qi-text-tertiary)]" />
          </div>
        )}
        {/* Risk Score Badge */}
        <div
          data-testid={`detection-risk-score-${detection.id}`}
          data-risk-level={riskLevel}
          className={cn(
            'absolute right-2 top-2 flex items-center rounded-full px-2 py-1 text-xs font-medium',
            riskConfig.bgColor,
            riskConfig.color
          )}
        >
          <div className={cn('mr-1 h-2 w-2 rounded-full', riskIndicator.color)} />
          {riskScore}%
        </div>
        {/* Logo detected badge */}
        {detection.logos_count > 0 && (
          <div
            data-testid={`detection-logos-badge-${detection.id}`}
            className="absolute left-2 top-2 rounded-full bg-blue-600 px-2 py-1 text-xs font-medium text-white"
          >
            {detection.logos_count} logo{detection.logos_count > 1 ? 's' : ''}
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="mb-2 flex items-center justify-between">
          <span
            data-testid={`detection-type-${detection.id}`}
            data-detection-type={detection.detection_type}
            className={cn(
              'rounded-full px-2 py-0.5 text-xs',
              DETECTION_TYPE_CONFIG[detection.detection_type].color
            )}
          >
            {DETECTION_TYPE_CONFIG[detection.detection_type].label}
          </span>
          {detection.our_brand_detected && (
            <Shield
              data-testid={`detection-our-brand-${detection.id}`}
              className="h-4 w-4 text-green-500"
            />
          )}
          {detection.competitor_detected && (
            <AlertTriangle
              data-testid={`detection-competitor-${detection.id}`}
              className="h-4 w-4 text-orange-500"
            />
          )}
        </div>
        {detection.scene_description && (
          <p
            data-testid={`detection-description-${detection.id}`}
            className="line-clamp-2 text-xs text-[var(--qi-text-tertiary)]"
          >
            {detection.scene_description}
          </p>
        )}
      </div>
    </div>
  );
}

function DetectionDetailPanel({
  detection,
  onClose,
  onReprocess,
}: {
  detection: VisualDetection;
  onClose: () => void;
  onReprocess: () => void;
}) {
  const riskScore = detection.risk_score ?? 0;
  const riskLevel =
    detection.risk_level || (riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low');
  const riskConfig = RISK_LEVEL_CONFIG[riskLevel];
  const statusConfig = STATUS_CONFIG[detection.status];
  const StatusIcon = statusConfig.icon;

  return (
    <div
      data-testid={`detection-detail-${detection.id}`}
      className="overflow-hidden rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)]"
    >
      <div
        data-testid="detection-detail-header"
        className="flex items-center justify-between border-b border-[var(--qi-border)] p-4"
      >
        <h3 className="font-[var(--qi-font-weight-semibold)] text-[var(--qi-text-primary)]">
          Detalhes da Detecção
        </h3>
        <button
          data-testid="btn-close-detail"
          onClick={onClose}
          className="rounded-[var(--qi-radius-sm)] p-1 text-[var(--qi-text-secondary)] hover:bg-[var(--qi-bg-secondary)]"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-4">
        {/* Image Preview */}
        <div
          data-testid="detection-detail-image"
          className="relative mb-4 aspect-video overflow-hidden rounded-[var(--qi-radius-md)] bg-[var(--qi-bg-secondary)]"
        >
          {detection.image_url ? (
            <img src={detection.image_url} alt="" className="h-full w-full object-contain" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon className="h-12 w-12 text-[var(--qi-text-tertiary)]" />
            </div>
          )}
          <a
            data-testid="btn-fullscreen-image"
            href={detection.image_url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute right-2 top-2 rounded-[var(--qi-radius-sm)] bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
          >
            <Maximize2 className="h-4 w-4" />
          </a>
        </div>

        {/* Risk Score */}
        <div data-testid="detection-detail-risk" className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[var(--qi-font-size-body-sm)] font-[var(--qi-font-weight-medium)] text-[var(--qi-text-primary)]">
              Pontuação de Risco
            </span>
            <span
              data-testid="detection-detail-risk-value"
              className={cn('text-lg font-bold', riskConfig.color)}
            >
              {riskScore}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-[var(--qi-bg-secondary)]">
            <div
              data-testid="detection-detail-risk-bar"
              className={cn('h-2 rounded-full transition-all', riskConfig.bgColor)}
              style={{ width: `${riskScore}%` }}
            />
          </div>
        </div>

        {/* Status */}
        <div
          data-testid="detection-detail-status"
          className="mb-4 flex items-center justify-between"
        >
          <span className="text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]">
            Status
          </span>
          <span
            data-testid="detection-detail-status-value"
            data-status={detection.status}
            className={cn('flex items-center rounded-full px-2 py-1 text-xs', statusConfig.color)}
          >
            <StatusIcon
              className={cn('mr-1 h-3 w-3', detection.status === 'processing' && 'animate-spin')}
            />
            {statusConfig.label}
          </span>
        </div>

        {/* Detected Items */}
        {detection.detected_items.length > 0 && (
          <div data-testid="detection-detail-items" className="mb-4">
            <h4 className="mb-2 text-[var(--qi-font-size-body-sm)] font-[var(--qi-font-weight-medium)] text-[var(--qi-text-primary)]">
              Itens Detectados
            </h4>
            <div data-testid="detection-detail-items-list" className="space-y-2">
              {detection.detected_items.map((item, index) => (
                <div
                  key={index}
                  data-testid={`detected-item-${index}`}
                  className="flex items-center justify-between rounded-[var(--qi-radius-sm)] bg-[var(--qi-bg-secondary)] p-2"
                >
                  <div>
                    <span
                      data-testid={`detected-item-name-${index}`}
                      className="text-[var(--qi-font-size-body-sm)] font-[var(--qi-font-weight-medium)] text-[var(--qi-text-primary)]"
                    >
                      {item.name}
                    </span>
                    {item.location && (
                      <p
                        data-testid={`detected-item-location-${index}`}
                        className="text-xs text-[var(--qi-text-tertiary)]"
                      >
                        {item.location}
                      </p>
                    )}
                  </div>
                  <span
                    data-testid={`detected-item-confidence-${index}`}
                    className="text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]"
                  >
                    {Math.round(item.confidence * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risk Factors */}
        {detection.risk_factors.length > 0 && (
          <div data-testid="detection-detail-risk-factors" className="mb-4">
            <h4 className="mb-2 text-[var(--qi-font-size-body-sm)] font-[var(--qi-font-weight-medium)] text-[var(--qi-text-primary)]">
              Fatores de Risco
            </h4>
            <div
              data-testid="detection-detail-risk-factors-list"
              className="flex flex-wrap gap-2"
            >
              {detection.risk_factors.map((factor, index) => (
                <span
                  key={index}
                  data-testid={`risk-factor-${index}`}
                  className="rounded-[var(--qi-radius-sm)] bg-red-50 px-2 py-1 text-xs text-red-700"
                >
                  {factor}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Scene Description */}
        {detection.scene_description && (
          <div data-testid="detection-detail-scene" className="mb-4">
            <h4 className="mb-2 text-[var(--qi-font-size-body-sm)] font-[var(--qi-font-weight-medium)] text-[var(--qi-text-primary)]">
              Descrição da Cena
            </h4>
            <p
              data-testid="detection-detail-scene-text"
              className="text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]"
            >
              {detection.scene_description}
            </p>
          </div>
        )}

        {/* Scene Categories */}
        {detection.scene_categories.length > 0 && (
          <div data-testid="detection-detail-categories" className="mb-4">
            <h4 className="mb-2 text-[var(--qi-font-size-body-sm)] font-[var(--qi-font-weight-medium)] text-[var(--qi-text-primary)]">
              Categorias
            </h4>
            <div
              data-testid="detection-detail-categories-list"
              className="flex flex-wrap gap-2"
            >
              {detection.scene_categories.map((cat, index) => (
                <span
                  key={index}
                  data-testid={`scene-category-${index}`}
                  className="rounded-[var(--qi-radius-sm)] bg-[var(--qi-bg-secondary)] px-2 py-1 text-xs text-[var(--qi-text-secondary)]"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Processing Info */}
        <div
          data-testid="detection-detail-processing-info"
          className="space-y-1 text-xs text-[var(--qi-text-tertiary)]"
        >
          {detection.provider && (
            <p data-testid="detection-provider">Provedor: {detection.provider}</p>
          )}
          {detection.processing_time_ms && (
            <p data-testid="detection-processing-time">
              Tempo de processamento: {detection.processing_time_ms}ms
            </p>
          )}
          {detection.processed_at && (
            <p data-testid="detection-processed-at">
              Processado em:{' '}
              {new Date(detection.processed_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>

        {/* Actions */}
        <div
          data-testid="detection-detail-actions"
          className="mt-4 flex items-center gap-2 border-t border-[var(--qi-border)] pt-4"
        >
          <button
            data-testid="btn-reprocess-detection"
            onClick={onReprocess}
            className="flex flex-1 items-center justify-center gap-2 rounded-[var(--qi-radius-md)] bg-[var(--qi-accent)] px-4 py-2 text-[var(--qi-font-size-body-sm)] text-white transition-colors hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" />
            Reprocessar
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div data-testid="visual-empty-state" className="py-12 text-center">
      <ImageIcon className="mx-auto mb-4 h-12 w-12 text-[var(--qi-text-tertiary)]" />
      <h3
        data-testid="visual-empty-title"
        className="mb-2 font-[var(--qi-font-weight-semibold)] text-[var(--qi-font-size-body-lg)] text-[var(--qi-text-primary)]"
      >
        Nenhuma detecção visual
      </h3>
      <p
        data-testid="visual-empty-description"
        className="mb-4 text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]"
      >
        As detecções visuais aparecerão aqui quando imagens forem processadas.
      </p>
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function VisualPage() {
  const { user } = useAuth(); const businessUnitId = user?.id;
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');

  const {
    detections,
    selectedDetection,
    setSelectedDetection,
    loading,
    error,
    reprocessDetection,
    refresh,
  } = useSocialVisual({
    businessUnitId,
    autoFetch: true,
  });

  // Filter detections based on risk filter
  const filteredDetections = useMemo(() => {
    switch (riskFilter) {
      case 'high_risk':
        return detections.filter((d) => d.risk_score && d.risk_score >= 70);
      case 'logo_detected':
        return detections.filter((d) => d.logos_count > 0);
      case 'no_brand':
        return detections.filter((d) => !d.our_brand_detected && !d.competitor_detected);
      default:
        return detections;
    }
  }, [detections, riskFilter]);

  // Calculate filter counts
  const filterCounts = useMemo(
    () => ({
      all: detections.length,
      high_risk: detections.filter((d) => d.risk_score && d.risk_score >= 70).length,
      logo_detected: detections.filter((d) => d.logos_count > 0).length,
      no_brand: detections.filter((d) => !d.our_brand_detected && !d.competitor_detected).length,
    }),
    [detections]
  );

  const handleReprocess = async () => {
    if (selectedDetection) {
      await reprocessDetection(selectedDetection.id);
    }
  };

  // No business unit state
  if (!businessUnitId) {
    return (
      <AppLayout>
        <div
          data-testid="visual-no-business-unit"
          className="flex h-64 items-center justify-center"
        >
          <p className="text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]">
            Selecione uma unidade de negócio para visualizar detecções.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div data-testid="visual-page" className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div data-testid="visual-header" className="mb-6 flex items-center justify-between">
          <PageHeader
            title="Visual Listening"
            description="Detecção de logos e elementos visuais em imagens"
          />
          <div className="flex items-center gap-[var(--qi-spacing-sm)]">
            <button
              data-testid="btn-refresh-visual"
              onClick={() => refresh()}
              className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] p-2 text-[var(--qi-text-secondary)] transition-colors hover:bg-[var(--qi-bg-secondary)] hover:text-[var(--qi-text-primary)]"
              title="Atualizar"
            >
              <RefreshCw className={cn('h-5 w-5', loading && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && detections.length === 0 && (
          <div data-testid="visual-loading" className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--qi-accent)]" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div
            data-testid="visual-error"
            className="mb-6 rounded-[var(--qi-radius-md)] border border-semantic-error/20 bg-semantic-error/10 p-4"
          >
            <div className="flex items-center text-semantic-error">
              <AlertCircle className="mr-2 h-5 w-5" />
              <span
                data-testid="visual-error-message"
                className="text-[var(--qi-font-size-body-sm)]"
              >
                {error}
              </span>
            </div>
          </div>
        )}

        {/* Stats */}
        <StatsBar detections={detections} />

        {/* Risk Filter */}
        <RiskFilterBar
          activeFilter={riskFilter}
          setActiveFilter={setRiskFilter}
          counts={filterCounts}
        />

        {/* Content Grid */}
        <div data-testid="visual-content" className="flex gap-6">
          {/* Detections Grid */}
          <div
            data-testid="detections-grid-container"
            className={cn('flex-1', selectedDetection && 'max-w-[calc(100%-400px)]')}
          >
            {loading && detections.length === 0 ? (
              <div
                data-testid="visual-loading-grid"
                className="flex items-center justify-center py-12"
              >
                <Loader2 className="h-8 w-8 animate-spin text-[var(--qi-accent)]" />
              </div>
            ) : filteredDetections.length === 0 ? (
              <EmptyState />
            ) : (
              <div
                data-testid="detections-grid"
                className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
              >
                {filteredDetections.map((detection) => (
                  <DetectionCard
                    key={detection.id}
                    detection={detection}
                    isSelected={selectedDetection?.id === detection.id}
                    onClick={() =>
                      setSelectedDetection(
                        selectedDetection?.id === detection.id ? null : detection
                      )
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {selectedDetection && (
            <div data-testid="detection-detail-panel" className="w-96 flex-shrink-0">
              <DetectionDetailPanel
                detection={selectedDetection}
                onClose={() => setSelectedDetection(null)}
                onReprocess={handleReprocess}
              />
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
