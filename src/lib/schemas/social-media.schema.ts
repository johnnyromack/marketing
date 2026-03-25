import { z } from 'zod';

// ============================================
// ENUMS
// ============================================

export const socialPlatformSchema = z.enum([
  'instagram',
  'facebook',
  'google_business',
  'linkedin',
  'tiktok',
  'twitter',
  'youtube',
  'reddit'
]);
export type SocialPlatform = z.infer<typeof socialPlatformSchema>;

export const connectorStatusSchema = z.enum([
  'connected',
  'expired',
  'limited',
  'error',
  'disconnected'
]);
export type ConnectorStatus = z.infer<typeof connectorStatusSchema>;

export const sentimentSchema = z.enum(['positive', 'negative', 'neutral']);
export type Sentiment = z.infer<typeof sentimentSchema>;

export const mentionIntentSchema = z.enum([
  'complaint',
  'praise',
  'question',
  'lead',
  'crisis',
  'neutral'
]);
export type MentionIntent = z.infer<typeof mentionIntentSchema>;

export const mentionContentTypeSchema = z.enum([
  'post',
  'comment',
  'reply',
  'story',
  'review',
  'dm'
]);
export type MentionContentType = z.infer<typeof mentionContentTypeSchema>;

export const queryStatusSchema = z.enum(['draft', 'published', 'archived']);
export type QueryStatus = z.infer<typeof queryStatusSchema>;

export const crisisSeveritySchema = z.enum(['P1', 'P2', 'P3', 'P4']);
export type CrisisSeverity = z.infer<typeof crisisSeveritySchema>;

export const crisisStatusSchema = z.enum([
  'detecting',
  'active',
  'contained',
  'resolved'
]);
export type CrisisStatus = z.infer<typeof crisisStatusSchema>;

export const crisisAlertTypeSchema = z.enum([
  'volume_spike',
  'sentiment_drop',
  'influencer',
  'keyword'
]);
export type CrisisAlertType = z.infer<typeof crisisAlertTypeSchema>;

export const postStatusSchema = z.enum([
  'draft',
  'pending_approval',
  'approved',
  'scheduled',
  'published',
  'failed'
]);
export type PostStatus = z.infer<typeof postStatusSchema>;

export const assetTypeSchema = z.enum(['image', 'video', 'document']);
export type AssetType = z.infer<typeof assetTypeSchema>;

export const insightTypeSchema = z.enum([
  'summary',
  'trend',
  'anomaly',
  'recommendation'
]);
export type InsightType = z.infer<typeof insightTypeSchema>;

// ============================================
// CONNECTOR SCHEMAS
// ============================================

export const connectorSchema = z.object({
  id: z.string().uuid(),
  business_unit_id: z.string().uuid(),
  platform: socialPlatformSchema,
  status: connectorStatusSchema,
  account_name: z.string().nullable().optional(),
  account_id: z.string().nullable().optional(),
  scopes: z.array(z.string()).nullable().optional(),
  last_sync_at: z.string().datetime().nullable().optional(),
  error_message: z.string().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});
export type Connector = z.infer<typeof connectorSchema>;

export const createConnectorSchema = z.object({
  platform: socialPlatformSchema,
  auth_code: z.string().optional(),
  access_token: z.string().optional()
});
export type CreateConnectorInput = z.infer<typeof createConnectorSchema>;

export const updateConnectorSchema = z.object({
  status: connectorStatusSchema.optional(),
  account_name: z.string().optional(),
  error_message: z.string().nullable().optional()
});
export type UpdateConnectorInput = z.infer<typeof updateConnectorSchema>;

export const listConnectorsQuerySchema = z.object({
  platform: socialPlatformSchema.optional(),
  status: connectorStatusSchema.optional()
});
export type ListConnectorsQuery = z.infer<typeof listConnectorsQuerySchema>;

// ============================================
// AUTHOR SCHEMAS
// ============================================

export const authorSchema = z.object({
  id: z.string(),
  platform: socialPlatformSchema,
  username: z.string(),
  display_name: z.string().nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
  followers_count: z.number().nullable().optional(),
  verified: z.boolean().default(false),
  profile_url: z.string().url().nullable().optional()
});
export type Author = z.infer<typeof authorSchema>;

