import { useMemo } from 'react';
import { Globe, CheckCircle, AlertCircle, Newspaper, TrendingUp } from 'lucide-react';
import type { StatsBarProps } from './types';

export function StatsBar({ sources, items }: StatsBarProps) {
  const stats = useMemo(() => {
    const active = sources.filter((s) => s.status === 'active').length;
    const error = sources.filter((s) => s.status === 'error').length;
    const itemsToday = items.filter((i) => {
      const publishedAt = new Date(i.published_at || i.discovered_at);
      const today = new Date();
      return publishedAt.toDateString() === today.toDateString();
    }).length;

    return {
      total: sources.length,
      active,
      error,
      totalItems: items.length,
      itemsToday,
    };
  }, [sources, items]);

  return (
    <div className="grid grid-cols-5 gap-4 mb-6" data-testid="stats-bar">
      <div className="bg-white rounded-lg border p-4" data-testid="stat-total">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Fontes</p>
            <p className="text-2xl font-semibold">{stats.total}</p>
          </div>
          <Globe className="h-8 w-8 text-gray-400" />
        </div>
      </div>
      <div className="bg-white rounded-lg border p-4" data-testid="stat-active">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Ativas</p>
            <p className="text-2xl font-semibold text-green-600">{stats.active}</p>
          </div>
          <CheckCircle className="h-8 w-8 text-green-400" />
        </div>
      </div>
      <div className="bg-white rounded-lg border p-4" data-testid="stat-error">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Com Erro</p>
            <p className="text-2xl font-semibold text-red-600">{stats.error}</p>
          </div>
          <AlertCircle className="h-8 w-8 text-red-400" />
        </div>
      </div>
      <div className="bg-white rounded-lg border p-4" data-testid="stat-items">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Itens</p>
            <p className="text-2xl font-semibold">{stats.totalItems}</p>
          </div>
          <Newspaper className="h-8 w-8 text-gray-400" />
        </div>
      </div>
      <div className="bg-white rounded-lg border p-4" data-testid="stat-today">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Hoje</p>
            <p className="text-2xl font-semibold text-blue-600">{stats.itemsToday}</p>
          </div>
          <TrendingUp className="h-8 w-8 text-blue-400" />
        </div>
      </div>
    </div>
  );
}
