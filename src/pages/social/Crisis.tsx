import { useState, useCallback, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import {
  RefreshCw,
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  Plus,
  Loader2,
  Shield,
  Activity,
  Wifi,
  WifiOff,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWarRoomRealtime } from '@/hooks/social-media';
import type { CrisisAlert, CrisisIncident } from '@/lib/schemas/social-media.schema';

type IncidentStatus = 'active' | 'monitoring' | 'resolved';

/**
 * Severity Badge
 */
function SeverityBadge({ severity }: { severity: 'P1' | 'P2' | 'P3' | 'P4' }) {
  const config = {
    P1: { bg: 'bg-red-600/20', text: 'text-red-600', label: 'P1 - Critica' },
    P2: { bg: 'bg-semantic-error/10', text: 'text-semantic-error', label: 'P2 - Alta' },
    P3: { bg: 'bg-semantic-warning/10', text: 'text-semantic-warning', label: 'P3 - Media' },
    P4: { bg: 'bg-semantic-success/10', text: 'text-semantic-success', label: 'P4 - Baixa' },
  };

  const { bg, text, label } = config[severity];

  return (
    <span
      data-testid={`severity-badge-${severity}`}
      className={`rounded-full px-2.5 py-1 font-[var(--qi-font-weight-semibold)] text-[var(--qi-font-size-body-xs)] ${bg} ${text} ${severity === 'P1' ? 'animate-pulse' : ''}`}
    >
      {label}
    </span>
  );
}

/**
 * Alert Card
 */
function AlertCard({
  alert,
  onAcknowledge,
}: {
  alert: CrisisAlert;
  onAcknowledge: (id: string) => void;
}) {
  const typeLabels: Record<string, string> = {
    sentiment_spike: 'Pico de Sentimento',
    volume_spike: 'Pico de Volume',
    viral_mention: 'Mencao Viral',
    influencer: 'Influenciador',
    keyword: 'Palavra-chave',
  };

  const isCritical = alert.severity === 'P1';
  const isHigh = alert.severity === 'P2';

  return (
    <div
      data-testid={`alert-card-${alert.id}`}
      className={cn(
        'rounded-[var(--qi-radius-md)] border bg-[var(--qi-surface)] p-4 border-l-4',
        isCritical
          ? 'animate-pulse border-l-red-600 border-[var(--qi-border)]'
          : isHigh
            ? 'border-l-semantic-error border-[var(--qi-border)]'
            : 'border-l-semantic-warning border-[var(--qi-border)]'
      )}
    >
      <div className="flex min-w-0 items-start justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div
            data-testid="alert-icon"
            className={cn(
              'flex-shrink-0 rounded-full p-2',
              isCritical
                ? 'bg-red-600/20'
                : isHigh
                  ? 'bg-semantic-error/10'
                  : 'bg-semantic-warning/10'
            )}
          >
            <AlertTriangle
              className={cn(
                'h-5 w-5',
                isCritical
                  ? 'text-red-600'
                  : isHigh
                    ? 'text-semantic-error'
                    : 'text-semantic-warning'
              )}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex min-w-0 items-center gap-2">
              <span
                data-testid="alert-type"
                className="truncate font-[var(--qi-font-weight-semibold)] text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-primary)]"
              >
                {typeLabels[alert.type] || alert.type}
              </span>
              <SeverityBadge severity={alert.severity} />
            </div>
            <p
              data-testid="alert-message"
              className="mb-2 line-clamp-2 text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]"
            >
              {alert.description}
            </p>
            <div
              data-testid="alert-timestamp"
              className="flex items-center gap-2 text-[var(--qi-font-size-caption)] text-[var(--qi-text-tertiary)]"
            >
              <Clock className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{new Date(alert.created_at).toLocaleString('pt-BR')}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => onAcknowledge(alert.id)}
          className="flex-shrink-0 flex items-center gap-1 rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] px-[var(--qi-spacing-sm)] py-1 text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)] transition-colors hover:bg-[var(--qi-bg-secondary)]"
          data-testid="btn-acknowledge"
        >
          <CheckCircle className="h-4 w-4" />
          Reconhecer
        </button>
      </div>
    </div>
  );
}

