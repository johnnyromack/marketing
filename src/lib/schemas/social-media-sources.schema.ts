import { z } from 'zod';

// ============================================
// ENUMS
// ============================================

export const sourceTypeSchema = z.enum([
  'rss',
  'website',
  'podcast',
  'youtube',
  'google_news',
]);
export type SourceType = z.infer<typeof sourceTypeSchema>;

export const sourceCategorySchema = z.enum([
  'news',
  'blog',
  'press',
  'industry',
  'government',
  'social',
  'forum',
  'review',
]);
export type SourceCategory = z.infer<typeof sourceCategorySchema>;

export const sourceStatusSchema = z.enum([
  'active',
  'paused',
  'error',
  'pending_verification',
]);
export type SourceStatus = z.infer<typeof sourceStatusSchema>;

export const itemSentimentSchema = z.enum([
  'positive',
  'neutral',
  'negative',
  'mixed',
]);
export type ItemSentiment = z.infer<typeof itemSentimentSchema>;

export const itemProcessingStatusSchema = z.enum([
  'pending',
  'processing',
  'completed',
  'failed',
]);
export type ItemProcessingStatus = z.infer<typeof itemProcessingStatusSchema>;

export const checkStatusSchema = z.enum([
  'success',
  'error',
  'no_new_items',
]);
export type CheckStatus = z.infer<typeof checkStatusSchema>;

// ============================================
// MEDIA SOURCE SCHEMAS
// ============================================

export const sourceMetadataSchema = z.object({
  favicon_url: z.string().url().optional(),
  publisher_name: z.string().optional(),
  rss_version: z.string().optional(),
  etag: z.string().optional(),
  last_modified: z.string().optional(),
});
export type SourceMetadata = z.infer<typeof sourceMetadataSchema>;

export const mediaSourceSchema = z.object({
  id: z.string().uuid(),
  business_unit_id: z.string().uuid(),

  name: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  type: sourceTypeSchema,

  url: z.string().url(),
  feed_url: z.string().url().nullable().optional(),

  category: sourceCategorySchema.nullable().optional(),
  tier: z.number().min(1).max(3).default(3),
  country: z.string().length(2).nullable().optional(),
  language: z.string().default('pt'),

  credibility_score: z.number().min(0).max(100).nullable().optional(),
  monthly_visitors: z.number().nullable().optional(),
  domain_authority: z.number().min(0).max(100).nullable().optional(),

  check_interval: z.number().min(5).default(60),
  keywords: z.array(z.string()).default([]),
  exclude_keywords: z.array(z.string()).default([]),
  min_relevance_score: z.number().min(0).max(1).default(0.3),

  status: sourceStatusSchema.default('active'),
  is_verified: z.boolean().default(false),

  last_checked_at: z.string().datetime().nullable().optional(),
  last_item_at: z.string().datetime().nullable().optional(),
  last_error: z.string().nullable().optional(),
  error_count: z.number().default(0),
  consecutive_errors: z.number().default(0),

  metadata: sourceMetadataSchema.default({}),

  created_by: z.string().uuid().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type MediaSource = z.infer<typeof mediaSourceSchema>;

export const createMediaSourceSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: sourceTypeSchema,
  url: z.string().url(),
  feed_url: z.string().url().optional(),
  category: sourceCategorySchema.optional(),
  tier: z.number().min(1).max(3).optional(),
  country: z.string().length(2).optional(),
  language: z.string().optional(),
  credibility_score: z.number().min(0).max(100).optional(),
  monthly_visitors: z.number().optional(),
  domain_authority: z.number().min(0).max(100).optional(),
  check_interval: z.number().min(5).optional(),
  keywords: z.array(z.string()).optional(),
  exclude_keywords: z.array(z.string()).optional(),
  min_relevance_score: z.number().min(0).max(1).optional(),
});
export type CreateMediaSourceInput = z.infer<typeof createMediaSourceSchema>;

export const updateMediaSourceSchema = createMediaSourceSchema.partial().extend({
  status: sourceStatusSchema.optional(),
  is_verified: z.boolean().optional(),
});
export type UpdateMediaSourceInput = z.infer<typeof updateMediaSourceSchema>;

