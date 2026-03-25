import { ChevronDown, ChevronRight, Hash, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendIndicator } from './TrendIndicator';
import { SentimentIndicator } from '../shared/SentimentBadge';

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

interface TopicCardProps {
  topic: TopicData;
  isExpanded?: boolean;
  onToggle?: () => void;
  onClick?: (topic: TopicData) => void;
  isActive?: boolean;
  className?: string;
}

export function TopicCard({
  topic,
  isExpanded = false,
  onToggle,
  onClick,
  isActive = false,
  className = '',
}: TopicCardProps) {
  const hasChildren = topic.children && topic.children.length > 0;

  return (
    <div data-testid={`topic-item-${topic.id}`} className={className}>
      <Card
        data-testid={`topic-card-${topic.id}`}
        data-active={isActive}
        onClick={() => onClick?.(topic)}
        className={`
          cursor-pointer transition-all
          ${isActive ? 'ring-2 ring-primary border-primary' : 'hover:border-primary'}
        `}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            {/* Expand toggle */}
            {hasChildren && (
              <button
                data-testid={`btn-toggle-topic-${topic.id}`}
                onClick={e => {
                  e.stopPropagation();
                  onToggle?.();
                }}
                className="p-1 -ml-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            )}

            {/* Icon */}
            <div data-testid={`topic-icon-${topic.id}`} className="p-2 rounded-md bg-primary/10">
              <Hash className="w-4 h-4 text-primary" />
            </div>

            {/* Content */}
            <div data-testid={`topic-content-${topic.id}`} className="flex-1 min-w-0">
              {/* Header */}
              <div data-testid={`topic-header-${topic.id}`} className="flex items-center justify-between gap-2 mb-1">
                <h4 data-testid={`topic-name-${topic.id}`} className="text-sm font-semibold text-foreground truncate">
                  {topic.name}
                </h4>
                <TrendIndicator trend={topic.trend} size="sm" data-testid={`topic-trend-${topic.id}`} />
              </div>

              {/* Stats row */}
              <div data-testid={`topic-stats-${topic.id}`} className="flex items-center gap-4">
                <span data-testid={`topic-mentions-${topic.id}`} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MessageSquare className="w-3 h-3" />
                  {topic.mention_count.toLocaleString('pt-BR')} mencoes
                </span>

                {topic.sentiment_avg !== null && (
                  <SentimentIndicator score={topic.sentiment_avg} data-testid={`topic-sentiment-${topic.id}`} />
                )}
              </div>

              {/* Keywords */}
              {topic.keywords.length > 0 && (
                <div data-testid={`topic-keywords-${topic.id}`} className="flex flex-wrap gap-1 mt-2">
                  {topic.keywords.slice(0, 5).map((keyword, index) => (
                    <span
                      key={index}
                      data-testid={`topic-keyword-${topic.id}-${index}`}
                      className="px-1.5 py-0.5 text-[10px] rounded bg-muted text-muted-foreground"
                    >
                      {keyword}
                    </span>
                  ))}
                  {topic.keywords.length > 5 && (
                    <span data-testid={`topic-keywords-more-${topic.id}`} className="px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      +{topic.keywords.length - 5}
                    </span>
                  )}
                </div>
              )}

              {/* Type badge */}
              <div className="mt-2">
                <span
                  data-testid={`topic-type-${topic.id}`}
                  data-topic-type={topic.type}
                  className={`inline-flex px-1.5 py-0.5 text-[10px] rounded-full ${
                    topic.type === 'auto'
                      ? 'bg-blue-500/10 text-blue-600'
                      : 'bg-primary/10 text-primary'
                  }`}
                >
                  {topic.type === 'auto' ? 'Auto-detectado' : 'Manual'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div data-testid={`topic-children-${topic.id}`} className="ml-6 mt-2 space-y-2 pl-4 border-l-2 border-border">
          {topic.children!.map(child => (
            <TopicCard
              key={child.id}
              topic={child}
              onClick={onClick}
              isActive={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TopicCardSkeleton() {
  return (
    <Card data-testid="topic-card-skeleton" className="animate-pulse">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="w-8 h-8 rounded-md" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-3 w-32 mb-2" />
            <div className="flex gap-1">
              <Skeleton className="h-4 w-12 rounded-full" />
              <Skeleton className="h-4 w-16 rounded-full" />
              <Skeleton className="h-4 w-10 rounded-full" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
