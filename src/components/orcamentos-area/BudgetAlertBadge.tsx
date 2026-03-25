import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BudgetAlertBadgeProps {
  valorOrcado: number;
  valorUtilizado: number;
  showPercentage?: boolean;
  size?: 'sm' | 'default';
}

export const BudgetAlertBadge = ({ 
  valorOrcado, 
  valorUtilizado, 
  showPercentage = true,
  size = 'default'
}: BudgetAlertBadgeProps) => {
  const percentual = valorOrcado > 0 ? (valorUtilizado / valorOrcado) * 100 : 0;
  
  const getAlertConfig = () => {
    if (percentual >= 100) {
      return {
        variant: 'destructive' as const,
        icon: XCircle,
        label: 'Excedido',
        className: 'bg-destructive text-destructive-foreground',
      };
    }
    if (percentual >= 80) {
      return {
        variant: 'outline' as const,
        icon: AlertTriangle,
        label: 'Atenção',
        className: 'border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-950/20',
      };
    }
    if (percentual >= 50) {
      return {
        variant: 'outline' as const,
        icon: TrendingUp,
        label: 'Em uso',
        className: 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/20',
      };
    }
    return {
      variant: 'outline' as const,
      icon: CheckCircle,
      label: 'Disponível',
      className: 'border-green-500 text-green-600 bg-green-50 dark:bg-green-950/20',
    };
  };

  const config = getAlertConfig();
  const Icon = config.icon;
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  return (
    <Badge 
      variant={config.variant} 
      className={cn(config.className, size === 'sm' && 'text-xs py-0 px-1.5')}
    >
      <Icon className={cn(iconSize, 'mr-1')} />
      {config.label}
      {showPercentage && <span className="ml-1">({percentual.toFixed(0)}%)</span>}
    </Badge>
  );
};
