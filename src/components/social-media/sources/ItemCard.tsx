import { ExternalLink } from 'lucide-react';
import { SENTIMENT_CONFIG } from './constants';
import type { ItemCardProps } from './types';

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '--';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 24) return `${diffHours}h atrás`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function ItemCard({ item }: ItemCardProps) {
  const sentimentConfig = item.sentiment ? SENTIMENT_CONFIG[item.sentiment] : null;

  return (
    <div className="bg-white rounded-lg border p-4 hover:shadow-sm transition-shadow" data-testid={`item-card-${item.id}`}>
      <div className="flex items-start space-x-3">
        {item.image_url && (
          <img
            src={item.image_url}
            alt=""
            className="w-24 h-16 object-cover rounded flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <a
            href={item.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-gray-900 hover:text-blue-600 line-clamp-2"
            data-testid={`item-title-${item.id}`}
          >
            {item.title}
          </a>
          {item.summary && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.summary}</p>
          )}
          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
            {item.author && <span>{item.author}</span>}
            <span>{formatDate(item.published_at)}</span>
            {sentimentConfig && (
              <span className={sentimentConfig.color}>{sentimentConfig.label}</span>
            )}
            {item.relevance_score !== null && item.relevance_score !== undefined && (
              <span>Relevância: {Math.round(item.relevance_score * 100)}%</span>
            )}
            {item.impact_score !== null && item.impact_score !== undefined && (
              <span>Impacto: {item.impact_score}</span>
            )}
          </div>
        </div>
        <a
          href={item.external_url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
