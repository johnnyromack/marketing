import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { useSocialMediaHub } from '@/hooks/social-media/useSocialMediaHub';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Settings, Download } from 'lucide-react';
import { toast } from 'sonner';
import {
  QuickActions,
  StatsCards,
  ConnectedPlatforms,
  RecentMentions,
  CrisisAlerts,
  TopTopics,
} from '@/components/social-media/dashboard';

// ============================================
// Main Page
// ============================================

export default function SocialMediaPage() {
  const navigate = useNavigate();
  const { isLoading: userLoading } = useAuth();
  const { user } = useAuth(); const businessUnitId = user?.id;

  const { stats, connectors, recentMentions, alerts, topics, isLoading, refresh } =
    useSocialMediaHub({ businessUnitId: businessUnitId || null });

  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-social-insights', { body: {} });

      // Capture real error body (Supabase wraps non-2xx as FunctionsFetchError)
      if (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ctx = (error as any).context;
        let detail = error.message;
        try {
          const body = ctx?.body ? await (ctx.body as Response).text?.() : null;
          if (body) detail = body;
        } catch { /* ignore */ }
        throw new Error(detail);
      }

      if (data?.error) throw new Error(data.error);

      const count = data?.synced ?? 0;
      if (count === 0 && data?.message) {
        toast.warning(data.message);
      } else {
        toast.success(`Sincronização concluída — ${count} publicações importadas`);
      }
      if (data?.errors?.length) {
        console.warn('Sync partial errors:', data.errors);
      }
      refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Social sync error:', msg);
      toast.error(`Erro: ${msg}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="mb-[var(--qi-spacing-lg)] flex flex-col gap-[var(--qi-spacing-md)] md:flex-row md:items-center md:justify-between">
          <PageHeader
            title="Social Media"
            description="Monitoramento, gestao de crise e publicação integrados com IA"
          />
          <div className="flex items-center gap-[var(--qi-spacing-xs)]">
            <button
              onClick={() => navigate('/social/settings')}
              className="flex items-center gap-[var(--qi-spacing-xs)] rounded-[var(--qi-radius-md)] px-[var(--qi-spacing-md)] py-[var(--qi-spacing-sm)] text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)] transition-colors hover:bg-[var(--qi-bg-secondary)] hover:text-[var(--qi-text-primary)]"
              title="Configurações"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Configurações</span>
            </button>
            <button
              onClick={handleSync}
              disabled={syncing || isLoading}
              className="flex items-center gap-[var(--qi-spacing-xs)] rounded-[var(--qi-radius-md)] bg-primary px-[var(--qi-spacing-md)] py-[var(--qi-spacing-sm)] text-[var(--qi-font-size-body-sm)] text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
              title="Buscar novas publicações das plataformas conectadas"
            >
              <Download className={`h-4 w-4 ${syncing ? 'animate-bounce' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Sincronizar'}
            </button>
            <button
              onClick={refresh}
              disabled={isLoading}
              className="flex items-center gap-[var(--qi-spacing-xs)] rounded-[var(--qi-radius-md)] px-[var(--qi-spacing-md)] py-[var(--qi-spacing-sm)] text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)] transition-colors hover:bg-[var(--qi-bg-secondary)] hover:text-[var(--qi-text-primary)] disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <QuickActions className="mb-[var(--qi-spacing-lg)]" />

        {/* Stats Cards */}
        <StatsCards
          className="mb-[var(--qi-spacing-lg)]"
          stats={stats}
          isLoading={isLoading || userLoading}
        />

        {/* Main Content Grid */}
        <div className="mb-[var(--qi-spacing-lg)] grid grid-cols-1 gap-[var(--qi-spacing-md)] lg:grid-cols-3">
          {/* Recent Mentions - 2 cols */}
          <RecentMentions
            className="lg:col-span-2"
            mentions={recentMentions}
            isLoading={isLoading || userLoading}
          />
          {/* Connected Platforms - 1 col */}
          <ConnectedPlatforms connectors={connectors} isLoading={isLoading || userLoading} />
        </div>

        {/* Crisis Alerts + Top Topics */}
        <div className="grid grid-cols-1 gap-[var(--qi-spacing-md)] lg:grid-cols-2">
          <CrisisAlerts alerts={alerts} isLoading={isLoading || userLoading} />
          <TopTopics topics={topics} isLoading={isLoading || userLoading} />
        </div>
      </div>
    </AppLayout>
  );
}
