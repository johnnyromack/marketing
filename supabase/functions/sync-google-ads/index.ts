import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function getConfig(supabase: any, key: string): Promise<string | null> {
  const { data } = await supabase
    .from("api_configurations")
    .select("config_value")
    .eq("config_key", key)
    .single();
  return data?.config_value || null;
}

interface GoogleAdsMetrics {
  impressions: string;
  clicks: string;
  costMicros: string;
  conversions: string;
  conversionsValue: string;
}

interface GoogleAdsCampaign {
  campaign: {
    resourceName: string;
    id: string;
    name: string;
    status: string;
    advertisingChannelType: string;
  };
  segments?: {
    date: string;
  };
  metrics: GoogleAdsMetrics;
}

interface GoogleAdsResponse {
  results?: GoogleAdsCampaign[];
  error?: {
    message: string;
    status: string;
    details?: Array<{
      errors?: Array<{
        message: string;
        errorCode?: Record<string, string>;
      }>;
    }>;
  };
}

interface CustomerClient {
  customerClient: {
    clientCustomer: string;
    descriptiveName: string;
    id: string;
    manager: boolean;
    hidden: boolean;
    level: number;
  };
}

interface CustomerListResponse {
  results?: CustomerClient[];
  error?: {
    message: string;
    status: string;
  };
}

interface AccountBudgetInfo {
  accountBudget: {
    resourceName: string;
    status: string;
    approvedSpendingLimitMicros?: string;
    adjustedSpendingLimitMicros?: string;
    amountServedMicros?: string;
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
    console.error("OAuth token error:", data);
    throw new Error(`Failed to refresh access token: ${data.error_description || data.error || "Unknown error"}`);
  }

  return { access_token: data.access_token, expires_in: data.expires_in || 3600 };
}

async function getValidAccessToken(
  integration: AdsIntegration,
  supabase: any
): Promise<string> {
  const now = new Date();
  const expiresAt = new Date(integration.token_expires_at);

  // Refresh if token expires within 5 minutes
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    console.log(`Token expired or expiring soon for ${integration.account_name}, refreshing...`);
    const refreshed = await refreshAccessToken(integration.refresh_token);

    // Update the token in ads_integrations
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

// List accessible customer accounts (for MCC accounts)
async function listAccessibleCustomers(
  accessToken: string,
  developerToken: string,
  mccCustomerId: string
): Promise<string[]> {
  console.log("Listing accessible customers...");
  const formattedMccId = mccCustomerId.replace(/-/g, "");

  const response = await fetch(
    "https://googleads.googleapis.com/v20/customers:listAccessibleCustomers",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": developerToken,
        "login-customer-id": formattedMccId,
        "Content-Type": "application/json",
      },
    }
  );

  const rawText = await response.text();
  console.log("ListAccessibleCustomers status:", response.status);
  console.log("ListAccessibleCustomers response:", rawText.substring(0, 500));

  if (!response.ok) {
    throw new Error(`Failed to list customers: ${rawText.substring(0, 300)}`);
  }

  const data = JSON.parse(rawText);
  const customerIds = (data.resourceNames || []).map((rn: string) =>
    rn.replace("customers/", "")
  );

  console.log("Found accessible customers:", customerIds);
  return customerIds;
}

