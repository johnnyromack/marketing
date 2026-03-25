import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, BarChart3, Table as TableIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { 
  InputSidebar, 
  MonthlyDistributionTable, 
  DistributionChart,
  ReportDialog,
  PreviousCampaignData,
  MediaDistribution,
} from "@/components/simulador";
import type { MediaSplit } from "@/components/simulador";
import { ScenarioComparison } from "@/components/simulador/ScenarioComparison";
import { calculateDualSimulation, DualSimulationResult } from "@/lib/mediaCalculations";

const ALL_MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const createInitialCurve = () => ALL_MONTHS.map(month => ({
  month,
  percentage: 0
}));

const initialPreviousCampaign: PreviousCampaignData = {
  budget: 450000,
  enrollments: 180,
  enrollmentTarget: 200,
  leads: 3273,
  conversionRate: 5.5,
  cpl: 150,
  cac: 2500,
  averageTicket: 12000
};

const SimuladorConversao = () => {
  const [brandName, setBrandName] = useState<string>("");
  const [budget, setBudget] = useState<number>(500000);
  const [enrollmentTarget, setEnrollmentTarget] = useState<number>(200);
  const [targetConversionRate, setTargetConversionRate] = useState<number>(6);
  const [averageTicket, setAverageTicket] = useState<number>(12000);
  const [cplRange, setCplRange] = useState<{ min: number; max: number }>({
    min: 100,
    max: 200
  });
  const [previousCampaign, setPreviousCampaign] = useState<PreviousCampaignData>(initialPreviousCampaign);
  const [conversionCurve, setConversionCurve] = useState(createInitialCurve());
  const [startMonth, setStartMonth] = useState<number>(0);
  const [endMonth, setEndMonth] = useState<number>(11);
  const [isAILoading, setIsAILoading] = useState(false);
  const [mediaSplit, setMediaSplit] = useState<MediaSplit>({ on: 56, off: 34, eventos: 10, cplOn: 0, cplOff: 0, cplEventos: 0, conversionOn: 0, conversionOff: 0, conversionEventos: 0 });
  const { toast } = useToast();

  const getMonthsInPeriod = useCallback(() => {
    const months: string[] = [];
    if (startMonth <= endMonth) {
      for (let i = startMonth; i <= endMonth; i++) {
        months.push(ALL_MONTHS[i]);
      }
    } else {
      for (let i = startMonth; i < 12; i++) {
        months.push(ALL_MONTHS[i]);
      }
      for (let i = 0; i <= endMonth; i++) {
        months.push(ALL_MONTHS[i]);
      }
    }
    return months;
  }, [startMonth, endMonth]);

  const orderedCurve = useMemo(() => {
    const monthsInPeriod = getMonthsInPeriod();
    return monthsInPeriod.map(month => {
      const existing = conversionCurve.find(item => item.month === month);
      return existing || { month, percentage: 0 };
    });
  }, [conversionCurve, getMonthsInPeriod]);

  const dualResult: DualSimulationResult = useMemo(() => {
    return calculateDualSimulation({
      budget,
      enrollmentTarget,
      targetConversionRate,
      averageTicket,
      previousCPL: previousCampaign.cpl,
      previousCAC: previousCampaign.cac,
      previousLeads: previousCampaign.leads,
      previousConversionRate: previousCampaign.conversionRate,
      previousAverageTicket: previousCampaign.averageTicket,
      previousEnrollments: previousCampaign.enrollments,
      conversionCurve: orderedCurve,
      cplRange,
    });
  }, [budget, enrollmentTarget, targetConversionRate, averageTicket, previousCampaign, orderedCurve, cplRange]);

  // Active distribution tab scenario
  const [distributionView, setDistributionView] = useState<"realistic" | "ideal">("realistic");

  const activeDistribution = distributionView === "realistic"
    ? dualResult.realistic.monthlyDistribution
    : dualResult.ideal.monthlyDistribution;

  const handleReset = () => {
    setBrandName("");
    setBudget(500000);
    setEnrollmentTarget(200);
    setTargetConversionRate(6);
    setAverageTicket(12000);
    setMediaSplit({ on: 56, off: 34, eventos: 10, cplOn: 0, cplOff: 0, cplEventos: 0, conversionOn: 0, conversionOff: 0, conversionEventos: 0 });
    setPreviousCampaign(initialPreviousCampaign);
    setConversionCurve(createInitialCurve());
    setStartMonth(0);
    setEndMonth(11);
  };

  const curveTotal = orderedCurve.reduce((sum, item) => sum + item.percentage, 0);
  const isCurveValid = Math.abs(curveTotal - 100) < 0.1;

  const handleAISimulation = async (prompt: string) => {
    setIsAILoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('simulador-ai', {
        body: {
          type: 'simulation',
          prompt,
          currentData: {
            budget,
            enrollmentTarget,
            targetConversionRate,
            averageTicket,
            cplRange,
            previousCampaign,
          }
        }
      });

      if (error) throw error;

      if (data?.suggestions) {
        if (data.suggestions.budget) setBudget(data.suggestions.budget);
        if (data.suggestions.enrollmentTarget) setEnrollmentTarget(data.suggestions.enrollmentTarget);
        if (data.suggestions.targetConversionRate) setTargetConversionRate(data.suggestions.targetConversionRate);
        if (data.suggestions.averageTicket) setAverageTicket(data.suggestions.averageTicket);
        
        toast({
          title: "Simulação gerada",
          description: "Os parâmetros foram ajustados com base na sua solicitação.",
        });
      }
    } catch (error) {
      console.error("AI simulation error:", error);
      toast({
        title: "Erro na simulação",
        description: "Não foi possível processar a simulação com IA. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsAILoading(false);
    }
  };

  const handleGenerateInsights = async (): Promise<string[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('simulador-ai', {
        body: {
          type: 'insights',
          data: {
            brandName,
            budget,
            enrollmentTarget,
            targetConversionRate,
            averageTicket,
            cplRange,
            previousCampaign,
            result: dualResult,
          }
        }
      });

      if (error) throw error;

      return data?.insights || [];
    } catch (error) {
      console.error("Generate insights error:", error);
      toast({
        title: "Erro ao gerar insights",
        description: "Não foi possível gerar os insights. Tente novamente.",
        variant: "destructive",
      });
      return [];
    }
  };

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-120px)] w-full flex-col overflow-hidden bg-background">
        <header className="flex-shrink-0 border-b bg-background px-6 py-4">
          <h1 className="text-3xl font-bold tracking-tight">
            Simulador de Conversão {brandName && `- ${brandName}`}
          </h1>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-[30%] min-w-[280px] max-w-[400px] flex-shrink-0">
            <InputSidebar
              brandName={brandName}
              setBrandName={setBrandName}
              budget={budget}
              setBudget={setBudget}
              enrollmentTarget={enrollmentTarget}
              setEnrollmentTarget={setEnrollmentTarget}
              targetConversionRate={targetConversionRate}
              setTargetConversionRate={setTargetConversionRate}
              averageTicket={averageTicket}
              setAverageTicket={setAverageTicket}
              cplRange={cplRange}
              setCplRange={setCplRange}
              previousCampaign={previousCampaign}
              setPreviousCampaign={setPreviousCampaign}
              conversionCurve={conversionCurve}
              setConversionCurve={setConversionCurve}
              startMonth={startMonth}
              endMonth={endMonth}
              onStartMonthChange={setStartMonth}
              onEndMonthChange={setEndMonth}
              onReset={handleReset}
              onAISimulation={handleAISimulation}
              isAILoading={isAILoading}
            />
          </div>

          <main className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-5xl space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Projeções e distribuição mensal</p>
                <ReportDialog
                  brandName={brandName}
                  budget={budget}
                  enrollmentTarget={enrollmentTarget}
                  targetConversionRate={targetConversionRate}
                  averageTicket={averageTicket}
                  cplRange={cplRange}
                  
                  previousCampaign={previousCampaign}
                  dualResult={dualResult}
                  campaignPeriod={{ start: ALL_MONTHS[startMonth], end: ALL_MONTHS[endMonth] }}
                  onGenerateInsights={handleGenerateInsights}
                />
              </div>

              {/* Dual Scenario Comparison */}
              <ScenarioComparison
                result={dualResult}
                budget={budget}
                enrollmentTarget={enrollmentTarget}
                targetConversionRate={targetConversionRate}
              />

              {/* Media Type Distribution */}
              <MediaDistribution
                split={mediaSplit}
                onSplitChange={setMediaSplit}
                dualResult={dualResult}
                budget={budget}
                targetConversionRate={targetConversionRate}
              />

              {isCurveValid && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <TableIcon className="h-5 w-5 text-[hsl(var(--chart-1))]" />
                        Distribuição Mensal
                      </CardTitle>
                      <Tabs value={distributionView} onValueChange={(v) => setDistributionView(v as "realistic" | "ideal")}>
                        <TabsList className="h-8">
                          <TabsTrigger value="realistic" className="text-xs px-3 h-6">Realista</TabsTrigger>
                          <TabsTrigger value="ideal" className="text-xs px-3 h-6">Ideal</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="table" className="w-full">
                      <TabsList className="mb-4">
                        <TabsTrigger value="table" className="gap-2">
                          <TableIcon className="h-4 w-4" />
                          Tabela
                        </TabsTrigger>
                        <TabsTrigger value="chart" className="gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Gráfico
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="table">
                        <MonthlyDistributionTable data={activeDistribution} />
                      </TabsContent>
                      <TabsContent value="chart">
                        <DistributionChart data={activeDistribution} />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )}

              {!isCurveValid && (
                <Card className="border-destructive/50 bg-destructive/5">
                  <CardContent className="flex items-center gap-3 p-6">
                    <div className="rounded-full bg-destructive/10 p-2 text-destructive">
                      <Target className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-destructive">
                        Curva de conversão incompleta
                      </p>
                      <p className="text-sm text-muted-foreground">
                        A soma dos percentuais mensais deve ser 100%. Atual: {curveTotal.toFixed(1)}%
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>
    </AppLayout>
  );
};

export default SimuladorConversao;
