import { z } from 'zod';

const optionalUuid = z.union([
  z.literal(''),
  z.string().uuid(),
]).optional();

/** Reception — counsellor via course mapping, engine pick, or manual selection */
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
  assignedToId: optionalUuid,
  notes: z.string().max(2000).optional().or(z.literal('')),
}).refine(
  (data) => Boolean(data.assignedToId) || Boolean(data.interestedCourse?.trim()),
  { message: 'Select a course or counsellor to assign', path: ['assignedToId'] },
);
