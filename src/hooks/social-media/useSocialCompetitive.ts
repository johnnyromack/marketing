/**
 * Social Competitive Hook
 *
 * Provides data fetching for competitors list and competitive analysis.
 * Queries Supabase directly on social_media_competitors table.
 * Uses React Query for caching and background refetching.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ============================================
// Types
// ============================================

export interface Competitor {
  id: string;
  user_id: string;
  name: string;
  handle?: string | null;
  platform?: string | null;
  profile_url?: string | null;
  is_active?: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface CompetitiveMetric {
  competitor_id: string;
  competitor_name: string;
  mentions: number;
  reach: number;
  engagement: number;
  sentiment: number;
  share_of_voice: number;
}

export interface CompetitiveAnalysisResult {
  period: string;
  our_metrics: {
    mentions: number;
    reach: number;
    engagement: number;
    sentiment: number;
    share_of_voice: number;
  };
  competitors: CompetitiveMetric[];
  insights: string[];
  generated_at: string;
}

interface UseSocialCompetitiveOptions {
  businessUnitId?: string | null;
}

const queryConfig = {
  staleTime: 10 * 60 * 1000,
  gcTime: 15 * 60 * 1000,
  retry: 2,
  refetchOnWindowFocus: false,
};

// ============================================
// Hook
// ============================================

export function useSocialCompetitive({ businessUnitId }: UseSocialCompetitiveOptions = {}) {
  const queryClient = useQueryClient();

  // Fetch competitors list
  const competitorsQuery = useQuery({
    queryKey: ['social-media', 'competitors', businessUnitId],
    queryFn: async (): Promise<Competitor[]> => {
      const { data, error } = await supabase
        .from('social_media_competitors')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw new Error(error.message);
      return (data ?? []) as Competitor[];
    },
    enabled: !!businessUnitId,
    ...queryConfig,
  });

  // Build competitive analysis from mentions data
  const analysisQuery = useQuery({
    queryKey: ['social-media', 'competitors', businessUnitId, 'analysis'],
    queryFn: async (): Promise<CompetitiveAnalysisResult> => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get our mentions in last 30 days
      const { data: ourMentions, count: ourCount } = await supabase
        .from('social_media_mentions')
        .select('reach, engagement_count, sentiment_score', { count: 'exact' })
        .gte('published_at', thirtyDaysAgo.toISOString())
        .limit(500);

      const mentions = ourMentions ?? [];
      const ourReach = mentions.reduce(
        (s: number, m: { reach?: number | null }) => s + (m.reach ?? 0),
        0
      );
      const ourEngagement = mentions.reduce(
        (s: number, m: { engagement_count?: number | null }) => s + (m.engagement_count ?? 0),
        0
      );
      const sentimentScores = mentions
        .map((m: { sentiment_score?: number | null }) => m.sentiment_score)
        .filter((s): s is number => s !== null && s !== undefined);
      const ourSentiment =
        sentimentScores.length > 0
          ? sentimentScores.reduce((a: number, b: number) => a + b, 0) / sentimentScores.length
          : 0;

      // Get competitors
      const { data: competitorsData } = await supabase
        .from('social_media_competitors')
        .select('id, name')
        .eq('is_active', true)
        .limit(20);

      const competitors = (competitorsData ?? []).map(
        (c: { id: string; name: string }) => ({
          competitor_id: c.id,
          competitor_name: c.name,
          mentions: 0,
          reach: 0,
          engagement: 0,
          sentiment: 0,
          share_of_voice: 0,
        })
      );

      const totalMentions = (ourCount ?? 0) + competitors.reduce((s: number, c: CompetitiveMetric) => s + c.mentions, 0);
      const ourShareOfVoice = totalMentions > 0 ? ((ourCount ?? 0) / totalMentions) * 100 : 0;

      return {
        period: '30d',
        our_metrics: {
          mentions: ourCount ?? 0,
          reach: ourReach,
          engagement: ourEngagement,
          sentiment: Math.round(ourSentiment * 100) / 100,
          share_of_voice: Math.round(ourShareOfVoice),
        },
        competitors,
        insights: [],
        generated_at: new Date().toISOString(),
      };
    },
    enabled: !!businessUnitId,
    ...queryConfig,
  });

  const refresh = useCallback(() => {
    if (!businessUnitId) return;
    queryClient.invalidateQueries({
      queryKey: ['social-media', 'competitors', businessUnitId],
    });
  }, [queryClient, businessUnitId]);

  return {
    competitors: competitorsQuery.data ?? [],
    analysis: analysisQuery.data ?? null,
    isLoading: competitorsQuery.isLoading || analysisQuery.isLoading,
    error:
      competitorsQuery.error || analysisQuery.error
        ? 'Erro ao carregar dados competitivos'
        : null,
    refresh,
  };
}

export default useSocialCompetitive;
