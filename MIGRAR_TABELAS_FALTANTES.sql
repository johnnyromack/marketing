-- =====================================================
-- TABELAS FALTANTES - SEGURO PARA RODAR (IF NOT EXISTS)
-- =====================================================

-- 1. ads_integrations
CREATE TABLE IF NOT EXISTS public.ads_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('meta', 'google')),
  account_id TEXT NOT NULL,
  account_name TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'error')),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform, account_id)
);

-- 2. ads_campaigns
CREATE TABLE IF NOT EXISTS public.ads_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID NOT NULL REFERENCES public.ads_integrations(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'UNKNOWN',
  objective TEXT,
  budget_daily NUMERIC DEFAULT 0,
  budget_lifetime NUMERIC DEFAULT 0,
  spend NUMERIC DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  cpc NUMERIC DEFAULT 0,
  cpm NUMERIC DEFAULT 0,
  start_date DATE,
  end_date DATE,
  marca TEXT,
  unidade TEXT,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(integration_id, external_id)
);

-- 3. ads_creatives
CREATE TABLE IF NOT EXISTS public.ads_creatives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.ads_campaigns(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'UNKNOWN',
  format TEXT,
  preview_url TEXT,
  thumbnail_url TEXT,
  spend NUMERIC DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, external_id)
);

-- 4. platform_accounts
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

-- 5. platform_campaigns
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

-- 6. platform_campaign_metrics
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

-- 7. platform_ads
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

-- 8. api_configurations
CREATE TABLE IF NOT EXISTS api_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text NOT NULL UNIQUE,
  config_value text,
  description text,
  is_configured boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 9. RLS
ALTER TABLE public.ads_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_ads ENABLE ROW LEVEL SECURITY;

-- 10. Policies (DROP antes de criar para evitar duplicatas)
DO $$
BEGIN
  -- ads_integrations
  DROP POLICY IF EXISTS "Users can view their own integrations" ON public.ads_integrations;
  DROP POLICY IF EXISTS "Admins can view all integrations" ON public.ads_integrations;
  DROP POLICY IF EXISTS "Users can insert their own integrations" ON public.ads_integrations;
  DROP POLICY IF EXISTS "Users can update their own integrations" ON public.ads_integrations;
  DROP POLICY IF EXISTS "Users can delete their own integrations" ON public.ads_integrations;

  CREATE POLICY "Users can view their own integrations" ON public.ads_integrations FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "Users can insert their own integrations" ON public.ads_integrations FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can update their own integrations" ON public.ads_integrations FOR UPDATE USING (auth.uid() = user_id);
  CREATE POLICY "Users can delete their own integrations" ON public.ads_integrations FOR DELETE USING (auth.uid() = user_id);

  -- api_configurations
  DROP POLICY IF EXISTS "Authenticated users can view api_configurations" ON api_configurations;
  DROP POLICY IF EXISTS "Admin can insert api_configurations" ON api_configurations;
  DROP POLICY IF EXISTS "Admin can update api_configurations" ON api_configurations;

  CREATE POLICY "Authenticated users can view api_configurations" ON api_configurations FOR SELECT TO authenticated USING (true);
  CREATE POLICY "Admin can insert api_configurations" ON api_configurations FOR INSERT TO authenticated WITH CHECK (true);
  CREATE POLICY "Admin can update api_configurations" ON api_configurations FOR UPDATE TO authenticated USING (true);

  -- platform_accounts
  DROP POLICY IF EXISTS "Authenticated users can view platform_accounts" ON platform_accounts;
  CREATE POLICY "Authenticated users can view platform_accounts" ON platform_accounts FOR SELECT TO authenticated USING (true);
  CREATE POLICY "Authenticated users can insert platform_accounts" ON platform_accounts FOR INSERT TO authenticated WITH CHECK (true);
  CREATE POLICY "Authenticated users can update platform_accounts" ON platform_accounts FOR UPDATE TO authenticated USING (true);

  -- platform_campaigns
  DROP POLICY IF EXISTS "Authenticated users can view platform_campaigns" ON platform_campaigns;
  CREATE POLICY "Authenticated users can view platform_campaigns" ON platform_campaigns FOR SELECT TO authenticated USING (true);
  CREATE POLICY "Authenticated users can insert platform_campaigns" ON platform_campaigns FOR INSERT TO authenticated WITH CHECK (true);
  CREATE POLICY "Authenticated users can update platform_campaigns" ON platform_campaigns FOR UPDATE TO authenticated USING (true);

  -- platform_campaign_metrics
  DROP POLICY IF EXISTS "Authenticated users can view platform_campaign_metrics" ON platform_campaign_metrics;
  CREATE POLICY "Authenticated users can view platform_campaign_metrics" ON platform_campaign_metrics FOR SELECT TO authenticated USING (true);
  CREATE POLICY "Authenticated users can insert platform_campaign_metrics" ON platform_campaign_metrics FOR INSERT TO authenticated WITH CHECK (true);
  CREATE POLICY "Authenticated users can update platform_campaign_metrics" ON platform_campaign_metrics FOR UPDATE TO authenticated USING (true);
END $$;

-- 11. Indexes
CREATE INDEX IF NOT EXISTS idx_ads_integrations_user_id ON public.ads_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_ads_integrations_platform ON public.ads_integrations(platform);
CREATE INDEX IF NOT EXISTS idx_ads_integrations_status ON public.ads_integrations(status);
CREATE INDEX IF NOT EXISTS idx_ads_campaigns_integration_id ON public.ads_campaigns(integration_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_accounts_unique ON platform_accounts(platform, account_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_campaigns_unique ON platform_campaigns(account_id, campaign_external_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_metrics_unique ON platform_campaign_metrics(campaign_id, date);

-- 12. Chaves padrão em api_configurations
INSERT INTO api_configurations (config_key, description) VALUES
  ('GOOGLE_ADS_DEVELOPER_TOKEN', 'Token de desenvolvedor do Google Ads'),
  ('GOOGLE_ADS_CLIENT_ID', 'Client ID OAuth do Google Ads'),
  ('GOOGLE_ADS_CLIENT_SECRET', 'Client Secret OAuth do Google Ads'),
  ('META_APP_ID', 'App ID do Meta/Facebook'),
  ('META_APP_SECRET', 'App Secret do Meta/Facebook'),
  ('TIKTOK_APP_ID', 'App ID do TikTok Business'),
  ('TIKTOK_APP_SECRET', 'App Secret do TikTok Business'),
  ('ANTHROPIC_API_KEY', 'API Key da Anthropic (Claude)')
ON CONFLICT (config_key) DO NOTHING;

-- 13. Triggers updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ads_integrations_updated_at ON public.ads_integrations;
CREATE TRIGGER update_ads_integrations_updated_at BEFORE UPDATE ON public.ads_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ads_campaigns_updated_at ON public.ads_campaigns;
CREATE TRIGGER update_ads_campaigns_updated_at BEFORE UPDATE ON public.ads_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_api_configurations_updated_at ON api_configurations;
CREATE TRIGGER update_api_configurations_updated_at BEFORE UPDATE ON api_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
