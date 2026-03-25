-- ============================================================
-- Migration: Social Monitor Module
-- Date: 2026-03-25
-- Description: Creates all tables for the Social Monitor module
--              and extends ads_integrations.platform constraint
--              to include social media platforms.
-- ============================================================

-- ============================================================
-- 1. Extend ads_integrations.platform CHECK constraint
-- ============================================================
-- Drop old constraint (originally: 'meta', 'google')
-- Recreate with social platforms added.
-- We use the pg_catalog name to find the constraint dynamically
-- so this remains idempotent if constraint name changes.
DO $$
DECLARE
  constraint_name text;
BEGIN
  -- Drop any CHECK constraint on ads_integrations that references the platform column.
  -- This covers both the known name 'ads_integrations_platform_check' and any
  -- auto-generated names, making the step fully idempotent.
  FOR constraint_name IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'ads_integrations'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%platform%'
  LOOP
    EXECUTE format('ALTER TABLE public.ads_integrations DROP CONSTRAINT %I', constraint_name);
  END LOOP;
END $$;

ALTER TABLE public.ads_integrations
  ADD CONSTRAINT ads_integrations_platform_check
  CHECK (platform IN (
    'meta',
    'google',
    'tiktok_ads',
    'instagram',
    'linkedin',
    'tiktok',
    'twitter',
    'youtube',
    'google_business'
  ));

-- ============================================================
-- 2. Social Monitor Tables
-- ============================================================

-- social_media_queries (defined before mentions so it can be FK-referenced)
CREATE TABLE IF NOT EXISTS public.social_media_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  terms jsonb NOT NULL DEFAULT '[]',
  platforms text[] NOT NULL DEFAULT '{}',
  languages text[],
  locations text[],
  status text DEFAULT 'draft',
  version integer DEFAULT 1,
  noise_score numeric,
  volume_estimate integer,
  created_by uuid REFERENCES auth.users(id),
  published_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- social_media_mentions
CREATE TABLE IF NOT EXISTS public.social_media_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  query_id uuid REFERENCES public.social_media_queries(id),
  platform text NOT NULL,
  external_id text NOT NULL,
  external_url text,
  content text NOT NULL,
  content_type text DEFAULT 'post',
  author jsonb NOT NULL DEFAULT '{}',
  sentiment text DEFAULT 'neutral',
  sentiment_score numeric DEFAULT 0,
  sentiment_confidence numeric DEFAULT 1,
  intent text DEFAULT 'neutral',
  topics text[] DEFAULT '{}',
  entities jsonb,
  engagement jsonb NOT NULL DEFAULT '{"likes":0,"comments":0,"shares":0}',
  media jsonb,
  parent_id uuid,
  is_reply boolean DEFAULT false,
  language text,
  location text,
  published_at timestamptz NOT NULL,
  fetched_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, platform, external_id)
);

-- social_media_topics
CREATE TABLE IF NOT EXISTS public.social_media_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  type text DEFAULT 'manual',
  parent_id uuid REFERENCES public.social_media_topics(id),
  keywords text[] DEFAULT '{}',
  mention_count integer DEFAULT 0,
  sentiment_avg numeric,
  trend text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- social_media_posts
CREATE TABLE IF NOT EXISTS public.social_media_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platforms text[] NOT NULL DEFAULT '{}',
  content jsonb NOT NULL DEFAULT '{}',
  media jsonb,
  status text DEFAULT 'draft',
  scheduled_for timestamptz,
  published_at timestamptz,
  campaign_id uuid,
  tags text[],
  approval jsonb,
  results jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- social_media_assets
CREATE TABLE IF NOT EXISTS public.social_media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  mime_type text NOT NULL,
  url text NOT NULL,
  thumbnail_url text,
  size_bytes bigint DEFAULT 0,
  width integer,
  height integer,
  tags text[],
  campaign_id uuid,
  expires_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- social_media_crisis_alerts
CREATE TABLE IF NOT EXISTS public.social_media_crisis_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  severity text NOT NULL DEFAULT 'P4',
  title text NOT NULL,
  description text NOT NULL,
  trigger_value numeric DEFAULT 0,
  threshold numeric DEFAULT 0,
  sample_mention_ids uuid[] DEFAULT '{}',
  metadata jsonb,
  acknowledged_at timestamptz,
  acknowledged_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- social_media_crisis_incidents
CREATE TABLE IF NOT EXISTS public.social_media_crisis_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  alert_id uuid REFERENCES public.social_media_crisis_alerts(id),
  severity text NOT NULL DEFAULT 'P4',
  status text DEFAULT 'detecting',
  title text NOT NULL,
  description text,
  timeline jsonb DEFAULT '[]',
  evidence jsonb DEFAULT '[]',
  checklist jsonb,
  owner_id uuid REFERENCES auth.users(id),
  team_ids uuid[],
  resolved_at timestamptz,
  postmortem text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- social_media_automation_rules
CREATE TABLE IF NOT EXISTS public.social_media_automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  trigger_type text NOT NULL,
  trigger_config jsonb NOT NULL DEFAULT '{}',
  action_type text NOT NULL,
  action_config jsonb NOT NULL DEFAULT '{}',
  is_active boolean DEFAULT true,
  execution_count integer DEFAULT 0,
  last_executed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- social_media_automation_executions
