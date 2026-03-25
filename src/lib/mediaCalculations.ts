export interface MonthData {
  month: string;
  percentage: number;
  enrollments: number;
  leads: number;
  budget: number;
}

export interface CampaignMetrics {
  cpl: number;
  cac: number;
  conversionRate: number;
  totalLeads: number;
}

export interface SimulationInput {
  budget: number;
  enrollmentTarget: number;
  targetConversionRate: number;
  averageTicket: number;
  previousCPL: number;
  previousCAC: number;
  previousLeads: number;
  previousConversionRate: number;
  previousAverageTicket: number;
  previousEnrollments: number;
  conversionCurve: { month: string; percentage: number }[];
  cplRange: { min: number; max: number };
}

export interface RealisticScenario {
  achievableLeads: number;
  achievableEnrollments: number;
  projectedCPL: number;
  projectedCAC: number;
  projectedRevenue: number;
  roi: number;
  conversionRate: number;
  monthlyDistribution: MonthData[];
}

export interface IdealScenario {
  requiredBudget: number;
  requiredLeads: number;
  projectedCPL: number;
  projectedCAC: number;
  projectedRevenue: number;
  roi: number;
  monthlyDistribution: MonthData[];
}

export interface GapAnalysis {
  budgetGap: number;
  budgetGapPercent: number;
  leadsGap: number;
  enrollmentsGap: number;
  /** Matrículas que o orçamento atual consegue no cenário CAC-driven */
  enrollmentsWithCurrentBudget: number;
  /** Leads que o orçamento atual consegue no cenário CAC-driven */
  leadsWithCurrentBudget: number;
}

export interface CPLBandScenario {
  label: string;
  cpl: number;
  achievableLeads: number;
  achievableEnrollments: number;
  projectedCAC: number;
  projectedRevenue: number;
  roi: number;
}

export interface CPLBand {
  pessimistic: CPLBandScenario;
  realistic: CPLBandScenario;
  optimistic: CPLBandScenario;
}

export interface DualSimulationResult {
  realistic: RealisticScenario;
  ideal: IdealScenario;
  gap: GapAnalysis;
  cplBand: CPLBand;
  comparison: {
    cplVariation: number;
    cacVariation: number;
    leadsVariation: number;
    conversionRateVariation: number;
    revenueVariation: number;
  };
}

// Legacy single-result interface kept for backward compatibility
export interface SimulationResult {
  projectedCPL: number;
  projectedCAC: number;
  requiredLeads: number;
  conversionRate: number;
  projectedRevenue: number;
  roi: number;
  monthlyDistribution: MonthData[];
  comparison: {
    cplVariation: number;
    cacVariation: number;
    leadsVariation: number;
    conversionRateVariation: number;
    revenueVariation: number;
  };
}

export const DEFAULT_MONTHS = [
  { month: "Janeiro", percentage: 8 },
  { month: "Fevereiro", percentage: 10 },
  { month: "Março", percentage: 12 },
  { month: "Abril", percentage: 10 },
  { month: "Maio", percentage: 8 },
  { month: "Junho", percentage: 6 },
  { month: "Julho", percentage: 5 },
  { month: "Agosto", percentage: 7 },
  { month: "Setembro", percentage: 9 },
  { month: "Outubro", percentage: 10 },
  { month: "Novembro", percentage: 9 },
  { month: "Dezembro", percentage: 6 },
];

/**
 * Cenário #1 — Limitado pelo orçamento.
 * Usa CPL médio do range para calcular leads alcançáveis,
 * depois aplica a taxa de conversão para derivar matrículas.
 */
