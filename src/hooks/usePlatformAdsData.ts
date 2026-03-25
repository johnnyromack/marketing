import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Platform = "meta" | "google" | "tiktok";

interface Ad {
  id: string;
  name: string;
  status: string | null;
  platform: string;
  marca_id?: string | null;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  ctr: number;
  cpc: number;
}

export function useAds(platform?: Platform, marcaId?: string, onlyActive?: boolean) {
  return useQuery({
    queryKey: ["ads", platform, marcaId, onlyActive],
    queryFn: async () => {
      // Since we don't have a platform_ads table yet, we'll simulate ads from campaigns
      // In a real scenario, you'd have a platform_ads table with its own metrics
      let query = supabase
        .from("platform_campaigns")
        .select(`
          *,
          platform_accounts (
            id,
            platform,
            account_name,
            marca_id
          ),
          platform_campaign_metrics (
            impressions,
            clicks,
            spend,
            conversions
          )
        `)
        .order("created_at", { ascending: false })
        .range(0, 1999);

      // Filter by active status if requested
      if (onlyActive) {
        query = query.eq("status", "active");
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching ads:", error);
        throw error;
      }

      // Map campaigns as "ads" for now - aggregate metrics
      let result = (data || []).map((campaign) => {
        const metricsArray = (campaign as any).platform_campaign_metrics || [];
        const aggregatedMetrics = metricsArray.reduce(
          (acc: any, m: any) => ({
            impressions: acc.impressions + (m.impressions || 0),
            clicks: acc.clicks + (m.clicks || 0),
            spend: acc.spend + (m.spend || 0),
            conversions: acc.conversions + (m.conversions || 0),
          }),
          { impressions: 0, clicks: 0, spend: 0, conversions: 0 }
        );

        const ctr = aggregatedMetrics.impressions > 0
          ? (aggregatedMetrics.clicks / aggregatedMetrics.impressions) * 100
          : 0;
        const cpc = aggregatedMetrics.clicks > 0
          ? aggregatedMetrics.spend / aggregatedMetrics.clicks
          : 0;

        return {
          id: campaign.id,
          name: `${campaign.name} - Anuncio`,
          status: campaign.status,
          platform: (campaign as any).platform_accounts?.platform || "unknown",
          marca_id: (campaign as any).platform_accounts?.marca_id || null,
          impressions: aggregatedMetrics.impressions,
          clicks: aggregatedMetrics.clicks,
          spend: aggregatedMetrics.spend,
          conversions: aggregatedMetrics.conversions,
          ctr,
          cpc,
        } as Ad;
      });

      // Filter by platform
      if (platform) {
        result = result.filter((a) => a.platform === platform);
      }

      // Filter by marca
      if (marcaId) {
        result = result.filter((a) => a.marca_id === marcaId);
      }

      return result;
    },
  });
}

export function useAdStats(platform?: Platform, marcaId?: string) {
  return useQuery({
    queryKey: ["ad_stats", platform, marcaId],
    queryFn: async () => {
      // For now, return campaign count as ad count estimate
      // In a real scenario, you'd count actual ads
      let query = supabase
        .from("platform_campaigns")
        .select(`
          id,
          status,
          platform_accounts!inner (
            platform,
            marca_id
          )
        `);

      if (platform) {
        query = query.eq("platform_accounts.platform", platform);
      }

      if (marcaId) {
        query = query.eq("platform_accounts.marca_id", marcaId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching ad stats:", error);
        throw error;
      }

      const campaigns = data || [];
      // Estimate ~3 ads per campaign on average
      const estimatedAds = campaigns.length * 3;
      const activeAds = campaigns.filter((c: any) => c.status === "active").length * 3;

      return {
        total: estimatedAds,
        active: activeAds,
      };
    },
  });
}
