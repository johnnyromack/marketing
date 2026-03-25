export type {
  MonthData,
  SimulationResult,
  DualSimulationResult,
  RealisticScenario,
  IdealScenario,
  GapAnalysis,
  CPLBand,
  CPLBandScenario,
} from "@/lib/mediaCalculations";

export { formatCurrency } from "@/lib/mediaCalculations";

export interface PreviousCampaignData {
  budget: number;
  enrollments: number;
  enrollmentTarget: number;
  leads: number;
  conversionRate: number;
  cpl: number;
  cac: number;
  averageTicket: number;
}
