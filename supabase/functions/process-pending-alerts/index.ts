import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

// Check if current time is within allowed schedule
function isWithinSchedule(
  allowedDays: number[],
  startTime: string,
  endTime: string,
  timezone: string
): boolean {
  const now = new Date();
  
  // Convert to Brazil timezone
  const brazilTime = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
  const currentDay = brazilTime.getDay();
  const currentHour = brazilTime.getHours();
  const currentMinute = brazilTime.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMinute;

  // Check if current day is allowed
  if (!allowedDays.includes(currentDay)) {
    return false;
  }

  // Parse start and end times
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  const startTimeMinutes = startHour * 60 + startMinute;
  const endTimeMinutes = endHour * 60 + endMinute;

  // Check if current time is within range
  return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes;
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

  try {
    // Check schedule settings
    const { data: scheduleSettings } = await supabase
      .from("alert_schedule_settings")
      .select("*")
      .limit(1)
      .single();

    // If schedule is active, check if we're within the allowed window
    if (scheduleSettings?.is_active) {
      const withinSchedule = isWithinSchedule(
        scheduleSettings.allowed_days || [1, 2, 3, 4, 5],
        scheduleSettings.start_time || "09:00:00",
        scheduleSettings.end_time || "18:00:00",
        scheduleSettings.timezone || "America/Sao_Paulo"
      );

      if (!withinSchedule) {
        console.log("Outside of allowed schedule window");
        return new Response(
          JSON.stringify({
            success: true,
            message: "Outside of allowed schedule window. Alerts will be sent later.",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get pending alerts
    const { data: pendingAlerts, error: alertsError } = await supabase
      .from("pending_alerts")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (alertsError) throw alertsError;

    if (!pendingAlerts || pendingAlerts.length === 0) {
      console.log("No pending alerts to process");
      return new Response(
        JSON.stringify({ success: true, message: "No pending alerts" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all active contacts
    const { data: contacts } = await supabase
      .from("alert_contacts")
      .select("*")
      .eq("is_active", true);

    if (!contacts || contacts.length === 0) {
      console.log("No active contacts found");
      return new Response(
        JSON.stringify({ success: true, message: "No active contacts" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let sentCount = 0;

    // Process each pending alert
    for (const alert of pendingAlerts) {
      let sent = false;

      for (const contact of contacts) {
        // Send WhatsApp
        if (hasWhatsApp && contact.whatsapp && alert.message_whatsapp) {
          const whatsappSent = await sendWhatsApp(
            contact.whatsapp,
            alert.message_whatsapp,
            zapiInstanceId!,
            zapiToken!,
            zapiClientToken!
          );

          if (whatsappSent) {
            sent = true;
            await supabase.from("alert_logs").insert({
              alert_type: alert.alert_type,
              channel: "whatsapp",
              contact_id: contact.id,
              account_id: alert.account_id,
              message: alert.message_whatsapp,
              status: "sent",
            });
          }
        }

        // Send Email
        if (hasEmail && contact.email && alert.message_email_subject && alert.message_email_html) {
          const emailSent = await sendEmail(
            contact.email,
            alert.message_email_subject,
            alert.message_email_html,
            resend!
          );

          if (emailSent) {
            sent = true;
            await supabase.from("alert_logs").insert({
              alert_type: alert.alert_type,
              channel: "email",
              contact_id: contact.id,
              account_id: alert.account_id,
              message: alert.message_email_subject,
              status: "sent",
            });
          }
        }
      }

      // Update alert status
      if (sent) {
        await supabase
          .from("pending_alerts")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", alert.id);
        sentCount++;
      }
    }

    console.log(`Processed ${sentCount} pending alerts`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${sentCount} pending alerts`,
        total: pendingAlerts.length,
        sent: sentCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const error = err as Error;
    console.error("Process pending alerts error:", error);

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
