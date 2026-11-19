import { z } from 'zod';
import prisma from '../../config/database.js';
import { AppError } from '../../utils/response.util.js';
import { enquiryRepository } from './enquiry.repository.js';
import { asyncHandler, sendSuccess, sendPaginated, parsePagination } from '../../utils/response.util.js';
import { enquiryService } from './enquiry.service.js';
import { enquiryConversionService } from './enquiryConversion.service.js';
import { enquiryImportService } from './enquiry.import.service.js';
import { assignmentEngine } from '../assignment/assignment.engine.js';
import {
  createEnquirySchema, updateEnquirySchema, statusSchema, prioritySchema, tagsSchema, bulkIdsSchema,
  bulkAssignSchema, dropSchema, followupSchema, appointmentSchema, demoSchema,
  demoAttendanceSchema, demoRescheduleSchema, demoCancelSchema,
  noteSchema, communicationSchema, bulkCommunicationSchema,
  notePinSchema, noteChecklistSchema, duplicateCheckSchema,
  bulkStatusSchema, bulkTagsSchema, bulkMoveBranchSchema, bulkMergeSchema,
} from './enquiry.validators.js';

export const getEnquiries = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = await enquiryService.getAll({ ...req.query, page, limit }, req.user);
  sendPaginated(res, result.data, result.pagination);
});

export const getSummary = asyncHandler(async (req, res) => {
  const data = await enquiryService.getSummary(req.query, req.user);
  sendSuccess(res, data);
});

export const getEnquiry = asyncHandler(async (req, res) => {
  const data = await enquiryService.getById(req.params.id, req.user);
  sendSuccess(res, data);
});

export const checkDuplicates = asyncHandler(async (req, res) => {
  const params = duplicateCheckSchema.parse(req.query);
  const data = await enquiryService.checkDuplicates(params, req.user);
  sendSuccess(res, data);
});

export const createEnquiry = asyncHandler(async (req, res) => {
  const data = createEnquirySchema.parse(req.body);
  const enquiry = await enquiryService.create(data, req.user.id, req);
  sendSuccess(res, enquiry, 'Enquiry created', 201);
});

export const updateEnquiry = asyncHandler(async (req, res) => {
  const data = updateEnquirySchema.parse(req.body);
  const enquiry = await enquiryService.update(req.params.id, data, req.user.id, req);
  sendSuccess(res, enquiry, 'Enquiry updated');
});

export const patchStatus = asyncHandler(async (req, res) => {
  const { status } = statusSchema.parse(req.body);
  const enquiry = await enquiryService.updateStatus(req.params.id, status, req.user.id, req);
  sendSuccess(res, enquiry, 'Status updated');
});

export const patchPriority = asyncHandler(async (req, res) => {
  const { priority } = prioritySchema.parse(req.body);
  const enquiry = await enquiryService.updatePriority(req.params.id, priority, req.user.id, req);
  sendSuccess(res, enquiry, 'Priority updated');
});

export const patchTags = asyncHandler(async (req, res) => {
  const { tags } = tagsSchema.parse(req.body);
  const enquiry = await enquiryService.updateTags(req.params.id, tags, req.user.id, req);
  sendSuccess(res, enquiry, 'Tags updated');
});

export const deleteEnquiry = asyncHandler(async (req, res) => {
  await enquiryService.remove(req.params.id, req.user.id, req);
  sendSuccess(res, null, 'Enquiry deleted');
});

export const bulkDelete = asyncHandler(async (req, res) => {
  const { ids } = bulkIdsSchema.parse(req.body);
  const result = await enquiryService.bulkDelete(ids, req.user.id, req);
  sendSuccess(res, result, 'Bulk delete completed');
});

export const bulkAssign = asyncHandler(async (req, res) => {
  const { ids, assignedToId } = bulkAssignSchema.parse(req.body);
  const result = await enquiryService.bulkAssign(ids, assignedToId, req.user.id, req);
  sendSuccess(res, result, 'Bulk assign completed');
});

