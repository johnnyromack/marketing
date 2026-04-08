import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AdsIntegration {
  id: string;
  user_id: string;
  platform: 'meta' | 'google';
  account_id: string;
  account_name: string | null;
  display_name: string | null;
  status: 'active' | 'expired' | 'revoked' | 'error';
  last_sync_at: string | null;
  sync_error: string | null;
  created_at: string;
}

export interface AdsCampaign {
  id: string;
  integration_id: string;
  external_id: string;
  name: string;
  status: string;
  objective: string | null;
  budget_daily: number;
  budget_lifetime: number;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpm: number;
  start_date: string | null;
  end_date: string | null;
  marca: string | null;
  unidade: string | null;
  synced_at: string;
  integration?: AdsIntegration;
}

export interface AdsCreative {
  id: string;
  campaign_id: string;
  external_id: string;
  name: string;
  status: string;
  format: string | null;
  preview_url: string | null;
  thumbnail_url: string | null;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  synced_at: string;
}

export function useAdsIntegrations() {
  const [integrations, setIntegrations] = useState<AdsIntegration[]>([]);
  const [campaigns, setCampaigns] = useState<AdsCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const fetchIntegrations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('ads_integrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIntegrations((data || []) as AdsIntegration[]);
    } catch (error) {
      console.error('Error fetching integrations:', error);
    }
  }, []);

  const fetchCampaigns = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('ads_campaigns')
        .select(`
          *,
          integration:ads_integrations(*)
        `)
        .order('synced_at', { ascending: false });

      if (error) throw error;
      setCampaigns((data || []) as AdsCampaign[]);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchIntegrations(), fetchCampaigns()]);
    setLoading(false);
  }, [fetchIntegrations, fetchCampaigns]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listen for OAuth popup messages
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'meta-auth-success') {
        toast({
          title: 'Conectado com sucesso!',
          description: `${event.data.accounts?.length || 1} conta(s) conectada(s). Iniciando sincronização…`,
        });
        await loadData();
        // Auto-sync all newly connected accounts
        supabase.functions.invoke('sync-meta-ads', { body: {} })
          .then(() => loadData())
          .catch(err => console.warn('Auto sync warning:', err));
      } else if (event.data?.type === 'google-auth-success') {
        toast({
          title: 'Conectado com sucesso!',
          description: `${event.data.accounts?.length || 1} conta(s) conectada(s).`,
        });
        loadData();
      } else if (event.data?.type === 'meta-auth-error' || event.data?.type === 'google-auth-error') {
        toast({
          title: 'Erro na conexão',
          description: event.data.error || 'Falha ao conectar conta.',
          variant: 'destructive',
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [toast, loadData]);

  const connectMeta = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        toast({
          title: 'Erro',
          description: 'Você precisa estar logado para conectar uma conta.',
          variant: 'destructive',
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('meta-ads-auth', {
        body: { redirect_url: window.location.href },
      });

      if (error) throw error;
      if (data?.auth_url) {
        // Open in popup
        window.open(data.auth_url, 'meta-oauth', 'width=600,height=700');
      }
    } catch (error) {
      console.error('Error starting Meta OAuth:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao iniciar conexão com Meta.',
        variant: 'destructive',
      });
    }
  };

  const connectGoogle = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        toast({
          title: 'Erro',
          description: 'Você precisa estar logado para conectar uma conta.',
          variant: 'destructive',
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('google-ads-auth', {
        body: { redirect_url: window.location.href },
      });

      if (error) throw error;
      if (data?.auth_url) {
        window.open(data.auth_url, 'google-oauth', 'width=600,height=700');
      }
    } catch (error) {
      console.error('Error starting Google OAuth:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao iniciar conexão com Google Ads.',
        variant: 'destructive',
      });
    }
  };

  const syncIntegration = async (integrationId: string, platform: 'meta' | 'google') => {
    setSyncing(true);
    try {
      const functionName = platform === 'meta' ? 'sync-meta-ads' : 'sync-google-ads';
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { integration_id: integrationId },
      });

      if (error) throw error;

      const campaigns = data?.campaigns_processed ?? data?.integrations?.[0]?.accounts?.reduce((acc: number, a: any) => acc + (a.campaigns || 0), 0) ?? 0;

      toast({
        title: 'Sincronização concluída',
        description: `${campaigns} campanhas sincronizadas.`,
      });

      await loadData();
    } catch (error) {
      console.error('Error syncing:', error);
      toast({
        title: 'Erro na sincronização',
        description: 'Falha ao sincronizar dados.',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const syncAll = async () => {
    setSyncing(true);
    try {
      const metaIntegrations = integrations.filter(i => i.platform === 'meta' && i.status === 'active');
      const googleIntegrations = integrations.filter(i => i.platform === 'google' && i.status === 'active');

      const [metaResult, googleResult] = await Promise.all([
        metaIntegrations.length > 0 ? supabase.functions.invoke('sync-meta-ads', { body: {} }) : null,
        googleIntegrations.length > 0 ? supabase.functions.invoke('sync-google-ads', { body: {} }) : null,
      ]);

      const metaCampaigns = metaResult?.data?.campaigns_processed ?? 0;
      const googleCampaigns = googleResult?.data?.integrations?.reduce(
        (acc: number, i: any) => acc + i.accounts?.reduce((a: number, ac: any) => a + (ac.campaigns || 0), 0),
        0
      ) ?? 0;

      const total = metaCampaigns + googleCampaigns;

      toast({
        title: 'Sincronização concluída',
        description: total > 0
          ? `${total} campanhas sincronizadas (Meta: ${metaCampaigns}, Google: ${googleCampaigns}).`
          : 'Sincronização concluída. Dados atualizados.',
      });

      await loadData();
    } catch (error) {
      console.error('Error syncing all:', error);
      toast({
        title: 'Erro na sincronização',
        description: 'Falha ao sincronizar dados.',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const disconnectIntegration = async (integrationId: string) => {
    try {
      const { error } = await supabase
        .from('ads_integrations')
        .delete()
        .eq('id', integrationId);

      if (error) throw error;

      toast({
        title: 'Conta desconectada',
        description: 'A integração foi removida com sucesso.',
      });

      await loadData();
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao desconectar conta.',
        variant: 'destructive',
      });
    }
  };

  const updateDisplayName = async (accountId: string, platform: 'meta' | 'google', displayName: string | null) => {
    const { error } = await supabase
      .from('ads_integrations')
      .update({ display_name: displayName || null })
      .eq('account_id', accountId)
      .eq('platform', platform);

    if (error) {
      console.error('Error updating display name:', error);
      return false;
    }

    setIntegrations(prev =>
      prev.map(i =>
        i.account_id === accountId && i.platform === platform
          ? { ...i, display_name: displayName || null }
          : i
      )
    );
    return true;
  };

  const updateCampaignMarca = async (campaignId: string, marca: string | null, unidade?: string | null) => {
    try {
      const { error } = await supabase
        .from('ads_campaigns')
        .update({ marca, unidade })
        .eq('id', campaignId);

      if (error) throw error;

      toast({
        title: 'Campanha atualizada',
        description: 'Marca associada com sucesso.',
      });

      await fetchCampaigns();
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar campanha.',
        variant: 'destructive',
      });
    }
  };

  return {
    integrations,
    campaigns,
    loading,
    syncing,
    connectMeta,
    connectGoogle,
    syncIntegration,
    syncAll,
    disconnectIntegration,
    updateDisplayName,
    updateCampaignMarca,
    refresh: loadData,
  };
}
