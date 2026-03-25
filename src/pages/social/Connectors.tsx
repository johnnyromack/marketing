import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  RefreshCw,
  Plus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Link2,
  Trash2,
} from 'lucide-react';
import { PlatformIcon, PLATFORM_CONFIG } from '@/components/social-media';
import type {
  Connector,
  ConnectorStatus,
  SocialPlatform,
} from '@/lib/schemas/social-media.schema';

const SOCIAL_PLATFORMS = ['instagram', 'facebook', 'linkedin', 'tiktok', 'google_business'];
const META_PLATFORMS = ['instagram', 'facebook'];

function mapRowToConnector(row: {
  id: string;
  user_id: string;
  platform: string;
  status: string;
  account_name: string | null;
  account_id: string;
  last_sync_at: string | null;
  sync_error: string | null;
  token_expires_at: string | null;
  created_at: string;
  updated_at: string;
}): Connector {
  let status: ConnectorStatus = 'disconnected';
  if (row.token_expires_at && new Date(row.token_expires_at) < new Date()) {
    status = 'expired';
  } else {
    const s = (row.status || '').toLowerCase();
    if (s === 'active' || s === 'connected') status = 'connected';
    else if (s === 'error') status = 'error';
    else if (s === 'limited') status = 'limited';
    else if (s === 'expired') status = 'expired';
  }
  return {
    id: row.id,
    business_unit_id: row.user_id,
    platform: row.platform as SocialPlatform,
    status,
    account_name: row.account_name,
    account_id: row.account_id,
    last_sync_at: row.last_sync_at,
    error_message: row.sync_error,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Status Badge
 */
function StatusBadge({ status }: { status: ConnectorStatus }) {
  const config: Record<
    ConnectorStatus,
    { icon: typeof CheckCircle; color: string; bg: string; label: string }
  > = {
    connected: {
      icon: CheckCircle,
      color: 'text-semantic-success',
      bg: 'bg-semantic-success/10',
      label: 'Conectado',
    },
    expired: {
      icon: AlertTriangle,
      color: 'text-semantic-error',
      bg: 'bg-semantic-error/10',
      label: 'Expirado',
    },
    limited: {
      icon: AlertTriangle,
      color: 'text-semantic-warning',
      bg: 'bg-semantic-warning/10',
      label: 'Limitado',
    },
    error: {
      icon: XCircle,
      color: 'text-semantic-error',
      bg: 'bg-semantic-error/10',
      label: 'Erro',
    },
    disconnected: {
      icon: XCircle,
      color: 'text-[var(--qi-text-tertiary)]',
      bg: 'bg-[var(--qi-bg-secondary)]',
      label: 'Desconectado',
    },
  };

  const { icon: Icon, color, bg, label } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[var(--qi-font-size-caption)] ${bg} ${color}`}
      data-testid={`status-badge-${status}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

/**
 * Connector Card
 */
function ConnectorCard({
  connector,
  onTest,
  onDisconnect,
  isTesting,
}: {
  connector: Connector;
  onTest: (id: string) => void;
  onDisconnect: (id: string) => void;
  isTesting: boolean;
}) {
  const platformConfig = PLATFORM_CONFIG[connector.platform] || {
    label: connector.platform,
    color: '#666',
  };

  return (
    <div
      className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] p-4 hover:border-[var(--qi-accent)]/30 transition-colors"
      data-testid={`connector-card-${connector.id}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {/* Platform Icon */}
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${platformConfig.color}15` }}
            data-testid="connector-icon"
          >
            <PlatformIcon platform={connector.platform} size={28} />
          </div>

          {/* Info */}
          <div>
            <h3
              className="mb-1 font-[var(--qi-font-weight-semibold)] text-[var(--qi-font-size-body-md)] text-[var(--qi-text-primary)]"
              data-testid="connector-name"
            >
              {platformConfig.label}
            </h3>
            {connector.account_name && (
              <p
                className="mb-2 text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]"
                data-testid="connector-account"
              >
                {connector.account_name}
              </p>
            )}
            <div className="flex items-center gap-3" data-testid="connector-status-row">
              <StatusBadge status={connector.status} />
              {connector.last_sync_at && (
                <span
                  className="text-[var(--qi-font-size-caption)] text-[var(--qi-text-tertiary)]"
                  data-testid="connector-last-sync"
                >
                  Sync: {new Date(connector.last_sync_at).toLocaleString('pt-BR')}
                </span>
              )}
            </div>
            {connector.error_message && (
              <p
                className="mt-2 text-[var(--qi-font-size-caption)] text-semantic-error"
                data-testid="connector-error"
              >
                {connector.error_message}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2" data-testid="connector-actions">
          <button
            onClick={() => onTest(connector.id)}
            disabled={isTesting}
            className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] p-2 transition-colors hover:bg-[var(--qi-bg-secondary)] disabled:opacity-50"
            data-testid="btn-test-connector"
          >
            {isTesting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => onDisconnect(connector.id)}
            className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] p-2 text-semantic-error transition-colors hover:bg-semantic-error/10"
            data-testid="btn-disconnect"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Platform Option Card (for connecting new platforms)
 */
function PlatformOptionCard({
  platform,
  isConnected,
  onConnect,
}: {
  platform: SocialPlatform;
  isConnected: boolean;
  onConnect: (platform: SocialPlatform) => void;
}) {
  const config = PLATFORM_CONFIG[platform] || { label: platform, color: '#666' };

  return (
    <div
      className={`cursor-pointer rounded-[var(--qi-radius-md)] border-2 p-4 transition-all ${
        isConnected
          ? 'border-semantic-success/30 bg-semantic-success/5'
          : 'hover:border-[var(--qi-accent)]/50 border-[var(--qi-border)] hover:bg-[var(--qi-bg-secondary)]'
      } `}
      onClick={() => !isConnected && onConnect(platform)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!isConnected) onConnect(platform);
        }
      }}
      role="button"
      tabIndex={0}
      data-testid={`platform-option-${platform}`}
    >
      <div className="flex flex-col items-center text-center">
        <div
          className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${config.color}15` }}
        >
          <PlatformIcon platform={platform} size={32} />
        </div>
        <h4 className="mb-1 font-[var(--qi-font-weight-medium)] text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-primary)]">
          {config.label}
        </h4>
        {isConnected ? (
          <span
            className="flex items-center gap-1 text-[var(--qi-font-size-caption)] text-semantic-success"
            data-testid="platform-connected"
          >
            <CheckCircle className="h-3 w-3" />
            Conectado
          </span>
        ) : (
          <span
            className="text-[var(--qi-font-size-caption)] text-[var(--qi-text-tertiary)]"
            data-testid="platform-available"
          >
            Clique para conectar
          </span>
        )}
      </div>
    </div>
  );
}

const ALL_PLATFORMS: SocialPlatform[] = [
  'instagram',
  'facebook',
  'linkedin',
  'tiktok',
  'google_business',
];

/**
 * Connectors Page
 */
export default function ConnectorsPage() {
  const { isLoading: isLoadingUser } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [showAddNew, setShowAddNew] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Handle OAuth callback results
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const platform = searchParams.get('platform');

    if (success === 'true' && platform) {
      setNotification({ type: 'success', message: `${platform} conectado com sucesso!` });
      // Clean URL params
      navigate('/social/connectors', { replace: true });
    } else if (error) {
      setNotification({ type: 'error', message: `Erro na conexao: ${decodeURIComponent(error)}` });
      navigate('/social/connectors', { replace: true });
    }
  }, [searchParams, navigate]);

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchConnectors = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ads_integrations')
        .select('*')
        .in('platform', SOCIAL_PLATFORMS);

      if (error) throw error;
      setConnectors((data || []).map(mapRowToConnector));
    } catch (error) {
      console.error('Error fetching connectors:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTestConnector = useCallback(
    async (connectorId: string) => {
      setTestingId(connectorId);
      try {
        // Re-fetch the connector from Supabase to get the current status
        await fetchConnectors();
      } catch (error) {
        console.error('Error testing connector:', error);
      } finally {
        setTestingId(null);
      }
    },
    [fetchConnectors]
  );

  const handleDisconnect = useCallback(
    async (connectorId: string) => {
      if (!confirm('Tem certeza que deseja desconectar esta plataforma?')) return;

      try {
        const { error } = await supabase
          .from('ads_integrations')
          .delete()
          .eq('id', connectorId);

        if (error) throw error;
        setConnectors((prev) => prev.filter((c) => c.id !== connectorId));
      } catch (error) {
        console.error('Error disconnecting:', error);
      }
    },
    []
  );

  const handleConnect = useCallback(
    async (platform: SocialPlatform) => {
      if (!META_PLATFORMS.includes(platform)) {
        alert(`Integração com ${platform} em breve! Atualmente suportamos Instagram e Facebook via Meta.`);
        return;
      }

      try {
        const redirectUrl = `${window.location.origin}/social/connectors?success=true&platform=${platform}`;
        const { data, error } = await supabase.functions.invoke('meta-ads-auth', {
          body: { redirect_url: redirectUrl },
        });

        if (error) throw error;

        if (data?.auth_url) {
          window.location.href = data.auth_url;
        } else {
          alert('Erro ao iniciar conexão. Verifique as credenciais da plataforma em Configurações > Credenciais.');
        }
      } catch (error) {
        console.error('Error connecting:', error);
        alert('Erro ao iniciar conexão. Tente novamente.');
      }
    },
    []
  );

  useEffect(() => {
    fetchConnectors();
  }, [fetchConnectors]);

  const connectedPlatforms = new Set(connectors.map((c) => c.platform));
  const activeConnectors = connectors.filter((c) => c.status === 'connected');
  const problemConnectors = connectors.filter((c) =>
    ['error', 'expired', 'limited'].includes(c.status)
  );

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

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-6" data-testid="connectors-page">
        {/* OAuth Callback Notification */}
        {notification && (
          <div
            className={`mb-4 flex items-center gap-2 rounded-[var(--qi-radius-md)] px-4 py-3 text-[var(--qi-font-size-body-sm)] ${
              notification.type === 'success'
                ? 'bg-semantic-success/10 text-semantic-success'
                : 'bg-semantic-error/10 text-semantic-error'
            }`}
            data-testid="oauth-notification"
          >
            {notification.type === 'success' ? (
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 flex-shrink-0" />
            )}
            {notification.message}
          </div>
        )}

        {/* Header */}
        <div
          className="mb-[var(--qi-spacing-lg)] flex flex-col gap-[var(--qi-spacing-md)] md:flex-row md:items-center md:justify-between"
          data-testid="connectors-header"
        >
          <PageHeader
            title="Connectors"
            description="Gerencie conexões com plataformas de social media"
          />
          <div className="flex items-center gap-2" data-testid="header-actions">
            <button
              onClick={fetchConnectors}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] px-[var(--qi-spacing-md)] py-[var(--qi-spacing-sm)] text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)] transition-colors hover:bg-[var(--qi-bg-secondary)] disabled:opacity-50"
              data-testid="btn-refresh"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <button
              onClick={() => setShowAddNew(true)}
              className="flex items-center gap-2 rounded-[var(--qi-radius-md)] bg-[var(--qi-accent)] px-[var(--qi-spacing-md)] py-[var(--qi-spacing-sm)] text-[var(--qi-font-size-body-sm)] text-white transition-colors hover:opacity-90"
              data-testid="btn-add-connector"
            >
              <Plus className="h-4 w-4" />
              Conectar
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-6 grid grid-cols-3 gap-4" data-testid="stats-grid">
          <div
            className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] p-4 text-center"
            data-testid="stat-total"
          >
            <span
              className="text-2xl font-bold text-[var(--qi-text-primary)]"
              data-testid="stat-total-value"
            >
              {connectors.length}
            </span>
            <p className="text-[var(--qi-font-size-caption)] text-[var(--qi-text-secondary)]">
              Total
            </p>
          </div>
          <div
            className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] p-4 text-center"
            data-testid="stat-active"
          >
            <span
              className="text-2xl font-bold text-semantic-success"
              data-testid="stat-active-value"
            >
              {activeConnectors.length}
            </span>
            <p className="text-[var(--qi-font-size-caption)] text-[var(--qi-text-secondary)]">
              Ativos
            </p>
          </div>
          <div
            className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] p-4 text-center"
            data-testid="stat-problems"
          >
            <span
              className="text-2xl font-bold text-semantic-error"
              data-testid="stat-problems-value"
            >
              {problemConnectors.length}
            </span>
            <p className="text-[var(--qi-font-size-caption)] text-[var(--qi-text-secondary)]">
              Com Problemas
            </p>
          </div>
        </div>

        {/* Add New Panel */}
        {showAddNew && (
          <div
            className="mb-6 rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] p-4"
            data-testid="add-connector-panel"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-[var(--qi-font-weight-semibold)] text-[var(--qi-font-size-body-md)] text-[var(--qi-text-primary)]">
                Conectar Nova Plataforma
              </h3>
              <button
                onClick={() => setShowAddNew(false)}
                className="text-[var(--qi-text-tertiary)] hover:text-[var(--qi-text-primary)]"
                data-testid="btn-close-panel"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5" data-testid="platform-options">
              {ALL_PLATFORMS.map((platform) => (
                <PlatformOptionCard
                  key={platform}
                  platform={platform}
                  isConnected={connectedPlatforms.has(platform)}
                  onConnect={handleConnect}
                />
              ))}
            </div>
          </div>
        )}

        {/* Connectors List */}
        <div className="space-y-4" data-testid="connectors-list">
          {isLoading ? (
            <div data-testid="connectors-list-loading">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] p-4"
                  data-testid="connector-skeleton"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-[var(--qi-bg-secondary)]" />
                    <div className="flex-1">
                      <div className="mb-2 h-5 w-32 rounded bg-[var(--qi-bg-secondary)]" />
                      <div className="h-4 w-24 rounded bg-[var(--qi-bg-secondary)]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : connectors.length === 0 ? (
            <div
              className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] py-12 p-4 text-center"
              data-testid="empty-state"
            >
              <Link2 className="mx-auto mb-4 h-12 w-12 text-[var(--qi-text-tertiary)]" />
              <h3 className="mb-2 font-[var(--qi-font-weight-semibold)] text-[var(--qi-font-size-body-md)] text-[var(--qi-text-primary)]">
                Nenhum conector configurado
              </h3>
              <p className="mb-4 text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]">
                Conecte suas redes sociais para comecar o monitoramento
              </p>
              <button
                onClick={() => setShowAddNew(true)}
                className="inline-flex items-center gap-2 rounded-[var(--qi-radius-md)] bg-[var(--qi-accent)] px-[var(--qi-spacing-md)] py-[var(--qi-spacing-sm)] text-[var(--qi-font-size-body-sm)] text-white transition-colors hover:opacity-90"
                data-testid="btn-empty-connect"
              >
                <Plus className="h-4 w-4" />
                Conectar Primeira Plataforma
              </button>
            </div>
          ) : (
            <div data-testid="connectors-list-content">
              {connectors.map((connector) => (
                <ConnectorCard
                  key={connector.id}
                  connector={connector}
                  onTest={handleTestConnector}
                  onDisconnect={handleDisconnect}
                  isTesting={testingId === connector.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
