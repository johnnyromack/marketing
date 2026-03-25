import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Target, TrendingDown, RotateCcw, Percent, Building2 } from "lucide-react";
import { CurrencyInput } from "./CurrencyInput";
import { ConversionCurveEditor } from "./ConversionCurveEditor";
import { AISimulationDialog } from "./AISimulationDialog";

interface PreviousCampaignData {
  budget: number;
  enrollments: number;
  enrollmentTarget: number;
  leads: number;
  conversionRate: number;
  cpl: number;
  cac: number;
  averageTicket: number;
}

interface InputSidebarProps {
  brandName: string;
  setBrandName: (name: string) => void;
  budget: number;
  setBudget: (value: number) => void;
  enrollmentTarget: number;
  setEnrollmentTarget: (value: number) => void;
  targetConversionRate: number;
  setTargetConversionRate: (value: number) => void;
  averageTicket: number;
  setAverageTicket: (value: number) => void;
  cplRange: { min: number; max: number };
  setCplRange: (range: { min: number; max: number }) => void;
  previousCampaign: PreviousCampaignData;
  setPreviousCampaign: (data: PreviousCampaignData) => void;
  conversionCurve: { month: string; percentage: number }[];
  setConversionCurve: (curve: { month: string; percentage: number }[]) => void;
  startMonth: number;
  endMonth: number;
  onStartMonthChange: (month: number) => void;
  onEndMonthChange: (month: number) => void;
  onReset: () => void;
  onAISimulation: (prompt: string) => void;
  isAILoading: boolean;
}

