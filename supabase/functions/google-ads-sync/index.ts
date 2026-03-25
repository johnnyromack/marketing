import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function refreshGoogleToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const GOOGLE_ADS_CLIENT_ID = Deno.env.get('GOOGLE_ADS_CLIENT_ID');
  const GOOGLE_ADS_CLIENT_SECRET = Deno.env.get('GOOGLE_ADS_CLIENT_SECRET');

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_ADS_CLIENT_ID!,
        client_secret: GOOGLE_ADS_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const data = await response.json();
    if (data.access_token) {
      return { access_token: data.access_token, expires_in: data.expires_in || 3600 };
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
  }
  return null;
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
    console.log('Starting Google Ads sync for user:', userId);

    const body = await req.json().catch(() => ({}));
    const integrationId = body.integration_id;

    const GOOGLE_ADS_DEVELOPER_TOKEN = Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN');

    // Use service role for database operations
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get Google integrations for this user
    let query = serviceClient
      .from('ads_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'google')
      .eq('status', 'active');

    if (integrationId) {
      query = query.eq('id', integrationId);
    }

    const { data: integrations, error: intError } = await query;

    if (intError || !integrations?.length) {
      console.log('No active Google integrations found');
      return new Response(
        JSON.stringify({ error: 'No active Google integrations found', synced: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let totalCampaigns = 0;
    let totalAds = 0;
    const errors: string[] = [];

    for (const integration of integrations) {
      try {
        console.log(`Syncing account: ${integration.account_name}`);
        
        let accessToken = integration.access_token;
        const customerId = integration.account_id;

        // Check if token needs refresh
        const tokenExpiry = new Date(integration.token_expires_at);
        if (tokenExpiry < new Date()) {
          console.log('Token expired, refreshing...');
          const refreshed = await refreshGoogleToken(integration.refresh_token);
          if (refreshed) {
            accessToken = refreshed.access_token;
            await serviceClient
              .from('ads_integrations')
              .update({
                access_token: refreshed.access_token,
                token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
              })
              .eq('id', integration.id);
          } else {
            await serviceClient
              .from('ads_integrations')
              .update({ status: 'expired', sync_error: 'Failed to refresh token' })
              .eq('id', integration.id);
            errors.push(`${integration.account_name}: Failed to refresh token`);
            continue;
          }
        }

        // Fetch campaigns using Google Ads API (REST)
        const campaignsQuery = `
          SELECT
            campaign.id,
            campaign.name,
            campaign.status,
            campaign.advertising_channel_type,
            campaign_budget.amount_micros,
            metrics.cost_micros,
            metrics.impressions,
            metrics.clicks,
            metrics.conversions,
            metrics.ctr,
            metrics.average_cpc,
            metrics.average_cpm
          FROM campaign
          WHERE campaign.status != 'REMOVED'
        `;

        const searchResponse = await fetch(
          `https://googleads.googleapis.com/v20/customers/${customerId}/googleAds:search`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'developer-token': GOOGLE_ADS_DEVELOPER_TOKEN || '',
              'login-customer-id': customerId,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: campaignsQuery }),
          }
        );

        const searchData = await searchResponse.json();

        if (searchData.error) {
          console.error('Error fetching campaigns:', searchData.error);
          errors.push(`${integration.account_name}: ${searchData.error.message}`);
          
          if (searchData.error.code === 401) {
            await serviceClient
              .from('ads_integrations')
              .update({ status: 'expired', sync_error: searchData.error.message })
              .eq('id', integration.id);
          }
          continue;
        }

        const results = searchData.results || [];
        console.log(`Found ${results.length} campaigns`);

        for (const result of results) {
          const campaign = result.campaign;
          const metrics = result.metrics || {};
          const budget = result.campaignBudget;

          // Upsert campaign
          const { data: savedCampaign, error: campaignError } = await serviceClient
            .from('ads_campaigns')
            .upsert({
              integration_id: integration.id,
              external_id: campaign.id.toString(),
              name: campaign.name,
              status: campaign.status,
              objective: campaign.advertisingChannelType,
              budget_daily: budget ? (parseInt(budget.amountMicros) / 1000000) : 0,
              spend: metrics.costMicros ? (parseInt(metrics.costMicros) / 1000000) : 0,
              impressions: parseInt(metrics.impressions || '0'),
              clicks: parseInt(metrics.clicks || '0'),
              conversions: parseInt(metrics.conversions || '0'),
              ctr: parseFloat(metrics.ctr || '0') * 100,
              cpc: metrics.averageCpc ? (parseInt(metrics.averageCpc) / 1000000) : 0,
              cpm: metrics.averageCpm ? (parseInt(metrics.averageCpm) / 1000000) : 0,
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
          const adsQuery = `
            SELECT
              ad_group_ad.ad.id,
              ad_group_ad.ad.name,
              ad_group_ad.status,
              ad_group_ad.ad.type,
              metrics.cost_micros,
              metrics.impressions,
              metrics.clicks,
              metrics.ctr
            FROM ad_group_ad
            WHERE campaign.id = ${campaign.id}
            AND ad_group_ad.status != 'REMOVED'
          `;

          const adsResponse = await fetch(
            `https://googleads.googleapis.com/v20/customers/${customerId}/googleAds:search`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'developer-token': GOOGLE_ADS_DEVELOPER_TOKEN || '',
                'login-customer-id': customerId,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ query: adsQuery }),
            }
          );

          const adsData = await adsResponse.json();
          const ads = adsData.results || [];

          for (const adResult of ads) {
            const ad = adResult.adGroupAd?.ad;
            const adMetrics = adResult.metrics || {};

            if (!ad?.id) continue;

            await serviceClient
              .from('ads_creatives')
              .upsert({
                campaign_id: savedCampaign.id,
                external_id: ad.id.toString(),
                name: ad.name || `Ad ${ad.id}`,
                status: adResult.adGroupAd?.status || 'UNKNOWN',
                format: ad.type || 'unknown',
                spend: adMetrics.costMicros ? (parseInt(adMetrics.costMicros) / 1000000) : 0,
                impressions: parseInt(adMetrics.impressions || '0'),
                clicks: parseInt(adMetrics.clicks || '0'),
                ctr: parseFloat(adMetrics.ctr || '0') * 100,
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
    console.error('Error in google-ads-sync:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
