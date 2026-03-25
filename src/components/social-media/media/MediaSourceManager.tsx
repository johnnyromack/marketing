import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Rss, Youtube, Podcast, Twitter, Trash2, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

interface MediaSource {
  id: string;
  type: 'rss' | 'youtube_channel' | 'podcast_feed' | 'twitter_list';
  name: string;
  url: string;
  status: 'active' | 'paused' | 'error';
  last_fetch_at: string | null;
  items_count: number;
}

interface MediaSourceManagerProps {
  sources: MediaSource[];
  onAddSource: (source: Omit<MediaSource, 'id' | 'status' | 'last_fetch_at' | 'items_count'>) => Promise<void>;
  onRemoveSource: (id: string) => Promise<void>;
  onRefreshSource: (id: string) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

const TYPE_ICONS = {
  rss: Rss,
  youtube_channel: Youtube,
  podcast_feed: Podcast,
  twitter_list: Twitter,
};

const TYPE_LABELS = {
  rss: 'RSS Feed',
  youtube_channel: 'YouTube',
  podcast_feed: 'Podcast',
  twitter_list: 'Twitter Lista',
};

const STATUS_CONFIG = {
  active: { icon: CheckCircle2, color: 'text-green-600', label: 'Ativo' },
  paused: { icon: AlertCircle, color: 'text-muted-foreground', label: 'Pausado' },
  error: { icon: AlertCircle, color: 'text-red-600', label: 'Erro' },
};

export function MediaSourceManager({
  sources,
  onAddSource,
  onRemoveSource,
  onRefreshSource,
  isLoading: _isLoading = false,
  className = '',
}: MediaSourceManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newSource, setNewSource] = useState<{
    type: 'rss' | 'youtube_channel' | 'podcast_feed' | 'twitter_list';
    name: string;
    url: string;
  }>({
    type: 'rss',
    name: '',
    url: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleAdd = useCallback(async () => {
    if (!newSource.name.trim() || !newSource.url.trim()) return;

    setIsSaving(true);
    try {
      await onAddSource(newSource);
      setNewSource({ type: 'rss', name: '', url: '' });
      setIsAdding(false);
    } finally {
      setIsSaving(false);
    }
  }, [newSource, onAddSource]);

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">
            Fontes de Midia
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(!isAdding)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Adicionar
          </Button>
        </div>

        {/* Add source form */}
        {isAdding && (
          <div className="p-4 mb-4 rounded-md bg-muted space-y-3">
            {/* Type selector */}
            <div className="flex gap-2">
              {(Object.keys(TYPE_ICONS) as Array<keyof typeof TYPE_ICONS>).map(type => {
                const Icon = TYPE_ICONS[type];
                return (
                  <button
                    key={type}
                    onClick={() => setNewSource(s => ({ ...s, type }))}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors
                      ${newSource.type === type
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-muted-foreground hover:text-foreground'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {TYPE_LABELS[type]}
                  </button>
                );
              })}
            </div>

            {/* Name input */}
            <Input
              placeholder="Nome da fonte"
              value={newSource.name}
              onChange={e => setNewSource(s => ({ ...s, name: e.target.value }))}
            />

            {/* URL input */}
            <Input
              placeholder="URL do feed"
              value={newSource.url}
              onChange={e => setNewSource(s => ({ ...s, url: e.target.value }))}
            />

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAdding(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={isSaving || !newSource.name.trim() || !newSource.url.trim()}
              >
                {isSaving ? 'Salvando...' : 'Adicionar'}
              </Button>
            </div>
          </div>
        )}

        {/* Sources list */}
        {sources.length === 0 ? (
          <div className="py-8 text-center">
            <Rss className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Nenhuma fonte configurada
            </p>
            <p className="text-xs text-muted-foreground">
              Adicione RSS feeds, canais do YouTube ou podcasts
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sources.map(source => {
              const TypeIcon = TYPE_ICONS[source.type];
              const statusConfig = STATUS_CONFIG[source.status];
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={source.id}
                  className="flex items-center gap-3 p-3 rounded-md bg-muted hover:bg-muted/80 transition-colors"
                >
                  {/* Type icon */}
                  <div className="p-2 rounded-md bg-card">
                    <TypeIcon className="w-4 h-4 text-primary" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">
                        {source.name}
                      </span>
                      <StatusIcon className={`w-3.5 h-3.5 ${statusConfig.color}`} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{source.items_count} itens</span>
                      {source.last_fetch_at && (
                        <span>• Atualizado {new Date(source.last_fetch_at).toLocaleDateString('pt-BR')}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onRefreshSource(source.id)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-card transition-colors"
                      title="Atualizar"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onRemoveSource(source.id)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-red-600 hover:bg-card transition-colors"
                      title="Remover"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
