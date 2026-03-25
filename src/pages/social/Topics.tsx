import { useState, useCallback } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Hash, MessageSquare, TrendingUp, RefreshCw, Loader2 } from 'lucide-react';
import { TopicsTree, SentimentBadge } from '@/components/social-media';
import { useSocialMediaTopics } from '@/hooks/social-media';

interface TopicData {
  id: string;
  name: string;
  slug: string;
  type: 'auto' | 'manual';
  keywords: string[];
  mention_count: number;
  sentiment_avg: number | null;
  trend: 'rising' | 'stable' | 'falling' | null;
  children?: TopicData[];
}

interface MentionPreview {
  id: string;
  content: string;
  author_name?: string;
  author_username?: string;
  platform: string;
  sentiment: 'positive' | 'negative' | 'neutral' | null;
  published_at: string;
}

/**
 * Topic Detail Panel
 */
function TopicDetailPanel({
  topic,
  mentions,
  isLoading,
}: {
  topic: TopicData | null;
  mentions: MentionPreview[];
  isLoading: boolean;
}) {
  // Helper to get author display name
  const getAuthorDisplay = (mention: MentionPreview) => {
    if (mention.author_name) return mention.author_name;
    if (mention.author_username) return `@${mention.author_username}`;
    return 'Autor desconhecido';
  };

  if (!topic) {
    return (
      <div
        data-testid="topic-detail-empty"
        className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] p-4"
      >
        <Hash className="mb-4 h-16 w-16 text-[var(--qi-text-tertiary)]" />
        <p
          data-testid="topic-detail-empty-title"
          className="text-[var(--qi-font-size-body-md)] text-[var(--qi-text-secondary)]"
        >
          Selecione um topico
        </p>
        <p
          data-testid="topic-detail-empty-message"
          className="text-[var(--qi-font-size-caption)] text-[var(--qi-text-tertiary)]"
        >
          Clique em um topico para ver as mencoes relacionadas
        </p>
      </div>
    );
  }

  return (
    <div
      data-testid={`topic-detail-${topic.id}`}
      className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] p-4"
    >
      {/* Topic header */}
      <div
        data-testid="topic-detail-header"
        className="mb-[var(--qi-spacing-md)] flex min-w-0 items-start justify-between border-b border-[var(--qi-border)] pb-[var(--qi-spacing-md)]"
      >
        <div className="min-w-0 flex-1">
          <h2
            data-testid="topic-detail-name"
            className="mb-1 truncate font-[var(--qi-font-weight-semibold)] text-[var(--qi-font-size-title)] text-[var(--qi-text-primary)]"
          >
            #{topic.name}
          </h2>
          <div
            data-testid="topic-detail-meta"
            className="flex flex-wrap items-center gap-[var(--qi-spacing-md)] text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]"
          >
            <span data-testid="topic-mention-count" className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4 flex-shrink-0" />
              {topic.mention_count.toLocaleString('pt-BR')} mencoes
            </span>
            {topic.sentiment_avg !== null && (
              <span data-testid="topic-sentiment" className="flex items-center gap-1">
                Sentimento: {(topic.sentiment_avg * 100).toFixed(0)}%
              </span>
            )}
          </div>
        </div>
        <span
          data-testid={`topic-type-${topic.type}`}
          className={`flex-shrink-0 rounded-full px-2 py-1 text-[var(--qi-font-size-caption)] ${
            topic.type === 'auto'
              ? 'bg-semantic-info/10 text-semantic-info'
              : 'bg-[var(--qi-accent)]/10 text-[var(--qi-accent)]'
          }`}
        >
          {topic.type === 'auto' ? 'Auto-detectado' : 'Manual'}
        </span>
      </div>

      {/* Keywords */}
      {topic.keywords && topic.keywords.length > 0 && (
        <div data-testid="topic-keywords-section" className="mb-[var(--qi-spacing-md)]">
          <h3
            data-testid="topic-keywords-title"
            className="mb-2 font-[var(--qi-font-weight-medium)] text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-primary)]"
          >
            Palavras-chave
          </h3>
          <div data-testid="topic-keywords-list" className="flex flex-wrap gap-2">
            {topic.keywords.map((keyword, index) => (
              <span
                key={index}
                data-testid={`topic-keyword-${index}`}
                className="rounded-[var(--qi-radius-sm)] bg-[var(--qi-bg-secondary)] px-2 py-1 text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Mentions list */}
      <div data-testid="topic-mentions-section">
        <h3
          data-testid="topic-mentions-title"
          className="mb-2 font-[var(--qi-font-weight-medium)] text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-primary)]"
        >
          Mencoes Recentes
        </h3>
        {isLoading ? (
          <div data-testid="topic-mentions-loading" className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} data-testid={`mention-skeleton-${i}`} className="animate-pulse">
                <div className="mb-2 h-4 w-24 rounded bg-[var(--qi-bg-secondary)]" />
                <div className="mb-1 h-3 w-full rounded bg-[var(--qi-bg-secondary)]" />
                <div className="h-3 w-3/4 rounded bg-[var(--qi-bg-secondary)]" />
              </div>
            ))}
          </div>
        ) : mentions.length === 0 ? (
          <div data-testid="topic-mentions-empty" className="py-8 text-center">
            <MessageSquare className="mx-auto mb-2 h-10 w-10 text-[var(--qi-text-tertiary)]" />
            <p
              data-testid="topic-mentions-empty-text"
              className="text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]"
            >
              Nenhuma mencao encontrada
            </p>
          </div>
        ) : (
          <div
            data-testid="topic-mentions-list"
            className="max-h-[500px] space-y-[var(--qi-spacing-sm)] overflow-y-auto"
          >
            {mentions.map((mention) => (
              <div
                key={mention.id}
                data-testid={`mention-item-${mention.id}`}
                className="min-w-0 cursor-pointer rounded-[var(--qi-radius-md)] bg-[var(--qi-bg-secondary)] p-3 transition-colors hover:bg-[var(--qi-bg-tertiary)]"
              >
                <div className="mb-1 flex min-w-0 items-center justify-between">
                  <span
                    data-testid={`mention-author-${mention.id}`}
                    className="min-w-0 flex-1 truncate font-[var(--qi-font-weight-medium)] text-[var(--qi-font-size-caption)] text-[var(--qi-text-primary)]"
                  >
                    {getAuthorDisplay(mention)}
                  </span>
                  {mention.sentiment && (
                    <SentimentBadge
                      sentiment={mention.sentiment}
                      size="sm"
                      showLabel={false}
                      className="flex-shrink-0"
                      data-testid={`mention-sentiment-${mention.id}`}
                    />
                  )}
                </div>
                <p
                  data-testid={`mention-content-${mention.id}`}
                  className="line-clamp-2 text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]"
                >
                  {mention.content}
                </p>
                <div
                  data-testid={`mention-meta-${mention.id}`}
                  className="mt-1 flex flex-wrap items-center gap-2"
                >
                  <span
                    data-testid={`mention-platform-${mention.id}`}
                    className="truncate capitalize text-[var(--qi-font-size-caption)] text-[var(--qi-text-tertiary)]"
                  >
                    {mention.platform}
                  </span>
                  <span
                    data-testid={`mention-date-${mention.id}`}
                    className="text-[var(--qi-font-size-caption)] text-[var(--qi-text-tertiary)]"
                  >
                    {new Date(mention.published_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Topics Page
 */
export default function TopicsPage() {
  const { isLoading: userLoading } = useAuth();
  const { user } = useAuth(); const businessUnitId = user?.id;

  const [selectedTopic, setSelectedTopic] = useState<TopicData | null>(null);
  const [mentions, setMentions] = useState<MentionPreview[]>([]);
  const [isLoadingMentions, setIsLoadingMentions] = useState(false);

  const {
    topics,
    isLoadingTopics,
    refreshTopics,
    fetchMentionsByTopic,
  } = useSocialMediaTopics({ businessUnitId });

  // Handle topic selection
  const handleSelectTopic = useCallback(
    async (topic: TopicData) => {
      setSelectedTopic(topic);
      setIsLoadingMentions(true);
      try {
        const result = await fetchMentionsByTopic(topic.slug);
        const previews: MentionPreview[] = result.mentions.map((m) => ({
          id: m.id,
          content: m.content,
          author_name: m.author.display_name || undefined,
          author_username: m.author.username,
          platform: m.platform,
          sentiment: m.sentiment,
          published_at: m.published_at,
        }));
        setMentions(previews);
      } finally {
        setIsLoadingMentions(false);
      }
    },
    [fetchMentionsByTopic]
  );

  // mentionPreviews is now directly 'mentions'
  const mentionPreviews = mentions;

  // Calculate stats
  const totalMentions = topics.reduce((sum, t) => sum + t.mention_count, 0);
  const risingTopics = topics.filter((t) => t.trend === 'rising').length;
  const avgSentiment =
    topics.length > 0
      ? topics.reduce((sum, t) => sum + (t.sentiment_avg || 0), 0) / topics.length
      : 0;

  // Show loading state while user is being fetched
  if (userLoading) {
    return (
      <AppLayout>
        <div
          data-testid="topics-loading"
          className="flex h-64 items-center justify-center"
        >
          <Loader2
            data-testid="topics-loading-spinner"
            className="h-8 w-8 animate-spin text-[var(--qi-accent)]"
          />
        </div>
      </AppLayout>
    );
  }

  // Show message if no business unit is selected
  if (!businessUnitId) {
    return (
      <AppLayout>
        <div
          data-testid="topics-no-business-unit"
          className="flex h-64 flex-col items-center justify-center text-center"
        >
          <Hash className="mb-4 h-12 w-12 text-[var(--qi-text-tertiary)]" />
          <h2
            data-testid="no-bu-title"
            className="mb-2 font-[var(--qi-font-weight-semibold)] text-[var(--qi-font-size-body-lg)] text-[var(--qi-text-primary)]"
          >
            Selecione uma Unidade de Negocio
          </h2>
          <p
            data-testid="no-bu-message"
            className="text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]"
          >
            Escolha uma unidade de negocio para ver os topicos de social media
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div data-testid="topics-page" className="min-h-0 flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div
          data-testid="topics-header"
          className="mb-[var(--qi-spacing-lg)] flex flex-col gap-[var(--qi-spacing-md)] md:flex-row md:items-center md:justify-between"
        >
          <PageHeader
            data-testid="topics-title"
            title="Topics"
            description="Explore topicos detectados automaticamente nas mencoes"
          />
          <div
            data-testid="topics-actions"
            className="flex items-center gap-[var(--qi-spacing-sm)]"
          >
            <button
              data-testid="btn-refresh-topics"
              onClick={refreshTopics}
              disabled={isLoadingTopics}
              className="flex items-center gap-2 rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] px-[var(--qi-spacing-md)] py-[var(--qi-spacing-sm)] text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)] transition-colors hover:bg-[var(--qi-bg-secondary)] disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingTopics ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <button
              data-testid="btn-new-topic"
              className="flex items-center gap-2 rounded-[var(--qi-radius-md)] bg-[var(--qi-accent)] px-[var(--qi-spacing-md)] py-[var(--qi-spacing-sm)] text-[var(--qi-font-size-body-sm)] text-white transition-colors hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Novo Topico
            </button>
          </div>
        </div>

        {/* Stats */}
        <div
          data-testid="topics-stats"
          className="mb-[var(--qi-spacing-lg)] grid grid-cols-2 gap-[var(--qi-spacing-md)] md:grid-cols-4"
        >
          <div
            data-testid="stat-total-topics"
            className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]">
                  Total de Topicos
                </p>
                <p className="text-[var(--qi-font-size-title)] font-[var(--qi-font-weight-semibold)] text-[var(--qi-text-primary)]">
                  {topics.length.toString()}
                </p>
              </div>
              <Hash className="h-8 w-8 text-[var(--qi-text-tertiary)]" />
            </div>
          </div>
          <div
            data-testid="stat-total-mentions"
            className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]">
                  Mencoes Totais
                </p>
                <p className="text-[var(--qi-font-size-title)] font-[var(--qi-font-weight-semibold)] text-[var(--qi-text-primary)]">
                  {totalMentions.toLocaleString('pt-BR')}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-[var(--qi-text-tertiary)]" />
            </div>
          </div>
          <div
            data-testid="stat-rising-topics"
            className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]">
                  Topicos em Alta
                </p>
                <p className="text-[var(--qi-font-size-title)] font-[var(--qi-font-weight-semibold)] text-[var(--qi-text-primary)]">
                  {risingTopics.toString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-[var(--qi-text-tertiary)]" />
            </div>
          </div>
          <div
            data-testid="stat-avg-sentiment"
            className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]">
                  Sentimento Medio
                </p>
                <p className="text-[var(--qi-font-size-title)] font-[var(--qi-font-weight-semibold)] text-[var(--qi-text-primary)]">
                  {`${(avgSentiment * 100).toFixed(0)}%`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div
          data-testid="topics-content"
          className="grid grid-cols-1 gap-[var(--qi-spacing-md)] lg:grid-cols-3"
        >
          {/* Topics tree */}
          <div data-testid="topics-tree-container" className="lg:col-span-1">
            <TopicsTree
              topics={topics}
              isLoading={isLoadingTopics}
              selectedTopicId={selectedTopic?.id}
              onSelectTopic={handleSelectTopic}
            />
          </div>

          {/* Topic detail */}
          <div data-testid="topic-detail-container" className="lg:col-span-2">
            <TopicDetailPanel
              topic={selectedTopic}
              mentions={mentionPreviews}
              isLoading={isLoadingMentions}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
