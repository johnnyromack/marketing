/**
 * Social Inbox Hook
 *
 * Provides data fetching and mutations for the Social Inbox (ticketing) system.
 * Queries Supabase directly using user_id RLS filtering.
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ============================================
// Types
// ============================================

export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Ticket {
  id: string;
  user_id: string;
  mention_id?: string;
  status: TicketStatus;
  priority: TicketPriority;
  subject?: string;
  assigned_to?: string | null;
  queue_id?: string | null;
  sla_due_at?: string | null;
  first_response_at?: string | null;
  resolved_at?: string | null;
  resolution_notes?: string | null;
  tags?: string[];
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TicketWithMention extends Ticket {
  mention?: {
    id: string;
    content: string;
    platform: string;
    author: {
      username: string;
      display_name?: string;
      avatar_url?: string;
      followers_count?: number;
    };
    sentiment?: string;
    engagement?: {
      likes: number;
      comments: number;
      shares: number;
    };
    published_at: string;
    url?: string;
  };
  assignee?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  queue?: {
    id: string;
    name: string;
  };
  responses_count?: number;
  last_response_at?: string;
}

export interface InboxStats {
  total: number;
  open: number;
  pending: number;
  resolved: number;
  closed: number;
  overdue: number;
}

export interface Queue {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface Macro {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  actions: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}

export interface TicketResponse {
  id: string;
  ticket_id: string;
  user_id: string;
  content: string;
  channel?: string;
  is_internal?: boolean;
  created_at: string;
}

export interface CreateTicketInput {
  mention_id?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  subject?: string;
  assigned_to?: string | null;
  queue_id?: string | null;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateTicketInput {
  status?: TicketStatus;
  priority?: TicketPriority;
  subject?: string;
  assigned_to?: string | null;
  queue_id?: string | null;
  tags?: string[];
  sla_due_at?: string | null;
}

export interface CreateResponseInput {
  content: string;
  channel?: string;
  is_internal?: boolean;
}

export interface InboxFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  assigned_to?: string;
  queue_id?: string;
  unassigned?: boolean;
  sla_breached?: boolean;
  customer_platform?: string;
  search?: string;
  sort_by?: 'created_at' | 'updated_at' | 'priority' | 'sla_due_at';
  sort_order?: 'asc' | 'desc';
}

export interface InboxPagination {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

export interface UseSocialInboxOptions {
  businessUnitId?: string | null;
  autoFetch?: boolean;
  initialFilters?: InboxFilters;
}

// ============================================
// Hook
// ============================================

export function useSocialInbox({
  businessUnitId,
  autoFetch = true,
  initialFilters = {},
}: UseSocialInboxOptions = {}) {
  const [tickets, setTickets] = useState<TicketWithMention[]>([]);
  const [stats, setStats] = useState<InboxStats | null>(null);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [macros, setMacros] = useState<Macro[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<InboxFilters>(initialFilters);
  const [pagination, setPagination] = useState<InboxPagination>({
    limit: 50,
    offset: 0,
    total: 0,
    hasMore: false,
  });

  // Get current user id
  const getUserId = useCallback(async (): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  }, []);

  // Fetch tickets
  const fetchTickets = useCallback(
    async (resetOffset = false) => {
      if (!businessUnitId) return;

      setLoading(true);
      setError(null);

      try {
        const offset = resetOffset ? 0 : pagination.offset;
        const limit = pagination.limit;

        let query = supabase
          .from('social_media_inbox_tickets')
          .select('*', { count: 'exact' })
          .order(filters.sort_by || 'created_at', {
            ascending: filters.sort_order === 'asc',
          })
          .range(offset, offset + limit - 1);

        if (filters.status) query = query.eq('status', filters.status);
        if (filters.priority) query = query.eq('priority', filters.priority);
        if (filters.assigned_to) query = query.eq('assigned_to', filters.assigned_to);
        if (filters.queue_id) query = query.eq('queue_id', filters.queue_id);
        if (filters.unassigned) query = query.is('assigned_to', null);

        const { data, error: queryError, count } = await query;

        if (queryError) throw new Error(queryError.message);

        setTickets((data ?? []) as TicketWithMention[]);
        setPagination((prev) => ({
          ...prev,
          offset,
          total: count ?? 0,
          hasMore: (data?.length ?? 0) >= limit,
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    },
    [businessUnitId, filters, pagination.offset, pagination.limit]
  );

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!businessUnitId) return;

    try {
      const statuses: TicketStatus[] = ['open', 'pending', 'resolved', 'closed'];
      const counts: Record<string, number> = {};

      for (const status of statuses) {
        const { count } = await supabase
          .from('social_media_inbox_tickets')
          .select('*', { count: 'exact', head: true })
          .eq('status', status);
        counts[status] = count ?? 0;
      }

      const { count: total } = await supabase
        .from('social_media_inbox_tickets')
        .select('*', { count: 'exact', head: true });

      const now = new Date().toISOString();
      const { count: overdue } = await supabase
        .from('social_media_inbox_tickets')
        .select('*', { count: 'exact', head: true })
        .not('sla_due_at', 'is', null)
        .lt('sla_due_at', now)
        .not('status', 'in', '("resolved","closed")');

      setStats({
        total: total ?? 0,
        open: counts['open'] ?? 0,
        pending: counts['pending'] ?? 0,
        resolved: counts['resolved'] ?? 0,
        closed: counts['closed'] ?? 0,
        overdue: overdue ?? 0,
      });
    } catch (err) {
      console.error('Failed to fetch inbox stats:', err);
    }
  }, [businessUnitId]);

  // Fetch queues
  const fetchQueues = useCallback(async () => {
    if (!businessUnitId) return;

    try {
      const { data, error: queryError } = await supabase
        .from('social_media_inbox_queues')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (queryError) throw new Error(queryError.message);
      setQueues((data ?? []) as Queue[]);
    } catch (err) {
      console.error('Failed to fetch queues:', err);
    }
  }, [businessUnitId]);

  // Fetch macros
  const fetchMacros = useCallback(async () => {
    if (!businessUnitId) return;

    try {
      const { data, error: queryError } = await supabase
        .from('social_media_inbox_macros')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (queryError) throw new Error(queryError.message);
      setMacros((data ?? []) as Macro[]);
    } catch (err) {
      console.error('Failed to fetch macros:', err);
    }
  }, [businessUnitId]);

  // Get single ticket
  const getTicket = useCallback(
    async (ticketId: string): Promise<TicketWithMention | null> => {
      try {
        const { data, error: queryError } = await supabase
          .from('social_media_inbox_tickets')
          .select('*')
          .eq('id', ticketId)
          .single();

        if (queryError) throw new Error(queryError.message);
        return data as TicketWithMention | null;
      } catch (err) {
        console.error('Failed to fetch ticket:', err);
        return null;
      }
    },
    []
  );

  // Create ticket
  const createTicket = useCallback(
    async (input: CreateTicketInput): Promise<Ticket | null> => {
      try {
        const userId = await getUserId();
        if (!userId) throw new Error('User not authenticated');

        const { data, error: insertError } = await supabase
          .from('social_media_inbox_tickets')
          .insert({
            ...input,
            user_id: userId,
            status: input.status ?? 'open',
            priority: input.priority ?? 'medium',
          })
          .select()
          .single();

        if (insertError) throw new Error(insertError.message);

        await fetchTickets(true);
        await fetchStats();
        return data as Ticket;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create ticket');
        return null;
      }
    },
    [getUserId, fetchTickets, fetchStats]
  );

  // Update ticket
  const updateTicket = useCallback(
    async (ticketId: string, input: UpdateTicketInput): Promise<Ticket | null> => {
      try {
        const userId = await getUserId();
        if (!userId) throw new Error('User not authenticated');

        const { data, error: updateError } = await supabase
          .from('social_media_inbox_tickets')
          .update({ ...input, updated_at: new Date().toISOString() })
          .eq('id', ticketId)
          .eq('user_id', userId)
          .select()
          .single();

        if (updateError) throw new Error(updateError.message);

        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, ...(data as Ticket) } : t))
        );
        await fetchStats();
        return data as Ticket;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update ticket');
        return null;
      }
    },
    [getUserId, fetchStats]
  );

  // Assign ticket
  const assignTicket = useCallback(
    async (ticketId: string, userId: string | null): Promise<boolean> => {
      try {
        const currentUserId = await getUserId();
        if (!currentUserId) throw new Error('User not authenticated');

        const { error: updateError } = await supabase
          .from('social_media_inbox_tickets')
          .update({ assigned_to: userId, updated_at: new Date().toISOString() })
          .eq('id', ticketId)
          .eq('user_id', currentUserId);

        if (updateError) throw new Error(updateError.message);

        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, assigned_to: userId } : t))
        );
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to assign ticket');
        return false;
      }
    },
    [getUserId]
  );

  // Resolve ticket
  const resolveTicket = useCallback(
    async (ticketId: string, notes?: string): Promise<boolean> => {
      try {
        const userId = await getUserId();
        if (!userId) throw new Error('User not authenticated');

        const now = new Date().toISOString();
        const { error: updateError } = await supabase
          .from('social_media_inbox_tickets')
          .update({
            status: 'resolved',
            resolved_at: now,
            resolution_notes: notes ?? null,
            updated_at: now,
          })
          .eq('id', ticketId)
          .eq('user_id', userId);

        if (updateError) throw new Error(updateError.message);

        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticketId
              ? { ...t, status: 'resolved' as TicketStatus, resolved_at: now }
              : t
          )
        );
        await fetchStats();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to resolve ticket');
        return false;
      }
    },
    [getUserId, fetchStats]
  );

  // Send response
  const sendResponse = useCallback(
    async (ticketId: string, input: CreateResponseInput): Promise<TicketResponse | null> => {
      try {
        const userId = await getUserId();
        if (!userId) throw new Error('User not authenticated');

        const { data, error: insertError } = await supabase
          .from('social_media_inbox_responses')
          .insert({
            ticket_id: ticketId,
            user_id: userId,
            content: input.content,
            channel: input.channel ?? null,
            is_internal: input.is_internal ?? false,
          })
          .select()
          .single();

        if (insertError) throw new Error(insertError.message);

        const now = new Date().toISOString();
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  first_response_at: t.first_response_at || now,
                  responses_count: (t.responses_count || 0) + 1,
                  last_response_at: now,
                }
              : t
          )
        );
        return data as TicketResponse;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send response');
        return null;
      }
    },
    [getUserId]
  );

  // Get ticket responses
  const getResponses = useCallback(
    async (ticketId: string): Promise<TicketResponse[]> => {
      try {
        const { data, error: queryError } = await supabase
          .from('social_media_inbox_responses')
          .select('*')
          .eq('ticket_id', ticketId)
          .order('created_at', { ascending: true });

        if (queryError) throw new Error(queryError.message);
        return (data ?? []) as TicketResponse[];
      } catch (err) {
        console.error('Failed to fetch responses:', err);
        return [];
      }
    },
    []
  );

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<InboxFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, offset: 0 }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({});
    setPagination((prev) => ({ ...prev, offset: 0 }));
  }, []);

  // Load more
  const loadMore = useCallback(() => {
    if (pagination.hasMore && !loading) {
      setPagination((prev) => ({
        ...prev,
        offset: prev.offset + prev.limit,
      }));
    }
  }, [pagination.hasMore, loading]);

  // Refresh all data
  const refresh = useCallback(async () => {
    await Promise.all([fetchTickets(true), fetchStats(), fetchQueues(), fetchMacros()]);
  }, [fetchTickets, fetchStats, fetchQueues, fetchMacros]);

  // Initial fetch
  useEffect(() => {
    if (autoFetch && businessUnitId) {
      fetchTickets(true);
      fetchStats();
      fetchQueues();
      fetchMacros();
    }
  }, [autoFetch, businessUnitId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch when filters change
  useEffect(() => {
    if (autoFetch && businessUnitId) {
      fetchTickets(true);
    }
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    tickets,
    stats,
    queues,
    macros,
    loading,
    error,
    filters,
    pagination,

    fetchTickets,
    fetchStats,
    getTicket,
    createTicket,
    updateTicket,
    assignTicket,
    resolveTicket,
    sendResponse,
    getResponses,

    updateFilters,
    clearFilters,
    loadMore,
    refresh,
  };
}

export default useSocialInbox;
