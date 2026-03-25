import { cn } from '@/lib/utils';
import type { TabNavProps, TabType } from './types';

export function TabNav({ activeTab, setActiveTab, counts }: TabNavProps) {
  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: 'reports', label: 'Relatórios', count: counts.reports },
    { id: 'schedules', label: 'Agendamentos', count: counts.schedules },
    { id: 'templates', label: 'Templates', count: counts.templates },
  ];

  return (
    <div className="border-b mb-6" data-testid="tab-nav">
      <nav className="flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'py-3 px-1 border-b-2 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
            data-testid={`tab-${tab.id}`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={cn(
                  'ml-2 px-2 py-0.5 rounded-full text-xs',
                  activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
