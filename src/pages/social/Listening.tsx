import { useState, useCallback, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
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

const PAGE_SIZE = 20;

// Map a raw Supabase row → Mention shape
function rowToMention(row: Record<string, unknown>): Mention {
  const author = (row.author as Record<string, unknown>) ?? {};
  const engagement = (row.engagement as Record<string, unknown>) ?? {};
  const sentiment = row.sentiment as Record<string, unknown> | null;

  return {
    id: row.id as string,
    business_unit_id: row.user_id as string,
    platform: row.platform as Mention['platform'],
    external_id: (row.external_id as string) ?? '',
    external_url: (row.external_url as string) ?? null,
    content: (row.content as string) ?? '',
    author: {
      id: (author.id as string) ?? '',
      username: (author.username as string) ?? null,
      display_name: (author.display_name as string) ?? null,
      follower_count: (author.follower_count as number) ?? null,
      verified: (author.verified as boolean) ?? false,
      profile_url: (author.profile_url as string) ?? null,
    },
    published_at: (row.published_at as string) ?? new Date().toISOString(),
    sentiment: sentiment
      ? {
          score: (sentiment.score as number) ?? 0,
          label: (sentiment.label as 'positive' | 'negative' | 'neutral') ?? 'neutral',
          confidence: (sentiment.confidence as number) ?? 0,
        }
      : null,
    engagement: {
      reach: (engagement.reach as number) ?? null,
      impressions: (engagement.impressions as number) ?? null,
      likes: (engagement.likes as number) ?? 0,
      comments: (engagement.comments as number) ?? 0,
      shares: (engagement.shares as number) ?? 0,
      saves: (engagement.saves as number) ?? null,
    },
  } as Mention;
}

// ── Mention Card ──────────────────────────────────────────────────────────────

function MentionCard({ mention }: { mention: Mention }) {
  const authorDisplay = mention.author.display_name || mention.author.username || 'Autor desconhecido';

  return (
    <div
      data-testid={`mention-card-${mention.id}`}
      className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] p-4 hover:border-[var(--qi-accent)]/30 transition-colors"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--qi-bg-secondary)]">
            <PlatformIcon platform={mention.platform} size={20} />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex min-w-0 items-center justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="truncate font-medium text-sm text-foreground">{authorDisplay}</span>
              {mention.author.username && mention.author.display_name && (
                <span className="truncate text-xs text-muted-foreground">
                  @{mention.author.username}
                </span>
              )}
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              {mention.sentiment && (
                <SentimentBadge sentiment={mention.sentiment} size="sm" />
              )}
              {mention.external_url && (
                <a
                  href={mention.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 p-1 text-muted-foreground transition-colors hover:text-primary"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          <p className="mb-2 line-clamp-3 text-sm text-muted-foreground">{mention.content}</p>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="capitalize">{mention.platform.replace('_', ' ')}</span>
            <span>{new Date(mention.published_at).toLocaleDateString('pt-BR')}</span>
            {mention.engagement.reach && (
              <span>{mention.engagement.reach.toLocaleString('pt-BR')} alcance</span>
            )}
            {mention.engagement.likes > 0 && (
              <span>{mention.engagement.likes} curtidas</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MentionCardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-border bg-card p-4">
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-full bg-muted" />
        <div className="flex-1">
          <div className="mb-2 h-4 w-32 rounded bg-muted" />
          <div className="mb-1 h-3 w-full rounded bg-muted" />
          <div className="mb-2 h-3 w-3/4 rounded bg-muted" />
          <div className="h-3 w-40 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

// ── Filter Bar ────────────────────────────────────────────────────────────────

function FilterBar({
  sentimentFilter, onSentimentChange,
  platformFilter, onPlatformChange,
  searchQuery, onSearchChange,
}: {
  sentimentFilter: SentimentFilter; onSentimentChange: (f: SentimentFilter) => void;
  platformFilter: PlatformFilter;  onPlatformChange:  (f: PlatformFilter) => void;
  searchQuery: string;             onSearchChange:    (q: string) => void;
}) {
  const sentiments: SentimentFilter[] = ['all', 'positive', 'neutral', 'negative'];
  const platforms: PlatformFilter[] = ['all', 'instagram', 'facebook', 'linkedin', 'tiktok', 'google_business'];

  const sentimentLabels: Record<SentimentFilter, string> = {
    all: 'Todos', positive: 'Positivo', neutral: 'Neutro', negative: 'Negativo',
  };
  const platformLabels: Record<PlatformFilter, string> = {
    all: 'Todas', instagram: 'Instagram', facebook: 'Facebook',
    linkedin: 'LinkedIn', tiktok: 'TikTok', google_business: 'Google',
  };

  return (
    <div className="mb-6 space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar menções..."
          className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary"
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Sentimento:</span>
          <div className="flex gap-1">
            {sentiments.map((s) => (
              <button
                key={s}
                onClick={() => onSentimentChange(s)}
                className={`rounded-full px-2 py-1 text-xs transition-colors ${
                  sentimentFilter === s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {sentimentLabels[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Plataforma:</span>
          <select
            value={platformFilter}
            onChange={(e) => onPlatformChange(e.target.value as PlatformFilter)}
            className="rounded border-none bg-muted px-2 py-1 text-xs text-muted-foreground outline-none"
          >
            {platforms.map((p) => (
              <option key={p} value={p}>{platformLabels[p]}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ListeningPage() {
  const { isLoading: isLoadingUser } = useAuth();

  const [mentions, setMentions] = useState<Mention[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>('all');
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchMentions = useCallback(async (reset = false) => {
    setIsLoading(true);
    const currentOffset = reset ? 0 : offset;

    try {
      let query = supabase
        .from('social_media_mentions')
        .select('*')
        .order('published_at', { ascending: false })
        .range(currentOffset, currentOffset + PAGE_SIZE - 1);

      if (platformFilter !== 'all') {
        query = query.eq('platform', platformFilter);
      }

      if (sentimentFilter !== 'all') {
        // sentiment is stored as jsonb {label: 'positive'|'negative'|'neutral'}
        query = query.eq('sentiment->>label', sentimentFilter);
      }

      if (searchQuery.trim()) {
        query = query.ilike('content', `%${searchQuery.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data || []).map(rowToMention);

      if (reset) {
        setMentions(rows);
        setOffset(PAGE_SIZE);
      } else {
        setMentions((prev) => [...prev, ...rows]);
        setOffset((prev) => prev + PAGE_SIZE);
      }
      setHasMore(rows.length === PAGE_SIZE);
    } catch (err) {
      console.error('Error fetching mentions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [offset, sentimentFilter, platformFilter, searchQuery]);

  // Refetch when filters change
  useEffect(() => {
    setOffset(0);
    fetchMentions(true);
  }, [sentimentFilter, platformFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(0);
      fetchMentions(true);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoadingUser) {
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <PageHeader
            title="Listening Feed"
            description="Menções sincronizadas das plataformas conectadas"
          />
          <button
            onClick={() => { setOffset(0); fetchMentions(true); }}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        <FilterBar
          sentimentFilter={sentimentFilter} onSentimentChange={setSentimentFilter}
          platformFilter={platformFilter}   onPlatformChange={setPlatformFilter}
          searchQuery={searchQuery}         onSearchChange={setSearchQuery}
        />

        <div className="space-y-4">
          {mentions.map((mention) => (
            <MentionCard key={mention.id} mention={mention} />
          ))}

          {isLoading && (
            <>
              <MentionCardSkeleton />
              <MentionCardSkeleton />
              <MentionCardSkeleton />
            </>
          )}

          {!isLoading && mentions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nenhuma menção encontrada</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Sincronize os dados em Social Media → Sincronizar ou ajuste os filtros
              </p>
            </div>
          )}

          {hasMore && mentions.length > 0 && !isLoading && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => fetchMentions(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
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