export const bulkUpdateStatus = asyncHandler(async (req, res) => {
  const { ids, status } = bulkStatusSchema.parse(req.body);
  const result = await enquiryService.bulkUpdateStatus(ids, status, req.user.id, req);
  sendSuccess(res, result, 'Status updated for selected enquiries');
});

export const bulkAddTags = asyncHandler(async (req, res) => {
  const { ids, tags, mode } = bulkTagsSchema.parse(req.body);
  const result = await enquiryService.bulkAddTags(ids, tags, mode, req.user.id, req);
  sendSuccess(res, result, 'Tags updated for selected enquiries');
});

export const bulkMoveBranch = asyncHandler(async (req, res) => {
  const { ids, branchId } = bulkMoveBranchSchema.parse(req.body);
  const result = await enquiryService.bulkMoveBranch(ids, branchId, req.user.id, req);
  sendSuccess(res, result, 'Branch updated for selected enquiries');
});

export const bulkMerge = asyncHandler(async (req, res) => {
  const { primaryId, ids } = bulkMergeSchema.parse(req.body);
  const result = await enquiryService.mergeEnquiries(primaryId, ids, req.user.id, req);
  sendSuccess(res, result, 'Enquiries merged');
});

export const getBranches = asyncHandler(async (req, res) => {
  const data = await enquiryService.getBranches(req.user);
  sendSuccess(res, data);
});

export const dropEnquiry = asyncHandler(async (req, res) => {
  const { dropReason } = dropSchema.parse(req.body);
  const enquiry = await enquiryService.drop(req.params.id, dropReason, req.user.id, req);
  sendSuccess(res, enquiry, 'Enquiry dropped');
});

export const addFollowup = asyncHandler(async (req, res) => {
  const data = followupSchema.parse(req.body);
  const followup = await enquiryService.addFollowup(req.params.id, data, req.user.id, req);
  sendSuccess(res, followup, 'Follow-up added', 201);
});

export const addAppointment = asyncHandler(async (req, res) => {
  const data = appointmentSchema.parse(req.body);
  const appointment = await enquiryService.addAppointment(req.params.id, data, req.user.id, req);
  sendSuccess(res, appointment, 'Appointment added', 201);
});

export const addDemo = asyncHandler(async (req, res) => {
  const data = demoSchema.parse(req.body);
  const demo = await enquiryService.addDemo(req.params.id, data, req.user.id, req);
  sendSuccess(res, demo, 'Demo recorded', 201);
});

export const listDemos = asyncHandler(async (req, res) => {
  const result = await enquiryService.listDemos(req.query, req.user);
  sendPaginated(res, result.data, result.pagination);
});

export const getDemoSummary = asyncHandler(async (req, res) => {
  const summary = await enquiryService.getDemoSummary(req.query, req.user);
  sendSuccess(res, summary);
});

export const exportDemos = asyncHandler(async (req, res) => {
  const result = await enquiryService.exportDemos(req.body, req.user, req.user.id, req);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
  res.setHeader('X-Export-Count', String(result.count));
  res.setHeader('X-Export-Selected', result.selected ? '1' : '0');
  res.send(result.buffer);
});

export const bulkMarkDemoAttendance = asyncHandler(async (req, res) => {
  const { ids, attendance, result, feedback, remark } = req.body || {};
  const data = await enquiryService.bulkMarkDemoAttendance(ids, { attendance, result, feedback, remark }, req.user.id, req);
  sendSuccess(res, data, 'Attendance updated for selected demos');
});

export const bulkCancelDemos = asyncHandler(async (req, res) => {
  const { ids, reason } = req.body || {};
  const data = await enquiryService.bulkCancelDemos(ids, { reason }, req.user.id, req);
  sendSuccess(res, data, 'Selected demos cancelled');
});

export const markDemoAttendance = asyncHandler(async (req, res) => {
  const data = demoAttendanceSchema.parse(req.body);
  const demo = await enquiryService.markDemoAttendance(req.params.id, req.params.demoId, data, req.user.id, req);
  sendSuccess(res, demo, 'Demo attendance saved');
});

