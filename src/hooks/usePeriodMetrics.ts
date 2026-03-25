import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DateRange } from "react-day-picker";
import { format, subDays, differenceInDays } from "date-fns";

type Platform = "meta" | "google" | "tiktok";

interface PeriodMetrics {
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
  ctr: number;
  cpc: number;
  roas: number;
}

interface PeriodMetricsResult {
  current: PeriodMetrics;
  previous: PeriodMetrics;
  changes: {
    impressions: number;
    clicks: number;
    spend: number;
    conversions: number;
    ctr: number;
    cpc: number;
  };
}

export function usePeriodMetrics(dateRange: DateRange | undefined, marcaId?: string, platform?: Platform) {
  return useQuery({
    queryKey: ["period_metrics", dateRange?.from, dateRange?.to, marcaId, platform],
    queryFn: async (): Promise<PeriodMetricsResult> => {
      if (!dateRange?.from || !dateRange?.to) {
        return getEmptyResult();
      }

      const fromDate = format(dateRange.from, "yyyy-MM-dd");
      const toDate = format(dateRange.to, "yyyy-MM-dd");

      // Calculate the period length to get the previous period
      const periodDays = differenceInDays(dateRange.to, dateRange.from) + 1;
      const previousFrom = format(subDays(dateRange.from, periodDays), "yyyy-MM-dd");
      const previousTo = format(subDays(dateRange.from, 1), "yyyy-MM-dd");

      // Fetch current period metrics
      const currentMetrics = await fetchMetrics(fromDate, toDate, marcaId, platform);

      // Fetch previous period metrics
      const previousMetrics = await fetchMetrics(previousFrom, previousTo, marcaId, platform);

      // Calculate percentage changes
      const changes = {
        impressions: calcChange(currentMetrics.impressions, previousMetrics.impressions),
        clicks: calcChange(currentMetrics.clicks, previousMetrics.clicks),
        spend: calcChange(currentMetrics.spend, previousMetrics.spend),
        conversions: calcChange(currentMetrics.conversions, previousMetrics.conversions),
        ctr: calcChange(currentMetrics.ctr, previousMetrics.ctr),
        cpc: calcChange(currentMetrics.cpc, previousMetrics.cpc),
      };

      return {
        current: currentMetrics,
        previous: previousMetrics,
        changes,
      };
    },
    enabled: !!dateRange?.from && !!dateRange?.to,
  });
}

async function fetchMetrics(fromDate: string, toDate: string, marcaId?: string, platform?: Platform): Promise<PeriodMetrics> {
  // Use server-side aggregation via RPC to avoid the 1000-row limit
  const { data, error } = await supabase.rpc("get_period_metrics", {
    p_from_date: fromDate,
    p_to_date: toDate,
    p_brand_id: marcaId || null,
    p_platform: platform || null,
  });

  if (error) {
    console.error("Error fetching period metrics:", error);
    return getEmptyMetrics();
  }

  const row = data?.[0] || { total_impressions: 0, total_clicks: 0, total_spend: 0, total_conversions: 0, total_revenue: 0 };

  const impressions = Number(row.total_impressions || 0);
  const clicks = Number(row.total_clicks || 0);
  const spend = Number(row.total_spend || 0);
  const conversions = Number(row.total_conversions || 0);
  const revenue = Number(row.total_revenue || 0);

  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const cpc = clicks > 0 ? spend / clicks : 0;
  const roas = spend > 0 ? revenue / spend : 0;

  return { impressions, clicks, spend, conversions, revenue, ctr, cpc, roas };
}

function calcChange(current: number, previous: number): number {
  if (previous === 0) return 0; // No previous data = no comparison possible
  return ((current - previous) / previous) * 100;
}

function getEmptyMetrics(): PeriodMetrics {
  return {
    impressions: 0,
    clicks: 0,
    spend: 0,
    conversions: 0,
    revenue: 0,
    ctr: 0,
    cpc: 0,
    roas: 0,
  };
}

function getEmptyResult(): PeriodMetricsResult {
  return {
    current: getEmptyMetrics(),
    previous: getEmptyMetrics(),
    changes: {
      impressions: 0,
      clicks: 0,
      spend: 0,
      conversions: 0,
      ctr: 0,
      cpc: 0,
    },
  };
}

// Education market benchmarks
export const EDUCATION_BENCHMARKS = {
  ctr: { min: 3, max: 5 }, // 3-5%
  cpc: { min: 5, max: 7 }, // R$ 5-7
};

export type BenchmarkStatus = "within" | "below" | "above";

export function getBenchmarkStatus(value: number, benchmark: { min: number; max: number }): BenchmarkStatus {
  if (value < benchmark.min) return "below";
  if (value > benchmark.max) return "above";
  return "within";
}
