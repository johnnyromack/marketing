import { useState, useCallback, Suspense } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Filter, List, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import {
  ContentCalendar,
  PostComposer,
  PostCard,
  PostCardSkeleton,
} from '@/components/social-media';
import { useSocialMediaPublishing } from '@/hooks/social-media';
import type {
  ScheduledPost,
  PostStatus,
  CreatePostInput,
} from '@/lib/schemas/social-media.schema';

/**
 * Filter Bar
 */
function FilterBar({
  statusFilter,
  onStatusChange,
  viewMode,
  onViewModeChange,
}: {
  statusFilter: PostStatus | 'all';
  onStatusChange: (status: PostStatus | 'all') => void;
  viewMode: 'calendar' | 'list';
  onViewModeChange: (mode: 'calendar' | 'list') => void;
}) {
  const statuses: (PostStatus | 'all')[] = [
    'all',
    'draft',
    'pending_approval',
    'scheduled',
    'published',
  ];

  const statusLabels: Record<PostStatus | 'all', string> = {
    all: 'Todos',
    draft: 'Rascunhos',
    pending_approval: 'Aguardando',
    approved: 'Aprovados',
    scheduled: 'Agendados',
    published: 'Publicados',
    failed: 'Falhou',
  };

  return (
    <div
      data-testid="publishing-filter-bar"
      className="mb-[var(--qi-spacing-md)] flex items-center justify-between gap-[var(--qi-spacing-md)]"
    >
      {/* Status filter */}
      <div data-testid="status-filter" className="flex items-center gap-[var(--qi-spacing-xs)]">
        <Filter className="h-4 w-4 text-[var(--qi-text-tertiary)]" data-testid="filter-icon" />
        {statuses.map((status) => (
          <button
            key={status}
            data-testid={`status-filter-${status}`}
            onClick={() => onStatusChange(status)}
            className={`rounded-full px-3 py-1.5 text-[var(--qi-font-size-body-sm)] transition-colors ${
              statusFilter === status
                ? 'bg-[var(--qi-accent)] text-white'
                : 'bg-[var(--qi-bg-secondary)] text-[var(--qi-text-secondary)] hover:text-[var(--qi-text-primary)]'
            } `}
          >
            {statusLabels[status]}
          </button>
        ))}
      </div>

      {/* View mode toggle */}
      <div
        data-testid="view-mode-toggle"
        className="flex items-center gap-1 rounded-[var(--qi-radius-md)] bg-[var(--qi-bg-secondary)] p-1"
      >
        <button
          data-testid="view-mode-calendar"
          onClick={() => onViewModeChange('calendar')}
          className={`rounded-[var(--qi-radius-sm)] p-2 transition-colors ${
            viewMode === 'calendar'
              ? 'bg-[var(--qi-surface)] text-[var(--qi-accent)] shadow-sm'
              : 'text-[var(--qi-text-tertiary)] hover:text-[var(--qi-text-primary)]'
          } `}
          title="Visualização em calendario"
        >
          <CalendarIcon className="h-4 w-4" />
        </button>
        <button
          data-testid="view-mode-list"
          onClick={() => onViewModeChange('list')}
          className={`rounded-[var(--qi-radius-sm)] p-2 transition-colors ${
            viewMode === 'list'
              ? 'bg-[var(--qi-surface)] text-[var(--qi-accent)] shadow-sm'
              : 'text-[var(--qi-text-tertiary)] hover:text-[var(--qi-text-primary)]'
          } `}
          title="Visualização em lista"
        >
          <List className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Pending Approval Sidebar
 */
function PendingApprovalSidebar({
  posts,
  onApprove: _onApprove,
}: {
  posts: ScheduledPost[];
  onApprove: (post: ScheduledPost) => void;
}) {
  const pendingPosts = posts.filter((p) => p.status === 'pending_approval');

  if (pendingPosts.length === 0) return null;

  return (
    <div
      className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] p-4 flex min-h-0 flex-col lg:col-span-1"
      data-testid="pending-approval-sidebar"
    >
      <h3
        data-testid="pending-approval-title"
        className="mb-[var(--qi-spacing-md)] font-[var(--qi-font-weight-semibold)] text-[var(--qi-font-size-body-md)] text-[var(--qi-text-primary)]"
      >
        Aguardando Aprovação ({pendingPosts.length})
      </h3>
      <div
        data-testid="pending-approval-list"
        className="max-h-[600px] space-y-[var(--qi-spacing-sm)] overflow-y-auto"
      >
        {pendingPosts.map((post) => (
          <PostCard key={post.id} post={post} onView={() => {}} />
        ))}
      </div>
    </div>
  );
}

/**
 * Publishing Page
 */
export default function PublishingPage() {
  const { isLoading: userLoading } = useAuth();
  const { user } = useAuth(); const businessUnitId = user?.id;

  const [statusFilter, setStatusFilter] = useState<PostStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | undefined>();

  const { posts, isLoading, createPost, deletePost, approvePost } = useSocialMediaPublishing({
    businessUnitId,
    statusFilter,
  });

  // Handle create post
  const handleCreatePost = useCallback(
    async (postData: CreatePostInput) => {
      const result = await createPost(postData);
      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar post');
      }
    },
    [createPost]
  );

  // Handle post click
  const handlePostClick = useCallback((post: ScheduledPost) => {
    setSelectedPost(post);
    setIsComposerOpen(true);
  }, []);

  // Handle date click (create post on date)
  const handleCreateOnDate = useCallback((date: Date) => {
    setSelectedDate(date);
    setSelectedPost(undefined);
    setIsComposerOpen(true);
  }, []);

  // Filter posts for display (already filtered by hook, but keep for local filtering)
  const filteredPosts = posts;

  // Show loading state while user is being fetched
  if (userLoading) {
    return (
      <AppLayout>
        <div className="flex-1 overflow-y-auto p-6">
          <div data-testid="publishing-loading" className="flex h-64 items-center justify-center">
            <Loader2
              className="h-8 w-8 animate-spin text-[var(--qi-accent)]"
              data-testid="loading-spinner"
            />
          </div>
        </div>
      </AppLayout>
    );
  }

  // Show message if no business unit is selected
  if (!businessUnitId) {
    return (
      <AppLayout>
        <div className="flex-1 overflow-y-auto p-6">
          <div
            data-testid="publishing-no-business-unit"
            className="flex h-64 flex-col items-center justify-center text-center"
          >
            <CalendarIcon
              className="mb-4 h-12 w-12 text-[var(--qi-text-tertiary)]"
              data-testid="no-bu-icon"
            />
            <h2
              data-testid="no-bu-title"
              className="mb-2 font-[var(--qi-font-weight-semibold)] text-[var(--qi-font-size-body-lg)] text-[var(--qi-text-primary)]"
            >
              Selecione uma Unidade de Negocio
            </h2>
            <p
              data-testid="no-bu-message"
              className="text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]"
            >
              Escolha uma unidade de negocio para gerenciar seus posts
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div data-testid="publishing-page" className="min-h-0 flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div
          data-testid="publishing-header"
          className="mb-[var(--qi-spacing-lg)] flex flex-col gap-[var(--qi-spacing-md)] md:flex-row md:items-center md:justify-between"
        >
          <PageHeader
            title="Publishing"
            description="Gerencie e agende seus posts para todas as plataformas"
          />
          <button
            data-testid="btn-new-post"
            onClick={() => {
              setSelectedPost(undefined);
              setSelectedDate(undefined);
              setIsComposerOpen(true);
            }}
            className="flex items-center gap-2 rounded-[var(--qi-radius-md)] bg-[var(--qi-accent)] px-[var(--qi-spacing-md)] py-[var(--qi-spacing-sm)] text-[var(--qi-font-size-body-sm)] text-white transition-colors hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Novo Post
          </button>
        </div>

        {/* Filter bar */}
        <FilterBar
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Main content */}
        <div
          data-testid="publishing-content"
          className="grid min-h-0 flex-1 grid-cols-1 gap-[var(--qi-spacing-md)] lg:grid-cols-4"
        >
          {/* Calendar/List view */}
          <div data-testid="posts-view-container" className="flex min-h-0 flex-col lg:col-span-3">
            {viewMode === 'calendar' ? (
              <Suspense
                fallback={
                  <div className="animate-pulse">
                    <div
                      className="h-[500px] rounded-lg"
                      style={{ backgroundColor: 'var(--qi-bg-tertiary)' }}
                    />
                  </div>
                }
              >
                <ContentCalendar
                  posts={filteredPosts}
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  onPostClick={handlePostClick}
                  onCreatePost={handleCreateOnDate}
                />
              </Suspense>
            ) : (
              <div
                className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] p-4 flex min-h-0 flex-1 flex-col"
                data-testid="posts-list-view"
              >
                {isLoading ? (
                  <div data-testid="posts-list-loading" className="space-y-[var(--qi-spacing-sm)]">
                    {[1, 2, 3, 4].map((i) => (
                      <PostCardSkeleton key={i} />
                    ))}
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div
                    data-testid="posts-empty-state"
                    className="flex flex-col items-center justify-center py-12 text-center"
                  >
                    <CalendarIcon
                      className="mb-2 h-12 w-12 text-[var(--qi-text-tertiary)]"
                      data-testid="empty-icon"
                    />
                    <p
                      data-testid="empty-title"
                      className="text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]"
                    >
                      Nenhum post encontrado
                    </p>
                    <p
                      data-testid="empty-message"
                      className="text-[var(--qi-font-size-caption)] text-[var(--qi-text-tertiary)]"
                    >
                      Crie seu primeiro post clicando no botao acima
                    </p>
                  </div>
                ) : (
                  <div
                    data-testid="posts-list"
                    className="max-h-[600px] space-y-[var(--qi-spacing-sm)] overflow-y-auto"
                  >
                    {filteredPosts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onEdit={handlePostClick}
                        onView={handlePostClick}
                        onDelete={async () => {
                          await deletePost(post.id);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pending approval sidebar */}
          <PendingApprovalSidebar
            posts={posts}
            onApprove={async (post) => {
              await approvePost(post.id, true);
            }}
          />
        </div>
      </div>

      {/* Post Composer Modal */}
      <PostComposer
        isOpen={isComposerOpen}
        onClose={() => {
          setIsComposerOpen(false);
          setSelectedPost(undefined);
          setSelectedDate(undefined);
        }}
        onSave={handleCreatePost}
        initialPost={selectedPost}
        initialDate={selectedDate}
        brandId={businessUnitId}
      />
    </AppLayout>
  );
}
