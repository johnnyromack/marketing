import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AccountWithSpending {
  id: string;
  platform: string;
  account_id: string;
  account_name: string;
  balance: number | null;
  marca_id: string | null;
  previous_balance?: number | null;
}

interface AlertContact {
  id: string;
  name: string;
  email: string | null;
  whatsapp: string | null;
  is_active: boolean;
}

interface AlertSetting {
  id: string;
  marca_id: string | null;
  contact_id: string | null;
  alert_critical_balance: boolean;
  alert_low_balance: boolean;
  alert_new_deposit: boolean;
  alert_projection: boolean;
  critical_balance_threshold: number;
  low_balance_threshold: number;
  projection_days: number;
}

interface ScheduleSettings {
  is_active: boolean;
  allowed_days: number[];
  start_time: string;
  end_time: string;
  timezone: string;
}

// Check if current time is within allowed schedule
function isWithinSchedule(settings: ScheduleSettings): boolean {
  const now = new Date();
  
  // Convert to Brazil timezone
  const brazilTime = new Date(now.toLocaleString("en-US", { timeZone: settings.timezone }));
  const currentDay = brazilTime.getDay();
  const currentHour = brazilTime.getHours();
  const currentMinute = brazilTime.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMinute;

  // Check if current day is allowed
  if (!settings.allowed_days.includes(currentDay)) {
    return false;
  }

  // Parse start and end times
  const [startHour, startMinute] = settings.start_time.split(":").map(Number);
  const [endHour, endMinute] = settings.end_time.split(":").map(Number);
  const startTimeMinutes = startHour * 60 + startMinute;
  const endTimeMinutes = endHour * 60 + endMinute;

  // Check if current time is within range
  return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes;
}

