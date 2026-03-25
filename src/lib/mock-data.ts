import { Brand, AdAccount, Campaign, Platform } from "@/types/platform";

export const brands: Brand[] = [
  { id: "1", name: "TechCorp", createdAt: new Date("2024-01-15") },
  { id: "2", name: "FashionBrand", createdAt: new Date("2024-02-20") },
  { id: "3", name: "FoodieApp", createdAt: new Date("2024-03-10") },
];

export const adAccounts: AdAccount[] = [
  { id: "acc-1", name: "TechCorp - Meta Principal", platform: "meta", brandId: "1", currentBalance: 15000, totalBudget: 20000, dailySpend: 450, currency: "BRL" },
  { id: "acc-2", name: "TechCorp - Google Search", platform: "google", brandId: "1", currentBalance: 3500, totalBudget: 15000, dailySpend: 380, currency: "BRL" },
  { id: "acc-3", name: "FashionBrand - Meta", platform: "meta", brandId: "2", currentBalance: 8200, totalBudget: 25000, dailySpend: 520, currency: "BRL" },
  { id: "acc-4", name: "FashionBrand - TikTok", platform: "tiktok", brandId: "2", currentBalance: 1200, totalBudget: 10000, dailySpend: 280, currency: "BRL" },
  { id: "acc-5", name: "FoodieApp - Meta", platform: "meta", brandId: "3", currentBalance: 5600, totalBudget: 8000, dailySpend: 220, currency: "BRL" },
  { id: "acc-6", name: "FoodieApp - Google Display", platform: "google", brandId: "3", currentBalance: 950, totalBudget: 5000, dailySpend: 150, currency: "BRL" },
];

export const campaigns: Campaign[] = [
  {
    id: "camp-1", name: "Lançamento Produto X", platform: "meta", brandId: "1", accountId: "acc-1",
    status: "active", objective: "sales", spend: 12500, impressions: 850000, clicks: 25000,
    conversions: 480, roas: 4.2, ctr: 2.94, cpc: 0.5, startDate: new Date("2024-12-01"), adsCount: 8
  },
  {
    id: "camp-2", name: "Remarketing Q1", platform: "meta", brandId: "1", accountId: "acc-1",
    status: "active", objective: "sales", spend: 4800, impressions: 320000, clicks: 12000,
    conversions: 220, roas: 5.8, ctr: 3.75, cpc: 0.4, startDate: new Date("2024-12-15"), adsCount: 5
  },
  {
    id: "camp-3", name: "Brand Awareness", platform: "google", brandId: "1", accountId: "acc-2",
    status: "active", objective: "awareness", spend: 8200, impressions: 1200000, clicks: 18000,
    conversions: 95, roas: 1.8, ctr: 1.5, cpc: 0.46, startDate: new Date("2024-11-20"), adsCount: 12
  },
  {
    id: "camp-4", name: "Coleção Verão 2025", platform: "meta", brandId: "2", accountId: "acc-3",
    status: "active", objective: "sales", spend: 18500, impressions: 1100000, clicks: 42000,
    conversions: 680, roas: 3.9, ctr: 3.82, cpc: 0.44, startDate: new Date("2024-12-01"), adsCount: 15
  },
  {
    id: "camp-5", name: "Influencer Collab", platform: "tiktok", brandId: "2", accountId: "acc-4",
    status: "active", objective: "engagement", spend: 6800, impressions: 2500000, clicks: 95000,
    conversions: 180, roas: 2.1, ctr: 3.8, cpc: 0.07, startDate: new Date("2024-12-10"), adsCount: 6
  },
  {
    id: "camp-6", name: "App Install", platform: "meta", brandId: "3", accountId: "acc-5",
    status: "active", objective: "leads", spend: 3200, impressions: 450000, clicks: 18500,
    conversions: 850, roas: 2.8, ctr: 4.11, cpc: 0.17, startDate: new Date("2024-12-05"), adsCount: 4
  },
  {
    id: "camp-7", name: "Promo Fim de Ano", platform: "google", brandId: "3", accountId: "acc-6",
    status: "paused", objective: "sales", spend: 2100, impressions: 180000, clicks: 4500,
    conversions: 65, roas: 3.2, ctr: 2.5, cpc: 0.47, startDate: new Date("2024-11-25"), adsCount: 3
  },
];

export function getBalanceStatus(account: AdAccount) {
  const percentage = (account.currentBalance / account.totalBudget) * 100;
  const daysRemaining = account.dailySpend > 0 ? Math.floor(account.currentBalance / account.dailySpend) : 999;

  let status: "healthy" | "warning" | "critical";
  if (percentage > 70) {
    status = "healthy";
  } else if (percentage > 30) {
    status = "warning";
  } else {
    status = "critical";
  }

  return { status, percentage, daysRemaining };
}

export function formatCurrency(value: number, currency = "BRL") {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function formatPercentage(value: number) {
  return `${value.toFixed(2)}%`;
}

export function getPlatformLabel(platform: Platform) {
  const labels: Record<Platform, string> = {
    meta: "Meta Ads",
    google: "Google Ads",
    tiktok: "TikTok Ads",
  };
  return labels[platform];
}

// Aggregate metrics
export function getGlobalMetrics() {
  const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);
  const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
  const avgRoas = campaigns.reduce((sum, c) => sum + c.roas, 0) / campaigns.length;

  return { totalSpend, totalImpressions, totalClicks, totalConversions, avgRoas };
}

// Historical data for evolution charts
export interface DailyMetrics {
  date: string;
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
  conversions: number;
  platform?: Platform;
  brandId?: string;
}

