import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface MetaAdAccount {
  id: string;
  name: string;
  account_status: number;
  currency?: string;
}

interface AdsIntegration {
  id: string;
  user_id: string;
  platform: string;
  account_id: string;
  account_name: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  status: string;
  last_sync_at: string | null;
  sync_error: string | null;
  marca?: string | null;
  created_at: string;
  updated_at: string;
}

async function fetchMetaApi(endpoint: string, accessToken: string): Promise<any> {
  const url = `https://graph.facebook.com/v21.0/${endpoint}`;
  console.log(`Fetching: ${url.substring(0, 150)}...`);
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json();
  if (!response.ok) {
    console.error("Meta API Error:", JSON.stringify(data, null, 2));
    throw new Error(data.error?.message || `Meta API error: ${response.status}`);
  }
  return data;
}

async function fetchAllPages(endpoint: string, accessToken: string): Promise<any[]> {
  let allData: any[] = [];
  let url = `https://graph.facebook.com/v21.0/${endpoint}`;
  while (url) {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || `Meta API error: ${response.status}`);
    }
    allData = allData.concat(data.data || []);
    url = data.paging?.next || null;
  }
  return allData;
}

// Find or create marca by name
async function findOrCreateMarca(supabase: any, brandName: string): Promise<string | null> {
  const { data: existingBrand } = await supabase
    .from("marcas")
    .select("id")
    .eq("nome", brandName)
    .single();

  if (existingBrand) {
    return existingBrand.id;
  }

  const { data: newBrand } = await supabase
    .from("marcas")
    .insert({ nome: brandName })
    .select("id")
    .single();

  return newBrand?.id || null;
}

