/**
 * sync-social-insights Edge Function
 * Pulls Facebook Pages posts + Instagram media into social_media_mentions.
 * Always returns HTTP 200 — errors are collected in the response body.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const META_BASE = 'https://graph.facebook.com/v21.0';

async function metaGet(path: string, token: string, params: Record<string, string> = {}) {
  const url = new URL(`${META_BASE}${path}`);
  url.searchParams.set('access_token', token);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString());
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = json?.error?.message || json?.error?.type || `HTTP ${res.status}`;
    throw new Error(`Meta API [${path}]: ${msg}`);
  }
  // Meta sometimes returns HTTP 200 with an error body
  if (json?.error) {
    throw new Error(`Meta API [${path}]: ${json.error.message || json.error.type}`);
  }
  return json;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const ok = (body: unknown) =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  // ── 1. Parse body ────────────────────────────────────────────────────────
  const body = await req.json().catch(() => ({}));
  const targetUserId: string | null = body?.user_id ?? null;

  // ── 2. Load integrations ─────────────────────────────────────────────────
  let intQuery = supabase
    .from('ads_integrations')
    .select('id, user_id, platform, access_token, account_id, account_name')
    .in('platform', ['meta', 'facebook', 'instagram'])
    .not('access_token', 'is', null);

  if (targetUserId) intQuery = intQuery.eq('user_id', targetUserId);

  const { data: integrations, error: intError } = await intQuery;

  if (intError) {
    console.error('Failed to load integrations:', intError.message);
    return ok({ success: false, error: `DB error: ${intError.message}`, synced: 0 });
  }

  if (!integrations || integrations.length === 0) {
    return ok({ success: true, message: 'Nenhuma integração Meta ativa encontrada. Configure em Integrações.', synced: 0 });
  }

  console.log(`Processing ${integrations.length} Meta integration(s)`);

  let totalSynced = 0;
  const errors: string[] = [];

  // ── 3. Per-integration sync ──────────────────────────────────────────────
  for (const integration of integrations) {
    const { id: intId, user_id: userId, access_token: token } = integration;

    // 3a. Get Facebook Pages this token has access to
    let pages: Array<{ id: string; name: string; access_token: string }> = [];
    try {
      const pagesRes = await metaGet('/me/accounts', token, {
        fields: 'id,name,access_token',
        limit: '10',
      });
      pages = pagesRes?.data ?? [];
      console.log(`Integration ${intId}: ${pages.length} page(s) found`);
    } catch (e) {
      const msg = (e as Error).message;
      console.error(`Integration ${intId} /me/accounts failed:`, msg);
      errors.push(`[${intId}] pages: ${msg}`);
      continue; // skip to next integration
    }

    // 3b. For each page: posts + instagram
    for (const page of pages) {
      const pageToken = page.access_token || token;

      // Facebook posts
      try {
        const postsRes = await metaGet(`/${page.id}/posts`, pageToken, {
          fields: 'id,message,story,created_time,likes.summary(true),comments.summary(true),shares',
          limit: '25',
        });
        const posts = postsRes?.data ?? [];

        const rows = posts
          .map((p: Record<string, unknown>) => ({
            user_id: userId,
            platform: 'facebook',
            external_id: String(p.id),
            external_url: `https://facebook.com/${p.id}`,
            content: String((p.message ?? p.story) ?? ''),
            content_type: 'post',
            author: { id: page.id, username: page.name, display_name: page.name },
            sentiment: 'neutral',
            sentiment_score: 0,
            sentiment_confidence: 0,
            intent: 'neutral',
            topics: [],
            engagement: {
              likes: (p.likes as { summary?: { total_count?: number } })?.summary?.total_count ?? 0,
              comments: (p.comments as { summary?: { total_count?: number } })?.summary?.total_count ?? 0,
              shares: (p.shares as { count?: number })?.count ?? 0,
            },
            published_at: p.created_time as string,
            fetched_at: new Date().toISOString(),
          }))
          .filter((r: { content: string }) => r.content.length > 0);

        if (rows.length > 0) {
          const { error: uErr } = await supabase
            .from('social_media_mentions')
            .upsert(rows, { onConflict: 'user_id,platform,external_id', ignoreDuplicates: false });

          if (uErr) {
            errors.push(`[${page.name}] fb upsert: ${uErr.message}`);
          } else {
            totalSynced += rows.length;
            console.log(`Upserted ${rows.length} FB posts from page ${page.name}`);
          }
        }
      } catch (e) {
        errors.push(`[${page.name}] fb posts: ${(e as Error).message}`);
      }

      // Instagram Business Account
      try {
        const igPageRes = await metaGet(`/${page.id}`, pageToken, {
          fields: 'instagram_business_account',
        });
        const igId = igPageRes?.instagram_business_account?.id;
        if (!igId) continue;

        const igRes = await metaGet(`/${igId}/media`, pageToken, {
          fields: 'id,caption,media_type,timestamp,like_count,comments_count,permalink',
          limit: '25',
        });
        const igPosts = igRes?.data ?? [];

        const igRows = igPosts
          .map((p: Record<string, unknown>) => ({
            user_id: userId,
            platform: 'instagram',
            external_id: String(p.id),
            external_url: (p.permalink as string) ?? null,
            content: String((p.caption) ?? ''),
            content_type: 'post',
            author: { id: igId, username: page.name, display_name: page.name },
            sentiment: 'neutral',
            sentiment_score: 0,
            sentiment_confidence: 0,
            intent: 'neutral',
            topics: [],
            engagement: {
              likes: (p.like_count as number) ?? 0,
              comments: (p.comments_count as number) ?? 0,
              shares: 0,
            },
            published_at: p.timestamp as string,
            fetched_at: new Date().toISOString(),
          }))
          .filter((r: { content: string }) => r.content.length > 0);

        if (igRows.length > 0) {
          const { error: uErr } = await supabase
            .from('social_media_mentions')
            .upsert(igRows, { onConflict: 'user_id,platform,external_id', ignoreDuplicates: false });

          if (uErr) {
            errors.push(`[${page.name}] ig upsert: ${uErr.message}`);
          } else {
            totalSynced += igRows.length;
            console.log(`Upserted ${igRows.length} IG posts from ${page.name}`);
          }
        }
      } catch (e) {
        // Instagram not connected to this page — log and continue
        console.log(`[${page.name}] instagram skipped: ${(e as Error).message}`);
      }
    }

    // Update last_sync_at
    await supabase
      .from('ads_integrations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', intId);
  }

  return ok({
    success: true,
    synced: totalSynced,
    integrations_processed: integrations.length,
    ...(errors.length > 0 ? { errors } : {}),
  });
});
