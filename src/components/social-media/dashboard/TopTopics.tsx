import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { TopTopicsProps } from './types';

export function TopTopics({ className, topics, isLoading }: TopTopicsProps) {
  const navigate = useNavigate();
  const topTopics = [...topics]
    .sort((a, b) => (b.mention_count ?? 0) - (a.mention_count ?? 0))
    .slice(0, 5);

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-sm text-foreground">
            Topicos em Alta
          </h3>
          <button
            onClick={() => navigate('/social-media/topics')}
            className="text-primary text-sm hover:underline"
          >
            Ver todos
          </button>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : topTopics.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <Users className="mb-2 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Sem topicos ainda
            </p>
            <p className="text-xs text-muted-foreground">
              Os topicos aparecerao apos as primeiras mencoes
            </p>
          </div>
        ) : (
          <div className="max-h-[400px] space-y-1 overflow-y-auto">
            {topTopics.map((topic, index) => (
              <div
                key={topic.id}
                onClick={() => navigate(`/social-media/topics?topic=${topic.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/social-media/topics?topic=${topic.id}`);
                  }
                }}
                role="button"
                tabIndex={0}
                className="flex min-w-0 cursor-pointer items-center justify-between rounded-md p-1 transition-colors hover:bg-muted"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="w-4 flex-shrink-0 text-xs text-muted-foreground">
                    {index + 1}
                  </span>
                  <span className="truncate text-sm text-foreground">
                    {topic.name}
                  </span>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1">
                  <span className="text-xs text-muted-foreground">
                    {topic.mention_count ?? 0}
                  </span>
                  {topic.trend === 'rising' && (
                    <TrendingUp className="h-3 w-3 flex-shrink-0 text-green-600" />
                  )}
                  {topic.trend === 'falling' && (
                    <TrendingDown className="h-3 w-3 flex-shrink-0 text-red-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