// ============================================
// ENGAGEMENT SCHEMAS
// ============================================

export const engagementSchema = z.object({
  likes: z.number().default(0),
  comments: z.number().default(0),
  shares: z.number().default(0),
  views: z.number().nullable().optional(),
  reach: z.number().nullable().optional(),
  engagement_rate: z.number().nullable().optional()
});
export type Engagement = z.infer<typeof engagementSchema>;

// ============================================
// MENTION SCHEMAS
// ============================================

export const mentionMediaSchema = z.object({
  type: z.enum(['image', 'video', 'link']),
  url: z.string().url(),
  thumbnail_url: z.string().url().nullable().optional()
});
export type MentionMedia = z.infer<typeof mentionMediaSchema>;

export const mentionEntitySchema = z.object({
  type: z.string(),
  value: z.string(),
  confidence: z.number().min(0).max(1)
});
export type MentionEntity = z.infer<typeof mentionEntitySchema>;

export const mentionSchema = z.object({
  id: z.string().uuid(),
  business_unit_id: z.string().uuid(),
  query_id: z.string().uuid().nullable().optional(),
  platform: socialPlatformSchema,
  external_id: z.string(),
  external_url: z.string().url().nullable().optional(),
  content: z.string(),
  content_type: mentionContentTypeSchema,
  author: authorSchema,
  sentiment: sentimentSchema,
  sentiment_score: z.number().min(-1).max(1),
  sentiment_confidence: z.number().min(0).max(1),
  sentiment_corrected_by: z.string().uuid().nullable().optional(),
  sentiment_corrected_at: z.string().datetime().nullable().optional(),
  intent: mentionIntentSchema,
  topics: z.array(z.string()),
  entities: z.array(mentionEntitySchema).nullable().optional(),
  engagement: engagementSchema,
  media: z.array(mentionMediaSchema).nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  thread_id: z.string().uuid().nullable().optional(),
  is_reply: z.boolean().default(false),
  language: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  published_at: z.string().datetime(),
  fetched_at: z.string().datetime(),
  created_at: z.string().datetime()
});
export type Mention = z.infer<typeof mentionSchema>;