// Generate mock historical data for last 30 days
function generateHistoricalData(platform?: Platform, brandId?: string): DailyMetrics[] {
  const data: DailyMetrics[] = [];
  const baseDate = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - i);

    const dayOfWeek = date.getDay();
    const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.7 : 1;
    const trendFactor = 1 + (29 - i) * 0.01;

    const baseImpressions = platform === "tiktok" ? 85000 : platform === "meta" ? 60000 : 45000;
    const baseCtr = platform === "tiktok" ? 3.8 : platform === "meta" ? 3.2 : 2.0;
    const baseSpend = platform === "tiktok" ? 250 : platform === "meta" ? 550 : 400;

    const impressions = Math.round(baseImpressions * weekendFactor * trendFactor * (0.85 + Math.random() * 0.3));
    const ctr = baseCtr * (0.9 + Math.random() * 0.2);
    const clicks = Math.round(impressions * (ctr / 100));
    const spend = Math.round(baseSpend * weekendFactor * trendFactor * (0.9 + Math.random() * 0.2));
    const conversions = Math.round(clicks * (0.02 + Math.random() * 0.02));

    data.push({
      date: date.toISOString().split('T')[0],
      impressions,
      clicks,
      ctr: Number(ctr.toFixed(2)),
      spend,
      conversions,
      platform,
      brandId,
    });
  }

  return data;
}

export const historicalData = {
  global: generateHistoricalData(),
  meta: generateHistoricalData("meta"),
  google: generateHistoricalData("google"),
  tiktok: generateHistoricalData("tiktok"),
};

// Balance spending history
export interface BalanceHistory {
  date: string;
  accountId: string;
  spent: number;
  balance: number;
}

function generateBalanceHistory(account: AdAccount): BalanceHistory[] {
  const data: BalanceHistory[] = [];
  const baseDate = new Date();
  let runningBalance = account.totalBudget;

  for (let i = 29; i >= 0; i--) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - i);

    const dayOfWeek = date.getDay();
    const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.6 : 1;
    const spent = Math.round(account.dailySpend * weekendFactor * (0.8 + Math.random() * 0.4));

    runningBalance = Math.max(0, runningBalance - spent);

    data.push({
      date: date.toISOString().split('T')[0],
      accountId: account.id,
      spent,
      balance: runningBalance,
    });
  }

  const lastEntry = data[data.length - 1];
  if (lastEntry) {
    lastEntry.balance = account.currentBalance;
  }

  return data;
}

export const balanceHistoryData: Record<string, BalanceHistory[]> = {};
adAccounts.forEach(account => {
  balanceHistoryData[account.id] = generateBalanceHistory(account);
});

export function getAggregatedBalanceHistory(
  accountId: string,
  period: "daily" | "weekly" | "monthly"
): { label: string; spent: number; balance: number }[] {
  const history = balanceHistoryData[accountId] || [];

  if (period === "daily") {
    return history.slice(-7).map(h => ({
      label: new Date(h.date).toLocaleDateString("pt-BR", { weekday: "short", day: "numeric" }),
      spent: h.spent,
      balance: h.balance,
    }));
  }

  if (period === "weekly") {
    const weeks: { label: string; spent: number; balance: number }[] = [];
    for (let i = 0; i < 4; i++) {
      const weekData = history.slice(i * 7, (i + 1) * 7);
      if (weekData.length > 0) {
        weeks.push({
          label: `Sem ${4 - i}`,
          spent: weekData.reduce((sum, d) => sum + d.spent, 0),
          balance: weekData[weekData.length - 1]?.balance || 0,
        });
      }
    }
    return weeks.reverse();
  }

  return [{
    label: new Date().toLocaleDateString("pt-BR", { month: "short" }),
    spent: history.reduce((sum, d) => sum + d.spent, 0),
    balance: history[history.length - 1]?.balance || 0,
  }];
}

export function getMetricsEvolution(
  platform?: Platform,
  period: "weekly" | "biweekly" | "monthly" = "weekly"
): { current: DailyMetrics[]; previous: DailyMetrics[]; comparison: { metric: string; current: number; previous: number; change: number }[] } {
  const data = platform ? historicalData[platform] : historicalData.global;
  const daysInPeriod = period === "weekly" ? 7 : period === "biweekly" ? 15 : 30;

  const current = data.slice(-daysInPeriod);
  const previous = data.slice(-daysInPeriod * 2, -daysInPeriod);

  const sumMetrics = (arr: DailyMetrics[]) => ({
    impressions: arr.reduce((s, d) => s + d.impressions, 0),
    clicks: arr.reduce((s, d) => s + d.clicks, 0),
    ctr: arr.reduce((s, d) => s + d.ctr, 0) / arr.length,
    spend: arr.reduce((s, d) => s + d.spend, 0),
    conversions: arr.reduce((s, d) => s + d.conversions, 0),
  });

  const currentSum = sumMetrics(current);
  const previousSum = sumMetrics(previous);

  const calcChange = (curr: number, prev: number) => prev > 0 ? ((curr - prev) / prev) * 100 : 0;

  return {
    current,
    previous,
    comparison: [
      { metric: "Impressões", current: currentSum.impressions, previous: previousSum.impressions, change: calcChange(currentSum.impressions, previousSum.impressions) },
      { metric: "Cliques", current: currentSum.clicks, previous: previousSum.clicks, change: calcChange(currentSum.clicks, previousSum.clicks) },
      { metric: "CTR", current: currentSum.ctr, previous: previousSum.ctr, change: calcChange(currentSum.ctr, previousSum.ctr) },
      { metric: "Investimento", current: currentSum.spend, previous: previousSum.spend, change: calcChange(currentSum.spend, previousSum.spend) },
      { metric: "Conversões", current: currentSum.conversions, previous: previousSum.conversions, change: calcChange(currentSum.conversions, previousSum.conversions) },
    ],
  };
}
