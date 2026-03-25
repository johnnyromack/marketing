import { Card, CardContent } from '@/components/ui/card';
import { FormNumberInput } from '../shared';
import { availablePlatforms } from '@/lib/schemas/social-media-settings.schema';
import type { SettingsTabProps } from './types';

/**
 * PlatformsTab - Platform priority and connection settings tab
 */
export function PlatformsTab({ settings, onChange }: SettingsTabProps) {
  const movePlatform = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...(settings.platform_priority || [])];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < newOrder.length) {
      [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
      onChange({ platform_priority: newOrder });
    }
  };

  return (
    <div data-testid="tab-content-platforms" className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">
            Prioridade de Plataformas
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Arraste para reorganizar a ordem de prioridade para coleta de dados
          </p>
          <div data-testid="platform-priority-list" className="space-y-2">
            {(settings.platform_priority || []).map((platformId: string, index: number) => {
              const platform = availablePlatforms.find((p) => p.id === platformId);
              return (
                <div
                  key={platformId}
                  data-testid={`platform-item-${platformId}`}
                  className="flex items-center gap-3 p-3 bg-muted rounded-md"
                >
                  <span className="w-6 h-6 flex items-center justify-center text-xs text-muted-foreground font-medium">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-sm text-foreground">
                    {platform?.name || platformId}
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => movePlatform(index, 'up')}
                      disabled={index === 0}
                      data-testid={`btn-move-up-${platformId}`}
                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => movePlatform(index, 'down')}
                      disabled={index === (settings.platform_priority?.length || 0) - 1}
                      data-testid={`btn-move-down-${platformId}`}
                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">
            Configurações de Conexão
          </h3>
          <FormNumberInput
            label="Timeout de Conexão"
            value={settings.connection_timeout}
            onChange={(v) => onChange({ connection_timeout: v })}
            min={5}
            max={120}
            description="Tempo máximo de espera para conexões com APIs"
            suffix="segundos"
            data-testid="input-connection-timeout"
          />
        </CardContent>
      </Card>
    </div>
  );
}
