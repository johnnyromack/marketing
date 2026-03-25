import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { usePlatformAccounts, useCampaigns, useBrands, getBrandDisplayName, useAccountDailySpending } from "@/hooks/usePlatformData";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Clock, Loader2, Pencil, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { GoogleAdsIcon, MetaIcon, TikTokIcon } from "@/components/icons/PlatformIcons";
import { Progress } from "@/components/ui/progress";

type FilterStatus = "all" | "healthy" | "warning" | "critical";

const platformIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  meta: MetaIcon,
  google: GoogleAdsIcon,
  tiktok: TikTokIcon,
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

// Calculate balance status based on daily spend projection
const getBalanceStatus = (balance: number, dailySpend: number) => {
  if (balance <= 0 || dailySpend <= 0) {
    return { status: "healthy" as const, percentage: 100, daysRemaining: 999 };
  }

  const daysRemaining = balance / dailySpend;

  if (daysRemaining <= 3) {
    return { status: "critical" as const, percentage: Math.min((daysRemaining / 30) * 100, 100), daysRemaining };
  } else if (daysRemaining <= 7) {
    return { status: "warning" as const, percentage: Math.min((daysRemaining / 30) * 100, 100), daysRemaining };
  } else {
    return { status: "healthy" as const, percentage: Math.min((daysRemaining / 30) * 100, 100), daysRemaining };
  }
};

// Calculate consumption percentage based on 30-day projection
const getConsumptionProgress = (balance: number, dailySpend: number) => {
  if (balance <= 0 || dailySpend <= 0) {
    return { consumed: 0, remaining: 100 };
  }

  const targetBudget30Days = dailySpend * 30;
  const remainingPercentage = Math.min((balance / targetBudget30Days) * 100, 100);
  const consumedPercentage = 100 - remainingPercentage;

  return {
    consumed: Math.max(0, consumedPercentage),
    remaining: Math.max(0, remainingPercentage)
  };
};

