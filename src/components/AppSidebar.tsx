import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useTab } from '@/context/TabContext';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { RaizLogo } from '@/components/RaizLogo';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, FileInput, CheckSquare, Settings, LogOut, Menu,
  History, ChevronDown, TrendingUp, Megaphone, Building2, Wallet,
  Users, HelpCircle, Calculator, Link2, Wrench, LineChart,
  Globe, DollarSign, FileText, Key, Bell, BookOpen, RefreshCw,
  BarChart3, PanelLeftClose, PanelLeftOpen, Home,
  Monitor, Inbox, Send, BarChart2, Zap, AlertTriangle, Target,
  Plug, Search, Tag, Rss, Radio, Eye, FileBarChart, Clock,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const SIDEBAR_EXPANDED = '15rem';
const SIDEBAR_COLLAPSED = '4rem';

function setSidebarVar(collapsed: boolean) {
  document.documentElement.style.setProperty(
    '--sidebar-w',
    collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED,
  );
}

// ─── SidebarLink ─────────────────────────────────────────────────────────────

function SidebarLink({
  to, icon, label, collapsed,
}: { to: string; icon: React.ReactNode; label: string; collapsed: boolean }) {
  const location = useLocation();
  const isExact = to === '/home' || to === '/social' || to === '/controle-orcamentario';
  const active = isExact
    ? location.pathname === to
    : location.pathname === to || location.pathname.startsWith(to + '/');

  const inner = (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        collapsed && 'justify-center px-0',
      )}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
  if (!collapsed) return inner;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{inner}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

// ─── SidebarGroup ────────────────────────────────────────────────────────────