export const rescheduleDemo = asyncHandler(async (req, res) => {
  const data = demoRescheduleSchema.parse(req.body);
  const demo = await enquiryService.rescheduleDemo(req.params.id, req.params.demoId, data, req.user.id, req);
  sendSuccess(res, demo, 'Demo rescheduled');
});

export const cancelDemo = asyncHandler(async (req, res) => {
  const data = demoCancelSchema.parse(req.body);
  const demo = await enquiryService.cancelDemo(req.params.id, req.params.demoId, data, req.user.id, req);
  sendSuccess(res, demo, 'Demo cancelled');
});

export const completeDemo = asyncHandler(async (req, res) => {
  const demo = await enquiryService.completeDemo(req.params.id, req.params.demoId, req.user.id, req);
  sendSuccess(res, demo, 'Demo completed');
});

export const addNote = asyncHandler(async (req, res) => {
  const payload = req.body.payload
    ? noteSchema.parse(JSON.parse(req.body.payload))
    : noteSchema.parse(req.body);
  const note = await enquiryService.addNote(req.params.id, payload, req.user.id, req.files || []);
  sendSuccess(res, note, 'Note added', 201);
});

export const pinNote = asyncHandler(async (req, res) => {
  const { isPinned } = notePinSchema.parse(req.body);
  const note = await enquiryService.pinNote(req.params.id, req.params.noteId, isPinned, req.user.id);
  sendSuccess(res, note, isPinned ? 'Note pinned' : 'Note unpinned');
});

export const updateNoteChecklist = asyncHandler(async (req, res) => {
  const { checklist } = noteChecklistSchema.parse(req.body);
  const note = await enquiryService.updateNoteChecklist(
    req.params.id, req.params.noteId, checklist, req.user.id,
  );
  sendSuccess(res, note, 'Checklist updated');
});

export const addCommunication = asyncHandler(async (req, res) => {
  const data = communicationSchema.parse(req.body);
  const comm = await enquiryService.addCommunication(req.params.id, data, req.user.id, req);
  sendSuccess(res, comm, 'Communication logged', 201);
});

export const addVoiceNote = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Voice note file required' });
  const comm = await enquiryService.addVoiceNote(req.params.id, req.file, req.body, req.user.id);
  sendSuccess(res, comm, 'Voice note saved', 201);
});

export const getTimeline = asyncHandler(async (req, res) => {
  const data = await enquiryService.getTimeline(req.params.id);
  sendSuccess(res, data);
});

export const getDocuments = asyncHandler(async (req, res) => {
  const data = await enquiryService.getDocuments(req.params.id, req.user);
  sendSuccess(res, data);
});

export const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'File required' });
  const doc = await enquiryService.addDocument(
    req.params.id, req.file, req.user.id, req.body.category, req.user,
  );
  sendSuccess(res, doc, 'Document uploaded', 201);
});

export const deleteDocument = asyncHandler(async (req, res) => {
  await enquiryService.removeDocument(req.params.docId, req.user.id, req.params.id, req.user);
  sendSuccess(res, null, 'Document deleted');
});

export const parseImport = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'File required' });
  const rows = await enquiryImportService.parseFile(
    req.file.buffer,
    req.file.originalname,
    req.file.mimetype,
  );
  sendSuccess(res, rows);
});

export const confirmImport = asyncHandler(async (req, res) => {
  const { rows, fileName } = req.body;
  const { resolveWriteBranchId } = await import('../../utils/tenant.util.js');
  const branchId = await resolveWriteBranchId(req.user, req.body.branchId || null);
  const result = await enquiryImportService.confirmImport(rows, req.user.id, branchId, fileName, req);
  sendSuccess(res, result, 'Import completed');
});

export const importHistory = asyncHandler(async (req, res) => {
  const data = await enquiryImportService.getImportHistory(req.user.id);
  sendSuccess(res, data);
});

export const importDuplicates = asyncHandler(async (req, res) => {
  const data = await enquiryImportService.getDuplicates(req.params.batchId);
  sendSuccess(res, data);
});

export const exportEnquiries = asyncHandler(async (req, res) => {
  const result = await enquiryService.exportEnquiries(req.body, req.user, req.user.id, req);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
  res.setHeader('X-Export-Count', String(result.count));
  res.setHeader('X-Export-Selected', result.selected ? '1' : '0');
  res.send(result.buffer);
});

