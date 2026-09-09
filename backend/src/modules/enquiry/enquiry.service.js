import { AppError } from '../../utils/response.util.js';
import { parseSort } from '../../utils/response.util.js';
import { auditLog } from '../../middleware/audit.middleware.js';
import prisma from '../../config/database.js';
import { enquiryRepository } from './enquiry.repository.js';
import { logEnquiryAudit, logEnquiryChanges } from './enquiry.audit.js';
import { buildDataScopeWhere } from '../../utils/scope.util.js';
import {
  mergeScope,
  assertBranchInTenant,
  assertUserInTenant,
  assertCounsellorInTenant,
  assertEnquiryInTenant,
  assertEnquiryIdsInTenant,
  assertLeadInTenant,
  requireTenantCompany,
} from '../../utils/tenant.util.js';
import { ENQUIRY_SORT_FIELDS } from './enquiry.validators.js';
import { CLOSED_VIEW_STATUSES } from './enquiryStatus.config.js';
import { notifyUser, notifyCounsellorAssigned } from '../notification/notification.dispatcher.js';
import { normalizeEnquiryTags } from './enquiryTags.config.js';
import { normalizeDocumentCategory } from './enquiryDocument.config.js';
import { smartReminderService } from './enquirySmartReminder.service.js';
import { SMART_REMINDER_PREFIX } from './enquirySmartReminder.config.js';
import {
  normalizeEnquiryMasterFields,
  hydrateEnquiryMasterLabels,
  hydrateEnquiryListMasterLabels,
} from '../../utils/masterFieldNormalize.util.js';
import { masterRepository } from '../master/master.repository.js';
import { assignmentEngine } from '../assignment/assignment.engine.js';
import { courseCounsellorMappingService } from '../assignment/courseCounsellorMapping.service.js';
import {
  normalizeDemoAttendanceWrite,
  normalizeDemoAttendanceDisplay,
  isDemoAttendanceWindowExpired,
  isDemoAttendanceWindowOpen,
  DEMO_ATTENDANCE_CLOSE_MINUTES_AFTER,
  DEMO_DEFAULT_DURATION_MINUTES,
} from './enquiryDemo.config.js';

const CLOSED_STATUS_SET = new Set([...CLOSED_VIEW_STATUSES, 'CONVERTED']);

const ENQUIRY_TO_LEAD_STATUS = {
  NEW: 'WALK_IN',
  CONTACTED: 'IN_COUNSELLING',
  INTERESTED: 'IN_COUNSELLING',
  HIGHLY_INTERESTED: 'IN_COUNSELLING',
  FOLLOW_UP: 'WALK_IN',
  APPOINTMENT: 'APPOINTMENT',
  DEMO_SCHEDULED: 'IN_COUNSELLING',
  DEMO_ATTENDED: 'IN_COUNSELLING',
  COUNSELLING: 'IN_COUNSELLING',
  DOCUMENTS_PENDING: 'IN_COUNSELLING',
  APPLICATION_STARTED: 'IN_COUNSELLING',
  CONVERTED: 'COMPLETED',
  HOLD: 'WALK_IN',
  LOST: 'CANCELLED',
  NOT_INTERESTED: 'CANCELLED',
  SPAM: 'CANCELLED',
  DUPLICATE: 'CANCELLED',
};

async function findDuplicateStudents(params, user) {
  const or = [];
  if (params.email?.trim()) or.push({ email: params.email.trim() });
  if (params.mobile?.trim()) or.push({ phone: params.mobile.trim() });
  if (params.passportNo?.trim()) {
    or.push({ passportNo: params.passportNo.trim().toUpperCase() });
  }
  if (!or.length) return [];

  const scopeWhere = mergeScope(user, { entity: 'student' });
  return prisma.student.findMany({
    where: { deletedAt: null, ...scopeWhere, OR: or },
    take: 5,
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      studentCode: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      passportNo: true,
      status: true,
    },
  });
}

async function syncLinkedLeadStatus(enquiry, userId) {
  if (!enquiry?.leadId) return;
  const status = ENQUIRY_TO_LEAD_STATUS[enquiry.status];
  if (!status) return;
  await prisma.lead.updateMany({
    where: { id: enquiry.leadId, deletedAt: null },
    data: { status, updatedBy: userId },
  });
}

async function assertFacultyInTenant(facultyId, user) {
  const companyId = requireTenantCompany(user);
  const faculty = await prisma.faculty.findFirst({
    where: { id: facultyId, companyId, deletedAt: null, isActive: true },
  });
  if (!faculty) throw new AppError('Faculty not found', 404);
  return faculty;
}

async function assertDemoDrivenStatusAllowed(enquiryId, status) {
  if (status !== 'DEMO_SCHEDULED' && status !== 'DEMO_ATTENDED') return;
  const demo = status === 'DEMO_SCHEDULED'
    ? await prisma.enquiryDemo.findFirst({
      where: { enquiryId, sessionStatus: 'SCHEDULED' },
    })
    : await prisma.enquiryDemo.findFirst({
      where: { enquiryId, attendance: { not: 'NOT_MARKED' } },
    });
  if (!demo) {
    throw new AppError(
      status === 'DEMO_SCHEDULED'
        ? 'Schedule a demo session from the Demo tab first'
        : 'Mark demo attendance from the Demo tab first',
      409,
    );
  }
}

/**
 * Auto-absent: NOT_MARKED demos whose attendance window has closed → ABSENT.
 * Idempotent (only updates rows still NOT_MARKED). Safe if browser is closed.
 */
export async function reconcileExpiredDemoAttendance({ take = 500 } = {}) {
  const now = new Date();
  const graceMs = DEMO_ATTENDANCE_CLOSE_MINUTES_AFTER * 60 * 1000;
  const defaultSessionMs = DEMO_DEFAULT_DURATION_MINUTES * 60 * 1000;
  const endAtCutoff = new Date(now.getTime() - graceMs);
  const demoDateCutoff = new Date(now.getTime() - graceMs - defaultSessionMs);

  const candidates = await prisma.enquiryDemo.findMany({
    where: {
      attendance: 'NOT_MARKED',
      sessionStatus: { in: ['SCHEDULED', 'COMPLETED'] },
      OR: [
        { endAt: { lte: endAtCutoff } },
        { AND: [{ endAt: null }, { demoDate: { lte: demoDateCutoff } }] },
      ],
    },
    select: { id: true, endAt: true, demoDate: true },
    take,
  });

  const expiredIds = candidates
    .filter((row) => isDemoAttendanceWindowExpired(row, now))
    .map((row) => row.id);

  if (!expiredIds.length) return { updatedCount: 0 };

  const result = await prisma.enquiryDemo.updateMany({
    where: {
      id: { in: expiredIds },
      attendance: 'NOT_MARKED',
    },
    data: {
      attendance: 'ABSENT',
      attendanceMarkedAt: now,
    },
  });

  if (result.count > 0) {
    console.info(`[demo] auto-absent marked ${result.count} session(s)`);
  }

  return { updatedCount: result.count };
}

async function attachDemoDayAndAttendanceMeta(demos = []) {
  if (!demos.length) return demos;
  const now = new Date();
  const enquiryIds = [...new Set(demos.map((d) => d.enquiryId).filter(Boolean))];

  const siblings = enquiryIds.length
    ? await prisma.enquiryDemo.findMany({
      where: {
        enquiryId: { in: enquiryIds },
        sessionStatus: { notIn: ['CANCELLED', 'RESCHEDULED'] },
      },
      select: { id: true, enquiryId: true, demoDate: true },
      orderBy: { demoDate: 'asc' },
    })
    : [];

  const dayById = new Map();
  const grouped = new Map();
  siblings.forEach((s) => {
    if (!grouped.has(s.enquiryId)) grouped.set(s.enquiryId, []);
    grouped.get(s.enquiryId).push(s);
  });
  grouped.forEach((list) => {
    list.forEach((s, index) => {
      dayById.set(s.id, Math.min(index + 1, 3));
    });
  });

  return demos.map((demo) => {
    const attendance = normalizeDemoAttendanceDisplay(demo.attendance);
    const windowExpired = isDemoAttendanceWindowExpired(demo, now);
    const windowOpen = isDemoAttendanceWindowOpen(demo, now);
    const inactive = demo.sessionStatus === 'CANCELLED' || demo.sessionStatus === 'RESCHEDULED';
    return {
      ...demo,
      attendance,
      demoDay: dayById.get(demo.id) || null,
      attendanceWindowOpen: !inactive && windowOpen,
      attendanceWindowExpired: !inactive && windowExpired,
      canMarkAttendance: !inactive && attendance === 'NOT_MARKED' && !windowExpired,
    };
  });
}

