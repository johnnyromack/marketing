import { z } from 'zod';
import { socialPlatformSchema } from './social-media.schema';

// ============================================
// ENUMS
// ============================================

export const competitorCategorySchema = z.enum([
  'direct',
  'indirect',
  'aspirational',
]);
export type CompetitorCategory = z.infer<typeof competitorCategorySchema>;

export const competitorTierSchema = z.enum(['1', '2', '3']);
export type CompetitorTier = z.infer<typeof competitorTierSchema>;

export const detectionMethodSchema = z.enum(['keyword', 'ner', 'manual']);
export type DetectionMethod = z.infer<typeof detectionMethodSchema>;

// ============================================
// COMPETITOR SCHEMAS
// ============================================

export const socialHandlesSchema = z.record(socialPlatformSchema, z.string());
export type SocialHandles = z.infer<typeof socialHandlesSchema>;

export const competitorMetricsSchema = z.object({
  mentions_30d: z.number().default(0),
  sentiment_positive: z.number().default(0),
  sentiment_negative: z.number().default(0),
  sentiment_neutral: z.number().default(0),
  sentiment_avg: z.number().default(0),
  engagement_total: z.number().default(0),
  reach_total: z.number().default(0),
  sov_percentage: z.number().default(0),
  platforms: z.record(z.string(), z.number()).default({}),
});
export type CompetitorMetrics = z.infer<typeof competitorMetricsSchema>;

