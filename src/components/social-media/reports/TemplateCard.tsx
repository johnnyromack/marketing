import { Eye, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TYPE_CONFIG } from './constants';
import type { TemplateCardProps } from './types';

export function TemplateCard({ template }: TemplateCardProps) {
  const typeConfig = TYPE_CONFIG[template.type];

  return (
    <div
      className="rounded-lg border bg-white p-4 transition-shadow hover:shadow-sm"
      data-testid={`template-card-${template.id}`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2">
            <h3
              className="truncate font-medium text-gray-900"
              data-testid={`template-name-${template.id}`}
            >
              {template.name}
            </h3>
            <span
              className={cn('rounded-full px-2 py-0.5 text-xs', typeConfig.color)}
              data-testid={`template-type-${template.id}`}
            >
              {typeConfig.label}
            </span>
            {template.is_default && (
              <span
                className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700"
                data-testid={`template-default-${template.id}`}
              >
                Padrão
              </span>
            )}
          </div>
          {template.description && (
            <p className="mt-1 truncate text-sm text-gray-500">{template.description}</p>
          )}
          <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
            <span>{template.sections.length} seções</span>
            <span>Usado {template.use_count} vez(es)</span>
          </div>
        </div>
        <div className="ml-4 flex items-center space-x-2">
          <button
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
            aria-label={`Visualizar template ${template.name}`}
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
            aria-label={`Configurar template ${template.name}`}
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