export const bulkCommunication = asyncHandler(async (req, res) => {
  const payload = bulkCommunicationSchema.parse(req.body);
  const data = await enquiryService.bulkCommunication(payload.ids, payload, req.user.id);
  sendSuccess(res, data, 'Communication queued');
});

export const downloadSample = asyncHandler(async (req, res) => {
  const format = String(req.query.format || 'xlsx').toLowerCase();
  if (format === 'csv') {
    const csv = enquiryImportService.getSampleCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=enquiry-import-sample.csv');
    res.send(csv);
    return;
  }

  const buffer = await enquiryImportService.getSampleExcelBuffer();
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.setHeader('Content-Disposition', 'attachment; filename=enquiry-import-sample.xlsx');
  res.send(buffer);
});

export const convertToStudent = asyncHandler(async (req, res) => {
  const data = await enquiryConversionService.convertToStudent(req.params.id, req.user.id, req);
  const message = data.alreadyConverted
    ? 'This enquiry is already converted'
    : data.linkedExisting
      ? 'Linked to existing student — history preserved'
      : 'Converted to student — enquiry, demo & documents linked';
  sendSuccess(res, data, message);
});

export const conversionPreview = asyncHandler(async (req, res) => {
  sendSuccess(res, await enquiryConversionService.getConversionPreview(req.params.id, req.user));
});

export const submitPublicEnquiry = asyncHandler(async (req, res) => {
  const schema = z.object({
    name: z.string().min(1, 'Please enter your name').max(150),
    email: z.string().email('Please enter a valid email address'),
    mobile: z.string().min(10, 'Please enter a valid 10-digit mobile number').max(20),
    interestedCountry: z.string().max(100).optional().nullable(),
    interestedCourse: z.string().max(100).optional().nullable(),
    preferredIntake: z.string().max(100).optional().nullable(),
    highestQualification: z.string().max(100).optional().nullable(),
    city: z.string().max(100).optional().nullable(),
    message: z.string().max(3000).optional().nullable(),
    companyCode: z.string().optional().default('MAIN'),
  });

  const data = schema.parse(req.body);

  // Resolve company
  const company = (await prisma.company.findFirst({
    where: { code: data.companyCode || 'MAIN', deletedAt: null },
  })) || (await prisma.company.findFirst({ where: { deletedAt: null } }));

  if (!company) throw new AppError('Organization context not found', 404);

  // Resolve default branch
  const branch = (await prisma.branch.findFirst({
    where: { companyId: company.id, deletedAt: null, isActive: true },
    orderBy: { createdAt: 'asc' },
  })) || (await prisma.branch.findFirst({ where: { deletedAt: null } }));

  if (!branch) throw new AppError('Active branch not found', 404);

  const parts = data.name.trim().split(/\s+/);
  const firstName = parts[0] || data.name.trim();
  const lastName = parts.slice(1).join(' ') || '';

  // Check if enquiry already exists with this email
  let existing = await prisma.enquiry.findFirst({
    where: {
      email: data.email.toLowerCase().trim(),
      deletedAt: null,
    },
  });

  if (existing) {
    const updated = await prisma.enquiry.update({
      where: { id: existing.id },
      data: {
        mobile: data.mobile || existing.mobile,
        interestedCountry: data.interestedCountry || existing.interestedCountry,
        interestedCourse: data.interestedCourse || existing.interestedCourse,
        remark: existing.remark
          ? `${existing.remark}\n[Website Contact]: ${data.message || 'Follow-up requested from website contact form.'}`
          : `[Website Contact]: ${data.message || 'Follow-up requested from website contact form.'}`,
        metadata: {
          ...(existing.metadata || {}),
          preferredIntake: data.preferredIntake || existing.metadata?.preferredIntake,
          highestQualification: data.highestQualification || existing.metadata?.highestQualification,
          city: data.city || existing.metadata?.city,
        },
      },
    });

    await prisma.activity.create({
      data: {
        action: 'CONTACT_SUBMIT',
        description: `Repeat website enquiry received from ${data.name} (${existing.enquiryCode})`,
        metadata: { enquiryId: existing.id, email: data.email },
      },
    });

    return sendSuccess(
      res,
      { enquiryCode: existing.enquiryCode },
      'Thank you! Your enquiry has been received. Our counsellors will contact you shortly.',
    );
  }

  // Create new enquiry
  const enquiryCode = await enquiryRepository.generateCode(company.id);

  const enquiry = await prisma.enquiry.create({
    data: {
      enquiryCode,
      branchId: branch.id,
      firstName,
      lastName,
      email: data.email.toLowerCase().trim(),
      mobile: data.mobile.trim(),
      interestedCountry: data.interestedCountry || null,
      interestedCourse: data.interestedCourse || null,
      source: 'Website Contact Form',
      status: 'NEW',
      priority: 'HIGH',
      remark: [
        data.message ? `Message: ${data.message}` : null,
        data.highestQualification ? `Qualification: ${data.highestQualification}` : null,
        data.preferredIntake ? `Intake: ${data.preferredIntake}` : null,
        data.city ? `City: ${data.city}` : null,
      ].filter(Boolean).join(' | ') || 'Website enquiry submitted',
      metadata: {
        preferredIntake: data.preferredIntake || null,
        highestQualification: data.highestQualification || null,
        city: data.city || null,
      },
    },
  });

  // Attempt automatic counsellor assignment if available
  try {
    await assignmentEngine.autoAssignEnquiry(enquiry);
  } catch (err) {
    // Non-blocking fallback
  }

  await prisma.activity.create({
    data: {
      action: 'CONTACT_SUBMIT',
      description: `New website contact form enquiry created (${enquiryCode}) for ${data.name}`,
      metadata: { enquiryId: enquiry.id, email: data.email, course: data.interestedCourse },
    },
  });

  return sendSuccess(
    res,
    { enquiryCode },
    'Thank you! Your enquiry has been received. Our certified counsellors will get in touch with you shortly.',
    201,
  );
});

