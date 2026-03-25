import { ReactNode } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { TopTabBar } from '@/components/TopTabBar';
import { AppFooter } from '@/components/AppFooter';

interface AppLayoutProps {
  children: ReactNode;
}

// Tab bar height (matches h-10 = 40px in TopTabBar)
const TAB_BAR_H = '2.5rem';

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Top tab bar — full width, fixed ── */}
      <TopTabBar />

      {/* ── Sidebar — offset below tab bar ── */}
      <AppSidebar topOffset={TAB_BAR_H} />

      {/* ── Content area — offset right of sidebar & below tab bar ── */}
      <div
        className="flex flex-col min-h-screen transition-[margin] duration-200"
        style={{
          marginLeft: 'var(--sidebar-w, 15rem)',
          paddingTop: TAB_BAR_H,
        }}
      >
        <main className="flex-1">
          {children}
        </main>
        <AppFooter />
      </div>
    </div>
  );
};
