import type {
  Report,
  ReportSchedule,
  ReportTemplate,
  ReportStatus,
  ReportType,
  ReportFormat,
  ScheduleFrequency,
} from '@/lib/schemas/social-reports.schema';

export type TabType = 'reports' | 'schedules' | 'templates';

export interface ReportCardProps {
  report: Report;
  onDownload: () => void;
  onGenerate: () => void;
  onDelete: () => void;
}

export interface ScheduleCardProps {
  schedule: ReportSchedule;
  onToggle: () => void;
  onDelete: () => void;
}

export interface TemplateCardProps {
  template: ReportTemplate;
}

export interface TabNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  counts: {
    reports: number;
    schedules: number;
    templates: number;
  };
}

export interface StatsBarProps {
  reports: Report[];
}

export interface EmptyStateProps {
  tab: TabType;
}

export interface CreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    name: string;
    type: ReportType;
    format: ReportFormat;
    config: { sections: string[] };
  }) => void;
}

// Re-export schema types for convenience
export type {
  Report,
  ReportSchedule,
  ReportTemplate,
  ReportStatus,
  ReportType,
  ReportFormat,
  ScheduleFrequency,
};
