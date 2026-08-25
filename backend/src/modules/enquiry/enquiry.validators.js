import { z } from 'zod';
import { ENQUIRY_STATUS_VALUES } from './enquiryStatus.config.js';
import { ENQUIRY_TAG_VALUES } from './enquiryTags.config.js';
import { FOLLOWUP_ACTION_VALUES } from './enquiryFollowup.config.js';
import { APPOINTMENT_MODES, MEETING_PLATFORMS } from './enquiryAppointment.config.js';
import { DEMO_ATTENDANCE_VALUES, DEMO_RESULT_VALUES, DEMO_SESSION_STATUS_VALUES } from './enquiryDemo.config.js';
import {
  COMMUNICATION_CHANNEL_VALUES,
  COMMUNICATION_STATUS_VALUES,
  COMMUNICATION_DIRECTION_VALUES,
} from './enquiryCommunication.config.js';

export const ENQUIRY_PRIORITY_VALUES = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];

export const testGivenSchema = z.object({
  name: z.string().min(1),
  score: z.string().optional().nullable(),
});

export const createEnquirySchema = z.object({
  branchId: z.string().uuid(),
  assignedToId: z.string().uuid().optional().nullable(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).optional().nullable(),
  email: z.string().email(),
  mobile: z.string().min(6).max(20),
  mobileCountry: z.string().optional().nullable(),
  alternateNo: z.string().optional().nullable(),
  passportNo: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  maritalStatus: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  highestQual: z.string().optional().nullable(),
  interestedCourse: z.string().optional().nullable(),
  testsGiven: z.array(testGivenSchema).optional().default([]),
  interestedCountry: z.string().optional().nullable(),
  intake: z.string().optional().nullable(),
  applyLevel: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  otherReference: z.string().optional().nullable(),
  status: z.enum(ENQUIRY_STATUS_VALUES).optional(),
  priority: z.enum(ENQUIRY_PRIORITY_VALUES).optional(),
  tags: z.array(z.enum(ENQUIRY_TAG_VALUES)).optional().default([]),
  remark: z.string().optional().nullable(),
});

export const updateEnquirySchema = createEnquirySchema.partial();

export const statusSchema = z.object({
  status: z.enum(ENQUIRY_STATUS_VALUES),
});

export const prioritySchema = z.object({
  priority: z.enum(ENQUIRY_PRIORITY_VALUES),
});

export const tagsSchema = z.object({
  tags: z.array(z.enum(ENQUIRY_TAG_VALUES)),
});

export const bulkIdsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

export const bulkAssignSchema = bulkIdsSchema.extend({
  assignedToId: z.string().uuid(),
});

export const bulkStatusSchema = bulkIdsSchema.extend({
  status: z.enum(ENQUIRY_STATUS_VALUES),
});

export const bulkTagsSchema = bulkIdsSchema.extend({
  tags: z.array(z.enum(ENQUIRY_TAG_VALUES)).min(1),
  mode: z.enum(['add', 'replace']).optional().default('add'),
});

export const bulkMoveBranchSchema = bulkIdsSchema.extend({
  branchId: z.string().uuid(),
});

export const bulkMergeSchema = z.object({
  primaryId: z.string().uuid(),
  ids: z.array(z.string().uuid()).min(2),
});

export const dropSchema = z.object({
  dropReason: z.string().min(3),
});

export const followupSchema = z.object({
  remark: z.string().min(1),
  stage: z.enum(FOLLOWUP_ACTION_VALUES).optional().nullable(),
  attempt: z.number().int().optional(),
  nextDate: z.string().optional().nullable(),
  followupAt: z.string().optional().nullable(),
});

export const appointmentSchema = z.object({
  title: z.string().optional().nullable(),
  remark: z.string().optional().nullable(),
  startAt: z.string(),
  endAt: z.string().optional().nullable(),
  counsellorId: z.string().uuid().optional().nullable(),
  room: z.string().optional().nullable(),
  mode: z.enum(APPOINTMENT_MODES).optional().default('OFFLINE'),
  platform: z.enum(MEETING_PLATFORMS).optional().nullable(),
  meetingLink: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.mode === 'ONLINE' && !data.platform) {
    ctx.addIssue({ code: 'custom', message: 'Select Google Meet or Zoom for online appointments', path: ['platform'] });
  }
  if (data.mode === 'OFFLINE' && !data.room?.trim()) {
    ctx.addIssue({ code: 'custom', message: 'Room is required for offline appointments', path: ['room'] });
  }
});

