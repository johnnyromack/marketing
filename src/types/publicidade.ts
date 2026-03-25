export interface BrandData {
  marca: string;
  unidade: string;
  leadsReal: number;
  leadsOrcado: number;
  leadsA1: number;
  leadsAcumReal: number;
  leadsAcumOrcado: number;
  leadsAcumA1: number;
  cacReal: number;
  cacOrcado: number;
  cacA1: number;
  cplReal: number;
  cplOrcado: number;
  cplA1: number;
  cplProdReal: number;
  cplProdOrcado: number;
  cplProdA1: number;
  investMeta: number;
  investGoogle: number;
  investOff: number;
  investEventos: number;
}

export interface MonthlyData {
  month: string;
  monthNumber: number;
  year: number;
  brands: BrandData[];
}

export interface FilterState {
  month: string;
  marca: string;
  unidade: string;
}

export interface KPIData {
  label: string;
  value: number;
  orcado: number;
  ca: number; // Ciclo Anterior (antes A-1)
  prefix?: string;
  suffix?: string;
  format?: 'number' | 'currency' | 'percent';
}

export interface ChartDataPoint {
  name: string;
  real: number;
  orcado: number;
  a1?: number;
}

export interface InvestmentBreakdown {
  name: string;
  value: number;
  color: string;
}
