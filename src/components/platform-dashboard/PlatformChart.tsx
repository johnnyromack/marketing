import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { campaigns, formatCurrency } from "@/lib/mock-data";
import { Platform } from "@/types/platform";

interface PlatformChartProps {
  className?: string;
  brandId?: string;
}

const chartConfig: ChartConfig = {
  meta: {
    label: "Meta Ads",
    color: "hsl(var(--chart-1))",
  },
  google: {
    label: "Google Ads",
    color: "hsl(var(--chart-2))",
  },
  tiktok: {
    label: "TikTok Ads",
    color: "hsl(var(--chart-3))",
  },
};

export function PlatformChart({ className, brandId }: PlatformChartProps) {
  const chartData = useMemo(() => {
    const filteredCampaigns = brandId 
      ? campaigns.filter((c) => c.brandId === brandId)
      : campaigns;

    const platformData = ["meta", "google", "tiktok"].map((platform) => {
      const platformCampaigns = filteredCampaigns.filter((c) => c.platform === platform);
      return {
        platform,
        spend: platformCampaigns.reduce((sum, c) => sum + c.spend, 0),
        conversions: platformCampaigns.reduce((sum, c) => sum + c.conversions, 0),
        roas: platformCampaigns.length > 0
          ? platformCampaigns.reduce((sum, c) => sum + c.roas, 0) / platformCampaigns.length
          : 0,
      };
    });

    return platformData.map((d) => ({
      name: d.platform === "meta" ? "Meta" : d.platform === "google" ? "Google" : "TikTok",
      investimento: d.spend,
      conversoes: d.conversions,
      fill: `var(--color-${d.platform})`,
    }));
  }, [brandId]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Performance por Plataforma</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
            <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
            <YAxis dataKey="name" type="category" width={60} />
            <ChartTooltip 
              content={<ChartTooltipContent />}
              formatter={(value) => formatCurrency(value as number)}
            />
            <Bar dataKey="investimento" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
