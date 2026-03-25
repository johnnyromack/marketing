import { Globe, BarChart3, Bell } from 'lucide-react';
import type { TabId, TabConfig } from './types';

interface SettingsTabsProps {
  activeTab: TabId;
  onChangeTab: (tab: TabId) => void;
}

const tabs: TabConfig[] = [
  { id: 'preferences', label: 'Preferencias', icon: <Globe className="w-4 h-4" /> },
  { id: 'platforms', label: 'Plataformas', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'alerts', label: 'Alertas', icon: <Bell className="w-4 h-4" /> },
];

/**
 * SettingsTabs - Tab navigation for social media settings
 */
export function SettingsTabs({ activeTab, onChangeTab }: SettingsTabsProps) {
  return (
    <div data-testid="settings-tabs" className="flex gap-1 p-1 bg-muted rounded-md mb-6">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          data-testid={`tab-${tab.id}`}
          onClick={() => onChangeTab(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {tab.icon}
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
