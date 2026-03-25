import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getConfig(supabase: ReturnType<typeof createClient>, key: string): Promise<string | null> {
  const { data } = await supabase
    .from('api_configurations')
    .select('config_value')
    .eq('config_key', key)
    .single();
  return data?.config_value || null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Validate JWT and get user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseUser.auth.getUser(token);

    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = userData.user.id;

    // Read credentials from api_configurations table
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const META_APP_ID = Deno.env.get('META_APP_ID') || await getConfig(adminClient, 'META_APP_ID');

    if (!META_APP_ID) {
      return new Response(
        JSON.stringify({ error: 'Meta App ID não configurado. Acesse Configurações > Credenciais e insira o META_APP_ID.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const frontendRedirectUrl = body.redirect_url || `${req.headers.get('origin')}/integracoes`;

    const redirectUri = `${SUPABASE_URL}/functions/v1/meta-ads-callback`;
    const state = JSON.stringify({ user_id: userId, redirect_url: frontendRedirectUrl });
    const encodedState = btoa(state);

    const scopes = [
      'ads_read', 'ads_management', 'business_management', 'public_profile',
      'instagram_basic', 'instagram_manage_insights',
      'pages_show_list', 'pages_read_engagement',
    ].join(',');

    const authUrl = new URL('https://www.facebook.com/v19.0/dialog/oauth');
    authUrl.searchParams.set('client_id', META_APP_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', encodedState);
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('response_type', 'code');

    console.log('Generated Meta OAuth URL for user:', userId);

    return new Response(
      JSON.stringify({ auth_url: authUrl.toString() }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in meta-ads-auth:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
