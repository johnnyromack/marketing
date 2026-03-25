import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TIKTOK_API_BASE = "https://business-api.tiktok.com/open_api/v1.3";

interface TikTokTokenResponse {
  code: number;
  message: string;
  data: {
    access_token: string;
    advertiser_ids: string[];
    scope: string[];
  };
}

async function refreshAccessToken(appId: string, appSecret: string, supabase: any): Promise<string | null> {
  // Get current access token from api_configurations
  const { data: tokenConfig } = await supabase
    .from("api_configurations")
    .select("config_value")
    .eq("config_key", "TIKTOK_ACCESS_TOKEN")
    .single();

  const currentToken = tokenConfig?.config_value;
  if (!currentToken) {
    console.error("No TikTok access token configured");
    return null;
  }

  // Try using current token first - test with a simple API call
  const testRes = await fetch(`${TIKTOK_API_BASE}/advertiser/info/`, {
    method: "GET",
    headers: {
      "Access-Token": currentToken,
      "Content-Type": "application/json",
    },
  });

  const testData = await testRes.json();

  // If token is valid, return it
  if (testData.code === 0) {
    return currentToken;
  }

  // Token expired - try to refresh using auth code flow
  // For now, log the error and return current token anyway
  // Full OAuth refresh requires an auth_code which needs user interaction
  console.warn("TikTok token may be expired. Code:", testData.code, "Message:", testData.message);

  // Attempt refresh via the refresh endpoint
  try {
    const refreshRes = await fetch("https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app_id: appId,
        secret: appSecret,
        grant_type: "refresh_token",
        // Note: TikTok's long-lived tokens don't always support refresh_token grant
        // This is a best-effort attempt
      }),
    });

    const refreshData: TikTokTokenResponse = await refreshRes.json();

    if (refreshData.code === 0 && refreshData.data?.access_token) {
      const newToken = refreshData.data.access_token;

      // Update token in database
      await supabase
        .from("api_configurations")
        .update({
          config_value: newToken,
          is_configured: true,
        })
        .eq("config_key", "TIKTOK_ACCESS_TOKEN");

      console.log("TikTok access token refreshed successfully");
      return newToken;
    }
  } catch (err) {
    console.error("Token refresh failed:", err);
  }

  // Return current token as fallback
  return currentToken;
}

async function fetchCampaigns(accessToken: string, advertiserId: string) {
  const res = await fetch(`${TIKTOK_API_BASE}/campaign/get/`, {
    method: "GET",
    headers: {
      "Access-Token": accessToken,
      "Content-Type": "application/json",
    },
  });

  // TikTok API uses query params for GET
  const url = new URL(`${TIKTOK_API_BASE}/campaign/get/`);
  url.searchParams.set("advertiser_id", advertiserId);
  url.searchParams.set("page_size", "100");

  const response = await fetch(url.toString(), {
    headers: {
      "Access-Token": accessToken,
    },
  });

  const data = await response.json();

  if (data.code !== 0) {
    throw new Error(`TikTok API error: ${data.message}`);
  }

  return data.data?.list || [];
}

