import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

async function getConfig(supabase: ReturnType<typeof createClient>, key: string): Promise<string | null> {
  const { data } = await supabase
    .from('api_configurations')
    .select('config_value')
    .eq('config_key', key)
    .single();
  return data?.config_value || null;
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const stateParam = url.searchParams.get('state');
    const errorParam = url.searchParams.get('error');

    console.log('Google OAuth callback received');

    if (errorParam) {
      console.error('Google OAuth error:', errorParam);
      return new Response(
        `<html><body><script>window.opener?.postMessage({type:'google-auth-error',error:'${errorParam}'},'*');window.close();</script><p>Erro: ${errorParam}</p></body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (!code || !stateParam) {
      return new Response(
        '<html><body><script>window.opener?.postMessage({type:"google-auth-error",error:"Parâmetros ausentes"},"*");window.close();</script><p>Parâmetros ausentes</p></body></html>',
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    let state: { user_id: string; redirect_url: string };
    try {
      state = JSON.parse(atob(stateParam));
    } catch {
      return new Response(
        '<html><body><script>window.opener?.postMessage({type:"google-auth-error",error:"Estado inválido"},"*");window.close();</script><p>Estado inválido</p></body></html>',
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Read credentials from api_configurations table (fallback to env vars)
    const GOOGLE_ADS_CLIENT_ID = Deno.env.get('GOOGLE_ADS_CLIENT_ID') || await getConfig(adminClient, 'GOOGLE_ADS_CLIENT_ID');
    const GOOGLE_ADS_CLIENT_SECRET = Deno.env.get('GOOGLE_ADS_CLIENT_SECRET') || await getConfig(adminClient, 'GOOGLE_ADS_CLIENT_SECRET');
    const GOOGLE_ADS_DEVELOPER_TOKEN = Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN') || await getConfig(adminClient, 'GOOGLE_ADS_DEVELOPER_TOKEN');

    if (!GOOGLE_ADS_CLIENT_ID || !GOOGLE_ADS_CLIENT_SECRET) {
      console.error('Google credentials not configured');
      return new Response(
        '<html><body><script>window.opener?.postMessage({type:"google-auth-error",error:"Configuração do servidor incompleta. Insira as credenciais do Google Ads nas Configurações."},"*");window.close();</script><p>Erro de configuração</p></body></html>',
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    const redirectUri = `${SUPABASE_URL}/functions/v1/google-ads-callback`;

    // Exchange code for tokens
    console.log('Exchanging code for tokens');
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_ADS_CLIENT_ID,
        client_secret: GOOGLE_ADS_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Token exchange failed:', tokenData.error);
      return new Response(
        `<html><body><script>window.opener?.postMessage({type:'google-auth-error',error:'${tokenData.error_description || tokenData.error}'},'*');window.close();</script><p>Erro: ${tokenData.error_description || tokenData.error}</p></body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in || 3600;

    // Get Google Ads customer accounts
    console.log('Fetching Google Ads accounts');

    if (!GOOGLE_ADS_DEVELOPER_TOKEN) {
      console.error('GOOGLE_ADS_DEVELOPER_TOKEN not configured');
      return new Response(
        '<html><body><script>window.opener?.postMessage({type:"google-auth-error",error:"Developer Token do Google Ads não configurado. Insira o GOOGLE_ADS_DEVELOPER_TOKEN nas Credenciais."},"*");window.close();</script><p>Developer Token não configurado</p></body></html>',
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    const adsResponse = await fetch(
      'https://googleads.googleapis.com/v20/customers:listAccessibleCustomers',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': GOOGLE_ADS_DEVELOPER_TOKEN,
        },
      }
    );

    if (!adsResponse.ok) {
      const errorText = await adsResponse.text();
      console.error('Google Ads API error:', adsResponse.status, errorText);

      let errorMessage = 'Erro ao acessar Google Ads API';
      if (adsResponse.status === 401) errorMessage = 'Token de acesso inválido ou expirado';
      else if (adsResponse.status === 403) errorMessage = 'Sem permissão para acessar Google Ads. Verifique se o Developer Token está aprovado.';
      else if (adsResponse.status === 501) errorMessage = 'Developer Token ainda não aprovado. Solicite aprovação no Google Ads ou adicione a conta como conta de teste.';

      return new Response(
        `<html><body><script>window.opener?.postMessage({type:'google-auth-error',error:'${errorMessage}'},'*');window.close();</script><p>${errorMessage}</p></body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    const adsData = await adsResponse.json();
    console.log('Google Ads API response:', JSON.stringify(adsData));

    if (adsData.error || !adsData.resourceNames?.length) {
      console.error('No Google Ads accounts found:', adsData.error);
      return new Response(
        '<html><body><script>window.opener?.postMessage({type:"google-auth-error",error:"Nenhuma conta do Google Ads encontrada"},"*");window.close();</script><p>Nenhuma conta encontrada</p></body></html>',
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    const savedAccounts = [];
    for (const resourceName of adsData.resourceNames) {
      const customerId = resourceName.split('/')[1];

      let accountName = `Conta ${customerId}`;
      try {
        const customerResponse = await fetch(
          `https://googleads.googleapis.com/v20/${resourceName}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'developer-token': GOOGLE_ADS_DEVELOPER_TOKEN,
              'login-customer-id': customerId,
            },
          }
        );
        const customerData = await customerResponse.json();
        if (customerData.descriptiveName) accountName = customerData.descriptiveName;
      } catch {
        console.log('Could not fetch account name, using default');
      }

      const { data, error } = await adminClient
        .from('ads_integrations')
        .upsert({
          user_id: state.user_id,
          platform: 'google',
          account_id: customerId,
          account_name: accountName,
          access_token: accessToken,
          refresh_token: refreshToken,
          token_expires_at: tokenExpiresAt,
          status: 'active',
          last_sync_at: null,
        }, { onConflict: 'user_id,platform,account_id' })
        .select()
        .single();

      if (error) {
        console.error('Error saving integration:', error);
      } else {
        savedAccounts.push(data);
        console.log('Saved integration for account:', accountName);
      }
    }

    if (savedAccounts.length === 0) {
      return new Response(
        '<html><body><script>window.opener?.postMessage({type:"google-auth-error",error:"Erro ao salvar integração"},"*");window.close();</script><p>Erro ao salvar</p></body></html>',
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    console.log(`Successfully saved ${savedAccounts.length} Google Ads account(s)`);

    const successHtml = `
      <html>
        <body>
          <script>
            window.opener?.postMessage({
              type: 'google-auth-success',
              accounts: ${JSON.stringify(savedAccounts.map(a => ({ id: a.id, name: a.account_name })))}
            }, '*');
            window.close();
          </script>
          <p>Conectado com sucesso! Esta janela será fechada automaticamente.</p>
        </body>
      </html>
    `;

    return new Response(successHtml, { status: 200, headers: { 'Content-Type': 'text/html' } });
  } catch (error) {
    console.error('Error in google-ads-callback:', error);
    return new Response(
      `<html><body><script>window.opener?.postMessage({type:'google-auth-error',error:'Erro interno do servidor'},'*');window.close();</script><p>Erro interno</p></body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  }
});