function calculateRealistic(input: SimulationInput): RealisticScenario {
  const { budget, targetConversionRate, averageTicket, cplRange, conversionCurve } = input;
  const avgCPL = (cplRange.min + cplRange.max) / 2;
  const conversionDecimal = targetConversionRate / 100;

  const achievableLeads = avgCPL > 0 ? Math.floor(budget / avgCPL) : 0;
  const achievableEnrollments = Math.round(achievableLeads * conversionDecimal);
  const projectedCPL = avgCPL;
  const projectedCAC = conversionDecimal > 0 ? avgCPL / conversionDecimal : 0;
  const projectedRevenue = achievableEnrollments * averageTicket;
  const roi = budget > 0 ? ((projectedRevenue - budget) / budget) * 100 : 0;

  const monthlyDistribution: MonthData[] = conversionCurve.map((curve) => ({
    month: curve.month,
    percentage: curve.percentage,
    enrollments: Math.round((achievableEnrollments * curve.percentage) / 100),
    leads: Math.round((achievableLeads * curve.percentage) / 100),
    budget: (budget * curve.percentage) / 100,
  }));

  return {
    achievableLeads,
    achievableEnrollments,
    projectedCPL,
    projectedCAC,
    projectedRevenue,
    roi,
    conversionRate: targetConversionRate,
    monthlyDistribution,
  };
}

/**
 * Cenário #2 — Para atingir a meta de matrículas.
 * Usa CAC médio do range para calcular o investimento necessário.
 * Nunca mostra orçamento inferior ao disponível: se há superávit,
 * redistribui para projetar mais matrículas.
 */
function calculateIdeal(input: SimulationInput): IdealScenario {
  const { enrollmentTarget, targetConversionRate, averageTicket, cplRange, conversionCurve } = input;
  const avgCPL = (cplRange.min + cplRange.max) / 2;
  const conversionDecimal = targetConversionRate / 100;

  // Meta fixa: leads necessários para atingir EXATAMENTE a meta de matrículas
  const requiredLeads = conversionDecimal > 0 ? Math.ceil(enrollmentTarget / conversionDecimal) : 0;
  // Verba necessária = leads × CPL médio
  const requiredBudget = requiredLeads * avgCPL;
  const projectedCPL = avgCPL;
  const projectedCAC = conversionDecimal > 0 ? avgCPL / conversionDecimal : 0;
  const projectedRevenue = enrollmentTarget * averageTicket;
  const roi = requiredBudget > 0 ? ((projectedRevenue - requiredBudget) / requiredBudget) * 100 : 0;

  const monthlyDistribution: MonthData[] = conversionCurve.map((curve) => ({
    month: curve.month,
    percentage: curve.percentage,
    enrollments: Math.round((enrollmentTarget * curve.percentage) / 100),
    leads: Math.round((requiredLeads * curve.percentage) / 100),
    budget: (requiredBudget * curve.percentage) / 100,
  }));

  return {
    requiredBudget,
    requiredLeads,
    projectedCPL,
    projectedCAC,
    projectedRevenue,
    roi,
    monthlyDistribution,
  };
}

function buildBandScenario(
  label: string,
  cpl: number,
  input: SimulationInput
): CPLBandScenario {
  const { budget, targetConversionRate, averageTicket } = input;
  const conv = targetConversionRate / 100;
  const achievableLeads = cpl > 0 ? Math.floor(budget / cpl) : 0;
  const achievableEnrollments = Math.round(achievableLeads * conv);
  const projectedCAC = conv > 0 ? cpl / conv : 0;
  const projectedRevenue = achievableEnrollments * averageTicket;
  const roi = budget > 0 ? ((projectedRevenue - budget) / budget) * 100 : 0;
  return { label, cpl, achievableLeads, achievableEnrollments, projectedCAC, projectedRevenue, roi };
}

