/**
 * Social Visual Hook
 *
 * Provides data fetching and mutations for the Visual Listening (logo detection) system.
 * Queries Supabase directly on the social_media_visual_detections table.
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ============================================
// Types
// ============================================

export type DetectionType = 'logo' | 'product' | 'person' | 'scene' | 'text' | 'other';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface VisualDetection {
  id: string;
  user_id: string;
  mention_id?: string | null;
  image_url: string;
  detection_type?: DetectionType | null;
  our_brand_detected?: boolean;
  competitor_detected?: boolean;
  risk_score?: number | null;
  risk_level?: RiskLevel | null;
  status: ProcessingStatus;
  processed_at?: string | null;
  reviewed?: boolean;
  labels?: string[];
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface VisualStats {
  total_detections: number;
  our_brand_detections: number;
  competitor_detections: number;
  high_risk_detections: number;
  pending_review: number;
  processing_queue: number;
}

export interface VisualFilters {
  mention_id?: string;
  detection_type?: DetectionType;
  our_brand_detected?: boolean;
  competitor_detected?: boolean;
  min_risk_score?: number;
  risk_level?: RiskLevel;
  status?: ProcessingStatus;
  date_from?: string;
  date_to?: string;
  sort_by?: 'created_at' | 'risk_score' | 'processed_at';
  sort_order?: 'asc' | 'desc';
}

export interface VisualPagination {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

export interface UseSocialVisualOptions {
  businessUnitId?: string | null;
  autoFetch?: boolean;
  initialFilters?: VisualFilters;
}

// ============================================
// Hook
// ============================================

export function useSocialVisual({
  businessUnitId,
  autoFetch = true,
  initialFilters = {},
}: UseSocialVisualOptions = {}) {
  const [detections, setDetections] = useState<VisualDetection[]>([]);
  const [stats, setStats] = useState<VisualStats | null>(null);
  const [selectedDetection, setSelectedDetection] = useState<VisualDetection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<VisualFilters>(initialFilters);
  const [pagination, setPagination] = useState<VisualPagination>({
    limit: 50,
    offset: 0,
    total: 0,
    hasMore: false,
  });

  const getUserId = useCallback(async (): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  }, []);

  // Fetch detections
  const fetchDetections = useCallback(
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
          .from('social_media_visual_detections')
          .select('*', { count: 'exact' })
          .order(sortColumn, { ascending: sortAscending })
          .range(offset, offset + limit - 1);

        if (filters.mention_id) query = query.eq('mention_id', filters.mention_id);
        if (filters.detection_type) query = query.eq('detection_type', filters.detection_type);
        if (filters.our_brand_detected !== undefined)
          query = query.eq('our_brand_detected', filters.our_brand_detected);
        if (filters.competitor_detected !== undefined)
          query = query.eq('competitor_detected', filters.competitor_detected);
        if (filters.min_risk_score !== undefined)
          query = query.gte('risk_score', filters.min_risk_score);
        if (filters.risk_level) query = query.eq('risk_level', filters.risk_level);
        if (filters.status) query = query.eq('status', filters.status);
        if (filters.date_from) query = query.gte('created_at', filters.date_from);
        if (filters.date_to) query = query.lte('created_at', filters.date_to);

        const { data, error: queryError, count } = await query;

        if (queryError) throw new Error(queryError.message);

        setDetections((data ?? []) as VisualDetection[]);
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

  // Fetch stats separately
  const fetchStats = useCallback(async () => {
    if (!businessUnitId) return;

    try {
      const [
        { count: total },
        { count: ourBrand },
        { count: competitor },
        { count: highRisk },
        { count: pendingReview },
        { count: processingQueue },
      ] = await Promise.all([
        supabase
          .from('social_media_visual_detections')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('social_media_visual_detections')
          .select('*', { count: 'exact', head: true })
          .eq('our_brand_detected', true),
        supabase
          .from('social_media_visual_detections')
          .select('*', { count: 'exact', head: true })
          .eq('competitor_detected', true),
        supabase
          .from('social_media_visual_detections')
          .select('*', { count: 'exact', head: true })
          .in('risk_level', ['high', 'critical']),
        supabase
          .from('social_media_visual_detections')
          .select('*', { count: 'exact', head: true })
          .eq('reviewed', false)
          .eq('status', 'completed'),
        supabase
          .from('social_media_visual_detections')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
      ]);

      setStats({
        total_detections: total ?? 0,
        our_brand_detections: ourBrand ?? 0,
        competitor_detections: competitor ?? 0,
        high_risk_detections: highRisk ?? 0,
        pending_review: pendingReview ?? 0,
        processing_queue: processingQueue ?? 0,
      });
    } catch (err) {
      console.error('Failed to fetch visual stats:', err);
    }
  }, [businessUnitId]);

  // Get single detection
  const getDetection = useCallback(
    async (detectionId: string): Promise<VisualDetection | null> => {
      try {
        const { data, error: queryError } = await supabase
          .from('social_media_visual_detections')
          .select('*')
          .eq('id', detectionId)
          .single();

        if (queryError) throw new Error(queryError.message);
        return data as VisualDetection | null;
      } catch (err) {
        console.error('Failed to fetch detection:', err);
        return null;
      }
    },
    []
  );

  // Analyze image (insert a detection record for processing)
  const analyzeImage = useCallback(
    async (
      imageUrl: string,
      mentionId?: string,
      options?: { queue?: boolean; priority?: number }
    ): Promise<VisualDetection | null> => {
      try {
        const userId = await getUserId();
        if (!userId) throw new Error('User not authenticated');

        const { data, error: insertError } = await supabase
          .from('social_media_visual_detections')
          .insert({
            user_id: userId,
            image_url: imageUrl,
            mention_id: mentionId ?? null,
            status: (options?.queue ? 'pending' : 'processing') as ProcessingStatus,
            reviewed: false,
            metadata: options?.priority ? { priority: options.priority } : {},
          })
          .select()
          .single();

        if (insertError) throw new Error(insertError.message);

        if (!options?.queue) {
          await fetchDetections(true);
        }

        return data as VisualDetection;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to analyze image');
        return null;
      }
    },
    [getUserId, fetchDetections]
  );

  // Reprocess detection
  const reprocessDetection = useCallback(
    async (detectionId: string): Promise<boolean> => {
      try {
        const { error: updateError } = await supabase
          .from('social_media_visual_detections')
          .update({ status: 'processing' as ProcessingStatus, updated_at: new Date().toISOString() })
          .eq('id', detectionId);

        if (updateError) throw new Error(updateError.message);

        setDetections((prev) =>
          prev.map((d) =>
            d.id === detectionId ? { ...d, status: 'processing' as ProcessingStatus } : d
          )
        );
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to reprocess detection');
        return false;
      }
    },
    []
  );

  // Mark as reviewed
  const markAsReviewed = useCallback(
    async (detectionId: string): Promise<boolean> => {
      try {
        const { data, error: updateError } = await supabase
          .from('social_media_visual_detections')
          .update({ reviewed: true, updated_at: new Date().toISOString() })
          .eq('id', detectionId)
          .select()
          .single();

        if (updateError) throw new Error(updateError.message);

        setDetections((prev) =>
          prev.map((d) => (d.id === detectionId ? { ...d, ...(data as VisualDetection) } : d))
        );
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to mark as reviewed');
        return false;
      }
    },
    []
  );

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<VisualFilters>) => {
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
    await Promise.all([fetchDetections(true), fetchStats()]);
  }, [fetchDetections, fetchStats]);

  // Initial fetch
  useEffect(() => {
    if (autoFetch && businessUnitId) {
      fetchDetections(true);
    }
  }, [autoFetch, businessUnitId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch when filters change
  useEffect(() => {
    if (autoFetch && businessUnitId) {
      fetchDetections(true);
    }
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    detections,
    stats,
    selectedDetection,
    loading,
    error,
    filters,
    pagination,

    setSelectedDetection,

    fetchDetections,
    fetchStats,
    getDetection,
    analyzeImage,
    reprocessDetection,
    markAsReviewed,

    updateFilters,
    clearFilters,
    loadMore,
    refresh,
  };
}

export default useSocialVisual;
