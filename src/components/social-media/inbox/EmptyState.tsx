import { Inbox } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16" data-testid="empty-state">
      <Inbox className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Nenhum ticket encontrado
      </h3>
      <p className="text-gray-500 text-center max-w-md">
        Tickets são criados automaticamente a partir de menções que requerem resposta, ou você pode
        criar manualmente.
      </p>
    </div>
  );
}
