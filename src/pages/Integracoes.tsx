import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdsIntegrations, AdsIntegration } from '@/hooks/useAdsIntegrations';
import { useMarcasUnidadesData } from '@/hooks/useMarcasUnidadesData';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Link2, Unlink, RefreshCw, Facebook, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const IntegrationCard = ({
  integration,
  onSync,
  onDisconnect,
  syncing,
}: {
  integration: AdsIntegration;
  onSync: () => void;
  onDisconnect: () => void;
  syncing: boolean;
}) => {
  const statusConfig = {
    active: { label: 'Ativo', variant: 'default' as const, icon: CheckCircle2 },
    expired: { label: 'Token Expirado', variant: 'destructive' as const, icon: AlertCircle },
    revoked: { label: 'Revogado', variant: 'destructive' as const, icon: AlertCircle },
    error: { label: 'Erro', variant: 'destructive' as const, icon: AlertCircle },
  };

  const status = statusConfig[integration.status];
  const StatusIcon = status.icon;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {integration.platform === 'meta' ? (
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                <Facebook className="h-5 w-5 text-white" />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-full bg-white border flex items-center justify-center">
                <GoogleIcon />
              </div>
            )}
            <div>
              <h3 className="font-medium">{integration.account_name || integration.account_id}</h3>
              <p className="text-sm text-muted-foreground">
                {integration.platform === 'meta' ? 'Meta Ads' : 'Google Ads'}
              </p>
            </div>
          </div>
          <Badge variant={status.variant} className="flex items-center gap-1">
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </Badge>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          {integration.last_sync_at ? (
            <p>
              Última sincronização:{' '}
              {format(new Date(integration.last_sync_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          ) : (
            <p>Nunca sincronizado</p>
          )}
          {integration.sync_error && (
            <p className="text-destructive mt-1">Erro: {integration.sync_error}</p>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSync}
            disabled={syncing || integration.status !== 'active'}
          >
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sincronizar
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Unlink className="h-4 w-4 mr-2" />
                Desconectar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Desconectar conta?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação irá remover a integração e todos os dados sincronizados desta conta.
                  Você poderá reconectar a qualquer momento.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onDisconnect}>Desconectar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};

const Integracoes = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const {
    integrations,
    loading,
    syncing,
    connectMeta,
    connectGoogle,
    syncIntegration,
    syncAll,
    disconnectIntegration,
  } = useAdsIntegrations();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const metaIntegrations = integrations.filter(i => i.platform === 'meta');
  const googleIntegrations = integrations.filter(i => i.platform === 'google');
  const hasActiveIntegrations = integrations.some(i => i.status === 'active');

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Integrações de Anúncios</h1>
            <p className="text-muted-foreground">
              Conecte suas contas do Meta Ads e Google Ads para sincronizar campanhas
            </p>
          </div>
          {hasActiveIntegrations && (
            <Button onClick={syncAll} disabled={syncing}>
              {syncing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Sincronizar Todas
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Meta Ads Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <Facebook className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>Meta Ads</CardTitle>
                  <CardDescription>Facebook e Instagram</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {metaIntegrations.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">
                    Nenhuma conta do Meta Ads conectada
                  </p>
                  <Button onClick={connectMeta}>
                    <Link2 className="h-4 w-4 mr-2" />
                    Conectar Meta Ads
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {metaIntegrations.map(integration => (
                    <IntegrationCard
                      key={integration.id}
                      integration={integration}
                      onSync={() => syncIntegration(integration.id, 'meta')}
                      onDisconnect={() => disconnectIntegration(integration.id)}
                      syncing={syncing}
                    />
                  ))}
                  <Button variant="outline" onClick={connectMeta} className="w-full">
                    <Link2 className="h-4 w-4 mr-2" />
                    Conectar Outra Conta
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Google Ads Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white border flex items-center justify-center">
                  <GoogleIcon />
                </div>
                <div>
                  <CardTitle>Google Ads</CardTitle>
                  <CardDescription>Search, Display e YouTube</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {googleIntegrations.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">
                    Nenhuma conta do Google Ads conectada
                  </p>
                  <Button onClick={connectGoogle}>
                    <Link2 className="h-4 w-4 mr-2" />
                    Conectar Google Ads
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {googleIntegrations.map(integration => (
                    <IntegrationCard
                      key={integration.id}
                      integration={integration}
                      onSync={() => syncIntegration(integration.id, 'google')}
                      onDisconnect={() => disconnectIntegration(integration.id)}
                      syncing={syncing}
                    />
                  ))}
                  <Button variant="outline" onClick={connectGoogle} className="w-full">
                    <Link2 className="h-4 w-4 mr-2" />
                    Conectar Outra Conta
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Como configurar</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-medium mb-2">Meta Ads (Facebook/Instagram)</h4>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Clique em "Conectar Meta Ads"</li>
                  <li>Faça login com sua conta do Facebook</li>
                  <li>Autorize o acesso às suas contas de anúncios</li>
                  <li>Suas campanhas serão sincronizadas automaticamente</li>
                </ol>
              </div>
              <div>
                <h4 className="text-lg font-medium mb-2">Google Ads</h4>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Clique em "Conectar Google Ads"</li>
                  <li>Faça login com sua conta Google</li>
                  <li>Autorize o acesso às suas contas de anúncios</li>
                  <li>Suas campanhas serão sincronizadas automaticamente</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Integracoes;
