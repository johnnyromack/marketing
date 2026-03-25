/**
 * Social Media Publishing Hook
 *
 * Provides data fetching and mutations for scheduled posts.
 * Queries Supabase directly on the social_media_posts table.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ============================================
// Types
// ============================================

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed' | 'cancelled' | 'pending_approval' | 'rejected';

export interface ScheduledPost {
  id: string;
  user_id: string;
  platform: string;
  content: string;
  media_urls?: string[];
  status: PostStatus;
  scheduled_at?: string | null;
  published_at?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;
  platform_post_id?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreatePostInput {
  platform: string;
  content: string;
  media_urls?: string[];
  status?: PostStatus;
  scheduled_at?: string | null;
  metadata?: Record<string, unknown>;
}

export interface UpdatePostInput {
  platform?: string;
  content?: string;
  media_urls?: string[];
  status?: PostStatus;
  scheduled_at?: string | null;
  metadata?: Record<string, unknown>;
}

interface PublishingData {
  posts: ScheduledPost[];
  isLoading: boolean;
  error: string | null;
}

interface UseSocialMediaPublishingOptions {
  businessUnitId?: string | null;
  statusFilter?: PostStatus | 'all';
}

function extractError(error: unknown, fallback: string): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error)
    return String((error as { message: string }).message);
  return fallback;
}

// ============================================
// Hook
// ============================================

export function useSocialMediaPublishing(
  options: UseSocialMediaPublishingOptions | string | null,
  statusFilterArg: PostStatus | 'all' = 'all'
) {
  const normalizedOptions: UseSocialMediaPublishingOptions =
    typeof options === 'string' || options === null
      ? { businessUnitId: options, statusFilter: statusFilterArg }
      : options;

  const businessUnitId = normalizedOptions.businessUnitId ?? null;
  const statusFilter = normalizedOptions.statusFilter ?? 'all';

  const [data, setData] = useState<PublishingData>({
    posts: [],
    isLoading: false,
    error: null,
  });

  const getUserId = useCallback(async (): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  }, []);

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    if (!businessUnitId) {
      setData((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    setData((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      let query = supabase
        .from('social_media_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data: posts, error: queryError } = await query;

      if (queryError) throw new Error(queryError.message);

      setData({
        posts: (posts ?? []) as ScheduledPost[],
        isLoading: false,
        error: null,
      });
    } catch (err) {
      console.error('[useSocialMediaPublishing] Error fetching posts:', err);
      setData((prev) => ({
        ...prev,
        isLoading: false,
        error: extractError(err, 'Erro ao carregar posts'),
      }));
    }
  }, [businessUnitId, statusFilter]);

  // Create a new post
  const createPost = useCallback(
    async (input: CreatePostInput) => {
      if (!businessUnitId) {
        return { success: false, error: 'Unidade de negócio não selecionada' };
      }

      try {
        const userId = await getUserId();
        if (!userId) return { success: false, error: 'Usuário não autenticado' };

        const { data: post, error: insertError } = await supabase
          .from('social_media_posts')
          .insert({
            ...input,
            user_id: userId,
            status: input.status ?? 'draft',
          })
          .select()
          .single();

        if (insertError) throw new Error(insertError.message);

        await fetchPosts();
        return { success: true, data: post };
      } catch (err) {
        console.error('[useSocialMediaPublishing] Error creating post:', err);
        return { success: false, error: extractError(err, 'Erro ao criar post') };
      }
    },
    [businessUnitId, getUserId, fetchPosts]
  );

  // Update a post
  const updatePost = useCallback(
    async (postId: string, input: UpdatePostInput) => {
      if (!businessUnitId) {
        return { success: false, error: 'Unidade de negócio não selecionada' };
      }

      try {
        const userId = await getUserId();
        if (!userId) return { success: false, error: 'Usuário não autenticado' };

        const { data: post, error: updateError } = await supabase
          .from('social_media_posts')
          .update({ ...input, updated_at: new Date().toISOString() })
          .eq('id', postId)
          .eq('user_id', userId)
          .select()
          .single();

        if (updateError) throw new Error(updateError.message);

        await fetchPosts();
        return { success: true, data: post };
      } catch (err) {
        console.error('[useSocialMediaPublishing] Error updating post:', err);
        return { success: false, error: extractError(err, 'Erro ao atualizar post') };
      }
    },
    [businessUnitId, getUserId, fetchPosts]
  );

  // Delete a post
  const deletePost = useCallback(
    async (postId: string) => {
      if (!businessUnitId) {
        return { success: false, error: 'Unidade de negócio não selecionada' };
      }

      try {
        const userId = await getUserId();
        if (!userId) return { success: false, error: 'Usuário não autenticado' };

        const { error: deleteError } = await supabase
          .from('social_media_posts')
          .delete()
          .eq('id', postId)
          .eq('user_id', userId);

        if (deleteError) throw new Error(deleteError.message);

        await fetchPosts();
        return { success: true };
      } catch (err) {
        console.error('[useSocialMediaPublishing] Error deleting post:', err);
        return { success: false, error: extractError(err, 'Erro ao excluir post') };
      }
    },
    [businessUnitId, getUserId, fetchPosts]
  );

  // Approve or reject a post
  const approvePost = useCallback(
    async (postId: string, approved: boolean, rejectionReason?: string) => {
      if (!businessUnitId) {
        return { success: false, error: 'Unidade de negócio não selecionada' };
      }

      try {
        const userId = await getUserId();
        if (!userId) return { success: false, error: 'Usuário não autenticado' };

        const now = new Date().toISOString();
        const updatePayload = approved
          ? {
              status: 'scheduled' as PostStatus,
              approved_by: userId,
              approved_at: now,
              updated_at: now,
            }
          : {
              status: 'rejected' as PostStatus,
              rejected_at: now,
              rejection_reason: rejectionReason ?? null,
              updated_at: now,
            };

        const { data: post, error: updateError } = await supabase
          .from('social_media_posts')
          .update(updatePayload)
          .eq('id', postId)
          .select()
          .single();

        if (updateError) throw new Error(updateError.message);

        await fetchPosts();
        return { success: true, data: post };
      } catch (err) {
        console.error('[useSocialMediaPublishing] Error approving post:', err);
        return { success: false, error: extractError(err, 'Erro ao aprovar post') };
      }
    },
    [businessUnitId, getUserId, fetchPosts]
  );

  // Fetch posts when businessUnitId or filter changes
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    posts: data.posts,
    isLoading: data.isLoading,
    error: data.error,
    refreshPosts: fetchPosts,

    createPost,
    updatePost,
    deletePost,
    approvePost,
  };
}

export default useSocialMediaPublishing;
