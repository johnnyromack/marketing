/**
 * sync-social-insights Edge Function
 *
 * Fetches social media data from Meta Graph API (Instagram + Facebook Pages)
 * and upserts mentions into social_media_mentions table.
 *
 * Triggered manually or via cron.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const META_GRAPH_BASE = 'https://graph.facebook.com/v21.0';

async function fetchMetaApi(path: string, accessToken: string, params: Record<string, string> = {}) {
  const url = new URL(`${META_GRAPH_BASE}${path}`);
  url.searchParams.set('access_token', accessToken);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Meta API error: ${err.error?.message || res.status}`);
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

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Optionally scope to a specific user from request body
    const body = await req.json().catch(() => ({}));
    const targetUserId: string | null = body.user_id || null;

    // Fetch all active Meta/Instagram integrations
    let query = supabase
      .from('ads_integrations')
      .select('id, user_id, platform, access_token, account_id, account_name')
      .in('platform', ['meta', 'facebook', 'instagram'])
      .not('access_token', 'is', null);

    if (targetUserId) {
      query = query.eq('user_id', targetUserId);
    }

    const { data: integrations, error: integrationsError } = await query;

    if (integrationsError) {
      throw new Error(`Failed to fetch integrations: ${integrationsError.message}`);
    }

    if (!integrations || integrations.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No active Meta integrations found', synced: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let totalSynced = 0;
    const errors: string[] = [];

    for (const integration of integrations) {
      try {
        const accessToken = integration.access_token;
        const userId = integration.user_id;

        // 1. Fetch connected Facebook Pages
        const pagesData = await fetchMetaApi('/me/accounts', accessToken, {
          fields: 'id,name,access_token',
          limit: '10',
        });

        const pages: Array<{ id: string; name: string; access_token: string }> = pagesData.data || [];

        for (const page of pages) {
          const pageToken = page.access_token;

          // 2. Fetch recent page posts
          try {
            const postsData = await fetchMetaApi(`/${page.id}/posts`, pageToken, {
              fields: 'id,message,story,created_time,likes.summary(true),comments.summary(true),shares',
              limit: '25',
            });

            const posts = postsData.data || [];

            const mentions = posts.map((post: Record<string, unknown>) => ({
              user_id: userId,
              platform: 'facebook',
              external_id: post.id as string,
              external_url: `https://facebook.com/${post.id}`,
              content: (post.message as string) || (post.story as string) || '',
              content_type: 'post',
              author: {
                id: page.id,
                platform: 'facebook',
                username: page.name,
                display_name: page.name,
              },
              sentiment: 'neutral',
              sentiment_score: 0,
              sentiment_confidence: 0,
              intent: 'neutral',
              topics: [],
              engagement: {
                likes: (post.likes as { summary?: { total_count?: number } })?.summary?.total_count || 0,
                comments: (post.comments as { summary?: { total_count?: number } })?.summary?.total_count || 0,
                shares: (post.shares as { count?: number })?.count || 0,
              },
              published_at: post.created_time as string,
              fetched_at: new Date().toISOString(),
            })).filter((m: { content: string }) => m.content.length > 0);

            if (mentions.length > 0) {
              const { error: upsertError } = await supabase
                .from('social_media_mentions')
                .upsert(mentions, {
                  onConflict: 'user_id,platform,external_id',
                  ignoreDuplicates: false,
                });

              if (upsertError) {
                errors.push(`Page ${page.name}: ${upsertError.message}`);
              } else {
                totalSynced += mentions.length;
              }
            }
          } catch (postErr) {
            errors.push(`Failed to fetch posts for page ${page.name}: ${(postErr as Error).message}`);
          }

          // 3. Fetch Instagram Business Account linked to this page
          try {
            const igData = await fetchMetaApi(`/${page.id}`, pageToken, {
              fields: 'instagram_business_account',
            });

            const igAccountId = igData.instagram_business_account?.id;

            if (igAccountId) {
              const igMediaData = await fetchMetaApi(`/${igAccountId}/media`, pageToken, {
                fields: 'id,caption,media_type,timestamp,like_count,comments_count,permalink',
                limit: '25',
              });

              const igPosts = igMediaData.data || [];

              const igMentions = igPosts.map((post: Record<string, unknown>) => ({
                user_id: userId,
                platform: 'instagram',
                external_id: post.id as string,
                external_url: post.permalink as string || null,
                content: (post.caption as string) || '',
                content_type: 'post',
                author: {
                  id: igAccountId,
                  platform: 'instagram',
                  username: page.name,
                  display_name: page.name,
                },
                sentiment: 'neutral',
                sentiment_score: 0,
                sentiment_confidence: 0,
                intent: 'neutral',
                topics: [],
                engagement: {
                  likes: (post.like_count as number) || 0,
                  comments: (post.comments_count as number) || 0,
                  shares: 0,
                },
                published_at: post.timestamp as string,
                fetched_at: new Date().toISOString(),
              })).filter((m: { content: string }) => m.content.length > 0);

              if (igMentions.length > 0) {
                const { error: igUpsertError } = await supabase
                  .from('social_media_mentions')
                  .upsert(igMentions, {
                    onConflict: 'user_id,platform,external_id',
                    ignoreDuplicates: false,
                  });

                if (igUpsertError) {
                  errors.push(`Instagram ${igAccountId}: ${igUpsertError.message}`);
                } else {
                  totalSynced += igMentions.length;
                }
              }
            }
          } catch (igErr) {
            // Instagram not connected to this page — skip silently
            console.log(`No Instagram for page ${page.name}: ${(igErr as Error).message}`);
          }
        }

        // Update last_sync_at on the integration
        await supabase
          .from('ads_integrations')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('id', integration.id);

      } catch (integrationErr) {
        errors.push(`Integration ${integration.id}: ${(integrationErr as Error).message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced: totalSynced,
        integrations_processed: integrations.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sync-social-insights:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
