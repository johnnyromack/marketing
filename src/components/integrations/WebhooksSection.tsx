import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Webhook, Copy, RefreshCw, CheckCircle2, XCircle, Eye, EyeOff, AlertCircle, Clock, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

interface WebhookConfig {
  id: string;
  webhook_type: string;
  secret_key: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface WebhookLog {
  id: string;
  webhook_type: string;
  status: string;
  records_processed: number;
  error_message: string | null;
  created_at: string;
}

const webhookInfo = {
  meta: {
    name: "Meta Ads",
    description: "Receba dados de campanhas do Facebook e Instagram",
    endpoint: "webhook-meta",
  },
  google: {
    name: "Google Ads",
    description: "Receba dados de campanhas do Google",
    endpoint: "webhook-google",
  },
  tiktok: {
    name: "TikTok Ads",
    description: "Receba dados de campanhas do TikTok",
    endpoint: "webhook-tiktok",
  },
  saldos: {
    name: "Saldos das Contas",
    description: "Atualize saldos em tempo real",
    endpoint: "webhook-saldos",
  },
};

export const WebhooksSection = () => {
  const [configs, setConfigs] = useState<WebhookConfig[]>([]);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [syncing, setSyncing] = useState<string | null>(null);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [configsRes, logsRes] = await Promise.all([
        supabase.from("webhook_configs").select("*").order("webhook_type"),
        supabase.from("webhook_logs").select("*").order("created_at", { ascending: false }).limit(5),
      ]);

      if (configsRes.data) setConfigs(configsRes.data);
      if (logsRes.data) setLogs(logsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const getWebhookUrl = (webhookType: string) => {
    const info = webhookInfo[webhookType as keyof typeof webhookInfo];
    if (!info) return "";
    return `${supabaseUrl}/functions/v1/${info.endpoint}`;
  };

  const getLastSync = (webhookType: string) => {
    const lastLog = logs.find(
      (log) => log.webhook_type === webhookType && log.status === "success"
    );
    if (!lastLog) return null;
    return formatDistanceToNow(new Date(lastLog.created_at), {
      addSuffix: true,
      locale: ptBR,
    });
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado para a área de transferência`);
  };

  const toggleSecret = (id: string) => {
    setShowSecrets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleActive = async (config: WebhookConfig) => {
    try {
      const { error } = await supabase
        .from("webhook_configs")
        .update({ is_active: !config.is_active })
        .eq("id", config.id);

      if (error) throw error;

      setConfigs((prev) =>
        prev.map((c) => (c.id === config.id ? { ...c, is_active: !c.is_active } : c))
      );
      toast.success(
        config.is_active ? "Webhook desativado" : "Webhook ativado"
      );
    } catch (error) {
      console.error("Error toggling webhook:", error);
      toast.error("Erro ao alterar status do webhook");
    }
  };

  const handleRefreshLogs = async () => {
    setSyncing("logs");
    await fetchData();
    setSyncing(null);
    toast.success("Logs atualizados");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="secondary" className="bg-success/10 text-success">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Sucesso
          </Badge>
        );
      case "error":
        return (
          <Badge variant="secondary" className="bg-destructive/10 text-destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Erro
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="bg-warning/10 text-warning">
            <Clock className="mr-1 h-3 w-3" />
            Pendente
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Webhooks</CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-medium">Como configurar no Make</h3>
              <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                <li>Copie a <strong>URL do Webhook</strong> e use como destino do módulo HTTP no Make</li>
                <li>Adicione o header <code className="bg-muted px-1 rounded">x-webhook-secret</code> com a <strong>Chave Secreta</strong></li>
                <li>Configure o corpo da requisição conforme a documentação da API</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Webhooks */}
      <div className="grid gap-6 md:grid-cols-2">
        {configs.map((config) => {
          const info = webhookInfo[config.webhook_type as keyof typeof webhookInfo];
          if (!info) return null;
          
          const lastSync = getLastSync(config.webhook_type);

          return (
            <Card key={config.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Webhook className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{info.name}</CardTitle>
                      <CardDescription>{info.description}</CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      config.is_active
                        ? "bg-success/10 text-success cursor-pointer"
                        : "bg-muted text-muted-foreground cursor-pointer"
                    }
                    onClick={() => handleToggleActive(config)}
                  >
                    {config.is_active ? (
                      <>
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Ativo
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-1 h-3 w-3" />
                        Inativo
                      </>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>URL do Webhook</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={getWebhookUrl(config.webhook_type)}
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopy(getWebhookUrl(config.webhook_type), "URL")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Chave Secreta</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      type={showSecrets[config.id] ? "text" : "password"}
                      value={config.secret_key}
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleSecret(config.id)}
                    >
                      {showSecrets[config.id] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopy(config.secret_key, "Chave")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {lastSync && (
                  <p className="text-xs text-muted-foreground">
                    Última sincronização: {lastSync}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Logs Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Últimas Sincronizações</CardTitle>
              <CardDescription>Últimos 5 logs de sincronização</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshLogs}
                disabled={syncing === "logs"}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${syncing === "logs" ? "animate-spin" : ""}`}
                />
                Atualizar
              </Button>
              <Button variant="default" size="sm" asChild>
                <Link to="/sync-logs">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Ver todos
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <RefreshCw className="mb-4 h-10 w-10 text-muted-foreground/50" />
              <p className="text-muted-foreground">Nenhum log encontrado.</p>
              <p className="text-sm text-muted-foreground">
                Configure os webhooks no Make para começar.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => {
                const info = webhookInfo[log.webhook_type as keyof typeof webhookInfo];
                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                        <Webhook className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {info?.name || log.webhook_type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(log.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                          {log.records_processed > 0 &&
                            ` • ${log.records_processed} registros`}
                        </p>
                        {log.error_message && (
                          <p className="text-xs text-destructive mt-1 line-clamp-1">
                            {log.error_message}
                          </p>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(log.status)}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