function SidebarGroup({
  groupKey, label, icon, items, collapsed, openGroups, toggle,
}: {
  groupKey: string;
  label: string;
  icon: React.ReactNode;
  items: { to: string; label: string; icon: React.ReactNode }[];
  collapsed: boolean;
  openGroups: Record<string, boolean>;
  toggle: (k: string) => void;
}) {
  const location = useLocation();
  const isGroupActive = items.some(i =>
    location.pathname === i.to || location.pathname.startsWith(i.to + '/'),
  );
  const isOpen = openGroups[groupKey] ?? isGroupActive;

  if (collapsed) {
    return (
      <div className="space-y-1">
        {items.map(item => (
          <SidebarLink key={item.to} to={item.to} icon={item.icon} label={item.label} collapsed />
        ))}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => toggle(groupKey)}
        className={cn(
          'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isGroupActive
            ? 'text-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
      >
        <span className="flex-shrink-0">{icon}</span>
        <span className="flex-1 text-left truncate">{label}</span>
        <ChevronDown className={cn('h-3.5 w-3.5 flex-shrink-0 transition-transform', isOpen && 'rotate-180')} />
      </button>
      {isOpen && (
        <div className="ml-4 mt-1 space-y-0.5 border-l border-border pl-3">
          {items.map(item => (
            <SidebarLink key={item.to} to={item.to} icon={item.icon} label={item.label} collapsed={false} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SidebarBody ─────────────────────────────────────────────────────────────

function SidebarBody({
  collapsed,
  onCollapsedChange,
  topOffset = '0px',
}: {
  collapsed: boolean;
  onCollapsedChange?: (v: boolean) => void;
  topOffset?: string;
}) {
  const { user, signOut } = useAuth();
  const { isAdmin, isGestor, canEditForms, canApprove, canViewLogs } = useUserRole();
  const { activeTab } = useTab();
  const navigate = useNavigate();
  const hasAdminAccess = isAdmin || isGestor;

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const toggle = (k: string) => setOpenGroups(p => ({ ...p, [k]: !(p[k] ?? true) }));
  const handleSignOut = async () => { await signOut(); navigate('/auth'); };

  // ── Nav items per tab ─────────────────────────────────────────────────────

  const midiaGroups = [
    {
      key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, show: true,
      items: [
        { to: '/dashboard',      label: 'Performance', icon: <TrendingUp className="h-4 w-4" /> },
        { to: '/midia/dashboard', label: 'Mídia',       icon: <Megaphone className="h-4 w-4" /> },
      ],
    },
    {
      key: 'entrada', label: 'Entrada de Dados', icon: <FileInput className="h-4 w-4" />, show: canEditForms,
      items: [
        { to: '/entrada-dados', label: 'Performance', icon: <TrendingUp className="h-4 w-4" /> },
        { to: '/midia',         label: 'Mídia',       icon: <Megaphone className="h-4 w-4" /> },
      ],
    },
  ];

  const adsLinks = [
    { to: '/plataformas', label: 'Plataformas', icon: <BarChart3 className="h-4 w-4" />, show: true },
    { to: '/saldos',      label: 'Saldos',      icon: <DollarSign className="h-4 w-4" />, show: true },
    { to: '/relatorios',  label: 'Relatórios',  icon: <FileText className="h-4 w-4" />,  show: true },
  ];

  const orcamentoLinks = [
    { to: '/controle-orcamentario',  label: 'Visão Geral',       icon: <Calculator className="h-4 w-4" />, show: true },
    { to: '/admin/orcamentos',       label: 'Orçamentos Mídia',  icon: <Wallet className="h-4 w-4" />,     show: canEditForms },
    { to: '/admin/orcamentos-area',  label: 'Orçamentos Área',   icon: <Building2 className="h-4 w-4" />,  show: canEditForms },
  ];

  const socialLinks = [
    { to: '/social',             label: 'Dashboard',         icon: <Monitor className="h-4 w-4" /> },
    { to: '/social/inbox',       label: 'Inbox',             icon: <Inbox className="h-4 w-4" /> },
    { to: '/social/publishing',  label: 'Publishing',        icon: <Send className="h-4 w-4" /> },
    { to: '/social/analytics',   label: 'Analytics',         icon: <BarChart2 className="h-4 w-4" /> },
    { to: '/social/automations', label: 'Automações',        icon: <Zap className="h-4 w-4" /> },
    { to: '/social/crisis',      label: 'Crise',             icon: <AlertTriangle className="h-4 w-4" /> },
    { to: '/social/competitive', label: 'Competitivo',       icon: <Target className="h-4 w-4" /> },

    { to: '/social/queries',     label: 'Queries',           icon: <Search className="h-4 w-4" /> },
    { to: '/social/topics',      label: 'Tópicos',           icon: <Tag className="h-4 w-4" /> },
    { to: '/social/sources',     label: 'Fontes',            icon: <Rss className="h-4 w-4" /> },
    { to: '/social/listening',   label: 'Listening',         icon: <Radio className="h-4 w-4" /> },
    { to: '/social/visual',      label: 'Visual',            icon: <Eye className="h-4 w-4" /> },
    { to: '/social/reports',     label: 'Relatórios',        icon: <FileBarChart className="h-4 w-4" /> },
    { to: '/social/best-time',   label: 'Melhores Horários', icon: <Clock className="h-4 w-4" /> },
    { to: '/social/settings',    label: 'Configurações',     icon: <Settings className="h-4 w-4" /> },
  ];

  // ── Tab 5 — Configurações ────────────────────────────────────────────────

  const configLinks = [
    ...(hasAdminAccess ? [{ to: '/admin/usuarios',        label: 'Usuários',           icon: <Users className="h-4 w-4" /> }] : []),
    ...(canEditForms   ? [
      { to: '/admin/marcas-unidades', label: 'Marcas e Unidades', icon: <Building2 className="h-4 w-4" /> },
      { to: '/admin/fornecedores',    label: 'Fornecedores',       icon: <Building2 className="h-4 w-4" /> },
      { to: '/integracoes',           label: 'Integrações',        icon: <Link2 className="h-4 w-4" /> },
      { to: '/credenciais',           label: 'Credenciais & IA',   icon: <Key className="h-4 w-4" /> },
      { to: '/admin/alertas',         label: 'Alertas & WhatsApp', icon: <Bell className="h-4 w-4" /> },
    ] : []),
    ...(canViewLogs ? [
      { to: '/logs',      label: 'Logs Atividade',     icon: <History className="h-4 w-4" /> },
      { to: '/logs/sync', label: 'Logs Sincronização', icon: <RefreshCw className="h-4 w-4" /> },
    ] : []),
  ];

  // ── Tab 6 — Ferramentas ──────────────────────────────────────────────────

  const ferramentasLinks = [
    { to: '/ferramentas/simulador-conversao', label: 'Simulador de Conversão', icon: <LineChart className="h-4 w-4" /> },
    { to: '/documentacao',                    label: 'Documentação',            icon: <BookOpen className="h-4 w-4" /> },
  ];

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full flex-col overflow-hidden">

        {/* ── Logo + collapse toggle ── */}
        <div className={cn(
          'flex items-center gap-2 border-b border-border px-3',
          collapsed ? 'h-10 justify-center' : 'justify-between',
        )} style={{ minHeight: topOffset || '2.5rem' }}>
          {!collapsed && (
            <Link to="/home" className="flex-1 min-w-0">
              <RaizLogo className="h-7 w-auto" />
            </Link>
          )}
          {onCollapsedChange && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost" size="icon"
                  className="h-7 w-7 flex-shrink-0"
                  onClick={() => onCollapsedChange(!collapsed)}
                >
                  {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {collapsed ? 'Expandir menu' : 'Recolher menu'}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* ── Tab nav content (scrollable) ── */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">

          <SidebarLink to="/home" icon={<Home className="h-4 w-4" />} label="Início" collapsed={collapsed} />
          <div className="my-1 h-px bg-border/50" />

          {/* Tab 1 — Mídia e Performance */}
          {activeTab === 'midia' && midiaGroups.filter(g => g.show).map(g => (
            <SidebarGroup
              key={g.key} groupKey={g.key} label={g.label} icon={g.icon}
              items={g.items} collapsed={collapsed} openGroups={openGroups} toggle={toggle}
            />
          ))}

          {/* Tab 2 — Ads Insights */}
          {activeTab === 'ads' && adsLinks.filter(l => l.show).map(l => (
            <SidebarLink key={l.to} to={l.to} icon={l.icon} label={l.label} collapsed={collapsed} />
          ))}

          {/* Tab 3 — Controle Orçamentário */}
          {activeTab === 'orcamentario' && orcamentoLinks.filter(l => l.show).map(l => (
            <SidebarLink key={l.to} to={l.to} icon={l.icon} label={l.label} collapsed={collapsed} />
          ))}

          {/* Tab 4 — Social Monitor */}
          {activeTab === 'social' && socialLinks.map(l => (
            <SidebarLink key={l.to} to={l.to} icon={l.icon} label={l.label} collapsed={collapsed} />
          ))}

          {/* Tab 5 — Configurações */}
          {activeTab === 'configuracoes' && configLinks.map(l => (
            <SidebarLink key={l.to} to={l.to} icon={l.icon} label={l.label} collapsed={collapsed} />
          ))}

          {/* Tab 6 — Ferramentas */}
          {activeTab === 'ferramentas' && ferramentasLinks.map(l => (
            <SidebarLink key={l.to} to={l.to} icon={l.icon} label={l.label} collapsed={collapsed} />
          ))}

        </nav>

        {/* ── Fixed bottom: Aprovações + Ajuda ── */}
        <div className="border-t border-border px-2 py-2 space-y-0.5">
          {canApprove && (
            <SidebarLink to="/gestor/aprovacao" icon={<CheckSquare className="h-4 w-4" />} label="Aprovações" collapsed={collapsed} />
          )}
          <SidebarLink to="/ajuda" icon={<HelpCircle className="h-4 w-4" />} label="Ajuda" collapsed={collapsed} />
        </div>

        {/* ── User footer ── */}
        <div className={cn('border-t border-border p-2 space-y-1', collapsed && 'flex flex-col items-center')}>
          {!collapsed && user?.email && (
            <p className="truncate px-2 py-1 text-[11px] text-muted-foreground">{user.email}</p>
          )}
          <div className={cn('flex items-center', collapsed ? 'flex-col gap-1' : 'gap-1')}>
            <ThemeToggle />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side={collapsed ? 'right' : 'top'}>Sair</TooltipContent>
            </Tooltip>
          </div>
        </div>

      </div>
    </TooltipProvider>
  );
}

// ─── AppSidebar (exported) ────────────────────────────────────────────────────

export const AppSidebar = ({ topOffset = '2.5rem' }: { topOffset?: string }) => {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('sidebar-collapsed') === 'true'; } catch { return false; }
  });

  useEffect(() => { setSidebarVar(collapsed); }, [collapsed]);
  useEffect(() => { setSidebarVar(collapsed); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCollapse = (v: boolean) => {
    setCollapsed(v);
    setSidebarVar(v);
    try { localStorage.setItem('sidebar-collapsed', String(v)); } catch { /* noop */ }
  };

  const w = collapsed ? 'w-16' : 'w-60';

  return (
    <>
      {/* Desktop sidebar — offset below tab bar */}
      <aside
        className={cn(
          'fixed left-0 z-40 hidden border-r border-border bg-card transition-[width] duration-200 md:block',
          w,
        )}
        style={{ top: topOffset, height: `calc(100vh - ${topOffset})` }}
      >
        <SidebarBody collapsed={collapsed} onCollapsedChange={handleCollapse} topOffset={topOffset} />
      </aside>

      {/* Mobile: sheet drawer (no top offset needed, covers full screen) */}
      <div
        className="fixed left-0 z-50 flex h-10 w-full items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur-sm md:hidden"
        style={{ top: topOffset }}
      >
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-60 p-0">
            <SidebarBody collapsed={false} />
          </SheetContent>
        </Sheet>
        <Link to="/home"><RaizLogo className="h-7 w-auto" /></Link>
      </div>

      {/* Mobile spacer */}
      <div className="h-10 md:hidden" aria-hidden />
    </>
  );
};