export const demoSchema = z.object({
  demoDate: z.string(),
  endAt: z.string().optional().nullable(),
  facultyId: z.string().uuid().optional().nullable(),
  className: z.string().optional().nullable(),
  batch: z.string().optional().nullable(),
  sessionStatus: z.enum(DEMO_SESSION_STATUS_VALUES).optional(),
  attendance: z.enum(DEMO_ATTENDANCE_VALUES).optional().default('NOT_MARKED'),
  feedback: z.string().optional().nullable(),
  result: z.enum(DEMO_RESULT_VALUES).optional().default('PENDING'),
  remark: z.string().optional().nullable(),
});

export const demoAttendanceSchema = z.object({
  attendance: z.enum(['NOT_MARKED', 'ATTENDED', 'PRESENT', 'ABSENT', 'LATE', 'NO_SHOW', 'PARTIAL']),
  feedback: z.string().optional().nullable(),
  remark: z.string().optional().nullable(),
  result: z.enum(DEMO_RESULT_VALUES).optional(),
});

export const demoRescheduleSchema = z.object({
  demoDate: z.string(),
  endAt: z.string().optional().nullable(),
  facultyId: z.string().uuid().optional().nullable(),
  className: z.string().optional().nullable(),
  batch: z.string().optional().nullable(),
  remark: z.string().optional().nullable(),
});

export const demoCancelSchema = z.object({
  reason: z.string().min(3).max(2000),
});

export const noteSchema = z.object({
  content: z.string().min(1),
  contentHtml: z.string().optional().nullable(),
  mentions: z.array(z.object({
    userId: z.string().uuid(),
    label: z.string().min(1),
  })).optional().default([]),
  checklist: z.array(z.object({
    id: z.string().min(1),
    text: z.string().min(1),
    done: z.boolean(),
  })).optional().default([]),
  isPinned: z.boolean().optional().default(false),
});

export const notePinSchema = z.object({
  isPinned: z.boolean(),
});

export const noteChecklistSchema = z.object({
  checklist: z.array(z.object({
    id: z.string().min(1),
    text: z.string().min(1),
    done: z.boolean(),
  })),
});

export const communicationSchema = z.object({
  channel: z.enum(COMMUNICATION_CHANNEL_VALUES),
  subject: z.string().optional().nullable(),
  body: z.string().optional().nullable(),
  direction: z.enum(COMMUNICATION_DIRECTION_VALUES).optional().default('OUTBOUND'),
  durationSec: z.coerce.number().int().min(0).optional().nullable(),
  status: z.enum(COMMUNICATION_STATUS_VALUES).optional().default('SENT'),
}).superRefine((data, ctx) => {
  if (data.channel === 'VOICE_NOTE') {
    ctx.addIssue({ code: 'custom', message: 'Use voice upload endpoint for voice notes', path: ['channel'] });
    return;
  }
  if (data.channel === 'EMAIL' && !data.body?.trim() && !data.subject?.trim()) {
    ctx.addIssue({ code: 'custom', message: 'Subject or message is required for email', path: ['body'] });
  }
  if (['WHATSAPP', 'SMS'].includes(data.channel) && !data.body?.trim()) {
    ctx.addIssue({ code: 'custom', message: 'Message is required', path: ['body'] });
  }
  if (data.channel === 'CALL' && !data.body?.trim() && data.durationSec == null) {
    ctx.addIssue({ code: 'custom', message: 'Add call notes or duration', path: ['body'] });
  }
});

export const bulkCommunicationSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  channel: z.enum(['EMAIL', 'SMS', 'WHATSAPP']),
  subject: z.string().optional().nullable(),
  body: z.string().min(1),
});

export const ENQUIRY_SORT_FIELDS = [
  'createdAt', 'updatedAt', 'firstName', 'lastName', 'status', 'priority', 'enquiryCode', 'email',
];

export const duplicateCheckSchema = z.object({
  email: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  alternateNo: z.string().optional().nullable(),
  passportNo: z.string().optional().nullable(),
  excludeId: z.string().uuid().optional().nullable(),
});
