import { z } from 'zod';

const optionalStr = (max = 500) => z.string().max(max).optional().nullable().or(z.literal(''));

export const updateCompanySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  legalName: optionalStr(200),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: optionalStr(30),
  addressLine1: optionalStr(200),
  addressLine2: optionalStr(200),
  city: optionalStr(100),
  state: optionalStr(100),
  postalCode: optionalStr(20),
  countryId: z.string().uuid().optional().nullable().or(z.literal('')),
  taxNumber: optionalStr(80),
  registrationNumber: optionalStr(80),
  website: optionalStr(200),
  isActive: z.boolean().optional(),
});

export const createBranchSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(40).regex(/^[A-Z0-9_-]+$/i, 'Code must be alphanumeric'),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: optionalStr(30),
  addressLine1: optionalStr(200),
  addressLine2: optionalStr(200),
  city: optionalStr(100),
  state: optionalStr(100),
  postalCode: optionalStr(20),
  countryId: z.string().uuid().optional().nullable().or(z.literal('')),
  isActive: z.boolean().optional().default(true),
});

export const updateBranchSchema = createBranchSchema.partial();

export const branchStatusSchema = z.object({
  isActive: z.boolean(),
});
