import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTab, TABS, type TabId } from '@/context/TabContext';
import { TrendingUp, Globe, Calculator, Monitor, Settings, Wrench } from 'lucide-react';

const TAB_HOME: Record<TabId, string> = {
  midia:         '/home',
  ads:           '/plataformas',
  orcamentario:  '/controle-orcamentario',
  social:        '/social',
  configuracoes: '/admin/marcas-unidades',
  ferramentas:   '/ferramentas/simulador-conversao',
};

const TAB_ICONS: Record<TabId, React.ReactNode> = {
  midia:         <TrendingUp className="h-3.5 w-3.5 flex-shrink-0" />,
  ads:           <Globe className="h-3.5 w-3.5 flex-shrink-0" />,
  orcamentario:  <Calculator className="h-3.5 w-3.5 flex-shrink-0" />,
  social:        <Monitor className="h-3.5 w-3.5 flex-shrink-0" />,
  configuracoes: <Settings className="h-3.5 w-3.5 flex-shrink-0" />,
  ferramentas:   <Wrench className="h-3.5 w-3.5 flex-shrink-0" />,
};

const TAB_GRADIENT: Record<TabId, string> = {
  midia:         'from-violet-500 to-purple-500',
  ads:           'from-blue-500 to-cyan-500',
  orcamentario:  'from-emerald-500 to-teal-400',
  social:        'from-pink-500 to-rose-400',
  configuracoes: 'from-slate-500 to-gray-400',
  ferramentas:   'from-orange-500 to-amber-400',
};

const TAB_ICON_COLOR: Record<TabId, string> = {
  midia:         'text-violet-500',
  ads:           'text-blue-500',
  orcamentario:  'text-emerald-500',
  social:        'text-pink-500',
  configuracoes: 'text-slate-500',
  ferramentas:   'text-orange-500',
};

// Radius used on tabs in px (matches rounded-tl-xl / rounded-tr-xl = 12px)
const R = 12;

export function TopTabBar() {
  const { activeTab, setActiveTab } = useTab();
  const navigate = useNavigate();

  const handleClick = (id: TabId) => {
    setActiveTab(id);
    navigate(TAB_HOME[id]);
  };

  return (
    <div
      className="fixed left-0 right-0 top-0 z-50 flex h-12 items-end justify-center border-b border-border bg-muted/80 backdrop-blur-sm"
      style={{ paddingLeft: 'var(--sidebar-w, 15rem)' }}
    >
      <div className="flex items-end gap-1 px-3">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            // Wrapper is the positioning root for corner SVGs and bottom-merge.
            // The button uses overflow-hidden so the gradient stripe is properly
            // clipped to the rounded corners. Corners + merge live outside.
            <div key={tab.id} className="relative flex-shrink-0">
              <button
                onClick={() => handleClick(tab.id)}
                className={cn(
                  'relative flex h-9 items-center gap-2 px-5 text-[12.5px] font-medium',
                  'rounded-tl-xl rounded-tr-xl overflow-hidden',
                  'transition-all duration-150 select-none outline-none',
                  isActive
                    ? 'bg-background text-foreground shadow-[0_-2px_10px_rgba(0,0,0,0.12)]'
                    : 'bg-transparent text-muted-foreground hover:bg-background/50 hover:text-foreground',
                )}
              >
                {/* Gradient top-accent stripe — clipped cleanly by overflow-hidden */}
                {isActive && (
                  <span
                    className={cn(
                      'absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r',
                      TAB_GRADIENT[tab.id],
                    )}
                  />
                )}

                <span className={cn('transition-colors', isActive ? TAB_ICON_COLOR[tab.id] : '')}>
                  {TAB_ICONS[tab.id]}
                </span>

                <span>{tab.label}</span>
              </button>

              {/* Bottom-merge: covers the tab-bar's border-b under the active tab */}
              {isActive && (
                <span className="absolute inset-x-0 bottom-[-1px] h-[2px] bg-background pointer-events-none" />
              )}

              {/* Chrome-style outer inverse-corner curves.
                  Each is an SVG quarter-circle filled with bg-background that sits
                  flush against the tab's bottom corner, hiding the "gap" between the
                  tab bar's muted background and the rounded tab edge. */}
              {isActive && (
                <>
                  {/* Bottom-left corner */}
                  <svg
                    width={R} height={R}
                    viewBox={`0 0 ${R} ${R}`}
                    className="absolute bottom-0 left-0 -translate-x-full fill-background pointer-events-none"
                  >
                    <path d={`M${R},${R} Q${R},0 0,0 L0,${R} Z`} />
                  </svg>

                  {/* Bottom-right corner */}
                  <svg
                    width={R} height={R}
                    viewBox={`0 0 ${R} ${R}`}
                    className="absolute bottom-0 right-0 translate-x-full fill-background pointer-events-none"
                  >
                    <path d={`M0,${R} Q0,0 ${R},0 L${R},${R} Z`} />
                  </svg>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
