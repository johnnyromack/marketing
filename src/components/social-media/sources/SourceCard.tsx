import { Clock, Star, ExternalLink, RefreshCw, Pause, Play, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TYPE_CONFIG, STATUS_CONFIG, TIER_CONFIG, CATEGORY_CONFIG } from './constants';
import type { SourceCardProps } from './types';

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Nunca';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMins < 60) return `${diffMins}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  return date.toLocaleDateString('pt-BR');
}

export function SourceCard({ source, onRefresh, onToggle, onDelete }: SourceCardProps) {
  const typeConfig = TYPE_CONFIG[source.type];
  const statusConfig = STATUS_CONFIG[source.status];
  const tierConfig = TIER_CONFIG[source.tier];
  const categoryConfig = source.category ? CATEGORY_CONFIG[source.category] : null;
  const TypeIcon = typeConfig.icon;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="bg-white rounded-lg border p-4 hover:shadow-sm transition-shadow" data-testid={`source-card-${source.id}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <div className="flex-shrink-0 p-2 bg-gray-50 rounded-lg">
            <TypeIcon className="h-5 w-5 text-gray-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-gray-900 truncate" data-testid={`source-name-${source.id}`}>{source.name}</h3>
              {source.is_verified && (
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center space-x-2 mt-1 flex-wrap gap-1">
              <span className={cn('text-xs px-2 py-0.5 rounded-full', tierConfig.color)} data-testid={`source-tier-${source.id}`}>
                {tierConfig.label}
              </span>
              <span className={cn('text-xs px-2 py-0.5 rounded-full', statusConfig.color)} data-testid={`source-status-${source.id}`}>
                <StatusIcon className="h-3 w-3 inline mr-1" />
                {statusConfig.label}
              </span>
              {categoryConfig && (
                <span className={cn('text-xs px-2 py-0.5 rounded-full', categoryConfig.color)}>
                  {categoryConfig.label}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Verificado: {formatDate(source.last_checked_at)}
              </span>
              {source.check_interval && <span>Intervalo: {source.check_interval}min</span>}
              {source.error_count > 0 && (
                <span className="text-red-500">{source.error_count} erro(s)</span>
              )}
            </div>
            {source.url && (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline mt-1 flex items-center truncate"
              >
                {source.url}
                <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={onRefresh}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Atualizar agora"
            data-testid={`btn-refresh-${source.id}`}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={onToggle}
            className={cn(
              'p-2 rounded-lg transition-colors',
              source.status === 'active'
                ? 'text-yellow-600 hover:bg-yellow-50'
                : 'text-green-600 hover:bg-green-50'
            )}
            title={source.status === 'active' ? 'Pausar' : 'Ativar'}
            data-testid={`btn-toggle-${source.id}`}
          >
            {source.status === 'active' ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Excluir"
            data-testid={`btn-delete-source-${source.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {source.last_error && (
        <div className="mt-3 p-2 bg-red-50 rounded text-sm text-red-600">{source.last_error}</div>
      )}
    </div>
  );
}
