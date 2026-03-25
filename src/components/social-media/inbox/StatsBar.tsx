import type { StatsBarProps } from './types';

export function StatsBar({ stats, onFilterClick }: StatsBarProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" data-testid="stats-bar">
      <button
        onClick={() => onFilterClick({ status: 'open' })}
        className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 text-left hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors"
        data-testid="stat-open"
      >
        <p className="text-sm text-blue-600 dark:text-blue-400">Abertos</p>
        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
          {stats?.open_tickets ?? '-'}
        </p>
      </button>
      <button
        onClick={() => onFilterClick({ status: 'in_progress' })}
        className="bg-yellow-50 dark:bg-yellow-950/30 rounded-xl p-4 text-left hover:bg-yellow-100 dark:hover:bg-yellow-950/50 transition-colors"
        data-testid="stat-in-progress"
      >
        <p className="text-sm text-yellow-600 dark:text-yellow-400">Em Progresso</p>
        <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
          {stats?.in_progress_tickets ?? '-'}
        </p>
      </button>
      <button
        onClick={() => onFilterClick({ sla_breached: true })}
        className="bg-red-50 dark:bg-red-950/30 rounded-xl p-4 text-left hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
        data-testid="stat-sla-breached"
      >
        <p className="text-sm text-red-600 dark:text-red-400">SLA Violado</p>
        <p className="text-2xl font-bold text-red-700 dark:text-red-300">
          {stats?.sla_breached ?? '-'}
        </p>
      </button>
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4" data-testid="stat-total">
        <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
        <p className="text-2xl font-bold">{stats?.total_tickets ?? '-'}</p>
      </div>
    </div>
  );
}
