import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Keyword {
  id: string;
  keyword_text: string;
  match_type: string;
  status: string | null;
  quality_score: number | null;
  ad_group_name: string | null;
  campaign_id: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  ctr: number;
  cpc: number;
  platform: string;
  marca_id: string | null;
}

export function useKeywords(marcaId?: string, onlyActive?: boolean) {
  return useQuery({
    queryKey: ["keywords", marcaId, onlyActive],
    queryFn: async () => {
      let query = supabase
        .from("platform_keywords")
        .select(`
          *,
          platform_campaigns!inner (
            id,
            name,
            platform_accounts!inner (
              platform,
              marca_id
            )
          ),
          platform_keyword_metrics (
            impressions,
            clicks,
            spend,
            conversions,
            ctr,
            cpc
          )
        `)
        .order("created_at", { ascending: false });

      if (onlyActive) {
        query = query.eq("status", "active");
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching keywords:", error);
        throw error;
      }

      // Map and aggregate metrics
      let result = (data || []).map((kw: any) => {
        const metricsArray = kw.platform_keyword_metrics || [];
        const aggregatedMetrics = metricsArray.reduce(
          (acc: any, m: any) => ({
            impressions: acc.impressions + (m.impressions || 0),
            clicks: acc.clicks + (m.clicks || 0),
            spend: acc.spend + Number(m.spend || 0),
            conversions: acc.conversions + Number(m.conversions || 0),
            ctr: m.ctr || acc.ctr, // Use latest CTR
            cpc: m.cpc || acc.cpc, // Use latest CPC
          }),
          { impressions: 0, clicks: 0, spend: 0, conversions: 0, ctr: 0, cpc: 0 }
        );

        // Calculate CTR if not provided
        const ctr = aggregatedMetrics.ctr ||
          (aggregatedMetrics.impressions > 0
            ? (aggregatedMetrics.clicks / aggregatedMetrics.impressions) * 100
            : 0);

        return {
          id: kw.id,
          keyword_text: kw.keyword_text,
          match_type: kw.match_type,
          status: kw.status,
          quality_score: kw.quality_score,
          ad_group_name: kw.ad_group_name,
          campaign_id: kw.campaign_id,
          impressions: aggregatedMetrics.impressions,
          clicks: aggregatedMetrics.clicks,
          spend: aggregatedMetrics.spend,
          conversions: aggregatedMetrics.conversions,
          ctr,
          cpc: aggregatedMetrics.cpc,
          platform: kw.platform_campaigns?.platform_accounts?.platform || "google",
          marca_id: kw.platform_campaigns?.platform_accounts?.marca_id || null,
        } as Keyword;
      });

      // Filter by marca
      if (marcaId) {
        result = result.filter((k) => k.marca_id === marcaId);
      }

      return result;
    },
  });
}

export function useKeywordStats(marcaId?: string) {
  return useQuery({
    queryKey: ["keyword_stats", marcaId],
    queryFn: async () => {
      let query = supabase
        .from("platform_keywords")
        .select(`
          id,
          status,
          platform_campaigns!inner (
            platform_accounts!inner (
              marca_id
            )
          )
        `);

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching keyword stats:", error);
        throw error;
      }

      let keywords = data || [];

      // Filter by marca if provided
      if (marcaId) {
        keywords = keywords.filter(
          (k: any) => k.platform_campaigns?.platform_accounts?.marca_id === marcaId
        );
      }

      return {
        total: keywords.length,
        active: keywords.filter((k: any) => k.status === "active").length,
      };
    },
  });
}
