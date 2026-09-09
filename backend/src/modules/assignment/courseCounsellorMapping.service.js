import prisma from '../../config/database.js';
import { AppError } from '../../utils/response.util.js';
import {
  assertCounsellorInTenant,
  assertBranchInTenant,
  requireTenantCompany,
} from '../../utils/tenant.util.js';
import { assignmentRepository } from './assignment.repository.js';
import { notifyCounsellorAssigned } from '../notification/notification.dispatcher.js';

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  branchId: true,
  status: true,
};

function normalizeCourseLabel(label) {
  return String(label || '').trim();
}

function buildCounsellorAssignmentMeta({
  type,
  source,
  courseLabel,
  assignedById = null,
  previous,
}) {
  return {
    ...(previous || {}),
    counsellorAssignment: {
      type,
      source,
      courseLabel: courseLabel || null,
      assignedAt: new Date().toISOString(),
      assignedById,
    },
  };
}

async function findActiveMapping(companyId, branchId, courseLabel) {
  const label = normalizeCourseLabel(courseLabel);
  if (!label) return null;

  const baseWhere = {
    companyId,
    isActive: true,
    deletedAt: null,
    courseLabel: { equals: label, mode: 'insensitive' },
  };

  if (branchId) {
    const branchMapping = await prisma.courseCounsellorMapping.findFirst({
      where: { ...baseWhere, branchId },
      include: { counsellor: { select: userSelect } },
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
    });
    if (branchMapping) return branchMapping;
  }

  return prisma.courseCounsellorMapping.findFirst({
    where: { ...baseWhere, branchId: null },
    include: { counsellor: { select: userSelect } },
    orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
  });
}

