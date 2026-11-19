import { z } from 'zod';

const optionalNullableString = z.string().nullable().optional();

export const studentFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').nullable().optional().or(z.literal('')),
  phone: optionalNullableString,
  dateOfBirth: optionalNullableString,
  gender: optionalNullableString,
  nationality: optionalNullableString,
  passportNo: optionalNullableString,
  address: optionalNullableString,
  emergencyContact: z.string().max(200).nullable().optional().or(z.literal('')),
  status: optionalNullableString,
  intake: optionalNullableString,
  course: optionalNullableString,
  university: optionalNullableString,
  country: optionalNullableString,
  branchId: optionalNullableString,
});