const SaldosContas = () => {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const { data: accounts = [], isLoading } = usePlatformAccounts();
  const { data: campaigns = [] } = useCampaigns();
  const { data: brands = [] } = useBrands(true);
  const { data: dailySpendingByAccount = {} } = useAccountDailySpending();
  const queryClient = useQueryClient();

  const [editingAccount, setEditingAccount] = useState<{ id: string; account_name: string; balance: number; brandId: string | null } | null>(null);
  const [editingDailyBudget, setEditingDailyBudget] = useState<{ brandId: string; brandName: string; currentBudget: number } | null>(null);
  const [newBalance, setNewBalance] = useState("");
  const [newDailyBudget, setNewDailyBudget] = useState("");
  const [saving, setSaving] = useState(false);

  const getAccountDailySpend = (accountId: string) => {
    return dailySpendingByAccount[accountId] || 0;
  };

  const getAccountConfiguredBudget = (accountId: string) => {
    const accountCampaigns = campaigns.filter(
      c => c.account_id === accountId && c.status === "active"
    );
    return accountCampaigns.reduce((sum, c) => sum + (c.daily_budget || 0), 0);
  };

  const getBrandInfo = (brandId: string | null) => {
    if (!brandId) return { name: null, dailyBudget: 0 };
    const brand = brands.find(b => b.id === brandId);
    return brand
      ? { name: getBrandDisplayName(brand), dailyBudget: brand.daily_budget || 0 }
      : { name: null, dailyBudget: 0 };
  };

  const handleEditClick = (account: { id: string; account_name: string; balance: number | null; marca_id: string | null }) => {
    setEditingAccount({
      id: account.id,
      account_name: account.account_name,
      balance: account.balance || 0,
      brandId: account.marca_id
    });
    setNewBalance(String(account.balance || 0));
  };

  const handleEditDailyBudget = (brandId: string, brandName: string, currentBudget: number) => {
    setEditingDailyBudget({ brandId, brandName, currentBudget });
    setNewDailyBudget(String(currentBudget));
  };

  const handleSaveBalance = async () => {
    if (!editingAccount) return;

    setSaving(true);
    try {
      const balanceValue = parseFloat(newBalance.replace(",", ".")) || 0;

      const { error } = await supabase
        .from("platform_accounts")
        .update({
          balance: balanceValue,
          last_sync_at: new Date().toISOString()
        })
        .eq("id", editingAccount.id);

      if (error) throw error;

      toast.success("Saldo atualizado!");
      queryClient.invalidateQueries({ queryKey: ["platform_accounts"] });
      setEditingAccount(null);
    } catch (error) {
      console.error("Error updating balance:", error);
      toast.error("Erro ao atualizar saldo");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDailyBudget = async () => {
    if (!editingDailyBudget) return;

    setSaving(true);
    try {
      const budgetValue = parseFloat(newDailyBudget.replace(",", ".")) || 0;

      const { error } = await supabase
        .from("marcas")
        .update({
          daily_budget: budgetValue,
          updated_at: new Date().toISOString()
        })
        .eq("id", editingDailyBudget.brandId);

      if (error) throw error;

      toast.success("Orcamento diario atualizado!");
      queryClient.invalidateQueries({ queryKey: ["marcas"] });
      setEditingDailyBudget(null);
    } catch (error) {
      console.error("Error updating daily budget:", error);
      toast.error("Erro ao atualizar orcamento");
    } finally {
      setSaving(false);
    }
  };

  // Enrich accounts with calculated data
  const enrichedAccounts = accounts
    .filter(account => account.account_name && account.account_id)
    .map((account) => {
      const dailySpend = getAccountDailySpend(account.id);
      const configuredBudget = getAccountConfiguredBudget(account.id);
      const balance = account.balance || 0;
      const balanceStatus = getBalanceStatus(balance, dailySpend);
      const consumption = getConsumptionProgress(balance, dailySpend);
      const brandInfo = getBrandInfo(account.marca_id);

      const budgetDiff = brandInfo.dailyBudget > 0
        ? ((dailySpend - brandInfo.dailyBudget) / brandInfo.dailyBudget) * 100
        : 0;

      return {
        ...account,
        dailySpend,
        configuredBudget,
        manualDailyBudget: brandInfo.dailyBudget,
        balanceStatus,
        consumption,
        budgetDiff,
        brandName: brandInfo.name,
      };
    })
    .filter((account) => filterStatus === "all" || account.balanceStatus.status === filterStatus)
    .sort((a, b) => a.balanceStatus.daysRemaining - b.balanceStatus.daysRemaining);

  const criticalCount = enrichedAccounts.filter((a) => a.balanceStatus.status === "critical").length;
  const warningCount = enrichedAccounts.filter((a) => a.balanceStatus.status === "warning").length;
  const healthyCount = enrichedAccounts.filter((a) => a.balanceStatus.status === "healthy").length;
  const totalBalance = enrichedAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Saldos e Contas</h1>
            <p className="text-muted-foreground">
              Monitore os saldos de todas as suas contas de anuncios
            </p>
          </div>
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Saldo Total</p>
                <p className="text-lg font-bold">{formatCurrency(totalBalance)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Status Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{criticalCount}</p>
                <p className="text-sm text-muted-foreground">Contas criticas (&lt;3 dias)</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-500">{warningCount}</p>
                <p className="text-sm text-muted-foreground">Contas em atencao (3-7 dias)</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-500">{healthyCount}</p>
                <p className="text-sm text-muted-foreground">Contas saudaveis (&gt;7 dias)</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("all")}
          >
            Todas ({enrichedAccounts.length})
          </Button>
          <Button
            variant={filterStatus === "critical" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("critical")}
            className={cn(filterStatus === "critical" && "bg-destructive hover:bg-destructive/90")}
          >
            Criticas ({criticalCount})
          </Button>
          <Button
            variant={filterStatus === "warning" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("warning")}
            className={cn(filterStatus === "warning" && "bg-amber-500 text-white hover:bg-amber-500/90")}
          >
            Atencao ({warningCount})
          </Button>
          <Button
            variant={filterStatus === "healthy" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("healthy")}
            className={cn(filterStatus === "healthy" && "bg-emerald-500 hover:bg-emerald-500/90")}
          >
            Saudaveis ({healthyCount})
          </Button>
        </div>

        {/* Accounts Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {enrichedAccounts.map((account) => {
            const Icon = platformIcons[account.platform];
            const statusColors = {
              critical: "border-destructive/30 bg-destructive/5",
              warning: "border-amber-500/30 bg-amber-500/5",
              healthy: "border-emerald-500/30 bg-emerald-500/5",
            };

            return (
              <Card
                key={account.id}
                className={cn("transition-all hover:shadow-lg", statusColors[account.balanceStatus.status])}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {Icon && (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background">
                          <Icon className="h-5 w-5" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-base">{account.account_name}</CardTitle>
                        {account.brandName && (
                          <p className="text-xs text-muted-foreground">{account.brandName}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleEditClick(account)}
                      title="Editar saldo"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-baseline justify-between">
                    <p className="text-2xl font-bold">{formatCurrency(account.balance || 0)}</p>
                    <p className="text-sm text-muted-foreground">
                      {account.balanceStatus.daysRemaining < 999
                        ? `~${Math.round(account.balanceStatus.daysRemaining)} dias`
                        : "--"
                      }
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="absolute left-0 h-full bg-amber-500 transition-all"
                        style={{ width: `${account.consumption.consumed}%` }}
                      />
                      <div
                        className="absolute h-full bg-emerald-500 transition-all"
                        style={{
                          left: `${account.consumption.consumed}%`,
                          width: `${account.consumption.remaining}%`
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                        {account.consumption.consumed.toFixed(0)}% consumido
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                        {account.consumption.remaining.toFixed(0)}% restante
                      </span>
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      Base: projecao de 30 dias
                    </p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Orcamento diario:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-primary">
                          {account.manualDailyBudget > 0
                            ? formatCurrency(account.manualDailyBudget)
                            : "--"}
                        </span>
                        {account.marca_id && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => handleEditDailyBudget(
                              account.marca_id!,
                              account.brandName || "",
                              account.manualDailyBudget
                            )}
                            title="Editar orcamento"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Limite diario (Google):</span>
                      <span className="font-medium">{formatCurrency(account.configuredBudget)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Gasto diario real:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatCurrency(account.dailySpend)}</span>
                        {account.manualDailyBudget > 0 && account.dailySpend > 0 && (
                          <span className={cn(
                            "text-xs font-medium flex items-center gap-0.5",
                            account.budgetDiff > 0 ? "text-destructive" : "text-emerald-500"
                          )}>
                            {account.budgetDiff > 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {account.budgetDiff > 0 ? "+" : ""}{account.budgetDiff.toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Previsao (30 dias):</span>
                      <span className="font-medium text-green-600">
                        {account.balance > 0
                          ? formatCurrency(account.balance / 30)
                          : "--"}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-right text-muted-foreground capitalize">
                    {account.platform}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {enrichedAccounts.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">
                {filterStatus === "all"
                  ? "Nenhuma conta encontrada. Sincronize dados do Google Ads primeiro."
                  : "Nenhuma conta encontrada com esse filtro."
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Balance Dialog */}
      <Dialog open={!!editingAccount} onOpenChange={() => setEditingAccount(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Saldo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Conta</Label>
              <Input value={editingAccount?.account_name || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Saldo (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">
                Digite o saldo atual da conta de anuncios
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAccount(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveBalance} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Daily Budget Dialog */}
      <Dialog open={!!editingDailyBudget} onOpenChange={() => setEditingDailyBudget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Orcamento Diario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Marca</Label>
              <Input value={editingDailyBudget?.brandName || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Orcamento Diario (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={newDailyBudget}
                onChange={(e) => setNewDailyBudget(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">
                Defina o orcamento diario desejado para esta marca. Este valor sera comparado com o gasto real.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDailyBudget(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveDailyBudget} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default SaldosContas;
