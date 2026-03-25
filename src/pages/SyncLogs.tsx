import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Webhook, RefreshCw, CheckCircle2, XCircle, Clock, Search, ChevronLeft, ChevronRight, Filter, Download } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WebhookLog {
  id: string;
  webhook_type: string;
  status: string;
  records_processed: number;
  error_message: string | null;
  created_at: string;
}

const webhookInfo: Record<string, { name: string }> = {
  meta: { name: "Meta Ads" },
  google: { name: "Google Ads" },
  tiktok: { name: "TikTok Ads" },
  saldos: { name: "Saldos das Contas" },
};

const ITEMS_PER_PAGE = 15;

const SyncLogs = () => {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetchLogs();
  }, [currentPage, filterType, filterStatus]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase.from("webhook_logs").select("*", { count: "exact" });
      if (filterType !== "all") query = query.eq("webhook_type", filterType);
      if (filterStatus !== "all") query = query.eq("status", filterStatus);
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      const { data, count, error } = await query.order("created_at", { ascending: false }).range(from, to);
      if (error) throw error;
      setLogs(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast.error("Erro ao carregar logs");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setSyncing(true);
    await fetchLogs();
    setSyncing(false);
    toast.success("Logs atualizados");
  };

  const filteredLogs = useMemo(() => {
    if (!searchTerm) return logs;
    const term = searchTerm.toLowerCase();
    return logs.filter(log => {
      const typeName = webhookInfo[log.webhook_type]?.name || log.webhook_type;
      return typeName.toLowerCase().includes(term) || log.status.toLowerCase().includes(term) || log.error_message?.toLowerCase().includes(term);
    });
  }, [logs, searchTerm]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success": return <Badge variant="secondary" className="bg-success/10 text-success"><CheckCircle2 className="mr-1 h-3 w-3" />Sucesso</Badge>;
      case "error": return <Badge variant="secondary" className="bg-destructive/10 text-destructive"><XCircle className="mr-1 h-3 w-3" />Erro</Badge>;
      case "pending": return <Badge variant="secondary" className="bg-warning/10 text-warning"><Clock className="mr-1 h-3 w-3" />Pendente</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleExport = () => {
    const csvContent = [
      ["Data", "Tipo", "Status", "Registros", "Erro"].join(","),
      ...logs.map(log => [
        format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss"),
        webhookInfo[log.webhook_type]?.name || log.webhook_type,
        log.status,
        log.records_processed,
        log.error_message || ""
      ].join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `logs_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    toast.success("Logs exportados com sucesso");
  };

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Logs de Sincronizacao</h1>
            <p className="text-muted-foreground">Historico completo das sincronizacoes de webhooks</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Exportar</Button>
            <Button onClick={handleRefresh} disabled={syncing}><RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />Atualizar</Button>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar nos logs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <div className="flex gap-2">
                <Select value={filterType} onValueChange={(v) => { setFilterType(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[160px]"><Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="meta">Meta Ads</SelectItem>
                    <SelectItem value="google">Google Ads</SelectItem>
                    <SelectItem value="tiktok">TikTok Ads</SelectItem>
                    <SelectItem value="saldos">Saldos</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="success">Sucesso</SelectItem>
                    <SelectItem value="error">Erro</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Logs</CardTitle>
                <CardDescription>{totalCount} registro{totalCount !== 1 ? "s" : ""} encontrado{totalCount !== 1 ? "s" : ""}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12"><RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Webhook className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">Nenhum log encontrado.</p>
                <p className="text-sm text-muted-foreground">Os logs aparecerao aqui conforme as sincronizacoes ocorrerem.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map((log) => {
                  const info = webhookInfo[log.webhook_type];
                  return (
                    <div key={log.id} className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted"><Webhook className="h-5 w-5 text-muted-foreground" /></div>
                        <div>
                          <p className="font-medium">{info?.name || log.webhook_type}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}</span>
                            <span>-</span>
                            <span>{formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}</span>
                            {log.records_processed > 0 && (<><span>-</span><span>{log.records_processed} registros</span></>)}
                          </div>
                          {log.error_message && <p className="text-sm text-destructive mt-1">{log.error_message}</p>}
                        </div>
                      </div>
                      {getStatusBadge(log.status)}
                    </div>
                  );
                })}
              </div>
            )}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <p className="text-sm text-muted-foreground">Pagina {currentPage} de {totalPages}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4 mr-1" />Anterior</Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Proxima<ChevronRight className="h-4 w-4 ml-1" /></Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default SyncLogs;
