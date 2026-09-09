import { z } from 'zod';

export const createUserSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).optional().nullable().or(z.literal('')),
  email: z.string().email().max(200),
  phone: z.string().max(30).optional().nullable().or(z.literal('')),
  employeeCode: z.string().max(50).optional().nullable().or(z.literal('')),
  department: z.string().max(100).optional().nullable().or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  roleId: z.string().uuid(),
  branchId: z.string().uuid(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional().default('ACTIVE'),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().max(100).optional().nullable().or(z.literal('')),
  email: z.string().email().max(200).optional(),
  phone: z.string().max(30).optional().nullable().or(z.literal('')),
  employeeCode: z.string().max(50).optional().nullable().or(z.literal('')),
  department: z.string().max(100).optional().nullable().or(z.literal('')),
  password: z.string().min(8).optional().or(z.literal('')),
  roleId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
});

export const userStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
});