// Get child accounts from MCC
async function getChildAccounts(
  accessToken: string,
  developerToken: string,
  mccCustomerId: string
): Promise<CustomerClient[]> {
  const formattedId = mccCustomerId.replace(/-/g, "");
  console.log(`Getting child accounts for MCC: ${formattedId}`);

  const query = `
    SELECT
      customer_client.client_customer,
      customer_client.descriptive_name,
      customer_client.id,
      customer_client.manager,
      customer_client.hidden,
      customer_client.level
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
  console.log("GetChildAccounts status:", response.status);
  console.log("GetChildAccounts response:", rawText.substring(0, 800));

  if (!response.ok) {
    console.log("Not an MCC account or no child accounts");
    return [];
  }

  const data: CustomerListResponse = JSON.parse(rawText);
  return data.results || [];
}

// Fetch account budget/balance information
async function fetchAccountBudget(
  accessToken: string,
  customerId: string,
  developerToken: string,
  loginCustomerId: string | null
): Promise<number | null> {
  const formattedCustomerId = customerId.replace(/-/g, "");
  const formattedLoginId = loginCustomerId?.replace(/-/g, "") || formattedCustomerId;

  const query = `
    SELECT
      account_budget.status,
      account_budget.approved_spending_limit_micros,
      account_budget.adjusted_spending_limit_micros,
      account_budget.amount_served_micros
    FROM account_budget
    WHERE account_budget.status = 'APPROVED'
    ORDER BY account_budget.approved_spending_limit_micros DESC
    LIMIT 1
  `;

  console.log(`Fetching budget for customer: ${formattedCustomerId}`);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "developer-token": developerToken,
    "Content-Type": "application/json",
    "login-customer-id": formattedLoginId,
  };

  const url = `https://googleads.googleapis.com/v20/customers/${formattedCustomerId}/googleAds:search`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ query }),
    });

    const rawText = await response.text();
    console.log(`Budget fetch status for ${formattedCustomerId}:`, response.status);

    if (!response.ok) {
      console.log(`Could not fetch budget for ${formattedCustomerId}:`, rawText.substring(0, 200));
      return null;
    }

    const data = JSON.parse(rawText);
    const results = data.results || [];

    if (results.length > 0) {
      const budget = results[0] as AccountBudgetInfo;
      const limitMicros = budget.accountBudget.adjustedSpendingLimitMicros ||
                          budget.accountBudget.approvedSpendingLimitMicros || "0";
      const servedMicros = budget.accountBudget.amountServedMicros || "0";

      const limit = parseInt(limitMicros) / 1000000;
      const served = parseInt(servedMicros) / 1000000;
      const remaining = limit - served;

      console.log(`Budget for ${formattedCustomerId}: Limit=${limit}, Served=${served}, Remaining=${remaining}`);
      return remaining > 0 ? remaining : 0;
    }

    return null;
  } catch (error) {
    console.error(`Error fetching budget for ${formattedCustomerId}:`, error);
    return null;
  }
}

async function fetchCampaignMetrics(
  accessToken: string,
  customerId: string,
  developerToken: string,
  loginCustomerId: string | null,
  startDate: string,
  endDate: string
): Promise<GoogleAdsCampaign[]> {
  const formattedCustomerId = customerId.replace(/-/g, "");
  const formattedLoginId = loginCustomerId?.replace(/-/g, "") || formattedCustomerId;

  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      segments.date,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value
    FROM campaign
    WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
    AND campaign.status != 'REMOVED'
  `;

  console.log(`Fetching campaigns for customer: ${formattedCustomerId}`);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "developer-token": developerToken,
    "Content-Type": "application/json",
  };

  headers["login-customer-id"] = formattedLoginId;
  console.log(`Using login-customer-id: ${formattedLoginId}`);

  const url = `https://googleads.googleapis.com/v20/customers/${formattedCustomerId}/googleAds:search`;

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ query }),
  });

  const rawText = await response.text();
  console.log(`Campaign fetch status for ${formattedCustomerId}:`, response.status);

  if (!response.ok) {
    try {
      const errorData = JSON.parse(rawText);
      console.error("Google Ads API error:", JSON.stringify(errorData, null, 2));

      const errorMessage = errorData.error?.message ||
                          errorData.error?.details?.[0]?.errors?.[0]?.message ||
                          "Unknown error";
      throw new Error(`Google Ads API error (${response.status}): ${errorMessage}`);
    } catch (parseError) {
      if (parseError instanceof Error && parseError.message.includes("Google Ads API error")) {
        throw parseError;
      }
      throw new Error(`Google Ads API error (${response.status}): ${rawText.substring(0, 300)}`);
    }
  }

  const data: GoogleAdsResponse = JSON.parse(rawText);
  console.log(`Found ${data.results?.length || 0} campaigns for customer ${formattedCustomerId}`);
  return data.results || [];
}

