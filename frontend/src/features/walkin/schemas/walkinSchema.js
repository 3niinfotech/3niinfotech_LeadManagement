import { z } from 'zod';

/** Reception — walk-in + required counsellor assignment */
export const walkInFormSchema = z.object({
  fullName: z.string().min(2, 'Full name is required').max(150),
  phone: z.string().min(8, 'Valid mobile number required').max(20),
  email: z.union([z.literal(''), z.string().email('Valid email')]).optional(),
  city: z.string().max(100).optional().or(z.literal('')),
  interestedCountry: z.string().max(100).optional().or(z.literal('')),
  interestedCourse: z.string().max(150).optional().or(z.literal('')),
  visitPurpose: z.string().max(200).optional().or(z.literal('')),
  source: z.enum(['Walk-in', 'Website', 'Phone', 'Facebook', 'Instagram', 'WhatsApp', 'Reference', 'Google']).default('Walk-in'),
  branchId: z.string().uuid('Branch is required'),
  assignedToId: z.string().uuid('Select a counsellor to assign'),
  notes: z.string().max(2000).optional().or(z.literal('')),
});
