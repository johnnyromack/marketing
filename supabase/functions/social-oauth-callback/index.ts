/**
 * social-oauth-callback Edge Function
 *
 * Handles OAuth2 callback for social media platforms (LinkedIn, Twitter/X, TikTok, YouTube).
 * Exchanges authorization code for access token and stores in ads_integrations table.
 *
 * Platform-specific callback endpoints route here with ?platform=<name>
 * Frontend initiates OAuth via /social/connectors page.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}

async function exchangeLinkedInCode(code: string, redirectUri: string, clientId: string, clientSecret: string): Promise<TokenResponse> {
  const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LinkedIn token error: ${err}`);
  }

  return res.json();
}

async function exchangeTwitterCode(code: string, redirectUri: string, clientId: string, clientSecret: string, codeVerifier: string): Promise<TokenResponse> {
  const credentials = btoa(`${clientId}:${clientSecret}`);
  const res = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Twitter token error: ${err}`);
  }

  return res.json();
}

async function exchangeYouTubeCode(code: string, redirectUri: string, clientId: string, clientSecret: string): Promise<TokenResponse> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`YouTube token error: ${err}`);
  }

  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const url = new URL(req.url);
    const platform = url.searchParams.get('platform');
    const code = url.searchParams.get('code');
    const stateParam = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      const frontendUrl = `${url.origin}/social/connectors?error=${encodeURIComponent(error)}`;
      return Response.redirect(frontendUrl, 302);
    }

    if (!platform || !code || !stateParam) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: platform, code, state' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decode state to get user_id and redirect_url
    let state: { user_id: string; redirect_url: string; code_verifier?: string };
    try {
      state = JSON.parse(atob(stateParam));
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid state parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { user_id: userId, redirect_url: redirectUrl, code_verifier: codeVerifier } = state;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const redirectUri = `${SUPABASE_URL}/functions/v1/social-oauth-callback?platform=${platform}`;

    let tokenData: TokenResponse;
    let accountName = platform;

    switch (platform) {
      case 'linkedin': {
        const clientId = Deno.env.get('LINKEDIN_CLIENT_ID') || '';
        const clientSecret = Deno.env.get('LINKEDIN_CLIENT_SECRET') || '';
        if (!clientId || !clientSecret) throw new Error('LinkedIn credentials not configured');
        tokenData = await exchangeLinkedInCode(code, redirectUri, clientId, clientSecret);

        // Fetch profile name
        try {
          const profileRes = await fetch('https://api.linkedin.com/v2/me?projection=(localizedFirstName,localizedLastName)', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });
          if (profileRes.ok) {
            const profile = await profileRes.json();
            accountName = `${profile.localizedFirstName} ${profile.localizedLastName}`.trim();
          }
        } catch { /* skip */ }
        break;
      }

      case 'twitter': {
        const clientId = Deno.env.get('TWITTER_CLIENT_ID') || '';
        const clientSecret = Deno.env.get('TWITTER_CLIENT_SECRET') || '';
        if (!clientId || !clientSecret) throw new Error('Twitter credentials not configured');
        if (!codeVerifier) throw new Error('Missing code_verifier for Twitter OAuth');
        tokenData = await exchangeTwitterCode(code, redirectUri, clientId, clientSecret, codeVerifier);

        // Fetch user info
        try {
          const userRes = await fetch('https://api.twitter.com/2/users/me', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });
          if (userRes.ok) {
            const userData = await userRes.json();
            accountName = userData.data?.name || 'Twitter';
          }
        } catch { /* skip */ }
        break;
      }

      case 'youtube': {
        const clientId = Deno.env.get('GOOGLE_CLIENT_ID') || Deno.env.get('YOUTUBE_CLIENT_ID') || '';
        const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET') || Deno.env.get('YOUTUBE_CLIENT_SECRET') || '';
        if (!clientId || !clientSecret) throw new Error('YouTube/Google credentials not configured');
        tokenData = await exchangeYouTubeCode(code, redirectUri, clientId, clientSecret);

        // Fetch channel name
        try {
          const channelRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });
          if (channelRes.ok) {
            const channelData = await channelRes.json();
            accountName = channelData.items?.[0]?.snippet?.title || 'YouTube';
          }
        } catch { /* skip */ }
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unsupported platform: ${platform}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Calculate token expiry
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null;

    // Upsert into ads_integrations
    const { error: upsertError } = await supabase
      .from('ads_integrations')
      .upsert(
        {
          user_id: userId,
          platform,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || null,
          token_expires_at: expiresAt,
          account_name: accountName,
          status: 'active',
          last_sync_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,platform' }
      );

    if (upsertError) {
      throw new Error(`Failed to store integration: ${upsertError.message}`);
    }

    // Redirect back to frontend
    const frontendRedirect = redirectUrl || '/social/connectors';
    const successUrl = `${frontendRedirect}?connected=${platform}`;

    return Response.redirect(successUrl, 302);

  } catch (error) {
    console.error('Error in social-oauth-callback:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
