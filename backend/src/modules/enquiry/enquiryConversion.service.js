import prisma from '../../config/database.js';
import { softDeleteWhere } from '../../utils/response.util.js';
import { mergeScope, assertStudentInTenant } from '../../utils/tenant.util.js';
import { studentRepository } from '../student/student.repository.js';
import { enquiryRepository } from './enquiry.repository.js';
import { logEnquiryAudit } from './enquiry.audit.js';
import { auditLog } from '../../middleware/audit.middleware.js';
import { AppError } from '../../utils/response.util.js';

const BLOCKED_STATUSES = new Set(['LOST', 'NOT_INTERESTED', 'SPAM', 'DUPLICATE']);

function buildStudentPayload(enquiry, userId) {
  return {
    branchId: enquiry.branchId,
    assignedToId: enquiry.assignedToId,
    firstName: enquiry.firstName,
    lastName: enquiry.lastName || enquiry.firstName,
    email: enquiry.email || null,
    phone: enquiry.mobile || null,
    dateOfBirth: enquiry.dateOfBirth || null,
    gender: enquiry.gender || null,
    nationality: enquiry.nationality || null,
    passportNo: enquiry.passportNo || null,
    address: enquiry.address || null,
    intake: enquiry.intake || null,
    course: enquiry.interestedCourse || null,
    country: enquiry.interestedCountry || null,
    status: 'REGISTERED',
    createdBy: userId,
    updatedBy: userId,
    metadata: {
      enquiryId: enquiry.id,
      enquiryCode: enquiry.enquiryCode,
      lifecycleRecordId: enquiry.id,
      convertedFrom: 'enquiry',
    },
  };
}

/** Company/branch-scoped duplicate match — never cross-tenant */
async function findExistingStudent(enquiry, user) {
  const or = [];
  if (enquiry.email?.trim()) or.push({ email: enquiry.email.trim() });
  if (enquiry.mobile?.trim()) or.push({ phone: enquiry.mobile.trim() });
  if (enquiry.passportNo?.trim()) {
    or.push({ passportNo: enquiry.passportNo.trim().toUpperCase() });
  }

  if (or.length === 0) return null;

  const scopeWhere = mergeScope(user, { entity: 'student' });
  return prisma.student.findFirst({
    where: { ...softDeleteWhere, ...scopeWhere, OR: or },
  });
}

export const enquiryConversionService = {
  convertToStudent: async (enquiryId, userId, req) => {
    const user = req?.user;
    if (!user) throw new AppError('Authentication required', 401);

    const enquiryScope = mergeScope(user, { entity: 'enquiry' });
    const enquiry = await enquiryRepository.findById(enquiryId, enquiryScope);
    if (!enquiry) throw new AppError('Enquiry not found', 404);

    if (enquiry.status === 'CONVERTED' && enquiry.studentId) {
      const linked = await assertStudentInTenant(enquiry.studentId, user);
      return {
        enquiry,
        student: linked,
        sameRecord: true,
        linkedExisting: true,
        lifecycle: enquiry.metadata?.lifecycle || {
          recordId: enquiry.id,
          enquiryCode: enquiry.enquiryCode,
          studentId: enquiry.studentId,
          studentCode: linked?.studentCode,
          sameRecord: true,
          linkedExisting: true,
          convertedAt: enquiry.convertedAt,
        },
      };
    }

    if (BLOCKED_STATUSES.has(enquiry.status)) {
      throw new AppError('This enquiry cannot be converted in its current status', 400);
    }

    let student = enquiry.student || null;
    let linkedExisting = false;

    if (enquiry.studentId && student) {
      student = await assertStudentInTenant(enquiry.studentId, user);
      linkedExisting = true;
    } else if (enquiry.studentId) {
      student = await assertStudentInTenant(enquiry.studentId, user);
      linkedExisting = Boolean(student);
    }

    if (!student) {
      const existing = await findExistingStudent(enquiry, user);
      if (existing) {
        student = existing;
        linkedExisting = true;
        await studentRepository.update(student.id, {
          updatedBy: userId,
          metadata: {
            ...(existing.metadata || {}),
            enquiryId: enquiry.id,
            enquiryCode: enquiry.enquiryCode,
            lifecycleRecordId: enquiry.id,
            convertedFrom: 'enquiry',
          },
        });
      } else {
        const studentCode = await studentRepository.generateCode(enquiry.branch?.companyId);
        student = await studentRepository.create({
          ...buildStudentPayload(enquiry, userId),
          studentCode,
        });
        linkedExisting = false;

        await prisma.activity.create({
          data: {
            userId,
            studentId: student.id,
            action: 'CREATE',
            description: `Student ${student.studentCode} promoted from enquiry ${enquiry.enquiryCode}`,
          },
        });

        await auditLog({
          userId,
          action: 'CREATE',
          entityType: 'Student',
          entityId: student.id,
          newData: student,
          req,
        });
      }
    }

    const now = new Date();
    const lifecycle = {
      recordId: enquiry.id,
      enquiryCode: enquiry.enquiryCode,
      studentId: student.id,
      studentCode: student.studentCode,
      sameRecord: true,
      linkedExisting,
      convertedAt: enquiry.convertedAt || now.toISOString(),
    };

    await enquiryRepository.update(enquiryId, {
      status: 'CONVERTED',
      studentId: student.id,
      convertedAt: enquiry.convertedAt || now,
      updatedBy: userId,
      lastTouchedAt: now,
      metadata: {
        ...(enquiry.metadata || {}),
        lifecycle,
      },
    });

    await logEnquiryAudit({
      enquiryId,
      userId,
      action: 'STATUS_CHANGE',
      field: 'status',
      oldValue: enquiry.status,
      newValue: 'CONVERTED',
      description: linkedExisting
        ? `Linked to existing student ${student.studentCode} — same record`
        : `Promoted to student ${student.studentCode} — same record`,
      req,
    });

    await auditLog({
      userId,
      action: 'STATUS_CHANGE',
      entityType: 'enquiry',
      entityId: enquiryId,
      oldData: { status: enquiry.status },
      newData: { status: 'CONVERTED', studentId: student.id },
      req,
    });

    const fullEnquiry = await enquiryRepository.findById(enquiryId, enquiryScope);

    return {
      enquiry: fullEnquiry,
      student,
      sameRecord: true,
      linkedExisting,
      lifecycle,
    };
  },
};
