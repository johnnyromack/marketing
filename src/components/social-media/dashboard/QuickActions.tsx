import { useNavigate } from 'react-router-dom';
import { QUICK_ACTIONS } from './constants';
import type { QuickActionsProps } from './types';

export function QuickActions({ className }: QuickActionsProps) {
  const navigate = useNavigate();

  return (
    <div className={className}>
      <h2 className="text-base font-semibold text-foreground mb-2">
        Ações Rapidas
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.href)}
            className="flex flex-col items-center gap-1 p-4 rounded-lg border border-border bg-card hover:border-primary hover:shadow-sm transition-all duration-150 group"
          >
            <div className={`p-2 rounded-md ${action.bgColor}`}>
              <action.icon className={`w-5 h-5 ${action.color}`} />
            </div>
            <span className="text-sm font-medium text-foreground group-hover:text-primary">
              {action.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {action.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
