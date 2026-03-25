/**
 * Social Reports Hook
 *
 * Provides data fetching and mutations for the Social Reports system.
 * Queries Supabase directly on social_media_reports and social_media_report_schedules.
 * No social_media_report_templates table — returns empty array for templates.
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ============================================
// Types
// ============================================

export type ReportType = 'overview' | 'mentions' | 'sentiment' | 'competitors' | 'custom';
export type ReportStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ReportFormat = 'pdf' | 'csv' | 'xlsx' | 'json';
export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly';

export interface Report {
  id: string;
  user_id: string;
  name: string;
  type: ReportType;
  status: ReportStatus;
  format: ReportFormat;
  config?: Record<string, unknown>;
  file_url?: string | null;
  generated_at?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface ReportSchedule {
  id: string;
  user_id: string;
  name: string;
  report_type: ReportType;
  frequency: ScheduleFrequency;
  is_active: boolean;
  next_run_at?: string | null;
  last_run_at?: string | null;
  config?: Record<string, unknown>;
  recipients?: string[];
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface ReportTemplate {
  id: string;
  name: string;
  type: ReportType;
  config: Record<string, unknown>;
  created_at: string;
}

export interface CreateReportInput {
  name: string;
  type: ReportType;
  format?: ReportFormat;
  config?: Record<string, unknown>;
}

export interface CreateScheduleInput {
  name: string;
  report_type: ReportType;
  frequency: ScheduleFrequency;
  config?: Record<string, unknown>;
  recipients?: string[];
  is_active?: boolean;
}

export interface CreateTemplateInput {
  name: string;
  type: ReportType;
  config: Record<string, unknown>;
}

export interface ReportsFilters {
  type?: ReportType;
  status?: ReportStatus;
  format?: ReportFormat;
  created_by?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: 'created_at' | 'generated_at' | 'name';
  sort_order?: 'asc' | 'desc';
}

export interface SchedulesFilters {
  frequency?: ScheduleFrequency;
  is_active?: boolean;
}

export interface ReportsPagination {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

export interface UseSocialReportsOptions {
  businessUnitId?: string | null;
  autoFetch?: boolean;
  initialFilters?: ReportsFilters;
}

// ============================================
// Hook
// ============================================

export function useSocialReports({
  businessUnitId,
  autoFetch = true,
  initialFilters = {},
}: UseSocialReportsOptions = {}) {
  const [reports, setReports] = useState<Report[]>([]);
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [templates] = useState<ReportTemplate[]>([]); // No table — always empty
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ReportsFilters>(initialFilters);
  const [pagination, setPagination] = useState<ReportsPagination>({
    limit: 20,
    offset: 0,
    total: 0,
    hasMore: false,
  });

  const getUserId = useCallback(async (): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  }, []);

  // Fetch reports
  const fetchReports = useCallback(
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
          .from('social_media_reports')
          .select('*', { count: 'exact' })
          .order(sortColumn, { ascending: sortAscending })
          .range(offset, offset + limit - 1);

        if (filters.type) query = query.eq('type', filters.type);
        if (filters.status) query = query.eq('status', filters.status);
        if (filters.format) query = query.eq('format', filters.format);
        if (filters.created_by) query = query.eq('created_by', filters.created_by);
        if (filters.date_from) query = query.gte('created_at', filters.date_from);
        if (filters.date_to) query = query.lte('created_at', filters.date_to);

        const { data, error: queryError, count } = await query;

        if (queryError) throw new Error(queryError.message);

        setReports((data ?? []) as Report[]);
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

  // Fetch schedules
  const fetchSchedules = useCallback(
    async (schedulesFilters?: SchedulesFilters) => {
      if (!businessUnitId) return;

      try {
        let query = supabase
          .from('social_media_report_schedules')
          .select('*')
          .order('created_at', { ascending: false });

        if (schedulesFilters?.frequency) {
          query = query.eq('frequency', schedulesFilters.frequency);
        }
        if (schedulesFilters?.is_active !== undefined) {
          query = query.eq('is_active', schedulesFilters.is_active);
        }

        const { data, error: queryError } = await query;
        if (queryError) throw new Error(queryError.message);

        setSchedules((data ?? []) as ReportSchedule[]);
      } catch (err) {
        console.error('Failed to fetch schedules:', err);
      }
    },
    [businessUnitId]
  );

  // fetchTemplates is a no-op since there is no templates table
  const fetchTemplates = useCallback(async () => {
    // No social_media_report_templates table — return empty array
  }, []);

  // Get single report
  const getReport = useCallback(
    async (reportId: string): Promise<Report | null> => {
      try {
        const { data, error: queryError } = await supabase
          .from('social_media_reports')
          .select('*')
          .eq('id', reportId)
          .single();

        if (queryError) throw new Error(queryError.message);
        return data as Report | null;
      } catch (err) {
        console.error('Failed to fetch report:', err);
        return null;
      }
    },
    []
  );

  // Create report
  const createReport = useCallback(
    async (input: CreateReportInput): Promise<Report | null> => {
      try {
        const userId = await getUserId();
        if (!userId) throw new Error('User not authenticated');

        const { data, error: insertError } = await supabase
          .from('social_media_reports')
          .insert({
            ...input,
            user_id: userId,
            status: 'pending' as ReportStatus,
            format: input.format ?? 'pdf',
            created_by: userId,
          })
          .select()
          .single();

        if (insertError) throw new Error(insertError.message);

        await fetchReports(true);
        return data as Report;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create report');
        return null;
      }
    },
    [getUserId, fetchReports]
  );

  // Generate report (trigger processing — update status to processing)
  const generateReport = useCallback(
    async (reportId: string): Promise<boolean> => {
      try {
        const { error: updateError } = await supabase
          .from('social_media_reports')
          .update({
            status: 'processing' as ReportStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', reportId);

        if (updateError) throw new Error(updateError.message);

        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? { ...r, status: 'processing' as ReportStatus } : r))
        );
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate report');
        return false;
      }
    },
    []
  );

  // Delete report
  const deleteReport = useCallback(
    async (reportId: string): Promise<boolean> => {
      try {
        const { error: deleteError } = await supabase
          .from('social_media_reports')
          .delete()
          .eq('id', reportId);

        if (deleteError) throw new Error(deleteError.message);

        setReports((prev) => prev.filter((r) => r.id !== reportId));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete report');
        return false;
      }
    },
    []
  );

  // Create schedule
  const createSchedule = useCallback(
    async (input: CreateScheduleInput): Promise<ReportSchedule | null> => {
      try {
        const userId = await getUserId();
        if (!userId) throw new Error('User not authenticated');

        const { data, error: insertError } = await supabase
          .from('social_media_report_schedules')
          .insert({
            ...input,
            user_id: userId,
            is_active: input.is_active ?? true,
          })
          .select()
          .single();

        if (insertError) throw new Error(insertError.message);

        await fetchSchedules();
        return data as ReportSchedule;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create schedule');
        return null;
      }
    },
    [getUserId, fetchSchedules]
  );

  // Update schedule
  const updateSchedule = useCallback(
    async (
      scheduleId: string,
      input: Partial<CreateScheduleInput> & { is_active?: boolean }
    ): Promise<ReportSchedule | null> => {
      try {
        const { data, error: updateError } = await supabase
          .from('social_media_report_schedules')
          .update({ ...input, updated_at: new Date().toISOString() })
          .eq('id', scheduleId)
          .select()
          .single();

        if (updateError) throw new Error(updateError.message);

        setSchedules((prev) =>
          prev.map((s) => (s.id === scheduleId ? { ...s, ...(data as ReportSchedule) } : s))
        );
        return data as ReportSchedule;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update schedule');
        return null;
      }
    },
    []
  );

  // Delete schedule
  const deleteSchedule = useCallback(
    async (scheduleId: string): Promise<boolean> => {
      try {
        const { error: deleteError } = await supabase
          .from('social_media_report_schedules')
          .delete()
          .eq('id', scheduleId);

        if (deleteError) throw new Error(deleteError.message);

        setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete schedule');
        return false;
      }
    },
    []
  );

  // createTemplate is a no-op since there is no templates table
  const createTemplate = useCallback(
    async (_input: CreateTemplateInput): Promise<ReportTemplate | null> => {
      console.warn('[useSocialReports] createTemplate: no social_media_report_templates table');
      return null;
    },
    []
  );

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<ReportsFilters>) => {
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
    await Promise.all([fetchReports(true), fetchSchedules()]);
  }, [fetchReports, fetchSchedules]);

  // Initial fetch
  useEffect(() => {
    if (autoFetch && businessUnitId) {
      fetchReports(true);
      fetchSchedules();
    }
  }, [autoFetch, businessUnitId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch when filters change
  useEffect(() => {
    if (autoFetch && businessUnitId) {
      fetchReports(true);
    }
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    reports,
    schedules,
    templates,
    loading,
    error,
    filters,
    pagination,

    fetchReports,
    getReport,
    createReport,
    generateReport,
    deleteReport,

    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,

    fetchTemplates,
    createTemplate,

    updateFilters,
    clearFilters,
    loadMore,
    refresh,
  };
}

export default useSocialReports;
