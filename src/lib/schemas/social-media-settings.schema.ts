import { z } from 'zod';

// ============================================
// Social Media Settings Schemas
// ============================================

/**
 * Analysis language options
 */
export const analysisLanguageSchema = z.enum(['pt-BR', 'en-US', 'es']);

/**
 * Date format options
 */
export const dateFormatSchema = z.enum(['dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd']);

/**
 * Refresh interval options
 */
export const refreshIntervalSchema = z.enum(['1min', '5min', '15min', '30min', '1h']);

/**
 * Alert check frequency options
 */
export const alertCheckFrequencySchema = z.enum(['1min', '5min', '15min', '30min']);

/**
 * Social media settings database row schema
 */
export const socialMediaSettingsRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),

  // Preferencias Gerais
  analysis_language: analysisLanguageSchema.default('pt-BR'),
  timezone: z.string().default('America/Sao_Paulo'),
  date_format: dateFormatSchema.default('dd/MM/yyyy'),
  refresh_interval: refreshIntervalSchema.default('5min'),
  items_per_page: z.number().int().min(10).max(100).default(25),

  // Plataformas
  platform_priority: z.array(z.string()).default(['twitter', 'instagram', 'facebook', 'linkedin']),
  connection_timeout: z.number().int().min(5).max(120).default(30),

  // Alertas e Crise
  email_alerts_enabled: z.boolean().default(true),
  app_notifications_enabled: z.boolean().default(true),
  negative_sentiment_threshold: z.number().int().min(0).max(100).default(30),
  mention_volume_threshold: z.number().int().min(1).default(100),
  crisis_keywords: z.array(z.string()).default([]),
  alert_check_frequency: alertCheckFrequencySchema.default('5min'),

  created_at: z.string(),
  updated_at: z.string(),
});

export type SocialMediaSettingsRow = z.infer<typeof socialMediaSettingsRowSchema>;

/**
 * Social media settings schema (for API responses)
 */
export const socialMediaSettingsSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),

  // Preferencias Gerais
  analysis_language: analysisLanguageSchema.default('pt-BR'),
  timezone: z.string().default('America/Sao_Paulo'),
  date_format: dateFormatSchema.default('dd/MM/yyyy'),
  refresh_interval: refreshIntervalSchema.default('5min'),
  items_per_page: z.number().int().min(10).max(100).default(25),

  // Plataformas
  platform_priority: z.array(z.string()).default(['twitter', 'instagram', 'facebook', 'linkedin']),
  connection_timeout: z.number().int().min(5).max(120).default(30),

  // Alertas e Crise
  email_alerts_enabled: z.boolean().default(true),
  app_notifications_enabled: z.boolean().default(true),
  negative_sentiment_threshold: z.number().int().min(0).max(100).default(30),
  mention_volume_threshold: z.number().int().min(1).default(100),
  crisis_keywords: z.array(z.string()).default([]),
  alert_check_frequency: alertCheckFrequencySchema.default('5min'),

  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type SocialMediaSettings = z.infer<typeof socialMediaSettingsSchema>;

/**
 * Update social media settings schema (partial, for PATCH/PUT)
 */
export const updateSocialMediaSettingsSchema = z.object({
  // Preferencias Gerais
  analysis_language: analysisLanguageSchema.optional(),
  timezone: z.string().optional(),
  date_format: dateFormatSchema.optional(),
  refresh_interval: refreshIntervalSchema.optional(),
  items_per_page: z.number().int().min(10).max(100).optional(),

  // Plataformas
  platform_priority: z.array(z.string()).optional(),
  connection_timeout: z.number().int().min(5).max(120).optional(),

  // Alertas e Crise
  email_alerts_enabled: z.boolean().optional(),
  app_notifications_enabled: z.boolean().optional(),
  negative_sentiment_threshold: z.number().int().min(0).max(100).optional(),
  mention_volume_threshold: z.number().int().min(1).optional(),
  crisis_keywords: z.array(z.string()).optional(),
  alert_check_frequency: alertCheckFrequencySchema.optional(),
});

export type UpdateSocialMediaSettingsInput = z.infer<typeof updateSocialMediaSettingsSchema>;

/**
 * Default settings values
 */
export const defaultSocialMediaSettings: SocialMediaSettings = {
  analysis_language: 'pt-BR',
  timezone: 'America/Sao_Paulo',
  date_format: 'dd/MM/yyyy',
  refresh_interval: '5min',
  items_per_page: 25,
  platform_priority: ['twitter', 'instagram', 'facebook', 'linkedin'],
  connection_timeout: 30,
  email_alerts_enabled: true,
  app_notifications_enabled: true,
  negative_sentiment_threshold: 30,
  mention_volume_threshold: 100,
  crisis_keywords: [],
  alert_check_frequency: '5min',
};

/**
 * Available timezones (common Brazilian/South American)
 */
export const availableTimezones = [
  'America/Sao_Paulo',
  'America/Fortaleza',
  'America/Recife',
  'America/Bahia',
  'America/Belem',
  'America/Manaus',
  'America/Cuiaba',
  'America/Campo_Grande',
  'America/Rio_Branco',
  'America/Porto_Velho',
  'America/Boa_Vista',
  'America/Noronha',
  'America/Buenos_Aires',
  'America/Santiago',
  'America/Lima',
  'America/Bogota',
  'America/Caracas',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Lisbon',
  'UTC',
] as const;

/**
 * Available platforms
 */
export const availablePlatforms = [
  { id: 'twitter', name: 'Twitter/X', icon: 'twitter' },
  { id: 'instagram', name: 'Instagram', icon: 'instagram' },
  { id: 'facebook', name: 'Facebook', icon: 'facebook' },
  { id: 'linkedin', name: 'LinkedIn', icon: 'linkedin' },
  { id: 'youtube', name: 'YouTube', icon: 'youtube' },
  { id: 'tiktok', name: 'TikTok', icon: 'tiktok' },
  { id: 'threads', name: 'Threads', icon: 'threads' },
  { id: 'bluesky', name: 'Bluesky', icon: 'bluesky' },
  { id: 'reddit', name: 'Reddit', icon: 'reddit' },
  { id: 'news', name: 'Noticias', icon: 'newspaper' },
  { id: 'blogs', name: 'Blogs', icon: 'rss' },
] as const;
