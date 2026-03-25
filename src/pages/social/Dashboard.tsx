import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { useSocialMediaHub } from '@/hooks/social-media/useSocialMediaHub';
import { RefreshCw, Settings } from 'lucide-react';
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
