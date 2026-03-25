-- =====================================================
-- INTEGRAÇÃO META ADS E GOOGLE ADS
-- Tabelas para armazenar conexões OAuth e dados sincronizados
-- =====================================================

-- 1. Tabela de Integrações (conexões OAuth)
CREATE TABLE public.ads_integrations (
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

-- 2. Tabela de Campanhas Sincronizadas
CREATE TABLE public.ads_campaigns (
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

-- 3. Tabela de Anúncios/Criativos
CREATE TABLE public.ads_creatives (
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

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.ads_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads_creatives ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - ads_integrations
-- =====================================================

-- Users can view their own integrations
CREATE POLICY "Users can view their own integrations"
ON public.ads_integrations
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all integrations
CREATE POLICY "Admins can view all integrations"
ON public.ads_integrations
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Users can insert their own integrations
CREATE POLICY "Users can insert their own integrations"
ON public.ads_integrations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own integrations
CREATE POLICY "Users can update their own integrations"
ON public.ads_integrations
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can update any integration
CREATE POLICY "Admins can update any integration"
ON public.ads_integrations
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Users can delete their own integrations
CREATE POLICY "Users can delete their own integrations"
ON public.ads_integrations
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can delete any integration
CREATE POLICY "Admins can delete any integration"
ON public.ads_integrations
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- RLS POLICIES - ads_campaigns
-- =====================================================

-- Users can view campaigns from their integrations
CREATE POLICY "Users can view their campaigns"
ON public.ads_campaigns
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ads_integrations
    WHERE ads_integrations.id = ads_campaigns.integration_id
    AND ads_integrations.user_id = auth.uid()
  )
);

-- Admins can view all campaigns
CREATE POLICY "Admins can view all campaigns"
ON public.ads_campaigns
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Users can insert campaigns for their integrations
CREATE POLICY "Users can insert their campaigns"
ON public.ads_campaigns
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ads_integrations
    WHERE ads_integrations.id = ads_campaigns.integration_id
    AND ads_integrations.user_id = auth.uid()
  )
);

-- Users can update campaigns from their integrations
CREATE POLICY "Users can update their campaigns"
ON public.ads_campaigns
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.ads_integrations
    WHERE ads_integrations.id = ads_campaigns.integration_id
    AND ads_integrations.user_id = auth.uid()
  )
);

-- Admins can update any campaign
CREATE POLICY "Admins can update any campaign"
ON public.ads_campaigns
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Users can delete campaigns from their integrations
CREATE POLICY "Users can delete their campaigns"
ON public.ads_campaigns
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.ads_integrations
    WHERE ads_integrations.id = ads_campaigns.integration_id
    AND ads_integrations.user_id = auth.uid()
  )
);

-- Admins can delete any campaign
CREATE POLICY "Admins can delete any campaign"
ON public.ads_campaigns
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- RLS POLICIES - ads_creatives
-- =====================================================

-- Users can view creatives from their campaigns
CREATE POLICY "Users can view their creatives"
ON public.ads_creatives
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ads_campaigns
    JOIN public.ads_integrations ON ads_integrations.id = ads_campaigns.integration_id
    WHERE ads_campaigns.id = ads_creatives.campaign_id
    AND ads_integrations.user_id = auth.uid()
  )
);

-- Admins can view all creatives
CREATE POLICY "Admins can view all creatives"
ON public.ads_creatives
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Users can insert creatives for their campaigns
CREATE POLICY "Users can insert their creatives"
ON public.ads_creatives
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ads_campaigns
    JOIN public.ads_integrations ON ads_integrations.id = ads_campaigns.integration_id
    WHERE ads_campaigns.id = ads_creatives.campaign_id
    AND ads_integrations.user_id = auth.uid()
  )
);

-- Users can update creatives from their campaigns
CREATE POLICY "Users can update their creatives"
ON public.ads_creatives
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.ads_campaigns
    JOIN public.ads_integrations ON ads_integrations.id = ads_campaigns.integration_id
    WHERE ads_campaigns.id = ads_creatives.campaign_id
    AND ads_integrations.user_id = auth.uid()
  )
);

-- Admins can update any creative
CREATE POLICY "Admins can update any creative"
ON public.ads_creatives
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Users can delete creatives from their campaigns
CREATE POLICY "Users can delete their creatives"
ON public.ads_creatives
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.ads_campaigns
    JOIN public.ads_integrations ON ads_integrations.id = ads_campaigns.integration_id
    WHERE ads_campaigns.id = ads_creatives.campaign_id
    AND ads_integrations.user_id = auth.uid()
  )
);

-- Admins can delete any creative
CREATE POLICY "Admins can delete any creative"
ON public.ads_creatives
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- TRIGGERS FOR updated_at
-- =====================================================

CREATE TRIGGER update_ads_integrations_updated_at
BEFORE UPDATE ON public.ads_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ads_campaigns_updated_at
BEFORE UPDATE ON public.ads_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ads_creatives_updated_at
BEFORE UPDATE ON public.ads_creatives
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_ads_integrations_user_id ON public.ads_integrations(user_id);
CREATE INDEX idx_ads_integrations_platform ON public.ads_integrations(platform);
CREATE INDEX idx_ads_integrations_status ON public.ads_integrations(status);
CREATE INDEX idx_ads_campaigns_integration_id ON public.ads_campaigns(integration_id);
CREATE INDEX idx_ads_campaigns_status ON public.ads_campaigns(status);
CREATE INDEX idx_ads_campaigns_marca ON public.ads_campaigns(marca);
CREATE INDEX idx_ads_creatives_campaign_id ON public.ads_creatives(campaign_id);