/**
 * Social Media Hooks
 *
 * All hooks convert Next.js API-based fetching to direct Supabase queries.
 * Filtering is handled via RLS (user_id = auth.uid()) — no explicit user_id
 * filters needed in most queries.
 */

export { useSocialMediaHub } from './useSocialMediaHub';
export { useSocialInbox } from './useSocialInbox';
export type {
  Ticket,
  TicketWithMention,
  InboxStats,
  Queue,
  Macro,
  TicketResponse,
  CreateTicketInput,
  UpdateTicketInput,
  CreateResponseInput,
  InboxFilters,
  InboxPagination,
  UseSocialInboxOptions,
} from './useSocialInbox';

export { useSocialMediaPublishing } from './useSocialMediaPublishing';
export type {
  PostStatus,
  ScheduledPost,
  CreatePostInput,
  UpdatePostInput,
} from './useSocialMediaPublishing';

export { useSocialMediaAnalytics } from './useSocialMediaAnalytics';

export { useSocialMediaTopics } from './useSocialMediaTopics';
export type { TopicData } from './useSocialMediaTopics';

export { useSocialReports } from './useSocialReports';
export type {
  Report,
  ReportSchedule,
  ReportTemplate,
  ReportType,
  ReportStatus,
  ReportFormat,
  ScheduleFrequency,
  CreateReportInput,
  CreateScheduleInput,
  CreateTemplateInput,
  ReportsFilters,
  SchedulesFilters,
  ReportsPagination,
  UseSocialReportsOptions,
} from './useSocialReports';

export { useSocialSources } from './useSocialSources';
export type {
  MediaSource,
  SourceItem,
  SourceType,
  SourceCategory,
  SourceStatus,
  ItemSentiment,
  CreateMediaSourceInput,
  UpdateMediaSourceInput,
  SourcesFilters,
  ItemsFilters,
  SourcesPagination,
  SourceStats,
  UseSocialSourcesOptions,
} from './useSocialSources';

export { useSocialVisual } from './useSocialVisual';
export type {
  VisualDetection,
  VisualStats,
  DetectionType,
  RiskLevel,
  ProcessingStatus,
  VisualFilters,
  VisualPagination,
  UseSocialVisualOptions,
} from './useSocialVisual';

export { useSocialCompetitive } from './useSocialCompetitive';
export type {
  Competitor,
  CompetitiveMetric,
  CompetitiveAnalysisResult,
} from './useSocialCompetitive';

export { useBestTime } from './useBestTime';
export type { BestTimeSlot, BestTimeAnalysis } from './useBestTime';

export { useSocialMediaSettings } from './useSocialMediaSettings';
export type {
  SocialMediaSettings,
  UseSocialMediaSettingsOptions,
  UseSocialMediaSettingsReturn,
} from './useSocialMediaSettings';
export { defaultSocialMediaSettings } from './useSocialMediaSettings';

export { useWarRoomRealtime } from './useWarRoomRealtime';