export const listMentionsQuerySchema = z.object({
  query_id: z.string().uuid().optional(),
  platform: socialPlatformSchema.optional(),
  sentiment: sentimentSchema.optional(),
  intent: mentionIntentSchema.optional(),
  topic: z.string().optional(),
  author_id: z.string().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  search: z.string().optional(),
  sort_by: z.enum(['published_at', 'engagement', 'sentiment_score']).default('published_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0)
});
export type ListMentionsQuery = z.infer<typeof listMentionsQuerySchema>;

export const correctSentimentSchema = z.object({
  sentiment: sentimentSchema,
  reason: z.string().optional()
});
export type CorrectSentimentInput = z.infer<typeof correctSentimentSchema>;

export const createMentionSchema = z.object({
  platform: socialPlatformSchema,
  external_id: z.string(),
  external_url: z.string().url().nullable().optional(),
  content: z.string(),
  content_type: mentionContentTypeSchema,
  author: z.object({
    id: z.string(),
    username: z.string(),
    display_name: z.string().nullable().optional(),
    avatar_url: z.string().url().nullable().optional(),
    followers_count: z.number().nullable().optional(),
    verified: z.boolean().optional(),
    profile_url: z.string().url().nullable().optional(),
  }),
  engagement: z.object({
    likes: z.number().default(0),
    comments: z.number().default(0),
    shares: z.number().default(0),
    views: z.number().nullable().optional(),
    reach: z.number().nullable().optional(),
  }),
  media: z.array(mentionMediaSchema).nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  thread_id: z.string().uuid().nullable().optional(),
  is_reply: z.boolean().default(false),
  language: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  published_at: z.string().datetime(),
});
export type CreateMentionInput = z.infer<typeof createMentionSchema>;

export const updateMentionSchema = z.object({
  sentiment: sentimentSchema.optional(),
  sentiment_score: z.number().min(-1).max(1).optional(),
  sentiment_confidence: z.number().min(0).max(1).optional(),
  intent: mentionIntentSchema.optional(),
  topics: z.array(z.string()).optional(),
  entities: z.array(mentionEntitySchema).optional(),
  engagement: z.object({
    likes: z.number(),
    comments: z.number(),
    shares: z.number(),
    views: z.number().nullable().optional(),
    reach: z.number().nullable().optional(),
  }).optional(),
  language: z.string().nullable().optional(),
});
export type UpdateMentionInput = z.infer<typeof updateMentionSchema>;

export const mentionResponseSchema = mentionSchema;
export type MentionResponse = z.infer<typeof mentionResponseSchema>;

// ============================================
// QUERY SCHEMAS
// ============================================

export const queryTermSchema = z.object({
  term: z.string().min(1),
  type: z.enum(['include', 'exclude', 'required']),
  proximity: z.number().optional()
});
export type QueryTerm = z.infer<typeof queryTermSchema>;

export const socialMediaQuerySchema = z.object({
  id: z.string().uuid(),
  business_unit_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
  terms: z.array(queryTermSchema),
  platforms: z.array(socialPlatformSchema),
  languages: z.array(z.string()).nullable().optional(),
  locations: z.array(z.string()).nullable().optional(),
  status: queryStatusSchema,
  version: z.number().default(1),
  noise_score: z.number().min(0).max(100).nullable().optional(),
  volume_estimate: z.number().nullable().optional(),
  created_by: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  published_at: z.string().datetime().nullable().optional()
});
export type SocialMediaQuery = z.infer<typeof socialMediaQuerySchema>;

export const createSocialMediaQuerySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  terms: z.array(queryTermSchema).min(1),
  platforms: z.array(socialPlatformSchema).min(1),
  languages: z.array(z.string()).optional(),
  locations: z.array(z.string()).optional()
});
export type CreateSocialMediaQueryInput = z.infer<typeof createSocialMediaQuerySchema>;

export const updateSocialMediaQuerySchema = createSocialMediaQuerySchema.partial();
export type UpdateSocialMediaQueryInput = z.infer<typeof updateSocialMediaQuerySchema>;

export const listSocialMediaQueriesQuerySchema = z.object({
  status: queryStatusSchema.optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0)
});
export type ListSocialMediaQueriesQuery = z.infer<typeof listSocialMediaQueriesQuerySchema>;

// ============================================
// TOPIC SCHEMAS
// ============================================

export const topicSchema = z.object({
  id: z.string().uuid(),
  business_unit_id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  type: z.enum(['auto', 'manual']),
  parent_id: z.string().uuid().nullable().optional(),
  keywords: z.array(z.string()),
  mention_count: z.number().default(0),
  sentiment_avg: z.number().nullable().optional(),
  trend: z.enum(['rising', 'stable', 'falling']).nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});
export type Topic = z.infer<typeof topicSchema>;

export const createTopicSchema = z.object({
  name: z.string().min(1),
  parent_id: z.string().uuid().optional(),
  keywords: z.array(z.string()).optional()
});
export type CreateTopicInput = z.infer<typeof createTopicSchema>;

export const updateTopicSchema = createTopicSchema.partial();
export type UpdateTopicInput = z.infer<typeof updateTopicSchema>;

// ============================================
// CRISIS SCHEMAS
// ============================================

export const crisisAlertSchema = z.object({
  id: z.string().uuid(),
  business_unit_id: z.string().uuid(),
  type: crisisAlertTypeSchema,
  severity: crisisSeveritySchema,
  title: z.string(),
  description: z.string(),
  trigger_value: z.number(),
  threshold: z.number(),
  sample_mention_ids: z.array(z.string().uuid()),
  created_at: z.string().datetime(),
  acknowledged_at: z.string().datetime().nullable().optional(),
  acknowledged_by: z.string().uuid().nullable().optional(),
  metadata: z.record(z.unknown()).nullable().optional()
});
export type CrisisAlert = z.infer<typeof crisisAlertSchema>;

