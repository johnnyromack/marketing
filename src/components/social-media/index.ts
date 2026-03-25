// Publishing components
export {
  ContentCalendar,
  PostComposer,
  PostCard,
  PostCardSkeleton,
  STATUS_CONFIG,
  PlatformSelector,
  PlatformChips,
} from './publishing';

// Competitive components
export {
  ShareOfVoiceChart,
  SentimentComparison,
  CompetitorCard,
  CompetitorCardSkeleton,
} from './competitive';

// Topics components
export {
  TopicsTree,
  TopicCard,
  TopicCardSkeleton,
  TrendIndicator,
} from './topics';

// Shared components
export {
  PlatformIcon,
  PlatformBadge,
  PLATFORM_CONFIG,
  SentimentBadge,
  SentimentIndicator,
} from './shared';

// Visual Listening components (Phase 3)
export {
  LogoDetectionCard,
  LogoDetectionCardSkeleton,
  VisualAnalyzer,
} from './visual';

// Media Monitoring components (Phase 3)
export {
  NewsCard,
  NewsCardSkeleton,
  MediaSourceManager,
} from './media';

// Analytics components (Phase 3)
export {
  HealthScoreCard,
  HealthScoreCardSkeleton,
  ReportGenerator,
  TrendChart,
  TrendChartSkeleton,
} from './analytics';

// Query Builder components (Phase 5)
export { DslQueryEditor } from './DslQueryEditor';

// Settings components
export {
  SettingsTabs,
  PreferencesTab,
  PlatformsTab,
  AlertsTab,
} from './settings';
export type { TabId, SettingsTabProps } from './settings';

// Automations components
export {
  TriggerIcon,
  ActionIcon,
  SummaryCards,
  AutomationCard,
  CreateAutomationSection,
  EmptyState as AutomationsEmptyState,
  LoadingState as AutomationsLoadingState,
} from './automations';
export type {
  TriggerType,
  ActionType,
  AutomationRule,
  AutomationCardProps,
  CreateAutomationSectionProps,
  SummaryCardsProps,
  EmptyStateProps,
} from './automations';

// Reports components
export {
  ReportCard,
  ScheduleCard,
  TemplateCard,
  CreateReportModal,
} from './reports';

// Sources components
export {
  SourceCard,
  ItemCard,
  CreateSourceModal,
} from './sources';
