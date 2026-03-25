import { Globe, Newspaper } from 'lucide-react';
import type { EmptyStateProps, TabType } from './types';

const EMPTY_STATE_CONFIG: Record<
  TabType,
  { icon: typeof Globe; title: string; description: string }
> = {
  sources: {
    icon: Globe,
    title: 'Nenhuma fonte configurada',
    description: 'Adicione feeds RSS, websites ou outras fontes de mídia para monitorar.',
  },
  items: {
    icon: Newspaper,
    title: 'Nenhum artigo coletado',
    description: 'Os artigos aparecerão aqui conforme as fontes forem monitoradas.',
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