CREATE TABLE IF NOT EXISTS public.social_media_automation_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rule_id uuid REFERENCES public.social_media_automation_rules(id) ON DELETE CASCADE NOT NULL,
  trigger_data jsonb,
  action_result jsonb,
  status text DEFAULT 'success',
  error_message text,
  executed_at timestamptz DEFAULT now() NOT NULL
);

-- social_media_inbox_queues (defined before tickets so it can be FK-referenced)
CREATE TABLE IF NOT EXISTS public.social_media_inbox_queues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  auto_assign boolean DEFAULT false,
  sla_hours integer DEFAULT 24,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- social_media_inbox_tickets
CREATE TABLE IF NOT EXISTS public.social_media_inbox_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mention_id uuid REFERENCES public.social_media_mentions(id),
  queue_id uuid REFERENCES public.social_media_inbox_queues(id),
  status text DEFAULT 'open',
  priority text DEFAULT 'medium',
  subject text,
  assigned_to uuid REFERENCES auth.users(id),
  customer_platform text,
  customer_id text,
  customer_name text,
  sla_due_at timestamptz,
  first_response_at timestamptz,
  resolved_at timestamptz,
  resolution_notes text,
  tags text[],
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- social_media_inbox_macros
CREATE TABLE IF NOT EXISTS public.social_media_inbox_macros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  content text NOT NULL,
  tags text[],
  created_at timestamptz DEFAULT now() NOT NULL
);

-- social_media_inbox_responses
CREATE TABLE IF NOT EXISTS public.social_media_inbox_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ticket_id uuid REFERENCES public.social_media_inbox_tickets(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  response_type text DEFAULT 'reply',
  author_id uuid REFERENCES auth.users(id),
  sent_at timestamptz,
  platform_response_id text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- social_media_sources
CREATE TABLE IF NOT EXISTS public.social_media_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  url text NOT NULL,
  config jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  last_fetched_at timestamptz,
  item_count integer DEFAULT 0,
  error_message text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- social_media_source_items
CREATE TABLE IF NOT EXISTS public.social_media_source_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_id uuid REFERENCES public.social_media_sources(id) ON DELETE CASCADE NOT NULL,
  external_id text,
  title text NOT NULL,
  content text,
  url text,
  author text,
  published_at timestamptz,
  metadata jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(source_id, external_id)
);

-- social_media_competitors
CREATE TABLE IF NOT EXISTS public.social_media_competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  platform_handles jsonb DEFAULT '{}',
  keywords text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- social_media_visual_detections
CREATE TABLE IF NOT EXISTS public.social_media_visual_detections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mention_id uuid REFERENCES public.social_media_mentions(id),
  image_url text NOT NULL,
  detections jsonb DEFAULT '[]',
  risk_level text DEFAULT 'low',
  confidence numeric DEFAULT 0,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- social_media_reports
CREATE TABLE IF NOT EXISTS public.social_media_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  config jsonb DEFAULT '{}',
  status text DEFAULT 'pending',
  file_url text,
  generated_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- social_media_report_schedules
CREATE TABLE IF NOT EXISTS public.social_media_report_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  report_type text NOT NULL,
  config jsonb DEFAULT '{}',
  frequency text NOT NULL,
  next_run_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- social_media_settings
CREATE TABLE IF NOT EXISTS public.social_media_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  preferences jsonb NOT NULL DEFAULT '{}',
  platform_settings jsonb NOT NULL DEFAULT '{}',
  alert_settings jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ============================================================
-- 3. Row Level Security
-- ============================================================

ALTER TABLE public.social_media_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_crisis_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_crisis_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_inbox_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_inbox_queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_inbox_macros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_inbox_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_source_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_visual_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: each user sees and manages only their own rows
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'social_media_mentions',
    'social_media_queries',
    'social_media_topics',
    'social_media_posts',
    'social_media_assets',
    'social_media_crisis_alerts',
    'social_media_crisis_incidents',
    'social_media_automation_rules',
    'social_media_automation_executions',
    'social_media_inbox_tickets',
    'social_media_inbox_queues',
    'social_media_inbox_macros',
    'social_media_inbox_responses',
    'social_media_sources',
    'social_media_source_items',
    'social_media_competitors',
    'social_media_visual_detections',
    'social_media_reports',
    'social_media_report_schedules',
    'social_media_settings'
  ])
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.%I;
       CREATE POLICY %I ON public.%I
         FOR ALL USING (user_id = auth.uid());',
      tbl || '_user_policy', tbl,
      tbl || '_user_policy', tbl
    );
  END LOOP;
END $$;

-- ============================================================
-- 4. updated_at triggers for tables with updated_at column
-- ============================================================

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'social_media_queries',
    'social_media_topics',
    'social_media_posts',
    'social_media_crisis_incidents',
    'social_media_automation_rules',
    'social_media_inbox_tickets',
    'social_media_sources',
    'social_media_competitors',
    'social_media_report_schedules',
    'social_media_settings'
  ])
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS update_%s_updated_at ON public.%I;
       CREATE TRIGGER update_%s_updated_at
         BEFORE UPDATE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      tbl, tbl, tbl, tbl
    );
  END LOOP;
END $$;
