import { z } from 'zod';

export const uploadDocumentSchema = z.object({
  name: z.string().min(1).max(200),
  fileName: z.string().max(255).optional(),
  filePath: z.string().min(1).max(2000).optional(),
  fileUrl: z.string().min(1).max(2000).optional(),
  fileSize: z.coerce.number().int().min(0).optional(),
  mimeType: z.string().max(120).optional(),
  category: z.enum([
    'PERSONAL', 'ACADEMIC', 'PASSPORT', 'LANGUAGE_TEST',
    'FINANCIAL', 'APPLICATION', 'VISA', 'PHOTO', 'OTHER',
  ]).optional(),
  remarks: z.string().max(2000).optional().nullable(),
  replaceId: z.string().uuid().optional().nullable(),
}).refine((d) => d.filePath || d.fileUrl, { message: 'filePath or fileUrl is required' });

export const counselingRequestSchema = z.object({
  startAt: z.union([z.string(), z.date()]),
  endAt: z.union([z.string(), z.date()]).optional().nullable(),
  title: z.string().max(200).optional(),
  note: z.string().max(2000).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
});

export const updateProfileSchema = z.object({
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  emergencyContact: z.string().max(200).optional().nullable(),
});

export const messageCounselorSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(3000),
  subject: z.string().max(200).optional().nullable(),
  counselorId: z.string().uuid().optional().nullable(),
});

export const submitOfflineProofSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  method: z.enum(['BANK_TRANSFER', 'CASH', 'CHEQUE', 'DIRECT_UPI', 'OTHER']).default('BANK_TRANSFER'),
  referenceNo: z.string().max(100).optional().nullable(),
  paymentDate: z.string().optional().nullable(),
  proofUrl: z.string().max(2000).optional().nullable(),
  remarks: z.string().max(1000).optional().nullable(),
});


