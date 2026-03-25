import { Calendar, Clock, MoreVertical, Edit2, Trash2, Send, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PlatformChips } from './PlatformSelector';
import type { ScheduledPost, PostStatus } from '@/lib/schemas/social-media.schema';

interface PostCardProps {
  post: ScheduledPost;
  onEdit?: (post: ScheduledPost) => void;
  onDelete?: (post: ScheduledPost) => void;
  onPublish?: (post: ScheduledPost) => void;
  onView?: (post: ScheduledPost) => void;
  className?: string;
}

const STATUS_CONFIG: Record<
  PostStatus,
  { label: string; color: string; bgColor: string }
> = {
  draft: {
    label: 'Rascunho',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
  pending_approval: {
    label: 'Aguardando Aprovação',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-600/10',
  },
  approved: {
    label: 'Aprovado',
    color: 'text-blue-600',
    bgColor: 'bg-blue-600/10',
  },
  scheduled: {
    label: 'Agendado',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  published: {
    label: 'Publicado',
    color: 'text-green-600',
    bgColor: 'bg-green-600/10',
  },
  failed: {
    label: 'Falhou',
    color: 'text-red-600',
    bgColor: 'bg-red-600/10',
  },
};

export function PostCard({
  post,
  onEdit,
  onDelete,
  onPublish,
  onView,
  className = '',
}: PostCardProps) {
  const statusConfig = STATUS_CONFIG[post.status];

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const displayContent =
    post.content?.text ||
    'Sem conteúdo';

  return (
    <Card data-testid={`post-card-${post.id}`} className={`group ${className}`}>
      <CardContent className="p-4">
        {/* Header */}
        <div data-testid="post-header" className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <PlatformChips platforms={post.platforms} />
            <span
              data-testid={`post-status-${post.status}`}
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
            >
              {statusConfig.label}
            </span>
          </div>

          {/* Actions dropdown */}
          <div className="relative">
            <button
              data-testid="btn-post-actions"
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
              title="Ações"
              aria-label="Ações do post"
            >
              <MoreVertical className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Content preview */}
        <p data-testid="post-content" className="text-sm text-foreground line-clamp-3 mb-2 break-words">
          {displayContent}
        </p>

        {/* Media preview */}
        {post.media && post.media.length > 0 && (
          <div data-testid="post-media" className="flex gap-1 mb-2">
            {post.media.slice(0, 3).map((media, index) => (
              <div
                key={index}
                data-testid={`media-item-${index}`}
                className="w-12 h-12 rounded-md bg-muted overflow-hidden"
              >
                {media.type === 'image' && media.url && (
                  <img
                    src={media.url}
                    alt=""
                    data-testid={`media-image-${index}`}
                    className="w-full h-full object-cover"
                  />
                )}
                {media.type === 'video' && (
                  <div data-testid={`media-video-${index}`} className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <span className="text-[10px]">VIDEO</span>
                  </div>
                )}
              </div>
            ))}
            {post.media.length > 3 && (
              <div data-testid="media-more" className="w-12 h-12 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
                +{post.media.length - 3}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div data-testid="post-footer" className="flex items-center justify-between pt-2 border-t border-border">
          <div data-testid="post-dates" className="flex items-center gap-4 text-xs text-muted-foreground">
            {post.scheduled_for && (
              <span data-testid="scheduled-date" className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(post.scheduled_for)}
              </span>
            )}
            {post.published_at && (
              <span data-testid="published-date" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Publicado {formatDate(post.published_at)}
              </span>
            )}
          </div>

          {/* Quick actions */}
          <div data-testid="post-quick-actions" className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onView && (
              <button
                data-testid="btn-view"
                onClick={() => onView(post)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                title="Visualizar"
                aria-label="Visualizar post"
              >
                <Eye className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
            {onEdit && post.status === 'draft' && (
              <button
                data-testid="btn-edit"
                onClick={() => onEdit(post)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10"
                title="Editar"
                aria-label="Editar post"
              >
                <Edit2 className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
            {onPublish && ['draft', 'approved', 'scheduled'].includes(post.status) && (
              <button
                data-testid="btn-publish"
                onClick={() => onPublish(post)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-green-600 hover:bg-green-600/10"
                title="Publicar agora"
                aria-label="Publicar post agora"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
            {onDelete && post.status === 'draft' && (
              <button
                data-testid="btn-delete"
                onClick={() => onDelete(post)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-600/10"
                title="Excluir"
                aria-label="Excluir post"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PostCardSkeleton() {
  return (
    <Card data-testid="post-card-skeleton" className="animate-pulse">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="space-y-2 mb-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="flex gap-1 mb-3">
          <Skeleton className="w-12 h-12 rounded-md" />
          <Skeleton className="w-12 h-12 rounded-md" />
        </div>
        <Skeleton className="h-4 w-32" />
      </CardContent>
    </Card>
  );
}

export { STATUS_CONFIG };
