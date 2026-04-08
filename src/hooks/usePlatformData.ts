import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Platform = "meta" | "google" | "tiktok";

interface PlatformAccount {
  id: string;
  platform: string;
  account_id: string;
  account_name: string;
  balance: number | null;
  currency: string | null;
  last_sync_at: string | null;
  marca_id: string | null;
  marca_name?: string;
}

interface Campaign {
  id: string;
  name: string;
  status: string | null;
  objective: string | null;
  campaign_external_id: string;
  account_id: string | null;
  platform: string;
  marca_id?: string | null;
  marca_name?: string;
  daily_budget: number | null;
  lifetime_budget: number | null;
  start_date: string | null;
  end_date: string | null;
  // Metrics
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
  ctr: number;
  cpc: number;
  roas: number;
}

interface Marca {
  id: string;
  nome: string;
  display_name: string | null;
  logo_url: string | null;
  ativo: boolean;
  manual_balance: number | null;
  daily_budget: number | null;
  last_balance_update: string | null;
}

// Helper to get the display name (uses display_name if set, otherwise falls back to nome)
export function getBrandDisplayName(marca: Marca): string {
  return marca.display_name || marca.nome;
}

export function usePlatformAccounts(platform?: Platform) {
  return useQuery({
    queryKey: ["platform_accounts", platform],
    queryFn: async () => {
      let query = supabase
        .from("platform_accounts")
        .select(`
          *,
          marcas (
            id,
            nome,
            logo_url
          )
        `)
        .order("created_at", { ascending: false });

      if (platform) {
        query = query.eq("platform", platform);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching platform accounts:", error);
        throw error;
      }

      return (data || []).map((account: any) => ({
        ...account,
        marca_name: account.marcas?.nome || null,
      })) as PlatformAccount[];
    },
  });
}

export function useCampaigns(platform?: Platform, marcaId?: string) {
  return useQuery({
    queryKey: ["campaigns", platform, marcaId],
    queryFn: async () => {
      // Get campaigns with accounts and latest aggregated metrics
      let campaignsQuery = supabase
        .from("platform_campaigns")
        .select(`
          *,
          platform_accounts (
            id,
            platform,
            account_name,
            marca_id,
            marcas (
              id,
              nome
            )
          ),
          platform_campaign_metrics (
            impressions,
            clicks,
            spend,
            conversions,
            revenue
          )
        `)
        .order("created_at", { ascending: false })
        .range(0, 1999);

      const { data: campaignsData, error: campaignsError } = await campaignsQuery;

      if (campaignsError) {
        console.error("Error fetching campaigns:", campaignsError);
        throw campaignsError;
      }

      // Map campaigns with aggregated metrics
      let result = (campaignsData || []).map((campaign: any) => {
        // Aggregate metrics from array
        const metricsArray = campaign.platform_campaign_metrics || [];
        const aggregatedMetrics = metricsArray.reduce(
          (acc: any, m: any) => ({
            impressions: acc.impressions + (m.impressions || 0),
            clicks: acc.clicks + (m.clicks || 0),
            spend: acc.spend + (m.spend || 0),
            conversions: acc.conversions + (m.conversions || 0),
            revenue: acc.revenue + (m.revenue || 0),
          }),
          { impressions: 0, clicks: 0, spend: 0, conversions: 0, revenue: 0 }
        );

        const ctr = aggregatedMetrics.impressions > 0
          ? (aggregatedMetrics.clicks / aggregatedMetrics.impressions) * 100
          : 0;
        const cpc = aggregatedMetrics.clicks > 0
          ? aggregatedMetrics.spend / aggregatedMetrics.clicks
          : 0;
        const roas = aggregatedMetrics.spend > 0
          ? aggregatedMetrics.revenue / aggregatedMetrics.spend
          : 0;

        return {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          objective: campaign.objective,
          campaign_external_id: campaign.campaign_external_id,
          account_id: campaign.account_id,
          platform: campaign.platform_accounts?.platform || "unknown",
          marca_id: campaign.platform_accounts?.marca_id || null,
          marca_name: campaign.platform_accounts?.marcas?.nome || null,
          daily_budget: campaign.daily_budget,
          lifetime_budget: campaign.lifetime_budget,
          start_date: campaign.start_date,
          end_date: campaign.end_date,
          impressions: aggregatedMetrics.impressions,
          clicks: aggregatedMetrics.clicks,
          spend: aggregatedMetrics.spend,
          conversions: aggregatedMetrics.conversions,
          revenue: aggregatedMetrics.revenue,
          ctr,
          cpc,
          roas,
        } as Campaign;
      });

      // Filter by platform
      if (platform) {
        result = result.filter((c) => c.platform === platform);
      }

      // Filter by marca (supports comma-separated IDs for unified brands)
      if (marcaId) {
        const marcaIds = marcaId.split(",");
        result = result.filter((c) => c.marca_id && marcaIds.includes(c.marca_id));
      }

      console.log(`Loaded ${result.length} campaigns with metrics`);
      return result;
    },
  });
}

