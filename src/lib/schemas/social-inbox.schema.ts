import { z } from 'zod';
import { socialPlatformSchema } from './social-media.schema';

// ============================================
// ENUMS
// ============================================

export const ticketStatusSchema = z.enum([
  'open',
  'in_progress',
  'pending',
  'resolved',
  'closed',
]);
export type TicketStatus = z.infer<typeof ticketStatusSchema>;

export const ticketPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);
export type TicketPriority = z.infer<typeof ticketPrioritySchema>;

export const responseTypeSchema = z.enum([
  'reply',
  'internal_note',
  'macro',
  'system',
]);
export type ResponseType = z.infer<typeof responseTypeSchema>;

export const assignmentStrategySchema = z.enum([
  'round_robin',
  'least_busy',
  'random',
]);
export type AssignmentStrategy = z.infer<typeof assignmentStrategySchema>;

export const queueMemberRoleSchema = z.enum(['agent', 'supervisor', 'admin']);
export type QueueMemberRole = z.infer<typeof queueMemberRoleSchema>;

export const ticketActionSchema = z.enum([
  'created',
  'assigned',
  'unassigned',
  'status_changed',
  'priority_changed',
  'queue_changed',
  'responded',
  'resolved',
  'reopened',
  'closed',
  'sla_breached',
  'tagged',
  'note_added',
]);
export type TicketAction = z.infer<typeof ticketActionSchema>;

// ============================================
// QUEUE SCHEMAS
// ============================================

export const workingHoursSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/), // "09:00"
  end: z.string().regex(/^\d{2}:\d{2}$/), // "18:00"
  timezone: z.string().default('America/Sao_Paulo'),
  days: z.array(z.number().min(0).max(6)).default([1, 2, 3, 4, 5]), // Mon-Fri
});
export type WorkingHours = z.infer<typeof workingHoursSchema>;

export const queueSchema = z.object({
  id: z.string().uuid(),
  business_unit_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
  auto_assign: z.boolean().default(false),
  assignment_strategy: assignmentStrategySchema.default('round_robin'),
  sla_minutes: z.number().min(1).default(60),
  working_hours: workingHoursSchema.nullable().optional(),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Queue = z.infer<typeof queueSchema>;

export const createQueueSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  auto_assign: z.boolean().optional(),
  assignment_strategy: assignmentStrategySchema.optional(),
  sla_minutes: z.number().min(1).optional(),
  working_hours: workingHoursSchema.optional(),
});
export type CreateQueueInput = z.infer<typeof createQueueSchema>;

export const updateQueueSchema = createQueueSchema.partial().extend({
  is_active: z.boolean().optional(),
});
export type UpdateQueueInput = z.infer<typeof updateQueueSchema>;

// ============================================
// TICKET SCHEMAS
// ============================================

