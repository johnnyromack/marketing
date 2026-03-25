import { Power, PowerOff, Trash2, Edit2, Play, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { SOCIAL_TRIGGERS, SOCIAL_ACTIONS } from '@/lib/services/social-media/automation.constants';
import { TriggerIcon, ActionIcon } from './icons';
import type { AutomationCardProps } from './types';

export function AutomationCard({
  rule,
  onToggle,
  onEdit,
  onDelete,
  onTest,
}: AutomationCardProps) {
  return (
    <Card
      className={cn(
        'border-l-4 transition-opacity',
        rule.is_active ? 'border-l-green-600' : 'border-l-border opacity-60'
      )}
      data-testid={`automation-card-${rule.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between min-w-0">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className={cn(
              'p-2 rounded-full flex-shrink-0',
              rule.is_active ? 'bg-green-600/10' : 'bg-muted'
            )}>
              <TriggerIcon trigger={rule.trigger} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 min-w-0">
                <span className="text-sm font-semibold text-foreground truncate">
                  {rule.name}
                </span>
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs',
                  rule.is_active
                    ? 'bg-green-600/10 text-green-600'
                    : 'bg-muted text-muted-foreground'
                )}>
                  {rule.is_active ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              {rule.description && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                  {rule.description}
                </p>
              )}

              {/* Trigger and Actions Summary */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="px-2 py-0.5 bg-muted rounded">
                  {SOCIAL_TRIGGERS[rule.trigger]}
                </span>
                <ChevronRight className="w-3 h-3" />
                <div className="flex items-center gap-1">
                  {rule.actions.slice(0, 3).map((action, i) => (
                    <span key={i} className="px-2 py-0.5 bg-muted rounded flex items-center gap-1">
                      <ActionIcon action={action.type} />
                      <span className="hidden sm:inline">{SOCIAL_ACTIONS[action.type]}</span>
                    </span>
                  ))}
                  {rule.actions.length > 3 && (
                    <span className="text-muted-foreground">+{rule.actions.length - 3}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0 ml-4">
            <button
              onClick={() => onTest(rule.id)}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Testar"
              data-testid={`btn-test-${rule.id}`}
            >
              <Play className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(rule.id)}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Editar"
              data-testid={`btn-edit-${rule.id}`}
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onToggle(rule.id, !rule.is_active)}
              className={cn(
                'p-2 rounded-md transition-colors',
                rule.is_active
                  ? 'text-green-600 hover:bg-green-600/10'
                  : 'text-muted-foreground hover:bg-muted'
              )}
              title={rule.is_active ? 'Desativar' : 'Ativar'}
              data-testid={`btn-toggle-${rule.id}`}
            >
              {rule.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
            </button>
            <button
              onClick={() => onDelete(rule.id)}
              className="p-2 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-600/10 transition-colors"
              title="Excluir"
              data-testid={`btn-delete-${rule.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
