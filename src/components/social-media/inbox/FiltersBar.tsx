import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FiltersBarProps, TicketStatus, TicketPriority } from './types';

export function FiltersBar({ filters, onFilterChange, onClear, queues }: FiltersBarProps) {
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined && v !== '');

  return (
    <div
      className="mb-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
      data-testid="filters-bar"
    >
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600"
            aria-hidden="true"
          />
          <label htmlFor="tickets-search" className="sr-only">
            Buscar tickets
          </label>
          <input
            id="tickets-search"
            type="text"
            placeholder="Buscar tickets..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="w-full rounded-lg border border-gray-200 bg-transparent py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700"
            data-testid="input-search"
          />
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2 transition-colors',
            hasActiveFilters
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
              : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
          )}
          data-testid="btn-toggle-filters"
        >
          <Filter className="h-4 w-4" />
          Filtros
          {hasActiveFilters && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
              {Object.values(filters).filter((v) => v !== undefined && v !== '').length}
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
            data-testid="btn-clear-filters"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div
          className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-200 pt-4 dark:border-gray-700 md:grid-cols-4"
          data-testid="filters-expanded"
        >
          <div>
            <label htmlFor="status-65" className="mb-1 block text-sm font-medium text-gray-500">
              Status
            </label>
            <select
              id="status-65"
              value={filters.status || ''}
              onChange={(e) =>
                onFilterChange({ status: (e.target.value as TicketStatus) || undefined })
              }
              className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 dark:border-gray-700"
              data-testid="select-status"
            >
              <option value="">Todos</option>
              <option value="open">Aberto</option>
              <option value="in_progress">Em Progresso</option>
              <option value="pending">Pendente</option>
              <option value="resolved">Resolvido</option>
              <option value="closed">Fechado</option>
            </select>
          </div>

          <div>
            <label htmlFor="prioridade-84" className="mb-1 block text-sm font-medium text-gray-500">
              Prioridade
            </label>
            <select
              id="prioridade-84"
              value={filters.priority || ''}
              onChange={(e) =>
                onFilterChange({ priority: (e.target.value as TicketPriority) || undefined })
              }
              className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 dark:border-gray-700"
              data-testid="select-priority"
            >
              <option value="">Todas</option>
              <option value="urgent">Urgente</option>
              <option value="high">Alta</option>
              <option value="medium">Média</option>
              <option value="low">Baixa</option>
            </select>
          </div>

          <div>
            <label htmlFor="fila-102" className="mb-1 block text-sm font-medium text-gray-500">
              Fila
            </label>
            <select
              id="fila-102"
              value={filters.queue_id || ''}
              onChange={(e) => onFilterChange({ queue_id: e.target.value || undefined })}
              className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 dark:border-gray-700"
              data-testid="select-queue"
            >
              <option value="">Todas</option>
              {queues.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="atribui-o-119" className="mb-1 block text-sm font-medium text-gray-500">
              Atribuição
            </label>
            <select
              id="atribui-o-119"
              value={filters.unassigned ? 'unassigned' : ''}
              onChange={(e) =>
                onFilterChange({ unassigned: e.target.value === 'unassigned' || undefined })
              }
              className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 dark:border-gray-700"
              data-testid="select-assignment"
            >
              <option value="">Todos</option>
              <option value="unassigned">Não atribuídos</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
