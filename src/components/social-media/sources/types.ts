import type {
  MediaSource,
  SourceItem,
  SourceType,
  SourceCategory,
  SourceStatus,
  ItemSentiment,
} from '@/lib/schemas/social-media-sources.schema';

export type TabType = 'sources' | 'items';

export interface StatsBarProps {
  sources: MediaSource[];
  items: SourceItem[];
}

export interface TabNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  counts: {
    sources: number;
    items: number;
  };
}

export interface SourceCardProps {
  source: MediaSource;
  onRefresh: () => void;
  onToggle: () => void;
  onDelete: () => void;
}

export interface ItemCardProps {
  item: SourceItem;
}

export interface EmptyStateProps {
  tab: TabType;
}

export interface CreateSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    name: string;
    type: SourceType;
    url: string;
    feed_url?: string;
    category?: SourceCategory;
    tier?: number;
  }) => void;
}

// Re-export schema types for convenience
export type {
  MediaSource,
  SourceItem,
  SourceType,
  SourceCategory,
  SourceStatus,
  ItemSentiment,
};