export const bookPublicConsultation = asyncHandler(async (req, res) => {
  const schema = z.object({
    name: z.string().min(1, 'Please enter your name').max(150),
    email: z.string().email('Please enter a valid email address'),
    mobile: z.string().min(10, 'Please enter a valid 10-digit mobile number').max(20),
    preferredCountry: z.string().max(100).optional().nullable(),
    preferredCourse: z.string().max(100).optional().nullable(),
    preferredDate: z.string().min(1, 'Please select your preferred date'),
    preferredTime: z.string().min(1, 'Please select your preferred time slot'),
    consultationType: z.enum(['ONLINE', 'IN_PERSON']).default('ONLINE'),
    message: z.string().max(3000).optional().nullable(),
    city: z.string().max(100).optional().nullable(),
    companyCode: z.string().optional().default('MAIN'),
  });

  const data = schema.parse(req.body);

  // Resolve company
  const company = (await prisma.company.findFirst({
    where: { code: data.companyCode || 'MAIN', deletedAt: null },
  })) || (await prisma.company.findFirst({ where: { deletedAt: null } }));

  if (!company) throw new AppError('Organization context not found', 404);

  // Resolve default branch
  const branch = (await prisma.branch.findFirst({
    where: { companyId: company.id, deletedAt: null, isActive: true },
    orderBy: { createdAt: 'asc' },
  })) || (await prisma.branch.findFirst({ where: { deletedAt: null } }));

  if (!branch) throw new AppError('Active branch not found', 404);

  // Compute scheduled datetime
  let startAt = new Date(`${data.preferredDate}T${data.preferredTime.length === 5 ? `${data.preferredTime}:00` : '10:00:00'}`);
  if (Number.isNaN(startAt.getTime()) || startAt < new Date()) {
    // If invalid or past, schedule for tomorrow same hour
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    startAt = new Date(`${tomorrow.toISOString().slice(0, 10)}T10:00:00`);
  }
  const endAt = new Date(startAt.getTime() + 45 * 60 * 1000); // 45-minute consultation slot

  const parts = data.name.trim().split(/\s+/);
  const firstName = parts[0] || data.name.trim();
  const lastName = parts.slice(1).join(' ') || '';

  // Find or create enquiry
  let enquiry = await prisma.enquiry.findFirst({
    where: {
      email: data.email.toLowerCase().trim(),
      deletedAt: null,
    },
  });

  if (!enquiry) {
    const enquiryCode = await enquiryRepository.generateCode(company.id);
    enquiry = await prisma.enquiry.create({
      data: {
        enquiryCode,
        branchId: branch.id,
        firstName,
        lastName,
        email: data.email.toLowerCase().trim(),
        mobile: data.mobile.trim(),
        interestedCountry: data.preferredCountry || null,
        interestedCourse: data.preferredCourse || null,
        source: 'Website Consultation Booking',
        status: 'NEW',
        priority: 'URGENT',
        remark: `1-on-1 Consultation requested (${data.consultationType === 'ONLINE' ? 'Online Video' : 'In-Person Branch'})${data.message ? `: ${data.message}` : ''}`,
        metadata: {
          consultationType: data.consultationType,
          preferredDate: data.preferredDate,
          preferredTime: data.preferredTime,
          city: data.city || null,
        },
      },
    });

    // Auto-assign to available counsellor
    try {
      await assignmentEngine.autoAssignEnquiry(enquiry);
      const reloaded = await prisma.enquiry.findUnique({ where: { id: enquiry.id } });
      if (reloaded) enquiry = reloaded;
    } catch {
      // Non-blocking
    }
  }

  // Prevent double booking for this enquiry at the exact same slot
  const windowStart = new Date(startAt.getTime() - 30 * 60 * 1000);
  const windowEnd = new Date(startAt.getTime() + 30 * 60 * 1000);

  const existingAppointment = await prisma.enquiryAppointment.findFirst({
    where: {
      enquiryId: enquiry.id,
      startAt: { gte: windowStart, lte: windowEnd },
    },
  });

  if (existingAppointment) {
    return sendSuccess(
      res,
      {
        enquiryCode: enquiry.enquiryCode,
        appointmentId: existingAppointment.id,
        scheduledAt: existingAppointment.startAt,
        mode: existingAppointment.mode,
      },
      'You already have a consultation booked around this time! Our counsellor will connect with you.',
    );
  }

  // Find host user for the appointment (assigned counsellor or branch admin)
  let hostUser = enquiry.assignedToId
    ? await prisma.user.findUnique({ where: { id: enquiry.assignedToId } })
    : await prisma.user.findFirst({ where: { branchId: branch.id, status: 'ACTIVE' } });

  if (!hostUser) {
    hostUser = await prisma.user.findFirst({ where: { status: 'ACTIVE' } });
  }

  const appointment = await prisma.enquiryAppointment.create({
    data: {
      enquiryId: enquiry.id,
      userId: hostUser.id,
      counsellorId: enquiry.assignedToId || hostUser.id,
      title: `1-on-1 Consultation: ${data.name}`,
      remark: [
        `Mode: ${data.consultationType === 'ONLINE' ? 'Online Video Call' : 'In-Person Branch Visit'}`,
        data.preferredCountry ? `Destination: ${data.preferredCountry}` : null,
        data.message ? `Notes: ${data.message}` : null,
      ].filter(Boolean).join(' | '),
      mode: data.consultationType === 'ONLINE' ? 'ONLINE' : 'OFFLINE',
      startAt,
      endAt,
      isCompleted: false,
    },
  });

  await prisma.activity.create({
    data: {
      action: 'CONSULTATION_BOOKED',
      description: `Public consultation booked by ${data.name} for ${startAt.toLocaleDateString()} (${data.consultationType})`,
      metadata: { enquiryId: enquiry.id, appointmentId: appointment.id },
    },
  });

  return sendSuccess(
    res,
    {
      enquiryCode: enquiry.enquiryCode,
      appointmentId: appointment.id,
      scheduledAt: startAt,
      mode: appointment.mode,
    },
    'Consultation booked successfully! Our certified advisor will connect with you as scheduled.',
    201,
  );
});