export const createAlertSchema = z.object({
  type: crisisAlertTypeSchema,
  severity: crisisSeveritySchema,
  message: z.string(),
  metadata: z.record(z.unknown()).optional(),
});
export type CreateAlertInput = z.infer<typeof createAlertSchema>;

export const crisisTimelineEventSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['detected', 'escalated', 'action', 'response', 'contained', 'resolved', 'note']),
  title: z.string(),
  description: z.string().optional(),
  author_id: z.string().uuid(),
  author_name: z.string(),
  evidence_ids: z.array(z.string().uuid()).optional(),
  created_at: z.string().datetime()
});
export type CrisisTimelineEvent = z.infer<typeof crisisTimelineEventSchema>;

export const crisisEvidenceSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['mention', 'screenshot', 'document', 'link']),
  url: z.string(),
  title: z.string().optional(),
  added_by: z.string().uuid(),
  added_at: z.string().datetime()
});
export type CrisisEvidence = z.infer<typeof crisisEvidenceSchema>;

export const crisisChecklistItemSchema = z.object({
  id: z.string().uuid(),
  task: z.string(),
  completed: z.boolean().default(false),
  completed_by: z.string().uuid().optional(),
  completed_at: z.string().datetime().optional()
});
export type CrisisChecklistItem = z.infer<typeof crisisChecklistItemSchema>;

export const crisisIncidentSchema = z.object({
  id: z.string().uuid(),
  business_unit_id: z.string().uuid(),
  alert_id: z.string().uuid().nullable().optional(),
  playbook_id: z.string().uuid().nullable().optional(),
  severity: crisisSeveritySchema,
  status: crisisStatusSchema,
  title: z.string(),
  description: z.string().nullable().optional(),
  timeline: z.array(crisisTimelineEventSchema),
  evidence: z.array(crisisEvidenceSchema),
  checklist: z.array(crisisChecklistItemSchema).nullable().optional(),
  owner_id: z.string().uuid().nullable().optional(),
  team_ids: z.array(z.string().uuid()).nullable().optional(),
  created_at: z.string().datetime(),
  resolved_at: z.string().datetime().nullable().optional(),
  postmortem: z.string().nullable().optional()
});
export type CrisisIncident = z.infer<typeof crisisIncidentSchema>;

export const createIncidentSchema = z.object({
  alert_id: z.string().uuid().optional(),
  severity: crisisSeveritySchema,
  title: z.string(),
  description: z.string().optional(),
  playbook_id: z.string().uuid().optional()
});
export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;

export const updateIncidentSchema = z.object({
  severity: crisisSeveritySchema.optional(),
  status: crisisStatusSchema.optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  owner_id: z.string().uuid().optional(),
  postmortem: z.string().optional()
});
export type UpdateIncidentInput = z.infer<typeof updateIncidentSchema>;

export const addTimelineEventSchema = z.object({
  type: z.enum(['detected', 'escalated', 'action', 'response', 'contained', 'resolved', 'note']),
  title: z.string(),
  description: z.string().optional(),
  evidence_ids: z.array(z.string().uuid()).optional()
});
export type AddTimelineEventInput = z.infer<typeof addTimelineEventSchema>;

export const addEvidenceSchema = z.object({
  type: z.enum(['mention', 'screenshot', 'document', 'link']),
  url: z.string(),
  title: z.string().optional()
});
export type AddEvidenceInput = z.infer<typeof addEvidenceSchema>;

export const listAlertsQuerySchema = z.object({
  severity: crisisSeveritySchema.optional(),
  type: crisisAlertTypeSchema.optional(),
  acknowledged: z.coerce.boolean().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0)
});
export type ListAlertsQuery = z.infer<typeof listAlertsQuerySchema>;

export const listIncidentsQuerySchema = z.object({
  status: crisisStatusSchema.optional(),
  severity: crisisSeveritySchema.optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0)
});
export type ListIncidentsQuery = z.infer<typeof listIncidentsQuerySchema>;

// ============================================
// PLAYBOOK SCHEMAS
// ============================================

export const playbookChecklistItemSchema = z.object({
  order: z.number(),
  task: z.string(),
  owner_role: z.string().optional(),
  sla_minutes: z.number().optional()
});
export type PlaybookChecklistItem = z.infer<typeof playbookChecklistItemSchema>;