function buildAttendanceFilter(value) {
  if (!value) return undefined;
  if (value === 'PRESENT' || value === 'ATTENDED') {
    return { in: ['PRESENT', 'ATTENDED'] };
  }
  if (value === 'ABSENT' || value === 'NO_SHOW' || value === 'MISSED') {
    return { in: ['ABSENT', 'NO_SHOW'] };
  }
  if (value === 'NOT_MARKED') return 'NOT_MARKED';
  return value;
}

/** Assigned walk-ins become enquiries so the counsellor can work them. Unassigned stay on Reception. */
let lastOrphanSyncAt = 0;
const ORPHAN_SYNC_TTL_MS = 60_000;

async function syncOrphanLeadsToEnquiries(user, createFromLead) {
  const now = Date.now();
  if (now - lastOrphanSyncAt < ORPHAN_SYNC_TTL_MS) return;
  lastOrphanSyncAt = now;

  const companyId = requireTenantCompany(user);
  if (!companyId || !createFromLead) return;

  const orphans = await prisma.lead.findMany({
    where: {
      deletedAt: null,
      enquiry: null,
      assignedToId: { not: null },
      branch: { companyId, deletedAt: null },
    },
    orderBy: { createdAt: 'asc' },
    take: 25,
  });

  if (!orphans.length) return;

  await Promise.all(
    orphans.map((lead) =>
      createFromLead(lead, user.id, { user }, { status: 'NEW', priority: 'MEDIUM', fromAssignment: true }),
    ),
  );
}

async function requireEnquiry(id, user) {
  const scopeWhere = mergeScope(user, { entity: 'enquiry' });
  const enquiry = await enquiryRepository.findById(id, scopeWhere);
  if (!enquiry) throw new AppError('Enquiry not found', 404);
  return enquiry;
}

const mapEnquiryInput = (data) => ({
  ...data,
  dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
  passportNo: data.passportNo?.trim() ? data.passportNo.trim().toUpperCase() : null,
  testsGiven: data.testsGiven || [],
  tags: data.tags !== undefined ? normalizeEnquiryTags(data.tags) : undefined,
  lastRemark: data.remark || undefined,
  lastTouchedAt: new Date(),
});

