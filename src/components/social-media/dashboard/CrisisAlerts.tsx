import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { SEVERITY_COLORS } from './constants';
import type { CrisisAlertsProps } from './types';

export function CrisisAlerts({ className, alerts, isLoading }: CrisisAlertsProps) {
  const navigate = useNavigate();

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Shield className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-sm text-foreground">
              Alertas de Crise
            </h3>
          </div>
          <button
            onClick={() => navigate('/social-media/crisis')}
            className="text-primary text-sm hover:underline"
          >
            Crisis Center
          </button>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <div className="bg-green-600/10 mb-2 rounded-full p-2">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <p className="font-medium text-sm text-green-600">
              Tudo tranquilo
            </p>
            <p className="text-xs text-muted-foreground">
              Nenhum alerta de crise ativo
            </p>
          </div>
        ) : (
          <div className="max-h-[400px] space-y-2 overflow-y-auto">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => navigate(`/social-media/crisis?alert=${alert.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/social-media/crisis?alert=${alert.id}`);
                  }
                }}
                role="button"
                tabIndex={0}
                className="flex min-w-0 cursor-pointer items-center gap-2 rounded-md border border-border p-2 transition-colors hover:border-red-500"
              >
                <span
                  className={`flex-shrink-0 rounded px-2 py-0.5 font-semibold text-xs ${SEVERITY_COLORS[alert.severity]}`}
                >
                  {alert.severity}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                  {alert.title}
                </span>
                <span className="flex-shrink-0 text-xs text-muted-foreground">
                  {alert.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
