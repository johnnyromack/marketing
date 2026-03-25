import { MidiaKPICards } from '../MidiaKPICards';
import { MidiaEvolutionChart } from '../MidiaEvolutionChart';
import { MidiaBreakdownChart } from '../MidiaBreakdownChart';
import { MidiaBrandChart } from '../MidiaBrandChart';

interface ResumoTabProps {
  kpis: {
    totalOrcado: number;
    totalRealizado: number;
    saldoRemanescente: number;
    percentualExecutado: number;
  };
  investmentEvolution: Array<{ month: string; orcado: number; realizado: number }>;
  investmentBreakdown: Array<{ name: string; value: number; color: string }>;
  brandBreakdown: Array<{ marca: string; orcado: number; realizado: number }>;
}

export const ResumoTab = ({ kpis, investmentEvolution, investmentBreakdown, brandBreakdown }: ResumoTabProps) => {
  return (
    <div className="space-y-6">
      <MidiaKPICards kpis={kpis} />
      
      <MidiaEvolutionChart data={investmentEvolution} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MidiaBreakdownChart data={investmentBreakdown} />
        <MidiaBrandChart data={brandBreakdown} />
      </div>
    </div>
  );
};
