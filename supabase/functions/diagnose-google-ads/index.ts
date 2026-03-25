import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get("GOOGLE_ADS_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_ADS_CLIENT_SECRET");
  const refreshToken = Deno.env.get("GOOGLE_ADS_REFRESH_TOKEN");

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing Google OAuth credentials");
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
    throw new Error(`Failed to get access token: ${data.error_description || data.error}`);
  }

  return data.access_token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const results: any[] = [];

  try {
    // Step 1: Check environment variables
    console.log("\n=== Step 1: Checking Environment Variables ===");
    const clientId = Deno.env.get("GOOGLE_ADS_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_ADS_CLIENT_SECRET");
    const refreshToken = Deno.env.get("GOOGLE_ADS_REFRESH_TOKEN");
    const developerToken = Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN");
    const customerId = Deno.env.get("GOOGLE_ADS_CUSTOMER_ID");

    const envDetails = {
      GOOGLE_ADS_CLIENT_ID: clientId ? `Set (${clientId.substring(0, 30)}...)` : "NOT SET",
      GOOGLE_ADS_CLIENT_SECRET: clientSecret ? "Set" : "NOT SET",
      GOOGLE_ADS_REFRESH_TOKEN: refreshToken ? `Set (${refreshToken.substring(0, 30)}...)` : "NOT SET",
      GOOGLE_ADS_DEVELOPER_TOKEN: developerToken ? `Set (${developerToken.substring(0, 10)}...)` : "NOT SET",
      GOOGLE_ADS_CUSTOMER_ID: customerId || "NOT SET",
    };

    console.log("Environment variables:", envDetails);

    if (!clientId || !clientSecret || !refreshToken || !developerToken || !customerId) {
      results.push({
        step: "1. Environment Variables",
        status: "error",
        message: "Missing required environment variables",
        details: envDetails,
      });
      throw new Error("Missing environment variables");
    }

    results.push({
      step: "1. Environment Variables",
      status: "success",
      message: "All required environment variables are set",
      details: envDetails,
    });

    // Step 2: Test OAuth Token Refresh
    console.log("\n=== Step 2: Testing OAuth Token Refresh ===");
    const accessToken = await getAccessToken();
    console.log("OAuth response: token obtained");

    results.push({
      step: "2. OAuth Token Refresh",
      status: "success",
      message: "Successfully obtained access token",
      details: {
        token_preview: `${accessToken.substring(0, 20)}...`,
      },
    });

    // Step 3: Validate token info
    console.log("\n=== Step 3: Testing OAuth Token Validation ===");
    const tokenInfoResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`);
    const tokenInfo = await tokenInfoResponse.json();
    console.log("Token info:", JSON.stringify(tokenInfo, null, 2));

    if (tokenInfo.error) {
      results.push({
        step: "3. Token Validation",
        status: "error",
        message: `Token invalid: ${tokenInfo.error_description || tokenInfo.error}`,
        details: tokenInfo,
      });
      throw new Error("Invalid token");
    }

    results.push({
      step: "3. Token Validation",
      status: "success",
      message: "Access token is valid and has adwords scope",
      details: {
        scope: tokenInfo.scope,
        expires_in: tokenInfo.expires_in,
      },
    });

    // Step 4: Test listAccessibleCustomers (no customer ID needed for this call)
    console.log("\n=== Step 4: Testing listAccessibleCustomers ===");
    const apiVersion = "v20";
    const formattedMccId = customerId!.replace(/-/g, "");
    
    try {
      const listUrl = `https://googleads.googleapis.com/${apiVersion}/customers:listAccessibleCustomers`;
      console.log(`Testing: ${listUrl}`);
      console.log(`Developer Token (first 10 chars): ${developerToken?.substring(0, 10)}`);
      console.log(`Using login-customer-id: ${formattedMccId}`);
      
      // Try with login-customer-id header (required for manager accounts)
      const listResponse = await fetch(listUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "developer-token": developerToken!,
          "login-customer-id": formattedMccId,
          "Content-Type": "application/json",
        },
      });

      const listText = await listResponse.text();
      const listContentType = listResponse.headers.get("content-type");
      
      console.log(`Status: ${listResponse.status}`);
      console.log(`Content-Type: ${listContentType}`);
      console.log(`Response: ${listText.substring(0, 500)}`);
      console.log(`All response headers:`, Object.fromEntries(listResponse.headers.entries()));

      if (listResponse.ok && listContentType?.includes("application/json")) {
        const listData = JSON.parse(listText);
        results.push({
          step: "4. List Accessible Customers",
          status: "success",
          message: `Found ${listData.resourceNames?.length || 0} accessible customers`,
          details: {
            customers: listData.resourceNames,
          },
        });

        // Step 5: Test querying specific customer
        console.log("\n=== Step 5: Testing Customer Query ===");
        const formattedCustomerId = customerId.replace(/-/g, "");
        const customerUrl = `https://googleads.googleapis.com/${apiVersion}/customers/${formattedCustomerId}`;
        console.log(`Testing: ${customerUrl}`);

        // Try with and without login-customer-id header
        for (const useLoginHeader of [false, true]) {
          const headers: Record<string, string> = {
            "Authorization": `Bearer ${accessToken}`,
            "developer-token": developerToken,
            "Content-Type": "application/json",
          };
          
          if (useLoginHeader) {
            headers["login-customer-id"] = formattedCustomerId;
          }
          
          console.log(`With login-customer-id header: ${useLoginHeader}`);
          
          const customerResponse = await fetch(customerUrl, {
            method: "GET",
            headers,
          });

          const customerText = await customerResponse.text();
          console.log(`Status: ${customerResponse.status}`);
          console.log(`Response: ${customerText.substring(0, 300)}`);

          if (customerResponse.ok) {
            const customerData = JSON.parse(customerText);
            results.push({
              step: "5. Customer Query",
              status: "success",
              message: `Successfully retrieved customer info`,
              details: {
                customerId: formattedCustomerId,
                usedLoginHeader: useLoginHeader,
                customerData,
              },
            });
            break;
          } else if (!useLoginHeader) {
            continue; // Try with header
          } else {
            let errorDetails;
            try {
              errorDetails = JSON.parse(customerText);
            } catch {
              errorDetails = customerText.substring(0, 300);
            }
            results.push({
              step: "5. Customer Query",
              status: "error",
              message: `Failed to query customer ${formattedCustomerId}`,
              details: {
                status: customerResponse.status,
                error: errorDetails,
                suggestion: "Check if the Customer ID matches one from the accessible customers list",
              },
            });
          }
        }
      } else {
        let errorDetails;
        try {
          errorDetails = JSON.parse(listText);
        } catch {
          errorDetails = { rawResponse: listText.substring(0, 500) };
        }
        
        results.push({
          step: "4. List Accessible Customers",
          status: "error",
          message: `API returned ${listResponse.status}`,
          details: {
            status: listResponse.status,
            contentType: listContentType,
            isHtml: !listContentType?.includes("application/json"),
            error: errorDetails,
            possibleCauses: [
              "Developer Token may still be in 'Test Account' mode",
              "Basic Access approval may not have propagated yet (can take up to 24h)",
              "Google Ads API may not be enabled in Google Cloud Console",
            ],
          },
        });
      }
    } catch (err) {
      console.error("API test error:", err);
      results.push({
        step: "4. List Accessible Customers",
        status: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }

    return new Response(JSON.stringify({ results, summary: { total: results.length, errors: results.filter((r) => r.status === "error").length } }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Diagnostic error:", err);
    results.push({
      step: "General",
      status: "error",
      message: err instanceof Error ? err.message : String(err),
    });

    return new Response(JSON.stringify({ results, error: err instanceof Error ? err.message : String(err) }, null, 2), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
