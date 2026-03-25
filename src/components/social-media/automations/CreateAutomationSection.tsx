import { useState } from 'react';
import { Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SOCIAL_TRIGGERS, SOCIAL_ACTIONS } from '@/lib/services/social-media/automation.constants';
import type { TriggerType, ActionType, CreateAutomationSectionProps } from './types';

export function CreateAutomationSection({
  onClose,
  onSave,
  initialData,
}: CreateAutomationSectionProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [trigger, setTrigger] = useState<TriggerType>(initialData?.trigger ?? 'mention.new');
  const [selectedActions, setSelectedActions] = useState<ActionType[]>(
    initialData?.actions?.map((a) => a.type) ?? []
  );

  const handleSave = () => {
    if (!name.trim()) return;

    onSave({
      ...(initialData?.id ? { id: initialData.id } : {}),
      name,
      description,
      trigger,
      actions: selectedActions.map((type) => ({ type, config: {} })),
      is_active: true,
    });
  };

  const triggerGroups = {
    Mencoes: Object.entries(SOCIAL_TRIGGERS).filter(([k]) => k.startsWith('mention.')),
    'Volume/Sentimento': Object.entries(SOCIAL_TRIGGERS).filter(
      ([k]) => k.startsWith('volume.') || k.startsWith('sentiment.')
    ),
    Tickets: Object.entries(SOCIAL_TRIGGERS).filter(([k]) => k.startsWith('ticket.')),
    Publicação: Object.entries(SOCIAL_TRIGGERS).filter(([k]) => k.startsWith('post.')),
  };

  const actionGroups = {
    Notificações: Object.entries(SOCIAL_ACTIONS).filter(([k]) => k.startsWith('notify.')),
    Tickets: Object.entries(SOCIAL_ACTIONS).filter(([k]) => k.startsWith('ticket.')),
    Alertas: Object.entries(SOCIAL_ACTIONS).filter(
      ([k]) => k.startsWith('alert.') || k.startsWith('incident.')
    ),
    HubSpot: Object.entries(SOCIAL_ACTIONS).filter(([k]) => k.startsWith('hubspot.')),
    Posts: Object.entries(SOCIAL_ACTIONS).filter(([k]) => k.startsWith('post.')),
  };

  return (
    <Card className="mb-6" data-testid="form-automation">
      <CardContent className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-base text-foreground">
            Nova Automação
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            data-testid="btn-cancel"
          >
            Cancelar
          </button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label
              htmlFor="nome-69"
              className="mb-1 block text-sm text-muted-foreground"
            >
              Nome
            </label>
            <input
              id="nome-69"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Alerta de mencao negativa"
              className="w-full rounded-md border border-border bg-muted px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              data-testid="input-name"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="descri-o-opcional-84"
              className="mb-1 block text-sm text-muted-foreground"
            >
              Descrição (opcional)
            </label>
            <input
              id="descri-o-opcional-84"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o que esta automação faz"
              className="w-full rounded-md border border-border bg-muted px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              data-testid="input-description"
            />
          </div>

          {/* Trigger */}
          <div data-testid="trigger-section">
            <span className="mb-2 block text-sm text-muted-foreground">
              Quando (Trigger)
            </span>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {Object.entries(triggerGroups).map(([group, triggers]) => (
                <div
                  key={group}
                  data-testid={`trigger-group-${group.toLowerCase().replace(/[^a-z]/g, '-')}`}
                >
                  <p className="mb-1 text-xs text-muted-foreground">
                    {group}
                  </p>
                  <div className="space-y-1">
                    {triggers.map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setTrigger(key as TriggerType)}
                        className={cn(
                          'w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
                          trigger === key
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        )}
                        data-testid={`trigger-${key.replace(/\./g, '-')}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div data-testid="actions-section">
            <span className="mb-2 block text-sm text-muted-foreground">
              Entao (Ações)
            </span>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {Object.entries(actionGroups).map(([group, actions]) => (
                <div
                  key={group}
                  data-testid={`action-group-${group.toLowerCase().replace(/[^a-z]/g, '-')}`}
                >
                  <p className="mb-1 text-xs text-muted-foreground">
                    {group}
                  </p>
                  <div className="space-y-1">
                    {actions.map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => {
                          if (selectedActions.includes(key as ActionType)) {
                            setSelectedActions(selectedActions.filter((a) => a !== key));
                          } else {
                            setSelectedActions([...selectedActions, key as ActionType]);
                          }
                        }}
                        className={cn(
                          'w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
                          selectedActions.includes(key as ActionType)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        )}
                        data-testid={`action-${key.replace(/\./g, '-')}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSave}
              disabled={!name.trim() || selectedActions.length === 0}
              data-testid="btn-save-automation"
            >
              <Zap className="mr-2 h-4 w-4" />
              Criar Automação
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
