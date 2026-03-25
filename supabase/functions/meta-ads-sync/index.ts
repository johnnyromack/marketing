import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  stop_time?: string;
}

interface MetaAdInsights {
  spend?: string;
  impressions?: string;
  clicks?: string;
  conversions?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
}

interface MetaAd {
  id: string;
  name: string;
  status: string;
  creative?: {
    id: string;
    thumbnail_url?: string;
    effective_object_story_id?: string;
  };
  insights?: { data: MetaAdInsights[] };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = userData.user.id;
    console.log('Starting Meta Ads sync for user:', userId);

    // Get request body for optional integration_id filter
    const body = await req.json().catch(() => ({}));
    const integrationId = body.integration_id;

    // Use service role for database operations
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get Meta integrations for this user
    let query = serviceClient
      .from('ads_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'meta')
      .eq('status', 'active');

    if (integrationId) {
      query = query.eq('id', integrationId);
    }

    const { data: integrations, error: intError } = await query;

    if (intError || !integrations?.length) {
      console.log('No active Meta integrations found');
      return new Response(
        JSON.stringify({ error: 'No active Meta integrations found', synced: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let totalCampaigns = 0;
    let totalAds = 0;
    const errors: string[] = [];

    for (const integration of integrations) {
      try {
        console.log(`Syncing account: ${integration.account_name}`);
        const accessToken = integration.access_token;
        const accountId = integration.account_id;

        // Fetch campaigns
        const campaignsUrl = `https://graph.facebook.com/v19.0/${accountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time&access_token=${accessToken}`;
        const campaignsResponse = await fetch(campaignsUrl);
        const campaignsData = await campaignsResponse.json();

        if (campaignsData.error) {
          console.error('Error fetching campaigns:', campaignsData.error);
          errors.push(`${integration.account_name}: ${campaignsData.error.message}`);
          
          // Mark integration as error if token expired
          if (campaignsData.error.code === 190) {
            await serviceClient
              .from('ads_integrations')
              .update({ status: 'expired', sync_error: campaignsData.error.message })
              .eq('id', integration.id);
          }
          continue;
        }

        const campaigns: MetaCampaign[] = campaignsData.data || [];
        console.log(`Found ${campaigns.length} campaigns`);

        for (const campaign of campaigns) {
          // Get campaign insights
          const insightsUrl = `https://graph.facebook.com/v19.0/${campaign.id}/insights?fields=spend,impressions,clicks,ctr,cpc,cpm&access_token=${accessToken}`;
          const insightsResponse = await fetch(insightsUrl);
          const insightsData = await insightsResponse.json();
          const insights = insightsData.data?.[0] || {};

          // Upsert campaign
          const { data: savedCampaign, error: campaignError } = await serviceClient
            .from('ads_campaigns')
            .upsert({
              integration_id: integration.id,
              external_id: campaign.id,
              name: campaign.name,
              status: campaign.status,
              objective: campaign.objective,
              budget_daily: parseFloat(campaign.daily_budget || '0') / 100,
              budget_lifetime: parseFloat(campaign.lifetime_budget || '0') / 100,
              spend: parseFloat(insights.spend || '0'),
              impressions: parseInt(insights.impressions || '0'),
              clicks: parseInt(insights.clicks || '0'),
              ctr: parseFloat(insights.ctr || '0'),
              cpc: parseFloat(insights.cpc || '0'),
              cpm: parseFloat(insights.cpm || '0'),
              start_date: campaign.start_time ? campaign.start_time.split('T')[0] : null,
              end_date: campaign.stop_time ? campaign.stop_time.split('T')[0] : null,
              synced_at: new Date().toISOString(),
            }, { onConflict: 'integration_id,external_id' })
            .select()
            .single();

          if (campaignError) {
            console.error('Error saving campaign:', campaignError);
            continue;
          }

          totalCampaigns++;

          // Fetch ads for this campaign
          const adsUrl = `https://graph.facebook.com/v19.0/${campaign.id}/ads?fields=id,name,status,creative{id,thumbnail_url}&access_token=${accessToken}`;
          const adsResponse = await fetch(adsUrl);
          const adsData = await adsResponse.json();
          const ads: MetaAd[] = adsData.data || [];

          for (const ad of ads) {
            // Get ad insights
            const adInsightsUrl = `https://graph.facebook.com/v19.0/${ad.id}/insights?fields=spend,impressions,clicks,ctr&access_token=${accessToken}`;
            const adInsightsResponse = await fetch(adInsightsUrl);
            const adInsightsData = await adInsightsResponse.json();
            const adInsights = adInsightsData.data?.[0] || {};

            await serviceClient
              .from('ads_creatives')
              .upsert({
                campaign_id: savedCampaign.id,
                external_id: ad.id,
                name: ad.name,
                status: ad.status,
                format: 'image', // Default, could be improved with creative type detection
                thumbnail_url: ad.creative?.thumbnail_url,
                spend: parseFloat(adInsights.spend || '0'),
                impressions: parseInt(adInsights.impressions || '0'),
                clicks: parseInt(adInsights.clicks || '0'),
                ctr: parseFloat(adInsights.ctr || '0'),
                synced_at: new Date().toISOString(),
              }, { onConflict: 'campaign_id,external_id' });

            totalAds++;
          }
        }

        // Update last sync time
        await serviceClient
          .from('ads_integrations')
          .update({ last_sync_at: new Date().toISOString(), sync_error: null })
          .eq('id', integration.id);

      } catch (error: unknown) {
        console.error(`Error syncing integration ${integration.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${integration.account_name}: ${errorMessage}`);
      }
    }

    console.log(`Sync complete: ${totalCampaigns} campaigns, ${totalAds} ads`);

    return new Response(
      JSON.stringify({
        success: true,
        synced_campaigns: totalCampaigns,
        synced_ads: totalAds,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in meta-ads-sync:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
