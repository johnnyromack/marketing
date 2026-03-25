import { useState, useCallback, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { RefreshCw, Plus, Loader2, Zap } from 'lucide-react';
import {
  SummaryCards,
  AutomationCard,
  CreateAutomationSection,
  EmptyState,
  LoadingState,
  type AutomationRule,
} from '@/components/social-media/automations';

// ============================================
// Main Page
// ============================================

export default function AutomationsPage() {
  const { isLoading: userLoading } = useAuth();
  const { user } = useAuth(); const businessUnitId = user?.id;

  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);

  const fetchRules = useCallback(async () => {
    if (!businessUnitId) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/social-media/automations?business_unit_id=${businessUnitId}`);
      const data = await res.json();

      if (data.success) {
        setRules(data.data?.items || []);
      }
    } catch (error) {
      console.error('Error fetching automation rules:', error);
    } finally {
      setIsLoading(false);
    }
  }, [businessUnitId]);

  const handleToggle = useCallback(
    async (id: string, active: boolean) => {
      try {
        await fetch(`/api/social-media/automations/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: active, business_unit_id: businessUnitId }),
        });
        setRules((prev) => prev.map((r) => (r.id === id ? { ...r, is_active: active } : r)));
      } catch (error) {
        console.error('Error toggling automation:', error);
      }
    },
    [businessUnitId]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm('Tem certeza que deseja excluir esta automação?')) return;

      try {
        await fetch(`/api/social-media/automations/${id}?business_unit_id=${businessUnitId}`, {
          method: 'DELETE',
        });
        setRules((prev) => prev.filter((r) => r.id !== id));
      } catch (error) {
        console.error('Error deleting automation:', error);
      }
    },
    [businessUnitId]
  );

  const handleEdit = useCallback(
    (id: string) => {
      const rule = rules.find((r) => r.id === id);
      if (rule) {
        setEditingRule(rule);
        setShowCreate(true);
      }
    },
    [rules]
  );

  const handleTest = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(
          `/api/social-media/automations/${id}/test?business_unit_id=${businessUnitId}`,
          {
            method: 'POST',
          }
        );
        if (res.ok) {
          const data = await res.json();
          alert(data.message || 'Teste executado com sucesso. Verifique os logs.');
        } else {
          const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
          alert(`Erro no teste: ${err.error || 'Falha na execução'}`);
        }
      } catch (error) {
        console.error('Error testing automation:', error);
        alert('Erro ao executar teste da automação');
      }
    },
    [businessUnitId]
  );

  const handleSave = useCallback(
    async (rule: Partial<AutomationRule>) => {
      try {
        const res = await fetch('/api/social-media/automations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...rule, business_unit_id: businessUnitId }),
        });

        if (res.ok) {
          setShowCreate(false);
          fetchRules();
        }
      } catch (error) {
        console.error('Error saving automation:', error);
      }
    },
    [businessUnitId, fetchRules]
  );

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const activeRules = rules.filter((r) => r.is_active);
  const inactiveRules = rules.filter((r) => !r.is_active);

  // Loading state
  if (userLoading) {
    return (
      <AppLayout>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--qi-accent)]" />
          </div>
        </div>
      </AppLayout>
    );
  }

  // No business unit selected
  if (!businessUnitId) {
    return (
      <AppLayout>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <Zap className="mb-4 h-12 w-12 text-[var(--qi-text-tertiary)]" />
            <h2 className="mb-2 font-[var(--qi-font-weight-semibold)] text-[var(--qi-font-size-body-lg)] text-[var(--qi-text-primary)]">
              Selecione uma Unidade de Negocio
            </h2>
            <p className="text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)]">
              Escolha uma unidade de negocio para gerenciar automações
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-6" data-testid="automations-page">
        {/* Header */}
        <div className="mb-[var(--qi-spacing-lg)] flex flex-col gap-[var(--qi-spacing-md)] md:flex-row md:items-center md:justify-between">
          <div data-testid="automations-header">
            <PageHeader
              title="Automations"
              description="Configure regras automáticas para social media"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchRules}
              disabled={isLoading}
              data-testid="btn-refresh"
              className="flex items-center gap-2 rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] px-[var(--qi-spacing-md)] py-[var(--qi-spacing-sm)] text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-secondary)] transition-colors hover:bg-[var(--qi-bg-secondary)] disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <button
              onClick={() => setShowCreate(true)}
              data-testid="btn-new-automation"
              className="flex items-center gap-2 rounded-[var(--qi-radius-md)] bg-[var(--qi-accent)] px-[var(--qi-spacing-md)] py-[var(--qi-spacing-sm)] text-[var(--qi-font-size-body-sm)] text-white transition-colors hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Nova Automação
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <SummaryCards
          totalRules={rules.length}
          activeRules={activeRules.length}
          inactiveRules={inactiveRules.length}
          executionsToday={0}
        />

        {/* Create Form */}
        {showCreate && (
          <CreateAutomationSection
            onClose={() => {
              setShowCreate(false);
              setEditingRule(null);
            }}
            onSave={handleSave}
            initialData={editingRule ?? undefined}
          />
        )}

        {/* Rules List */}
        <div className="space-y-4">
          {isLoading ? (
            <LoadingState />
          ) : rules.length === 0 ? (
            <EmptyState onCreate={() => setShowCreate(true)} />
          ) : (
            <>
              {activeRules.length > 0 && (
                <div className="mb-6" data-testid="automations-active-section">
                  <h3 className="mb-3 font-[var(--qi-font-weight-semibold)] text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-primary)]">
                    Automações Ativas ({activeRules.length})
                  </h3>
                  <div className="space-y-3">
                    {activeRules.map((rule) => (
                      <AutomationCard
                        key={rule.id}
                        rule={rule}
                        onToggle={handleToggle}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onTest={handleTest}
                      />
                    ))}
                  </div>
                </div>
              )}
              {inactiveRules.length > 0 && (
                <div data-testid="automations-inactive-section">
                  <h3 className="mb-3 font-[var(--qi-font-weight-semibold)] text-[var(--qi-font-size-body-sm)] text-[var(--qi-text-tertiary)]">
                    Automações Inativas ({inactiveRules.length})
                  </h3>
                  <div className="space-y-3">
                    {inactiveRules.map((rule) => (
                      <AutomationCard
                        key={rule.id}
                        rule={rule}
                        onToggle={handleToggle}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onTest={handleTest}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