export const playbookSchema = z.object({
  id: z.string().uuid(),
  business_unit_id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
  severity: crisisSeveritySchema,
  trigger_keywords: z.array(z.string()).nullable().optional(),
  checklist: z.array(playbookChecklistItemSchema),
  notification_channels: z.array(z.enum(['email', 'slack', 'whatsapp'])).nullable().optional(),
  notification_users: z.array(z.string().uuid()).nullable().optional(),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});
export type Playbook = z.infer<typeof playbookSchema>;

export const createPlaybookSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  severity: crisisSeveritySchema,
  trigger_keywords: z.array(z.string()).optional(),
  checklist: z.array(playbookChecklistItemSchema).min(1),
  notification_channels: z.array(z.enum(['email', 'slack', 'whatsapp'])).optional(),
  notification_users: z.array(z.string().uuid()).optional()
});
export type CreatePlaybookInput = z.infer<typeof createPlaybookSchema>;

export const updatePlaybookSchema = createPlaybookSchema.partial().extend({
  is_active: z.boolean().optional()
});
export type UpdatePlaybookInput = z.infer<typeof updatePlaybookSchema>;

// ============================================
// PUBLISHING SCHEMAS
// ============================================

export const postMediaSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['image', 'video']),
  url: z.string().url(),
  alt_text: z.string().optional()
});
export type PostMedia = z.infer<typeof postMediaSchema>;

export const postContentSchema = z.object({
  text: z.string(),
  variations: z.record(socialPlatformSchema, z.string()).optional()
});
export type PostContent = z.infer<typeof postContentSchema>;

export const postApprovalSchema = z.object({
  required: z.boolean(),
  approved_by: z.string().uuid().optional(),
  approved_at: z.string().datetime().optional(),
  rejected_by: z.string().uuid().optional(),
  rejected_at: z.string().datetime().optional(),
  rejection_reason: z.string().optional()
});
export type PostApproval = z.infer<typeof postApprovalSchema>;

export const postResultSchema = z.object({
  post_id: z.string(),
  url: z.string().url(),
  engagement: engagementSchema.optional()
});
export type PostResult = z.infer<typeof postResultSchema>;

export const scheduledPostSchema = z.object({
  id: z.string().uuid(),
  business_unit_id: z.string().uuid(),
  platforms: z.array(socialPlatformSchema),
  content: postContentSchema,
  media: z.array(postMediaSchema).nullable().optional(),
  status: postStatusSchema,
  scheduled_for: z.string().datetime().nullable().optional(),
  published_at: z.string().datetime().nullable().optional(),
  campaign_id: z.string().uuid().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  approval: postApprovalSchema.nullable().optional(),
  results: z.record(socialPlatformSchema, postResultSchema).nullable().optional(),
  created_by: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});
export type ScheduledPost = z.infer<typeof scheduledPostSchema>;

export const createPostSchema = z.object({
  platforms: z.array(socialPlatformSchema).min(1),
  content: postContentSchema,
  media_ids: z.array(z.string().uuid()).optional(),
  scheduled_for: z.string().datetime().optional(),
  campaign_id: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  require_approval: z.boolean().default(false)
});
export type CreatePostInput = z.infer<typeof createPostSchema>;

export const updatePostSchema = createPostSchema.partial();
export type UpdatePostInput = z.infer<typeof updatePostSchema>;

export const listPostsQuerySchema = z.object({
  status: postStatusSchema.optional(),
  platform: socialPlatformSchema.optional(),
  campaign_id: z.string().uuid().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0)
});
export type ListPostsQuery = z.infer<typeof listPostsQuerySchema>;

export const approvePostSchema = z.object({
  approved: z.boolean(),
  rejection_reason: z.string().optional()
});
export type ApprovePostInput = z.infer<typeof approvePostSchema>;

// ============================================
// ASSET SCHEMAS
// ============================================

