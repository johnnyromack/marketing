import { Card, CardContent } from '@/components/ui/card';
import { FormSelect, FormNumberInput } from '../shared';
import { availableTimezones } from '@/lib/schemas/social-media-settings.schema';
import type { SettingsTabProps } from './types';

/**
 * PreferencesTab - General preferences settings tab
 */
export function PreferencesTab({ settings, onChange }: SettingsTabProps) {
  return (
    <div data-testid="tab-content-preferences" className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">
            Preferencias Gerais
          </h3>
          <div className="space-y-4">
            <FormSelect
              label="Idioma de Análise"
              value={settings.analysis_language}
              onChange={(v) => onChange({ analysis_language: v as 'pt-BR' | 'en-US' | 'es' })}
              description="Idioma usado para análise de sentimento"
              options={[
                { value: 'pt-BR', label: 'Portugues (Brasil)' },
                { value: 'en-US', label: 'English (US)' },
                { value: 'es', label: 'Espanol' },
              ]}
              data-testid="select-analysis-language"
            />

            <FormSelect
              label="Fuso Horario"
              value={settings.timezone}
              onChange={(v) => onChange({ timezone: v })}
              description="Fuso horario para relatórios e agendamentos"
              options={availableTimezones.map((tz) => ({
                value: tz,
                label: tz.replace(/_/g, ' '),
              }))}
              data-testid="select-timezone"
            />

            <FormSelect
              label="Formato de Data"
              value={settings.date_format}
              onChange={(v) => onChange({ date_format: v as 'dd/MM/yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd' })}
              options={[
                { value: 'dd/MM/yyyy', label: 'DD/MM/YYYY (31/12/2024)' },
                { value: 'MM/dd/yyyy', label: 'MM/DD/YYYY (12/31/2024)' },
                { value: 'yyyy-MM-dd', label: 'YYYY-MM-DD (2024-12-31)' },
              ]}
              data-testid="select-date-format"
            />

            <FormSelect
              label="Intervalo de Atualização"
              value={settings.refresh_interval}
              onChange={(v) => onChange({ refresh_interval: v as '1min' | '5min' | '15min' | '30min' | '1h' })}
              description="Com que frequencia os dados devem ser atualizados automaticamente"
              options={[
                { value: '1min', label: 'A cada 1 minuto' },
                { value: '5min', label: 'A cada 5 minutos' },
                { value: '15min', label: 'A cada 15 minutos' },
                { value: '30min', label: 'A cada 30 minutos' },
                { value: '1h', label: 'A cada 1 hora' },
              ]}
              data-testid="select-refresh-interval"
            />

            <FormNumberInput
              label="Itens por Página"
              value={settings.items_per_page}
              onChange={(v) => onChange({ items_per_page: v })}
              min={10}
              max={100}
              description="Quantidade de itens exibidos em listas"
              suffix="itens"
              data-testid="input-items-per-page"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
