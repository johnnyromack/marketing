import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Monitor, Newspaper, CalendarDays, AlertCircle, ChevronDown } from "lucide-react";
import { formatCurrency, DualSimulationResult } from "@/lib/mediaCalculations";
import { cn } from "@/lib/utils";

export interface MediaSplit {
  on: number;
  off: number;
  eventos: number;
  cplOn: number;
  cplOff: number;
  cplEventos: number;
  conversionOn: number;
  conversionOff: number;
  conversionEventos: number;
}

interface MediaDistributionProps {
  split: MediaSplit;
  onSplitChange: (split: MediaSplit) => void;
  dualResult: DualSimulationResult;
  budget: number;
  targetConversionRate: number;
}

interface TypeBreakdown {
  label: string;
  icon: React.ReactNode;
  pct: number;
  investment: number;
  leads: number;
  enrollments: number;
}

function computeBreakdowns(
  totalBudget: number,
  totalLeads: number,
  totalEnrollments: number,
  split: MediaSplit
): TypeBreakdown[] {
  const channels = [
    {
      label: "Mídia ON",
      icon: <Monitor className="h-4 w-4" />,
      pct: split.on,
      cpl: split.cplOn,
      conv: split.conversionOn,
    },
    {
      label: "Mídia OFF",
      icon: <Newspaper className="h-4 w-4" />,
      pct: split.off,
      cpl: split.cplOff,
      conv: split.conversionOff,
    },
    {
      label: "Eventos",
      icon: <CalendarDays className="h-4 w-4" />,
      pct: split.eventos,
      cpl: split.cplEventos,
      conv: split.conversionEventos,
    },
  ];

  return channels.map((ch) => {
    const investment = (totalBudget * ch.pct) / 100;
    const leads =
      ch.cpl > 0
        ? Math.round(investment / ch.cpl)
        : Math.round((totalLeads * ch.pct) / 100);
    const enrollments =
      ch.conv > 0
        ? Math.round(leads * (ch.conv / 100))
        : Math.round((totalEnrollments * ch.pct) / 100);
    return { label: ch.label, icon: ch.icon, pct: ch.pct, investment, leads, enrollments };
  });
}

function BreakdownTable({ items }: { items: TypeBreakdown[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="pb-2 font-medium">Tipo de Mídia</th>
            <th className="pb-2 font-medium text-right">%</th>
            <th className="pb-2 font-medium text-right">Investimento</th>
            <th className="pb-2 font-medium text-right">Leads</th>
            <th className="pb-2 font-medium text-right">Matrículas</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.label} className="border-b last:border-0">
              <td className="py-2">
                <span className="flex items-center gap-2">
                  <span className="text-muted-foreground">{item.icon}</span>
                  {item.label}
                </span>
              </td>
              <td className="py-2 text-right font-medium">{item.pct}%</td>
              <td className="py-2 text-right">{formatCurrency(item.investment)}</td>
              <td className="py-2 text-right">{item.leads.toLocaleString("pt-BR")}</td>
              <td className="py-2 text-right">{item.enrollments.toLocaleString("pt-BR")}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-semibold">
            <td className="pt-2">Total</td>
            <td className="pt-2 text-right">{items.reduce((s, i) => s + i.pct, 0)}%</td>
            <td className="pt-2 text-right">{formatCurrency(items.reduce((s, i) => s + i.investment, 0))}</td>
            <td className="pt-2 text-right">{items.reduce((s, i) => s + i.leads, 0).toLocaleString("pt-BR")}</td>
            <td className="pt-2 text-right">{items.reduce((s, i) => s + i.enrollments, 0).toLocaleString("pt-BR")}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export function MediaDistribution({
  split,
  onSplitChange,
  dualResult,
  budget,
}: MediaDistributionProps) {
  const [cplOpen, setCplOpen] = useState(false);
  const total = split.on + split.off + split.eventos;
  const isValid = Math.abs(total - 100) < 0.1;

  const handleChange = (key: keyof MediaSplit, raw: string) => {
    const val = parseFloat(raw) || 0;
    onSplitChange({ ...split, [key]: val });
  };

  const realisticBreakdowns = computeBreakdowns(
    budget,
    dualResult.realistic.achievableLeads,
    dualResult.realistic.achievableEnrollments,
    split
  );

  const idealBreakdowns = computeBreakdowns(
    dualResult.ideal.requiredBudget,
    dualResult.ideal.requiredLeads,
    dualResult.ideal.monthlyDistribution.reduce((s, m) => s + m.enrollments, 0),
    split
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarDays className="h-5 w-5 text-[hsl(var(--chart-3))]" />
          Distribuição de Verba por Tipo de Mídia
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Percentage Inputs */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1.5">
              <Monitor className="h-3.5 w-3.5" /> Mídia ON (%)
            </Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={split.on}
              onChange={(e) => handleChange("on", e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1.5">
              <Newspaper className="h-3.5 w-3.5" /> Mídia OFF (%)
            </Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={split.off}
              onChange={(e) => handleChange("off", e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" /> Eventos (%)
            </Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={split.eventos}
              onChange={(e) => handleChange("eventos", e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>

        {!isValid && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            A soma dos percentuais deve ser 100%. Atual: {total.toFixed(1)}%
          </div>
        )}

        {/* Per-channel CPL and conversion */}
        <Collapsible open={cplOpen} onOpenChange={setCplOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-xs font-medium hover:bg-muted/50 transition-colors">
            <span>CPL e Taxa de Conversão por Canal</span>
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", cplOpen && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 space-y-3 rounded-md border bg-muted/20 p-3">
              <p className="text-[10px] text-muted-foreground">
                Defina CPL e conversão específicos por canal. Deixe em 0 para usar a proporção global.
              </p>
              {[
                { icon: <Monitor className="h-3.5 w-3.5" />, label: "Mídia ON", cplKey: "cplOn" as const, convKey: "conversionOn" as const },
                { icon: <Newspaper className="h-3.5 w-3.5" />, label: "Mídia OFF", cplKey: "cplOff" as const, convKey: "conversionOff" as const },
                { icon: <CalendarDays className="h-3.5 w-3.5" />, label: "Eventos", cplKey: "cplEventos" as const, convKey: "conversionEventos" as const },
              ].map((ch) => (
                <div key={ch.label} className="grid grid-cols-3 items-center gap-2">
                  <Label className="text-xs flex items-center gap-1.5 col-span-1">
                    {ch.icon} {ch.label}
                  </Label>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground">CPL (R$)</p>
                    <Input
                      type="number"
                      min={0}
                      value={split[ch.cplKey] || ""}
                      placeholder="0"
                      onChange={(e) => handleChange(ch.cplKey, e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground">Conversão (%)</p>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={split[ch.convKey] || ""}
                      placeholder="0"
                      onChange={(e) => handleChange(ch.convKey, e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {isValid && (
          <>
            <Separator />
            <Tabs defaultValue="realistic" className="w-full">
              <TabsList className="h-8 mb-3">
                <TabsTrigger value="realistic" className="text-xs px-3 h-6">Cenário #1 — Realista</TabsTrigger>
                <TabsTrigger value="ideal" className="text-xs px-3 h-6">Cenário #2 — Meta</TabsTrigger>
              </TabsList>
              <TabsContent value="realistic">
                <BreakdownTable items={realisticBreakdowns} />
              </TabsContent>
              <TabsContent value="ideal">
                <BreakdownTable items={idealBreakdowns} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
}
