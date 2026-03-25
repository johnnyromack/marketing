import { useState } from 'react';
import { RefreshCw, Plus, AlertCircle, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { useSocialSources } from '@/hooks/social-media/useSocialSources';
import {
  StatsBar,
  TabNav,
  SourceCard,
  ItemCard,
  EmptyState,
  CreateSourceModal,
  type TabType,
  type MediaSource,
  type SourceType,
  type SourceCategory,
} from '@/components/social-media/sources';

// ============================================
// Main Page Component
// ============================================

export default function SourcesPage() {
  const { user } = useAuth(); const businessUnitId = user?.id;
  const [activeTab, setActiveTab] = useState<TabType>('sources');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const {
    sources,
    items,
    loading,
    error,
    createSource,
    updateSource,
    deleteSource,
    refreshSource,
    refresh,
  } = useSocialSources({
    businessUnitId,
    autoFetch: true,
  });

  const handleRefreshSource = async (sourceId: string) => {
    await refreshSource(sourceId);
  };

  const handleToggleSource = async (source: MediaSource) => {
    const newStatus = source.status === 'active' ? 'paused' : 'active';
    await updateSource(source.id, { status: newStatus });
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (confirm('Tem certeza que deseja excluir esta fonte?')) {
      await deleteSource(sourceId);
    }
  };

  const handleCreateSource = async (data: {
    name: string;
    type: SourceType;
    url: string;
    feed_url?: string;
    category?: SourceCategory;
    tier?: number;
  }) => {
    await createSource(data);
  };

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-6" data-testid="sources-page">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between" data-testid="sources-header">
          <PageHeader
            title="Media Sources"
            description="Gerenciar fontes de mídia (RSS, websites, notícias)"
          />
          <div className="flex items-center gap-[var(--qi-spacing-sm)]">
            <button
              onClick={() => refresh()}
              className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] p-2 text-[var(--qi-text-secondary)] transition-colors hover:bg-[var(--qi-bg-secondary)] hover:text-[var(--qi-text-primary)]"
              title="Atualizar"
              data-testid="btn-refresh"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-[var(--qi-radius-md)] bg-[var(--qi-accent)] px-[var(--qi-spacing-md)] py-[var(--qi-spacing-sm)] text-[var(--qi-font-size-body-sm)] text-white transition-colors hover:opacity-90"
              data-testid="btn-new-source"
            >
              <Plus className="h-4 w-4" />
              Adicionar Fonte
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div
            className="mb-6 rounded-[var(--qi-radius-md)] border border-semantic-error/20 bg-semantic-error/10 p-4"
            data-testid="error-message"
          >
            <div className="flex items-center text-semantic-error">
              <AlertCircle className="mr-2 h-5 w-5" />
              <span className="text-[var(--qi-font-size-body-sm)]">{error}</span>
            </div>
          </div>
        )}

        {/* Stats */}
        <StatsBar sources={sources} items={items} />

        {/* Tabs */}
        <TabNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          counts={{
            sources: sources.length,
            items: items.length,
          }}
        />

        {/* Loading State */}
        {loading && sources.length === 0 && (
          <div className="flex items-center justify-center py-12" data-testid="loading-spinner">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--qi-accent)]" />
          </div>
        )}

        {/* Content */}
        {!loading && (
          <>
            {/* Sources Tab */}
            {activeTab === 'sources' && (
              <div className="space-y-3" data-testid="sources-list">
                {sources.length === 0 ? (
                  <EmptyState tab="sources" />
                ) : (
                  sources.map((source) => (
                    <SourceCard
                      key={source.id}
                      source={source}
                      onRefresh={() => handleRefreshSource(source.id)}
                      onToggle={() => handleToggleSource(source)}
                      onDelete={() => handleDeleteSource(source.id)}
                    />
                  ))
                )}
              </div>
            )}

            {/* Items Tab */}
            {activeTab === 'items' && (
              <div className="space-y-3">
                {items.length === 0 ? (
                  <EmptyState tab="items" />
                ) : (
                  items.map((item) => <ItemCard key={item.id} item={item} />)
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Source Modal */}
      <CreateSourceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateSource}
      />
    </AppLayout>
  );
}
