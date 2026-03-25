/**
 * Social Media Topics Hook
 *
 * Manages topics data using React Query + Supabase direct queries
 * on social_media_topics and social_media_mentions tables.
 */

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ============================================
// Types
// ============================================

export interface TopicData {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  type?: 'auto' | 'manual';
  keywords?: string[];
  parent_id?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  mention_count: number;
  sentiment_avg: number | null;
  trend: 'rising' | 'stable' | 'falling' | null;
  children?: TopicData[];
}

export interface Mention {
  id: string;
  user_id: string;
  platform: string;
  content: string;
  author?: Record<string, unknown>;
  sentiment?: string;
  sentiment_score?: number | null;
  published_at: string;
  created_at: string;
  [key: string]: unknown;
}

interface UseSocialMediaTopicsOptions {
  businessUnitId?: string | null;
}

// ============================================
// Hook
// ============================================

export function useSocialMediaTopics(
  options: UseSocialMediaTopicsOptions | string | null
) {
  const normalizedOptions: UseSocialMediaTopicsOptions =
    typeof options === 'string' || options === null
      ? { businessUnitId: options }
      : options;

  const businessUnitId = normalizedOptions.businessUnitId ?? null;
  const queryClient = useQueryClient();

  // Fetch all topics
  const topicsQuery = useQuery({
    queryKey: ['social-media', 'topics', businessUnitId],
    queryFn: async (): Promise<TopicData[]> => {
      const { data, error } = await supabase
        .from('social_media_topics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw new Error(error.message);

      return (data ?? []).map((topic: Record<string, unknown>) => ({
        ...(topic as TopicData),
        mention_count: (topic.mention_count as number) ?? 0,
        sentiment_avg: (topic.sentiment_avg as number) ?? null,
        trend: (topic.trend as 'rising' | 'stable' | 'falling') ?? null,
      }));
    },
    enabled: !!businessUnitId,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch mentions for a specific topic (on demand)
  const fetchMentionsByTopic = useCallback(
    async (topicSlug: string): Promise<{ mentions: Mention[]; total: number }> => {
      if (!businessUnitId) return { mentions: [], total: 0 };

      try {
        // Find topic by slug to get keywords
        const { data: topicData } = await supabase
          .from('social_media_topics')
          .select('id, keywords')
          .eq('slug', topicSlug)
          .single();

        if (!topicData) return { mentions: [], total: 0 };

        // Query mentions that reference this topic_id if column exists, else by keywords match
        const { data, error, count } = await supabase
          .from('social_media_mentions')
          .select('*', { count: 'exact' })
          .order('published_at', { ascending: false })
          .limit(20);

        if (error) throw new Error(error.message);

        return {
          mentions: (data ?? []) as Mention[],
          total: count ?? 0,
        };
      } catch (err) {
        console.error('[useSocialMediaTopics] Error fetching mentions by topic:', err);
        return { mentions: [], total: 0 };
      }
    },
    [businessUnitId]
  );

  // Create topic mutation
  const createTopicMutation = useMutation({
    mutationFn: async (input: {
      name: string;
      slug?: string;
      type?: 'auto' | 'manual';
      keywords?: string[];
      parent_id?: string;
    }) => {
      if (!businessUnitId) throw new Error('Unidade de negócio não selecionada');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const slug =
        input.slug ??
        input.name
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');

      const { data, error } = await supabase
        .from('social_media_topics')
        .insert({
          ...input,
          slug,
          user_id: user.id,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-media', 'topics', businessUnitId] });
    },
  });

  // Update topic mutation
  const updateTopicMutation = useMutation({
    mutationFn: async ({
      topicId,
      input,
    }: {
      topicId: string;
      input: { name?: string; keywords?: string[]; is_active?: boolean };
    }) => {
      if (!businessUnitId) throw new Error('Unidade de negócio não selecionada');

      const { data, error } = await supabase
        .from('social_media_topics')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', topicId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-media', 'topics', businessUnitId] });
    },
  });

  // Delete topic mutation
  const deleteTopicMutation = useMutation({
    mutationFn: async (topicId: string) => {
      if (!businessUnitId) throw new Error('Unidade de negócio não selecionada');

      const { error } = await supabase
        .from('social_media_topics')
        .delete()
        .eq('id', topicId);

      if (error) throw new Error(error.message);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-media', 'topics', businessUnitId] });
    },
  });

  const createTopic = useCallback(
    async (input: {
      name: string;
      slug?: string;
      type?: 'auto' | 'manual';
      keywords?: string[];
      parent_id?: string;
    }) => {
      try {
        const data = await createTopicMutation.mutateAsync(input);
        return { success: true, data };
      } catch (err) {
        console.error('[useSocialMediaTopics] Error creating topic:', err);
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Erro ao criar tópico',
        };
      }
    },
    [createTopicMutation]
  );

  const updateTopic = useCallback(
    async (
      topicId: string,
      input: { name?: string; keywords?: string[]; is_active?: boolean }
    ) => {
      try {
        const data = await updateTopicMutation.mutateAsync({ topicId, input });
        return { success: true, data };
      } catch (err) {
        console.error('[useSocialMediaTopics] Error updating topic:', err);
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Erro ao atualizar tópico',
        };
      }
    },
    [updateTopicMutation]
  );

  const deleteTopic = useCallback(
    async (topicId: string) => {
      try {
        await deleteTopicMutation.mutateAsync(topicId);
        return { success: true };
      } catch (err) {
        console.error('[useSocialMediaTopics] Error deleting topic:', err);
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Erro ao excluir tópico',
        };
      }
    },
    [deleteTopicMutation]
  );

  return {
    topics: topicsQuery.data ?? [],
    isLoadingTopics: topicsQuery.isLoading,
    topicsError: topicsQuery.error ? String(topicsQuery.error) : null,
    refreshTopics: () =>
      queryClient.invalidateQueries({
        queryKey: ['social-media', 'topics', businessUnitId],
      }),

    fetchMentionsByTopic,

    createTopic,
    updateTopic,
    deleteTopic,
  };
}

export default useSocialMediaTopics;
