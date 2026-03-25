import type { SOCIAL_TRIGGERS, SOCIAL_ACTIONS } from '@/lib/services/social-media/automation.constants';

export type TriggerType = keyof typeof SOCIAL_TRIGGERS;
export type ActionType = keyof typeof SOCIAL_ACTIONS;

export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  trigger: TriggerType;
  conditions: Array<{
    field: string;
    operator: string;
    value: string | number | boolean;
  }>;
  actions: Array<{
    type: ActionType;
    config: Record<string, unknown>;
  }>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AutomationCardProps {
  rule: AutomationRule;
  onToggle: (id: string, active: boolean) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onTest: (id: string) => void;
}

export interface CreateAutomationSectionProps {
  onClose: () => void;
  onSave: (rule: Partial<AutomationRule>) => void;
  initialData?: AutomationRule;
}

export interface SummaryCardsProps {
  totalRules: number;
  activeRules: number;
  inactiveRules: number;
  executionsToday: number;
}

export interface EmptyStateProps {
  onCreate: () => void;
}
