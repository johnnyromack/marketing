import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  BarChart3, 
  FileText, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Calendar,
  Gift,
  Radio,
  Tv,
  ClipboardList,
  Settings,
  HelpCircle,
  ArrowRight,
  Bell,
  Wallet,
  Calculator
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface KPISummary {
  totalInvestido: number;
  totalOrcado: number;
  totalLeads: number;
  percentualExecutado: number;
  deltaVsMesAnterior: number;
}

interface Alert {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  description: string;
  link?: string;
}

const Home = () => {
  const { user, loading: authLoading } = useAuth();
  const { role, isAdmin, isGestor, isEditor, canEditForms, canApprove, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [kpis, setKpis] = useState<KPISummary | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      // Fetch user name from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.full_name) {
        setUserName(profile.full_name.split(' ')[0]); // First name only
      } else {
        setUserName(user.email?.split('@')[0] || 'Usuário');
      }
    };

    fetchUserData();
  }, [user]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      setLoadingData(true);

      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      try {
        // Fetch KPI data from campanhas (orçamento) and publicidade_dados (investimento + leads)
        const [campanhasRes, pubDataRes] = await Promise.all([
          supabase.from('campanhas').select('orcamento_total').eq('status', 'aprovado'),
          supabase.from('publicidade_dados')
            .select('leads_real, month_number, year, invest_meta, invest_google, invest_off, invest_eventos')
            .eq('status', 'aprovado')
            .eq('unidade', 'Geral'),
        ]);

        const pubData = pubDataRes.data;
        const totalOrcado = campanhasRes.data?.reduce((sum, r) => sum + Number(r.orcamento_total || 0), 0) || 0;

        // Leads e investimento acumulados de toda a campanha (sem filtro de ano)
        const totalLeads = pubData?.reduce((sum, r) => sum + Number(r.leads_real || 0), 0) || 0;
        const totalInvestido = pubData?.reduce((sum, r) => sum + Number(r.invest_meta || 0) + Number(r.invest_google || 0) + Number(r.invest_off || 0) + Number(r.invest_eventos || 0), 0) || 0;

        // Calculate delta vs previous month
        const currentMonthData = pubData?.filter(r => r.month_number === currentMonth && r.year === currentYear) || [];
        const prevMonthData = pubData?.filter(r => r.month_number === currentMonth - 1 && r.year === currentYear) || [];
        const currentMonthInvest = currentMonthData.reduce((sum, r) => sum + Number(r.invest_meta || 0) + Number(r.invest_google || 0) + Number(r.invest_off || 0) + Number(r.invest_eventos || 0), 0);
        const prevMonthInvest = prevMonthData.reduce((sum, r) => sum + Number(r.invest_meta || 0) + Number(r.invest_google || 0) + Number(r.invest_off || 0) + Number(r.invest_eventos || 0), 0);
        const deltaVsMesAnterior = prevMonthInvest > 0 ? ((currentMonthInvest - prevMonthInvest) / prevMonthInvest) * 100 : 0;

        const percentualExecutado = totalOrcado > 0 ? (totalInvestido / totalOrcado) * 100 : 0;

        setKpis({
          totalInvestido,
          totalOrcado,
          totalLeads,
          percentualExecutado,
          deltaVsMesAnterior,
        });

        // Generate alerts
        const newAlerts: Alert[] = [];

        // Check budget alerts
        if (percentualExecutado > 90) {
          newAlerts.push({
            id: 'budget-critical',
            type: 'warning',
            title: 'Orçamento Crítico',
            description: `${percentualExecutado.toFixed(0)}% do orçamento anual já foi utilizado`,
            link: '/admin/orcamentos'
          });
        } else if (percentualExecutado > 75) {
          newAlerts.push({
            id: 'budget-warning',
            type: 'info',
            title: 'Orçamento em Atenção',
            description: `${percentualExecutado.toFixed(0)}% do orçamento anual utilizado`,
            link: '/admin/orcamentos'
          });
        }

        // Check pending approvals (for gestors)
        if (isGestor || isAdmin) {
          const [pendingMidiaOn, pendingMidiaOff, pendingEventos, pendingBrindes] = await Promise.all([
            supabase.from('midia_on').select('id', { count: 'exact' }).eq('status', 'pendente'),
            supabase.from('midia_off').select('id', { count: 'exact' }).eq('status', 'pendente'),
            supabase.from('eventos').select('id', { count: 'exact' }).eq('status', 'pendente'),
            supabase.from('brindes').select('id', { count: 'exact' }).eq('status', 'pendente'),
          ]);

          const totalPending = (pendingMidiaOn.count || 0) + (pendingMidiaOff.count || 0) + 
                               (pendingEventos.count || 0) + (pendingBrindes.count || 0);
          
          setPendingApprovals(totalPending);

          if (totalPending > 0) {
            newAlerts.push({
              id: 'pending-approvals',
              type: 'info',
              title: 'Aprovações Pendentes',
              description: `${totalPending} item(ns) aguardando sua aprovação`,
              link: '/gestor/aprovacao'
            });
          }
        }

        setAlerts(newAlerts);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    if (user && !roleLoading) {
      fetchDashboardData();
    }
  }, [user, roleLoading, isGestor, isAdmin]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
    return `R$ ${value.toFixed(0)}`;
  };

  const formatNumber = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });

  // Define action cards based on user role
  const actionCards = [
    // Dashboards - available to all
    {
      title: 'Dashboard Performance',
      description: 'Leads, matrículas, CPL e CAC',
      icon: BarChart3,
      link: '/dashboard',
      color: 'from-blue-500 to-cyan-500',
      visible: true,
    },
    {
      title: 'Dashboard Mídia',
      description: 'Investimentos e orçamentos',
      icon: TrendingUp,
      link: '/midia/dashboard',
      color: 'from-purple-500 to-pink-500',
      visible: true,
    },
    // Data entry - for editors
    {
      title: 'Cadastrar Mídia On',
      description: 'Google Ads, Meta Ads, etc.',
      icon: Radio,
      link: '/midia',
      color: 'from-green-500 to-emerald-500',
      visible: canEditForms,
    },
    {
      title: 'Cadastrar Mídia Off',
      description: 'Outdoor, rádio, TV, etc.',
      icon: Tv,
      link: '/midia',
      color: 'from-orange-500 to-amber-500',
      visible: canEditForms,
    },
    {
      title: 'Cadastrar Evento',
      description: 'Feiras, palestras, workshops',
      icon: Calendar,
      link: '/midia',
      color: 'from-red-500 to-rose-500',
      visible: canEditForms,
    },
    {
      title: 'Cadastrar Brinde',
      description: 'Materiais promocionais',
      icon: Gift,
      link: '/midia',
      color: 'from-indigo-500 to-violet-500',
      visible: canEditForms,
    },
    // Approvals - for gestors
    {
      title: 'Aprovações',
      description: pendingApprovals > 0 ? `${pendingApprovals} pendente(s)` : 'Nenhuma pendência',
      icon: CheckCircle2,
      link: '/gestor/aprovacao',
      color: 'from-teal-500 to-cyan-500',
      visible: canApprove,
      badge: pendingApprovals > 0 ? pendingApprovals : undefined,
    },
    // Admin actions
    {
      title: 'Gerenciar Usuários',
      description: 'Criar e editar usuários',
      icon: Users,
      link: '/admin/usuarios',
      color: 'from-slate-500 to-gray-500',
      visible: isGestor,
    },
    {
      title: 'Orçamentos Mídia',
      description: 'Definir verbas por marca',
      icon: Wallet,
      link: '/admin/orcamentos',
      color: 'from-yellow-500 to-orange-500',
      visible: canEditForms,
    },
    {
      title: 'Orçamento de Área',
      description: 'Controle por tipo de custo',
      icon: Calculator,
      link: '/admin/orcamentos-area',
      color: 'from-emerald-500 to-teal-500',
      visible: canEditForms,
    },
  ].filter(card => card.visible);

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <section className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">
            Que bom ter você de volta, {userName}! 👋
          </h1>
          <p className="text-muted-foreground capitalize">{today}</p>
        </section>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <section className="space-y-3">
            {alerts.map(alert => (
              <Card 
                key={alert.id} 
                className={`border-l-4 ${
                  alert.type === 'warning' ? 'border-l-yellow-500 bg-yellow-500/5' :
                  alert.type === 'info' ? 'border-l-blue-500 bg-blue-500/5' :
                  'border-l-green-500 bg-green-500/5'
                }`}
              >
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    {alert.type === 'warning' ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <Bell className="h-5 w-5 text-blue-500" />
                    )}
                    <div>
                      <p className="font-medium">{alert.title}</p>
                      <p className="text-sm text-muted-foreground">{alert.description}</p>
                    </div>
                  </div>
                  {alert.link && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={alert.link}>
                        Ver <ArrowRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </section>
        )}

        {/* KPIs Summary */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Resumo do Ano</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Investido</p>
                    <p className="text-2xl font-bold">
                      {loadingData ? <Loader2 className="h-5 w-5 animate-spin" /> : formatCurrency(kpis?.totalInvestido || 0)}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                </div>
                {!loadingData && kpis && kpis.deltaVsMesAnterior !== 0 && (
                  <div className="mt-2 flex items-center text-sm">
                    {kpis.deltaVsMesAnterior > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={kpis.deltaVsMesAnterior > 0 ? 'text-green-500' : 'text-red-500'}>
                      {kpis.deltaVsMesAnterior > 0 ? '+' : ''}{kpis.deltaVsMesAnterior.toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground ml-1">vs mês anterior</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Orçamento Total</p>
                    <p className="text-2xl font-bold">
                      {loadingData ? <Loader2 className="h-5 w-5 animate-spin" /> : formatCurrency(kpis?.totalOrcado || 0)}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-secondary" />
                  </div>
                </div>
                {!loadingData && kpis && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Utilizado</span>
                      <span className="font-medium">{kpis.percentualExecutado.toFixed(0)}%</span>
                    </div>
                    <div className="mt-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          kpis.percentualExecutado > 90 ? 'bg-red-500' :
                          kpis.percentualExecutado > 75 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(kpis.percentualExecutado, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Leads</p>
                    <p className="text-2xl font-bold">
                      {loadingData ? <Loader2 className="h-5 w-5 animate-spin" /> : formatNumber(kpis?.totalLeads || 0)}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Target className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Acumulado no ano</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo Disponível</p>
                    <p className="text-2xl font-bold">
                      {loadingData ? <Loader2 className="h-5 w-5 animate-spin" /> : formatCurrency((kpis?.totalOrcado || 0) - (kpis?.totalInvestido || 0))}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-500" />
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Para investir</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Action Cards */}
        <section>
          <h2 className="text-lg font-semibold mb-4">O que você quer fazer?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {actionCards.map((card, index) => (
              <Link key={index} to={card.link}>
                <Card className="h-full hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer group">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}>
                        <card.icon className="h-6 w-6 text-white" />
                      </div>
                      {card.badge && (
                        <Badge variant="destructive" className="animate-pulse">
                          {card.badge}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-4">
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {card.description}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Acessar <ArrowRight className="h-4 w-4 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Help Card */}
        <section>
          <Card className="bg-muted/50">
            <CardContent className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <HelpCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Precisa de ajuda?</h3>
                  <p className="text-sm text-muted-foreground">
                    Acesse nossa central de ajuda ou entre em contato
                  </p>
                </div>
              </div>
              <Button variant="outline" asChild>
                <Link to="/ajuda">
                  Central de Ajuda
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
};

export default Home;
