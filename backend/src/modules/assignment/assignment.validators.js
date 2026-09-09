import { z } from 'zod';

const PRESENCE_STATUSES = [
  'AVAILABLE', 'BUSY', 'IN_COUNSELLING', 'MEETING', 'BREAK', 'LUNCH',
  'TRAINING', 'LEAVE', 'OFFLINE', 'DND', 'WFH',
];

export const presenceUpdateSchema = z.object({
  status: z.enum(PRESENCE_STATUSES),
});

export const offerResponseSchema = z.object({
  reason: z.string().max(500).optional().nullable(),
});

export const reassignSchema = z.object({
  counsellorId: z.string().uuid(),
  reason: z.string().min(2).max(500),
});

export const manualAssignSchema = z.object({
  counsellorId: z.string().uuid(),
  reason: z.string().min(2).max(500),
});

export const bulkAutoAssignSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
});

export const assignmentConfigSchema = z.object({
  mode: z.enum(['manual', 'automatic', 'hybrid']).optional(),
  autoAssignOnEnquiryCreate: z.boolean().optional(),
  autoAssignOnWalkInCreate: z.boolean().optional(),
  notifyManagerOnUnassigned: z.boolean().optional(),
  scoring: z.record(z.number()).optional(),
  fallback: z.array(z.string()).optional(),
}).partial();

export const temporaryOverrideSchema = z.object({
  unavailable: z.boolean(),
  reason: z.string().min(2).max(500).optional(),
  untilMinutes: z.number().int().min(15).max(480).optional(),
});
