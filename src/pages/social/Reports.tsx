import { useState } from 'react';
import { RefreshCw, Plus, AlertCircle, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { PageHeader } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { useSocialReports } from '@/hooks/social-media/useSocialReports';
import {
  StatsBar,
  TabNav,
  ReportCard,
  ScheduleCard,
  TemplateCard,
  EmptyState,
  CreateReportModal,
  type TabType,
  type Report,
  type ReportSchedule,
  type ReportType,
  type ReportFormat,
} from '@/components/social-media/reports';

// ============================================
// Main Page Component
// ============================================

export default function ReportsPage() {
  const { user } = useAuth(); const businessUnitId = user?.id;
  const [activeTab, setActiveTab] = useState<TabType>('reports');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const {
    reports,
    schedules,
    templates,
    loading,
    error,
    createReport,
    generateReport,
    deleteReport,
    updateSchedule,
    deleteSchedule,
    refresh,
  } = useSocialReports({
    businessUnitId,
    autoFetch: true,
  });

  const handleDownload = (report: Report) => {
    if (report.file_url) {
      window.open(report.file_url, '_blank');
    }
  };

  const handleGenerate = async (reportId: string) => {
    await generateReport(reportId);
  };

  const handleDeleteReport = async (reportId: string) => {
    if (confirm('Tem certeza que deseja excluir este relatório?')) {
      await deleteReport(reportId);
    }
  };

  const handleToggleSchedule = async (schedule: ReportSchedule) => {
    await updateSchedule(schedule.id, { is_active: !schedule.is_active });
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (confirm('Tem certeza que deseja excluir este agendamento?')) {
      await deleteSchedule(scheduleId);
    }
  };

  const handleCreateReport = async (data: {
    name: string;
    type: ReportType;
    format: ReportFormat;
    config: { sections: string[] };
  }) => {
    await createReport(data as Parameters<typeof createReport>[0]);
  };

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto p-6" data-testid="reports-page">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between" data-testid="reports-header">
          <PageHeader title="Relatórios" description="Geração e agendamento de relatórios de social media" />
          <div className="flex items-center gap-3">
            <button
              onClick={() => refresh()}
              className="rounded-[var(--qi-radius-md)] border border-[var(--qi-border)] p-2 text-[var(--qi-text-secondary)] transition-colors hover:bg-[var(--qi-bg-secondary)] hover:text-[var(--qi-text-primary)]"
              title="Atualizar"
              data-testid="btn-refresh"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-[var(--qi-radius-md)] bg-[var(--qi-accent)] px-[var(--qi-spacing-md)] py-[var(--qi-spacing-sm)] text-[var(--qi-font-size-body-sm)] text-white transition-colors hover:opacity-90"
              data-testid="btn-new-report"
            >
              <Plus className="h-4 w-4" />
              Novo Relatório
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div
            className="mb-6 rounded-[var(--qi-radius-md)] border border-semantic-error/20 bg-semantic-error/10 p-4"
            data-testid="error-message"
          >
            <div className="flex items-center text-semantic-error">
              <AlertCircle className="mr-2 h-5 w-5" />
              <span className="text-[var(--qi-font-size-body-sm)]">{error}</span>
            </div>
          </div>
        )}

        {/* Stats */}
        <StatsBar reports={reports} />

        {/* Tabs */}
        <TabNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          counts={{
            reports: reports.length,
            schedules: schedules.length,
            templates: templates.length,
          }}
        />

        {/* Loading State */}
        {loading && reports.length === 0 && (
          <div
            className="flex items-center justify-center py-12"
            data-testid="loading-spinner"
          >
            <Loader2 className="h-8 w-8 animate-spin text-[var(--qi-accent)]" />
          </div>
        )}

        {/* Content */}
        {!loading && (
          <>
            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="space-y-3">
                {reports.length === 0 ? (
                  <EmptyState tab="reports" />
                ) : (
                  reports.map((report) => (
                    <ReportCard
                      key={report.id}
                      report={report}
                      onDownload={() => handleDownload(report)}
                      onGenerate={() => handleGenerate(report.id)}
                      onDelete={() => handleDeleteReport(report.id)}
                    />
                  ))
                )}
              </div>
            )}

            {/* Schedules Tab */}
            {activeTab === 'schedules' && (
              <div className="space-y-3">
                {schedules.length === 0 ? (
                  <EmptyState tab="schedules" />
                ) : (
                  schedules.map((schedule) => (
                    <ScheduleCard
                      key={schedule.id}
                      schedule={schedule}
                      onToggle={() => handleToggleSchedule(schedule)}
                      onDelete={() => handleDeleteSchedule(schedule.id)}
                    />
                  ))
                )}
              </div>
            )}

            {/* Templates Tab */}
            {activeTab === 'templates' && (
              <div className="space-y-3">
                {templates.length === 0 ? (
                  <EmptyState tab="templates" />
                ) : (
                  templates.map((template) => (
                    <TemplateCard key={template.id} template={template} />
                  ))
                )}
              </div>
            )}
          </>
        )}

        {/* Create Report Modal */}
        <CreateReportModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateReport}
        />
      </div>
    </AppLayout>
  );
}