async function fetchCampaignMetrics(accessToken: string, advertiserId: string, campaignIds: string[], startDate: string, endDate: string) {
  const url = new URL(`${TIKTOK_API_BASE}/report/integrated/get/`);
  url.searchParams.set("advertiser_id", advertiserId);
  url.searchParams.set("report_type", "BASIC");
  url.searchParams.set("data_level", "AUCTION_CAMPAIGN");
  url.searchParams.set("dimensions", JSON.stringify(["campaign_id", "stat_time_day"]));
  url.searchParams.set("metrics", JSON.stringify([
    "spend", "impressions", "clicks", "conversions", "cpc", "ctr", "cost_per_conversion"
  ]));
  url.searchParams.set("start_date", startDate);
  url.searchParams.set("end_date", endDate);
  url.searchParams.set("page_size", "200");

  if (campaignIds.length > 0) {
    url.searchParams.set("filtering", JSON.stringify({
      campaign_ids: campaignIds,
    }));
  }

  const response = await fetch(url.toString(), {
    headers: {
      "Access-Token": accessToken,
    },
  });

  const data = await response.json();

  if (data.code !== 0) {
    throw new Error(`TikTok Reporting API error: ${data.message}`);
  }

  return data.data?.list || [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Get credentials from api_configurations
    const { data: configs } = await supabase
      .from("api_configurations")
      .select("config_key, config_value")
      .in("config_key", ["TIKTOK_APP_ID", "TIKTOK_APP_SECRET", "TIKTOK_ACCESS_TOKEN", "TIKTOK_ADVERTISER_ID"]);

    const configMap: Record<string, string> = {};
    (configs || []).forEach((c: any) => {
      if (c.config_value) configMap[c.config_key] = c.config_value;
    });

    const appId = configMap.TIKTOK_APP_ID;
    const appSecret = configMap.TIKTOK_APP_SECRET;
    const advertiserId = configMap.TIKTOK_ADVERTISER_ID;

    if (!appId || !appSecret || !advertiserId) {
      throw new Error("TikTok credentials not fully configured. Need App ID, App Secret, and Advertiser ID.");
    }

    // Refresh/validate access token
    const accessToken = await refreshAccessToken(appId, appSecret, supabase);
    if (!accessToken) {
      throw new Error("No valid TikTok access token available");
    }

    // Get or create brand
    let brandId: string | null = null;
    const { data: existingAccount } = await supabase
      .from("platform_accounts")
      .select("marca_id")
      .eq("platform", "tiktok")
      .eq("account_id", advertiserId)
      .single();

    brandId = existingAccount?.marca_id || null;

    // Upsert platform account
    const { data: account, error: accountError } = await supabase
      .from("platform_accounts")
      .upsert(
        {
          platform: "tiktok",
          account_id: advertiserId,
          account_name: `TikTok Ads - ${advertiserId}`,
          marca_id: brandId,
          last_sync_at: new Date().toISOString(),
        },
        { onConflict: "platform,account_id" }
      )
      .select("id")
      .single();

    if (accountError) throw accountError;

    // Fetch campaigns from TikTok API
    const campaigns = await fetchCampaigns(accessToken, advertiserId);
    console.log(`Fetched ${campaigns.length} campaigns from TikTok`);

    let campaignsProcessed = 0;
    const campaignExternalIds: string[] = [];

    for (const campaign of campaigns) {
      const status = campaign.campaign_status === "CAMPAIGN_STATUS_ENABLE"
        ? "active"
        : campaign.campaign_status === "CAMPAIGN_STATUS_DISABLE"
        ? "paused"
        : "archived";

      const { data: campaignData, error: campaignError } = await supabase
        .from("platform_campaigns")
        .upsert(
          {
            account_id: account.id,
            campaign_external_id: campaign.campaign_id,
            name: campaign.campaign_name,
            status,
            objective: campaign.objective_type,
            daily_budget: campaign.budget > 0 ? campaign.budget : null,
          },
          { onConflict: "account_id,campaign_external_id" }
        )
        .select("id")
        .single();

      if (campaignError) {
        console.error("Error upserting campaign:", campaignError);
        continue;
      }

      campaignExternalIds.push(campaign.campaign_id);
      campaignsProcessed++;
    }

    // Fetch metrics for last 7 days
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    let metricsProcessed = 0;

    if (campaignExternalIds.length > 0) {
      const metrics = await fetchCampaignMetrics(accessToken, advertiserId, campaignExternalIds, startDate, endDate);

      for (const metric of metrics) {
        const dimensions = metric.dimensions || {};
        const stats = metric.metrics || {};

        // Find internal campaign ID
        const { data: internalCampaign } = await supabase
          .from("platform_campaigns")
          .select("id")
          .eq("account_id", account.id)
          .eq("campaign_external_id", dimensions.campaign_id)
          .single();

        if (!internalCampaign) continue;

        const spend = parseFloat(stats.spend || "0");
        const impressions = parseInt(stats.impressions || "0");
        const clicks = parseInt(stats.clicks || "0");
        const conversions = parseInt(stats.conversions || "0");
        const ctr = parseFloat(stats.ctr || "0");
        const cpc = parseFloat(stats.cpc || "0");
        const roas = spend > 0 && stats.total_complete_payment_rate
          ? parseFloat(stats.total_complete_payment_rate)
          : 0;

        await supabase.from("platform_campaign_metrics").upsert(
          {
            campaign_id: internalCampaign.id,
            date: dimensions.stat_time_day,
            impressions,
            clicks,
            spend,
            conversions,
            ctr,
            cpc,
            roas,
          },
          { onConflict: "campaign_id,date" }
        );

        metricsProcessed++;
      }
    }

    const summary = `TikTok sync complete: ${campaignsProcessed} campaigns, ${metricsProcessed} metric records`;
    console.log(summary);

    return new Response(
      JSON.stringify({
        success: true,
        message: summary,
        campaigns_processed: campaignsProcessed,
        metrics_processed: metricsProcessed,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const error = err as Error;
    console.error("TikTok sync error:", error);

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
