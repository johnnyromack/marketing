import { z } from 'zod';

// ============================================
// ENUMS
// ============================================

export const detectionTypeSchema = z.enum([
  'logo',
  'text',
  'product',
  'scene',
  'face',
  'object',
]);
export type DetectionType = z.infer<typeof detectionTypeSchema>;

export const riskLevelSchema = z.enum(['low', 'medium', 'high', 'critical']);
export type RiskLevel = z.infer<typeof riskLevelSchema>;

export const processingStatusSchema = z.enum([
  'pending',
  'processing',
  'completed',
  'failed',
  'skipped',
]);
export type ProcessingStatus = z.infer<typeof processingStatusSchema>;

export const assetTypeSchema = z.enum(['logo', 'product', 'trademark', 'packaging']);
export type AssetType = z.infer<typeof assetTypeSchema>;

// ============================================
// DETECTED ITEM SCHEMAS
// ============================================

export const boundingBoxSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});
export type BoundingBox = z.infer<typeof boundingBoxSchema>;

export const detectedItemSchema = z.object({
  type: detectionTypeSchema,
  name: z.string(),
  confidence: z.number().min(0).max(1),
  bounding_box: boundingBoxSchema.optional(),
  location: z.string().optional(),
  is_primary: z.boolean().optional(),
  content: z.string().optional(), // For text detection
  language: z.string().optional(), // For text detection
});
export type DetectedItem = z.infer<typeof detectedItemSchema>;

// ============================================
// VISUAL DETECTION SCHEMAS
// ============================================

export const visualDetectionSchema = z.object({
  id: z.string().uuid(),
  business_unit_id: z.string().uuid(),
  mention_id: z.string().uuid(),

  image_url: z.string().url(),
  image_hash: z.string().nullable().optional(),
  thumbnail_url: z.string().url().nullable().optional(),

  detection_type: detectionTypeSchema,
  detected_items: z.array(detectedItemSchema).default([]),

  logos_count: z.number().default(0),
  our_brand_detected: z.boolean().default(false),
  competitor_detected: z.boolean().default(false),
  competitor_ids: z.array(z.string().uuid()).default([]),

  risk_score: z.number().min(0).max(100).nullable().optional(),
  risk_level: riskLevelSchema.nullable().optional(),
  risk_factors: z.array(z.string()).default([]),

  scene_description: z.string().nullable().optional(),
  scene_categories: z.array(z.string()).default([]),
  dominant_colors: z.array(z.string()).default([]),
  image_quality: z.enum(['low', 'medium', 'high']).nullable().optional(),

  provider: z.string().nullable().optional(),
  model_version: z.string().nullable().optional(),
  processing_time_ms: z.number().nullable().optional(),
  raw_response: z.record(z.unknown()).nullable().optional(),

  status: processingStatusSchema.default('pending'),
  error: z.string().nullable().optional(),

  processed_at: z.string().datetime().nullable().optional(),
  created_at: z.string().datetime(),
});
export type VisualDetection = z.infer<typeof visualDetectionSchema>;

export const createVisualDetectionSchema = z.object({
  mention_id: z.string().uuid(),
  image_url: z.string().url(),
  image_hash: z.string().optional(),
  detection_type: detectionTypeSchema,
  detected_items: z.array(detectedItemSchema).optional(),
  logos_count: z.number().optional(),
  our_brand_detected: z.boolean().optional(),
  competitor_detected: z.boolean().optional(),
  competitor_ids: z.array(z.string().uuid()).optional(),
  risk_score: z.number().min(0).max(100).optional(),
  risk_level: riskLevelSchema.optional(),
  risk_factors: z.array(z.string()).optional(),
  scene_description: z.string().optional(),
  scene_categories: z.array(z.string()).optional(),
  dominant_colors: z.array(z.string()).optional(),
  image_quality: z.enum(['low', 'medium', 'high']).optional(),
  provider: z.string().optional(),
  model_version: z.string().optional(),
  processing_time_ms: z.number().optional(),
  raw_response: z.record(z.unknown()).optional(),
});
export type CreateVisualDetectionInput = z.infer<typeof createVisualDetectionSchema>;