/**
 * Incident Card
 */
function IncidentCard({
  incident,
  onResolve,
}: {
  incident: CrisisIncident;
  onResolve: (id: string) => void;
}) {
  const statusConfig: Record<
    IncidentStatus,
    { icon: typeof Activity; color: string; label: string }
  > = {
    active: { icon: AlertTriangle, color: 'text-semantic-error', label: 'Ativo' },
    monitoring: { icon: Activity, color: 'text-semantic-warning', label: 'Monitorando' },
    resolved: { icon: CheckCircle, color: 'text-semantic-success', label: 'Resolvido' },
  };

  const status = incident.status as IncidentStatus;
  const StatusIcon = statusConfig[status]?.icon || Activity;

  return (
    <div
      className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] p-4"
      data-testid={`incident-card-${incident.id}`}
    >
      <div className="mb-4 flex min-w-0 items-start justify-between" data-testid="incident-header">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div
            data-testid="incident-icon"
            className={`flex-shrink-0 rounded-full bg-[var(--qi-bg-secondary)] p-2`}
          >
            <StatusIcon
              className={`h-5 w-5 ${statusConfig[status]?.color || 'text-[var(--qi-text-secondary)]'}`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3
              data-testid="incident-title"
              className="mb-1 truncate font-[var(--qi-font-weight-semibold)] text-[var(--qi-font-size-body-md)] text-[var(--qi-text-primary)]"
            >
              {incident.title}
            </h3>
            <div className="flex min-w-0 items-center gap-2" data-testid="incident-status-row">
              <SeverityBadge severity={incident.severity} />
              <span
                data-testid="incident-status"
                className={`truncate text-[var(--qi-font-size-caption)] ${statusConfig[status]?.color || 'text-[var(--qi-text-secondary)]'}`}
              >
                {statusConfig[status]?.label || status}
              </span>
            </div>
          </div>
        </div>
        {incident.status !== 'resolved' && (
          <button
            onClick={() => onResolve(incident.id)}
            className="flex-shrink-0 rounded-[var(--qi-radius-md)] bg-[var(--qi-accent)] px-[var(--qi-spacing-sm)] py-1 text-[var(--qi-font-size-body-sm)] text-white transition-colors hover:opacity-90"
            data-testid="btn-resolve"
          >
            Resolver
          </button>
        )}
      </div>

      {incident.description && (
        <p
          data-testid="incident-description"
          className="mb-4 line-clamp-3 text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]"
        >
          {incident.description}
        </p>
      )}

      <div
        data-testid="incident-timestamps"
        className="flex flex-wrap items-center gap-4 text-[var(--qi-font-size-caption)] text-[var(--qi-text-tertiary)]"
      >
        <span data-testid="incident-created-at" className="truncate">
          Iniciado: {new Date(incident.created_at).toLocaleString('pt-BR')}
        </span>
        {incident.resolved_at && (
          <span data-testid="incident-resolved-at" className="truncate">
            Resolvido: {new Date(incident.resolved_at).toLocaleString('pt-BR')}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Real-time Connection Status
 */
function ConnectionStatus({
  isConnected,
  activeUsers,
}: {
  isConnected: boolean;
  activeUsers: string[];
}) {
  return (
    <div data-testid="connection-status" className="flex items-center gap-2">
      {isConnected ? (
        <div data-testid="status-connected" className="flex items-center gap-1 text-green-500">
          <Wifi className="h-4 w-4" />
          <span className="text-[var(--qi-font-size-caption)]">Live</span>
        </div>
      ) : (
        <div data-testid="status-connecting" className="flex items-center gap-1 text-yellow-500">
          <WifiOff className="h-4 w-4" />
          <span className="text-[var(--qi-font-size-caption)]">Conectando...</span>
        </div>
      )}
      {activeUsers.length > 0 && (
        <div
          data-testid="active-users"
          className="flex items-center gap-1 text-[var(--qi-text-tertiary)]"
        >
          <Users className="h-4 w-4" />
          <span data-testid="active-users-count" className="text-[var(--qi-font-size-caption)]">
            {activeUsers.length}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Crisis Center Page
 */
export default function CrisisPage() {
  const { isLoading: isLoadingUser } = useAuth();
  const { user } = useAuth(); const businessUnitId = user?.id;

  const [activeTab, setActiveTab] = useState<'alerts' | 'incidents'>('alerts');
  const [newAlertAnimation, setNewAlertAnimation] = useState<string | null>(null);

  // Real-time hook for live updates
  const {
    alerts: realtimeAlerts,
    incidents: realtimeIncidents,
    activeUsers,
    isConnected,
    isRefreshing,
    lastUpdate,
    refresh,
    acknowledgeAlert,
  } = useWarRoomRealtime({
    businessUnitId: businessUnitId || undefined,
    enabled: !!businessUnitId,
    callbacks: {
      onNewAlert: (alert) => {
        // Flash animation for new alerts
        setNewAlertAnimation(alert.id);
        setTimeout(() => setNewAlertAnimation(null), 3000);

        // Play notification sound for critical alerts
        if (alert.severity === 'critical' || alert.severity === 'high') {
          try {
            const audio = new Audio('/sounds/alert.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => {});
          } catch {}
        }
      },
      onNewIncident: () => {
        // Could add notification here
      },
    },
  });

  // Map realtime alerts to expected format
  const alerts = realtimeAlerts as unknown as CrisisAlert[];
  const incidents = realtimeIncidents as unknown as CrisisIncident[];
  const isLoading = !isConnected && alerts.length === 0;

  const handleAcknowledgeAlert = useCallback(
    async (alertId: string) => {
      if (!businessUnitId) return;

      try {
        // Use realtime hook's acknowledge function
        await acknowledgeAlert(alertId);

        // Also call API for persistence
        await fetch(`/api/social-media/crisis/alerts/${alertId}/acknowledge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ business_unit_id: businessUnitId }),
        });
      } catch (error) {
        console.error('Error acknowledging alert:', error);
      }
    },
    [businessUnitId, acknowledgeAlert]
  );

  const handleResolveIncident = useCallback(
    async (incidentId: string) => {
      if (!businessUnitId) return;

      try {
        const res = await fetch(`/api/social-media/crisis/incidents/${incidentId}/resolve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ business_unit_id: businessUnitId }),
        });

        if (res.ok) {
          await refresh();
        }
      } catch (error) {
        console.error('Error resolving incident:', error);
      }
    },
    [businessUnitId, refresh]
  );

  useEffect(() => {
    if (businessUnitId) {
      refresh();
    }
  }, [businessUnitId, refresh]);

  const activeIncidents = incidents.filter((i) => i.status !== 'resolved');
  const resolvedIncidents = incidents.filter((i) => i.status === 'resolved');

  // Show loading state while user is being fetched
  if (isLoadingUser) {
    return (
      <AppLayout>
        <div className="flex-1 overflow-y-auto p-6" data-testid="crisis-loading">
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
        <div className="flex-1 overflow-y-auto p-6" data-testid="crisis-no-bu">
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <Shield className="mb-4 h-12 w-12 text-[var(--qi-text-tertiary)]" />
            <h2 className="mb-2 font-[var(--qi-font-weight-semibold)] text-[var(--qi-font-size-body-lg)] text-[var(--qi-text-primary)]">
              Unidade de Negocio Não Configurada
            </h2>
            <p className="text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]">
              Configure sua unidade de negocio para gerenciar crises
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-0 flex-1 overflow-y-auto p-6" data-testid="crisis-page">
        {/* Header */}
        <div
          data-testid="crisis-header"
          className="mb-[var(--qi-spacing-lg)] flex flex-col gap-[var(--qi-spacing-md)] md:flex-row md:items-center md:justify-between"
        >
          <div>
            <PageHeader
              title="Crisis Center"
              description="Monitore e responda a crises de reputacao"
            />
            {lastUpdate && (
              <p
                data-testid="last-update"
                className="mt-1 text-[var(--qi-font-size-caption)] text-[var(--qi-text-tertiary)]"
              >
                Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
              </p>
            )}
          </div>
          <div data-testid="header-actions" className="flex items-center gap-3">
            <ConnectionStatus isConnected={isConnected} activeUsers={activeUsers} />
            <button
              onClick={refresh}
              disabled={isLoading || isRefreshing}
              className="flex items-center gap-2 rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] px-[var(--qi-spacing-md)] py-[var(--qi-spacing-sm)] text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)] transition-colors hover:bg-[var(--qi-bg-secondary)] disabled:opacity-50"
              data-testid="btn-refresh"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading || isRefreshing ? 'animate-spin' : ''}`}
              />
              Atualizar
            </button>
            <button
              className="flex items-center gap-2 rounded-[var(--qi-radius-md)] bg-[var(--qi-accent)] px-[var(--qi-spacing-md)] py-[var(--qi-spacing-sm)] text-[var(--qi-font-size-body-sm)] text-white transition-colors hover:opacity-90"
              data-testid="btn-new-incident"
            >
              <Plus className="h-4 w-4" />
              Novo Incidente
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div data-testid="stats-grid" className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div
            className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] p-4 text-center"
            data-testid="stat-pending-alerts"
          >
            <div className="flex flex-col items-center">
              <Bell className="mb-2 h-8 w-8 text-semantic-error" />
              <span
                data-testid="stat-pending-alerts-value"
                className="text-2xl font-bold text-[var(--qi-text-primary)]"
              >
                {alerts.length}
              </span>
              <span className="text-[var(--qi-font-size-caption)] text-[var(--qi-text-secondary)]">
                Alertas Pendentes
              </span>
            </div>
          </div>
          <div
            className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] p-4 text-center"
            data-testid="stat-active-incidents"
          >
            <div className="flex flex-col items-center">
              <AlertTriangle className="mb-2 h-8 w-8 text-semantic-warning" />
              <span
                data-testid="stat-active-incidents-value"
                className="text-2xl font-bold text-[var(--qi-text-primary)]"
              >
                {activeIncidents.length}
              </span>
              <span className="text-[var(--qi-font-size-caption)] text-[var(--qi-text-secondary)]">
                Incidentes Ativos
              </span>
            </div>
          </div>
          <div
            className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] p-4 text-center"
            data-testid="stat-resolved"
          >
            <div className="flex flex-col items-center">
              <CheckCircle className="mb-2 h-8 w-8 text-semantic-success" />
              <span
                data-testid="stat-resolved-value"
                className="text-2xl font-bold text-[var(--qi-text-primary)]"
              >
                {resolvedIncidents.length}
              </span>
              <span className="text-[var(--qi-font-size-caption)] text-[var(--qi-text-secondary)]">
                Resolvidos
              </span>
            </div>
          </div>
          <div
            className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] p-4 text-center"
            data-testid="stat-overall-status"
          >
            <div className="flex flex-col items-center">
              <Shield className="mb-2 h-8 w-8 text-[var(--qi-accent)]" />
              <span
                data-testid="stat-overall-status-value"
                className="text-2xl font-bold text-[var(--qi-text-primary)]"
              >
                {alerts.length === 0 && activeIncidents.length === 0 ? 'OK' : '!'}
              </span>
              <span className="text-[var(--qi-font-size-caption)] text-[var(--qi-text-secondary)]">
                Status Geral
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div
          data-testid="crisis-tabs"
          className="mb-6 flex w-fit gap-1 rounded-[var(--qi-radius-md)] bg-[var(--qi-bg-secondary)] p-1"
        >
          <button
            data-testid="tab-alerts"
            onClick={() => setActiveTab('alerts')}
            className={`rounded-[var(--qi-radius-sm)] px-4 py-2 text-[var(--qi-font-size-body-sm)] transition-colors ${
              activeTab === 'alerts'
                ? 'bg-[var(--qi-surface)] text-[var(--qi-text-primary)] shadow-sm'
                : 'text-[var(--qi-text-secondary)] hover:text-[var(--qi-text-primary)]'
            } `}
          >
            Alertas ({alerts.length})
          </button>
          <button
            data-testid="tab-incidents"
            onClick={() => setActiveTab('incidents')}
            className={`rounded-[var(--qi-radius-sm)] px-4 py-2 text-[var(--qi-font-size-body-sm)] transition-colors ${
              activeTab === 'incidents'
                ? 'bg-[var(--qi-surface)] text-[var(--qi-text-primary)] shadow-sm'
                : 'text-[var(--qi-text-secondary)] hover:text-[var(--qi-text-primary)]'
            } `}
          >
            Incidentes ({incidents.length})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'alerts' ? (
          <div data-testid="alerts-content" className="max-h-[600px] space-y-4 overflow-y-auto">
            {isLoading ? (
              <div data-testid="alerts-loading">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] p-4"
                    data-testid="alert-skeleton"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-[var(--qi-bg-secondary)]" />
                      <div className="flex-1">
                        <div className="mb-2 h-4 w-2/5 rounded bg-[var(--qi-bg-secondary)]" />
                        <div className="mb-1 h-3 w-full rounded bg-[var(--qi-bg-secondary)]" />
                        <div className="h-3 w-3/10 rounded bg-[var(--qi-bg-secondary)]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <div
                className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] py-12 p-4 text-center"
                data-testid="alerts-empty"
              >
                <CheckCircle className="mx-auto mb-4 h-12 w-12 text-semantic-success" />
                <h3 className="mb-2 font-[var(--qi-font-weight-semibold)] text-[var(--qi-font-size-body-md)] text-[var(--qi-text-primary)]">
                  Nenhum alerta pendente
                </h3>
                <p className="text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]">
                  Todas as mencoes estao dentro dos parametros normais
                </p>
              </div>
            ) : (
              <div data-testid="alerts-list">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={cn(
                      'transition-all duration-500',
                      newAlertAnimation === alert.id &&
                        'rounded-[var(--qi-radius-md)] ring-2 ring-[var(--qi-accent)] ring-offset-2'
                    )}
                  >
                    <AlertCard alert={alert} onAcknowledge={handleAcknowledgeAlert} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div data-testid="incidents-content" className="max-h-[600px] space-y-4 overflow-y-auto">
            {isLoading ? (
              <div data-testid="incidents-loading">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] p-4"
                    data-testid="incident-skeleton"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-[var(--qi-bg-secondary)]" />
                      <div className="flex-1">
                        <div className="mb-2 h-5 w-3/5 rounded bg-[var(--qi-bg-secondary)]" />
                        <div className="mb-1 h-3 w-full rounded bg-[var(--qi-bg-secondary)]" />
                        <div className="h-3 w-2/5 rounded bg-[var(--qi-bg-secondary)]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : incidents.length === 0 ? (
              <div
                className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] py-12 p-4 text-center"
                data-testid="incidents-empty"
              >
                <Shield className="mx-auto mb-4 h-12 w-12 text-[var(--qi-accent)]" />
                <h3 className="mb-2 font-[var(--qi-font-weight-semibold)] text-[var(--qi-font-size-body-md)] text-[var(--qi-text-primary)]">
                  Nenhum incidente registrado
                </h3>
                <p className="text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]">
                  Crie um incidente quando uma crise precisar de acompanhamento
                </p>
              </div>
            ) : (
              <div data-testid="incidents-list">
                {activeIncidents.length > 0 && (
                  <div data-testid="active-incidents-section" className="mb-6">
                    <h3 className="mb-3 font-[var(--qi-font-weight-semibold)] text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-primary)]">
                      Incidentes Ativos
                    </h3>
                    <div className="space-y-4">
                      {activeIncidents.map((incident) => (
                        <IncidentCard
                          key={incident.id}
                          incident={incident}
                          onResolve={handleResolveIncident}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {resolvedIncidents.length > 0 && (
                  <div data-testid="resolved-incidents-section">
                    <h3 className="mb-3 font-[var(--qi-font-weight-semibold)] text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-tertiary)]">
                      Incidentes Resolvidos
                    </h3>
                    <div className="space-y-4 opacity-75">
                      {resolvedIncidents.map((incident) => (
                        <IncidentCard
                          key={incident.id}
                          incident={incident}
                          onResolve={handleResolveIncident}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
