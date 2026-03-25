import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

interface BalanceData {
  accounts: Array<{
    platform: "meta" | "google" | "tiktok";
    account_id: string;
    account_name: string;
    balance: number;
    currency?: string;
    brand_name?: string;
  }>;
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
      .eq("webhook_type", "saldos")
      .single();

    if (!config?.is_active) {
      throw new Error("Webhook is not active");
    }

    if (webhookSecret !== config.secret_key) {
      throw new Error("Invalid webhook secret");
    }

    const payload: BalanceData = await req.json();
    console.log("Received balance update payload:", JSON.stringify(payload));

    const { data: log } = await supabase
      .from("webhook_logs")
      .insert({
        webhook_type: "saldos",
        status: "pending",
        payload,
      })
      .select("id")
      .single();
    
    logId = log?.id;

    let recordsProcessed = 0;

    for (const account of payload.accounts) {
      // Get or create brand if provided
      let brandId: string | null = null;
      if (account.brand_name) {
        const { data: existingBrand } = await supabase
          .from("marcas")
          .select("id")
          .eq("nome", account.brand_name)
          .single();

        if (existingBrand) {
          brandId = existingBrand.id;
        } else {
          const { data: newBrand } = await supabase
            .from("marcas")
            .insert({ nome: account.brand_name })
            .select("id")
            .single();
          brandId = newBrand?.id || null;
        }
      }

      // Upsert platform account with balance
      const { error } = await supabase
        .from("platform_accounts")
        .upsert(
          {
            platform: account.platform,
            account_id: account.account_id,
            account_name: account.account_name,
            balance: account.balance,
            currency: account.currency || "BRL",
            marca_id: brandId,
            last_sync_at: new Date().toISOString(),
          },
          { onConflict: "platform,account_id" }
        );

      if (error) {
        console.error("Error upserting account balance:", error);
        continue;
      }

      recordsProcessed++;
    }

    if (logId) {
      await supabase
        .from("webhook_logs")
        .update({ status: "success", records_processed: recordsProcessed })
        .eq("id", logId);
    }

    console.log(`Saldos webhook processed ${recordsProcessed} accounts`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${recordsProcessed} account balances`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const error = err as Error;
    console.error("Saldos webhook error:", error);

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
        webhook_type: "saldos",
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