export const ticketSchema = z.object({
  id: z.string().uuid(),
  business_unit_id: z.string().uuid(),
  mention_id: z.string().uuid().nullable().optional(),

  status: ticketStatusSchema.default('open'),
  priority: ticketPrioritySchema.default('medium'),

  assigned_to: z.string().uuid().nullable().optional(),
  queue_id: z.string().uuid().nullable().optional(),

  customer_platform: z.string().nullable().optional(),
  customer_username: z.string().nullable().optional(),
  customer_id: z.string().nullable().optional(),

  sla_due_at: z.string().datetime().nullable().optional(),
  sla_breached: z.boolean().default(false),
  first_response_at: z.string().datetime().nullable().optional(),
  resolved_at: z.string().datetime().nullable().optional(),

  tags: z.array(z.string()).default([]),
  notes: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).default({}),

  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Ticket = z.infer<typeof ticketSchema>;

export const createTicketSchema = z.object({
  mention_id: z.string().uuid().optional(),
  priority: ticketPrioritySchema.optional(),
  queue_id: z.string().uuid().optional(),
  assigned_to: z.string().uuid().optional(),
  customer_platform: z.string().optional(),
  customer_username: z.string().optional(),
  customer_id: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});
export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export const updateTicketSchema = z.object({
  status: ticketStatusSchema.optional(),
  priority: ticketPrioritySchema.optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  queue_id: z.string().uuid().nullable().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;

export const listTicketsQuerySchema = z.object({
  status: ticketStatusSchema.optional(),
  priority: ticketPrioritySchema.optional(),
  assigned_to: z.string().uuid().optional(),
  queue_id: z.string().uuid().optional(),
  unassigned: z.coerce.boolean().optional(),
  sla_breached: z.coerce.boolean().optional(),
  customer_platform: z.string().optional(),
  search: z.string().optional(),
  sort_by: z
    .enum(['created_at', 'updated_at', 'priority', 'sla_due_at'])
    .default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});
export type ListTicketsQuery = z.infer<typeof listTicketsQuerySchema>;

// ============================================
// RESPONSE SCHEMAS
// ============================================

export const responseAttachmentSchema = z.object({
  type: z.enum(['image', 'video', 'document', 'link']),
  url: z.string().url(),
  name: z.string().optional(),
  size: z.number().optional(),
});
export type ResponseAttachment = z.infer<typeof responseAttachmentSchema>;

export const ticketResponseSchema = z.object({
  id: z.string().uuid(),
  ticket_id: z.string().uuid(),
  content: z.string().min(1),
  response_type: responseTypeSchema.default('reply'),
  sent_at: z.string().datetime().nullable().optional(),
  sent_by: z.string().uuid().nullable().optional(),
  platform_response_id: z.string().nullable().optional(),
  platform_error: z.string().nullable().optional(),
  attachments: z.array(responseAttachmentSchema).default([]),
  metadata: z.record(z.unknown()).default({}),
  created_at: z.string().datetime(),
});
export type TicketResponse = z.infer<typeof ticketResponseSchema>;

export const createResponseSchema = z.object({
  content: z.string().min(1),
  response_type: responseTypeSchema.optional(),
  attachments: z.array(responseAttachmentSchema).optional(),
  send_immediately: z.boolean().default(true), // Whether to send to platform
});
export type CreateResponseInput = z.infer<typeof createResponseSchema>;

// ============================================
// MACRO SCHEMAS
// ============================================

export const macroSchema = z.object({
  id: z.string().uuid(),
  business_unit_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
  content: z.string().min(1),
  shortcut: z.string().max(50).nullable().optional(),
  category: z.string().max(50).nullable().optional(),
  tags: z.array(z.string()).default([]),
  variations: z.record(socialPlatformSchema, z.string()).default({}),
  use_count: z.number().default(0),
  last_used_at: z.string().datetime().nullable().optional(),
  is_active: z.boolean().default(true),
  created_by: z.string().uuid().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Macro = z.infer<typeof macroSchema>;

export const createMacroSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  content: z.string().min(1),
  shortcut: z.string().max(50).optional(),
  category: z.string().max(50).optional(),
  tags: z.array(z.string()).optional(),
  variations: z.record(socialPlatformSchema, z.string()).optional(),
});
export type CreateMacroInput = z.infer<typeof createMacroSchema>;

export const updateMacroSchema = createMacroSchema.partial().extend({
  is_active: z.boolean().optional(),
});
export type UpdateMacroInput = z.infer<typeof updateMacroSchema>;

export const listMacrosQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});
export type ListMacrosQuery = z.infer<typeof listMacrosQuerySchema>;

// ============================================
// QUEUE MEMBER SCHEMAS
// ============================================

export const queueMemberSchema = z.object({
  id: z.string().uuid(),
  queue_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: queueMemberRoleSchema.default('agent'),
  max_tickets: z.number().min(1).default(10),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime(),
});
export type QueueMember = z.infer<typeof queueMemberSchema>;

export const addQueueMemberSchema = z.object({
  user_id: z.string().uuid(),
  role: queueMemberRoleSchema.optional(),
  max_tickets: z.number().min(1).optional(),
});
export type AddQueueMemberInput = z.infer<typeof addQueueMemberSchema>;

// ============================================
// ACTIVITY SCHEMAS
// ============================================

export const ticketActivitySchema = z.object({
  id: z.string().uuid(),
  ticket_id: z.string().uuid(),
  action: ticketActionSchema,
  actor_id: z.string().uuid().nullable().optional(),
  actor_name: z.string().nullable().optional(),
  old_value: z.string().nullable().optional(),
  new_value: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).default({}),
  created_at: z.string().datetime(),
});
export type TicketActivity = z.infer<typeof ticketActivitySchema>;

// ============================================
// STATS SCHEMAS
// ============================================

export const inboxStatsSchema = z.object({
  total_tickets: z.number(),
  open_tickets: z.number(),
  in_progress_tickets: z.number(),
  pending_tickets: z.number(),
  resolved_today: z.number(),
  sla_breached: z.number(),
  avg_response_time_minutes: z.number(),
  avg_resolution_time_minutes: z.number(),
  tickets_by_priority: z.record(ticketPrioritySchema, z.number()),
  tickets_by_queue: z.array(
    z.object({
      queue_id: z.string().uuid(),
      queue_name: z.string(),
      count: z.number(),
    })
  ),
});
export type InboxStats = z.infer<typeof inboxStatsSchema>;
