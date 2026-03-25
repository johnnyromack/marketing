import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { AdAccount, BalanceStatus } from "@/types/platform";
import { formatCurrency, getBalanceStatus, getPlatformLabel } from "@/lib/mock-data";
import { Facebook, Search, Music2 } from "lucide-react";

interface BalanceCardProps {
  account: AdAccount;
  className?: string;
}

const platformIcons = {
  meta: Facebook,
  google: Search,
  tiktok: Music2,
};

const statusStyles = {
  healthy: {
    bg: "bg-success/10",
    text: "text-success",
    progress: "bg-success",
    indicator: "🟢",
  },
  warning: {
    bg: "bg-warning/10",
    text: "text-warning",
    progress: "bg-warning",
    indicator: "🟡",
  },
  critical: {
    bg: "bg-danger/10",
    text: "text-danger",
    progress: "bg-danger",
    indicator: "🔴",
  },
};

export function BalanceCard({ account, className }: BalanceCardProps) {
  const { status, percentage, daysRemaining } = getBalanceStatus(account);
  const styles = statusStyles[status];
  const Icon = platformIcons[account.platform];

  return (
    <Card className={cn("transition-all hover:shadow-md", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", styles.bg)}>
              <Icon className={cn("h-4 w-4", styles.text)} />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">{account.name}</CardTitle>
              <p className="text-xs text-muted-foreground">{getPlatformLabel(account.platform)}</p>
            </div>
          </div>
          <span className="text-lg">{styles.indicator}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="mb-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold">{formatCurrency(account.currentBalance)}</span>
            <span className={cn("text-sm font-medium", styles.text)}>{percentage.toFixed(0)}%</span>
          </div>
          <Progress 
            value={percentage} 
            className="h-2"
            style={{
              // Override the indicator color based on status
              // @ts-ignore
              "--progress-indicator": `hsl(var(--status-${status === 'healthy' ? 'success' : status === 'warning' ? 'warning' : 'danger'}))`,
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Gasto diário: {formatCurrency(account.dailySpend)}</span>
          <span className={cn(daysRemaining <= 7 && styles.text)}>
            ~{daysRemaining} dias restantes
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