export const competitorSchema = z.object({
  id: z.string().uuid(),
  business_unit_id: z.string().uuid(),

  name: z.string().min(1).max(255),
  display_name: z.string().max(255).nullable().optional(),
  description: z.string().nullable().optional(),

  aliases: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),

  social_handles: socialHandlesSchema.default({}),

  industry: z.string().max(100).nullable().optional(),
  category: competitorCategorySchema.nullable().optional(),
  tier: z.number().min(1).max(3).default(2),

  logo_url: z.string().url().nullable().optional(),
  brand_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .nullable()
    .optional(),

  is_active: z.boolean().default(true),
  track_mentions: z.boolean().default(true),
  track_sentiment: z.boolean().default(true),

  cached_metrics: competitorMetricsSchema.default({}),
  metrics_updated_at: z.string().datetime().nullable().optional(),

  metadata: z.record(z.unknown()).default({}),

  created_by: z.string().uuid().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Competitor = z.infer<typeof competitorSchema>;

export const createCompetitorSchema = z.object({
  name: z.string().min(1).max(255),
  display_name: z.string().max(255).optional(),
  description: z.string().optional(),
  aliases: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  social_handles: socialHandlesSchema.optional(),
  industry: z.string().max(100).optional(),
  category: competitorCategorySchema.optional(),
  tier: z.number().min(1).max(3).optional(),
  logo_url: z.string().url().optional(),
  brand_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
});
export type CreateCompetitorInput = z.infer<typeof createCompetitorSchema>;

export const updateCompetitorSchema = createCompetitorSchema.partial().extend({
  is_active: z.boolean().optional(),
  track_mentions: z.boolean().optional(),
  track_sentiment: z.boolean().optional(),
});
export type UpdateCompetitorInput = z.infer<typeof updateCompetitorSchema>;

export const listCompetitorsQuerySchema = z.object({
  category: competitorCategorySchema.optional(),
  tier: z.coerce.number().min(1).max(3).optional(),
  is_active: z.coerce.boolean().optional(),
  search: z.string().optional(),
  sort_by: z.enum(['name', 'created_at', 'tier']).default('name'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});
export type ListCompetitorsQuery = z.infer<typeof listCompetitorsQuerySchema>;

// ============================================
// COMPETITOR MENTION SCHEMAS
// ============================================

export const competitorMentionSchema = z.object({
  id: z.string().uuid(),
  competitor_id: z.string().uuid(),
  mention_id: z.string().uuid(),

  detection_method: detectionMethodSchema.default('keyword'),
  confidence: z.number().min(0).max(1).default(1),
  matched_term: z.string().nullable().optional(),

  platform: z.string().nullable().optional(),
  sentiment: z.string().nullable().optional(),
  engagement_total: z.number().default(0),
  reach: z.number().default(0),
  published_at: z.string().datetime().nullable().optional(),

  created_at: z.string().datetime(),
});
export type CompetitorMention = z.infer<typeof competitorMentionSchema>;

export const createCompetitorMentionSchema = z.object({
  competitor_id: z.string().uuid(),
  mention_id: z.string().uuid(),
  detection_method: detectionMethodSchema.optional(),
  confidence: z.number().min(0).max(1).optional(),
  matched_term: z.string().optional(),
  platform: z.string().optional(),
  sentiment: z.string().optional(),
  engagement_total: z.number().optional(),
  reach: z.number().optional(),
  published_at: z.string().datetime().optional(),
});
export type CreateCompetitorMentionInput = z.infer<typeof createCompetitorMentionSchema>;

// ============================================
// SHARE OF VOICE SCHEMAS
// ============================================

export const shareOfVoiceEntrySchema = z.object({
  competitor_id: z.string().uuid(),
  name: z.string(),
  mentions: z.number(),
  share_percentage: z.number(),
  sentiment_avg: z.number(),
  engagement_total: z.number(),
  reach_total: z.number(),
  trend: z.enum(['up', 'down', 'stable']),
  trend_percentage: z.number(),
});
export type ShareOfVoiceEntry = z.infer<typeof shareOfVoiceEntrySchema>;

export const shareOfVoiceResultSchema = z.object({
  period: z.object({
    from: z.string().datetime(),
    to: z.string().datetime(),
  }),
  total_mentions: z.number(),
  our_brand: shareOfVoiceEntrySchema,
  competitors: z.array(shareOfVoiceEntrySchema),
  by_platform: z.record(z.string(), z.array(shareOfVoiceEntrySchema)),
});
export type ShareOfVoiceResult = z.infer<typeof shareOfVoiceResultSchema>;

export const shareOfVoiceQuerySchema = z.object({
  date_from: z.string().datetime(),
  date_to: z.string().datetime(),
  platforms: z.array(z.string()).optional(),
  competitor_ids: z.array(z.string().uuid()).optional(),
});
export type ShareOfVoiceQuery = z.infer<typeof shareOfVoiceQuerySchema>;

// ============================================
// COMPETITIVE ANALYSIS SCHEMAS
// ============================================

export const competitiveComparisonSchema = z.object({
  competitor_id: z.string().uuid(),
  name: z.string(),
  metrics: z.object({
    mentions: z.number(),
    sentiment: z.number(),
    engagement: z.number(),
    reach: z.number(),
  }),
  vs_our_brand: z.object({
    mentions_diff: z.number(),
    sentiment_diff: z.number(),
    engagement_diff: z.number(),
    reach_diff: z.number(),
  }),
  top_posts: z.array(
    z.object({
      id: z.string(),
      content: z.string(),
      platform: z.string(),
      engagement: z.number(),
    })
  ),
  topics: z.array(
    z.object({
      name: z.string(),
      mentions: z.number(),
    })
  ),
});
export type CompetitiveComparison = z.infer<typeof competitiveComparisonSchema>;

export const competitiveAnalysisResultSchema = z.object({
  period: z.object({
    from: z.string().datetime(),
    to: z.string().datetime(),
  }),
  our_brand: z.object({
    mentions: z.number(),
    sentiment: z.number(),
    engagement: z.number(),
    reach: z.number(),
  }),
  competitors: z.array(competitiveComparisonSchema),
  insights: z.array(z.string()),
  recommendations: z.array(z.string()),
});
export type CompetitiveAnalysisResult = z.infer<typeof competitiveAnalysisResultSchema>;