async function syncAdAccount(
  supabase: any,
  accessToken: string,
  accountId: string,
  accountName: string,
  timeRange: { since: string; until: string },
  brandName: string
): Promise<{ campaigns: number; ads: number; metricsRows: number }> {
  const formattedAccountId = accountId.startsWith("act_") ? accountId : `act_${accountId}`;
  console.log(`Syncing account: ${formattedAccountId} (${accountName})`);

  // 1. Get or create brand
  const brandId = await findOrCreateMarca(supabase, brandName);

  // 2. Fetch account info from Meta to get currency
  let currency = "BRL";
  try {
    const accountInfo = await fetchMetaApi(
      `${formattedAccountId}?fields=id,name,account_status,currency`,
      accessToken
    );
    currency = accountInfo.currency || "BRL";
  } catch (e) {
    console.log("Could not fetch account info, using default currency:", e);
  }

  // 3. Upsert platform account
  const { data: account, error: accountError } = await supabase
    .from("platform_accounts")
    .upsert({
      platform: "meta",
      account_id: accountId.replace("act_", ""),
      account_name: accountName,
      marca_id: brandId,
      currency: currency,
      last_sync_at: new Date().toISOString(),
    }, { onConflict: "platform,account_id" })
    .select("id").single();

  if (accountError) throw accountError;

  // 4. Fetch ALL campaigns (including all statuses)
  const campaigns = await fetchAllPages(
    `${formattedAccountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time&limit=500`,
    accessToken
  );
  console.log(`  Found ${campaigns.length} campaigns (all statuses)`);

  // Build campaign map
  const campaignMap: Record<string, string> = {};
  for (const campaign of campaigns) {
    const rawStatus = campaign.status.toUpperCase();
    let normalizedStatus = "paused";
    if (rawStatus === "ACTIVE") normalizedStatus = "active";
    else if (rawStatus === "PAUSED") normalizedStatus = "paused";
    else normalizedStatus = "archived";

    const { data: cData } = await supabase
      .from("platform_campaigns")
      .upsert({
        account_id: account.id,
        campaign_external_id: campaign.id,
        name: campaign.name,
        status: normalizedStatus,
        objective: campaign.objective,
        daily_budget: campaign.daily_budget ? parseFloat(campaign.daily_budget) / 100 : null,
        lifetime_budget: campaign.lifetime_budget ? parseFloat(campaign.lifetime_budget) / 100 : null,
        start_date: campaign.start_time ? campaign.start_time.split("T")[0] : null,
        end_date: campaign.stop_time ? campaign.stop_time.split("T")[0] : null,
      }, { onConflict: "account_id,campaign_external_id" })
      .select("id").single();

    if (cData) campaignMap[campaign.id] = cData.id;
  }

  // 5. ACCOUNT-LEVEL INSIGHTS (single paginated call for ALL campaigns)
  let metricsRows = 0;
  try {
    const timeRangeEncoded = encodeURIComponent(JSON.stringify({ since: timeRange.since, until: timeRange.until }));
    const insightsUrl = `${formattedAccountId}/insights?fields=campaign_id,campaign_name,impressions,clicks,spend,actions,purchase_roas&level=campaign&time_range=${timeRangeEncoded}&time_increment=1&limit=500`;
    console.log(`  Insights URL: ${insightsUrl.substring(0, 200)}`);

    const debugUrl = `https://graph.facebook.com/v21.0/${insightsUrl}`;
    const debugResp = await fetch(debugUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
    const debugData = await debugResp.json();
    console.log(`  Raw insights response status: ${debugResp.status}, has data: ${!!debugData.data}, data length: ${debugData.data?.length || 0}`);
    if (debugData.error) {
      console.error(`  Insights API error: ${JSON.stringify(debugData.error)}`);
    }

    const insightsData = debugData.data || [];
    // Fetch remaining pages if any
    let nextUrl = debugData.paging?.next || null;
    while (nextUrl) {
      const pageResp = await fetch(nextUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
      const pageData = await pageResp.json();
      insightsData.push(...(pageData.data || []));
      nextUrl = pageData.paging?.next || null;
    }
    console.log(`  Got ${insightsData.length} insight rows (total after pagination)`);

    // For campaigns in insights but not in our map, create them
    const missingCampaignIds = new Set<string>();
    for (const insight of insightsData) {
      if (!campaignMap[insight.campaign_id]) {
        missingCampaignIds.add(insight.campaign_id);
      }
    }

    if (missingCampaignIds.size > 0) {
      console.log(`  Creating ${missingCampaignIds.size} campaigns from insights (DELETED/ARCHIVED)`);
      for (const extId of missingCampaignIds) {
        const insightRow = insightsData.find((i: any) => i.campaign_id === extId);
        const { data: cData } = await supabase
          .from("platform_campaigns")
          .upsert({
            account_id: account.id,
            campaign_external_id: extId,
            name: insightRow?.campaign_name || `Campaign ${extId}`,
            status: "archived",
          }, { onConflict: "account_id,campaign_external_id" })
          .select("id").single();
        if (cData) campaignMap[extId] = cData.id;
      }
    }

    // Batch upsert metrics
    const batchSize = 50;
    for (let i = 0; i < insightsData.length; i += batchSize) {
      const batch = insightsData.slice(i, i + batchSize);
      const upsertRows = [];

      for (const insight of batch) {
        const cid = campaignMap[insight.campaign_id];
        if (!cid) continue;

        const impressions = parseInt(insight.impressions || "0");
        const clicks = parseInt(insight.clicks || "0");
        const spend = parseFloat(insight.spend || "0");
        let conversions = 0;
        let revenue = 0;

        if (insight.actions) {
          const conversionTypes = [
            "purchase", "omni_purchase",
            "lead", "onsite_conversion.lead_grouped", "offsite_conversion.fb_pixel_lead",
            "complete_registration", "offsite_conversion.fb_pixel_complete_registration",
            "submit_application", "contact", "schedule",
            "offsite_conversion.fb_pixel_purchase",
          ];
          for (const action of insight.actions) {
            if (conversionTypes.includes(action.action_type)) {
              conversions += parseInt(action.value || "0");
            }
          }
        }

        if (insight.purchase_roas?.length > 0) {
          revenue = spend * parseFloat(insight.purchase_roas[0].value || "0");
        }

        upsertRows.push({
          campaign_id: cid,
          date: insight.date_start,
          impressions, clicks, spend, conversions, revenue,
          ctr: impressions > 0 ? clicks / impressions : 0,
          cpc: clicks > 0 ? spend / clicks : 0,
          roas: spend > 0 ? revenue / spend : 0,
        });
      }

      if (upsertRows.length > 0) {
        const { error } = await supabase
          .from("platform_campaign_metrics")
          .upsert(upsertRows, { onConflict: "campaign_id,date" });
        if (error) console.error(`  Metrics batch error:`, error);
        else metricsRows += upsertRows.length;
      }
    }
  } catch (e) {
    console.error(`  Insights error:`, e);
  }

  // 6. Sync ads for ACTIVE and PAUSED campaigns
  let adsProcessed = 0;
  const activeCampaigns = campaigns.filter((c: any) => ["ACTIVE", "PAUSED"].includes(c.status.toUpperCase()));
  for (const campaign of activeCampaigns) {
    const cid = campaignMap[campaign.id];
    if (!cid) continue;
    try {
      const ads = await fetchAllPages(
        `${campaign.id}/ads?fields=id,name,status,creative{id,title,body,thumbnail_url,effective_object_story_id}&limit=500`,
        accessToken
      );
      for (const ad of ads) {
        try {
          const adStatus = ad.status?.toUpperCase() === "ACTIVE" ? "active" :
            ad.status?.toUpperCase() === "PAUSED" ? "paused" : "archived";
          let previewUrl: string | null = null;
          const storyId = ad.creative?.effective_object_story_id;
          if (storyId?.includes("_")) {
            const parts = storyId.split("_");
            previewUrl = `https://www.facebook.com/${parts[0]}/posts/${parts[1]}`;
          }
          await supabase.from("platform_ads").upsert({
            campaign_id: cid,
            ad_external_id: ad.id,
            name: ad.name || `Ad ${ad.id}`,
            status: adStatus,
            headline: ad.creative?.title || null,
            description: ad.creative?.body || null,
            type: "meta_ad",
            thumbnail_url: ad.creative?.thumbnail_url || null,
            preview_url: previewUrl,
          }, { onConflict: "campaign_id,ad_external_id" });
          adsProcessed++;
        } catch { /* skip */ }
      }
    } catch { /* no ads */ }
  }

  console.log(`  Done: ${campaigns.length} campaigns, ${metricsRows} metrics, ${adsProcessed} ads`);
  return { campaigns: campaigns.length, ads: adsProcessed, metricsRows };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let logId: string | null = null;
  try {
    // Parse request body
    let startDate: string | undefined;
    let endDate: string | undefined;
    let targetIntegrationId: string | undefined;

    if (req.method === "POST") {
      try {
        const body = await req.json();
        startDate = body.start_date;
        endDate = body.end_date;
        targetIntegrationId = body.integration_id;
      } catch { /* defaults */ }
    }

    const now = new Date();
    const defaultEnd = now.toISOString().split("T")[0];
    const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const timeRange = { since: startDate || defaultStart, until: endDate || defaultEnd };

    console.log(`Meta sync: ${timeRange.since} to ${timeRange.until}`);

    // Query active Meta integrations from ads_integrations table
    let integrationsQuery = supabase
      .from("ads_integrations")
      .select("*")
      .eq("platform", "meta")
      .eq("status", "active");

    if (targetIntegrationId) {
      integrationsQuery = integrationsQuery.eq("id", targetIntegrationId);
    }

    const { data: integrations, error: intError } = await integrationsQuery;

    if (intError) {
      throw new Error(`Failed to query ads_integrations: ${intError.message}`);
    }

    if (!integrations || integrations.length === 0) {
      console.log("No active Meta integrations found in ads_integrations");
      return new Response(
        JSON.stringify({ success: true, message: "No active Meta integrations found", integrations_processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${integrations.length} active Meta integration(s)`);

    const { data: log } = await supabase
      .from("webhook_logs")
      .insert({
        webhook_type: "meta_sync",
        status: "pending",
        payload: {
          time_range: timeRange,
          integrations_count: integrations.length,
        },
      })
      .select("id").single();
    logId = log?.id;

    let totalCampaigns = 0, totalAds = 0, totalMetrics = 0, totalAccounts = 0;
    const integrationResults: Array<{
      integration_id: string;
      account_name: string;
      campaigns: number;
      ads: number;
      metrics: number;
      error?: string;
    }> = [];

    for (const integration of integrations as AdsIntegration[]) {
      try {
        console.log(`\n=== Processing integration: ${integration.account_name} (${integration.account_id}) ===`);

        const accessToken = integration.access_token;
        const accountId = integration.account_id;
        const brandName = integration.marca || integration.account_name || "Meta Account";

        // Validate the token by checking the account info
        // If token is expired, Meta will return error code 190
        const result = await syncAdAccount(
          supabase,
          accessToken,
          accountId,
          integration.account_name || `Meta Account ${accountId}`,
          timeRange,
          brandName
        );

        totalCampaigns += result.campaigns;
        totalAds += result.ads;
        totalMetrics += result.metricsRows;
        totalAccounts++;

        integrationResults.push({
          integration_id: integration.id,
          account_name: integration.account_name,
          campaigns: result.campaigns,
          ads: result.ads,
          metrics: result.metricsRows,
        });

        // Update last_sync_at and clear sync_error
        await supabase
          .from("ads_integrations")
          .update({
            last_sync_at: new Date().toISOString(),
            sync_error: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", integration.id);

        console.log(`Done ${integration.account_name}: ${result.campaigns} camp, ${result.metricsRows} metrics, ${result.ads} ads`);

      } catch (err) {
        const error = err as Error;
        console.error(`Error syncing integration ${integration.account_name}:`, error.message);

        integrationResults.push({
          integration_id: integration.id,
          account_name: integration.account_name,
          campaigns: 0,
          ads: 0,
          metrics: 0,
          error: error.message,
        });

        // Update sync_error on the ads_integrations record
        await supabase
          .from("ads_integrations")
          .update({
            sync_error: error.message,
            updated_at: new Date().toISOString(),
          })
          .eq("id", integration.id);

        // If token expired (Meta error code 190), mark as expired
        if (error.message.includes("Error validating access token") ||
            error.message.includes("Session has expired") ||
            error.message.includes("OAuthException")) {
          await supabase
            .from("ads_integrations")
            .update({ status: "expired" })
            .eq("id", integration.id);
        }
      }
    }

    if (logId) {
      await supabase.from("webhook_logs").update({ status: "success", records_processed: totalCampaigns }).eq("id", logId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        integrations_processed: integrations.length,
        accounts_synced: totalAccounts,
        campaigns_processed: totalCampaigns,
        metrics_rows: totalMetrics,
        ads_processed: totalAds,
        integrations: integrationResults,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const error = err as Error;
    console.error("Meta sync error:", error);
    if (logId) {
      await supabase.from("webhook_logs").update({ status: "error", error_message: error.message }).eq("id", logId);
    } else {
      await supabase.from("webhook_logs").insert({ webhook_type: "meta_sync", status: "error", error_message: error.message });
    }
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});



 git remote add origin https://github.com/johnnyromack/marketing.git                                                                                                       
  git branch -M main                                                                                                                                                          
  git push -u origin main
