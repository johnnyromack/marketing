import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Download, 
  Loader2, 
  Sparkles,
  Target,
  TrendingUp,
  DollarSign,
  Users,
  Calculator,
  BarChart3,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { DualSimulationResult, formatCurrency, PreviousCampaignData } from "./types";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ReportDialogProps {
  brandName: string;
  budget: number;
  enrollmentTarget: number;
  targetConversionRate: number;
  averageTicket: number;
  cplRange: { min: number; max: number };
  previousCampaign: PreviousCampaignData;
  dualResult: DualSimulationResult;
  campaignPeriod: { start: string; end: string };
  onGenerateInsights: () => Promise<string[]>;
}

const formatCompactCurrency = (value: number): string => {
  if (value >= 1000000) {
    const millions = value / 1000000;
    return `R$ ${millions.toLocaleString("pt-BR", { minimumFractionDigits: millions % 1 === 0 ? 0 : 1, maximumFractionDigits: 1 })}M`;
  }
  if (value >= 1000) {
    const thousands = value / 1000;
    return `R$ ${thousands.toLocaleString("pt-BR", { minimumFractionDigits: thousands % 1 === 0 ? 0 : 1, maximumFractionDigits: 1 })}K`;
  }
  return formatCurrency(value);
};

const chartConfig = {
  atual: {
    label: "Projetado",
    color: "hsl(var(--chart-1))",
  },
  anterior: {
    label: "Anterior",
    color: "hsl(var(--chart-2))",
  },
};

