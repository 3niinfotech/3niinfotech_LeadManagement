import { z } from 'zod';

export const calendarEventsQuerySchema = z.object({
  from: z.string().min(1, 'from is required'),
  to: z.string().min(1, 'to is required'),
  category: z.string().optional(),
  eventType: z.string().optional(),
  assignedTo: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  search: z.string().optional(),
});

export const calendarSummaryQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  assignedTo: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
});

export const calendarRescheduleSchema = z.object({
  startAt: z.string().min(1),
  endAt: z.string().optional().nullable(),
});

export const calendarAssignSchema = z.object({
  assignedToId: z.string().uuid(),
});