// Trigger balance alerts check
async function triggerAlertCheck(supabaseUrl: string, supabaseKey: string): Promise<void> {
  try {
    console.log("Triggering balance alerts check...");
    const response = await fetch(`${supabaseUrl}/functions/v1/check-balance-alerts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseKey}`,
      },
    });
    const result = await response.json();
    console.log("Alert check result:", result);
  } catch (error) {
    console.error("Failed to trigger alert check:", error);
  }
}

// Fetch ads for an account
async function fetchAds(
  accessToken: string,
  customerId: string,
  developerToken: string,
  loginCustomerId: string | null,
  startDate: string,
  endDate: string
): Promise<any[]> {
  const formattedCustomerId = customerId.replace(/-/g, "");
  const formattedLoginId = loginCustomerId?.replace(/-/g, "") || formattedCustomerId;

  const query = `
    SELECT
      ad_group_ad.ad.id,
      ad_group_ad.ad.name,
      ad_group_ad.ad.type,
      ad_group_ad.ad.final_urls,
      ad_group_ad.status,
      campaign.id,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.ctr
    FROM ad_group_ad
    WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
    AND campaign.status != 'REMOVED'
    AND ad_group_ad.status != 'REMOVED'
  `;

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

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Ads fetch error for ${formattedCustomerId}:`, errorText.substring(0, 300));
    return [];
  }

  const data = await response.json();
  console.log(`Found ${data.results?.length || 0} ads for customer ${formattedCustomerId}`);
  return data.results || [];
}

// Find marca_id by brand name
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
    const developerToken = Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN") ||
      await getConfig(supabase, "GOOGLE_ADS_DEVELOPER_TOKEN");

    if (!developerToken) {
      throw new Error("GOOGLE_ADS_DEVELOPER_TOKEN não configurado. Acesse Configurações > Credenciais e insira o token.");
    }

    // Parse request body
    let startDate: string;
    let endDate: string;
    let skipAlerts = false;
    let targetIntegrationId: string | null = null;

    try {
      const body = await req.json();
      targetIntegrationId = body.integration_id || null;
      skipAlerts = body.skip_alerts || false;

      const today = new Date();
      const ninetyDaysAgo = new Date(today);
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      startDate = body.start_date || ninetyDaysAgo.toISOString().split("T")[0];
      endDate = body.end_date || today.toISOString().split("T")[0];
    } catch {
      const today = new Date();
      const ninetyDaysAgo = new Date(today);
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      startDate = ninetyDaysAgo.toISOString().split("T")[0];
      endDate = today.toISOString().split("T")[0];
    }

    console.log(`Syncing Google Ads from ${startDate} to ${endDate}`);

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

    // Log the sync attempt
    const { data: log } = await supabase
      .from("webhook_logs")
      .insert({
        webhook_type: "google",
        status: "pending",
        payload: {
          sync_type: "direct_api",
          start_date: startDate,
          end_date: endDate,
          integrations_count: integrations.length,
        },
      })
      .select("id")
      .single();

    logId = log?.id;

    let grandTotalRecords = 0;
    const integrationResults: Array<{
      integration_id: string;
      account_name: string;
      accounts: Array<{ account: string; campaigns: number; balance?: number | null; error?: string }>;
      error?: string;
    }> = [];

    // Process each integration from ads_integrations
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
        console.log("Access token obtained/validated");

        // The account_id from ads_integrations is used as the login-customer-id (MCC or direct)
        const mccCustomerId = integration.account_id;

        // Try to discover child accounts (MCC pattern)
        let accountsToSync: Array<{ id: string; name: string }> = [];

        // First try to get child accounts if this is an MCC
        let childAccounts: CustomerClient[] = [];
        try {
          childAccounts = await getChildAccounts(accessToken, developerToken, mccCustomerId);
          console.log(`Found ${childAccounts.length} child accounts`);
        } catch (e) {
          console.log("Could not get child accounts:", e);
        }

        if (childAccounts.length > 0) {
          for (const child of childAccounts) {
            accountsToSync.push({
              id: child.customerClient.id,
              name: child.customerClient.descriptiveName || `Account ${child.customerClient.id}`,
            });
          }
        } else {
          // Not an MCC or no children -- sync the account directly
          accountsToSync.push({
            id: mccCustomerId.replace(/-/g, ""),
            name: integration.account_name || `Google Ads Account ${mccCustomerId}`,
          });
        }

        console.log(`Will sync ${accountsToSync.length} accounts for integration ${integration.account_name}`);

        let totalRecordsProcessed = 0;

        for (const account of accountsToSync) {
          try {
            console.log(`Processing account: ${account.name} (${account.id})`);

            // Fetch campaigns
            const campaigns = await fetchCampaignMetrics(
              accessToken,
              account.id,
              developerToken,
              mccCustomerId,
              startDate,
              endDate
            );

            // Fetch account balance
            const balance = await fetchAccountBudget(
              accessToken,
              account.id,
              developerToken,
              mccCustomerId
            );
            console.log(`Account ${account.name} balance: ${balance}`);

            // Resolve brand: use integration.marca field -> match in marcas table, fallback to account name
            const brandName = integration.marca || account.name;
            const brandId = await findOrCreateMarca(supabase, brandName);

            // Upsert platform account with balance
            const { data: platformAccount, error: accountError } = await supabase
              .from("platform_accounts")
              .upsert(
                {
                  platform: "google",
                  account_id: account.id,
                  account_name: account.name,
                  marca_id: brandId,
                  balance: balance,
                  currency: "BRL",
                  last_sync_at: new Date().toISOString(),
                },
                { onConflict: "platform,account_id" }
              )
              .select("id")
              .single();

            if (accountError) {
              console.error("Error upserting account:", accountError);
              integrationResult.accounts.push({ account: account.name, campaigns: 0, balance, error: accountError.message });
              continue;
            }

            let recordsProcessed = 0;

            const normalizeStatus = (status: string): string => {
              const s = status.toUpperCase();
              if (s === "ENABLED") return "active";
              if (s === "PAUSED") return "paused";
              if (s === "REMOVED") return "archived";
              return "unknown";
            };

            // Group campaigns by campaign ID to upsert each campaign once,
            // but store metrics per day
            const campaignMap = new Map<string, GoogleAdsCampaign>();
            const dailyMetrics: Array<{ campaign: GoogleAdsCampaign; date: string }> = [];

            for (const item of campaigns) {
              const cid = item.campaign.id;
              if (!campaignMap.has(cid)) {
                campaignMap.set(cid, item);
              }
              const metricDate = item.segments?.date || endDate;
              dailyMetrics.push({ campaign: item, date: metricDate });
            }

            // Upsert campaigns
            const campaignIdMap = new Map<string, string>(); // external_id -> db_id
            for (const [externalId, item] of campaignMap) {
              const campaign = item.campaign;
              const { data: campaignData, error: campaignError } = await supabase
                .from("platform_campaigns")
                .upsert(
                  {
                    account_id: platformAccount.id,
                    campaign_external_id: externalId,
                    name: campaign.name,
                    status: normalizeStatus(campaign.status),
                    objective: campaign.advertisingChannelType || null,
                  },
                  { onConflict: "account_id,campaign_external_id" }
                )
                .select("id")
                .single();

              if (campaignError) {
                console.error("Error upserting campaign:", campaignError);
                continue;
              }
              if (campaignData) {
                campaignIdMap.set(externalId, campaignData.id);
              }
            }

            // Batch upsert daily metrics
            const metricsBatch: any[] = [];
            for (const entry of dailyMetrics) {
              const dbCampaignId = campaignIdMap.get(entry.campaign.campaign.id);
              if (!dbCampaignId || !entry.campaign.metrics) continue;

              const metrics = entry.campaign.metrics;
              const spend = parseInt(metrics.costMicros || "0") / 1000000;
              const impressions = parseInt(metrics.impressions || "0");
              const clicks = parseInt(metrics.clicks || "0");
              const conversions = parseFloat(metrics.conversions || "0");
              const revenue = parseFloat(metrics.conversionsValue || "0");

              const ctr = impressions > 0 ? clicks / impressions : 0;
              const cpc = clicks > 0 ? spend / clicks : 0;
              const roas = spend > 0 ? revenue / spend : 0;

              metricsBatch.push({
                campaign_id: dbCampaignId,
                date: entry.date,
                impressions,
                clicks,
                spend,
                conversions,
                revenue,
                ctr,
                cpc,
                roas,
              });
            }

            // Upsert in batches of 500
            for (let i = 0; i < metricsBatch.length; i += 500) {
              const batch = metricsBatch.slice(i, i + 500);
              const { error: metricsError } = await supabase
                .from("platform_campaign_metrics")
                .upsert(batch, { onConflict: "campaign_id,date" });
              if (metricsError) {
                console.error("Error upserting metrics batch:", metricsError);
              }
            }

            recordsProcessed = campaignMap.size;
            console.log(`Stored ${metricsBatch.length} daily metric rows for ${recordsProcessed} campaigns`);

            // Fetch and upsert ads
            const ads = await fetchAds(accessToken, account.id, developerToken, mccCustomerId, startDate, endDate);
            let adsSynced = 0;
            for (const adResult of ads) {
              const ad = adResult.adGroupAd?.ad || adResult.ad_group_ad?.ad;
              const campaignExternalId = String(adResult.campaign?.id || "");
              const campaignDbId = campaignIdMap.get(campaignExternalId);
              if (!ad?.id || !campaignDbId) continue;

              await supabase.from("platform_ads").upsert({
                campaign_id: campaignDbId,
                ad_external_id: String(ad.id),
                name: ad.name || `Ad ${ad.id}`,
                status: adResult.adGroupAd?.status || adResult.ad_group_ad?.status || "UNKNOWN",
                type: ad.type || ad.adType || null,
                final_url: ad.finalUrls?.[0] || ad.final_urls?.[0] || null,
              }, { onConflict: "campaign_id,ad_external_id" });
              adsSynced++;
            }
            console.log(`Synced ${adsSynced} ads for account ${account.name}`);

            integrationResult.accounts.push({ account: account.name, campaigns: recordsProcessed, ads: adsSynced, balance });
            totalRecordsProcessed += recordsProcessed;

          } catch (err) {
            const error = err as Error;
            console.error(`Error processing account ${account.name}:`, error.message);
            integrationResult.accounts.push({ account: account.name, campaigns: 0, error: error.message });
          }
        }

        // Update last_sync_at and clear sync_error on the ads_integrations record
        await supabase
          .from("ads_integrations")
          .update({
            last_sync_at: new Date().toISOString(),
            sync_error: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", integration.id);

        grandTotalRecords += totalRecordsProcessed;

      } catch (err) {
        const error = err as Error;
        console.error(`Error processing integration ${integration.account_name}:`, error.message);
        integrationResult.error = error.message;

        // Update sync_error on the ads_integrations record
        await supabase
          .from("ads_integrations")
          .update({
            sync_error: error.message,
            updated_at: new Date().toISOString(),
          })
          .eq("id", integration.id);

        // If token refresh failed, mark as expired
        if (error.message.includes("Failed to refresh access token")) {
          await supabase
            .from("ads_integrations")
            .update({ status: "expired" })
            .eq("id", integration.id);
        }
      }

      integrationResults.push(integrationResult);
    }

    // Update log
    if (logId) {
      await supabase
        .from("webhook_logs")
        .update({ status: "success", records_processed: grandTotalRecords })
        .eq("id", logId);
    }

    console.log(`Successfully synced ${grandTotalRecords} campaigns across ${integrations.length} integration(s)`);

    // Trigger balance alerts check (as background task)
    if (!skipAlerts) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      EdgeRuntime.waitUntil(triggerAlertCheck(supabaseUrl, supabaseKey));
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${grandTotalRecords} campaigns from ${integrations.length} integration(s)`,
        period: { start_date: startDate, end_date: endDate },
        integrations: integrationResults,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const error = err as Error;
    console.error("Google Ads sync error:", error);

    if (logId) {
      await supabase
        .from("webhook_logs")
        .update({
          status: "error",
          error_message: error.message,
        })
        .eq("id", logId);
    } else {
      await supabase.from("webhook_logs").insert({
        webhook_type: "google",
        status: "error",
        error_message: error.message,
      });
    }

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
