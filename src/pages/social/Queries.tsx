import { useState, useCallback, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import {
  Plus,
  Search,
  Code,
  Loader2,
  Edit2,
  Trash2,
  Play,
  Save,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart2,
} from 'lucide-react';
import { DslQueryEditor, PlatformIcon, PlatformSelector } from '@/components/social-media';
import type { QueryTerm, SocialMediaQuery, SocialPlatform } from '@/lib/schemas/social-media.schema';

type QueryStatus = 'active' | 'draft' | 'paused' | 'archived';

/**
 * Query Card Component
 */
function QueryCard({
  query,
  onEdit,
  onDelete,
  onActivate,
}: {
  query: SocialMediaQuery;
  onEdit: () => void;
  onDelete: () => void;
  onActivate: () => void;
}) {
  const statusConfig: Record<QueryStatus, { color: string; icon: typeof CheckCircle }> = {
    active: { color: 'text-green-500', icon: CheckCircle },
    draft: { color: 'text-yellow-500', icon: Clock },
    paused: { color: 'text-gray-500', icon: AlertCircle },
    archived: { color: 'text-red-500', icon: AlertCircle },
  };

  const config = statusConfig[query.status as QueryStatus] || statusConfig.draft;
  const StatusIcon = config.icon;

  return (
    <div
      data-testid={`query-card-${query.id}`}
      className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] p-4 hover:border-[var(--qi-accent)]/30 transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div data-testid="query-header" className="mb-2 flex items-center gap-2">
            <StatusIcon
              data-testid={`query-status-icon-${query.status}`}
              className={`h-4 w-4 ${config.color}`}
            />
            <h3
              data-testid="query-name"
              className="truncate font-[var(--qi-font-weight-semibold)] text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-primary)]"
            >
              {query.name}
            </h3>
            <span
              data-testid="query-version"
              className="rounded-full bg-[var(--qi-bg-secondary)] px-2 py-0.5 text-[var(--qi-font-size-caption)] text-[var(--qi-text-tertiary)]"
            >
              v{query.version}
            </span>
          </div>

          {/* Description */}
          {query.description && (
            <p
              data-testid="query-description"
              className="mb-2 line-clamp-2 text-[var(--qi-font-size-caption)] text-[var(--qi-text-secondary)]"
            >
              {query.description}
            </p>
          )}

          {/* Terms Preview */}
          <div data-testid="query-terms" className="mb-2 flex flex-wrap gap-1">
            {query.terms.slice(0, 5).map((term, i) => (
              <span
                key={i}
                data-testid={`query-term-${i}`}
                data-term-type={term.type}
                className={`rounded px-2 py-0.5 text-[var(--qi-font-size-caption)] ${term.type === 'exclude' ? 'bg-red-500/20 text-red-400' : ''} ${term.type === 'required' ? 'bg-green-500/20 text-green-400' : ''} ${term.type === 'include' ? 'bg-blue-500/20 text-blue-400' : ''} `}
              >
                {term.type === 'exclude' && '-'}
                {term.type === 'required' && '+'}
                {term.term}
              </span>
            ))}
            {query.terms.length > 5 && (
              <span
                data-testid="query-terms-more"
                className="px-2 py-0.5 text-[var(--qi-font-size-caption)] text-[var(--qi-text-tertiary)]"
              >
                +{query.terms.length - 5} mais
              </span>
            )}
          </div>

          {/* Platforms */}
          <div data-testid="query-platforms" className="flex items-center gap-2">
            {query.platforms.map((platform) => (
              <PlatformIcon key={platform} platform={platform} size={16} />
            ))}
          </div>

          {/* Stats */}
          <div
            data-testid="query-stats"
            className="mt-2 flex items-center gap-4 text-[var(--qi-font-size-caption)] text-[var(--qi-text-tertiary)]"
          >
            {query.volume_estimate !== null && query.volume_estimate !== undefined && (
              <span data-testid="query-volume" className="flex items-center gap-1">
                <BarChart2 className="h-3 w-3" />~{query.volume_estimate.toLocaleString('pt-BR')}{' '}
                menções
              </span>
            )}
            {query.noise_score !== null && query.noise_score !== undefined && (
              <span data-testid="query-noise">Ruído: {query.noise_score}%</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div data-testid="query-actions" className="flex items-center gap-1">
          {query.status !== 'published' && (
            <button
              data-testid="btn-activate"
              onClick={onActivate}
              className="rounded-[var(--qi-radius-sm)] p-2 text-[var(--qi-text-secondary)] transition-colors hover:bg-[var(--qi-bg-secondary)] hover:text-[var(--qi-text-primary)]"
            >
              <Play className="h-4 w-4" />
            </button>
          )}
          <button
            data-testid="btn-edit"
            onClick={onEdit}
            className="rounded-[var(--qi-radius-sm)] p-2 text-[var(--qi-text-secondary)] transition-colors hover:bg-[var(--qi-bg-secondary)] hover:text-[var(--qi-text-primary)]"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            data-testid="btn-delete"
            onClick={onDelete}
            className="rounded-[var(--qi-radius-sm)] p-2 text-red-500 transition-colors hover:bg-[var(--qi-bg-secondary)] hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Query Card Skeleton
 */
function QueryCardSkeleton() {
  return (
    <div
      data-testid="query-card-skeleton"
      className="animate-pulse rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="mb-2 h-5 w-48 rounded bg-[var(--qi-bg-secondary)]" />
          <div className="mb-2 h-4 w-full rounded bg-[var(--qi-bg-secondary)]" />
          <div className="mb-2 flex gap-1">
            <div className="h-5 w-16 rounded bg-[var(--qi-bg-secondary)]" />
            <div className="h-5 w-20 rounded bg-[var(--qi-bg-secondary)]" />
            <div className="h-5 w-14 rounded bg-[var(--qi-bg-secondary)]" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Query Builder Form
 */
function QueryBuilderForm({
  initialQuery,
  brandId,
  onSave,
  onCancel,
}: {
  initialQuery?: SocialMediaQuery;
  brandId: string;
  onSave: (query: SocialMediaQuery) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialQuery?.name || '');
  const [description, setDescription] = useState(initialQuery?.description || '');
  const [terms, setTerms] = useState<QueryTerm[]>(initialQuery?.terms || []);
  const [platforms, setPlatforms] = useState<SocialPlatform[]>(
    (initialQuery?.platforms || ['instagram', 'facebook']) as SocialPlatform[]
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState<{ count: number; sample: Record<string, unknown>[] } | null>(
    null
  );

  const handlePreview = useCallback(
    async (previewTerms: QueryTerm[]) => {
      setIsPreviewLoading(true);
      try {
        const res = await fetch('/api/social-media/queries/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brand_id: brandId,
            terms: previewTerms,
            platforms,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setPreviewResult(data.data);
        }
      } catch (error) {
        console.error('Preview error:', error);
      } finally {
        setIsPreviewLoading(false);
      }
    },
    [brandId, platforms]
  );

  const handleSave = async () => {
    if (!name.trim() || terms.length === 0 || platforms.length === 0) return;

    setIsLoading(true);
    try {
      const endpoint = initialQuery
        ? `/api/social-media/queries/${initialQuery.id}`
        : '/api/social-media/queries';

      const res = await fetch(endpoint, {
        method: initialQuery ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: brandId,
          name,
          description,
          terms,
          platforms,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSave(data.data);
      }
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div data-testid="query-builder-form" className="space-y-6">
      {/* Name */}
      <div data-testid="name-section">
        <label
          htmlFor="page-field-1"
          data-testid="name-label"
          className="mb-1 block font-[var(--qi-font-weight-medium)] text-[var(--qi-font-size-caption)] text-[var(--qi-text-secondary)]"
        >
          Nome da Query
        </label>
        <input
          id="page-field-1"
          data-testid="input-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Menções de Marca"
          className="w-full rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] px-3 py-2 text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-primary)] outline-none focus:border-[var(--qi-accent)]"
        />
      </div>

      {/* Description */}
      <div data-testid="description-section">
        <label
          htmlFor="page-field-2"
          data-testid="description-label"
          className="mb-1 block font-[var(--qi-font-weight-medium)] text-[var(--qi-font-size-caption)] text-[var(--qi-text-secondary)]"
        >
          Descrição (opcional)
        </label>
        <input
          id="page-field-2"
          data-testid="input-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descreva o objetivo desta query"
          className="w-full rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] px-3 py-2 text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-primary)] outline-none focus:border-[var(--qi-accent)]"
        />
      </div>

      {/* Platforms */}
      <div data-testid="platforms-section">
        <span
          data-testid="platforms-label"
          className="mb-2 block font-[var(--qi-font-weight-medium)] text-[var(--qi-font-size-caption)] text-[var(--qi-text-secondary)]"
        >
          Plataformas
        </span>
        <PlatformSelector selected={platforms} onChange={setPlatforms} />
      </div>

      {/* DSL Editor */}
      <DslQueryEditor
        value={terms}
        onChange={setTerms}
        onPreview={handlePreview}
        isPreviewLoading={isPreviewLoading}
        previewResult={previewResult}
      />

      {/* Actions */}
      <div
        data-testid="form-actions"
        className="flex items-center justify-end gap-3 border-t border-[var(--qi-border)] pt-4"
      >
        <button
          data-testid="btn-cancel"
          onClick={onCancel}
          className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] px-[var(--qi-spacing-md)] py-[var(--qi-spacing-sm)] text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)] transition-colors hover:bg-[var(--qi-bg-secondary)]"
        >
          Cancelar
        </button>
        <button
          data-testid="btn-save"
          onClick={handleSave}
          disabled={!name.trim() || terms.length === 0 || platforms.length === 0 || isLoading}
          className="flex items-center gap-2 rounded-[var(--qi-radius-md)] bg-[var(--qi-accent)] px-[var(--qi-spacing-md)] py-[var(--qi-spacing-sm)] text-[var(--qi-font-size-body-sm)] text-white transition-colors hover:opacity-90 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" data-testid="save-loading" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {initialQuery ? 'Salvar Alterações' : 'Criar Query'}
        </button>
      </div>
    </div>
  );
}

/**
 * Queries Page
 */
export default function QueriesPage() {
  const { isLoading: userLoading } = useAuth();
  const { user } = useAuth(); const businessUnitId = user?.id;

  const [queries, setQueries] = useState<SocialMediaQuery[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingQuery, setEditingQuery] = useState<SocialMediaQuery | undefined>();
  const [searchQuery, setSearchQuery] = useState('');

  const fetchQueries = useCallback(async () => {
    if (!businessUnitId) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/social-media/queries?business_unit_id=${businessUnitId}`);
      const data = await res.json();
      if (data.success) {
        setQueries(data.data?.items || []);
      }
    } catch (error) {
      console.error('Error fetching queries:', error);
    } finally {
      setIsLoading(false);
    }
  }, [businessUnitId]);

  useEffect(() => {
    if (businessUnitId) {
      fetchQueries();
    }
  }, [businessUnitId, fetchQueries]);

  const handleSave = (query: SocialMediaQuery) => {
    if (editingQuery) {
      setQueries((prev) => prev.map((q) => (q.id === query.id ? query : q)));
    } else {
      setQueries((prev) => [query, ...prev]);
    }
    setShowForm(false);
    setEditingQuery(undefined);
  };

  const handleEdit = (query: SocialMediaQuery) => {
    setEditingQuery(query);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta query?')) return;

    try {
      await fetch(`/api/social-media/queries/${id}?business_unit_id=${businessUnitId}`, {
        method: 'DELETE',
      });
      setQueries((prev) => prev.filter((q) => q.id !== id));
    } catch (error) {
      console.error('Error deleting query:', error);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      const res = await fetch(`/api/social-media/queries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_unit_id: businessUnitId, status: 'active' }),
      });
      const data = await res.json();
      if (data.success) {
        setQueries((prev) => prev.map((q) => (q.id === id ? data.data : q)));
      }
    } catch (error) {
      console.error('Error activating query:', error);
    }
  };

  const filteredQueries = queries.filter(
    (q) =>
      q.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (userLoading) {
    return (
      <AppLayout>
        <div data-testid="queries-loading" className="flex-1 overflow-y-auto p-6">
          <div className="flex h-64 items-center justify-center">
            <Loader2
              data-testid="queries-loading-spinner"
              className="h-8 w-8 animate-spin text-[var(--qi-accent)]"
            />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!businessUnitId) {
    return (
      <AppLayout>
        <div data-testid="queries-no-business-unit" className="flex-1 overflow-y-auto p-6">
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <Code className="mb-4 h-12 w-12 text-[var(--qi-text-tertiary)]" />
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
              Escolha uma unidade de negocio para gerenciar queries
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div data-testid="queries-page" className="min-h-0 flex-1 overflow-y-auto p-6">
        {showForm ? (
          <div data-testid="query-form-view">
            <PageHeader
              title={editingQuery ? 'Editar Query' : 'Nova Query'}
              description="Configure os termos e plataformas para monitoramento"
              data-testid="query-form-header"
            />
            <div
              className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] p-4"
              data-testid="query-form-card"
            >
              <QueryBuilderForm
                initialQuery={editingQuery}
                brandId={businessUnitId}
                onSave={handleSave}
                onCancel={() => {
                  setShowForm(false);
                  setEditingQuery(undefined);
                }}
              />
            </div>
          </div>
        ) : (
          <div data-testid="queries-list-view">
            {/* Header */}
            <div
              data-testid="queries-header"
              className="mb-[var(--qi-spacing-lg)] flex flex-col gap-[var(--qi-spacing-md)] md:flex-row md:items-center md:justify-between"
            >
              <PageHeader
                title="Query Builder"
                description="Crie e gerencie queries de monitoramento com DSL"
                data-testid="queries-title"
              />
              <button
                data-testid="btn-new-query"
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 rounded-[var(--qi-radius-md)] bg-[var(--qi-accent)] px-[var(--qi-spacing-md)] py-[var(--qi-spacing-sm)] text-[var(--qi-font-size-body-sm)] text-white transition-colors hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Nova Query
              </button>
            </div>

            {/* Search */}
            <div data-testid="search-section" className="relative mb-6">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--qi-text-tertiary)]" />
              <input
                data-testid="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar queries..."
                className="w-full rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] bg-[var(--qi-surface)] py-2 pl-9 pr-3 text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-primary)] outline-none focus:border-[var(--qi-accent)]"
              />
            </div>

            {/* Queries List */}
            <div data-testid="queries-list" className="space-y-4">
              {isLoading && (
                <div data-testid="queries-list-loading">
                  <QueryCardSkeleton />
                  <QueryCardSkeleton />
                  <QueryCardSkeleton />
                </div>
              )}

              {!isLoading && filteredQueries.length === 0 && (
                <div
                  data-testid="queries-empty-state"
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <Code className="mb-2 h-12 w-12 text-[var(--qi-text-tertiary)]" />
                  <p
                    data-testid="empty-title"
                    className="text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]"
                  >
                    Nenhuma query encontrada
                  </p>
                  <p
                    data-testid="empty-message"
                    className="text-[var(--qi-font-size-caption)] text-[var(--qi-text-tertiary)]"
                  >
                    Crie sua primeira query para começar o monitoramento
                  </p>
                </div>
              )}

              {!isLoading &&
                filteredQueries.map((query) => (
                  <QueryCard
                    key={query.id}
                    query={query}
                    onEdit={() => handleEdit(query)}
                    onDelete={() => handleDelete(query.id)}
                    onActivate={() => handleActivate(query.id)}
                  />
                ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
