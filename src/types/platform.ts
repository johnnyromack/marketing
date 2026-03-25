// Platform types
export type Platform = "meta" | "google" | "tiktok";

export interface Brand {
  id: string;
  name: string;
  logo?: string;
  createdAt: Date;
}

export interface AdAccount {
  id: string;
  name: string;
  platform: Platform;
  brandId: string;
  currentBalance: number;
  totalBudget: number;
  dailySpend: number;
  currency: string;
}

export interface Campaign {
  id: string;
  name: string;
  platform: Platform;
  brandId: string;
  accountId: string;
  status: "active" | "paused" | "completed";
  objective: "awareness" | "traffic" | "engagement" | "leads" | "sales";
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  roas: number;
  ctr: number;
  cpc: number;
  startDate: Date;
  endDate?: Date;
  adsCount: number;
}

export interface BalanceStatus {
  status: "healthy" | "warning" | "critical";
  percentage: number;
  daysRemaining: number;
}

export interface MetricCard {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
}

// AI Analysis types
export interface AIAnalysis {
  id: string;
  campaignId?: string;
  brandId?: string;
  type: "comparative" | "prediction" | "budget" | "creative";
  healthScore: number;
  insights: AIInsight[];
  recommendations: AIRecommendation[];
  createdAt: Date;
}

export interface AIInsight {
  id: string;
  title: string;
  description: string;
  impact: "positive" | "negative" | "neutral";
  metric?: string;
  value?: number;
}

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  category: "budget" | "creative" | "targeting" | "bidding";
  projectedImpact?: string;
}

// Chat types
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  context?: {
    campaignId?: string;
    brandId?: string;
    page?: string;
  };
}