export function ReportDialog({
  brandName,
  budget,
  enrollmentTarget,
  targetConversionRate,
  averageTicket,
  cplRange,
  previousCampaign,
  dualResult,
  campaignPeriod,
  onGenerateInsights,
}: ReportDialogProps) {
  const result = dualResult.realistic;
  const ideal = dualResult.ideal;
  const gap = dualResult.gap;
  const [open, setOpen] = useState(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  const handleGenerateInsights = async () => {
    setIsGeneratingInsights(true);
    try {
      const generatedInsights = await onGenerateInsights();
      setInsights(generatedInsights);
    } catch (error) {
      console.error("Error generating insights:", error);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const handleExport = async () => {
    if (!printRef.current) return;
    
    try {
      // Wait a moment for any animations to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgWidth = 190; // A4 width minus margins
      const pageHeight = 277; // A4 height minus margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF("p", "mm", "a4");
      
      // Add header
      pdf.setFontSize(14);
      pdf.setTextColor(20, 20, 22); // Dark color
      pdf.text(`Relatório de Simulação${brandName ? ` - ${brandName}` : ""}`, 10, 15);
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Período: ${campaignPeriod.start} a ${campaignPeriod.end}`, 10, 22);

      // Add the content image
      const imgData = canvas.toDataURL("image/png");
      const startY = 28;
      
      if (imgHeight < pageHeight - startY - 15) {
        // Content fits on one page
        pdf.addImage(imgData, "PNG", 10, startY, imgWidth, imgHeight);
        addFooter(pdf, pageHeight + 10);
      } else {
        // Multi-page content
        let heightLeft = imgHeight;
        let position = 0;
        let pageNum = 1;

        // First page
        pdf.addImage(imgData, "PNG", 10, startY, imgWidth, imgHeight, undefined, 'FAST', 0);
        addFooter(pdf, pageHeight + 10);
        heightLeft -= (pageHeight - startY);
        
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pageNum++;
          pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight, undefined, 'FAST', 0);
          addFooter(pdf, pageHeight + 10);
          heightLeft -= pageHeight;
        }
      }

      pdf.save(`relatorio-simulacao${brandName ? `-${brandName.toLowerCase().replace(/\s+/g, '-')}` : ""}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const addFooter = (pdf: jsPDF, yPosition: number) => {
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('pt-BR');
    const formattedTime = currentDate.toLocaleTimeString('pt-BR');
    const footerText = `Mkt Vision - ${formattedDate} - ${formattedTime} - marketing.raizeducacao.com.br`;
    
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    const textWidth = pdf.getTextWidth(footerText);
    pdf.text(footerText, (210 - textWidth) / 2, yPosition);
  };

  const comparisonData = [
    {
      metric: "CPL",
      atual: result.projectedCPL,
      anterior: previousCampaign.cpl,
    },
    {
      metric: "CAC",
      atual: result.projectedCAC,
      anterior: previousCampaign.cac,
    },
  ];

  const budgetPercentOfRevenue = result.projectedRevenue > 0 
    ? ((budget / result.projectedRevenue) * 100).toFixed(1) 
    : "0";

  const distributionData = [
    { name: "Orçamento", value: budget },
    { name: "Faturamento", value: result.projectedRevenue },
  ];

  const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))"];

  const getCPLStatus = () => {
    if (result.projectedCPL <= cplRange.min) return { color: "text-[hsl(var(--success))]", icon: CheckCircle2, label: "Abaixo do mínimo" };
    if (result.projectedCPL <= cplRange.max) return { color: "text-[hsl(var(--warning))]", icon: AlertTriangle, label: "Dentro da faixa" };
    return { color: "text-destructive", icon: AlertTriangle, label: "Acima do máximo" };
  };

  // CAC é derivado de CPL / taxa de conversão, sem range independente
  const derivedCAC = result.projectedCAC;
  const getCACStatus = () => {
    // Comparar com o CAC da campanha anterior como referência
    if (derivedCAC <= previousCampaign.cac * 0.9) return { color: "text-[hsl(var(--success))]", icon: CheckCircle2, label: "Abaixo do anterior" };
    if (derivedCAC <= previousCampaign.cac * 1.1) return { color: "text-[hsl(var(--warning))]", icon: AlertTriangle, label: "Similar ao anterior" };
    return { color: "text-destructive", icon: AlertTriangle, label: "Acima do anterior" };
  };

  const cplStatus = getCPLStatus();
  const cacStatus = getCACStatus();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          Gerar Relatório
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:overflow-visible">
        <div ref={printRef} className="print-report">
          {/* Print Header */}
          <div className="print-header hidden print:block bg-muted/50 border-b p-4 mb-6 rounded-t-lg">
            <h1 className="text-2xl font-bold text-foreground">
              Relatório de Simulação {brandName ? `- ${brandName}` : ""}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Período: {campaignPeriod.start} a {campaignPeriod.end}
            </p>
          </div>

          {/* Dialog Header - visible only on screen */}
          <DialogHeader className="print:hidden">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[hsl(var(--chart-1))]" />
              Relatório de Simulação {brandName && `- ${brandName}`}
            </DialogTitle>
            <DialogDescription>
              Período: {campaignPeriod.start} a {campaignPeriod.end}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 print:p-0 print:mt-0">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4">
              <Card className="print-card print:border print:border-gray-200 print:bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-[hsl(var(--chart-1))] print:text-orange-500" />
                    <span className="text-xs text-muted-foreground print:text-gray-600">Orçamento</span>
                  </div>
                  <p className="text-lg font-bold print:text-gray-900">{formatCurrency(budget)}</p>
                </CardContent>
              </Card>
              <Card className="print-card print:border print:border-gray-200 print:bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-[hsl(var(--chart-2))] print:text-green-500" />
                    <span className="text-xs text-muted-foreground print:text-gray-600">Meta Matrículas</span>
                  </div>
                  <p className="text-lg font-bold print:text-gray-900">{enrollmentTarget}</p>
                </CardContent>
              </Card>
              <Card className="print-card print:border print:border-gray-200 print:bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[hsl(var(--chart-3))] print:text-blue-500" />
                    <span className="text-xs text-muted-foreground print:text-gray-600">Leads Alcançáveis</span>
                  </div>
                  <p className="text-lg font-bold print:text-gray-900">{result.achievableLeads.toLocaleString("pt-BR")}</p>
                </CardContent>
              </Card>
              <Card className="print-card print:border print:border-gray-200 print:bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[hsl(var(--chart-4))] print:text-amber-500" />
                    <span className="text-xs text-muted-foreground print:text-gray-600">ROI Projetado</span>
                  </div>
                  <p className="text-lg font-bold print:text-gray-900">{result.roi.toFixed(1)}%</p>
                </CardContent>
              </Card>
            </div>

            {/* KPI Status Cards */}
            <div className="grid grid-cols-2 gap-4 print:grid-cols-2">
              <Card className="print-card print:border print:border-gray-200 print:bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 print:text-gray-900">
                    <Calculator className="h-4 w-4" />
                    CPL Projetado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold print:text-gray-900">{formatCurrency(result.projectedCPL)}</p>
                      <p className="text-xs text-muted-foreground print:text-gray-600">
                        Faixa meta: {formatCurrency(cplRange.min)} - {formatCurrency(cplRange.max)}
                      </p>
                    </div>
                    <div className={`flex items-center gap-1 ${cplStatus.color}`}>
                      <cplStatus.icon className="h-5 w-5" />
                      <span className="text-xs">{cplStatus.label}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="print-card print:border print:border-gray-200 print:bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 print:text-gray-900">
                    <BarChart3 className="h-4 w-4" />
                    CAC Projetado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold print:text-gray-900">{formatCurrency(result.projectedCAC)}</p>
                      <p className="text-xs text-muted-foreground print:text-gray-600">
                        Anterior: {formatCurrency(previousCampaign.cac)}
                      </p>
                    </div>
                    <div className={`flex items-center gap-1 ${cacStatus.color}`}>
                      <cacStatus.icon className="h-5 w-5" />
                      <span className="text-xs">{cacStatus.label}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
              <Card className="print-card print:border print:border-gray-200 print:bg-white">
                <CardHeader>
                  <CardTitle className="text-sm print:text-gray-900">Comparativo CPL/CAC</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[200px] w-full">
                    <BarChart data={comparisonData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(v) => `R$ ${v}`} />
                      <YAxis type="category" dataKey="metric" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="atual" name="Projetado" fill="#FF6F32" radius={4} />
                      <Bar dataKey="anterior" name="Anterior" fill="#7FBF96" radius={4} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="print-card print:border print:border-gray-200 print:bg-white">
                <CardHeader>
                  <CardTitle className="text-sm print:text-gray-900">Orçamento vs Faturamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[280px] w-full overflow-visible">
                    <PieChart margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
                      <Pie
                        data={distributionData}
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${formatCompactCurrency(value)}`}
                        labelLine={{ stroke: "#888", strokeWidth: 1 }}
                      >
                        {distributionData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? "#FF6F32" : "#7FBF96"} />
                        ))}
                      </Pie>
                      <ChartTooltip 
                        formatter={(value: number) => formatCurrency(value)}
                      />
                    </PieChart>
                  </ChartContainer>
                  <p className="text-xs text-muted-foreground text-center mt-2 print:text-gray-600">
                    O orçamento representa <span className="font-semibold text-foreground print:text-gray-900">{budgetPercentOfRevenue}%</span> do faturamento projetado
                  </p>
                </CardContent>
              </Card>
            </div>

            <Separator className="print:border-gray-300" />

            {/* AI Insights Section */}
            <Card className="print-card print:border print:border-gray-200 print:bg-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2 print:text-gray-900">
                    <Sparkles className="h-4 w-4 text-[hsl(var(--chart-1))] print:text-orange-500" />
                    Insights com IA
                  </CardTitle>
                  <Button
                    onClick={handleGenerateInsights}
                    disabled={isGeneratingInsights}
                    size="sm"
                    variant="outline"
                    className="gap-2 print:hidden"
                  >
                    {isGeneratingInsights ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Gerar Insights
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {insights.length > 0 ? (
                  <ul className="space-y-2">
                    {insights.map((insight, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))] print:text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm print:text-gray-900">{insight}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground print:text-gray-600">
                    Clique em "Gerar Insights" para obter análises e recomendações baseadas em IA.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-2 print:hidden">
          <Button onClick={handleExport} variant="default" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
