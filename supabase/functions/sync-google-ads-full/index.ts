import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AdResult {
  adGroup: {
    id: string;
    name: string;
    campaign: string;
  };
  adGroupAd: {
    resourceName: string;
    ad: {
      id: string;
      name?: string;
      type: string;
      finalUrls?: string[];
      responsiveSearchAd?: {
        headlines: Array<{ text: string }>;
        descriptions: Array<{ text: string }>;
      };
      responsiveDisplayAd?: {
        headlines: Array<{ text: string }>;
        descriptions: Array<{ text: string }>;
      };
    };
    status: string;
  };
  campaign: {
    id: string;
    name: string;
  };
  metrics: {
    impressions: string;
    clicks: string;
    costMicros: string;
    conversions: string;
    ctr: string;
    averageCpc: string;
  };
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

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const clientId = Deno.env.get("GOOGLE_ADS_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_ADS_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_ADS_CLIENT_ID or GOOGLE_ADS_CLIENT_SECRET env vars");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    throw new Error(`Failed to refresh access token: ${data.error_description || data.error}`);
  }

  return { access_token: data.access_token, expires_in: data.expires_in || 3600 };
}

async function getValidAccessToken(
  integration: AdsIntegration,
  supabase: any
): Promise<string> {
  const now = new Date();
  const expiresAt = new Date(integration.token_expires_at);

  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    console.log(`Token expired or expiring soon for ${integration.account_name}, refreshing...`);
    const refreshed = await refreshAccessToken(integration.refresh_token);

    await supabase
      .from("ads_integrations")
      .update({
        access_token: refreshed.access_token,
        token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", integration.id);

    return refreshed.access_token;
  }

  return integration.access_token;
}

async function fetchAdMetrics(
  accessToken: string,
  customerId: string,
  developerToken: string,
  loginCustomerId: string,
  startDate: string,
  endDate: string
): Promise<AdResult[]> {
  const formattedCustomerId = customerId.replace(/-/g, "");
  const formattedLoginId = loginCustomerId.replace(/-/g, "");

  const query = `
    SELECT
      campaign.id,
      campaign.name,
      ad_group.id,
      ad_group.name,
      ad_group_ad.ad.id,
      ad_group_ad.ad.name,
      ad_group_ad.ad.type,
      ad_group_ad.ad.final_urls,
      ad_group_ad.ad.responsive_search_ad.headlines,
      ad_group_ad.ad.responsive_search_ad.descriptions,
      ad_group_ad.status,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.ctr,
      metrics.average_cpc
    FROM ad_group_ad
    WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
    AND ad_group_ad.status != 'REMOVED'
    AND campaign.status != 'REMOVED'
    ORDER BY metrics.impressions DESC
    LIMIT 500
  `;

  console.log(`Fetching ads for customer: ${formattedCustomerId}`);

  const response = await fetch(
    `https://googleads.googleapis.com/v20/customers/${formattedCustomerId}/googleAds:search`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": developerToken,
        "login-customer-id": formattedLoginId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );

  const rawText = await response.text();
  console.log(`Ad fetch status for ${formattedCustomerId}:`, response.status);

  if (!response.ok) {
    console.error("Google Ads API error:", rawText.substring(0, 500));
    throw new Error(`Google Ads API error (${response.status})`);
  }

  const data = JSON.parse(rawText);
  console.log(`Found ${data.results?.length || 0} ads for customer ${formattedCustomerId}`);
  return data.results || [];
}

async function getChildAccounts(
  accessToken: string,
  developerToken: string,
  mccCustomerId: string
): Promise<Array<{ id: string; name: string }>> {
  const formattedId = mccCustomerId.replace(/-/g, "");

  const query = `
    SELECT
      customer_client.id,
      customer_client.descriptive_name,
      customer_client.manager,
      customer_client.hidden
    FROM customer_client
    WHERE customer_client.manager = FALSE
    AND customer_client.hidden = FALSE
  `;

  const response = await fetch(
    `https://googleads.googleapis.com/v20/customers/${formattedId}/googleAds:search`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": developerToken,
        "login-customer-id": formattedId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );

  const rawText = await response.text();

  if (!response.ok) {
    return [{ id: formattedId, name: `Account ${formattedId}` }];
  }

  const data = JSON.parse(rawText);
  const results = data.results || [];

  if (results.length === 0) {
    return [{ id: formattedId, name: `Account ${formattedId}` }];
  }

  return results.map((r: any) => ({
    id: r.customerClient.id,
    name: r.customerClient.descriptiveName || `Account ${r.customerClient.id}`,
  }));
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
    const developerToken = Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN");

    if (!developerToken) {
      throw new Error("Missing GOOGLE_ADS_DEVELOPER_TOKEN env var");
    }

    let startDate: string;
    let endDate: string;
    let targetIntegrationId: string | null = null;

    try {
      const body = await req.json();
      targetIntegrationId = body.integration_id || null;
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      startDate = body.start_date || weekAgo.toISOString().split("T")[0];
      endDate = body.end_date || today.toISOString().split("T")[0];
    } catch {
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      startDate = weekAgo.toISOString().split("T")[0];
      endDate = today.toISOString().split("T")[0];
    }

    console.log(`Syncing Google Ads (ads detail) from ${startDate} to ${endDate}`);

    // Query active Google integrations from ads_integrations table
    let integrationsQuery = supabase
      .from("ads_integrations")
      .select("*")
      .eq("platform", "google")
      .eq("status", "active");

    if (targetIntegrationId) {
      integrationsQuery = integrationsQuery.eq("id", targetIntegrationId);
    }

    const { data: integrations, error: intError } = await integrationsQuery;

    if (intError) {
      throw new Error(`Failed to query ads_integrations: ${intError.message}`);
    }

    if (!integrations || integrations.length === 0) {
      console.log("No active Google integrations found in ads_integrations");
      return new Response(
        JSON.stringify({ success: true, message: "No active Google integrations found", integrations_processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${integrations.length} active Google integration(s)`);

    const { data: log } = await supabase
      .from("webhook_logs")
      .insert({
        webhook_type: "google_ads_full",
        status: "pending",
        payload: { sync_type: "ads", start_date: startDate, end_date: endDate, integrations_count: integrations.length },
      })
      .select("id")
      .single();

    logId = log?.id;

    let grandTotalAds = 0;
    const integrationResults: Array<{
      integration_id: string;
      account_name: string;
      accounts: Array<{ account: string; ads: number; error?: string }>;
      error?: string;
    }> = [];

    for (const integration of integrations as AdsIntegration[]) {
      const integrationResult: typeof integrationResults[0] = {
        integration_id: integration.id,
        account_name: integration.account_name,
        accounts: [],
      };

      try {
        console.log(`\n=== Processing integration: ${integration.account_name} (${integration.account_id}) ===`);

        // Get a valid access token (refresh if needed)
        const accessToken = await getValidAccessToken(integration, supabase);
        const mccCustomerId = integration.account_id;

        // Discover accounts
        const accounts = await getChildAccounts(accessToken, developerToken, mccCustomerId);
        console.log(`Will sync ads for ${accounts.length} accounts`);

        for (const account of accounts) {
          try {
            console.log(`Processing ads for account: ${account.name} (${account.id})`);

            const adResults = await fetchAdMetrics(
              accessToken,
              account.id,
              developerToken,
              mccCustomerId,
              startDate,
              endDate
            );

            if (adResults.length === 0) {
              integrationResult.accounts.push({ account: account.name, ads: 0 });
              continue;
            }

            let adsProcessed = 0;

            for (const ad of adResults) {
              // Find campaign in database
              const { data: campaign } = await supabase
                .from("platform_campaigns")
                .select("id")
                .eq("campaign_external_id", ad.campaign.id)
                .maybeSingle();

              if (!campaign) {
                console.log(`Campaign ${ad.campaign.id} not found, skipping ad`);
                continue;
              }

              // Build ad name from headlines or use default
              let adName = ad.adGroupAd.ad.name || "";
              if (!adName && ad.adGroupAd.ad.responsiveSearchAd?.headlines?.length) {
                adName = ad.adGroupAd.ad.responsiveSearchAd.headlines[0].text;
              }
              if (!adName) {
                adName = `Ad ${ad.adGroupAd.ad.id}`;
              }

              // Get headline and description
              const headline = ad.adGroupAd.ad.responsiveSearchAd?.headlines?.[0]?.text || null;
              const description = ad.adGroupAd.ad.responsiveSearchAd?.descriptions?.[0]?.text || null;
              const finalUrl = ad.adGroupAd.ad.finalUrls?.[0] || null;

              const adData = {
                campaign_id: campaign.id,
                ad_external_id: ad.adGroupAd.ad.id,
                name: adName,
                type: ad.adGroupAd.ad.type,
                status: ad.adGroupAd.status === "ENABLED" ? "active" : "paused",
                headline,
                description,
                final_url: finalUrl,
              };

              // Upsert ad
              const { data: existingAd } = await supabase
                .from("platform_ads")
                .select("id")
                .eq("campaign_id", campaign.id)
                .eq("ad_external_id", ad.adGroupAd.ad.id)
                .maybeSingle();

              let adId: string;

              if (existingAd) {
                await supabase.from("platform_ads").update(adData).eq("id", existingAd.id);
                adId = existingAd.id;
              } else {
                const { data: newAd } = await supabase
                  .from("platform_ads")
                  .insert(adData)
                  .select("id")
                  .single();
                adId = newAd!.id;
              }

              // Upsert ad metrics
              const impressions = parseInt(ad.metrics.impressions || "0");
              const clicks = parseInt(ad.metrics.clicks || "0");
              const spend = parseInt(ad.metrics.costMicros || "0") / 1000000;
              const conversions = parseFloat(ad.metrics.conversions || "0");
              const ctr = parseFloat(ad.metrics.ctr || "0") * 100;
              const cpc = parseInt(ad.metrics.averageCpc || "0") / 1000000;

              await supabase
                .from("platform_ad_metrics")
                .upsert(
                  {
                    ad_id: adId,
                    date: endDate,
                    impressions,
                    clicks,
                    spend,
                    conversions,
                    ctr,
                    cpc,
                  },
                  { onConflict: "ad_id,date" }
                );

              adsProcessed++;
            }

            integrationResult.accounts.push({ account: account.name, ads: adsProcessed });
            grandTotalAds += adsProcessed;

          } catch (error) {
            console.error(`Error processing account ${account.name}:`, error);
            integrationResult.accounts.push({
              account: account.name,
              ads: 0,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }

        // Update last_sync_at and clear sync_error
        await supabase
          .from("ads_integrations")
          .update({
            last_sync_at: new Date().toISOString(),
            sync_error: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", integration.id);

      } catch (err) {
        const error = err as Error;
        console.error(`Error processing integration ${integration.account_name}:`, error.message);
        integrationResult.error = error.message;

        // Update sync_error
        await supabase
          .from("ads_integrations")
          .update({
            sync_error: error.message,
            updated_at: new Date().toISOString(),
          })
          .eq("id", integration.id);

        if (error.message.includes("Failed to refresh access token")) {
          await supabase
            .from("ads_integrations")
            .update({ status: "expired" })
            .eq("id", integration.id);
        }
      }

      integrationResults.push(integrationResult);
    }

    if (logId) {
      await supabase
        .from("webhook_logs")
        .update({
          status: "success",
          records_processed: grandTotalAds,
          payload: { integrations: integrationResults, start_date: startDate, end_date: endDate },
        })
        .eq("id", logId);
    }

    console.log(`Ads sync completed. Total ads processed: ${grandTotalAds}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${grandTotalAds} ads from ${integrations.length} integration(s)`,
        integrations: integrationResults,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Ads sync error:", error);

    if (logId) {
      await supabase
        .from("webhook_logs")
        .update({
          status: "error",
          error_message: error instanceof Error ? error.message : "Unknown error",
        })
        .eq("id", logId);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
