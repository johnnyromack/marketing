import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTab, TABS, type TabId } from '@/context/TabContext';
import { TrendingUp, Globe, Calculator, Monitor } from 'lucide-react';

// First route to navigate to when switching tabs
const TAB_HOME: Record<TabId, string> = {
  midia:        '/home',
  ads:          '/plataformas',
  orcamentario: '/controle-orcamentario',
  social:       '/social',
};

const TAB_ICONS: Record<TabId, React.ReactNode> = {
  midia:        <TrendingUp className="h-3.5 w-3.5 flex-shrink-0" />,
  ads:          <Globe className="h-3.5 w-3.5 flex-shrink-0" />,
  orcamentario: <Calculator className="h-3.5 w-3.5 flex-shrink-0" />,
  social:       <Monitor className="h-3.5 w-3.5 flex-shrink-0" />,
};

export function TopTabBar() {
  const { activeTab, setActiveTab } = useTab();
  const navigate = useNavigate();

  const handleClick = (id: TabId) => {
    setActiveTab(id);
    navigate(TAB_HOME[id]);
  };

  return (
    <div
      className="fixed left-0 right-0 top-0 z-50 flex h-10 items-end border-b border-border bg-card"
      style={{ paddingLeft: 'var(--sidebar-w, 15rem)' }}
    >
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => handleClick(tab.id)}
          className={cn(
            'relative flex h-9 items-center gap-2 border-x border-t px-4 text-[12px] font-medium transition-colors select-none',
            'first:rounded-tl-md last:rounded-tr-md',
            activeTab === tab.id
              ? 'border-border bg-background text-foreground shadow-sm'
              : 'border-transparent bg-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground',
          )}
        >
          {TAB_ICONS[tab.id]}
          <span>{tab.label}</span>
          {/* Active: bottom gap to "lift" tab above the border line */}
          {activeTab === tab.id && (
            <span className="absolute bottom-[-1px] left-0 right-0 h-[1px] bg-background" />
          )}
        </button>
      ))}
    </div>
  );
}
