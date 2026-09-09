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
    'FINANCIAL', 'APPLICATION', 'VISA', 'OTHER',
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