export function calculateDualSimulation(input: SimulationInput): DualSimulationResult {
  const realistic = calculateRealistic(input);
  const ideal = calculateIdeal(input);

  const avgCPL = (input.cplRange.min + input.cplRange.max) / 2;
  const cplBand: CPLBand = {
    pessimistic: buildBandScenario("Pessimista", input.cplRange.max, input),
    realistic: buildBandScenario("Realista", avgCPL, input),
    optimistic: buildBandScenario("Otimista", input.cplRange.min, input),
  };

  // Gap: compara verba disponível vs verba necessária para a meta
  const gap: GapAnalysis = {
    budgetGap: ideal.requiredBudget - input.budget,
    budgetGapPercent: input.budget > 0 ? ((ideal.requiredBudget - input.budget) / input.budget) * 100 : 0,
    leadsGap: ideal.requiredLeads - realistic.achievableLeads,
    enrollmentsGap: input.enrollmentTarget - realistic.achievableEnrollments,
    enrollmentsWithCurrentBudget: realistic.achievableEnrollments,
    leadsWithCurrentBudget: realistic.achievableLeads,
  };

  const { previousCPL, previousCAC, previousLeads, previousConversionRate, previousAverageTicket, previousEnrollments } = input;
  const previousRevenue = previousEnrollments * previousAverageTicket;

  const comparison = {
    cplVariation: previousCPL > 0 ? ((realistic.projectedCPL - previousCPL) / previousCPL) * 100 : 0,
    cacVariation: previousCAC > 0 ? ((realistic.projectedCAC - previousCAC) / previousCAC) * 100 : 0,
    leadsVariation: previousLeads > 0 ? ((realistic.achievableLeads - previousLeads) / previousLeads) * 100 : 0,
    conversionRateVariation: previousConversionRate > 0 ? ((input.targetConversionRate - previousConversionRate) / previousConversionRate) * 100 : 0,
    revenueVariation: previousRevenue > 0 ? ((realistic.projectedRevenue - previousRevenue) / previousRevenue) * 100 : 0,
  };

  return { realistic, ideal, gap, cplBand, comparison };
}

// Legacy function kept for backward compatibility
export function calculateSimulation(input: SimulationInput): SimulationResult {
  const { budget, enrollmentTarget, targetConversionRate, averageTicket, previousCPL, previousCAC, previousLeads, previousConversionRate, previousAverageTicket, previousEnrollments, conversionCurve } = input;

  const conversionDecimal = targetConversionRate / 100;
  const requiredLeads = conversionDecimal > 0 ? Math.ceil(enrollmentTarget / conversionDecimal) : 0;
  
  const projectedCPL = requiredLeads > 0 ? budget / requiredLeads : 0;
  const projectedCAC = enrollmentTarget > 0 ? budget / enrollmentTarget : 0;
  const projectedRevenue = enrollmentTarget * averageTicket;
  const roi = budget > 0 ? ((projectedRevenue - budget) / budget) * 100 : 0;
  const previousRevenue = previousEnrollments * previousAverageTicket;

  const monthlyDistribution: MonthData[] = conversionCurve.map((curve) => ({
    month: curve.month,
    percentage: curve.percentage,
    enrollments: Math.round((enrollmentTarget * curve.percentage) / 100),
    leads: Math.round((requiredLeads * curve.percentage) / 100),
    budget: (budget * curve.percentage) / 100,
  }));

  const cplVariation = previousCPL > 0 ? ((projectedCPL - previousCPL) / previousCPL) * 100 : 0;
  const cacVariation = previousCAC > 0 ? ((projectedCAC - previousCAC) / previousCAC) * 100 : 0;
  const leadsVariation = previousLeads > 0 ? ((requiredLeads - previousLeads) / previousLeads) * 100 : 0;
  const conversionRateVariation = previousConversionRate > 0 ? ((targetConversionRate - previousConversionRate) / previousConversionRate) * 100 : 0;
  const revenueVariation = previousRevenue > 0 ? ((projectedRevenue - previousRevenue) / previousRevenue) * 100 : 0;

  return {
    projectedCPL,
    projectedCAC,
    requiredLeads,
    conversionRate: targetConversionRate,
    projectedRevenue,
    roi,
    monthlyDistribution,
    comparison: {
      cplVariation,
      cacVariation,
      leadsVariation,
      conversionRateVariation,
      revenueVariation,
    },
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^\d,]/g, "");
  const normalized = cleaned.replace(",", ".");
  return parseFloat(normalized) || 0;
}

export function formatCurrencyInput(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