export const enquiryService = {
  getAll: async (query, user) => {
    await syncOrphanLeadsToEnquiries(user, enquiryService.createFromLead.bind(enquiryService));
    const { page, limit, sortBy, sortOrder, ...filters } = query;
    const sort = parseSort({ sortBy, sortOrder }, ENQUIRY_SORT_FIELDS);
    const scopeWhere = mergeScope(user, { entity: 'enquiry' });
    const result = await enquiryRepository.findMany({
      ...filters,
      scopeWhere,
      page: Number(page) || 1,
      limit: Number(limit) || 25,
      sort,
      userId: user.id,
    });
    if (user.companyId && result?.data?.length) {
      result.data = await hydrateEnquiryListMasterLabels(result.data, user.companyId);
    }
    return result;
  },

  getSummary: async (query, user) => {
    await syncOrphanLeadsToEnquiries(user, enquiryService.createFromLead.bind(enquiryService));
    const scopeWhere = mergeScope(user, { entity: 'enquiry' });
    return enquiryRepository.getSummary({ ...query, scopeWhere, userId: user.id });
  },

  getById: async (id, user) => {
    const scopeWhere = mergeScope(user, { entity: 'enquiry' });
    let enquiry = await enquiryRepository.findById(id, scopeWhere);
    if (!enquiry) throw new AppError('Enquiry not found', 404);
    enquiry = await smartReminderService.evaluateAndProcess(enquiry);
    const companyId = enquiry.branch?.companyId || user.companyId;
    if (companyId) {
      enquiry = await hydrateEnquiryMasterLabels(enquiry, companyId);
    }
    const photo = (enquiry.documents || []).find((d) => {
      if (String(d.category || '').toUpperCase() !== 'PHOTO') return false;
      return String(d.mimeType || '').startsWith('image/')
        || /\.(jpe?g|png|gif|webp|bmp)$/i.test(d.fileName || d.name || d.filePath || '')
        || Boolean(d.filePath);
    });
    return {
      ...enquiry,
      photoUrl: photo?.filePath || enquiry.photoUrl || null,
    };
  },

  checkDuplicates: async (params, user) => {
    const scopeWhere = mergeScope(user, { entity: 'enquiry' });
    const matches = await enquiryRepository.findDuplicates({ ...params, scopeWhere });
    return {
      hasDuplicate: matches.length > 0,
      matches,
    };
  },

  create: async (data, userId, req) => {
    const branch = await assertBranchInTenant(data.branchId, req.user);
    if (data.assignedToId) await assertCounsellorInTenant(data.assignedToId, req.user);

    if (!data.allowDuplicate) {
      const scopeWhere = mergeScope(req.user, { entity: 'enquiry' });
      const [enquiryMatches, studentMatches] = await Promise.all([
        enquiryRepository.findDuplicates({
          email: data.email,
          mobile: data.mobile,
          alternateNo: data.alternateNo,
          passportNo: data.passportNo,
          scopeWhere,
        }),
        findDuplicateStudents(data, req.user),
      ]);
      if (enquiryMatches.length || studentMatches.length) {
        throw new AppError('Possible duplicate record found', 409, {
          hasDuplicate: true,
          matches: enquiryMatches,
          studentMatches,
        });
      }
    }

    const { allowDuplicate: _allowDuplicate, manualCounsellorOverride: _m, applyCourseCounsellor: _a, ...input } = data;
    const enquiryCode = await enquiryRepository.generateCode(branch.companyId);
    let status = input.status;
    if (!status) {
      const defaultRow = await masterRepository.findDefaultLeadStatus(branch.companyId);
      if (defaultRow?.code) status = defaultRow.code;
    }

    const normalizedInput = await normalizeEnquiryMasterFields(input, branch.companyId);

    const counsellorResolution = await courseCounsellorMappingService.resolveForEnquiryInput({
      data: normalizedInput,
      user: req.user,
      branchId: branch.id,
    });
    if (counsellorResolution?.validationError) {
      throw new AppError(counsellorResolution.validationError, 422);
    }

    let assignedToId = normalizedInput.assignedToId || null;
    let assignedById = normalizedInput.assignedToId ? userId : null;
    let metadata = {};

    if (counsellorResolution?.assignedToId) {
      await assertCounsellorInTenant(counsellorResolution.assignedToId, req.user);
      assignedToId = counsellorResolution.assignedToId;
      assignedById = counsellorResolution.assignedById;
      metadata = counsellorResolution.metadata || {};
    } else if (normalizedInput.assignedToId) {
      await assertCounsellorInTenant(normalizedInput.assignedToId, req.user);
      assignedToId = normalizedInput.assignedToId;
      assignedById = userId;
      if (input.manualCounsellorOverride) {
        metadata = courseCounsellorMappingService.buildManualAssignmentMeta(
          {},
          userId,
          normalizedInput.interestedCourse,
        );
      }
    }

    const payload = {
      ...mapEnquiryInput(normalizedInput),
      enquiryCode,
      assignedToId,
      assignedById,
      ...(Object.keys(metadata).length ? { metadata } : {}),
      createdBy: userId,
      updatedBy: userId,
      status: status || 'NEW',
      priority: input.priority || 'MEDIUM',
      tags: normalizeEnquiryTags(input.tags || []),
    };
    const enquiry = await enquiryRepository.create(payload);
    await logEnquiryAudit({
      enquiryId: enquiry.id,
      userId,
      action: 'CREATE',
      newValue: enquiryCode,
      description: `Enquiry ${enquiryCode} created`,
      req,
    });
    await auditLog({
      userId, action: 'CREATE', entityType: 'enquiry', entityId: enquiry.id, newData: enquiry, req,
    });

    if (counsellorResolution?.source === 'COURSE_AUTO') {
      await courseCounsellorMappingService.applyToEnquiry({
        enquiry,
        courseLabel: normalizedInput.interestedCourse,
        branchId: branch.id,
        companyId: branch.companyId,
        actorId: userId,
        user: req.user,
        force: true,
        existingMeta: metadata,
      });
      return enquiryRepository.findById(enquiry.id);
    }

    if (!assignedToId) {
      const config = await assignmentEngine.getCompanyAssignmentConfig(branch.companyId);
      if (config.autoAssignOnEnquiryCreate && config.mode !== 'manual') {
        const assignResult = await assignmentEngine.autoAssignEnquiry(enquiry, userId);
        if (assignResult.assigned) return assignResult.enquiry;
      }
    }

    return enquiry;
  },

  /** Qualified enquiry from walk-in — linked to same Lead record */
  createFromLead: async (lead, userId, req, options = {}) => {
    const {
      status = 'INTERESTED',
      priority = 'MEDIUM',
    } = options;

    const existing = await prisma.enquiry.findFirst({
      where: { leadId: lead.id, deletedAt: null },
    });
    if (existing) {
      const updates = { updatedBy: userId, lastTouchedAt: new Date() };
      let changed = false;
      if (!options.fromAssignment && status && existing.status !== status) {
        updates.status = status;
        changed = true;
      }
      // Keep enquiry assignee in sync with walk-in assignment
      if (lead.assignedToId && lead.assignedToId !== existing.assignedToId) {
        updates.assignedToId = lead.assignedToId;
        updates.assignedById = userId;
        changed = true;
      }
      if (changed) {
        return enquiryRepository.update(existing.id, updates);
      }
      return existing;
    }

    const digits = String(lead.phone || '').replace(/\D/g, '');
    const email = lead.email?.trim() || `${digits || 'lead'}@walkin.crm.local`;
    const visitPurpose = lead.metadata?.visitPurpose;
    const remarkParts = [
      lead.notes?.trim(),
      visitPurpose ? `Visit purpose: ${visitPurpose}` : null,
    ].filter(Boolean);

    const branch = await prisma.branch.findUnique({
      where: { id: lead.branchId },
      select: { companyId: true },
    });
    const enquiryCode = await enquiryRepository.generateCode(branch?.companyId);
    const enquiry = await enquiryRepository.create({
      enquiryCode,
      branchId: lead.branchId,
      assignedToId: lead.assignedToId || userId,
      assignedById: userId,
      leadId: lead.id,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email,
      mobile: lead.phone,
      interestedCountry: lead.country,
      interestedCourse: lead.interestedCourse,
      source: lead.source || 'Walk-in',
      remark: remarkParts.length ? remarkParts.join('\n') : null,
      status,
      priority,
      tags: [],
      testsGiven: [],
      lastTouchedAt: new Date(),
      createdBy: userId,
      updatedBy: userId,
    });

    await logEnquiryAudit({
      enquiryId: enquiry.id,
      userId,
      action: 'CREATE',
      newValue: enquiryCode,
      description: options.fromAssignment
        ? `Walk-in ${lead.leadCode} assigned — enquiry opened for counsellor`
        : `Qualified enquiry from walk-in ${lead.leadCode}`,
      req,
    });
    await auditLog({
      userId, action: 'CREATE', entityType: 'enquiry', entityId: enquiry.id, newData: enquiry, req,
    });

    await prisma.activity.create({
      data: {
        userId,
        leadId: lead.id,
        entityType: 'ENQUIRY',
        entityId: enquiry.id,
        action: 'ENQUIRY_CREATED',
        description: options.fromAssignment
          ? `Walk-in ${lead.leadCode} assigned — enquiry ${enquiryCode} opened for counsellor`
          : `Qualified enquiry ${enquiryCode} created from counselling`,
        metadata: { enquiryId: enquiry.id, enquiryCode, leadCode: lead.leadCode },
      },
    });

    return enquiry;
  },

  update: async (id, data, userId, req) => {
    const existing = await requireEnquiry(id, req.user);
    if (data.branchId !== undefined) await assertBranchInTenant(data.branchId, req.user);
    if (data.assignedToId) await assertCounsellorInTenant(data.assignedToId, req.user);
    if (data.status) await assertDemoDrivenStatusAllowed(id, data.status);

    const {
      manualCounsellorOverride: _m,
      applyCourseCounsellor: _a,
      ...input
    } = data;

    const branchId = input.branchId || existing.branchId;
    const companyId = existing.branch?.companyId || req.user?.companyId;
    const normalizedInput = companyId
      ? await normalizeEnquiryMasterFields(input, companyId)
      : input;

    const counsellorResolution = await courseCounsellorMappingService.resolveForEnquiryInput({
      data: normalizedInput,
      existing,
      user: req.user,
      branchId,
    });
    if (counsellorResolution?.validationError) {
      throw new AppError(counsellorResolution.validationError, 422);
    }

    const payload = { ...mapEnquiryInput(normalizedInput), updatedBy: userId };

    if (counsellorResolution?.assignedToId) {
      payload.assignedToId = counsellorResolution.assignedToId;
      payload.assignedById = counsellorResolution.assignedById;
      payload.metadata = {
        ...(existing.metadata || {}),
        ...(counsellorResolution.metadata || {}),
      };
    } else if (input.assignedToId !== undefined) {
      payload.assignedById = input.assignedToId ? userId : null;
      if (input.manualCounsellorOverride && input.assignedToId) {
        payload.metadata = {
          ...(existing.metadata || {}),
          ...courseCounsellorMappingService.buildManualAssignmentMeta(
            existing.metadata || {},
            userId,
            normalizedInput.interestedCourse ?? existing.interestedCourse,
          ),
        };
      }
    }

    const enquiry = await enquiryRepository.update(id, payload);
    await logEnquiryChanges(id, userId, existing, enquiry, [
      'firstName', 'lastName', 'email', 'mobile', 'status', 'priority', 'tags', 'interestedCourse', 'interestedCountry',
    ], req);
    const assignedChanged = enquiry.assignedToId !== existing.assignedToId;
    if (assignedChanged) {
      await logEnquiryAudit({
        enquiryId: id,
        userId,
        action: 'ASSIGN',
        field: 'assignedToId',
        oldValue: existing.assignedToId || '',
        newValue: enquiry.assignedToId || '',
        description: enquiry.assignedToId
          ? (counsellorResolution?.source === 'COURSE_AUTO'
            ? `Counsellor auto-assigned from ${counsellorResolution.metadata?.counsellorAssignment?.courseLabel || 'course'}`
            : 'Counsellor assigned')
          : 'Assignment cleared',
        req,
      });
      if (enquiry.assignedToId) {
        await notifyCounsellorAssigned({
          counsellorId: enquiry.assignedToId,
          lead: {
            id: enquiry.id,
            firstName: enquiry.firstName,
            lastName: enquiry.lastName,
            leadCode: enquiry.enquiryCode,
            branchId: enquiry.branchId,
            enquiry: { id: enquiry.id },
          },
          actorId: userId,
        });
      }
      if (counsellorResolution?.source === 'COURSE_AUTO') {
        const branch = await prisma.branch.findUnique({
          where: { id: enquiry.branchId },
          select: { companyId: true },
        });
        await courseCounsellorMappingService.applyToEnquiry({
          enquiry,
          courseLabel: input.interestedCourse ?? existing.interestedCourse,
          branchId: enquiry.branchId,
          companyId: branch?.companyId,
          actorId: userId,
          user: req.user,
          force: true,
          existingMeta: enquiry.metadata || {},
        });
      }
    }
    await auditLog({
      userId, action: 'UPDATE', entityType: 'enquiry', entityId: id, oldData: existing, newData: enquiry, req,
    });
    if (data.status && data.status !== existing.status) {
      await syncLinkedLeadStatus(enquiry, userId);
    }
    return enquiry;
  },

  updateStatus: async (id, status, userId, req) => {
    const existing = await requireEnquiry(id, req.user);
    await assertDemoDrivenStatusAllowed(id, status);
    const enquiry = await enquiryRepository.update(id, {
      status,
      updatedBy: userId,
      lastTouchedAt: new Date(),
      ...(CLOSED_STATUS_SET.has(status) && status !== 'CONVERTED' ? { droppedAt: new Date() } : {}),
      ...(status === 'CONVERTED' ? { convertedAt: new Date() } : {}),
    });
    await logEnquiryAudit({
      enquiryId: id,
      userId,
      action: 'STATUS_CHANGE',
      field: 'status',
      oldValue: existing.status,
      newValue: status,
      req,
    });
    await auditLog({
      userId, action: 'STATUS_CHANGE', entityType: 'enquiry', entityId: id,
      oldData: { status: existing.status }, newData: { status }, req,
    });
    await syncLinkedLeadStatus(enquiry, userId);
    return enquiry;
  },

  updatePriority: async (id, priority, userId, req) => {
    const existing = await requireEnquiry(id, req.user);
    const enquiry = await enquiryRepository.update(id, {
      priority,
      updatedBy: userId,
      lastTouchedAt: new Date(),
    });
    await logEnquiryAudit({
      enquiryId: id,
      userId,
      action: 'UPDATE',
      field: 'priority',
      oldValue: existing.priority,
      newValue: priority,
      req,
    });
    await auditLog({
      userId, action: 'UPDATE', entityType: 'enquiry', entityId: id,
      oldData: { priority: existing.priority }, newData: { priority }, req,
    });
    return enquiry;
  },

  updateTags: async (id, tags, userId, req) => {
    const existing = await requireEnquiry(id, req.user);
    const normalized = normalizeEnquiryTags(tags);
    const enquiry = await enquiryRepository.update(id, {
      tags: normalized,
      updatedBy: userId,
      lastTouchedAt: new Date(),
    });
    await logEnquiryAudit({
      enquiryId: id,
      userId,
      action: 'UPDATE',
      field: 'tags',
      oldValue: JSON.stringify(existing.tags || []),
      newValue: JSON.stringify(normalized),
      req,
    });
    await auditLog({
      userId, action: 'UPDATE', entityType: 'enquiry', entityId: id,
      oldData: { tags: existing.tags }, newData: { tags: normalized }, req,
    });
    return enquiry;
  },

  remove: async (id, userId, req) => {
    const existing = await requireEnquiry(id, req.user);
    await enquiryRepository.softDelete(id, userId);
    await logEnquiryAudit({ enquiryId: id, userId, action: 'DELETE', description: 'Enquiry soft deleted', req });
    await auditLog({ userId, action: 'DELETE', entityType: 'enquiry', entityId: id, oldData: existing, req });
    return { id };
  },

  bulkDelete: async (ids, userId, req) => {
    await assertEnquiryIdsInTenant(ids, req.user);
    await enquiryRepository.bulkSoftDelete(ids, userId);
    for (const id of ids) {
      await logEnquiryAudit({
        enquiryId: id,
        userId,
        action: 'DELETE',
        description: 'Enquiry soft deleted (bulk)',
        req,
      });
    }
    await auditLog({ userId, action: 'DELETE', entityType: 'enquiry', newData: { ids }, req });
    return { count: ids.length };
  },

  bulkAssign: async (ids, assignedToId, userId, req) => {
    await assertEnquiryIdsInTenant(ids, req.user);
    await assertCounsellorInTenant(assignedToId, req.user);
    await enquiryRepository.bulkAssign(ids, assignedToId, userId, userId);
    for (const id of ids) {
      await logEnquiryAudit({
        enquiryId: id,
        userId,
        action: 'ASSIGN',
        field: 'assignedToId',
        newValue: assignedToId,
        description: 'Bulk assign counsellor',
        req,
      });
    }
    await auditLog({
      userId, action: 'ASSIGN', entityType: 'enquiry', newData: { ids, assignedToId }, req,
    });
    await notifyCounsellorAssigned({
      counsellorId: assignedToId,
      lead: {
        id: ids[0],
        firstName: `${ids.length} enquir${ids.length === 1 ? 'y' : 'ies'}`,
        lastName: '',
        leadCode: '',
        enquiry: { id: ids[0] },
      },
      actorId: userId,
    });
    return { count: ids.length };
  },

  bulkUpdateStatus: async (ids, status, userId, req) => {
    await assertEnquiryIdsInTenant(ids, req.user);
    if (status === 'DEMO_SCHEDULED' || status === 'DEMO_ATTENDED') {
      throw new AppError('Schedule or mark attendance from the Demo tab. Status cannot be bulk-set.', 409);
    }
    await enquiryRepository.bulkUpdateStatus(ids, status, userId);
    for (const id of ids) {
      await logEnquiryAudit({
        enquiryId: id, userId, action: 'STATUS_CHANGE', field: 'status', newValue: status,
      });
    }
    await auditLog({ userId, action: 'UPDATE', entityType: 'enquiry', newData: { ids, status }, req });
    return { count: ids.length };
  },

  bulkAddTags: async (ids, tags, mode, userId, req) => {
    await assertEnquiryIdsInTenant(ids, req.user);
    let count = 0;
    for (const id of ids) {
      const enquiry = await requireEnquiry(id, req.user);
      const current = normalizeEnquiryTags(enquiry.tags || []);
      const next = mode === 'replace' ? tags : [...new Set([...current, ...tags])];
      await enquiryRepository.update(id, { tags: next, updatedBy: userId, lastTouchedAt: new Date() });
      await logEnquiryAudit({
        enquiryId: id, userId, action: 'UPDATE', field: 'tags', newValue: JSON.stringify(next),
      });
      count += 1;
    }
    await auditLog({ userId, action: 'UPDATE', entityType: 'enquiry', newData: { ids, tags, mode }, req });
    return { count };
  },

  bulkMoveBranch: async (ids, branchId, userId, req) => {
    await assertEnquiryIdsInTenant(ids, req.user);
    await assertBranchInTenant(branchId, req.user);
    await enquiryRepository.bulkMoveBranch(ids, branchId, userId);
    await auditLog({ userId, action: 'UPDATE', entityType: 'enquiry', newData: { ids, branchId }, req });
    return { count: ids.length };
  },

  mergeEnquiries: async (primaryId, ids, userId, req) => {
    const primary = await requireEnquiry(primaryId, req.user);

    const mergeIds = ids.filter((id) => id !== primaryId);
    if (!mergeIds.length) throw new AppError('Select at least one other enquiry to merge', 400);
    await assertEnquiryIdsInTenant(mergeIds, req.user);

    for (const id of mergeIds) {
      const secondary = await requireEnquiry(id, req.user);

      await enquiryRepository.addNote({
        enquiryId: primaryId,
        userId,
        content: `Merged enquiry ${secondary.enquiryCode} (${secondary.firstName} ${secondary.lastName || ''})`,
        contentHtml: null,
        mentions: [],
        checklist: [],
        isPinned: false,
      });

      await enquiryRepository.update(id, {
        status: 'DUPLICATE',
        metadata: { ...(secondary.metadata || {}), mergedIntoId: primaryId },
        updatedBy: userId,
      });
      await logEnquiryAudit({
        enquiryId: id,
        userId,
        action: 'MERGED',
        description: `Merged into ${primary.enquiryCode}`,
        newValue: primaryId,
        req,
      });
      await enquiryRepository.softDelete(id, userId);

      await logEnquiryAudit({
        enquiryId: primaryId,
        userId,
        action: 'MERGED',
        description: `Merged ${secondary.enquiryCode} into this record`,
        newValue: secondary.enquiryCode,
        req,
      });
    }

    await auditLog({
      userId, action: 'UPDATE', entityType: 'enquiry', newData: { primaryId, mergedIds: mergeIds }, req,
    });
    return { primaryId, merged: mergeIds.length };
  },

  exportEnquiries: async (query, user, userId, req) => {
    const { sortBy, sortOrder, ids: requestedIds, format, ...filters } = query;
    const sort = parseSort({ sortBy, sortOrder }, ENQUIRY_SORT_FIELDS) || { createdAt: 'desc' };
    const scopeWhere = mergeScope(user);

    const selected = Array.isArray(requestedIds) && requestedIds.length > 0;
    if (selected) {
      await assertEnquiryIdsInTenant(requestedIds, user);
    }

    const result = await enquiryRepository.findMany({
      ...filters,
      ...(selected ? { ids: requestedIds } : {}),
      scopeWhere,
      page: 1,
      limit: selected ? Math.max(requestedIds.length, 1) : 5000,
      sort,
      userId: user.id,
    });

    const rows = result.data;
    const exportedIds = rows.map((row) => row.id);

    for (const id of exportedIds) {
      await logEnquiryAudit({
        enquiryId: id,
        userId,
        action: 'EXPORTED',
        description: 'Included in enquiry Excel export',
        req,
      });
    }

    await auditLog({
      userId,
      action: 'EXPORT',
      entityType: 'enquiry',
      newData: { count: exportedIds.length, ids: exportedIds, selected },
      req,
    });

    const { buildEnquiryExportWorkbook, buildEnquiryExportFilename } = await import('./enquiry.export.service.js');
    const buffer = await buildEnquiryExportWorkbook(rows, { selected });
    const filename = buildEnquiryExportFilename({ selected });

    return { buffer, filename, count: rows.length, selected };
  },

  getBranches: async (user) => {
    if (!user?.branchId) return enquiryRepository.listBranches();
    const branch = await prisma.branch.findUnique({
      where: { id: user.branchId },
      select: { companyId: true },
    });
    return enquiryRepository.listBranches(branch?.companyId);
  },

  drop: async (id, dropReason, userId, req) => {
    const existing = await requireEnquiry(id, req.user);
    const enquiry = await enquiryRepository.update(id, {
      status: 'LOST',
      dropReason,
      droppedAt: new Date(),
      updatedBy: userId,
      lastTouchedAt: new Date(),
    });
    await logEnquiryAudit({
      enquiryId: id, userId, action: 'DROP', field: 'status', newValue: 'LOST', description: dropReason,
    });
    await auditLog({ userId, action: 'STATUS_CHANGE', entityType: 'enquiry', entityId: id, newData: enquiry, req });
    return enquiry;
  },

  addFollowup: async (id, data, userId, req) => {
    const enquiry = await requireEnquiry(id, req.user);
    const stage = data.stage || 'CALL';
    const nextDate = data.nextDate ? new Date(data.nextDate) : null;
    const followup = await enquiryRepository.addFollowup({
      enquiryId: id,
      userId,
      remark: data.remark,
      stage,
      attempt: data.attempt || 1,
      nextDate,
      followupAt: data.followupAt ? new Date(data.followupAt) : new Date(),
    });

    const isSystemReminder = stage === 'REMINDER'
      && String(data.remark || '').startsWith(SMART_REMINDER_PREFIX);
    if (!isSystemReminder) {
      await smartReminderService.clearForNewFollowup(id, enquiry.metadata || {});
    }

    await enquiryRepository.update(id, {
      lastRemark: data.remark,
      lastTouchedAt: new Date(),
      updatedBy: userId,
      status: enquiry.status === 'NEW' ? 'FOLLOW_UP' : enquiry.status,
    });
    await logEnquiryAudit({
      enquiryId: id, userId, action: 'FOLLOWUP', field: 'stage', newValue: stage, description: data.remark, req,
    });
    return followup;
  },

  addAppointment: async (id, data, userId, req) => {
    await requireEnquiry(id, req.user);
    if (data.counsellorId) await assertCounsellorInTenant(data.counsellorId, req.user);
    const appointment = await enquiryRepository.addAppointment({
      enquiryId: id,
      userId,
      title: data.title || (data.mode === 'ONLINE' ? 'Online Counselling' : 'In-person Meeting'),
      remark: data.remark,
      counsellorId: data.counsellorId || null,
      room: data.mode === 'OFFLINE' ? data.room : null,
      mode: data.mode || 'OFFLINE',
      platform: data.mode === 'ONLINE' ? data.platform : null,
      meetingLink: data.mode === 'ONLINE' ? data.meetingLink : null,
      startAt: new Date(data.startAt),
      endAt: data.endAt ? new Date(data.endAt) : null,
    });
    await enquiryRepository.update(id, {
      lastTouchedAt: new Date(),
      updatedBy: userId,
      status: data.mode === 'ONLINE' ? 'COUNSELLING' : 'APPOINTMENT',
    });
    const detail = [
      data.mode,
      data.platform,
      data.room,
      data.meetingLink,
    ].filter(Boolean).join(' · ');
    await logEnquiryAudit({
      enquiryId: id,
      userId,
      action: 'APPOINTMENT',
      description: detail || data.title || 'Appointment',
      newValue: data.remark || undefined,
      req,
    });
    return appointment;
  },

  addDemo: async (id, data, userId, req) => {
    const enquiry = await requireEnquiry(id, req.user);
    if (data.facultyId) await assertFacultyInTenant(data.facultyId, req.user);

    const demoDate = new Date(data.demoDate);
    const endAt = data.endAt ? new Date(data.endAt) : new Date(demoDate.getTime() + 60 * 60 * 1000);
    const attendance = normalizeDemoAttendanceWrite(data.attendance) || 'NOT_MARKED';
    const result = data.result || 'PENDING';

    const demo = await enquiryRepository.addDemo({
      enquiryId: id,
      userId,
      facultyId: data.facultyId || null,
      demoDate,
      endAt,
      sessionStatus: data.sessionStatus || 'SCHEDULED',
      className: data.className?.trim() || null,
      batch: data.batch?.trim() || null,
      attendance,
      attendanceMarkedAt: attendance !== 'NOT_MARKED' ? new Date() : null,
      attendanceMarkedById: attendance !== 'NOT_MARKED' ? userId : null,
      feedback: data.feedback?.trim() || null,
      result,
      remark: data.remark?.trim() || null,
    });

    let nextStatus = enquiry.status;
    if (result === 'CONVERTED') {
      // Demo outcome "CONVERTED" ≠ enquiry converted — use attended/demo-completed status
      nextStatus = attendance !== 'NOT_MARKED' ? 'DEMO_ATTENDED' : 'DEMO_SCHEDULED';
    } else if (attendance !== 'NOT_MARKED') {
      nextStatus = 'DEMO_ATTENDED';
    } else {
      nextStatus = 'DEMO_SCHEDULED';
    }

    await enquiryRepository.update(id, {
      lastTouchedAt: new Date(),
      updatedBy: userId,
      status: nextStatus,
    });

    const detail = [
      data.className,
      data.batch,
      attendance !== 'NOT_MARKED' ? attendance : null,
      result !== 'PENDING' ? result : null,
    ].filter(Boolean).join(' · ');

    await logEnquiryAudit({
      enquiryId: id,
      userId,
      action: 'DEMO',
      description: detail || 'Demo recorded',
      newValue: data.feedback || data.remark || undefined,
      req,
    });

    return demo;
  },

  listDemos: async (query, user) => {
    await reconcileExpiredDemoAttendance();

    const take = Math.min(Number(query.limit) || 50, 200);
    const currentPage = Number(query.page) || 1;
    const offset = (currentPage - 1) * take;

    const enquiryScope = mergeScope(user, { entity: 'enquiry' });
    const where = { enquiry: { ...enquiryScope, deletedAt: null } };

    // Hide superseded sessions from default list (reschedule creates a new active row)
    if (!query.sessionStatus && query.view !== 'history') {
      where.sessionStatus = { not: 'RESCHEDULED' };
    }

    if (query.ids) {
      const ids = Array.isArray(query.ids)
        ? query.ids
        : String(query.ids).split(',').map((s) => s.trim()).filter(Boolean);
      if (ids.length) where.id = { in: ids };
    }

    if (query.sessionStatus) where.sessionStatus = query.sessionStatus;
    const attendanceFilter = buildAttendanceFilter(query.attendance);
    if (attendanceFilter) where.attendance = attendanceFilter;
    if (query.result) where.result = query.result;
    if (query.facultyId) where.facultyId = query.facultyId;
    if (query.branchId) where.enquiry.branchId = query.branchId;

    if (query.course || query.className) {
      const c = query.course || query.className;
      where.OR = [
        { className: { contains: c } },
        { enquiry: { interestedCourse: { contains: c } } },
      ];
    }

    if (query.search) {
      const s = String(query.search).trim();
      const searchConditions = [
        { className: { contains: s } },
        { batch: { contains: s } },
        { enquiry: { firstName: { contains: s } } },
        { enquiry: { lastName: { contains: s } } },
        { enquiry: { enquiryCode: { contains: s } } },
        { enquiry: { mobile: { contains: s } } },
        { enquiry: { email: { contains: s } } },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchConditions }];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    if (query.view === 'today') {
      where.demoDate = { gte: todayStart, lte: todayEnd };
    } else if (query.view === 'upcoming') {
      where.demoDate = { gte: todayStart };
      where.sessionStatus = 'SCHEDULED';
    } else if (query.view === 'attended') {
      where.attendance = { in: ['ATTENDED', 'PRESENT'] };
    } else if (query.view === 'missed') {
      where.attendance = { in: ['ABSENT', 'NO_SHOW'] };
    } else if (query.view === 'converted') {
      where.result = 'CONVERTED';
    }

    if (query.from || query.to) {
      where.demoDate = where.demoDate || {};
      if (query.from) where.demoDate.gte = new Date(query.from);
      if (query.to) {
        const toDate = new Date(query.to);
        toDate.setHours(23, 59, 59, 999);
        where.demoDate.lte = toDate;
      }
    }

    const [raw, total] = await Promise.all([
      enquiryRepository.listDemos(where, { skip: offset, take }),
      enquiryRepository.countDemos(where),
    ]);
    const data = await attachDemoDayAndAttendanceMeta(raw);
    return { data, pagination: { page: currentPage, limit: take, total } };
  },

  getDemoSummary: async (query = {}, user) => {
    await reconcileExpiredDemoAttendance();

    const enquiryScope = mergeScope(user, { entity: 'enquiry' });
    const baseWhere = { enquiry: { ...enquiryScope, deletedAt: null } };
    if (query.branchId) baseWhere.enquiry.branchId = query.branchId;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayWhere = { ...baseWhere, demoDate: { gte: todayStart, lte: todayEnd } };
    const activeSession = { sessionStatus: { notIn: ['CANCELLED', 'RESCHEDULED'] } };
    const listWhere = { ...baseWhere, ...activeSession };

    const [
      total, today, scheduled, attended, converted, missed, pendingOutcome,
      present, absent, notMarked,
      todayPresent, todayAbsent, todayNotMarked,
    ] = await Promise.all([
      prisma.enquiryDemo.count({ where: listWhere }),
      prisma.enquiryDemo.count({ where: todayWhere }),
      prisma.enquiryDemo.count({
        where: { ...baseWhere, sessionStatus: 'SCHEDULED' },
      }),
      prisma.enquiryDemo.count({
        where: { ...baseWhere, attendance: { in: ['ATTENDED', 'PRESENT'] } },
      }),
      prisma.enquiryDemo.count({
        where: { ...baseWhere, result: 'CONVERTED' },
      }),
      prisma.enquiryDemo.count({
        where: { ...baseWhere, attendance: { in: ['ABSENT', 'NO_SHOW'] } },
      }),
      prisma.enquiryDemo.count({
        where: {
          ...baseWhere,
          attendance: { in: ['ATTENDED', 'PRESENT'] },
          result: 'PENDING',
        },
      }),
      prisma.enquiryDemo.count({
        where: { ...baseWhere, ...activeSession, attendance: { in: ['PRESENT', 'ATTENDED'] } },
      }),
      prisma.enquiryDemo.count({
        where: { ...baseWhere, ...activeSession, attendance: { in: ['ABSENT', 'NO_SHOW'] } },
      }),
      prisma.enquiryDemo.count({
        where: { ...baseWhere, ...activeSession, attendance: 'NOT_MARKED' },
      }),
      prisma.enquiryDemo.count({
        where: { ...todayWhere, ...activeSession, attendance: { in: ['PRESENT', 'ATTENDED'] } },
      }),
      prisma.enquiryDemo.count({
        where: { ...todayWhere, ...activeSession, attendance: { in: ['ABSENT', 'NO_SHOW'] } },
      }),
      prisma.enquiryDemo.count({
        where: { ...todayWhere, ...activeSession, attendance: 'NOT_MARKED' },
      }),
    ]);

    const applicable = present + absent;
    const attendanceRate = applicable > 0
      ? Math.round((present / applicable) * 10000) / 100
      : null;
    const todayApplicable = todayPresent + todayAbsent;
    const todayAttendanceRate = todayApplicable > 0
      ? Math.round((todayPresent / todayApplicable) * 10000) / 100
      : null;

    return {
      total,
      today,
      scheduled,
      attended,
      converted,
      missed,
      pendingOutcome,
      present,
      absent,
      notMarked,
      attendanceRate,
      todayPresent,
      todayAbsent,
      todayNotMarked,
      todayTotal: todayPresent + todayAbsent + todayNotMarked,
      todayAttendanceRate,
    };
  },

  exportDemos: async (query = {}, user, userId, req) => {
    const { ids: requestedIds } = query;
    const selected = Array.isArray(requestedIds) && requestedIds.length > 0;

    const enquiryScope = mergeScope(user, { entity: 'enquiry' });
    const where = { enquiry: { ...enquiryScope, deletedAt: null } };

    if (selected) {
      where.id = { in: requestedIds };
    } else {
      if (query.sessionStatus) where.sessionStatus = query.sessionStatus;
      if (query.attendance) {
        if (query.attendance === 'ATTENDED') {
          where.attendance = { in: ['ATTENDED', 'PRESENT'] };
        } else if (query.attendance === 'ABSENT') {
          where.attendance = { in: ['ABSENT', 'NO_SHOW'] };
        } else {
          where.attendance = query.attendance;
        }
      }
      if (query.result) where.result = query.result;
      if (query.facultyId) where.facultyId = query.facultyId;
      if (query.branchId) where.enquiry.branchId = query.branchId;

      if (query.course || query.className) {
        const c = query.course || query.className;
        where.OR = [
          { className: { contains: c } },
          { enquiry: { interestedCourse: { contains: c } } },
        ];
      }

      if (query.search) {
        const s = String(query.search).trim();
        const searchConditions = [
          { className: { contains: s } },
          { batch: { contains: s } },
          { enquiry: { firstName: { contains: s } } },
          { enquiry: { lastName: { contains: s } } },
          { enquiry: { enquiryCode: { contains: s } } },
          { enquiry: { mobile: { contains: s } } },
          { enquiry: { email: { contains: s } } },
        ];
        if (where.OR) {
          where.AND = [{ OR: where.OR }, { OR: searchConditions }];
          delete where.OR;
        } else {
          where.OR = searchConditions;
        }
      }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      if (query.view === 'today') {
        where.demoDate = { gte: todayStart, lte: todayEnd };
      } else if (query.view === 'upcoming') {
        where.demoDate = { gte: todayStart };
        where.sessionStatus = 'SCHEDULED';
      } else if (query.view === 'attended') {
        where.attendance = { in: ['ATTENDED', 'PRESENT'] };
      } else if (query.view === 'missed') {
        where.attendance = { in: ['ABSENT', 'NO_SHOW'] };
      } else if (query.view === 'converted') {
        where.result = 'CONVERTED';
      }

      if (query.from || query.to) {
        where.demoDate = where.demoDate || {};
        if (query.from) where.demoDate.gte = new Date(query.from);
        if (query.to) {
          const toDate = new Date(query.to);
          toDate.setHours(23, 59, 59, 999);
          where.demoDate.lte = toDate;
        }
      }
    }

    const rows = await enquiryRepository.listDemos(where, {
      skip: 0,
      take: selected ? Math.max(requestedIds.length, 1) : 5000,
    });

    const { buildDemoExportWorkbook, buildDemoExportFilename } = await import('./enquiry.demo.export.service.js');
    const buffer = await buildDemoExportWorkbook(rows, { selected });
    const filename = buildDemoExportFilename({ selected });

    await auditLog({
      userId,
      action: 'EXPORT',
      entityType: 'enquiryDemo',
      newData: { count: rows.length, selected },
      req,
    });

    return { buffer, filename, count: rows.length, selected };
  },

  bulkMarkDemoAttendance: async (demoIds = [], data = {}, userId, req) => {
    if (!Array.isArray(demoIds) || !demoIds.length) {
      throw new AppError('No demo sessions selected', 400);
    }

    const attendance = normalizeDemoAttendanceWrite(data.attendance);
    if (!attendance || attendance === 'NOT_MARKED') {
      throw new AppError('Attendance must be PRESENT or ABSENT', 400);
    }

    const enquiryScope = mergeScope(req.user, { entity: 'enquiry' });
    const scoped = await prisma.enquiryDemo.findMany({
      where: {
        id: { in: demoIds },
        sessionStatus: { notIn: ['CANCELLED', 'RESCHEDULED'] },
        enquiry: { ...enquiryScope, deletedAt: null },
      },
      select: { id: true },
    });
    const allowedIds = scoped.map((d) => d.id);
    if (!allowedIds.length) {
      throw new AppError('No eligible demo sessions in your tenant scope', 404);
    }

    const updatePayload = {
      attendance,
      attendanceMarkedAt: new Date(),
      attendanceMarkedById: userId,
    };
    if (data.result) updatePayload.result = data.result;
    if (data.feedback !== undefined) updatePayload.feedback = data.feedback;
    if (data.remark !== undefined) updatePayload.remark = data.remark;

    const result = await prisma.enquiryDemo.updateMany({
      where: { id: { in: allowedIds } },
      data: updatePayload,
    });

    await auditLog({
      userId,
      action: 'UPDATE',
      entityType: 'enquiryDemo',
      newData: { bulk: true, count: result.count, demoIds: allowedIds, ...updatePayload },
      req,
    });

    return { updatedCount: result.count };
  },

  bulkCancelDemos: async (demoIds = [], data = {}, userId, req) => {
    if (!Array.isArray(demoIds) || !demoIds.length) {
      throw new AppError('No demo sessions selected', 400);
    }

    const enquiryScope = mergeScope(req.user, { entity: 'enquiry' });
    const scoped = await prisma.enquiryDemo.findMany({
      where: {
        id: { in: demoIds },
        sessionStatus: 'SCHEDULED',
        enquiry: { ...enquiryScope, deletedAt: null },
      },
      select: { id: true },
    });
    const allowedIds = scoped.map((d) => d.id);
    if (!allowedIds.length) {
      throw new AppError('No eligible demo sessions in your tenant scope', 404);
    }

    const result = await prisma.enquiryDemo.updateMany({
      where: { id: { in: allowedIds } },
      data: {
        sessionStatus: 'CANCELLED',
        cancelledReason: data.reason || 'Bulk cancelled',
      },
    });

    await auditLog({
      userId,
      action: 'UPDATE',
      entityType: 'enquiryDemo',
      newData: { bulk: true, cancelledCount: result.count, demoIds: allowedIds, reason: data.reason },
      req,
    });

    return { cancelledCount: result.count };
  },

  markDemoAttendance: async (enquiryId, demoId, data, userId, req) => {
    await requireEnquiry(enquiryId, req.user);
    const demo = await enquiryRepository.findDemoById(demoId);
    if (!demo || demo.enquiryId !== enquiryId) throw new AppError('Demo session not found', 404);
    if (demo.sessionStatus === 'CANCELLED' || demo.sessionStatus === 'RESCHEDULED') {
      throw new AppError('Attendance can only be marked on the active scheduled session', 409);
    }

    const attendance = normalizeDemoAttendanceWrite(data.attendance);
    if (!attendance) {
      throw new AppError('Attendance must be PRESENT, ABSENT, or NOT_MARKED', 400);
    }

    const current = normalizeDemoAttendanceDisplay(demo.attendance);
    if (attendance !== 'NOT_MARKED' && current === attendance) {
      const [enriched] = await attachDemoDayAndAttendanceMeta([demo]);
      return enriched;
    }

    const updated = await enquiryRepository.updateDemo(demoId, {
      attendance,
      feedback: data.feedback !== undefined ? data.feedback : demo.feedback,
      remark: data.remark !== undefined ? data.remark : demo.remark,
      result: data.result || demo.result,
      attendanceMarkedAt: attendance === 'NOT_MARKED' ? null : new Date(),
      attendanceMarkedById: attendance === 'NOT_MARKED' ? null : userId,
    });

    if (attendance !== 'NOT_MARKED' && demo.enquiry?.status !== 'CONVERTED') {
      await enquiryRepository.update(enquiryId, {
        lastTouchedAt: new Date(),
        updatedBy: userId,
        status: attendance === 'ABSENT' ? demo.enquiry.status : 'DEMO_ATTENDED',
      });
    }

    await logEnquiryAudit({
      enquiryId,
      userId,
      action: 'DEMO',
      field: 'attendance',
      oldValue: demo.attendance,
      newValue: attendance,
      description: `Demo attendance ${current} → ${attendance}`,
      req,
    });
    await auditLog({
      userId, action: 'UPDATE', entityType: 'EnquiryDemo', entityId: demoId,
      oldData: { attendance: demo.attendance }, newData: { attendance }, req,
    });

    const counsellorId = demo.enquiry?.assignedToId;
    if (attendance === 'ABSENT' && counsellorId) {
      await notifyUser(counsellorId, {
        type: 'WARNING',
        title: `Demo absent: ${demo.enquiry.firstName} ${demo.enquiry.lastName || ''}`.trim(),
        message: `${demo.enquiry.firstName} did not attend the demo session.`,
        link: `/admin/enquiries/${enquiryId}/demo`,
        metadata: { kind: 'DEMO_ABSENT', enquiryId, demoId, attendance },
      });
    }

    const [enriched] = await attachDemoDayAndAttendanceMeta([{ ...updated, enquiry: demo.enquiry }]);
    return enriched;
  },

  rescheduleDemo: async (enquiryId, demoId, data, userId, req) => {
    await requireEnquiry(enquiryId, req.user);
    if (data.facultyId) await assertFacultyInTenant(data.facultyId, req.user);
    const demo = await enquiryRepository.findDemoById(demoId);
    if (!demo || demo.enquiryId !== enquiryId) throw new AppError('Demo session not found', 404);
    if (demo.sessionStatus === 'CANCELLED' || demo.sessionStatus === 'RESCHEDULED') {
      throw new AppError('This demo session is no longer active', 409);
    }

    const demoDate = new Date(data.demoDate);
    const endAt = data.endAt ? new Date(data.endAt) : new Date(demoDate.getTime() + 60 * 60 * 1000);

    await enquiryRepository.updateDemo(demoId, {
      sessionStatus: 'RESCHEDULED',
      remark: data.remark || demo.remark,
    });

    const next = await enquiryRepository.addDemo({
      enquiryId,
      userId,
      facultyId: data.facultyId || demo.facultyId,
      demoDate,
      endAt,
      sessionStatus: 'SCHEDULED',
      className: data.className?.trim() || demo.className,
      batch: data.batch?.trim() || demo.batch,
      attendance: 'NOT_MARKED',
      result: 'PENDING',
      remark: data.remark || null,
      rescheduledFromId: demoId,
    });

    await enquiryRepository.update(enquiryId, {
      lastTouchedAt: new Date(),
      updatedBy: userId,
      status: 'DEMO_SCHEDULED',
    });

    await logEnquiryAudit({
      enquiryId, userId, action: 'DEMO', description: 'Demo rescheduled',
      oldValue: demo.demoDate?.toISOString?.() || String(demo.demoDate),
      newValue: demoDate.toISOString(),
      req,
    });
    await auditLog({
      userId, action: 'UPDATE', entityType: 'EnquiryDemo', entityId: demoId,
      oldData: { sessionStatus: demo.sessionStatus, demoDate: demo.demoDate },
      newData: { sessionStatus: 'RESCHEDULED', nextDemoId: next.id },
      req,
    });

    return { previous: { ...demo, sessionStatus: 'RESCHEDULED' }, current: next };
  },

  cancelDemo: async (enquiryId, demoId, data, userId, req) => {
    await requireEnquiry(enquiryId, req.user);
    const demo = await enquiryRepository.findDemoById(demoId);
    if (!demo || demo.enquiryId !== enquiryId) throw new AppError('Demo session not found', 404);
    if (demo.sessionStatus === 'RESCHEDULED') {
      throw new AppError('Historical rescheduled sessions cannot be cancelled', 409);
    }
    const updated = await enquiryRepository.updateDemo(demoId, {
      sessionStatus: 'CANCELLED',
      cancelledReason: data.reason,
    });
    await logEnquiryAudit({
      enquiryId, userId, action: 'DEMO', description: `Demo cancelled: ${data.reason}`, req,
    });
    await auditLog({
      userId, action: 'UPDATE', entityType: 'EnquiryDemo', entityId: demoId,
      oldData: { sessionStatus: demo.sessionStatus },
      newData: { sessionStatus: 'CANCELLED', reason: data.reason },
      req,
    });
    return updated;
  },

  completeDemo: async (enquiryId, demoId, userId, req) => {
    await requireEnquiry(enquiryId, req.user);
    const demo = await enquiryRepository.findDemoById(demoId);
    if (!demo || demo.enquiryId !== enquiryId) throw new AppError('Demo session not found', 404);
    if (demo.sessionStatus !== 'SCHEDULED') {
      throw new AppError('Only a scheduled demo can be completed', 409);
    }
    const updated = await enquiryRepository.updateDemo(demoId, { sessionStatus: 'COMPLETED' });
    await logEnquiryAudit({
      enquiryId, userId, action: 'DEMO', description: 'Demo marked completed', req,
    });
    return updated;
  },

  addNote: async (id, data, userId, files = []) => {
    if (!(await enquiryRepository.findById(id))) throw new AppError('Enquiry not found', 404);

    const note = await enquiryRepository.addNote({
      enquiryId: id,
      userId,
      content: data.content,
      contentHtml: data.contentHtml || null,
      mentions: data.mentions || [],
      checklist: data.checklist || [],
      isPinned: Boolean(data.isPinned),
    });

    if (files.length) {
      await Promise.all(files.map((file) => enquiryRepository.addNoteAttachment({
        noteId: note.id,
        name: file.originalname,
        fileName: file.filename,
        filePath: `enquiries/note-attachments/${file.filename}`,
        fileSize: file.size,
        mimeType: file.mimetype,
      })));
    }

    const full = await enquiryRepository.findNoteById(note.id);
    const plain = data.content.slice(0, 500);
    await enquiryRepository.update(id, { lastRemark: plain, lastTouchedAt: new Date(), updatedBy: userId });
    await logEnquiryAudit({
      enquiryId: id,
      userId,
      action: 'NOTE',
      description: plain,
      newValue: data.isPinned ? 'PINNED' : undefined,
    });
    return full;
  },

  pinNote: async (enquiryId, noteId, isPinned, userId) => {
    const enquiry = await enquiryRepository.findById(enquiryId);
    if (!enquiry) throw new AppError('Enquiry not found', 404);
    const note = enquiry.notes?.find((n) => n.id === noteId);
    if (!note) throw new AppError('Note not found', 404);

    const updated = await enquiryRepository.updateNote(noteId, { isPinned });
    await logEnquiryAudit({
      enquiryId,
      userId,
      action: 'NOTE',
      description: isPinned ? 'Note pinned' : 'Note unpinned',
    });
    return updated;
  },

  updateNoteChecklist: async (enquiryId, noteId, checklist, userId) => {
    const enquiry = await enquiryRepository.findById(enquiryId);
    if (!enquiry) throw new AppError('Enquiry not found', 404);
    const note = enquiry.notes?.find((n) => n.id === noteId);
    if (!note) throw new AppError('Note not found', 404);

    return enquiryRepository.updateNote(noteId, { checklist });
  },

  getTimeline: (id) => enquiryRepository.getTimeline(id),

  getDocuments: async (id, user) => {
    const enquiry = await requireEnquiry(id, user);
    return enquiry.documents || [];
  },

  addDocument: async (id, file, userId, category, user) => {
    await requireEnquiry(id, user);
    const doc = await enquiryRepository.addDocument({
      enquiryId: id,
      name: file.originalname,
      fileName: file.filename,
      filePath: `enquiries/${file.filename}`,
      fileSize: file.size,
      mimeType: file.mimetype,
      category: normalizeDocumentCategory(category),
      createdBy: userId,
    });
    await enquiryRepository.update(id, { lastTouchedAt: new Date(), updatedBy: userId });
    await logEnquiryAudit({
      enquiryId: id,
      userId,
      action: 'DOCUMENT',
      description: file.originalname,
      newValue: normalizeDocumentCategory(category),
    });
    return doc;
  },

  removeDocument: async (docId, userId, enquiryId, user) => {
    await requireEnquiry(enquiryId, user);
    await enquiryRepository.deleteDocument(docId);
    await logEnquiryAudit({ enquiryId, userId, action: 'DOCUMENT_DELETE', description: docId });
    return { id: docId };
  },

  bulkCommunication: async (ids, payload, userId) => {
    const results = [];
    for (const enquiryId of ids) {
      const comm = await enquiryRepository.addCommunication({
        enquiryId,
        userId,
        channel: payload.channel,
        status: 'SENT',
        subject: payload.subject,
        body: payload.body,
        createdBy: userId,
      });
      results.push(comm);
      await logEnquiryAudit({
        enquiryId, userId, action: 'COMMUNICATION', description: `${payload.channel} sent`,
      });
    }
    return results;
  },

  addCommunication: async (id, data, userId, req) => {
    const enquiry = await requireEnquiry(id, req.user);

    const comm = await enquiryRepository.addCommunication({
      enquiryId: id,
      userId,
      channel: data.channel,
      status: data.status || 'SENT',
      direction: data.direction || 'OUTBOUND',
      subject: data.subject?.trim() || null,
      body: data.body?.trim() || null,
      durationSec: data.durationSec ?? null,
      createdBy: userId,
    });

    await enquiryRepository.update(id, {
      lastTouchedAt: new Date(),
      updatedBy: userId,
      status: enquiry.status === 'NEW' ? 'CONTACTED' : enquiry.status,
    });

    const summary = data.body?.trim()?.slice(0, 160) || data.subject?.trim() || data.channel;
    await logEnquiryAudit({
      enquiryId: id,
      userId,
      action: 'COMMUNICATION',
      description: summary,
      newValue: data.channel,
      req,
    });

    return comm;
  },

  addVoiceNote: async (id, file, data, userId) => {
    const enquiry = await enquiryRepository.findById(id);
    if (!enquiry) throw new AppError('Enquiry not found', 404);

    const relativePath = `enquiries/voice-notes/${file.filename}`;
    const durationSec = data.durationSec != null ? Number(data.durationSec) : null;

    const comm = await enquiryRepository.addCommunication({
      enquiryId: id,
      userId,
      channel: 'VOICE_NOTE',
      status: 'SENT',
      direction: data.direction || 'OUTBOUND',
      body: data.body?.trim() || null,
      durationSec: Number.isFinite(durationSec) ? durationSec : null,
      fileName: file.originalname,
      filePath: relativePath,
      fileSize: file.size,
      mimeType: file.mimetype,
      createdBy: userId,
    });

    await enquiryRepository.update(id, {
      lastTouchedAt: new Date(),
      updatedBy: userId,
    });

    await logEnquiryAudit({
      enquiryId: id,
      userId,
      action: 'COMMUNICATION',
      description: data.body?.trim() || 'Voice note recorded',
      newValue: 'VOICE_NOTE',
    });

    return comm;
  },
};
