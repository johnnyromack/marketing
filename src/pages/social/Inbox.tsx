/**
 * Social Inbox Page
 *
 * Interface for managing social media tickets (customer interactions).
 */

import { useState, useCallback } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { RefreshCw, Inbox, Loader2, MessageSquare } from 'lucide-react';
import { useSocialInbox } from '@/hooks/social-media/useSocialInbox';
import { cn } from '@/lib/utils';
import {
  StatsBar,
  FiltersBar,
  TicketCard,
  TicketDetail,
  EmptyState,
  type TicketStatus,
} from '@/components/social-media/inbox';

// ============================================
// Main Page
// ============================================

export default function SocialInboxPage() {
  const { user } = useAuth(); const businessUnitId = user?.id;
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const {
    tickets,
    stats,
    queues,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    updateTicket,
    resolveTicket,
    sendResponse,
    refresh,
  } = useSocialInbox({
    businessUnitId,
    autoFetch: true,
  });

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId);

  const handleStatusChange = useCallback(
    async (status: TicketStatus) => {
      if (!selectedTicketId) return;
      setActionLoading(true);
      await updateTicket(selectedTicketId, { status });
      setActionLoading(false);
    },
    [selectedTicketId, updateTicket]
  );

  const handleResolve = useCallback(async () => {
    if (!selectedTicketId) return;
    setActionLoading(true);
    await resolveTicket(selectedTicketId);
    setActionLoading(false);
  }, [selectedTicketId, resolveTicket]);

  const handleSendResponse = useCallback(
    async (content: string) => {
      if (!selectedTicketId) return;
      setActionLoading(true);
      await sendResponse(selectedTicketId, { content, response_type: 'reply', send_immediately: true });
      setActionLoading(false);
    },
    [selectedTicketId, sendResponse]
  );

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-6" data-testid="inbox-page">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between" data-testid="inbox-header">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold">
              <Inbox className="h-7 w-7 text-blue-500" />
              Social Inbox
            </h1>
            <p className="mt-1 text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]">
              Gerencie interações e atendimentos
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={refresh}
              disabled={loading}
              className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] p-2 transition-colors hover:bg-[var(--qi-bg-secondary)] disabled:opacity-50"
              data-testid="btn-refresh"
            >
              <RefreshCw className={cn('h-5 w-5', loading && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <StatsBar stats={stats} onFilterClick={updateFilters} />

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-[var(--qi-radius-md)] border border-semantic-error/20 bg-semantic-error/10 p-4">
            <p className="text-[var(--qi-font-size-body-sm)] text-semantic-error">{error}</p>
          </div>
        )}

        {/* Filters */}
        <FiltersBar
          filters={filters}
          onFilterChange={updateFilters}
          onClear={clearFilters}
          queues={queues}
        />

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Ticket List */}
          <div className="space-y-3">
            {loading && tickets.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--qi-accent)]" />
              </div>
            ) : tickets.length === 0 ? (
              <EmptyState />
            ) : (
              tickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  isSelected={selectedTicketId === ticket.id}
                />
              ))
            )}
          </div>

          {/* Ticket Detail */}
          <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-200px)]">
            {selectedTicket ? (
              <TicketDetail
                ticket={selectedTicket}
                onClose={() => setSelectedTicketId(null)}
                onStatusChange={handleStatusChange}
                onResolve={handleResolve}
                onSendResponse={handleSendResponse}
                loading={actionLoading}
              />
            ) : (
              <div className="flex h-full items-center justify-center rounded-[var(--qi-radius-md)] border border-dashed border-[var(--qi-border)] bg-[var(--qi-bg-secondary)]">
                <div className="text-center">
                  <MessageSquare className="mx-auto mb-3 h-12 w-12 text-[var(--qi-text-tertiary)]" />
                  <p className="text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]">
                    Selecione um ticket para ver detalhes
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
