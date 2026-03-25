import { Clock, User, ChevronRight, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATUS_CONFIG, PRIORITY_CONFIG, PLATFORM_ICONS } from './constants';
import type { TicketCardProps } from './types';

export function TicketCard({ ticket, onClick, isSelected }: TicketCardProps) {
  const statusConfig = STATUS_CONFIG[ticket.status];
  const priorityConfig = PRIORITY_CONFIG[ticket.priority];
  const PlatformIcon = ticket.customer_platform
    ? PLATFORM_ICONS[ticket.customer_platform] || MessageSquare
    : MessageSquare;

  const isSlaBreach = ticket.sla_breached;
  const slaTimeLeft = ticket.sla_due_at
    ? Math.max(0, new Date(ticket.sla_due_at).getTime() - Date.now())
    : null;
  const slaMinutesLeft = slaTimeLeft ? Math.floor(slaTimeLeft / 60000) : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full rounded-xl border p-4 text-left transition-all',
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
          : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
      )}
      data-testid={`ticket-card-${ticket.id}`}
      aria-label={`Ver ticket de ${ticket.mention?.author?.display_name || ticket.customer_username || 'Desconhecido'}`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar / Platform */}
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full',
            'bg-gray-100 dark:bg-gray-700'
          )}
        >
          {ticket.mention?.author?.avatar_url ? (
            <img
              src={ticket.mention.author.avatar_url}
              alt={
                ticket.mention.author.display_name ||
                ticket.customer_username ||
                'Avatar do usuário'
              }
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <PlatformIcon className="h-5 w-5 text-gray-600" aria-hidden="true" />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="truncate font-medium">
              {ticket.mention?.author?.display_name || ticket.customer_username || 'Desconhecido'}
            </span>
            {ticket.customer_platform && (
              <PlatformIcon className="h-4 w-4 flex-shrink-0 text-gray-600" aria-hidden="true" />
            )}
          </div>

          <p className="mb-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
            {ticket.mention?.content || ticket.notes || 'Sem conteúdo'}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status */}
            <span
              className={cn('rounded-full px-2 py-0.5 text-xs font-medium', statusConfig.color)}
              data-testid={`ticket-status-${ticket.id}`}
            >
              {statusConfig.label}
            </span>

            {/* Priority */}
            <span
              className={cn('rounded-full px-2 py-0.5 text-xs font-medium', priorityConfig.color)}
              data-testid={`ticket-priority-${ticket.id}`}
            >
              {priorityConfig.label}
            </span>

            {/* SLA */}
            {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
              <span
                className={cn(
                  'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                  isSlaBreach
                    ? 'bg-red-100 text-red-700'
                    : slaMinutesLeft !== null && slaMinutesLeft < 15
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-gray-100 text-gray-600'
                )}
                data-testid={`ticket-sla-${ticket.id}`}
              >
                <Clock className="h-3 w-3" />
                {isSlaBreach
                  ? 'SLA Violado'
                  : slaMinutesLeft !== null
                    ? `${slaMinutesLeft}min`
                    : '--'}
              </span>
            )}

            {/* Assignee */}
            {ticket.assignee && (
              <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-700">
                <User className="h-3 w-3" />
                {ticket.assignee.name}
              </span>
            )}
          </div>
        </div>

        <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-600" aria-hidden="true" />
      </div>
    </button>
  );
}
