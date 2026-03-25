import { z } from 'zod';

// ============================================
// ENUMS
// ============================================

export const reportTypeSchema = z.enum([
  'weekly',
  'monthly',
  'quarterly',
  'custom',
  'crisis',
  'competitive',
]);
export type ReportType = z.infer<typeof reportTypeSchema>;

export const reportFormatSchema = z.enum(['pdf', 'pptx', 'xlsx', 'html']);
export type ReportFormat = z.infer<typeof reportFormatSchema>;

export const reportStatusSchema = z.enum([
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
]);
export type ReportStatus = z.infer<typeof reportStatusSchema>;

export const scheduleFrequencySchema = z.enum([
  'daily',
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
]);
export type ScheduleFrequency = z.infer<typeof scheduleFrequencySchema>;

export const deliveryMethodSchema = z.enum(['email', 'slack', 'webhook']);
export type DeliveryMethod = z.infer<typeof deliveryMethodSchema>;

// ============================================
// REPORT CONFIG SCHEMAS
// ============================================

export const reportBrandingSchema = z.object({
  logo_url: z.string().url().nullable().optional(),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#F08700'),
  secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  font: z.string().optional(),
});
export type ReportBranding = z.infer<typeof reportBrandingSchema>;

export const reportSectionSchema = z.enum([
  'cover',
  'overview',
  'mentions',
  'sentiment',
  'trend',
  'top_posts',
  'platforms',
  'competitors',
  'topics',
  'insights',
  'crisis',
  'recommendations',
]);
export type ReportSection = z.infer<typeof reportSectionSchema>;

export const reportConfigSchema = z.object({
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  sections: z.array(reportSectionSchema).default([
    'cover',
    'overview',
    'sentiment',
    'top_posts',
    'insights',
  ]),
  filters: z
    .object({
      platforms: z.array(z.string()).optional(),
      topics: z.array(z.string()).optional(),
      sentiment: z.array(z.string()).optional(),
    })
    .optional(),
  template_id: z.string().uuid().nullable().optional(),
  branding: reportBrandingSchema.optional(),
  include_raw_data: z.boolean().default(false),
  language: z.string().default('pt'),
});
export type ReportConfig = z.infer<typeof reportConfigSchema>;

// ============================================
// REPORT SCHEMAS
// ============================================

export const reportSchema = z.object({
  id: z.string().uuid(),
  business_unit_id: z.string().uuid(),

  name: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  type: reportTypeSchema,
  format: reportFormatSchema.default('pdf'),

  status: reportStatusSchema.default('pending'),
  progress: z.number().min(0).max(100).default(0),
  error: z.string().nullable().optional(),

  config: reportConfigSchema,

  file_url: z.string().url().nullable().optional(),
  file_size: z.number().nullable().optional(),
  file_name: z.string().nullable().optional(),
  generated_at: z.string().datetime().nullable().optional(),

  started_at: z.string().datetime().nullable().optional(),
  completed_at: z.string().datetime().nullable().optional(),
  processing_time_ms: z.number().nullable().optional(),

  created_by: z.string().uuid().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Report = z.infer<typeof reportSchema>;

export const createReportSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: reportTypeSchema,
  format: reportFormatSchema.optional(),
  config: reportConfigSchema,
});
export type CreateReportInput = z.infer<typeof createReportSchema>;

export const updateReportSchema = z.object({
  status: reportStatusSchema.optional(),
  progress: z.number().min(0).max(100).optional(),
  error: z.string().nullable().optional(),
  file_url: z.string().url().optional(),
  file_size: z.number().optional(),
  file_name: z.string().optional(),
  generated_at: z.string().datetime().optional(),
  started_at: z.string().datetime().optional(),
  completed_at: z.string().datetime().optional(),
  processing_time_ms: z.number().optional(),
});
export type UpdateReportInput = z.infer<typeof updateReportSchema>;

