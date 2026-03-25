import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Users,
  Target,
  Calculator,
  BarChart3,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { DualSimulationResult, CPLBandScenario, formatCurrency } from "@/lib/mediaCalculations";

interface ScenarioComparisonProps {
  result: DualSimulationResult;
  budget: number;
  enrollmentTarget: number;
  targetConversionRate: number;
}

function VariationBadge({ value, invert = false }: { value: number; invert?: boolean }) {
  const isPositive = value > 0;
  const isNeutral = Math.abs(value) < 0.1;
  const colorClass = isNeutral
    ? "text-muted-foreground"
    : invert
      ? isPositive ? "text-destructive" : "text-[hsl(var(--success))]"
      : isPositive ? "text-[hsl(var(--success))]" : "text-destructive";

  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;

  return (
    <span className={cn("flex items-center gap-1 text-xs font-medium", colorClass)}>
      <Icon className="h-3 w-3" />
      {value >= 0 ? "+" : ""}{value.toFixed(1)}%
    </span>
  );
}

function ScenarioCard({
  title,
  color,
  children,
  badge,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
  badge?: string;
}) {
  return (
    <Card className="flex-1">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={cn("text-sm font-semibold flex items-center gap-2", color)}>
            {title}
          </CardTitle>
          {badge && (
            <Badge variant="outline" className="text-[10px]">
              {badge}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

function MetricRow({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="text-right">
        <span className="text-sm font-semibold">{value}</span>
        {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

export function ScenarioComparison({
  result,
  budget,
  enrollmentTarget,
  targetConversionRate,
}: ScenarioComparisonProps) {
  const { realistic, ideal, gap, comparison } = result;

  const hasGap = gap.budgetGap > 0;

  return (
    <div className="space-y-4">
      {/* Scenario cards side by side */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Realistic */}
        <ScenarioCard
          title="Cenário #1"
          color="text-[hsl(var(--chart-1))]"
          badge="Limitado pelo orçamento"
        >
          <MetricRow
            icon={<DollarSign className="h-4 w-4" />}
            label="Verba Disponível"
            value={formatCurrency(budget)}
          />
          <Separator />
          <MetricRow
            icon={<Users className="h-4 w-4" />}
            label="Leads Alcançáveis"
            value={realistic.achievableLeads.toLocaleString("pt-BR")}
          />
          <MetricRow
            icon={<Target className="h-4 w-4" />}
            label="Matrículas Previstas"
            value={realistic.achievableEnrollments.toLocaleString("pt-BR")}
            sub={`Meta: ${enrollmentTarget}`}
          />
          <Separator />
          <MetricRow
            icon={<Calculator className="h-4 w-4" />}
            label="CPL Projetado"
            value={formatCurrency(realistic.projectedCPL)}
          />
          <MetricRow
            icon={<Calculator className="h-4 w-4" />}
            label="CAC Projetado"
            value={formatCurrency(realistic.projectedCAC)}
          />
          <MetricRow
            icon={<TrendingUp className="h-4 w-4" />}
            label="Faturamento"
            value={formatCurrency(realistic.projectedRevenue)}
          />
          <MetricRow
            icon={<BarChart3 className="h-4 w-4" />}
            label="ROI"
            value={`${realistic.roi.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`}
          />
        </ScenarioCard>

        {/* Investimento Necessário */}
        <ScenarioCard
          title="Cenário #2"
          color="text-[hsl(var(--chart-2))]"
          badge="Para atingir a meta"
        >
          <MetricRow
            icon={<DollarSign className="h-4 w-4" />}
            label="Verba Necessária"
            value={formatCurrency(ideal.requiredBudget)}
            sub={ideal.requiredBudget > budget ? `+${formatCurrency(ideal.requiredBudget - budget)} além do disponível` : ideal.requiredBudget < budget ? `${formatCurrency(budget - ideal.requiredBudget)} de sobra` : "Exato"}
          />
          <Separator />
          <MetricRow
            icon={<Users className="h-4 w-4" />}
            label="Leads Necessários"
            value={ideal.requiredLeads.toLocaleString("pt-BR")}
          />
          <MetricRow
            icon={<Target className="h-4 w-4" />}
            label="Matrículas (Meta)"
            value={enrollmentTarget.toLocaleString("pt-BR")}
            sub={`Taxa: ${targetConversionRate}%`}
          />
          <Separator />
          <MetricRow
            icon={<Calculator className="h-4 w-4" />}
            label="CPL Projetado"
            value={formatCurrency(ideal.projectedCPL)}
          />
          <MetricRow
            icon={<Calculator className="h-4 w-4" />}
            label="CAC Projetado"
            value={formatCurrency(ideal.projectedCAC)}
          />
          <MetricRow
            icon={<TrendingUp className="h-4 w-4" />}
            label="Faturamento"
            value={formatCurrency(ideal.projectedRevenue)}
          />
          <MetricRow
            icon={<BarChart3 className="h-4 w-4" />}
            label="ROI"
            value={`${ideal.roi.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`}
          />
        </ScenarioCard>
      </div>

      {/* CPL Band */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Banda de CPL — Cenário #1 em 3 sub-projeções</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {([result.cplBand.pessimistic, result.cplBand.realistic, result.cplBand.optimistic] as CPLBandScenario[]).map((s) => {
              const colorClass =
                s.label === "Otimista"
                  ? "border-[hsl(var(--success))]/40 bg-[hsl(var(--success))]/5"
                  : s.label === "Pessimista"
                    ? "border-destructive/40 bg-destructive/5"
                    : "border-border bg-muted/30";
              const textColor =
                s.label === "Otimista"
                  ? "text-[hsl(var(--success))]"
                  : s.label === "Pessimista"
                    ? "text-destructive"
                    : "text-[hsl(var(--chart-1))]";
              return (
                <div key={s.label} className={cn("rounded-lg border p-3 space-y-2", colorClass)}>
                  <p className={cn("text-xs font-semibold uppercase tracking-wider", textColor)}>{s.label}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">CPL</span>
                      <span className="font-semibold">{formatCurrency(s.cpl)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Leads</span>
                      <span className="font-semibold">{s.achievableLeads.toLocaleString("pt-BR")}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Matrículas</span>
                      <span className="font-semibold">{s.achievableEnrollments.toLocaleString("pt-BR")}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">ROI</span>
                      <span className="font-semibold">{s.roi.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">Pessimista usa CPL máximo · Realista usa CPL médio · Otimista usa CPL mínimo</p>
        </CardContent>
      </Card>

      {/* Gap Analysis */}
      <Card className={cn(
        "border-2",
        hasGap ? "border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/5" : "border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/5"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            {hasGap ? (
              <AlertTriangle className="h-4 w-4 text-[hsl(var(--warning))]" />
            ) : (
              <Target className="h-4 w-4 text-[hsl(var(--success))]" />
            )}
            <span className="text-sm font-semibold">
              {hasGap ? "Análise de Gap — Verba insuficiente para a meta" : "Superávit — Orçamento acima do necessário"}
            </span>
          </div>

          {hasGap ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-background p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Verba adicional necessária</p>
                <p className="text-lg font-bold text-destructive">{formatCurrency(gap.budgetGap)}</p>
                <p className="text-[10px] text-muted-foreground">+{gap.budgetGapPercent.toFixed(1)}% sobre atual</p>
              </div>
              <div className="rounded-lg bg-background p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Matrículas em gap</p>
                <p className="text-lg font-bold text-destructive">{gap.enrollmentsGap.toLocaleString("pt-BR")}</p>
                <p className="text-[10px] text-muted-foreground">Com orçamento atual: {gap.enrollmentsWithCurrentBudget.toLocaleString("pt-BR")} de {enrollmentTarget.toLocaleString("pt-BR")}</p>
              </div>
              <div className="rounded-lg bg-background p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Leads faltantes</p>
                <p className="text-lg font-bold text-destructive">{gap.leadsGap.toLocaleString("pt-BR")}</p>
                <p className="text-[10px] text-muted-foreground">Com orçamento atual: {gap.leadsWithCurrentBudget.toLocaleString("pt-BR")}</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-background p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Verba excedente</p>
                <p className="text-lg font-bold text-[hsl(var(--success))]">{formatCurrency(Math.abs(gap.budgetGap))}</p>
                <p className="text-[10px] text-muted-foreground">{Math.abs(gap.budgetGapPercent).toFixed(1)}% acima do necessário</p>
              </div>
              <div className="rounded-lg bg-background p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Matrículas extras projetadas</p>
                <p className="text-lg font-bold text-[hsl(var(--success))]">+{Math.abs(gap.enrollmentsGap).toLocaleString("pt-BR")}</p>
              </div>
              <div className="rounded-lg bg-background p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Leads adicionais</p>
                <p className="text-lg font-bold text-[hsl(var(--success))]">+{Math.abs(gap.leadsGap).toLocaleString("pt-BR")}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Variation vs previous campaign */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Variação vs Campanha Anterior</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-5">
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground">CPL</p>
              <VariationBadge value={comparison.cplVariation} invert />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground">CAC</p>
              <VariationBadge value={comparison.cacVariation} invert />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground">Leads</p>
              <VariationBadge value={comparison.leadsVariation} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground">Conversão</p>
              <VariationBadge value={comparison.conversionRateVariation} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground">Faturamento</p>
              <VariationBadge value={comparison.revenueVariation} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