export const assetSchema = z.object({
  id: z.string().uuid(),
  business_unit_id: z.string().uuid(),
  name: z.string(),
  type: assetTypeSchema,
  mime_type: z.string(),
  url: z.string().url(),
  thumbnail_url: z.string().url().nullable().optional(),
  size_bytes: z.number(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  campaign_id: z.string().uuid().nullable().optional(),
  expires_at: z.string().datetime().nullable().optional(),
  created_by: z.string().uuid(),
  created_at: z.string().datetime()
});
export type Asset = z.infer<typeof assetSchema>;

export const createAssetSchema = z.object({
  name: z.string(),
  type: assetTypeSchema,
  mime_type: z.string(),
  url: z.string().url(),
  thumbnail_url: z.string().url().optional(),
  size_bytes: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  tags: z.array(z.string()).optional(),
  campaign_id: z.string().uuid().optional(),
  expires_at: z.string().datetime().optional()
});
export type CreateAssetInput = z.infer<typeof createAssetSchema>;

export const listAssetsQuerySchema = z.object({
  type: assetTypeSchema.optional(),
  campaign_id: z.string().uuid().optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0)
});
export type ListAssetsQuery = z.infer<typeof listAssetsQuerySchema>;

// ============================================
// ANALYTICS SCHEMAS
// ============================================

export const dashboardStatsSchema = z.object({
  period: z.object({
    from: z.string().datetime(),
    to: z.string().datetime()
  }),
  mentions: z.object({
    total: z.number(),
    change_percent: z.number(),
    by_platform: z.record(socialPlatformSchema, z.number()),
    by_sentiment: z.record(sentimentSchema, z.number())
  }),
  engagement: z.object({
    total: z.number(),
    change_percent: z.number(),
    avg_per_post: z.number()
  }),
  sentiment: z.object({
    score: z.number().min(-1).max(1),
    change: z.number(),
    positive_percent: z.number(),
    negative_percent: z.number()
  }),
  response: z.object({
    avg_time_minutes: z.number(),
    sla_compliance_percent: z.number()
  }),
  top_topics: z.array(z.object({
    topic: z.string(),
    count: z.number(),
    sentiment_avg: z.number()
  })),
  active_incidents: z.number()
});
export type DashboardStats = z.infer<typeof dashboardStatsSchema>;

export const dashboardQuerySchema = z.object({
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  platform: socialPlatformSchema.optional()
});
export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;

export const insightSchema = z.object({
  id: z.string().uuid(),
  business_unit_id: z.string().uuid(),
  type: insightTypeSchema,
  title: z.string(),
  content: z.string(),
  confidence: z.number().min(0).max(1),
  evidence_ids: z.array(z.string().uuid()),
  period_from: z.string().datetime(),
  period_to: z.string().datetime(),
  created_at: z.string().datetime()
});
export type Insight = z.infer<typeof insightSchema>;

export const generateInsightSchema = z.object({
  type: insightTypeSchema.optional(),
  date_from: z.string().datetime(),
  date_to: z.string().datetime(),
  query_id: z.string().uuid().optional()
});
export type GenerateInsightInput = z.infer<typeof generateInsightSchema>;

// ============================================
// COMPETITIVE SCHEMAS
// ============================================

export const shareOfVoiceSchema = z.object({
  brand: z.string(),
  mentions: z.number(),
  percentage: z.number(),
  sentiment_avg: z.number(),
  top_topics: z.array(z.string())
});
export type ShareOfVoice = z.infer<typeof shareOfVoiceSchema>;

export const competitiveAnalysisSchema = z.object({
  period: z.object({
    from: z.string().datetime(),
    to: z.string().datetime()
  }),
  share_of_voice: z.array(shareOfVoiceSchema),
  sentiment_comparison: z.record(z.string(), z.object({
    positive: z.number(),
    negative: z.number(),
    neutral: z.number()
  }))
});
export type CompetitiveAnalysis = z.infer<typeof competitiveAnalysisSchema>;

// ============================================
// API RESPONSE SCHEMAS
// ============================================

export const socialMediaApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    meta: z.object({
      total: z.number().optional(),
      limit: z.number().optional(),
      offset: z.number().optional()
    }).optional()
  });

export const paginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
    has_more: z.boolean()
  });
