import { useState, useCallback } from 'react';
import { Search, Plus, Hash, FolderTree } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { TopicCard, TopicCardSkeleton } from './TopicCard';

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

interface TopicsTreeProps {
  topics: TopicData[];
  isLoading?: boolean;
  selectedTopicId?: string;
  onSelectTopic?: (topic: TopicData) => void;
  onCreateTopic?: () => void;
  className?: string;
}

export function TopicsTree({
  topics,
  isLoading = false,
  selectedTopicId,
  onSelectTopic,
  onCreateTopic,
  className = '',
}: TopicsTreeProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Filter topics by search
  const filterTopics = useCallback(
    (topics: TopicData[]): TopicData[] => {
      if (!searchQuery.trim()) return topics;

      const query = searchQuery.toLowerCase();
      return topics
        .map(topic => {
          const children = topic.children ? filterTopics(topic.children) : undefined;
          const matchesSelf =
            topic.name.toLowerCase().includes(query) ||
            topic.keywords.some(k => k.toLowerCase().includes(query));

          if (matchesSelf || (children && children.length > 0)) {
            return { ...topic, children } as TopicData;
          }
          return null;
        })
        .filter((t): t is TopicData => t !== null);
    },
    [searchQuery]
  );

  const filteredTopics = filterTopics(topics);

  // Calculate totals
  const totalMentions = topics.reduce((sum, t) => sum + t.mention_count, 0);
  const autoCount = topics.filter(t => t.type === 'auto').length;
  const manualCount = topics.filter(t => t.type === 'manual').length;

  if (isLoading) {
    return (
      <Card data-testid="topics-tree-loading" className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="w-8 h-8 rounded-md" />
          </div>
          <Skeleton className="h-10 w-full rounded-md mb-4" />
          <div data-testid="topics-tree-skeletons" className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <TopicCardSkeleton key={i} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="topics-tree" className={className}>
      <CardContent className="p-4">
        {/* Header */}
        <div data-testid="topics-tree-header" className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-primary" />
            <h3 data-testid="topics-tree-title" className="text-base font-semibold text-foreground">
              Topicos
            </h3>
            <span data-testid="topics-tree-count" className="px-1.5 py-0.5 text-xs bg-muted rounded">
              {topics.length}
            </span>
          </div>
          {onCreateTopic && (
            <button
              data-testid="btn-create-topic-tree"
              onClick={onCreateTopic}
              className="p-2 rounded-md text-primary hover:bg-primary/10 transition-colors"
              title="Criar topico"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Stats */}
        <div data-testid="topics-tree-stats" className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
          <span data-testid="topics-tree-mentions">{totalMentions.toLocaleString('pt-BR')} mencoes</span>
          <span data-testid="topics-tree-auto">{autoCount} auto</span>
          <span data-testid="topics-tree-manual">{manualCount} manuais</span>
        </div>

        {/* Search */}
        <div data-testid="topics-tree-search" className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-testid="topics-tree-search-input"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar topicos..."
            className="pl-9"
          />
        </div>

        {/* Topics list */}
        {filteredTopics.length === 0 ? (
          <div data-testid="topics-tree-empty" className="flex flex-col items-center justify-center py-8 text-center">
            <Hash className="w-12 h-12 text-muted-foreground mb-2" />
            <p data-testid="topics-tree-empty-title" className="text-sm text-muted-foreground">
              {searchQuery ? 'Nenhum topico encontrado' : 'Sem topicos ainda'}
            </p>
            <p data-testid="topics-tree-empty-message" className="text-xs text-muted-foreground">
              {searchQuery
                ? 'Tente outra busca'
                : 'Topicos serao criados automaticamente'}
            </p>
          </div>
        ) : (
          <div data-testid="topics-tree-list" className="space-y-2">
            {filteredTopics.map(topic => (
              <TopicCard
                key={topic.id}
                topic={topic}
                isExpanded={expandedIds.has(topic.id)}
                onToggle={() => toggleExpanded(topic.id)}
                onClick={onSelectTopic}
                isActive={selectedTopicId === topic.id}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