export function useBrands(includeInactive = false) {
  return useQuery({
    queryKey: ["marcas", includeInactive],
    queryFn: async () => {
      let query = supabase
        .from("marcas")
        .select("*")
        .order("nome", { ascending: true });

      if (!includeInactive) {
        query = query.eq("ativo", true);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching marcas:", error);
        throw error;
      }

      return data as Marca[];
    },
  });
}

// Server-side campaign count via RPC - no row limit
export function useCampaignStats(platform?: Platform, marcaId?: string, fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: ["campaign_stats", platform, marcaId, fromDate, toDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_campaign_stats", {
        p_platform: platform || null,
        p_brand_id: marcaId || null,
        p_from_date: fromDate || null,
        p_to_date: toDate || null,
      });

      if (error) {
        console.error("Error fetching campaign stats:", error);
        throw error;
      }

      const row = data?.[0] || { total: 0, active: 0, paused: 0 };
      return {
        total: Number(row.total),
        active: Number(row.active),
        paused: Number(row.paused),
      };
    },
  });
}

// Hook to get real spending from the last 7 days per account
export function useAccountDailySpending() {
  return useQuery({
    queryKey: ["account_daily_spending"],
    queryFn: async () => {
      // Get last 7 days of metrics
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const dateString = sevenDaysAgo.toISOString().split('T')[0];

      const { data: metricsData, error: metricsError } = await supabase
        .from("platform_campaign_metrics")
        .select(`
          spend,
          platform_campaigns (
            account_id
          )
        `)
        .gte("date", dateString);

      if (metricsError) {
        console.error("Error fetching spending metrics:", metricsError);
        throw metricsError;
      }

      // Aggregate spending by account_id
      const spendingByAccount: Record<string, { totalSpend: number; dayCount: number }> = {};

      (metricsData || []).forEach((metric: any) => {
        const accountId = metric.platform_campaigns?.account_id;
        if (accountId) {
          if (!spendingByAccount[accountId]) {
            spendingByAccount[accountId] = { totalSpend: 0, dayCount: 0 };
          }
          spendingByAccount[accountId].totalSpend += metric.spend || 0;
        }
      });

      // Calculate daily average (7 days)
      const dailySpendingByAccount: Record<string, number> = {};
      Object.entries(spendingByAccount).forEach(([accountId, data]) => {
        dailySpendingByAccount[accountId] = data.totalSpend / 7;
      });

      return dailySpendingByAccount;
    },
  });
}

// Hook to get real daily spending per marca (last 7 days)
export function useBrandDailySpending() {
  return useQuery({
    queryKey: ["marca_daily_spending"],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const dateString = sevenDaysAgo.toISOString().split('T')[0];

      // Get metrics with campaign -> account -> marca relationship
      const { data: metricsData, error: metricsError } = await supabase
        .from("platform_campaign_metrics")
        .select(`
          spend,
          date,
          platform_campaigns (
            account_id,
            platform_accounts (
              marca_id
            )
          )
        `)
        .gte("date", dateString);

      if (metricsError) {
        console.error("Error fetching marca spending metrics:", metricsError);
        throw metricsError;
      }

      // Aggregate spending by marca_id and by date to count unique days
      const spendingByMarca: Record<string, { totalSpend: number; dates: Set<string> }> = {};

      (metricsData || []).forEach((metric: any) => {
        const marcaId = metric.platform_campaigns?.platform_accounts?.marca_id;
        if (marcaId) {
          if (!spendingByMarca[marcaId]) {
            spendingByMarca[marcaId] = { totalSpend: 0, dates: new Set() };
          }
          spendingByMarca[marcaId].totalSpend += metric.spend || 0;
          spendingByMarca[marcaId].dates.add(metric.date);
        }
      });

      // Calculate daily average based on actual days with data (or 7 days if more)
      const dailySpendingByMarca: Record<string, number> = {};
      Object.entries(spendingByMarca).forEach(([marcaId, data]) => {
        const dayCount = Math.max(data.dates.size, 1);
        dailySpendingByMarca[marcaId] = data.totalSpend / Math.min(dayCount, 7);
      });

      console.log("Marca daily spending calculated:", dailySpendingByMarca);
      return dailySpendingByMarca;
    },
  });
}