export const listMediaSourcesQuerySchema = z.object({
  type: sourceTypeSchema.optional(),
  category: sourceCategorySchema.optional(),
  tier: z.coerce.number().min(1).max(3).optional(),
  status: sourceStatusSchema.optional(),
  is_verified: z.coerce.boolean().optional(),
  language: z.string().optional(),
  search: z.string().optional(),
  sort_by: z.enum(['name', 'created_at', 'last_checked_at', 'tier']).default('name'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});
export type ListMediaSourcesQuery = z.infer<typeof listMediaSourcesQuerySchema>;

// ============================================
// SOURCE ITEM SCHEMAS
// ============================================

export const itemEntitiesSchema = z.object({
  people: z.array(z.string()).default([]),
  organizations: z.array(z.string()).default([]),
  locations: z.array(z.string()).default([]),
  products: z.array(z.string()).default([]),
});
export type ItemEntities = z.infer<typeof itemEntitiesSchema>;

export const sourceItemSchema = z.object({
  id: z.string().uuid(),
  source_id: z.string().uuid(),
  business_unit_id: z.string().uuid(),

  external_id: z.string().nullable().optional(),
  external_url: z.string().url(),

  title: z.string().min(1),
  summary: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  author: z.string().nullable().optional(),
  image_url: z.string().url().nullable().optional(),

  categories: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),

  sentiment: itemSentimentSchema.nullable().optional(),
  sentiment_score: z.number().min(-1).max(1).nullable().optional(),
  relevance_score: z.number().min(0).max(1).nullable().optional(),
  brands_mentioned: z.array(z.string()).default([]),
  entities: itemEntitiesSchema.default({}),
  topics: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),

  impact_score: z.number().min(0).max(100).nullable().optional(),
  reach_estimate: z.number().nullable().optional(),

  is_processed: z.boolean().default(false),
  processing_status: itemProcessingStatusSchema.default('pending'),
  processed_at: z.string().datetime().nullable().optional(),

  published_at: z.string().datetime().nullable().optional(),
  discovered_at: z.string().datetime(),
  created_at: z.string().datetime(),
});
export type SourceItem = z.infer<typeof sourceItemSchema>;

export const createSourceItemSchema = z.object({
  source_id: z.string().uuid(),
  external_id: z.string().optional(),
  external_url: z.string().url(),
  title: z.string().min(1),
  summary: z.string().optional(),
  content: z.string().optional(),
  author: z.string().optional(),
  image_url: z.string().url().optional(),
  categories: z.array(z.string()).optional(),
  published_at: z.string().datetime().optional(),
});
export type CreateSourceItemInput = z.infer<typeof createSourceItemSchema>;

export const updateSourceItemSchema = z.object({
  sentiment: itemSentimentSchema.optional(),
  sentiment_score: z.number().min(-1).max(1).optional(),
  relevance_score: z.number().min(0).max(1).optional(),
  brands_mentioned: z.array(z.string()).optional(),
  entities: itemEntitiesSchema.optional(),
  topics: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  impact_score: z.number().min(0).max(100).optional(),
  is_processed: z.boolean().optional(),
  processing_status: itemProcessingStatusSchema.optional(),
  processed_at: z.string().datetime().optional(),
});
export type UpdateSourceItemInput = z.infer<typeof updateSourceItemSchema>;

export const listSourceItemsQuerySchema = z.object({
  source_id: z.string().uuid().optional(),
  sentiment: itemSentimentSchema.optional(),
  min_relevance: z.coerce.number().min(0).max(1).optional(),
  min_impact: z.coerce.number().min(0).max(100).optional(),
  is_processed: z.coerce.boolean().optional(),
  brands_mentioned: z.array(z.string()).optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  search: z.string().optional(),
  sort_by: z.enum(['published_at', 'discovered_at', 'relevance_score', 'impact_score']).default('published_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});
export type ListSourceItemsQuery = z.infer<typeof listSourceItemsQuerySchema>;

// ============================================
// CHECK LOG SCHEMAS
// ============================================

export const sourceCheckLogSchema = z.object({
  id: z.string().uuid(),
  source_id: z.string().uuid(),

  status: checkStatusSchema,
  items_found: z.number().default(0),
  items_stored: z.number().default(0),
  items_skipped: z.number().default(0),

  started_at: z.string().datetime(),
  completed_at: z.string().datetime().nullable().optional(),
  duration_ms: z.number().nullable().optional(),

  error_message: z.string().nullable().optional(),
  error_type: z.string().nullable().optional(),

  http_status: z.number().nullable().optional(),
  response_size: z.number().nullable().optional(),
  etag: z.string().nullable().optional(),
  last_modified: z.string().nullable().optional(),

  created_at: z.string().datetime(),
});
export type SourceCheckLog = z.infer<typeof sourceCheckLogSchema>;

// ============================================
// STATS SCHEMAS
// ============================================

export const mediaMonitoringStatsSchema = z.object({
  total_sources: z.number(),
  active_sources: z.number(),
  sources_in_error: z.number(),
  total_items: z.number(),
  items_today: z.number(),
  items_pending_processing: z.number(),
  by_type: z.record(sourceTypeSchema, z.number()),
  by_category: z.record(sourceCategorySchema, z.number()),
  by_tier: z.record(z.string(), z.number()),
  avg_relevance_score: z.number(),
  high_impact_items: z.number(),
});
export type MediaMonitoringStats = z.infer<typeof mediaMonitoringStatsSchema>;

// ============================================
// RSS FETCH RESULT SCHEMAS
// ============================================

export const rssFetchResultSchema = z.object({
  success: z.boolean(),
  items_found: z.number(),
  items_stored: z.number(),
  items_skipped: z.number(),
  duration_ms: z.number(),
  error: z.string().optional(),
});
export type RssFetchResult = z.infer<typeof rssFetchResultSchema>;