// Send WhatsApp message via Z-API
async function sendWhatsApp(
  phone: string,
  message: string,
  instanceId: string,
  token: string,
  clientToken: string
): Promise<boolean> {
  try {
    let formattedPhone = phone.replace(/\D/g, "");
    if (!formattedPhone.startsWith("55")) {
      formattedPhone = "55" + formattedPhone;
    }

    const zapiUrl = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`;

    const response = await fetch(zapiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Token": clientToken,
      },
      body: JSON.stringify({
        phone: formattedPhone,
        message: message,
      }),
    });

    const result = await response.json();
    console.log("Z-API response:", JSON.stringify(result));
    return response.ok;
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return false;
  }
}

// Send email via Resend
async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string,
  resend: Resend
): Promise<boolean> {
  try {
    const result = await resend.emails.send({
      from: "Alertas <alertas@lovable.app>",
      to: [to],
      subject: subject,
      html: htmlContent,
    });
    console.log("Email sent:", result);
    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Z-API credentials
  const zapiInstanceId = Deno.env.get("ZAPI_INSTANCE_ID");
  const zapiToken = Deno.env.get("ZAPI_TOKEN");
  const zapiClientToken = Deno.env.get("ZAPI_CLIENT_TOKEN");
  const hasWhatsApp = !!(zapiInstanceId && zapiToken && zapiClientToken);

  // Resend for email
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const resend = resendApiKey ? new Resend(resendApiKey) : null;
  const hasEmail = !!resend;

  console.log(`Alert channels available - WhatsApp: ${hasWhatsApp}, Email: ${hasEmail}`);

  try {
    // Get schedule settings
    const { data: scheduleData } = await supabase
      .from("alert_schedule_settings")
      .select("*")
      .limit(1)
      .single();

    const scheduleSettings: ScheduleSettings | null = scheduleData ? {
      is_active: scheduleData.is_active ?? false,
      allowed_days: scheduleData.allowed_days ?? [1, 2, 3, 4, 5],
      start_time: scheduleData.start_time ?? "09:00:00",
      end_time: scheduleData.end_time ?? "18:00:00",
      timezone: scheduleData.timezone ?? "America/Sao_Paulo",
    } : null;

    // Check if within schedule (only for WhatsApp)
    const withinSchedule = !scheduleSettings?.is_active || isWithinSchedule(scheduleSettings);
    console.log(`Schedule check - Active: ${scheduleSettings?.is_active}, Within: ${withinSchedule}`);

    // Get all active alert contacts
    const { data: contacts, error: contactsError } = await supabase
      .from("alert_contacts")
      .select("*")
      .eq("is_active", true);

    if (contactsError) throw contactsError;

    if (!contacts || contacts.length === 0) {
      console.log("No active alert contacts found");
      return new Response(
        JSON.stringify({ success: true, message: "No active contacts to alert" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get alert settings
    const { data: alertSettings, error: settingsError } = await supabase
      .from("alert_settings")
      .select("*");

    if (settingsError) throw settingsError;

    // Get all platform accounts with their spending data
    const { data: accounts, error: accountsError } = await supabase
      .from("platform_accounts")
      .select("*");

    if (accountsError) throw accountsError;

    if (!accounts || accounts.length === 0) {
      console.log("No platform accounts found");
      return new Response(
        JSON.stringify({ success: true, message: "No accounts to check" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get last 7 days of spending to calculate daily average
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateString = sevenDaysAgo.toISOString().split("T")[0];

    const { data: metricsData } = await supabase
      .from("platform_campaign_metrics")
      .select(`
        spend,
        platform_campaigns (
          account_id
        )
      `)
      .gte("date", dateString);

    // Calculate daily spending per account
    const spendingByAccount: Record<string, number> = {};
    (metricsData || []).forEach((metric: any) => {
      const accountId = metric.platform_campaigns?.account_id;
      if (accountId) {
        spendingByAccount[accountId] = (spendingByAccount[accountId] || 0) + (metric.spend || 0);
      }
    });
    // Convert to daily average
    Object.keys(spendingByAccount).forEach((key) => {
      spendingByAccount[key] = spendingByAccount[key] / 7;
    });

    // Get recent alerts to avoid duplicates (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const { data: recentAlerts } = await supabase
      .from("alert_logs")
      .select("account_id, alert_type")
      .gte("sent_at", oneDayAgo.toISOString());

    const recentAlertKeys = new Set(
      (recentAlerts || []).map((a) => `${a.account_id}-${a.alert_type}`)
    );

    let alertsSent = 0;
    const alertResults: Array<{ account: string; type: string; channels: string[] }> = [];

    // Check each account
    for (const account of accounts) {
      const balance = account.balance || 0;
      const dailySpend = spendingByAccount[account.id] || 0;
      const daysRemaining = dailySpend > 0 ? balance / dailySpend : 999;

      // Get applicable alert settings for this account's brand
      const applicableSettings = (alertSettings || []).filter(
        (s: AlertSetting) => !s.marca_id || s.marca_id === account.marca_id
      );

      // Default thresholds if no settings
      const defaultSettings: AlertSetting = {
        id: "default",
        marca_id: null,
        contact_id: null,
        alert_critical_balance: true,
        alert_low_balance: true,
        alert_new_deposit: true,
        alert_projection: true,
        critical_balance_threshold: 3, // days
        low_balance_threshold: 7, // days
        projection_days: 7,
      };

      const settings = applicableSettings.length > 0 ? applicableSettings[0] : defaultSettings;

      // Determine alert type
      let alertType: "critical" | "warning" | "deposit" | null = null;
      let alertMessage = "";
      let emailSubject = "";
      let emailHtml = "";

      // Check for critical balance (< 3 days)
      if (settings.alert_critical_balance && daysRemaining <= (settings.critical_balance_threshold || 3)) {
        alertType = "critical";
        alertMessage = `🔴 *ALERTA CRÍTICO*\n\n` +
          `Conta: *${account.account_name}*\n` +
          `Plataforma: ${account.platform.toUpperCase()}\n` +
          `Saldo: ${formatCurrency(balance)}\n` +
          `Gasto diário: ${formatCurrency(dailySpend)}\n` +
          `⚠️ *Restam apenas ${Math.round(daysRemaining)} dias de crédito!*\n\n` +
          `Adicione saldo urgentemente para evitar a parada das campanhas.`;
        
        emailSubject = `🔴 ALERTA CRÍTICO: ${account.account_name} com saldo baixo`;
        emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #DC2626; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">🔴 Alerta Crítico de Saldo</h1>
            </div>
            <div style="background: #FEE2E2; padding: 20px; border-radius: 0 0 8px 8px;">
              <p><strong>Conta:</strong> ${account.account_name}</p>
              <p><strong>Plataforma:</strong> ${account.platform.toUpperCase()}</p>
              <p><strong>Saldo atual:</strong> ${formatCurrency(balance)}</p>
              <p><strong>Gasto diário médio:</strong> ${formatCurrency(dailySpend)}</p>
              <p style="color: #DC2626; font-weight: bold;">⚠️ Restam apenas ${Math.round(daysRemaining)} dias de crédito!</p>
              <p>Adicione saldo urgentemente para evitar a parada das campanhas.</p>
            </div>
          </div>
        `;
      }
      // Check for warning (3-7 days)
      else if (settings.alert_low_balance && daysRemaining <= (settings.low_balance_threshold || 7) && daysRemaining > (settings.critical_balance_threshold || 3)) {
        alertType = "warning";
        alertMessage = `🟡 *ALERTA DE ATENÇÃO*\n\n` +
          `Conta: *${account.account_name}*\n` +
          `Plataforma: ${account.platform.toUpperCase()}\n` +
          `Saldo: ${formatCurrency(balance)}\n` +
          `Gasto diário: ${formatCurrency(dailySpend)}\n` +
          `⚠️ *Restam aproximadamente ${Math.round(daysRemaining)} dias de crédito.*\n\n` +
          `Considere adicionar saldo nos próximos dias.`;
        
        emailSubject = `🟡 Atenção: ${account.account_name} - Saldo em alerta`;
        emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #F59E0B; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">🟡 Alerta de Atenção</h1>
            </div>
            <div style="background: #FEF3C7; padding: 20px; border-radius: 0 0 8px 8px;">
              <p><strong>Conta:</strong> ${account.account_name}</p>
              <p><strong>Plataforma:</strong> ${account.platform.toUpperCase()}</p>
              <p><strong>Saldo atual:</strong> ${formatCurrency(balance)}</p>
              <p><strong>Gasto diário médio:</strong> ${formatCurrency(dailySpend)}</p>
              <p style="color: #B45309; font-weight: bold;">Restam aproximadamente ${Math.round(daysRemaining)} dias de crédito.</p>
              <p>Considere adicionar saldo nos próximos dias.</p>
            </div>
          </div>
        `;
      }

      // Skip if no alert needed or already sent recently
      if (!alertType) continue;
      
      const alertKey = `${account.id}-${alertType}`;
      if (recentAlertKeys.has(alertKey)) {
        console.log(`Skipping duplicate alert: ${alertKey}`);
        continue;
      }

      // Check if outside schedule - queue for later (WhatsApp only)
      if (scheduleSettings?.is_active && !withinSchedule) {
        console.log(`Outside schedule window, queuing alert for: ${account.account_name}`);
        
        // Queue the alert for later
        await supabase.from("pending_alerts").insert({
          alert_type: alertType,
          account_id: account.id,
          message_whatsapp: alertMessage,
          message_email_subject: emailSubject,
          message_email_html: emailHtml,
          status: "pending",
        });

        alertResults.push({
          account: account.account_name,
          type: alertType,
          channels: ["queued"],
        });
        continue;
      }

      // Send alerts to all active contacts
      const channelsSent: string[] = [];
      
      for (const contact of contacts as AlertContact[]) {
        // Send WhatsApp
        if (hasWhatsApp && contact.whatsapp) {
          const sent = await sendWhatsApp(
            contact.whatsapp,
            alertMessage,
            zapiInstanceId!,
            zapiToken!,
            zapiClientToken!
          );
          if (sent) {
            channelsSent.push("whatsapp");
            await supabase.from("alert_logs").insert({
              alert_type: alertType,
              channel: "whatsapp",
              contact_id: contact.id,
              account_id: account.id,
              message: alertMessage,
              status: "sent",
            });
          }
        }

        // Send Email (emails are always sent immediately)
        if (hasEmail && contact.email) {
          const sent = await sendEmail(contact.email, emailSubject, emailHtml, resend!);
          if (sent) {
            channelsSent.push("email");
            await supabase.from("alert_logs").insert({
              alert_type: alertType,
              channel: "email",
              contact_id: contact.id,
              account_id: account.id,
              message: emailSubject,
              status: "sent",
            });
          }
        }
      }

      if (channelsSent.length > 0) {
        alertsSent++;
        alertResults.push({
          account: account.account_name,
          type: alertType,
          channels: [...new Set(channelsSent)],
        });
      }
    }

    console.log(`Alerts check complete. ${alertsSent} alerts sent.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Checked ${accounts.length} accounts, sent ${alertsSent} alerts`,
        alerts: alertResults,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const error = err as Error;
    console.error("Alert check error:", error);

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
