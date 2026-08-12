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
