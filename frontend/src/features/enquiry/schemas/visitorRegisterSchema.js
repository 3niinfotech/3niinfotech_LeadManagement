import { z } from 'zod';

export const visitorRegisterSchema = z.object({
  fullName: z.string().min(2, 'Full name is required').max(150),
  phone: z.string().min(8, 'Valid mobile required').max(20),
  visitPurpose: z.string().min(2, 'Enter or select visit purpose').max(150),
  email: z.union([z.literal(''), z.string().email()]).optional(),
  notes: z.string().max(2000).optional().or(z.literal('')),
  branchId: z.string().uuid('Branch required'),
  assignedToId: z.string().optional().or(z.literal('')),
});
