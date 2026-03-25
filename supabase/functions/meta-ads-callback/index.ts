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
    const errorDescription = url.searchParams.get('error_description');

    console.log('Meta OAuth callback received');

    if (errorParam) {
      console.error('Meta OAuth error:', errorParam, errorDescription);
      return new Response(
        `<html><body><script>window.opener?.postMessage({type:'meta-auth-error',error:'${errorDescription || errorParam}'},'*');window.close();</script><p>Erro: ${errorDescription || errorParam}</p></body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (!code || !stateParam) {
      return new Response(
        '<html><body><script>window.opener?.postMessage({type:"meta-auth-error",error:"Parâmetros ausentes"},"*");window.close();</script><p>Parâmetros ausentes</p></body></html>',
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    let state: { user_id: string; redirect_url: string };
    try {
      state = JSON.parse(atob(stateParam));
    } catch {
      return new Response(
        '<html><body><script>window.opener?.postMessage({type:"meta-auth-error",error:"Estado inválido"},"*");window.close();</script><p>Estado inválido</p></body></html>',
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Read credentials from api_configurations table (fallback to env vars)
    const META_APP_ID = Deno.env.get('META_APP_ID') || await getConfig(adminClient, 'META_APP_ID');
    const META_APP_SECRET = Deno.env.get('META_APP_SECRET') || await getConfig(adminClient, 'META_APP_SECRET');

    if (!META_APP_ID || !META_APP_SECRET) {
      console.error('META_APP_ID or META_APP_SECRET not configured');
      return new Response(
        '<html><body><script>window.opener?.postMessage({type:"meta-auth-error",error:"Configuração do servidor incompleta. Insira META_APP_ID e META_APP_SECRET nas Credenciais."},"*");window.close();</script><p>Erro de configuração</p></body></html>',
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    const redirectUri = `${SUPABASE_URL}/functions/v1/meta-ads-callback`;

    // Exchange code for access token
    console.log('Exchanging code for token');
    const tokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', META_APP_ID);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('client_secret', META_APP_SECRET);
    tokenUrl.searchParams.set('code', code);

    const tokenResponse = await fetch(tokenUrl.toString());
    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Token exchange failed:', tokenData.error);
      return new Response(
        `<html><body><script>window.opener?.postMessage({type:'meta-auth-error',error:'${tokenData.error.message || 'Falha na autenticação'}'},'*');window.close();</script><p>Erro: ${tokenData.error.message}</p></body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    const accessToken = tokenData.access_token;
    const expiresIn = tokenData.expires_in || 5184000;

    // Exchange for long-lived token
    console.log('Exchanging for long-lived token');
    const longLivedUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
    longLivedUrl.searchParams.set('grant_type', 'fb_exchange_token');
    longLivedUrl.searchParams.set('client_id', META_APP_ID);
    longLivedUrl.searchParams.set('client_secret', META_APP_SECRET);
    longLivedUrl.searchParams.set('fb_exchange_token', accessToken);

    const longLivedResponse = await fetch(longLivedUrl.toString());
    const longLivedData = await longLivedResponse.json();

    const finalToken = longLivedData.access_token || accessToken;
    const finalExpiresIn = longLivedData.expires_in || expiresIn;

    // Get ad accounts
    console.log('Fetching ad accounts');
    const accountsResponse = await fetch(
      `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_status&access_token=${finalToken}`
    );
    const accountsData = await accountsResponse.json();

    if (accountsData.error || !accountsData.data?.length) {
      console.error('No ad accounts found:', accountsData.error);
      return new Response(
        '<html><body><script>window.opener?.postMessage({type:"meta-auth-error",error:"Nenhuma conta de anúncios encontrada"},"*");window.close();</script><p>Nenhuma conta de anúncios encontrada</p></body></html>',
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    const tokenExpiresAt = new Date(Date.now() + finalExpiresIn * 1000).toISOString();

    const savedAccounts = [];
    for (const account of accountsData.data) {
      const { data, error } = await adminClient
        .from('ads_integrations')
        .upsert({
          user_id: state.user_id,
          platform: 'meta',
          account_id: account.id,
          account_name: account.name,
          access_token: finalToken,
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
        console.log('Saved integration for account:', account.name);
      }
    }

    if (savedAccounts.length === 0) {
      return new Response(
        '<html><body><script>window.opener?.postMessage({type:"meta-auth-error",error:"Erro ao salvar integração"},"*");window.close();</script><p>Erro ao salvar</p></body></html>',
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }

    console.log(`Successfully saved ${savedAccounts.length} Meta ad account(s)`);

    const successHtml = `
      <html>
        <body>
          <script>
            window.opener?.postMessage({
              type: 'meta-auth-success',
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
    console.error('Error in meta-ads-callback:', error);
    return new Response(
      `<html><body><script>window.opener?.postMessage({type:'meta-auth-error',error:'Erro interno do servidor'},'*');window.close();</script><p>Erro interno</p></body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  }
});
