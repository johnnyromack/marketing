import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

interface GoogleCampaign {
  campaign_id?: string;
  id?: string; // Alternative field from Google Ads API
  name: string;
  status: string;
  objective?: string;
  advertisingChannelType?: string; // Google Ads field for objective
  daily_budget?: number;
  lifetime_budget?: number;
  start_date?: string;
  startDate?: string; // Alternative field
  end_date?: string;
  endDate?: string; // Alternative field
  metrics?: {
    date: string;
    impressions: number;
    clicks: number;
    spend: number;
    conversions?: number;
    revenue?: number;
  };
}

interface GoogleCampaignData {
  account_id: string;
  account_name: string;
  brand_name?: string;
  campaigns: GoogleCampaign[] | GoogleCampaign; // Accept both array and single object
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
    const webhookSecret = req.headers.get("x-webhook-secret");
    
    const { data: config } = await supabase
      .from("webhook_configs")
      .select("secret_key, is_active")
      .eq("webhook_type", "google")
      .single();

    if (!config?.is_active) {
      throw new Error("Webhook is not active");
    }

    if (webhookSecret !== config.secret_key) {
      throw new Error("Invalid webhook secret");
    }

    const payload: GoogleCampaignData = await req.json();
    console.log("Received Google Ads payload:", JSON.stringify(payload));

    const { data: log } = await supabase
      .from("webhook_logs")
      .insert({
        webhook_type: "google",
        status: "pending",
        payload,
      })
      .select("id")
      .single();
    
    logId = log?.id;

    let recordsProcessed = 0;

    // Get or create brand
    let brandId: string | null = null;
    if (payload.brand_name) {
      const { data: existingBrand } = await supabase
        .from("marcas")
        .select("id")
        .eq("nome", payload.brand_name)
        .single();

      if (existingBrand) {
        brandId = existingBrand.id;
      } else {
        const { data: newBrand } = await supabase
          .from("marcas")
          .insert({ nome: payload.brand_name })
          .select("id")
          .single();
        brandId = newBrand?.id || null;
      }
    }

    // Upsert platform account
    const { data: account, error: accountError } = await supabase
      .from("platform_accounts")
      .upsert(
        {
          platform: "google",
          account_id: payload.account_id,
          account_name: payload.account_name,
          marca_id: brandId,
          last_sync_at: new Date().toISOString(),
        },
        { onConflict: "platform,account_id" }
      )
      .select("id")
      .single();

    if (accountError) {
      console.error("Error upserting account:", accountError);
      throw accountError;
    }

    // Normalize campaigns to always be an array
    const campaignsArray: GoogleCampaign[] = Array.isArray(payload.campaigns) 
      ? payload.campaigns 
      : [payload.campaigns];

    // Map Google Ads status to allowed values
    const normalizeStatus = (status: string): string => {
      const s = status.toLowerCase();
      if (s === "enabled" || s === "active") return "active";
      if (s === "paused") return "paused";
      if (s === "removed" || s === "deleted") return "archived";
      return "unknown";
    };

    // Process campaigns
    for (const campaign of campaignsArray) {
      // Get campaign_id from either field
      const campaignId = campaign.campaign_id || campaign.id || "";
      const campaignName = campaign.name || "";
      const campaignStatus = normalizeStatus(campaign.status || "unknown");
      const campaignObjective = campaign.objective || campaign.advertisingChannelType || "";
      const startDate = campaign.start_date || campaign.startDate || null;
      const endDate = campaign.end_date || campaign.endDate || null;

      // Skip if no valid campaign_id or name
      if (!campaignId && !campaignName) {
        console.log("Skipping campaign with no id or name");
        continue;
      }

      const { data: campaignData, error: campaignError } = await supabase
        .from("platform_campaigns")
        .upsert(
          {
            account_id: account.id,
            campaign_external_id: campaignId || `auto_${Date.now()}`,
            name: campaignName || "Unnamed Campaign",
            status: campaignStatus === "" ? "unknown" : campaignStatus,
            objective: campaignObjective || null,
            daily_budget: campaign.daily_budget || null,
            lifetime_budget: campaign.lifetime_budget || null,
            start_date: startDate,
            end_date: endDate,
          },
          { onConflict: "account_id,campaign_external_id" }
        )
        .select("id")
        .single();

      if (campaignError) {
        console.error("Error upserting campaign:", campaignError);
        continue;
      }

      if (campaign.metrics && campaignData) {
        const ctr = campaign.metrics.clicks > 0 && campaign.metrics.impressions > 0
          ? campaign.metrics.clicks / campaign.metrics.impressions
          : 0;
        const cpc = campaign.metrics.clicks > 0
          ? campaign.metrics.spend / campaign.metrics.clicks
          : 0;
        const roas = campaign.metrics.spend > 0 && campaign.metrics.revenue
          ? campaign.metrics.revenue / campaign.metrics.spend
          : 0;

        await supabase.from("platform_campaign_metrics").upsert(
          {
            campaign_id: campaignData.id,
            date: campaign.metrics.date,
            impressions: campaign.metrics.impressions,
            clicks: campaign.metrics.clicks,
            spend: campaign.metrics.spend,
            conversions: campaign.metrics.conversions || 0,
            revenue: campaign.metrics.revenue || 0,
            ctr,
            cpc,
            roas,
          },
          { onConflict: "campaign_id,date" }
        );
      }

      recordsProcessed++;
    }

    if (logId) {
      await supabase
        .from("webhook_logs")
        .update({ status: "success", records_processed: recordsProcessed })
        .eq("id", logId);
    }

    console.log(`Google webhook processed ${recordsProcessed} campaigns`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${recordsProcessed} campaigns`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const error = err as Error;
    console.error("Google webhook error:", error);

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
