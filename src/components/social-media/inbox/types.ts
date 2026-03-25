import type { TicketStatus, TicketPriority } from '@/lib/schemas/social-inbox.schema';
import type { TicketWithMention, InboxFilters } from '@/hooks/social-media/useSocialInbox';

export interface StatsBarProps {
  stats: {
    total_tickets: number;
    open_tickets: number;
    in_progress_tickets: number;
    sla_breached: number;
  } | null;
  onFilterClick: (filter: Partial<InboxFilters>) => void;
}

export interface FiltersBarProps {
  filters: InboxFilters;
  onFilterChange: (filters: Partial<InboxFilters>) => void;
  onClear: () => void;
  queues: Array<{ id: string; name: string }>;
}

export interface TicketCardProps {
  ticket: TicketWithMention;
  onClick: () => void;
  isSelected: boolean;
}

export interface TicketDetailProps {
  ticket: TicketWithMention;
  onClose: () => void;
  onStatusChange: (status: TicketStatus) => void;
  onResolve: () => void;
  onSendResponse: (content: string) => void;
  loading: boolean;
}

// Re-export types for convenience
export type { TicketStatus, TicketPriority, TicketWithMention, InboxFilters };
