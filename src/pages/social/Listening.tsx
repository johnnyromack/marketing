import { useState, useCallback, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import {
  RefreshCw,
  Search,
  Filter,
  MessageSquare,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { SentimentBadge, PlatformIcon } from '@/components/social-media';
import type { Mention } from '@/lib/schemas/social-media.schema';

type SentimentFilter = 'all' | 'positive' | 'negative' | 'neutral';
type PlatformFilter = 'all' | 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'google_business';

/**
 * Mention Card Component
 */
function MentionCard({ mention }: { mention: Mention }) {
  const authorDisplay = mention.author.display_name || mention.author.username || 'Autor desconhecido';

  return (
    <div
      data-testid={`mention-card-${mention.id}`}
      className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] p-4 hover:border-[var(--qi-accent)]/30 transition-colors"
    >
      <div className="flex items-start gap-4">
        {/* Platform Icon */}
        <div className="flex-shrink-0" data-testid="mention-platform-icon">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--qi-bg-secondary)]">
            <PlatformIcon platform={mention.platform} size={20} />
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div
            className="mb-2 flex min-w-0 items-center justify-between"
            data-testid="mention-header"
          >
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span
                data-testid="mention-author"
                className="truncate font-[var(--qi-font-weight-medium)] text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-primary)]"
              >
                {authorDisplay}
              </span>
              {mention.author.username && mention.author.display_name && (
                <span
                  data-testid="mention-username"
                  className="truncate text-[var(--qi-font-size-caption)] text-[var(--qi-text-tertiary)]"
                >
                  @{mention.author.username}
                </span>
              )}
            </div>
            <div className="flex flex-shrink-0 items-center gap-2" data-testid="mention-actions">
              {mention.sentiment && (
                <SentimentBadge
                  sentiment={mention.sentiment}
                  size="sm"
                  data-testid="mention-sentiment"
                />
              )}
              {mention.external_url && (
                <a
                  href={mention.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 p-1 text-[var(--qi-text-tertiary)] transition-colors hover:text-[var(--qi-accent)]"
                  data-testid="mention-link"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          {/* Content */}
          <p
            data-testid="mention-content"
            className="mb-2 line-clamp-3 text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]"
          >
            {mention.content}
          </p>

          {/* Footer */}
          <div
            data-testid="mention-footer"
            className="flex items-center gap-4 text-[var(--qi-font-size-caption)] text-[var(--qi-text-tertiary)]"
          >
            <span data-testid="mention-platform" className="capitalize">
              {mention.platform.replace('_', ' ')}
            </span>
            <span data-testid="mention-date">
              {new Date(mention.published_at).toLocaleDateString('pt-BR')}
            </span>
            {mention.engagement.reach && (
              <span data-testid="mention-reach">
                {mention.engagement.reach.toLocaleString('pt-BR')} alcance
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Mention Card Skeleton
 */
function MentionCardSkeleton() {
  return (
    <div
      data-testid="mention-skeleton"
      className="animate-pulse rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] p-4"
    >
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-full bg-[var(--qi-bg-secondary)]" />
        <div className="flex-1">
          <div className="mb-2 h-4 w-32 rounded bg-[var(--qi-bg-secondary)]" />
          <div className="mb-1 h-3 w-full rounded bg-[var(--qi-bg-secondary)]" />
          <div className="mb-2 h-3 w-3/4 rounded bg-[var(--qi-bg-secondary)]" />
          <div className="h-3 w-40 rounded bg-[var(--qi-bg-secondary)]" />
        </div>
      </div>
    </div>
  );
}

/**
 * Filter Bar
 */
function FilterBar({
  sentimentFilter,
  onSentimentChange,
  platformFilter,
  onPlatformChange,
  searchQuery,
  onSearchChange,
}: {
  sentimentFilter: SentimentFilter;
  onSentimentChange: (filter: SentimentFilter) => void;
  platformFilter: PlatformFilter;
  onPlatformChange: (filter: PlatformFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}) {
  const sentiments: SentimentFilter[] = ['all', 'positive', 'neutral', 'negative'];
  const platforms: PlatformFilter[] = [
    'all',
    'instagram',
    'facebook',
    'linkedin',
    'tiktok',
    'google_business',
  ];

  const sentimentLabels: Record<SentimentFilter, string> = {
    all: 'Todos',
    positive: 'Positivo',
    neutral: 'Neutro',
    negative: 'Negativo',
  };

  const platformLabels: Record<PlatformFilter, string> = {
    all: 'Todas',
    instagram: 'Instagram',
    facebook: 'Facebook',
    linkedin: 'LinkedIn',
    tiktok: 'TikTok',
    google_business: 'Google',
  };

  return (
    <div data-testid="filter-bar" className="mb-6 space-y-4">
      {/* Search */}
      <div className="relative" data-testid="search-container">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--qi-text-tertiary)]" />
        <input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar mencoes..."
          className="w-full rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] py-2 pl-9 pr-3 text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-primary)] outline-none focus:border-[var(--qi-accent)]"
          data-testid="input-search"
        />
      </div>

      <div className="flex flex-wrap items-center gap-4" data-testid="filters-row">
        {/* Sentiment filter */}
        <div className="flex items-center gap-2" data-testid="sentiment-filter">
          <Filter className="h-4 w-4 text-[var(--qi-text-tertiary)]" />
          <span className="text-[var(--qi-font-size-caption)] text-[var(--qi-text-tertiary)]">
            Sentimento:
          </span>
          <div className="flex gap-1" data-testid="sentiment-options">
            {sentiments.map((s) => (
              <button
                key={s}
                data-testid={`btn-sentiment-${s}`}
                onClick={() => onSentimentChange(s)}
                className={`rounded-full px-2 py-1 text-[var(--qi-font-size-caption)] transition-colors ${
                  sentimentFilter === s
                    ? 'bg-[var(--qi-accent)] text-white'
                    : 'bg-[var(--qi-bg-secondary)] text-[var(--qi-text-secondary)] hover:text-[var(--qi-text-primary)]'
                } `}
              >
                {sentimentLabels[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Platform filter */}
        <div className="flex items-center gap-2" data-testid="platform-filter">
          <span className="text-[var(--qi-font-size-caption)] text-[var(--qi-text-tertiary)]">
            Plataforma:
          </span>
          <select
            data-testid="select-platform"
            value={platformFilter}
            onChange={(e) => onPlatformChange(e.target.value as PlatformFilter)}
            className="rounded-[var(--qi-radius-sm)] border-none bg-[var(--qi-bg-secondary)] px-2 py-1 text-[var(--qi-font-size-caption)] text-[var(--qi-text-secondary)] outline-none"
          >
            {platforms.map((p) => (
              <option key={p} value={p}>
                {platformLabels[p]}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

/**
 * Listening Feed Page
 */
export default function ListeningPage() {
  const { isLoading: isLoadingUser } = useAuth();
  const { user } = useAuth(); const businessUnitId = user?.id;

  const [mentions, setMentions] = useState<Mention[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>('all');
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const fetchMentions = useCallback(
    async (reset = false) => {
      if (!businessUnitId) return;

      setIsLoading(true);
      const currentOffset = reset ? 0 : offset;

      try {
        const params = new URLSearchParams({
          business_unit_id: businessUnitId,
          limit: '20',
          offset: currentOffset.toString(),
          sort_by: 'published_at',
          sort_order: 'desc',
        });

        if (sentimentFilter !== 'all') {
          params.set('sentiment', sentimentFilter);
        }
        if (platformFilter !== 'all') {
          params.set('platform', platformFilter);
        }
        if (searchQuery) {
          params.set('search', searchQuery);
        }

        const res = await fetch(`/api/social-media/mentions?${params}`);
        const data = await res.json();

        if (data.success) {
          const newMentions = data.data?.items || [];
          if (reset) {
            setMentions(newMentions);
            setOffset(20);
          } else {
            setMentions((prev) => [...prev, ...newMentions]);
            setOffset((prev) => prev + 20);
          }
          setHasMore(newMentions.length === 20);
        }
      } catch (error) {
        console.error('Error fetching mentions:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [businessUnitId, sentimentFilter, platformFilter, searchQuery, offset]
  );

  // Fetch on mount and filter changes
  useEffect(() => {
    if (businessUnitId) {
      setOffset(0);
      fetchMentions(true);
    }
  }, [businessUnitId, sentimentFilter, platformFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (businessUnitId && searchQuery !== undefined) {
        setOffset(0);
        fetchMentions(true);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, businessUnitId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Show loading state while user is being fetched
  if (isLoadingUser) {
    return (
      <AppLayout>
        <div className="flex-1 overflow-y-auto p-6" data-testid="listening-loading">
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
        <div className="flex-1 overflow-y-auto p-6" data-testid="listening-no-bu">
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <MessageSquare className="mb-4 h-12 w-12 text-[var(--qi-text-tertiary)]" />
            <h2 className="mb-2 font-[var(--qi-font-weight-semibold)] text-[var(--qi-font-size-body-lg)] text-[var(--qi-text-primary)]">
              Unidade de Negocio Não Configurada
            </h2>
            <p className="text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]">
              Configure sua unidade de negocio para ver as mencoes
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-0 flex-1 overflow-y-auto p-6" data-testid="listening-page">
        {/* Header */}
        <div
          data-testid="listening-header"
          className="mb-[var(--qi-spacing-lg)] flex flex-col gap-[var(--qi-spacing-md)] md:flex-row md:items-center md:justify-between"
        >
          <PageHeader
            title="Listening Feed"
            description="Monitore mencoes da sua marca em tempo real"
          />
          <button
            onClick={() => fetchMentions(true)}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] px-[var(--qi-spacing-md)] py-[var(--qi-spacing-sm)] text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)] transition-colors hover:bg-[var(--qi-bg-secondary)] disabled:opacity-50"
            data-testid="btn-refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {/* Filter Bar */}
        <FilterBar
          sentimentFilter={sentimentFilter}
          onSentimentChange={setSentimentFilter}
          platformFilter={platformFilter}
          onPlatformChange={setPlatformFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Mentions List */}
        <div
          data-testid="mentions-list"
          className="max-h-[calc(100vh-400px)] space-y-4 overflow-y-auto"
        >
          {mentions.length > 0 && (
            <div data-testid="mentions-content">
              {mentions.map((mention) => (
                <MentionCard key={mention.id} mention={mention} />
              ))}
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div data-testid="mentions-loading">
              <MentionCardSkeleton />
              <MentionCardSkeleton />
              <MentionCardSkeleton />
            </div>
          )}

          {/* Empty state */}
          {!isLoading && mentions.length === 0 && (
            <div
              data-testid="mentions-empty"
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <MessageSquare className="mb-2 h-12 w-12 text-[var(--qi-text-tertiary)]" />
              <p className="text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]">
                Nenhuma mencao encontrada
              </p>
              <p className="text-[var(--qi-font-size-caption)] text-[var(--qi-text-tertiary)]">
                Tente ajustar os filtros ou aguarde novas mencoes
              </p>
            </div>
          )}

          {/* Load more button */}
          {hasMore && mentions.length > 0 && !isLoading && (
            <div data-testid="load-more-container" className="flex justify-center pt-4">
              <button
                onClick={() => fetchMentions(false)}
                className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] px-[var(--qi-spacing-md)] py-[var(--qi-spacing-sm)] text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)] transition-colors hover:bg-[var(--qi-bg-secondary)]"
                data-testid="btn-load-more"
              >
                Carregar mais
              </button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
