/**
 * Social Sources Hook
 *
 * Provides data fetching and mutations for the Social Media Sources (RSS/News) system.
 * Queries Supabase directly on social_media_sources and social_media_source_items tables.
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ============================================
// Types
// ============================================

export type SourceType = 'rss' | 'atom' | 'api' | 'scraper' | 'manual';
export type SourceCategory =
  | 'news'
  | 'blog'
  | 'forum'
  | 'social'
  | 'review'
  | 'academic'
  | 'government'
  | 'other';
export type SourceStatus = 'active' | 'paused' | 'error' | 'pending';
export type ItemSentiment = 'positive' | 'neutral' | 'negative';

export interface MediaSource {
  id: string;
  user_id: string;
  name: string;
  url: string;
  type: SourceType;
  category?: SourceCategory;
  tier?: number;
  status: SourceStatus;
  is_verified?: boolean;
  language?: string;
  last_checked_at?: string | null;
  error_message?: string | null;
  config?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface SourceItem {
  id: string;
  source_id: string;
  user_id: string;
  title?: string | null;
  content?: string | null;
  url?: string | null;
  author?: string | null;
  sentiment?: ItemSentiment | null;
  relevance_score?: number | null;
  impact_score?: number | null;
  is_processed?: boolean;
  published_at?: string | null;
  discovered_at: string;
  created_at: string;
  [key: string]: unknown;
}

export interface CreateMediaSourceInput {
  name: string;
  url: string;
  type: SourceType;
  category?: SourceCategory;
  tier?: number;
  language?: string;
  config?: Record<string, unknown>;
}

export interface UpdateMediaSourceInput {
  name?: string;
  url?: string;
  type?: SourceType;
  category?: SourceCategory;
  tier?: number;
  status?: SourceStatus;
  language?: string;
  config?: Record<string, unknown>;
}

export interface SourcesFilters {
  type?: SourceType;
  category?: SourceCategory;
  tier?: number;
  status?: SourceStatus;
  is_verified?: boolean;
  language?: string;
  search?: string;
  sort_by?: 'name' | 'created_at' | 'last_checked_at' | 'tier';
  sort_order?: 'asc' | 'desc';
}

export interface ItemsFilters {
  source_id?: string;
  sentiment?: ItemSentiment;
  min_relevance?: number;
  min_impact?: number;
  is_processed?: boolean;
  date_from?: string;
  date_to?: string;
  search?: string;
  sort_by?: 'published_at' | 'discovered_at' | 'relevance_score' | 'impact_score';
  sort_order?: 'asc' | 'desc';
}

export interface SourcesPagination {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

export interface SourceStats {
  total_sources: number;
  active_sources: number;
  sources_in_error: number;
  total_items: number;
  items_today: number;
  items_pending_processing: number;
}

export interface UseSocialSourcesOptions {
  businessUnitId?: string | null;
  autoFetch?: boolean;
  initialFilters?: SourcesFilters;
}

// ============================================
// Hook
// ============================================

export function useSocialSources({
  businessUnitId,
  autoFetch = true,
  initialFilters = {},
}: UseSocialSourcesOptions = {}) {
  const [sources, setSources] = useState<MediaSource[]>([]);
  const [items, setItems] = useState<SourceItem[]>([]);
  const [stats, setStats] = useState<SourceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SourcesFilters>(initialFilters);
  const [itemsFilters, setItemsFilters] = useState<ItemsFilters>({});
  const [pagination, setPagination] = useState<SourcesPagination>({
    limit: 50,
    offset: 0,
    total: 0,
    hasMore: false,
  });
  const [itemsPagination, setItemsPagination] = useState<SourcesPagination>({
    limit: 20,
    offset: 0,
    total: 0,
    hasMore: false,
  });

  const getUserId = useCallback(async (): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  }, []);

  // Fetch sources
  const fetchSources = useCallback(
    async (resetOffset = false) => {
      if (!businessUnitId) return;

      setLoading(true);
      setError(null);

      try {
        const offset = resetOffset ? 0 : pagination.offset;
        const limit = pagination.limit;

        const sortColumn = filters.sort_by || 'created_at';
        const sortAscending = filters.sort_order === 'asc';

        let query = supabase
          .from('social_media_sources')
          .select('*', { count: 'exact' })
          .order(sortColumn, { ascending: sortAscending })
          .range(offset, offset + limit - 1);

        if (filters.type) query = query.eq('type', filters.type);
        if (filters.category) query = query.eq('category', filters.category);
        if (filters.tier !== undefined) query = query.eq('tier', filters.tier);
        if (filters.status) query = query.eq('status', filters.status);
        if (filters.is_verified !== undefined) query = query.eq('is_verified', filters.is_verified);
        if (filters.language) query = query.eq('language', filters.language);

        const { data, error: queryError, count } = await query;

        if (queryError) throw new Error(queryError.message);

        setSources((data ?? []) as MediaSource[]);
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

  // Fetch items
  const fetchItems = useCallback(
    async (resetOffset = false) => {
      if (!businessUnitId) return;

      try {
        const offset = resetOffset ? 0 : itemsPagination.offset;
        const limit = itemsPagination.limit;

        const sortColumn = itemsFilters.sort_by || 'discovered_at';
        const sortAscending = itemsFilters.sort_order === 'asc';

        let query = supabase
          .from('social_media_source_items')
          .select('*', { count: 'exact' })
          .order(sortColumn, { ascending: sortAscending })
          .range(offset, offset + limit - 1);

        if (itemsFilters.source_id) query = query.eq('source_id', itemsFilters.source_id);
        if (itemsFilters.sentiment) query = query.eq('sentiment', itemsFilters.sentiment);
        if (itemsFilters.min_relevance !== undefined)
          query = query.gte('relevance_score', itemsFilters.min_relevance);
        if (itemsFilters.min_impact !== undefined)
          query = query.gte('impact_score', itemsFilters.min_impact);
        if (itemsFilters.is_processed !== undefined)
          query = query.eq('is_processed', itemsFilters.is_processed);
        if (itemsFilters.date_from) query = query.gte('published_at', itemsFilters.date_from);
        if (itemsFilters.date_to) query = query.lte('published_at', itemsFilters.date_to);

        const { data, error: queryError, count } = await query;

        if (queryError) throw new Error(queryError.message);

        setItems((data ?? []) as SourceItem[]);
        setItemsPagination((prev) => ({
          ...prev,
          offset,
          total: count ?? 0,
          hasMore: (data?.length ?? 0) >= limit,
        }));
      } catch (err) {
        console.error('Failed to fetch items:', err);
      }
    },
    [businessUnitId, itemsFilters, itemsPagination.offset, itemsPagination.limit]
  );

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!businessUnitId) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayIso = today.toISOString();

      const [
        { count: totalSources },
        { count: activeSources },
        { count: errorSources },
        { count: totalItems },
        { count: itemsToday },
        { count: itemsPending },
      ] = await Promise.all([
        supabase.from('social_media_sources').select('*', { count: 'exact', head: true }),
        supabase
          .from('social_media_sources')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active'),
        supabase
          .from('social_media_sources')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'error'),
        supabase.from('social_media_source_items').select('*', { count: 'exact', head: true }),
        supabase
          .from('social_media_source_items')
          .select('*', { count: 'exact', head: true })
          .gte('discovered_at', todayIso),
        supabase
          .from('social_media_source_items')
          .select('*', { count: 'exact', head: true })
          .eq('is_processed', false),
      ]);

      setStats({
        total_sources: totalSources ?? 0,
        active_sources: activeSources ?? 0,
        sources_in_error: errorSources ?? 0,
        total_items: totalItems ?? 0,
        items_today: itemsToday ?? 0,
        items_pending_processing: itemsPending ?? 0,
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, [businessUnitId]);

  // Get single source
  const getSource = useCallback(
    async (sourceId: string): Promise<MediaSource | null> => {
      try {
        const { data, error: queryError } = await supabase
          .from('social_media_sources')
          .select('*')
          .eq('id', sourceId)
          .single();

        if (queryError) throw new Error(queryError.message);
        return data as MediaSource | null;
      } catch (err) {
        console.error('Failed to fetch source:', err);
        return null;
      }
    },
    []
  );

  // Create source
  const createSource = useCallback(
    async (input: CreateMediaSourceInput): Promise<MediaSource | null> => {
      try {
        const userId = await getUserId();
        if (!userId) throw new Error('User not authenticated');

        const { data, error: insertError } = await supabase
          .from('social_media_sources')
          .insert({ ...input, user_id: userId, status: 'pending' as SourceStatus })
          .select()
          .single();

        if (insertError) throw new Error(insertError.message);

        await fetchSources(true);
        await fetchStats();
        return data as MediaSource;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create source');
        return null;
      }
    },
    [getUserId, fetchSources, fetchStats]
  );

  // Update source
  const updateSource = useCallback(
    async (sourceId: string, input: UpdateMediaSourceInput): Promise<MediaSource | null> => {
      try {
        const { data, error: updateError } = await supabase
          .from('social_media_sources')
          .update({ ...input, updated_at: new Date().toISOString() })
          .eq('id', sourceId)
          .select()
          .single();

        if (updateError) throw new Error(updateError.message);

        setSources((prev) => prev.map((s) => (s.id === sourceId ? { ...s, ...(data as MediaSource) } : s)));
        return data as MediaSource;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update source');
        return null;
      }
    },
    []
  );

  // Delete source
  const deleteSource = useCallback(
    async (sourceId: string): Promise<boolean> => {
      try {
        const { error: deleteError } = await supabase
          .from('social_media_sources')
          .delete()
          .eq('id', sourceId);

        if (deleteError) throw new Error(deleteError.message);

        setSources((prev) => prev.filter((s) => s.id !== sourceId));
        await fetchStats();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete source');
        return false;
      }
    },
    [fetchStats]
  );

  // Refresh source (mark for re-fetch — update last_checked_at to trigger re-crawl)
  const refreshSource = useCallback(
    async (sourceId: string): Promise<boolean> => {
      try {
        const { error: updateError } = await supabase
          .from('social_media_sources')
          .update({
            status: 'active' as SourceStatus,
            last_checked_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sourceId);

        if (updateError) throw new Error(updateError.message);

        await fetchSources();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to refresh source');
        return false;
      }
    },
    [fetchSources]
  );

  // Update sources filters
  const updateSourcesFilters = useCallback((newFilters: Partial<SourcesFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, offset: 0 }));
  }, []);

  // Update items filters
  const updateItemsFilters = useCallback((newFilters: Partial<ItemsFilters>) => {
    setItemsFilters((prev) => ({ ...prev, ...newFilters }));
    setItemsPagination((prev) => ({ ...prev, offset: 0 }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({});
    setPagination((prev) => ({ ...prev, offset: 0 }));
  }, []);

  // Load more sources
  const loadMoreSources = useCallback(() => {
    if (pagination.hasMore && !loading) {
      setPagination((prev) => ({
        ...prev,
        offset: prev.offset + prev.limit,
      }));
    }
  }, [pagination.hasMore, loading]);

  // Load more items
  const loadMoreItems = useCallback(() => {
    if (itemsPagination.hasMore) {
      setItemsPagination((prev) => ({
        ...prev,
        offset: prev.offset + prev.limit,
      }));
    }
  }, [itemsPagination.hasMore]);

  // Refresh all data
  const refresh = useCallback(async () => {
    await Promise.all([fetchSources(true), fetchItems(true), fetchStats()]);
  }, [fetchSources, fetchItems, fetchStats]);

  // Initial fetch
  useEffect(() => {
    if (autoFetch && businessUnitId) {
      fetchSources(true);
      fetchItems(true);
      fetchStats();
    }
  }, [autoFetch, businessUnitId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch when filters change
  useEffect(() => {
    if (autoFetch && businessUnitId) {
      fetchSources(true);
    }
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch items when items filters change
  useEffect(() => {
    if (autoFetch && businessUnitId) {
      fetchItems(true);
    }
  }, [itemsFilters]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    sources,
    items,
    stats,
    loading,
    error,
    filters,
    itemsFilters,
    pagination,
    itemsPagination,

    fetchSources,
    getSource,
    createSource,
    updateSource,
    deleteSource,
    refreshSource,

    fetchItems,

    fetchStats,

    updateSourcesFilters,
    updateItemsFilters,
    clearFilters,
    loadMoreSources,
    loadMoreItems,
    refresh,
  };
}

export default useSocialSources;
