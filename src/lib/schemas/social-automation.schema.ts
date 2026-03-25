/**
 * Social Media Automation Schemas
 *
 * Zod schemas for automation rules, conditions, and actions.
 */

import { z } from 'zod';

// ============================================
// Condition Schema
// ============================================

export const automationConditionSchema = z.object({
  field: z.string().min(1),
  operator: z.enum(['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'contains', 'not_contains', 'in']),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
});
export type AutomationCondition = z.infer<typeof automationConditionSchema>;

// ============================================
// Action Config Schema
// ============================================

export const automationActionSchema = z.object({
  type: z.string().min(1),
  config: z.record(z.unknown()).default({}),
});
export type AutomationAction = z.infer<typeof automationActionSchema>;

// ============================================
// Automation Rule Schema
// ============================================

export const automationRuleSchema = z.object({
  id: z.string().uuid(),
  business_unit_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
  trigger: z.string().min(1),
  conditions: z.array(automationConditionSchema).default([]),
  actions: z.array(automationActionSchema).min(1),
  is_active: z.boolean().default(true),
  last_triggered_at: z.string().datetime().nullable().optional(),
  trigger_count: z.number().default(0),
  created_by: z.string().uuid().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type AutomationRule = z.infer<typeof automationRuleSchema>;

// ============================================
// Create/Update Schemas
// ============================================

export const createAutomationRuleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  trigger: z.string().min(1),
  conditions: z.array(automationConditionSchema).default([]),
  actions: z.array(automationActionSchema).min(1),
  is_active: z.boolean().default(true),
});
export type CreateAutomationRuleInput = z.infer<typeof createAutomationRuleSchema>;

export const updateAutomationRuleSchema = createAutomationRuleSchema.partial();
export type UpdateAutomationRuleInput = z.infer<typeof updateAutomationRuleSchema>;

// ============================================
// Execution Log Schema
// ============================================

export const automationExecutionSchema = z.object({
  id: z.string().uuid(),
  rule_id: z.string().uuid(),
  trigger_event: z.string(),
  payload: z.record(z.unknown()),
  actions_executed: z.array(z.object({
    type: z.string(),
    status: z.enum(['success', 'failed', 'skipped']),
    result: z.record(z.unknown()).optional(),
    error: z.string().optional(),
  })),
  duration_ms: z.number(),
  created_at: z.string().datetime(),
});
export type AutomationExecution = z.infer<typeof automationExecutionSchema>;
