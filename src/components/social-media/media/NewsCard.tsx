import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Newspaper, Play, Mic, ExternalLink, Clock } from 'lucide-react';
import { SentimentBadge } from '../shared/SentimentBadge';

interface MediaItem {
  id: string;
  type: 'news' | 'video' | 'podcast';
  title: string;
  summary: string;
  url: string;
  source: {
    name: string;
    logo_url: string | null;
  };
  author: string | null;
  published_at: string;
  sentiment: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
  } | null;
  brands_mentioned: string[];
  thumbnail_url: string | null;
}

interface NewsCardProps {
  item: MediaItem;
  onClick?: () => void;
  className?: string;
}

const TYPE_ICONS = {
  news: Newspaper,
  video: Play,
  podcast: Mic,
};

const TYPE_LABELS = {
  news: 'Noticia',
  video: 'Video',
  podcast: 'Podcast',
};

export function NewsCard({ item, onClick, className = '' }: NewsCardProps) {
  const TypeIcon = TYPE_ICONS[item.type];
  const timeAgo = getTimeAgo(item.published_at);

  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer hover:border-primary transition-all ${className}`}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Thumbnail */}
          {item.thumbnail_url ? (
            <div className="flex-shrink-0 w-24 h-24 rounded-md overflow-hidden bg-muted">
              <img
                src={item.thumbnail_url}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="flex-shrink-0 w-24 h-24 rounded-md bg-muted flex items-center justify-center">
              <TypeIcon className="w-8 h-8 text-muted-foreground" />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                {/* Type badge */}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
                  <TypeIcon className="w-3 h-3" />
                  {TYPE_LABELS[item.type]}
                </span>

                {/* Source */}
                <span className="text-xs text-muted-foreground">
                  {item.source.name}
                </span>
              </div>

              {/* Sentiment */}
              {item.sentiment && (
                <SentimentBadge sentiment={item.sentiment.label} size="sm" />
              )}
            </div>

            {/* Title */}
            <h4 className="text-base font-semibold text-foreground line-clamp-2 mb-1">
              {item.title}
            </h4>

            {/* Summary */}
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {item.summary}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {timeAgo}
                </span>
                {item.author && (
                  <span>por {item.author}</span>
                )}
              </div>

              {/* Brands mentioned */}
              {item.brands_mentioned.length > 0 && (
                <div className="flex items-center gap-1">
                  {item.brands_mentioned.slice(0, 3).map((brand, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs"
                    >
                      {brand}
                    </span>
                  ))}
                  {item.brands_mentioned.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{item.brands_mentioned.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* External link */}
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex-shrink-0 p-2 rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

export function NewsCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Skeleton className="w-24 h-24 rounded-md flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to format time ago
function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'agora';
  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
}
