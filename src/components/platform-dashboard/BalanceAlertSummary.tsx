import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { usePlatformAccounts } from "@/hooks/usePlatformData";
import { getBalanceStatus } from "@/lib/mock-data";
import { Platform } from "@/types/platform";

interface BalanceAlertSummaryProps {
  brandId?: string;
}

export function BalanceAlertSummary({ brandId }: BalanceAlertSummaryProps) {
  const { data: accounts = [] } = usePlatformAccounts();

  const summary = useMemo(() => {
    const filtered = brandId 
      ? accounts.filter(a => a.marca_id === brandId)
      : accounts;

    let critical = 0;
    let warning = 0;
    let healthy = 0;

    filtered.forEach(account => {
      const adAccount = {
        id: account.id,
        name: account.account_name,
        platform: account.platform as Platform,
        currentBalance: account.balance || 0,
        totalBudget: (account.balance || 0) * 1.5,
        currency: account.currency || "BRL",
        dailySpend: 0,
        brandId: account.marca_id || "",
      };
      const { status } = getBalanceStatus(adAccount);
      
      if (status === "critical") critical++;
      else if (status === "warning") warning++;
      else healthy++;
    });

    return { critical, warning, healthy, total: filtered.length };
  }, [accounts, brandId]);

  if (summary.total === 0) return null;

  const hasAlerts = summary.critical > 0 || summary.warning > 0;

  return (
    <Card className={hasAlerts ? "border-warning/50 bg-warning/5" : "border-success/50 bg-success/5"}>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${hasAlerts ? "bg-warning/10" : "bg-success/10"}`}>
            {hasAlerts ? (
              <AlertTriangle className="h-5 w-5 text-warning" />
            ) : (
              <CheckCircle className="h-5 w-5 text-success" />
            )}
          </div>
          <div>
            <p className="font-medium">
              {hasAlerts ? "Atenção aos Saldos" : "Saldos Saudáveis"}
            </p>
            <p className="text-sm text-muted-foreground">
              {summary.critical > 0 && (
                <span className="text-danger font-medium">{summary.critical} crítico{summary.critical > 1 ? "s" : ""}</span>
              )}
              {summary.critical > 0 && summary.warning > 0 && " • "}
              {summary.warning > 0 && (
                <span className="text-warning font-medium">{summary.warning} em alerta</span>
              )}
              {(summary.critical > 0 || summary.warning > 0) && summary.healthy > 0 && " • "}
              {summary.healthy > 0 && (
                <span className="text-success">{summary.healthy} ok</span>
              )}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/saldos-contas" className="gap-2">
            <Wallet className="h-4 w-4" />
            Ver Saldos
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