export const courseCounsellorMappingService = {
  normalizeCourseLabel,

  async list(user, { branchId, search, activeOnly = true } = {}) {
    const companyId = requireTenantCompany(user);
    if (branchId) await assertBranchInTenant(branchId, user);

    const where = {
      companyId,
      deletedAt: null,
      ...(activeOnly ? { isActive: true } : {}),
      ...(branchId ? { OR: [{ branchId }, { branchId: null }] } : {}),
      ...(search?.trim()
        ? { courseLabel: { contains: search.trim(), mode: 'insensitive' } }
        : {}),
    };

    return prisma.courseCounsellorMapping.findMany({
      where,
      include: {
        counsellor: { select: userSelect },
        branch: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { courseLabel: 'asc' }],
    });
  },

  async create(data, userId, user) {
    const companyId = requireTenantCompany(user);
    const courseLabel = normalizeCourseLabel(data.courseLabel);
    if (!courseLabel) throw new AppError('Course / service label is required', 400);

    const branchId = data.branchId || null;
    if (branchId) await assertBranchInTenant(branchId, user);
    await assertCounsellorInTenant(data.counsellorId, user);

    const existing = await prisma.courseCounsellorMapping.findFirst({
      where: {
        companyId,
        branchId,
        deletedAt: null,
        courseLabel: { equals: courseLabel, mode: 'insensitive' },
      },
    });
    if (existing) throw new AppError('Mapping already exists for this course', 409);

    return prisma.courseCounsellorMapping.create({
      data: {
        companyId,
        branchId,
        courseLabel,
        counsellorId: data.counsellorId,
        isActive: data.isActive !== false,
        sortOrder: data.sortOrder ?? 0,
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
        counsellor: { select: userSelect },
        branch: { select: { id: true, name: true, code: true } },
      },
    });
  },

  async update(id, data, userId, user) {
    const companyId = requireTenantCompany(user);
    const row = await prisma.courseCounsellorMapping.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!row) throw new AppError('Mapping not found', 404);

    const payload = { updatedBy: userId };
    if (data.courseLabel !== undefined) {
      const courseLabel = normalizeCourseLabel(data.courseLabel);
      if (!courseLabel) throw new AppError('Course / service label is required', 400);
      payload.courseLabel = courseLabel;
    }
    if (data.counsellorId !== undefined) {
      await assertCounsellorInTenant(data.counsellorId, user);
      payload.counsellorId = data.counsellorId;
    }
    if (data.branchId !== undefined) {
      if (data.branchId) await assertBranchInTenant(data.branchId, user);
      payload.branchId = data.branchId || null;
    }
    if (data.isActive !== undefined) payload.isActive = data.isActive;
    if (data.sortOrder !== undefined) payload.sortOrder = data.sortOrder;

    return prisma.courseCounsellorMapping.update({
      where: { id },
      data: payload,
      include: {
        counsellor: { select: userSelect },
        branch: { select: { id: true, name: true, code: true } },
      },
    });
  },

  async remove(id, userId, user) {
    const companyId = requireTenantCompany(user);
    const row = await prisma.courseCounsellorMapping.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!row) throw new AppError('Mapping not found', 404);

    return prisma.courseCounsellorMapping.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false, updatedBy: userId },
    });
  },

  async resolve({ courseLabel, branchId, user }) {
    const companyId = requireTenantCompany(user);
    if (branchId) await assertBranchInTenant(branchId, user);

    const label = normalizeCourseLabel(courseLabel);
    if (!label) {
      return { found: false, courseLabel: null, counsellor: null, message: 'No course selected' };
    }

    const mapping = await findActiveMapping(companyId, branchId, label);
    if (!mapping?.counsellor || mapping.counsellor.status !== 'ACTIVE') {
      return {
        found: false,
        courseLabel: label,
        counsellor: null,
        message: 'No counsellor assigned for this course. Please assign manually.',
      };
    }

    return {
      found: true,
      courseLabel: label,
      mappingId: mapping.id,
      branchScoped: Boolean(mapping.branchId),
      counsellor: mapping.counsellor,
      message: `Automatically assigned from ${label}`,
    };
  },

  async applyToEnquiry({
    enquiry,
    courseLabel,
    branchId,
    companyId,
    actorId,
    user,
    force = false,
    existingMeta = {},
  }) {
    const assignmentMeta = existingMeta?.counsellorAssignment || {};
    if (!force && assignmentMeta.type === 'MANUAL') {
      return { applied: false, reason: 'manual_override' };
    }

    const resolved = await this.resolve({ courseLabel, branchId, user });
    if (!resolved.found) {
      return { applied: false, reason: 'no_mapping', message: resolved.message };
    }

    await assertCounsellorInTenant(resolved.counsellor.id, user);

    const fromUserId = enquiry.assignedToId || null;
    const metaPatch = buildCounsellorAssignmentMeta({
      type: 'AUTO',
      source: 'COURSE_MAPPING',
      courseLabel: resolved.courseLabel,
      assignedById: null,
      previous: existingMeta,
    });

    await assignmentRepository.logEnquiryAssignment({
      enquiryId: enquiry.id,
      companyId,
      branchId,
      fromUserId,
      toUserId: resolved.counsellor.id,
      assignmentType: 'COURSE_DEFAULT',
      score: null,
      scoreBreakdown: {},
      reasons: [`Course mapping: ${resolved.courseLabel}`],
      exclusions: [],
      actorId,
      reason: `Automatically assigned from ${resolved.courseLabel}`,
    });

    if (resolved.counsellor.id !== enquiry.assignedToId) {
      await notifyCounsellorAssigned({
        counsellorId: resolved.counsellor.id,
        lead: {
          id: enquiry.id,
          firstName: enquiry.firstName,
          lastName: enquiry.lastName,
          leadCode: enquiry.enquiryCode,
          branchId,
          enquiry: { id: enquiry.id },
        },
        actorId,
      }).catch(() => {});
    }

    return {
      applied: true,
      counsellorId: resolved.counsellor.id,
      counsellor: resolved.counsellor,
      courseLabel: resolved.courseLabel,
      metaPatch,
      message: resolved.message,
    };
  },

  buildManualAssignmentMeta(existingMeta, userId, courseLabel) {
    return buildCounsellorAssignmentMeta({
      type: 'MANUAL',
      source: 'USER',
      courseLabel,
      assignedById: userId,
      previous: existingMeta,
    });
  },

  buildCounsellorAssignmentMeta,

  async resolveForEnquiryInput({
    data,
    existing,
    user,
    branchId,
  }) {
    const courseLabel = data.interestedCourse ?? existing?.interestedCourse;
    const label = normalizeCourseLabel(courseLabel);
    const existingMeta = existing?.metadata || {};
    const manualOverride = data.manualCounsellorOverride === true;
    const applyCourseCounsellor = data.applyCourseCounsellor === true;
    const courseChanged = existing
      && data.interestedCourse !== undefined
      && normalizeCourseLabel(data.interestedCourse) !== normalizeCourseLabel(existing.interestedCourse);

    if (manualOverride && data.assignedToId) {
      return {
        assignedToId: data.assignedToId,
        assignedById: user.id,
        metadata: this.buildManualAssignmentMeta(existingMeta, user.id, label),
        source: 'MANUAL',
      };
    }

    const shouldTryCourseMapping = label && (
      !existing
      || courseChanged
      || applyCourseCounsellor
      || (!existing.assignedToId && data.assignedToId === undefined)
    );

    if (!shouldTryCourseMapping) return null;

    const priorManual = existingMeta?.counsellorAssignment?.type === 'MANUAL';
    if (existing && priorManual && courseChanged && !applyCourseCounsellor) {
      return { skipCourseMapping: true, reason: 'manual_override' };
    }

    const resolved = await this.resolve({ courseLabel: label, branchId, user });
    if (resolved.found) {
      return {
        assignedToId: resolved.counsellor.id,
        assignedById: null,
        metadata: buildCounsellorAssignmentMeta({
          type: 'AUTO',
          source: 'COURSE_MAPPING',
          courseLabel: resolved.courseLabel,
          assignedById: null,
          previous: existingMeta,
        }),
        source: 'COURSE_AUTO',
        counsellor: resolved.counsellor,
        message: resolved.message,
      };
    }

    const hasCounsellor = data.assignedToId || existing?.assignedToId;
    if (label && !hasCounsellor) {
      return {
        validationError: resolved.message
          || 'No counsellor assigned for this course. Please assign manually.',
      };
    }

    return null;
  },
};
