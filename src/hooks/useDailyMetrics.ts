import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, differenceInDays } from "date-fns";
import { DateRange } from "react-day-picker";

type Platform = "meta" | "google" | "tiktok";

interface DailyMetric {
  date: string;
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
}

export function useDailyMetrics(dateRange: DateRange | undefined, marcaId?: string, platform?: Platform) {
  return useQuery({
    queryKey: ["daily_metrics", dateRange?.from, dateRange?.to, marcaId, platform],
    queryFn: async (): Promise<{ current: DailyMetric[]; previous: DailyMetric[] }> => {
      if (!dateRange?.from || !dateRange?.to) {
        return { current: [], previous: [] };
      }

      const fromDate = format(dateRange.from, "yyyy-MM-dd");
      const toDate = format(dateRange.to, "yyyy-MM-dd");
      const periodDays = differenceInDays(dateRange.to, dateRange.from) + 1;
      const previousFrom = format(subDays(dateRange.from, periodDays), "yyyy-MM-dd");
      const previousTo = format(subDays(dateRange.from, 1), "yyyy-MM-dd");

      const [currentData, previousData] = await Promise.all([
        fetchDailyData(fromDate, toDate, marcaId, platform),
        fetchDailyData(previousFrom, previousTo, marcaId, platform),
      ]);

      return { current: currentData, previous: previousData };
    },
    enabled: !!dateRange?.from && !!dateRange?.to,
  });
}

async function fetchDailyData(fromDate: string, toDate: string, marcaId?: string, platform?: Platform): Promise<DailyMetric[]> {
  const { data, error } = await supabase.rpc("get_daily_metrics", {
    p_from_date: fromDate,
    p_to_date: toDate,
    p_brand_id: marcaId || null,
    p_platform: platform || null,
  });

  if (error) {
    console.error("Error fetching daily metrics:", error);
    return [];
  }

  return (data || []).map((row: any) => {
    const impressions = Number(row.total_impressions || 0);
    const clicks = Number(row.total_clicks || 0);
    return {
      date: row.metric_date,
      impressions,
      clicks,
      spend: Number(row.total_spend || 0),
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    };
  });
}
