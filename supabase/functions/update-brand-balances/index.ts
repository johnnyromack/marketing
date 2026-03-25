import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    console.log(`Processing balance updates for date: ${yesterdayStr}`);

    // Get all brands with their accounts and yesterday's spending
    const { data: brands, error: brandsError } = await supabase
      .from("marcas")
      .select(
        `
        id,
        nome,
        manual_balance,
        platform_accounts (
          id,
          account_id
        )
      `
      )
      .eq("is_active", true);

    if (brandsError) {
      console.error("Error fetching brands:", brandsError);
      throw brandsError;
    }

    let totalUpdated = 0;

    // For each brand, calculate yesterday's spending
    for (const brand of brands || []) {
      // Get all accounts for this brand
      const accountIds = (brand.platform_accounts || []).map(
        (a: any) => a.id
      );

      if (accountIds.length === 0) continue;

      // Get yesterday's spending for all campaigns in this brand's accounts
      const { data: metricsData, error: metricsError } = await supabase
        .from("platform_campaign_metrics")
        .select(
          `
          spend,
          platform_campaigns (
            account_id
          )
        `
        )
        .eq("date", yesterdayStr)
        .in(
          "platform_campaigns.account_id",
          accountIds
        );

      if (metricsError) {
        console.error(
          `Error fetching metrics for brand ${brand.id}:`,
          metricsError
        );
        continue;
      }

      // Sum yesterday's spending
      const yesterdaySpend = (metricsData || []).reduce(
        (sum: number, m: any) => sum + (m.spend || 0),
        0
      );

      if (yesterdaySpend > 0) {
        // Calculate new balance
        const currentBalance = brand.manual_balance || 0;
        const newBalance = Math.max(0, currentBalance - yesterdaySpend);

        // Update brand balance
        const { error: updateError } = await supabase
          .from("marcas")
          .update({
            manual_balance: newBalance,
            last_balance_update: new Date().toISOString(),
          })
          .eq("id", brand.id);

        if (updateError) {
          console.error(
            `Error updating balance for brand ${brand.nome}:`,
            updateError
          );
          continue;
        }

        console.log(
          `Updated ${brand.nome}: ${currentBalance} -> ${newBalance} (spent ${yesterdaySpend})`
        );
        totalUpdated++;
      }
    }

    console.log(`Successfully updated ${totalUpdated} brands`);

    return new Response(
      JSON.stringify({
        success: true,
        brandsProcessed: totalUpdated,
        date: yesterdayStr,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in update-brand-balances:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
