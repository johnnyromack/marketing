import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { AppHeader } from '@/components/AppHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, History, User, Calendar, FileText, RefreshCw, Wifi, WifiOff, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getActivityCategory, type ActivityCategory, type ActivityAction } from '@/hooks/useActivityLog';

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

type FilterCategory = 'all' | ActivityCategory;

const CATEGORY_OPTIONS: { value: FilterCategory; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'cadastros', label: 'Cadastros' },
  { value: 'orcamentos', label: 'Orçamentos' },
  { value: 'aprovacoes', label: 'Aprovações' },
  { value: 'visualizacoes', label: 'Visualizações' },
  { value: 'usuarios', label: 'Usuários' },
];

const TABLE_NAME_LABELS: Record<string, string> = {
  marcas: 'Marcas',
  unidades: 'Unidades',
  fornecedores: 'Fornecedores',
  orcamentos: 'Orçamentos',
  midia_on: 'Mídia On',
  midia_off: 'Mídia Off',
  eventos: 'Eventos',
  brindes: 'Brindes',
  publicidade_dados: 'Performance',
  user_roles: 'Usuários',
};

const ActivityLogs = () => {
  const { user, loading: authLoading } = useAuth();
  const { canViewLogs, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('all');

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        navigate('/auth');
      } else if (!canViewLogs) {
        navigate('/');
      }
    }
  }, [user, authLoading, roleLoading, canViewLogs, navigate]);

  const fetchLogs = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    
    const { data, error } = await supabase
      .from('activity_logs' as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200) as { data: ActivityLog[] | null; error: any };

    if (!error && data) {
      // Fetch user profiles for each log
      const userIds = [...new Set(data.map(log => log.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      const logsWithUsers = data.map(log => ({
        ...log,
        user_email: profileMap.get(log.user_id)?.email || 'Desconhecido',
        user_name: profileMap.get(log.user_id)?.full_name || 'Usuário',
      }));
      
      setLogs(logsWithUsers);
      setLastUpdated(new Date());
    } else if (error) {
      toast({ title: 'Erro', description: 'Erro ao carregar logs', variant: 'destructive' });
    }
    
    setIsLoading(false);
    setIsRefreshing(false);
  }, [toast]);

  useEffect(() => {
    if (user && canViewLogs) {
      fetchLogs();
    }
  }, [user, canViewLogs, fetchLogs]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user || !canViewLogs) return;

    const channel = supabase
      .channel('activity-logs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs'
        },
        async (payload) => {
          console.log('New activity log:', payload);
          // Fetch user info for the new log
          const newLog = payload.new as ActivityLog;
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', newLog.user_id)
            .maybeSingle();

          const logWithUser = {
            ...newLog,
            user_email: profile?.email || 'Desconhecido',
            user_name: profile?.full_name || 'Usuário',
          };

          setLogs(prev => [logWithUser, ...prev.slice(0, 199)]);
          setLastUpdated(new Date());
          
          toast({
            title: 'Nova atividade',
            description: `${logWithUser.user_name} realizou: ${newLog.action} em ${newLog.table_name}`,
          });
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        setIsRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, canViewLogs, toast]);

  const handleRefresh = () => {
    fetchLogs(true);
  };

  // Get category from log
  const getLogCategory = (log: ActivityLog): ActivityCategory => {
    // Check if category is already stored in details
    if (log.details?.category && typeof log.details.category === 'string') {
      return log.details.category as ActivityCategory;
    }
    // Fallback to computing category
    return getActivityCategory(log.table_name, log.action as ActivityAction);
  };

  // Filter logs based on selected category
  const filteredLogs = categoryFilter === 'all' 
    ? logs 
    : logs.filter(log => getLogCategory(log) === categoryFilter);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'delete':
        return <Badge variant="destructive">Exclusão</Badge>;
      case 'insert':
        return <Badge className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">Inserção</Badge>;
      case 'update':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">Edição</Badge>;
      case 'status_change':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800">Mudança Status</Badge>;
      case 'approve':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">Aprovação</Badge>;
      case 'reject':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800">Rejeição</Badge>;
      case 'view':
        return <Badge variant="outline">Visualização</Badge>;
      case 'create_user':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800">Novo Usuário</Badge>;
      case 'reset_password':
        return <Badge className="bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800">Reset Senha</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const getCategoryBadge = (log: ActivityLog) => {
    const category = getLogCategory(log);
    const colors: Record<ActivityCategory, string> = {
      cadastros: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-400',
      orcamentos: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400',
      aprovacoes: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400',
      visualizacoes: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-900/30 dark:text-slate-400',
      usuarios: 'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-900/30 dark:text-violet-400',
    };
    const labels: Record<ActivityCategory, string> = {
      cadastros: 'Cadastro',
      orcamentos: 'Orçamento',
      aprovacoes: 'Aprovação',
      visualizacoes: 'Visualização',
      usuarios: 'Usuário',
    };
    return <Badge className={colors[category]}>{labels[category]}</Badge>;
  };

  const getTableLabel = (tableName: string) => {
    return TABLE_NAME_LABELS[tableName] || tableName;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    return `Atualizado às ${lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  };

  // Format details excluding category
  const formatDetails = (details: Record<string, unknown> | null) => {
    if (!details) return null;
    const filtered = Object.entries(details).filter(([key]) => key !== 'category');
    if (filtered.length === 0) return null;
    return filtered;
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!canViewLogs) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background transition-[margin] duration-200" style={{ marginLeft: 'var(--sidebar-w, 15rem)' }}>
      <AppHeader />

      <main className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Histórico de Atividades
                </CardTitle>
                <CardDescription>
                  Registro de todas as ações realizadas pelos usuários
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {/* Category filter */}
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={categoryFilter} onValueChange={(v: FilterCategory) => setCategoryFilter(v)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filtrar por" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Realtime status indicator */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {isRealtimeConnected ? (
                    <>
                      <Wifi className="h-3 w-3 text-green-500" />
                      <span className="text-green-600">Tempo real</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3 text-yellow-500" />
                      <span className="text-yellow-600">Offline</span>
                    </>
                  )}
                </div>
                
                {/* Last updated indicator */}
                {lastUpdated && (
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {formatLastUpdated()}
                  </span>
                )}
                
                {/* Refresh button */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {categoryFilter === 'all' 
                  ? 'Nenhuma atividade registrada ainda.'
                  : `Nenhuma atividade na categoria "${CATEGORY_OPTIONS.find(o => o.value === categoryFilter)?.label}".`}
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-4">
                  Exibindo {filteredLogs.length} {filteredLogs.length === 1 ? 'registro' : 'registros'}
                  {categoryFilter !== 'all' && ` (filtrado por ${CATEGORY_OPTIONS.find(o => o.value === categoryFilter)?.label})`}
                </p>
                {filteredLogs.map((log) => {
                  const detailsFiltered = formatDetails(log.details);
                  return (
                    <div
                      key={log.id}
                      className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {getCategoryBadge(log)}
                          {getActionBadge(log.action)}
                          <span className="text-sm font-medium">{getTableLabel(log.table_name)}</span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2 flex-wrap">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {log.user_name} ({log.user_email})
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(log.created_at)}
                          </span>
                        </div>

                        {detailsFiltered && detailsFiltered.length > 0 && (
                          <div className="flex items-start gap-1 text-xs text-muted-foreground bg-muted/50 rounded p-2">
                            <FileText className="h-3 w-3 mt-0.5" />
                            <span>
                              {detailsFiltered.map(([key, value]) => (
                                <span key={key} className="mr-2">
                                  <strong>{key}:</strong> {String(value)}
                                </span>
                              ))}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ActivityLogs;