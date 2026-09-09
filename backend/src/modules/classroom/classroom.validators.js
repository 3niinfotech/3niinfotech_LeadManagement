import { z } from 'zod';

const optionalDate = z.union([z.string(), z.date()]).optional().nullable();

export const createAssignmentSchema = z.object({
  batchId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(10000).optional().nullable(),
  startDate: optionalDate,
  dueDate: optionalDate,
  maxMarks: z.coerce.number().min(0).max(10000).optional(),
  attachmentUrl: z.string().max(2000).optional().nullable().or(z.literal('')),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CLOSED']).optional(),
});

export const updateAssignmentSchema = createAssignmentSchema.partial().omit({ batchId: true });

export const submitAssignmentSchema = z.object({
  content: z.string().max(20000).optional().nullable(),
  fileUrl: z.string().max(2000).optional().nullable().or(z.literal('')),
});

export const reviewSubmissionSchema = z.object({
  marks: z.coerce.number().min(0).max(10000).optional().nullable(),
  feedback: z.string().max(5000).optional().nullable(),
});

export const createTestSchema = z.object({
  batchId: z.string().uuid(),
  name: z.string().min(1).max(200),
  type: z.enum(['QUIZ', 'TEST', 'MOCK_TEST', 'EXAM', 'PRACTICE']).optional(),
  testDate: optionalDate,
  startAt: optionalDate,
  endAt: optionalDate,
  durationMinutes: z.coerce.number().int().min(1).max(600).optional().nullable(),
  totalMarks: z.coerce.number().min(0).max(10000).optional(),
  passingMarks: z.coerce.number().min(0).max(10000).optional().nullable(),
  instructions: z.string().max(10000).optional().nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED']).optional(),
});

export const updateTestSchema = createTestSchema.partial().omit({ batchId: true }).extend({
  resultsPublished: z.boolean().optional(),
});

export const saveTestResultsSchema = z.object({
  publish: z.boolean().optional(),
  results: z.array(z.object({
    studentId: z.string().uuid(),
    marks: z.coerce.number().min(0).max(10000).optional().nullable(),
    grade: z.string().max(10).optional().nullable(),
    remarks: z.string().max(2000).optional().nullable(),
  })).min(1),
});

export const createMaterialSchema = z.object({
  batchId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(10000).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  materialType: z.enum(['PDF', 'DOCUMENT', 'PPT', 'IMAGE', 'VIDEO', 'AUDIO', 'LINK', 'OTHER']).optional(),
  fileUrl: z.string().max(2000).optional().nullable().or(z.literal('')),
  externalUrl: z.string().max(2000).optional().nullable().or(z.literal('')),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
});

export const updateMaterialSchema = createMaterialSchema.partial().omit({ batchId: true });

export const remarkSchema = z.object({
  remark: z.string().min(1).max(5000),
  batchId: z.string().uuid().optional().nullable(),
});
