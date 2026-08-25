import { z } from 'zod';
import { WALKIN_STATUS_VALUES } from './walkinStatus.config.js';
import { WALKIN_PRIORITY_VALUES } from './walkinPriority.config.js';
import { WALKIN_SOURCES } from './walkinSource.config.js';
import { COUNSELLOR_DECISION_VALUES } from './walkinCounsellorDecision.config.js';

/** Reception — minimal fields + required manual counsellor assign */
export const createWalkInSchema = z.object({
  fullName: z.string().min(2).max(150),
  phone: z.string().min(8).max(20),
  email: z.string().email().optional().nullable().or(z.literal('')),
  city: z.string().max(100).optional().nullable(),
  interestedCountry: z.string().max(100).optional().nullable(),
  interestedCourse: z.string().max(150).optional().nullable(),
  source: z.enum(WALKIN_SOURCES).optional().default('Walk-in'),
  branchId: z.string().uuid(),
  assignedToId: z.string().uuid({ message: 'Counsellor assignment is required' }),
  priority: z.enum(WALKIN_PRIORITY_VALUES).optional().default('NORMAL'),
  notes: z.string().max(2000).optional().nullable(),
  visitPurpose: z.string().min(2).max(200).optional().default('Study Abroad Enquiry'),
  // Legacy optional — not collected at reception UI
  gender: z.string().max(30).optional().nullable(),
  dateOfBirth: z.string().max(20).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  studyLevel: z.string().max(80).optional().nullable(),
  preferredLanguage: z.string().max(50).optional().nullable(),
});

export const counsellorDecisionSchema = z.object({
  decision: z.enum(COUNSELLOR_DECISION_VALUES),
  reason: z.string().max(2000).optional().nullable(),
  followUpDate: z.string().optional().nullable(),
  remarks: z.string().max(2000).optional().nullable(),
});

export const updateWalkInSchema = createWalkInSchema.partial().extend({
  status: z.enum(WALKIN_STATUS_VALUES).optional(),
});

export const walkInStatusSchema = z.object({
  status: z.enum(WALKIN_STATUS_VALUES),
});

export const WALKIN_SORT_FIELDS = [
  'createdAt', 'walkInAt', 'firstName', 'status', 'priority', 'leadCode', 'tokenNumber',
];
