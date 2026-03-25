/**
 * Social Media Analytics Hook
 *
 * Provides analytics dashboard data by querying social_media_mentions
 * and social_media_crisis_alerts directly via Supabase.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ============================================
// Types
// ============================================

interface DashboardData {
  overview: {
    total_mentions: number;
    total_reach: number;
    avg_sentiment: number;
    engagement_rate: number;
    period_comparison: {
      mentions_change_pct: number;
      reach_change_pct: number;
      sentiment_change_pct: number;
      engagement_change_pct: number;
    };
  };
  sentiment_distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  platform_breakdown: Array<{
    platform: string;
    mentions: number;
    reach: number;
    engagement: number;
    sentiment: number;
  }>;
  mentions_trend: Array<{
    date: string;
    mentions: number;
    reach: number;
  }>;
  top_topics: Array<{
    name: string;
    mentions: number;
    sentiment: number;
    trend: 'rising' | 'stable' | 'falling';
  }>;
  alerts: Array<{
    id: string;
    type: 'spike' | 'crisis' | 'opportunity';
    severity: 'low' | 'medium' | 'high';
    message: string;
    created_at: string;
  }>;
  health_score: {
    overall: number;
    components: {
      sentiment: number;
      reach: number;
      engagement: number;
      response_time: number;
    };
  };
}

interface AnalyticsState {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
}

interface UseSocialMediaAnalyticsOptions {
  businessUnitId?: string | null;
}

const emptyDashboard: DashboardData = {
  overview: {
    total_mentions: 0,
    total_reach: 0,
    avg_sentiment: 0,
    engagement_rate: 0,
    period_comparison: {
      mentions_change_pct: 0,
      reach_change_pct: 0,
      sentiment_change_pct: 0,
      engagement_change_pct: 0,
    },
  },
  sentiment_distribution: { positive: 0, neutral: 0, negative: 0 },
  platform_breakdown: [],
  mentions_trend: [],
  top_topics: [],
  alerts: [],
  health_score: {
    overall: 0,
    components: { sentiment: 0, reach: 0, engagement: 0, response_time: 0 },
  },
};

// ============================================
// Hook
// ============================================

export function useSocialMediaAnalytics(
  options: UseSocialMediaAnalyticsOptions | string | null
) {
  const normalizedOptions: UseSocialMediaAnalyticsOptions =
    typeof options === 'string' || options === null
      ? { businessUnitId: options }
      : options;

  const businessUnitId = normalizedOptions.businessUnitId ?? null;

  const [state, setState] = useState<AnalyticsState>({
    data: null,
    isLoading: false,
    error: null,
  });

  const fetchData = useCallback(async () => {
    if (!businessUnitId) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date(now);
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const thirtyDaysAgoIso = thirtyDaysAgo.toISOString();
      const sixtyDaysAgoIso = sixtyDaysAgo.toISOString();

      // Fetch recent mentions (last 30 days)
      const { data: mentionsData } = await supabase
        .from('social_media_mentions')
        .select('platform, sentiment_score, reach, engagement_count, published_at')
        .gte('published_at', thirtyDaysAgoIso)
        .order('published_at', { ascending: false })
        .limit(500);

      const mentions = mentionsData ?? [];

      // Previous period mentions (30-60 days ago)
      const { data: prevMentionsData } = await supabase
        .from('social_media_mentions')
        .select('sentiment_score, reach')
        .gte('published_at', sixtyDaysAgoIso)
        .lt('published_at', thirtyDaysAgoIso)
        .limit(500);

      const prevMentions = prevMentionsData ?? [];

      // Calculate overview
      const totalMentions = mentions.length;
      const totalReach = mentions.reduce(
        (sum: number, m: { reach?: number | null }) => sum + (m.reach ?? 0),
        0
      );
      const sentimentScores = mentions
        .map((m: { sentiment_score?: number | null }) => m.sentiment_score)
        .filter((s): s is number => s !== null && s !== undefined);
      const avgSentiment =
        sentimentScores.length > 0
          ? sentimentScores.reduce((a: number, b: number) => a + b, 0) / sentimentScores.length
          : 0;
      const totalEngagement = mentions.reduce(
        (sum: number, m: { engagement_count?: number | null }) => sum + (m.engagement_count ?? 0),
        0
      );
      const engagementRate = totalMentions > 0 ? totalEngagement / totalMentions : 0;

      // Previous period metrics
      const prevTotal = prevMentions.length;
      const prevReach = prevMentions.reduce(
        (sum: number, m: { reach?: number | null }) => sum + (m.reach ?? 0),
        0
      );
      const prevSentimentScores = prevMentions
        .map((m: { sentiment_score?: number | null }) => m.sentiment_score)
        .filter((s): s is number => s !== null && s !== undefined);
      const prevAvgSentiment =
        prevSentimentScores.length > 0
          ? prevSentimentScores.reduce((a: number, b: number) => a + b, 0) /
            prevSentimentScores.length
          : 0;

      const pct = (curr: number, prev: number) =>
        prev > 0 ? Math.round(((curr - prev) / prev) * 100) : 0;

      // Sentiment distribution
      const positive = mentions.filter(
        (m: { sentiment_score?: number | null }) => (m.sentiment_score ?? 0) > 0.2
      ).length;
      const negative = mentions.filter(
        (m: { sentiment_score?: number | null }) => (m.sentiment_score ?? 0) < -0.2
      ).length;
      const neutral = totalMentions - positive - negative;

      // Platform breakdown
      const platformMap: Record<
        string,
        { mentions: number; reach: number; engagement: number; sentimentSum: number; sentimentCount: number }
      > = {};
      for (const m of mentions as Array<{
        platform?: string | null;
        reach?: number | null;
        engagement_count?: number | null;
        sentiment_score?: number | null;
      }>) {
        const platform = m.platform ?? 'unknown';
        if (!platformMap[platform]) {
          platformMap[platform] = { mentions: 0, reach: 0, engagement: 0, sentimentSum: 0, sentimentCount: 0 };
        }
        platformMap[platform].mentions += 1;
        platformMap[platform].reach += m.reach ?? 0;
        platformMap[platform].engagement += m.engagement_count ?? 0;
        if (m.sentiment_score !== null && m.sentiment_score !== undefined) {
          platformMap[platform].sentimentSum += m.sentiment_score;
          platformMap[platform].sentimentCount += 1;
        }
      }
      const platform_breakdown = Object.entries(platformMap).map(([platform, stats]) => ({
        platform,
        mentions: stats.mentions,
        reach: stats.reach,
        engagement: stats.engagement,
        sentiment:
          stats.sentimentCount > 0
            ? Math.round((stats.sentimentSum / stats.sentimentCount) * 100) / 100
            : 0,
      }));

      // Mentions trend (daily, last 14 days)
      const trendMap: Record<string, { mentions: number; reach: number }> = {};
      const fourteenDaysAgo = new Date(now);
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      for (const m of mentions as Array<{
        published_at?: string | null;
        reach?: number | null;
      }>) {
        if (!m.published_at) continue;
        const date = m.published_at.split('T')[0];
        if (!trendMap[date]) trendMap[date] = { mentions: 0, reach: 0 };
        trendMap[date].mentions += 1;
        trendMap[date].reach += m.reach ?? 0;
      }
      const mentions_trend = Object.entries(trendMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, val]) => ({ date, ...val }));

      // Top topics from social_media_topics
      const { data: topicsData } = await supabase
        .from('social_media_topics')
        .select('name')
        .eq('is_active', true)
        .limit(10);

      const top_topics = (topicsData ?? []).map((t: { name: string }) => ({
        name: t.name,
        mentions: 0,
        sentiment: 0,
        trend: 'stable' as const,
      }));

      // Recent alerts
      const { data: alertsData } = await supabase
        .from('social_media_crisis_alerts')
        .select('id, type, severity, description, created_at')
        .is('acknowledged_at', null)
        .order('created_at', { ascending: false })
        .limit(5);

      const alerts = (alertsData ?? []).map(
        (a: { id: string; type?: string | null; severity?: string | null; description?: string | null; created_at: string }) => ({
          id: a.id,
          type: (a.type ?? 'crisis') as 'spike' | 'crisis' | 'opportunity',
          severity: (a.severity ?? 'medium') as 'low' | 'medium' | 'high',
          message: a.description ?? '',
          created_at: a.created_at,
        })
      );

      // Health score (simple heuristic)
      const sentimentHealth = Math.min(100, Math.max(0, (avgSentiment + 1) * 50));
      const reachHealth = Math.min(100, totalReach > 0 ? 70 : 0);
      const engagementHealth = Math.min(100, engagementRate > 0 ? 65 : 0);
      const responseTimeHealth = 75;
      const overall = Math.round(
        (sentimentHealth + reachHealth + engagementHealth + responseTimeHealth) / 4
      );

      setState({
        data: {
          overview: {
            total_mentions: totalMentions,
            total_reach: totalReach,
            avg_sentiment: Math.round(avgSentiment * 100) / 100,
            engagement_rate: Math.round(engagementRate * 100) / 100,
            period_comparison: {
              mentions_change_pct: pct(totalMentions, prevTotal),
              reach_change_pct: pct(totalReach, prevReach),
              sentiment_change_pct: pct(
                Math.round(avgSentiment * 100),
                Math.round(prevAvgSentiment * 100)
              ),
              engagement_change_pct: 0,
            },
          },
          sentiment_distribution: { positive, neutral, negative },
          platform_breakdown,
          mentions_trend,
          top_topics,
          alerts,
          health_score: {
            overall,
            components: {
              sentiment: Math.round(sentimentHealth),
              reach: Math.round(reachHealth),
              engagement: Math.round(engagementHealth),
              response_time: responseTimeHealth,
            },
          },
        },
        isLoading: false,
        error: null,
      });
    } catch (err) {
      console.error('[useSocialMediaAnalytics] Error fetching data:', err);
      setState((prev) => ({
        ...prev,
        data: emptyDashboard,
        isLoading: false,
        error: 'Erro ao carregar analytics',
      }));
    }
  }, [businessUnitId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data: state.data,
    isLoading: state.isLoading,
    error: state.error,
    refresh: fetchData,
  };
}

export default useSocialMediaAnalytics;
