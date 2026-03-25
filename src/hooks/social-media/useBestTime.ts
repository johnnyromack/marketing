/**
 * Best Time to Post Hook
 *
 * Analyzes social_media_mentions engagement by hour and day of week
 * to determine optimal posting times. Uses React Query for caching.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ============================================
// Types
// ============================================

export interface BestTimeSlot {
  day_of_week: number;
  hour: number;
  score: number;
  expected_reach: number;
  expected_engagement: number;
}

export interface BestTimeAnalysis {
  platform: string;
  best_slots: BestTimeSlot[];
  optimal_days: number[];
  optimal_hours: number[];
  insights: string[];
  generated_at: string;
}

interface UseBestTimeOptions {
  businessUnitId?: string | null;
  platform?: string;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => {
  const period = i < 12 ? 'AM' : 'PM';
  const hour = i === 0 ? 12 : i > 12 ? i - 12 : i;
  return `${hour}${period}`;
});

function generateInsights(
  bestSlots: BestTimeSlot[],
  optimalDays: number[],
  optimalHours: number[]
): string[] {
  const insights: string[] = [];

  if (bestSlots.length > 0) {
    const topSlot = bestSlots[0];
    insights.push(
      `Melhor horário para postar: ${DAY_NAMES[topSlot.day_of_week]} às ${HOUR_LABELS[topSlot.hour]}`
    );
  }

  if (optimalDays.length > 0) {
    const dayNames = optimalDays.map((d) => DAY_NAMES[d]).join(', ');
    insights.push(`Melhores dias da semana: ${dayNames}`);
  }

  if (optimalHours.length > 0) {
    const hourLabels = optimalHours.map((h) => HOUR_LABELS[h]).join(', ');
    insights.push(`Horários com maior engajamento: ${hourLabels}`);
  }

  return insights;
}

// ============================================
// Hook
// ============================================

export function useBestTime({ businessUnitId, platform }: UseBestTimeOptions = {}) {
  const queryClient = useQueryClient();

  const bestTimeQuery = useQuery({
    queryKey: ['social-media', 'best-time', businessUnitId, platform],
    queryFn: async (): Promise<BestTimeAnalysis | BestTimeAnalysis[]> => {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      let query = supabase
        .from('social_media_mentions')
        .select('platform, published_at, engagement_count, reach')
        .gte('published_at', ninetyDaysAgo.toISOString())
        .not('published_at', 'is', null)
        .limit(1000);

      if (platform) {
        query = query.eq('platform', platform);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      const mentions = data ?? [];

      if (mentions.length === 0) {
        const emptyAnalysis: BestTimeAnalysis = {
          platform: platform ?? 'all',
          best_slots: [],
          optimal_days: [],
          optimal_hours: [],
          insights: ['Dados insuficientes para análise de melhor horário'],
          generated_at: new Date().toISOString(),
        };
        return platform ? emptyAnalysis : [emptyAnalysis];
      }

      // Group by platform if no platform filter
      const platformGroups: Record<
        string,
        Array<{ day: number; hour: number; engagement: number; reach: number }>
      > = {};

      for (const m of mentions as Array<{
        platform?: string | null;
        published_at?: string | null;
        engagement_count?: number | null;
        reach?: number | null;
      }>) {
        if (!m.published_at) continue;
        const date = new Date(m.published_at);
        const day = date.getDay();
        const hour = date.getHours();
        const engagement = m.engagement_count ?? 0;
        const reachVal = m.reach ?? 0;
        const plt = m.platform ?? 'unknown';

        if (!platformGroups[plt]) platformGroups[plt] = [];
        platformGroups[plt].push({ day, hour, engagement, reach: reachVal });
      }

      const analyzeGroup = (
        plt: string,
        entries: Array<{ day: number; hour: number; engagement: number; reach: number }>
      ): BestTimeAnalysis => {
        // Aggregate by day+hour slot
        const slotMap: Record<
          string,
          { day: number; hour: number; totalEngagement: number; totalReach: number; count: number }
        > = {};

        for (const e of entries) {
          const key = `${e.day}-${e.hour}`;
          if (!slotMap[key]) {
            slotMap[key] = { day: e.day, hour: e.hour, totalEngagement: 0, totalReach: 0, count: 0 };
          }
          slotMap[key].totalEngagement += e.engagement;
          slotMap[key].totalReach += e.reach;
          slotMap[key].count += 1;
        }

        const slots: BestTimeSlot[] = Object.values(slotMap).map((slot) => {
          const avgEngagement = slot.count > 0 ? slot.totalEngagement / slot.count : 0;
          const avgReach = slot.count > 0 ? slot.totalReach / slot.count : 0;
          const score = avgEngagement + avgReach * 0.1;
          return {
            day_of_week: slot.day,
            hour: slot.hour,
            score: Math.round(score),
            expected_reach: Math.round(avgReach),
            expected_engagement: Math.round(avgEngagement),
          };
        });

        slots.sort((a, b) => b.score - a.score);
        const best_slots = slots.slice(0, 10);

        // Top 3 days
        const dayScores: Record<number, number> = {};
        for (const s of slots) {
          dayScores[s.day_of_week] = (dayScores[s.day_of_week] ?? 0) + s.score;
        }
        const optimal_days = Object.entries(dayScores)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([day]) => Number(day));

        // Top 3 hours
        const hourScores: Record<number, number> = {};
        for (const s of slots) {
          hourScores[s.hour] = (hourScores[s.hour] ?? 0) + s.score;
        }
        const optimal_hours = Object.entries(hourScores)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([hour]) => Number(hour));

        const insights = generateInsights(best_slots, optimal_days, optimal_hours);

        return {
          platform: plt,
          best_slots,
          optimal_days,
          optimal_hours,
          insights,
          generated_at: new Date().toISOString(),
        };
      };

      if (platform) {
        const entries = platformGroups[platform] ?? [];
        return analyzeGroup(platform, entries);
      }

      // Return array of analyses per platform
      if (Object.keys(platformGroups).length === 0) {
        return [
          {
            platform: 'all',
            best_slots: [],
            optimal_days: [],
            optimal_hours: [],
            insights: ['Dados insuficientes para análise de melhor horário'],
            generated_at: new Date().toISOString(),
          },
        ];
      }

      return Object.entries(platformGroups).map(([plt, entries]) =>
        analyzeGroup(plt, entries)
      );
    },
    enabled: !!businessUnitId,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const refresh = useCallback(() => {
    if (!businessUnitId) return;
    queryClient.invalidateQueries({
      queryKey: ['social-media', 'best-time', businessUnitId, platform],
    });
  }, [queryClient, businessUnitId, platform]);

  return {
    analysis: bestTimeQuery.data ?? null,
    isLoading: bestTimeQuery.isLoading,
    error: bestTimeQuery.error ? 'Erro ao carregar análise de melhor horário' : null,
    refresh,
  };
}

export default useBestTime;
