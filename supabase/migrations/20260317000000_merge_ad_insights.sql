-- ============================================================
-- Migration: Merge Ad Insights Hub into Publicidade Raiz
-- Date: 2026-03-17
-- Description: Adds platform integration tables, alert system,
--              brand knowledge, and RPC functions from Ad Insights Hub
-- ============================================================

-- 1. Add new columns to existing tables
ALTER TABLE marcas ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE marcas ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE marcas ADD COLUMN IF NOT EXISTS daily_budget numeric DEFAULT 0;
ALTER TABLE marcas ADD COLUMN IF NOT EXISTS manual_balance numeric DEFAULT 0;
ALTER TABLE marcas ADD COLUMN IF NOT EXISTS last_balance_update timestamptz;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 2. New tables: Platform Accounts & Campaigns
CREATE TABLE IF NOT EXISTS platform_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marca_id uuid REFERENCES marcas(id) ON DELETE CASCADE,
  platform text NOT NULL,
  account_id text NOT NULL,
  account_name text NOT NULL,
  balance numeric DEFAULT 0,
  currency text DEFAULT 'BRL',
  status text DEFAULT 'active',
  last_sync_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS platform_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES platform_accounts(id) ON DELETE CASCADE,
  campaign_external_id text NOT NULL,
  name text NOT NULL,
  status text DEFAULT 'unknown',
  objective text,
  daily_budget numeric,
  lifetime_budget numeric,
  start_date text,
  end_date text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS platform_campaign_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES platform_campaigns(id) ON DELETE CASCADE,
  date date NOT NULL,
  impressions numeric DEFAULT 0,
  clicks numeric DEFAULT 0,
  spend numeric DEFAULT 0,
  conversions numeric DEFAULT 0,
  ctr numeric DEFAULT 0,
  cpc numeric DEFAULT 0,
  roas numeric DEFAULT 0,
  revenue numeric DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS platform_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES platform_campaigns(id) ON DELETE CASCADE,
  ad_external_id text NOT NULL,
  name text NOT NULL,
  status text,
  type text,
  headline text,
  description text,
  final_url text,
  preview_url text,
  thumbnail_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS platform_ad_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid REFERENCES platform_ads(id) ON DELETE CASCADE,
  date date NOT NULL,
  impressions numeric DEFAULT 0,
  clicks numeric DEFAULT 0,
  spend numeric DEFAULT 0,
  conversions numeric DEFAULT 0,
  ctr numeric DEFAULT 0,
  cpc numeric DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS platform_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES platform_campaigns(id) ON DELETE CASCADE,
  keyword_external_id text NOT NULL,
  keyword_text text NOT NULL,
  match_type text,
  status text,
  quality_score integer,
  ad_group_external_id text,
  ad_group_name text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS platform_keyword_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id uuid REFERENCES platform_keywords(id) ON DELETE CASCADE,
  date date NOT NULL,
  impressions numeric DEFAULT 0,
  clicks numeric DEFAULT 0,
  spend numeric DEFAULT 0,
  conversions numeric DEFAULT 0,
  ctr numeric DEFAULT 0,
  cpc numeric DEFAULT 0,
  average_position numeric DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 3. Budget & Knowledge tables
