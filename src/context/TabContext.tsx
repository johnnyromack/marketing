import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

export type TabId = 'midia' | 'ads' | 'orcamentario' | 'social';

export interface Tab {
  id: TabId;
  label: string;
}

export const TABS: Tab[] = [
  { id: 'midia',        label: 'Mídia e Performance'     },
  { id: 'ads',          label: 'Ads Insights'             },
  { id: 'orcamentario', label: 'Controle Orçamentário'    },
  { id: 'social',       label: 'Social Monitor'           },
];

function detectTab(pathname: string): TabId {
  if (pathname.startsWith('/social'))                             return 'social';
  if (pathname.startsWith('/controle-orcamentario') ||
      pathname.startsWith('/admin/orcamentos') ||
      pathname.startsWith('/gestor/aprovacao'))                   return 'orcamentario';
  if (pathname.startsWith('/plataformas') ||
      pathname.startsWith('/saldos')       ||
      pathname.startsWith('/relatorios'))                         return 'ads';
  return 'midia';
}

interface TabContextValue {
  activeTab: TabId;
  setActiveTab: (t: TabId) => void;
}

const TabContext = createContext<TabContextValue>({
  activeTab: 'midia',
  setActiveTab: () => {},
});

export function TabProvider({ children }: { children: ReactNode }) {
  const location = useLocation();

  const [activeTab, setActiveTabState] = useState<TabId>(() => {
    try {
      const saved = localStorage.getItem('app-tab') as TabId | null;
      if (saved && TABS.some(t => t.id === saved)) return saved;
    } catch { /* noop */ }
    return detectTab(location.pathname);
  });

  // Auto-switch tab when the URL changes
  useEffect(() => {
    setActiveTabState(detectTab(location.pathname));
  }, [location.pathname]);

  const setActiveTab = (t: TabId) => {
    setActiveTabState(t);
    try { localStorage.setItem('app-tab', t); } catch { /* noop */ }
  };

  return (
    <TabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabContext.Provider>
  );
}

export function useTab() {
  return useContext(TabContext);
}
