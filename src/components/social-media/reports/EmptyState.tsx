import { FileText, Calendar, FileCode } from 'lucide-react';
import type { EmptyStateProps, TabType } from './types';

const EMPTY_STATE_CONFIG: Record<
  TabType,
  { icon: typeof FileText; title: string; description: string }
> = {
  reports: {
    icon: FileText,
    title: 'Nenhum relatório',
    description: 'Crie seu primeiro relatório para visualizar dados consolidados.',
  },
  schedules: {
    icon: Calendar,
    title: 'Nenhum agendamento',
    description: 'Configure agendamentos para receber relatórios automaticamente.',
  },
  templates: {
    icon: FileCode,
    title: 'Nenhum template',
    description: 'Crie templates personalizados para seus relatórios.',
  },
};

export function EmptyState({ tab }: EmptyStateProps) {
  const { icon: Icon, title, description } = EMPTY_STATE_CONFIG[tab];

  return (
    <div className="text-center py-12" data-testid={`empty-state-${tab}`}>
      <Icon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-4">{description}</p>
    </div>
  );
}
