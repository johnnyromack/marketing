import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Platform = "meta" | "google" | "tiktok";

interface Ad {
  id: string;
  name: string;
  type: string | null;
  status: string | null;
  headline: string | null;
  description: string | null;
  platform: string;
  marca_id: string | null;
  campaign_id: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  ctr: number;
  cpc: number;
  thumbnail_url: string | null;
  preview_url: string | null;
}

export function useRealAds(platform?: Platform, marcaId?: string, onlyActive?: boolean) {
  return useQuery({
    queryKey: ["real_ads", platform, marcaId, onlyActive],
    queryFn: async () => {
      let query = supabase
        .from("platform_ads")
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
          platform_ad_metrics (
            impressions,
            clicks,
            spend,
            conversions,
            ctr,
            cpc
          )
        `)
        .order("created_at", { ascending: false })
        .range(0, 1999);

      if (onlyActive) {
        query = query.eq("status", "active");
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching ads:", error);
        throw error;
      }

      // Map and aggregate metrics
      let result = (data || []).map((ad: any) => {
        const metricsArray = ad.platform_ad_metrics || [];
        const aggregatedMetrics = metricsArray.reduce(
          (acc: any, m: any) => ({
            impressions: acc.impressions + (m.impressions || 0),
            clicks: acc.clicks + (m.clicks || 0),
            spend: acc.spend + Number(m.spend || 0),
            conversions: acc.conversions + Number(m.conversions || 0),
            ctr: m.ctr || acc.ctr,
            cpc: m.cpc || acc.cpc,
          }),
          { impressions: 0, clicks: 0, spend: 0, conversions: 0, ctr: 0, cpc: 0 }
        );

        const ctr = aggregatedMetrics.ctr ||
          (aggregatedMetrics.impressions > 0
            ? (aggregatedMetrics.clicks / aggregatedMetrics.impressions) * 100
            : 0);

        return {
          id: ad.id,
          name: ad.name,
          type: ad.type,
          status: ad.status,
          headline: ad.headline,
          description: ad.description,
          campaign_id: ad.campaign_id,
          impressions: aggregatedMetrics.impressions,
          clicks: aggregatedMetrics.clicks,
          spend: aggregatedMetrics.spend,
          conversions: aggregatedMetrics.conversions,
          ctr,
          cpc: aggregatedMetrics.cpc,
          platform: ad.platform_campaigns?.platform_accounts?.platform || "google",
          marca_id: ad.platform_campaigns?.platform_accounts?.marca_id || null,
          thumbnail_url: ad.thumbnail_url || null,
          preview_url: ad.preview_url || null,
        } as Ad;
      });

      // Filter by platform
      if (platform) {
        result = result.filter((a) => a.platform === platform);
      }

      // Filter by marca (supports comma-separated IDs)
      if (marcaId) {
        const marcaIds = marcaId.split(",");
        result = result.filter((a) => a.marca_id && marcaIds.includes(a.marca_id));
      }

      return result;
    },
  });
}

// Server-side ad count via RPC - no row limit
export function useRealAdStats(platform?: Platform, marcaId?: string, fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: ["real_ad_stats", platform, marcaId, fromDate, toDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_ad_stats", {
        p_platform: platform || null,
        p_brand_id: marcaId || null,
        p_from_date: fromDate || null,
        p_to_date: toDate || null,
      });

      if (error) {
        console.error("Error fetching ad stats:", error);
        throw error;
      }

      const row = data?.[0] || { total: 0, active: 0 };
      return {
        total: Number(row.total),
        active: Number(row.active),
      };
    },
  });
}