export const updateVisualDetectionSchema = z.object({
  status: processingStatusSchema.optional(),
  error: z.string().nullable().optional(),
  detected_items: z.array(detectedItemSchema).optional(),
  risk_score: z.number().min(0).max(100).optional(),
  risk_level: riskLevelSchema.optional(),
  risk_factors: z.array(z.string()).optional(),
  processed_at: z.string().datetime().optional(),
});
export type UpdateVisualDetectionInput = z.infer<typeof updateVisualDetectionSchema>;

export const listVisualDetectionsQuerySchema = z.object({
  mention_id: z.string().uuid().optional(),
  detection_type: detectionTypeSchema.optional(),
  our_brand_detected: z.coerce.boolean().optional(),
  competitor_detected: z.coerce.boolean().optional(),
  min_risk_score: z.coerce.number().min(0).max(100).optional(),
  risk_level: riskLevelSchema.optional(),
  status: processingStatusSchema.optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  sort_by: z.enum(['created_at', 'risk_score', 'processed_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});
export type ListVisualDetectionsQuery = z.infer<typeof listVisualDetectionsQuerySchema>;

// ============================================
// VISUAL QUEUE SCHEMAS
// ============================================

export const visualQueueItemSchema = z.object({
  id: z.string().uuid(),
  mention_id: z.string().uuid(),
  image_url: z.string().url(),
  image_index: z.number().default(0),

  priority: z.number().min(1).max(10).default(5),
  status: processingStatusSchema.default('pending'),
  attempts: z.number().default(0),
  max_attempts: z.number().default(3),
  last_attempt_at: z.string().datetime().nullable().optional(),
  error: z.string().nullable().optional(),

  worker_id: z.string().nullable().optional(),
  locked_at: z.string().datetime().nullable().optional(),
  locked_until: z.string().datetime().nullable().optional(),

  created_at: z.string().datetime(),
  completed_at: z.string().datetime().nullable().optional(),
});
export type VisualQueueItem = z.infer<typeof visualQueueItemSchema>;

export const addToVisualQueueSchema = z.object({
  mention_id: z.string().uuid(),
  image_url: z.string().url(),
  image_index: z.number().optional(),
  priority: z.number().min(1).max(10).optional(),
});
export type AddToVisualQueueInput = z.infer<typeof addToVisualQueueSchema>;

// ============================================
// BRAND VISUAL ASSET SCHEMAS
// ============================================

export const brandVisualAssetSchema = z.object({
  id: z.string().uuid(),
  business_unit_id: z.string().uuid(),
  competitor_id: z.string().uuid().nullable().optional(),

  name: z.string().min(1).max(255),
  asset_type: assetTypeSchema,
  description: z.string().nullable().optional(),

  image_url: z.string().url(),
  thumbnail_url: z.string().url().nullable().optional(),

  variations: z.array(z.string()).default([]),

  is_active: z.boolean().default(true),

  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type BrandVisualAsset = z.infer<typeof brandVisualAssetSchema>;

export const createBrandVisualAssetSchema = z.object({
  name: z.string().min(1).max(255),
  asset_type: assetTypeSchema,
  description: z.string().optional(),
  image_url: z.string().url(),
  thumbnail_url: z.string().url().optional(),
  variations: z.array(z.string()).optional(),
  competitor_id: z.string().uuid().optional(),
});
export type CreateBrandVisualAssetInput = z.infer<typeof createBrandVisualAssetSchema>;

// ============================================
// VISUAL ANALYSIS RESULT SCHEMAS
// ============================================

export const visualAnalysisResultSchema = z.object({
  detections: z.array(detectedItemSchema),
  context: z.string().optional(),
  risk_indicators: z.array(z.string()).default([]),
  scene: z.object({
    description: z.string(),
    categories: z.array(z.string()),
    colors: z.array(z.string()),
  }).optional(),
});
export type VisualAnalysisResult = z.infer<typeof visualAnalysisResultSchema>;

// ============================================
// VISUAL STATS SCHEMAS
// ============================================

export const visualStatsSchema = z.object({
  total_processed: z.number(),
  pending_queue: z.number(),
  our_brand_count: z.number(),
  competitor_count: z.number(),
  high_risk_count: z.number(),
  by_detection_type: z.record(detectionTypeSchema, z.number()),
  by_risk_level: z.record(riskLevelSchema, z.number()),
  avg_processing_time_ms: z.number(),
});
export type VisualStats = z.infer<typeof visualStatsSchema>;