export const listReportsQuerySchema = z.object({
  type: reportTypeSchema.optional(),
  status: reportStatusSchema.optional(),
  format: reportFormatSchema.optional(),
  created_by: z.string().uuid().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  sort_by: z.enum(['created_at', 'generated_at', 'name']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});
export type ListReportsQuery = z.infer<typeof listReportsQuerySchema>;

// ============================================
// SCHEDULE SCHEMAS
// ============================================

export const scheduleDeliveryConfigSchema = z.object({
  slack_channel: z.string().optional(),
  slack_webhook_url: z.string().url().optional(),
  webhook_url: z.string().url().optional(),
  webhook_headers: z.record(z.string()).optional(),
});
export type ScheduleDeliveryConfig = z.infer<typeof scheduleDeliveryConfigSchema>;

export const reportScheduleSchema = z.object({
  id: z.string().uuid(),
  business_unit_id: z.string().uuid(),

  name: z.string().min(1).max(255),
  description: z.string().nullable().optional(),

  frequency: scheduleFrequencySchema,
  day_of_week: z.number().min(0).max(6).nullable().optional(),
  day_of_month: z.number().min(1).max(31).nullable().optional(),
  time_of_day: z.string().regex(/^\d{2}:\d{2}$/).default('09:00'),
  timezone: z.string().default('America/Sao_Paulo'),

  config: reportConfigSchema,
  format: reportFormatSchema.default('pdf'),

  recipients: z.array(z.string().email()).default([]),
  delivery_method: deliveryMethodSchema.default('email'),
  delivery_config: scheduleDeliveryConfigSchema.default({}),

  is_active: z.boolean().default(true),
  last_run_at: z.string().datetime().nullable().optional(),
  next_run_at: z.string().datetime().nullable().optional(),
  last_report_id: z.string().uuid().nullable().optional(),

  consecutive_failures: z.number().default(0),
  last_error: z.string().nullable().optional(),

  created_by: z.string().uuid().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type ReportSchedule = z.infer<typeof reportScheduleSchema>;

export const createScheduleSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  frequency: scheduleFrequencySchema,
  day_of_week: z.number().min(0).max(6).optional(),
  day_of_month: z.number().min(1).max(31).optional(),
  time_of_day: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  timezone: z.string().optional(),
  config: reportConfigSchema,
  format: reportFormatSchema.optional(),
  recipients: z.array(z.string().email()).optional(),
  delivery_method: deliveryMethodSchema.optional(),
  delivery_config: scheduleDeliveryConfigSchema.optional(),
});
export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;

export const updateScheduleSchema = createScheduleSchema.partial().extend({
  is_active: z.boolean().optional(),
});
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;

export const listSchedulesQuerySchema = z.object({
  frequency: scheduleFrequencySchema.optional(),
  is_active: z.coerce.boolean().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});
export type ListSchedulesQuery = z.infer<typeof listSchedulesQuerySchema>;

// ============================================
// TEMPLATE SCHEMAS
// ============================================

export const templateSectionConfigSchema = z.object({
  type: z.string(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  metrics: z.array(z.string()).optional(),
  chart_type: z.string().optional(),
  limit: z.number().optional(),
  show_sov: z.boolean().optional(),
  auto_generate: z.boolean().optional(),
  custom_config: z.record(z.unknown()).optional(),
});
export type TemplateSectionConfig = z.infer<typeof templateSectionConfigSchema>;

export const reportTemplateSchema = z.object({
  id: z.string().uuid(),
  business_unit_id: z.string().uuid(),

  name: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  type: reportTypeSchema,

  sections: z.array(templateSectionConfigSchema).default([]),
  branding: reportBrandingSchema.default({}),

  is_default: z.boolean().default(false),
  is_public: z.boolean().default(false),
  use_count: z.number().default(0),

  created_by: z.string().uuid().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type ReportTemplate = z.infer<typeof reportTemplateSchema>;

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: reportTypeSchema,
  sections: z.array(templateSectionConfigSchema).optional(),
  branding: reportBrandingSchema.optional(),
  is_default: z.boolean().optional(),
  is_public: z.boolean().optional(),
});
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;

export const updateTemplateSchema = createTemplateSchema.partial();
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
