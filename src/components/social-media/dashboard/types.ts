import type { Connector, Mention, CrisisAlert, Topic } from '@/lib/schemas/social-media.schema';

export interface QuickActionsProps {
  className?: string;
}

export interface StatsCardsProps {
  className?: string;
  stats: {
    mentions: { today: number; change: number };
    sentiment: { average: number; change: number };
    alerts: { active: number };
    posts: { scheduled: number };
  } | null;
  isLoading: boolean;
}

export interface ConnectedPlatformsProps {
  className?: string;
  connectors: Connector[];
  isLoading: boolean;
}

export interface RecentMentionsProps {
  className?: string;
  mentions: Mention[];
  isLoading: boolean;
}

export interface CrisisAlertsProps {
  className?: string;
  alerts: CrisisAlert[];
  isLoading: boolean;
}

export interface TopTopicsProps {
  className?: string;
  topics: Topic[];
  isLoading: boolean;
}

// Re-export schema types
export type { Connector, Mention, CrisisAlert, Topic };
