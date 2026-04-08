import { useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ============================================
// Types
// ============================================

interface HubStats {
  mentions: {
    today: number;
    change: number;
  };
  sentiment: {
    average: number;
    change: number;
  };
  alerts: {
    active: number;
  };
  posts: {
    scheduled: number;
  };
}

interface Connector {
  id: string;
  user_id: string;
  platform: string;
  platform_account_id?: string;
  platform_account_name?: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_sync_at?: string;
  [key: string]: unknown;
}

interface Mention {
  id: string;
  user_id: string;
  platform: string;
  content: string;
  author?: Record<string, unknown>;
  sentiment?: string;
  published_at: string;
  created_at: string;
  [key: string]: unknown;
}

interface CrisisAlert {
  id: string;
  user_id: string;
  type: string;
  severity: string;
  title: string;
  description?: string;
  status: string;
  acknowledged_at?: string;
  resolved_at?: string;
  created_at: string;
  [key: string]: unknown;
}

interface Topic {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  keywords?: string[];
  is_active: boolean;
  created_at: string;
  [key: string]: unknown;
}

interface SocialMediaHubData {
  stats: HubStats | null;
  connectors: Connector[];
  recentMentions: Mention[];
  alerts: CrisisAlert[];
  topics: Topic[];
  isLoading: boolean;
  error: string | null;
}

const SOCIAL_PLATFORMS = [
  'instagram',
  'linkedin',
  'tiktok',
  'twitter',
  'youtube',
  'google_business',
  'facebook',
  'meta',   // Meta OAuth covers Facebook + Instagram
  'google', // Google OAuth covers Google Business
];

const defaultStats: HubStats = {
  mentions: { today: 0, change: 0 },
  sentiment: { average: 0, change: 0 },
  alerts: { active: 0 },
  posts: { scheduled: 0 },
};

interface UseSocialMediaHubOptions {
  businessUnitId?: string | null;
}

const queryConfig = {
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
  retry: 2,
  refetchOnWindowFocus: false,
};

export function useSocialMediaHub(options: UseSocialMediaHubOptions | string | null) {
  const queryClient = useQueryClient();

  const normalizedOptions: UseSocialMediaHubOptions =
    typeof options === 'string' || options === null
      ? { businessUnitId: options }
      : options;

  const businessUnitId = normalizedOptions.businessUnitId ?? null;
  const enabled = !!businessUnitId;

  // Overview stats query — aggregate from mentions, alerts, posts
  const overviewQuery = useQuery({
    queryKey: ['social-media', 'overview'],
    queryFn: async (): Promise<HubStats> => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayIso = today.toISOString();

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayIso = yesterday.toISOString();

      // Mentions today
      const { count: mentionsToday } = await supabase
        .from('social_media_mentions')
        .select('*', { count: 'exact', head: true })
        .gte('published_at', todayIso);

      // Mentions yesterday
      const { count: mentionsYesterday } = await supabase
        .from('social_media_mentions')
        .select('*', { count: 'exact', head: true })
        .gte('published_at', yesterdayIso)
        .lt('published_at', todayIso);

      const mentionsTodayVal = mentionsToday ?? 0;
      const mentionsYesterdayVal = mentionsYesterday ?? 0;
      const mentionsChange =
        mentionsYesterdayVal > 0
          ? Math.round(((mentionsTodayVal - mentionsYesterdayVal) / mentionsYesterdayVal) * 100)
          : 0;

      // Average sentiment from recent mentions
      const { data: sentimentData } = await supabase
        .from('social_media_mentions')
        .select('sentiment_score')
        .not('sentiment_score', 'is', null)
        .order('published_at', { ascending: false })
        .limit(100);

      const sentimentScores = (sentimentData ?? [])
        .map((r: { sentiment_score: number | null }) => r.sentiment_score)
        .filter((s): s is number => s !== null);
      const avgSentiment =
        sentimentScores.length > 0
          ? sentimentScores.reduce((a: number, b: number) => a + b, 0) / sentimentScores.length
          : 0;

      // Active alerts (unacknowledged)
      const { count: activeAlerts } = await supabase
        .from('social_media_crisis_alerts')
        .select('*', { count: 'exact', head: true })
        .is('acknowledged_at', null);

      // Scheduled posts
      const { count: scheduledPosts } = await supabase
        .from('social_media_posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'scheduled');

      return {
        mentions: {
          today: mentionsTodayVal,
          change: mentionsChange,
        },
        sentiment: {
          average: Math.round(avgSentiment * 100) / 100,
          change: 0,
        },
        alerts: {
          active: activeAlerts ?? 0,
        },
        posts: {
          scheduled: scheduledPosts ?? 0,
        },
      };
    },
    enabled,
    ...queryConfig,
    select: (data) => data ?? defaultStats,
  });

  // Connectors query — from ads_integrations filtered by social platforms
  const connectorsQuery = useQuery({
    queryKey: ['social-media', 'connectors'],
    queryFn: async (): Promise<Connector[]> => {
      const { data, error } = await supabase
        .from('ads_integrations')
        .select('*')
        .in('platform', SOCIAL_PLATFORMS);

      if (error) throw new Error(error.message);
      return (data ?? []) as Connector[];
    },
    enabled,
    ...queryConfig,
    select: (data) => data ?? [],
  });

  // Recent mentions query
  const mentionsQuery = useQuery({
    queryKey: ['social-media', 'mentions', 'recent'],
    queryFn: async (): Promise<Mention[]> => {
      const { data, error } = await supabase
        .from('social_media_mentions')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(5);

      if (error) throw new Error(error.message);
      return (data ?? []) as Mention[];
    },
    enabled,
    ...queryConfig,
    select: (data) => data ?? [],
  });

  // Alerts query — unacknowledged only
  const alertsQuery = useQuery({
    queryKey: ['social-media', 'alerts', 'active'],
    queryFn: async (): Promise<CrisisAlert[]> => {
      const { data, error } = await supabase
        .from('social_media_crisis_alerts')
        .select('*')
        .is('acknowledged_at', null)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw new Error(error.message);
      return (data ?? []) as CrisisAlert[];
    },
    enabled,
    ...queryConfig,
    select: (data) => data ?? [],
  });

  // Topics query
  const topicsQuery = useQuery({
    queryKey: ['social-media', 'topics'],
    queryFn: async (): Promise<Topic[]> => {
      const { data, error } = await supabase
        .from('social_media_topics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw new Error(error.message);
      return (data ?? []) as Topic[];
    },
    enabled,
    ...queryConfig,
    select: (data) => data ?? [],
  });

  const isLoading =
    overviewQuery.isLoading ||
    connectorsQuery.isLoading ||
    mentionsQuery.isLoading ||
    alertsQuery.isLoading ||
    topicsQuery.isLoading;

  const error = useMemo(() => {
    const errors = [
      overviewQuery.error,
      connectorsQuery.error,
      mentionsQuery.error,
      alertsQuery.error,
      topicsQuery.error,
    ].filter(Boolean);

    if (errors.length === 0) return null;
    return 'Erro ao carregar dados do Social Media';
  }, [
    overviewQuery.error,
    connectorsQuery.error,
    mentionsQuery.error,
    alertsQuery.error,
    topicsQuery.error,
  ]);

  const refresh = useCallback(() => {
    if (!businessUnitId) return;
    queryClient.invalidateQueries({ queryKey: ['social-media', 'overview'] });
    queryClient.invalidateQueries({ queryKey: ['social-media', 'connectors'] });
    queryClient.invalidateQueries({ queryKey: ['social-media', 'mentions', 'recent'] });
    queryClient.invalidateQueries({ queryKey: ['social-media', 'alerts', 'active'] });
    queryClient.invalidateQueries({ queryKey: ['social-media', 'topics'] });
  }, [queryClient, businessUnitId]);

  const data: SocialMediaHubData = useMemo(
    () => ({
      stats: overviewQuery.data ?? null,
      connectors: connectorsQuery.data ?? [],
      recentMentions: mentionsQuery.data ?? [],
      alerts: alertsQuery.data ?? [],
      topics: topicsQuery.data ?? [],
      isLoading,
      error,
    }),
    [
      overviewQuery.data,
      connectorsQuery.data,
      mentionsQuery.data,
      alertsQuery.data,
      topicsQuery.data,
      isLoading,
      error,
    ]
  );

  return {
    ...data,
    refresh,
  };
}