CREATE TABLE IF NOT EXISTS platform_brand_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marca_id uuid NOT NULL REFERENCES marcas(id) ON DELETE CASCADE,
  platform text NOT NULL,
  month text NOT NULL,
  budget_amount numeric DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS brand_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marca_id uuid NOT NULL REFERENCES marcas(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  source_type text DEFAULT 'manual',
  source_url text,
  file_name text,
  file_path text,
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 4. Alert system tables
CREATE TABLE IF NOT EXISTS alert_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  whatsapp text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS alert_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marca_id uuid REFERENCES marcas(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES alert_contacts(id) ON DELETE CASCADE,
  low_balance_threshold numeric DEFAULT 500,
  critical_balance_threshold numeric DEFAULT 100,
  projection_days integer DEFAULT 7,
  alert_low_balance boolean DEFAULT true,
  alert_critical_balance boolean DEFAULT true,
  alert_new_deposit boolean DEFAULT true,
  alert_projection boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS alert_schedule_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean DEFAULT true,
  start_time time DEFAULT '08:00',
  end_time time DEFAULT '18:00',
  allowed_days integer[] DEFAULT '{1,2,3,4,5}',
  timezone text DEFAULT 'America/Sao_Paulo',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS alert_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES platform_accounts(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES alert_contacts(id) ON DELETE SET NULL,
  alert_type text NOT NULL,
  channel text NOT NULL,
  message text,
  status text DEFAULT 'sent',
  sent_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS pending_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES platform_accounts(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  message_whatsapp text,
  message_email_subject text,
  message_email_html text,
  status text DEFAULT 'pending',
  scheduled_for timestamptz,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 5. API Configuration table
CREATE TABLE IF NOT EXISTS api_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text NOT NULL UNIQUE,
  config_value text,
  description text,
  is_configured boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 6. Unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_accounts_unique ON platform_accounts(platform, account_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_campaigns_unique ON platform_campaigns(account_id, campaign_external_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_ads_unique ON platform_ads(campaign_id, ad_external_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_keywords_unique ON platform_keywords(campaign_id, keyword_external_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_metrics_unique ON platform_campaign_metrics(campaign_id, date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ad_metrics_unique ON platform_ad_metrics(ad_id, date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_keyword_metrics_unique ON platform_keyword_metrics(keyword_id, date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_brand_budgets_unique ON platform_brand_budgets(marca_id, platform, month);

-- 7. Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'platform_accounts', 'platform_campaigns', 'platform_ads',
    'platform_keywords', 'platform_brand_budgets', 'brand_knowledge',
    'alert_contacts', 'alert_settings', 'alert_schedule_settings', 'api_configurations'
  ])
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS update_%s_updated_at ON %I; CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      tbl, tbl, tbl, tbl
    );
  END LOOP;
END $$;

-- 8. Enable RLS on all new tables
ALTER TABLE platform_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_ad_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_keyword_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_brand_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_schedule_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_configurations ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies (following Publicidade Raiz patterns)
-- Read: all authenticated users; Write: admin, gestor, editor

-- Helper: create standard CRUD policies for a table
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'platform_accounts', 'platform_campaigns', 'platform_campaign_metrics',
    'platform_ads', 'platform_ad_metrics', 'platform_keywords', 'platform_keyword_metrics',
    'platform_brand_budgets', 'brand_knowledge',
    'alert_contacts', 'alert_settings', 'alert_schedule_settings',
    'alert_logs', 'pending_alerts'
  ])
  LOOP
    -- SELECT: any authenticated user
    EXECUTE format(
      'CREATE POLICY "Authenticated users can view %s" ON %I FOR SELECT TO authenticated USING (true);',
      tbl, tbl
    );
    -- INSERT: admin, gestor, editor
    EXECUTE format(
      'CREATE POLICY "Admin/gestor/editor can insert %s" ON %I FOR INSERT TO authenticated WITH CHECK (
        has_role(auth.uid(), ''admin''::app_role) OR
        has_role(auth.uid(), ''gestor''::app_role) OR
        has_role(auth.uid(), ''editor''::app_role)
      );',
      tbl, tbl
    );
    -- UPDATE: admin, gestor, editor
    EXECUTE format(
      'CREATE POLICY "Admin/gestor/editor can update %s" ON %I FOR UPDATE TO authenticated USING (
        has_role(auth.uid(), ''admin''::app_role) OR
        has_role(auth.uid(), ''gestor''::app_role) OR
        has_role(auth.uid(), ''editor''::app_role)
      );',
      tbl, tbl
    );
    -- DELETE: admin only
    EXECUTE format(
      'CREATE POLICY "Admin can delete %s" ON %I FOR DELETE TO authenticated USING (
        has_role(auth.uid(), ''admin''::app_role)
      );',
      tbl, tbl
    );
  END LOOP;
END $$;

-- api_configurations: admin only for write
CREATE POLICY "Authenticated users can view api_configurations" ON api_configurations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can insert api_configurations" ON api_configurations FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin can update api_configurations" ON api_configurations FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin can delete api_configurations" ON api_configurations FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 10. RPC Functions for metrics aggregation

CREATE OR REPLACE FUNCTION get_campaign_stats(
  p_brand_id uuid DEFAULT NULL,
  p_from_date text DEFAULT NULL,
  p_platform text DEFAULT NULL,
  p_to_date text DEFAULT NULL
)
RETURNS TABLE(total bigint, active bigint, paused bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint as total,
    COUNT(*) FILTER (WHERE pc.status = 'ENABLED' OR pc.status = 'ACTIVE')::bigint as active,
    COUNT(*) FILTER (WHERE pc.status = 'PAUSED')::bigint as paused
  FROM platform_campaigns pc
  JOIN platform_accounts pa ON pc.account_id = pa.id
  WHERE (p_brand_id IS NULL OR pa.marca_id = p_brand_id)
    AND (p_platform IS NULL OR pa.platform = p_platform);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_ad_stats(
  p_brand_id uuid DEFAULT NULL,
  p_from_date text DEFAULT NULL,
  p_platform text DEFAULT NULL,
  p_to_date text DEFAULT NULL
)
RETURNS TABLE(total bigint, active bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint as total,
    COUNT(*) FILTER (WHERE pad.status = 'ENABLED' OR pad.status = 'ACTIVE')::bigint as active
  FROM platform_ads pad
  JOIN platform_campaigns pc ON pad.campaign_id = pc.id
  JOIN platform_accounts pa ON pc.account_id = pa.id
  WHERE (p_brand_id IS NULL OR pa.marca_id = p_brand_id)
    AND (p_platform IS NULL OR pa.platform = p_platform);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_daily_metrics(
  p_brand_id uuid DEFAULT NULL,
  p_from_date date DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_platform text DEFAULT NULL,
  p_to_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  metric_date date,
  total_impressions numeric,
  total_clicks numeric,
  total_spend numeric,
  total_conversions numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cm.date as metric_date,
    COALESCE(SUM(cm.impressions), 0) as total_impressions,
    COALESCE(SUM(cm.clicks), 0) as total_clicks,
    COALESCE(SUM(cm.spend), 0) as total_spend,
    COALESCE(SUM(cm.conversions), 0) as total_conversions
  FROM platform_campaign_metrics cm
  JOIN platform_campaigns pc ON cm.campaign_id = pc.id
  JOIN platform_accounts pa ON pc.account_id = pa.id
  WHERE cm.date BETWEEN p_from_date AND p_to_date
    AND (p_brand_id IS NULL OR pa.marca_id = p_brand_id)
    AND (p_platform IS NULL OR pa.platform = p_platform)
  GROUP BY cm.date
  ORDER BY cm.date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_period_metrics(
  p_brand_id uuid DEFAULT NULL,
  p_from_date date DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_platform text DEFAULT NULL,
  p_to_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  total_impressions numeric,
  total_clicks numeric,
  total_spend numeric,
  total_conversions numeric,
  total_revenue numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(cm.impressions), 0) as total_impressions,
    COALESCE(SUM(cm.clicks), 0) as total_clicks,
    COALESCE(SUM(cm.spend), 0) as total_spend,
    COALESCE(SUM(cm.conversions), 0) as total_conversions,
    COALESCE(SUM(cm.revenue), 0) as total_revenue
  FROM platform_campaign_metrics cm
  JOIN platform_campaigns pc ON cm.campaign_id = pc.id
  JOIN platform_accounts pa ON pc.account_id = pa.id
  WHERE cm.date BETWEEN p_from_date AND p_to_date
    AND (p_brand_id IS NULL OR pa.marca_id = p_brand_id)
    AND (p_platform IS NULL OR pa.platform = p_platform);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Insert default API configuration keys
INSERT INTO api_configurations (config_key, description) VALUES
  ('GOOGLE_ADS_DEVELOPER_TOKEN', 'Token de desenvolvedor do Google Ads'),
  ('GOOGLE_ADS_CLIENT_ID', 'Client ID OAuth do Google Ads'),
  ('GOOGLE_ADS_CLIENT_SECRET', 'Client Secret OAuth do Google Ads'),
  ('META_APP_ID', 'App ID do Meta/Facebook'),
  ('META_APP_SECRET', 'App Secret do Meta/Facebook'),
  ('TIKTOK_APP_ID', 'App ID do TikTok Business'),
  ('TIKTOK_APP_SECRET', 'App Secret do TikTok Business'),
  ('ZAPI_INSTANCE_ID', 'ID da instância Z-API (WhatsApp)'),
  ('ZAPI_TOKEN', 'Token Z-API (WhatsApp)'),
  ('RESEND_API_KEY', 'API Key do Resend (Email)'),
  ('FIRECRAWL_API_KEY', 'API Key do Firecrawl (Web Scraping)'),
  ('ANTHROPIC_API_KEY', 'API Key da Anthropic (Claude)')
ON CONFLICT (config_key) DO NOTHING;
