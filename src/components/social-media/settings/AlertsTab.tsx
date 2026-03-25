import { Card, CardContent } from '@/components/ui/card';
import { FormSelect, FormToggle, FormNumberInput, FormTagsInput } from '../shared';
import type { SettingsTabProps } from './types';

/**
 * AlertsTab - Alert configuration settings tab
 */
export function AlertsTab({ settings, onChange }: SettingsTabProps) {
  return (
    <div data-testid="tab-content-alerts" className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">
            Canais de Notificação
          </h3>
          <div className="space-y-4">
            <FormToggle
              label="Alertas por Email"
              checked={settings.email_alerts_enabled}
              onChange={(v) => onChange({ email_alerts_enabled: v })}
              description="Receber alertas de crise e mencoes importantes por email"
              data-testid="toggle-email-alerts"
            />
            <FormToggle
              label="Notificações no App"
              checked={settings.app_notifications_enabled}
              onChange={(v) => onChange({ app_notifications_enabled: v })}
              description="Receber notificações dentro da plataforma"
              data-testid="toggle-app-notifications"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">
            Limiares de Alerta
          </h3>
          <div className="space-y-4">
            <FormNumberInput
              label="Limiar de Sentimento Negativo"
              value={settings.negative_sentiment_threshold}
              onChange={(v) => onChange({ negative_sentiment_threshold: v })}
              min={0}
              max={100}
              description="Percentual de mencoes negativas para disparar alerta"
              suffix="%"
              data-testid="input-negative-sentiment-threshold"
            />
            <FormNumberInput
              label="Limiar de Volume de Mencoes"
              value={settings.mention_volume_threshold}
              onChange={(v) => onChange({ mention_volume_threshold: v })}
              min={1}
              max={10000}
              description="Número de mencoes em curto período para disparar alerta"
              suffix="mencoes"
              data-testid="input-mention-volume-threshold"
            />
            <FormSelect
              label="Frequencia de Verificação"
              value={settings.alert_check_frequency}
              onChange={(v) => onChange({ alert_check_frequency: v as '1min' | '5min' | '15min' | '30min' })}
              description="Com que frequencia verificar condições de alerta"
              options={[
                { value: '1min', label: 'A cada 1 minuto' },
                { value: '5min', label: 'A cada 5 minutos' },
                { value: '15min', label: 'A cada 15 minutos' },
                { value: '30min', label: 'A cada 30 minutos' },
              ]}
              data-testid="select-alert-check-frequency"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">
            Palavras-chave de Crise
          </h3>
          <FormTagsInput
            label=""
            tags={settings.crisis_keywords || []}
            onChange={(tags) => onChange({ crisis_keywords: tags })}
            description="Palavras que disparam alerta imediato quando detectadas"
            placeholder="Adicionar palavra-chave..."
            data-testid="tags-crisis-keywords"
          />
        </CardContent>
      </Card>
    </div>
  );
}
