import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PLATFORM_ICONS } from './constants';
import type { RecentMentionsProps } from './types';

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function getSentimentColor(sentiment: string) {
  switch (sentiment) {
    case 'positive':
      return 'border-l-green-500';
    case 'negative':
      return 'border-l-red-500';
    default:
      return 'border-l-border';
  }
}

export function RecentMentions({ className, mentions, isLoading }: RecentMentionsProps) {
  const navigate = useNavigate();

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-sm text-foreground">
            Mencoes Recentes
          </h3>
          <button
            onClick={() => navigate('/social-media/listening')}
            className="text-primary text-sm hover:underline"
          >
            Ver todas
          </button>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : mentions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare className="mb-2 h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhuma mencao encontrada
            </p>
            <p className="text-xs text-muted-foreground">
              Conecte suas plataformas e crie queries para monitorar
            </p>
          </div>
        ) : (
          <div className="max-h-[500px] space-y-2 overflow-y-auto">
            {mentions.map((mention) => {
              const PlatformIcon = PLATFORM_ICONS[mention.platform] || MessageSquare;
              return (
                <div
                  key={mention.id}
                  className={`rounded-md border border-l-4 border-border p-2 ${getSentimentColor(mention.sentiment)} cursor-pointer transition-colors hover:border-primary`}
                  onClick={() => navigate(`/social-media/listening?mention=${mention.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/social-media/listening?mention=${mention.id}`);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="mb-1 flex items-center gap-1">
                    <PlatformIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <span className="truncate font-medium text-xs text-foreground">
                      {mention.author?.username || 'Desconhecido'}
                    </span>
                    <span className="flex-shrink-0 text-xs text-muted-foreground">
                      {formatTime(mention.published_at)}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {mention.content}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
