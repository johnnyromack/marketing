import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Wallet, CalendarClock, TrendingDown, AlertTriangle, Building2 } from "lucide-react";

interface BrandBudgetCardProps {
  brandName: string;
  manualBalance: number;
  dailyBudget: number;
  todaySpend: number;
  daysRemaining: number;
  className?: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export function BrandBudgetCard({
  brandName,
  manualBalance,
  dailyBudget,
  todaySpend,
  daysRemaining,
  className,
}: BrandBudgetCardProps) {
  const hasBalance = manualBalance > 0;
  const hasBudget = dailyBudget > 0;
  const budgetProgress = hasBudget ? Math.min((todaySpend / dailyBudget) * 100, 100) : 0;
  const isOverBudget = budgetProgress >= 100;
  const isNearBudget = budgetProgress >= 80 && budgetProgress < 100;
  
  const getStatus = () => {
    if (daysRemaining <= 3) return "critical";
    if (daysRemaining <= 7) return "warning";
    return "healthy";
  };
  
  const status = getStatus();

  return (
    <Card className={cn(
      "transition-all",
      status === "critical" && hasBalance && "border-destructive/50",
      status === "warning" && hasBalance && "border-warning/50",
      className
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">{brandName}</CardTitle>
          </div>
          {hasBalance && status !== "healthy" && (
            <Badge variant={status === "critical" ? "destructive" : "secondary"} className="text-xs">
              {status === "critical" ? (
                <><AlertTriangle className="h-3 w-3 mr-1" />Crítico</>
              ) : (
                <><TrendingDown className="h-3 w-3 mr-1" />Atenção</>
              )}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Balance */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className={cn(
              "h-4 w-4",
              status === "critical" && "text-destructive",
              status === "warning" && "text-warning",
              status === "healthy" && "text-muted-foreground"
            )} />
            <span className="text-sm text-muted-foreground">Saldo</span>
          </div>
          <span className={cn(
            "font-semibold",
            status === "critical" && hasBalance && "text-destructive",
            status === "warning" && hasBalance && "text-warning"
          )}>
            {formatCurrency(manualBalance)}
          </span>
        </div>

        {/* Daily Budget Progress */}
        {hasBudget && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Orçamento Diário</span>
              </div>
              <span className="font-medium">{formatCurrency(dailyBudget)}</span>
            </div>
            <Progress 
              value={budgetProgress} 
              className={cn(
                "h-2",
                isOverBudget && "[&>div]:bg-destructive",
                isNearBudget && "[&>div]:bg-warning"
              )} 
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className={cn(
                isOverBudget && "text-destructive font-medium",
                isNearBudget && "text-warning"
              )}>
                Consumido: {formatCurrency(todaySpend)}
              </span>
              <span className={cn(
                isOverBudget && "text-destructive font-medium",
                isNearBudget && "text-warning"
              )}>
                {budgetProgress.toFixed(0)}%
              </span>
            </div>
          </div>
        )}

        {/* Days Remaining */}
        {hasBalance && hasBudget && (
          <div className={cn(
            "text-center py-2 rounded-lg text-sm",
            status === "critical" && "bg-destructive/10 text-destructive",
            status === "warning" && "bg-warning/10 text-warning",
            status === "healthy" && "bg-muted text-muted-foreground"
          )}>
            ~{daysRemaining} dias restantes de saldo
          </div>
        )}
      </CardContent>
    </Card>
  );
}
