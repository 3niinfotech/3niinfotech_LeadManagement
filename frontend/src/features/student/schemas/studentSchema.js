import { z } from 'zod';

export const studentFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  passportNo: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().max(200).optional().or(z.literal('')),
  status: z.string().optional(),
  intake: z.string().optional(),
  course: z.string().optional(),
  university: z.string().optional(),
  country: z.string().optional(),
  branchId: z.string().optional(),
});
