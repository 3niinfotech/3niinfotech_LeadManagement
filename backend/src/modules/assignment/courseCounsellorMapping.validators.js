import { z } from 'zod';

export const courseCounsellorMappingCreateSchema = z.object({
  courseLabel: z.string().min(1).max(150),
  counsellorId: z.string().uuid(),
  branchId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const courseCounsellorMappingUpdateSchema = courseCounsellorMappingCreateSchema.partial();

export const courseCounsellorResolveSchema = z.object({
  courseLabel: z.string().min(1).max(150),
  branchId: z.string().uuid().optional(),
});
