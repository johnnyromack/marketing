import { Zap, Power, PowerOff, Bell } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { SummaryCardsProps } from './types';

export function SummaryCards({
  totalRules,
  activeRules,
  inactiveRules,
  executionsToday,
}: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" data-testid="summary-cards">
      <Card className="text-center" data-testid="card-total">
        <CardContent className="p-4">
          <div className="flex flex-col items-center">
            <Zap className="w-8 h-8 text-primary mb-2" />
            <span className="text-2xl font-bold text-foreground">{totalRules}</span>
            <span className="text-xs text-muted-foreground">Total de Regras</span>
          </div>
        </CardContent>
      </Card>
      <Card className="text-center" data-testid="card-active">
        <CardContent className="p-4">
          <div className="flex flex-col items-center">
            <Power className="w-8 h-8 text-green-600 mb-2" />
            <span className="text-2xl font-bold text-foreground">{activeRules}</span>
            <span className="text-xs text-muted-foreground">Ativas</span>
          </div>
        </CardContent>
      </Card>
      <Card className="text-center" data-testid="card-inactive">
        <CardContent className="p-4">
          <div className="flex flex-col items-center">
            <PowerOff className="w-8 h-8 text-muted-foreground mb-2" />
            <span className="text-2xl font-bold text-foreground">{inactiveRules}</span>
            <span className="text-xs text-muted-foreground">Inativas</span>
          </div>
        </CardContent>
      </Card>
      <Card className="text-center" data-testid="card-executions">
        <CardContent className="p-4">
          <div className="flex flex-col items-center">
            <Bell className="w-8 h-8 text-yellow-500 mb-2" />
            <span className="text-2xl font-bold text-foreground">{executionsToday}</span>
            <span className="text-xs text-muted-foreground">Execuções Hoje</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
