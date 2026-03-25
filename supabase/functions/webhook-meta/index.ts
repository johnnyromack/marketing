import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

interface MetaCampaignData {
  account_id: string;
  account_name: string;
  brand_name?: string;
  campaigns: Array<{
    campaign_id: string;
    name: string;
    status: string;
    objective?: string;
    daily_budget?: number;
    lifetime_budget?: number;
    start_date?: string;
    end_date?: string;
    metrics?: {
      date: string;
      impressions: number;
      clicks: number;
      spend: number;
      conversions?: number;
      revenue?: number;
    };
  }>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let logId: string | null = null;

  try {
    // Verify webhook secret
    const webhookSecret = req.headers.get("x-webhook-secret");
    
    const { data: config } = await supabase
      .from("webhook_configs")
      .select("secret_key, is_active")
      .eq("webhook_type", "meta")
      .single();

    if (!config?.is_active) {
      throw new Error("Webhook is not active");
    }

    if (webhookSecret !== config.secret_key) {
      throw new Error("Invalid webhook secret");
    }

    const payload: MetaCampaignData = await req.json();
    console.log("Received Meta Ads payload:", JSON.stringify(payload));

    // Create pending log
    const { data: log } = await supabase
      .from("webhook_logs")
      .insert({
        webhook_type: "meta",
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
          platform: "meta",
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

    // Process campaigns
    for (const campaign of payload.campaigns) {
      // Upsert campaign
      const { data: campaignData, error: campaignError } = await supabase
        .from("platform_campaigns")
        .upsert(
          {
            account_id: account.id,
            campaign_external_id: campaign.campaign_id,
            name: campaign.name,
            status: campaign.status.toLowerCase(),
            objective: campaign.objective,
            daily_budget: campaign.daily_budget,
            lifetime_budget: campaign.lifetime_budget,
            start_date: campaign.start_date,
            end_date: campaign.end_date,
          },
          { onConflict: "account_id,campaign_external_id" }
        )
        .select("id")
        .single();

      if (campaignError) {
        console.error("Error upserting campaign:", campaignError);
        continue;
      }

      // Insert metrics if provided
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

    // Update log to success
    if (logId) {
      await supabase
        .from("webhook_logs")
        .update({ status: "success", records_processed: recordsProcessed })
        .eq("id", logId);
    }

    console.log(`Meta webhook processed ${recordsProcessed} campaigns`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${recordsProcessed} campaigns`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const error = err as Error;
    console.error("Meta webhook error:", error);

    // Update log to error
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
        webhook_type: "meta",
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