export function InputSidebar({
  brandName,
  setBrandName,
  budget,
  setBudget,
  enrollmentTarget,
  setEnrollmentTarget,
  targetConversionRate,
  setTargetConversionRate,
  averageTicket,
  setAverageTicket,
  cplRange,
  setCplRange,
  previousCampaign,
  setPreviousCampaign,
  conversionCurve,
  setConversionCurve,
  startMonth,
  endMonth,
  onStartMonthChange,
  onEndMonthChange,
  onReset,
  onAISimulation,
  isAILoading,
}: InputSidebarProps) {
  const updatePreviousCampaign = (field: keyof PreviousCampaignData, value: number) => {
    setPreviousCampaign({ ...previousCampaign, [field]: value });
  };

  const goalAchievement = previousCampaign.enrollmentTarget > 0
    ? ((previousCampaign.enrollments / previousCampaign.enrollmentTarget) * 100).toFixed(1)
    : "0.0";

  return (
    <aside className="flex h-full flex-col gap-6 overflow-y-auto border-r bg-muted/30 p-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Parâmetros</h2>
          <Button variant="ghost" size="sm" onClick={onReset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Resetar
          </Button>
        </div>
        
        <div className="space-y-1.5">
          <Label htmlFor="brandName" className="flex items-center gap-2 text-xs">
            <Building2 className="h-3 w-3" />
            Nome da Marca
          </Label>
          <Input
            id="brandName"
            type="text"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="Digite o nome da marca"
          />
        </div>

        <AISimulationDialog onSubmit={onAISimulation} isLoading={isAILoading} />
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--chart-1))]">
          <Target className="h-4 w-4" />
          Campanha Atual
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="budget" className="text-xs">
              Orçamento Total
            </Label>
            <CurrencyInput value={budget} onChange={setBudget} id="budget" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="target" className="text-xs">
              Meta de Matrículas
            </Label>
            <Input
              id="target"
              type="number"
              value={enrollmentTarget}
              onChange={(e) => setEnrollmentTarget(Number(e.target.value))}
              min={1}
              className="text-right"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="conversionRate" className="text-xs">
              Taxa de Conversão Meta
            </Label>
            <div className="relative">
              <Input
                id="conversionRate"
                type="number"
                value={targetConversionRate}
                onChange={(e) => setTargetConversionRate(Number(e.target.value))}
                min={0.1}
                max={100}
                step={0.1}
                className="pr-8 text-right"
              />
              <Percent className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="averageTicket" className="text-xs">
              Ticket Médio Anual
            </Label>
            <CurrencyInput value={averageTicket} onChange={setAverageTicket} id="averageTicket" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="cplMin" className="text-xs">
                CPL Mínimo
              </Label>
              <CurrencyInput
                value={cplRange.min}
                onChange={(v) => setCplRange({ ...cplRange, min: v })}
                id="cplMin"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cplMax" className="text-xs">
                CPL Máximo
              </Label>
              <CurrencyInput
                value={cplRange.max}
                onChange={(v) => setCplRange({ ...cplRange, max: v })}
                id="cplMax"
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--chart-2))]">
          <TrendingDown className="h-4 w-4" />
          Campanha Anterior
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="prevBudget" className="text-xs">
              Verba Investida
            </Label>
            <CurrencyInput
              value={previousCampaign.budget}
              onChange={(v) => updatePreviousCampaign("budget", v)}
              id="prevBudget"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
             <div className="space-y-1.5">
               <Label htmlFor="prevEnrollmentTarget" className="text-xs">
                 Meta
               </Label>
               <Input
                 id="prevEnrollmentTarget"
                 type="number"
                 value={previousCampaign.enrollmentTarget}
                 onChange={(e) => updatePreviousCampaign("enrollmentTarget", Number(e.target.value))}
                 min={0}
                 className="text-right"
               />
             </div>

             <div className="space-y-1.5">
               <Label htmlFor="prevLeads" className="text-xs">
                 Leads
               </Label>
               <Input
                 id="prevLeads"
                 type="number"
                 value={previousCampaign.leads}
                 onChange={(e) => updatePreviousCampaign("leads", Number(e.target.value))}
                 min={0}
                 className="text-right"
               />
             </div>

             <div className="space-y-1.5">
               <Label htmlFor="prevEnrollments" className="text-xs">
                 Matrículas
               </Label>
               <Input
                 id="prevEnrollments"
                 type="number"
                 value={previousCampaign.enrollments}
                 onChange={(e) => updatePreviousCampaign("enrollments", Number(e.target.value))}
                 min={0}
                 className="text-right"
               />
             </div>
           </div>

          <div className="rounded-lg border bg-muted/50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">% Atingido da Meta</span>
              <span className="text-sm font-semibold">{goalAchievement}%</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prevConversionRate" className="text-xs">
              Taxa de Conversão
            </Label>
            <div className="relative">
              <Input
                id="prevConversionRate"
                type="number"
                value={previousCampaign.conversionRate}
                onChange={(e) => updatePreviousCampaign("conversionRate", Number(e.target.value))}
                min={0}
                max={100}
                step={0.1}
                className="pr-8 text-right"
              />
              <Percent className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="prevCPL" className="text-xs">
                CPL
              </Label>
              <CurrencyInput
                value={previousCampaign.cpl}
                onChange={(v) => updatePreviousCampaign("cpl", v)}
                id="prevCPL"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prevCAC" className="text-xs">
                CAC
              </Label>
              <CurrencyInput
                value={previousCampaign.cac}
                onChange={(v) => updatePreviousCampaign("cac", v)}
                id="prevCAC"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prevAverageTicket" className="text-xs">
              Ticket Médio Anual
            </Label>
            <CurrencyInput
              value={previousCampaign.averageTicket}
              onChange={(v) => updatePreviousCampaign("averageTicket", v)}
              id="prevAverageTicket"
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="flex-1 space-y-4">
        <ConversionCurveEditor
          curve={conversionCurve}
          onChange={setConversionCurve}
          startMonth={startMonth}
          endMonth={endMonth}
          onStartMonthChange={onStartMonthChange}
          onEndMonthChange={onEndMonthChange}
        />
      </div>
    </aside>
  );
}

export type { PreviousCampaignData };
