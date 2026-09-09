import prisma from '../../config/database.js';
import { softDeleteWhere } from '../../utils/response.util.js';
import { mergeScope, assertStudentInTenant } from '../../utils/tenant.util.js';
import { studentRepository } from '../student/student.repository.js';
import { enquiryRepository } from './enquiry.repository.js';
import { logEnquiryAudit } from './enquiry.audit.js';
import { auditLog } from '../../middleware/audit.middleware.js';
import { AppError } from '../../utils/response.util.js';
import { normalizeEnquiryMasterFields } from '../../utils/masterFieldNormalize.util.js';
import { resolveEnquiryPhotoPath } from '../../utils/studentPhoto.util.js';
import { ensureStudentPortalUser, getStudentDefaultPassword } from '../auth/student-portal-account.util.js';

const BLOCKED_STATUSES = new Set(['LOST', 'NOT_INTERESTED', 'SPAM', 'DUPLICATE']);

function enquirySnapshot(enquiry) {
  return {
    enquiryId: enquiry.id,
    enquiryCode: enquiry.enquiryCode,
    createdAt: enquiry.createdAt,
    source: enquiry.source,
    otherReference: enquiry.otherReference,
    branchId: enquiry.branchId,
    interestedCountry: enquiry.interestedCountry,
    interestedCourse: enquiry.interestedCourse,
    applyLevel: enquiry.applyLevel,
    intake: enquiry.intake,
    highestQual: enquiry.highestQual,
    testsGiven: enquiry.testsGiven,
    tags: enquiry.tags,
    remark: enquiry.remark,
    assignedToId: enquiry.assignedToId,
  };
}

function buildEnquiryMetadata(enquiry, photoPath = null) {
  const path = photoPath ?? resolveEnquiryPhotoPath(enquiry);
  return {
    enquiryId: enquiry.id,
    enquiryCode: enquiry.enquiryCode,
    lifecycleRecordId: enquiry.id,
    convertedFrom: 'enquiry',
    enquirySnapshot: enquirySnapshot(enquiry),
    alternateNo: enquiry.alternateNo || null,
    mobileCountry: enquiry.mobileCountry || null,
    testsGiven: enquiry.testsGiven || [],
    source: enquiry.source || null,
    maritalStatus: enquiry.maritalStatus || null,
    highestQual: enquiry.highestQual || null,
    applyLevel: enquiry.applyLevel || null,
    priority: enquiry.priority || null,
    tags: enquiry.tags || [],
    remark: enquiry.remark || enquiry.lastRemark || null,
    otherReference: enquiry.otherReference || null,
    photoUrl: path,
    demoSummary: (enquiry.demos || []).map((d) => ({
      id: d.id,
      demoDate: d.demoDate,
      className: d.className,
      batch: d.batch,
      result: d.result,
      attendance: d.attendance,
      feedback: d.feedback || null,
    })),
  };
}

async function buildStudentPayload(enquiry, userId, companyId) {
  const normalized = companyId
    ? await normalizeEnquiryMasterFields({
      interestedCourse: enquiry.interestedCourse,
      interestedCountry: enquiry.interestedCountry,
      intake: enquiry.intake,
      highestQual: enquiry.highestQual,
    }, companyId)
    : {};

  const photoPath = resolveEnquiryPhotoPath(enquiry);
  const university = enquiry.metadata?.university || enquiry.metadata?.interestedUniversity || null;

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
    intake: normalized.intake ?? enquiry.intake ?? null,
    course: normalized.interestedCourse ?? enquiry.interestedCourse ?? null,
    country: normalized.interestedCountry ?? enquiry.interestedCountry ?? null,
    university,
    status: 'REGISTERED',
    createdBy: userId,
    updatedBy: userId,
    metadata: buildEnquiryMetadata(enquiry, photoPath),
  };
}

/** Fill empty student fields from enquiry — never overwrite counsellor if already set */
function mergeStudentFieldsFromEnquiry(student, enquiry) {
  const patch = { updatedBy: enquiry.updatedBy };
  const pick = (key, fromEnquiry, transform = (v) => v) => {
    if (student[key] != null && student[key] !== '') return;
    const val = transform(fromEnquiry);
    if (val != null && val !== '') patch[key] = val;
  };

  pick('firstName', enquiry.firstName);
  pick('lastName', enquiry.lastName || enquiry.firstName);
  pick('email', enquiry.email);
  pick('phone', enquiry.mobile);
  pick('dateOfBirth', enquiry.dateOfBirth);
  pick('gender', enquiry.gender);
  pick('nationality', enquiry.nationality);
  pick('passportNo', enquiry.passportNo, (v) => v?.trim?.()?.toUpperCase?.() || v);
  pick('address', enquiry.address);
  pick('intake', enquiry.intake);
  pick('course', enquiry.interestedCourse);
  pick('country', enquiry.interestedCountry);
  pick('university', enquiry.metadata?.university || enquiry.metadata?.interestedUniversity);

  if (!student.assignedToId && enquiry.assignedToId) {
    patch.assignedToId = enquiry.assignedToId;
  }

  const photoPath = resolveEnquiryPhotoPath(enquiry);
  patch.metadata = {
    ...(student.metadata || {}),
    ...buildEnquiryMetadata(enquiry, photoPath),
    // Preserve student-owned contact fields (portal / staff updates)
    emergencyContact: student.metadata?.emergencyContact
      ?? enquiry.metadata?.emergencyContact
      ?? enquiry.alternateNo
      ?? null,
    alternateNo: student.metadata?.alternateNo
      ?? enquiry.alternateNo
      ?? student.metadata?.emergencyContact
      ?? null,
  };

  return patch;
}

async function findExistingStudent(enquiry, user, tx = prisma) {
  const or = [];
  if (enquiry.email?.trim()) or.push({ email: enquiry.email.trim() });
  if (enquiry.mobile?.trim()) or.push({ phone: enquiry.mobile.trim() });
  if (enquiry.passportNo?.trim()) {
    or.push({ passportNo: enquiry.passportNo.trim().toUpperCase() });
  }
  if (or.length === 0) return null;

  const scopeWhere = mergeScope(user, { entity: 'student' });
  return tx.student.findFirst({
    where: { ...softDeleteWhere, ...scopeWhere, OR: or },
  });
}

async function assertStudentNotLinkedToOtherEnquiry(tx, studentId, enquiryId) {
  const other = await tx.enquiry.findFirst({
    where: {
      studentId,
      deletedAt: null,
      id: { not: enquiryId },
    },
    select: { id: true, enquiryCode: true },
  });
  if (other) {
    throw new AppError(
      `This person is already student-linked from enquiry ${other.enquiryCode}. Open that student record instead of creating a duplicate.`,
      409,
    );
  }
}

async function linkEnquiryDocuments(tx, enquiryId, studentId, userId) {
  const enquiryDocs = await tx.enquiryDocument.findMany({
    where: { enquiryId },
    orderBy: { createdAt: 'asc' },
  });

  let linked = 0;
  for (const ed of enquiryDocs) {
    const existing = await tx.document.findFirst({
      where: {
        deletedAt: null,
        studentId,
        filePath: ed.filePath,
      },
    });
    if (existing) continue;

    await tx.document.create({
      data: {
        studentId,
        entityType: 'Enquiry',
        entityId: enquiryId,
        name: ed.name,
        fileName: ed.fileName,
        filePath: ed.filePath,
        fileSize: ed.fileSize,
        mimeType: ed.mimeType,
        category: ed.category,
        createdBy: ed.createdBy || userId,
        metadata: {
          enquiryDocumentId: ed.id,
          source: 'enquiry',
          uploadedDuring: 'Enquiry',
          linkedAt: new Date().toISOString(),
        },
      },
    });
    linked += 1;
  }
  return linked;
}

async function linkEnquiryAppointments(tx, enquiryId, studentId) {
  const rows = await tx.enquiryAppointment.findMany({ where: { enquiryId } });
  const existingAppts = await tx.appointment.findMany({
    where: { studentId, deletedAt: null },
    select: { metadata: true },
  });
  const linkedIds = new Set(
    existingAppts
      .map((a) => a.metadata?.enquiryAppointmentId)
      .filter(Boolean),
  );

  let linked = 0;
  for (const ap of rows) {
    if (linkedIds.has(ap.id)) continue;

    await tx.appointment.create({
      data: {
        studentId,
        title: ap.title || 'Counselling',
        description: ap.remark || null,
        startAt: ap.startAt,
        endAt: ap.endAt,
        location: ap.room || ap.mode || null,
        isCompleted: ap.isCompleted,
        createdBy: ap.userId,
        metadata: { enquiryAppointmentId: ap.id, source: 'enquiry', enquiryId },
      },
    });
    linked += 1;
  }
  return linked;
}

async function linkEnquiryNotes(tx, enquiryId, studentId) {
  const notes = await tx.enquiryNote.findMany({ where: { enquiryId } });
  let linked = 0;
  for (const note of notes) {
    const exists = await tx.note.findFirst({
      where: {
        deletedAt: null,
        studentId,
        entityType: 'EnquiryNote',
        entityId: note.id,
      },
    });
    if (exists) continue;

    await tx.note.create({
      data: {
        studentId,
        entityType: 'EnquiryNote',
        entityId: note.id,
        userId: note.userId,
        content: note.content,
        isPinned: note.isPinned,
      },
    });
    linked += 1;
  }
  return linked;
}

async function loadEnquiryForConversion(enquiryId, user) {
  const enquiryScope = mergeScope(user, { entity: 'enquiry' });
  return enquiryRepository.findById(enquiryId, enquiryScope);
}

async function syncEnquiryDataToStudent(enquiryId, studentId, userId, tx = prisma) {
  const enquiry = await tx.enquiry.findFirst({
    where: { id: enquiryId, deletedAt: null },
    include: {
      documents: { orderBy: { createdAt: 'desc' } },
      demos: { orderBy: { demoDate: 'desc' } },
      branch: { select: { companyId: true } },
    },
  });
  if (!enquiry) {
    return { documentsLinked: 0, notesLinked: 0, appointmentsLinked: 0, fieldsUpdated: false };
  }

  const student = await tx.student.findFirst({
    where: { id: studentId, deletedAt: null },
  });
  if (!student) {
    return { documentsLinked: 0, notesLinked: 0, appointmentsLinked: 0, fieldsUpdated: false };
  }

  const companyId = enquiry.branch?.companyId;
  let enquiryForMerge = enquiry;
  if (companyId) {
    const normalized = await normalizeEnquiryMasterFields({
      interestedCourse: enquiry.interestedCourse,
      interestedCountry: enquiry.interestedCountry,
      intake: enquiry.intake,
      highestQual: enquiry.highestQual,
    }, companyId);
    enquiryForMerge = {
      ...enquiry,
      interestedCourse: normalized.interestedCourse ?? enquiry.interestedCourse,
      interestedCountry: normalized.interestedCountry ?? enquiry.interestedCountry,
      intake: normalized.intake ?? enquiry.intake,
      highestQual: normalized.highestQual ?? enquiry.highestQual,
    };
  }

  const patch = mergeStudentFieldsFromEnquiry(student, { ...enquiryForMerge, updatedBy: userId });
  const fieldKeys = Object.keys(patch).filter((k) => k !== 'updatedBy' && k !== 'metadata');
  if (fieldKeys.length > 0 || patch.metadata) {
    await tx.student.update({ where: { id: studentId }, data: patch });
  }

  const documentsLinked = await linkEnquiryDocuments(tx, enquiryId, studentId, userId);
  const appointmentsLinked = await linkEnquiryAppointments(tx, enquiryId, studentId);
  const notesLinked = await linkEnquiryNotes(tx, enquiryId, studentId);

  return {
    documentsLinked,
    appointmentsLinked,
    notesLinked,
    fieldsUpdated: fieldKeys.length > 0,
  };
}

export const enquiryConversionService = {
  getConversionPreview: async (enquiryId, user) => {
    const enquiry = await loadEnquiryForConversion(enquiryId, user);
    if (!enquiry) throw new AppError('Enquiry not found', 404);

    const existingStudent = enquiry.studentId
      ? enquiry.student
      : await findExistingStudent(enquiry, user);

    return {
      enquiry: {
        id: enquiry.id,
        enquiryCode: enquiry.enquiryCode,
        status: enquiry.status,
        firstName: enquiry.firstName,
        lastName: enquiry.lastName,
        mobile: enquiry.mobile,
        email: enquiry.email,
        interestedCourse: enquiry.interestedCourse,
        interestedCountry: enquiry.interestedCountry,
        assignedTo: enquiry.assignedTo,
        studentId: enquiry.studentId,
      },
      counts: {
        documents: enquiry.documents?.length || 0,
        demos: enquiry.demos?.length || 0,
        followups: enquiry.followups?.length || 0,
        notes: enquiry.notes?.length || 0,
        appointments: enquiry.appointments?.length || 0,
      },
      demos: (enquiry.demos || []).slice(0, 5).map((d) => ({
        id: d.id,
        demoDate: d.demoDate,
        className: d.className,
        batch: d.batch,
        result: d.result,
        attendance: d.attendance,
        sessionStatus: d.sessionStatus,
      })),
      alreadyConverted: Boolean(enquiry.status === 'CONVERTED' && enquiry.studentId),
      existingStudent: existingStudent
        ? {
          id: existingStudent.id,
          studentCode: existingStudent.studentCode,
          name: `${existingStudent.firstName || ''} ${existingStudent.lastName || ''}`.trim(),
        }
        : null,
      blocked: BLOCKED_STATUSES.has(enquiry.status),
    };
  },

  convertToStudent: async (enquiryId, userId, req) => {
    const user = req?.user;
    if (!user) throw new AppError('Authentication required', 401);

    const enquiryScope = mergeScope(user, { entity: 'enquiry' });
    const enquiry = await enquiryRepository.findById(enquiryId, enquiryScope);
    if (!enquiry) throw new AppError('Enquiry not found', 404);

    if (enquiry.status === 'CONVERTED' && enquiry.studentId) {
      await prisma.$transaction((tx) => syncEnquiryDataToStudent(enquiryId, enquiry.studentId, userId, tx));
      const linked = await assertStudentInTenant(enquiry.studentId, user);
      const fullEnquiry = await enquiryRepository.findById(enquiryId, enquiryScope);
      return {
        enquiry: fullEnquiry,
        student: linked,
        sameRecord: true,
        linkedExisting: true,
        alreadyConverted: true,
        lifecycle: fullEnquiry?.metadata?.lifecycle || {
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

    const result = await prisma.$transaction(async (tx) => {
      const fresh = await tx.enquiry.findFirst({
        where: { id: enquiryId, ...softDeleteWhere, ...enquiryScope },
        include: {
          documents: { orderBy: { createdAt: 'desc' } },
          demos: { orderBy: { demoDate: 'desc' } },
        },
      });
      if (!fresh) throw new AppError('Enquiry not found', 404);

      if (fresh.status === 'CONVERTED' && fresh.studentId) {
        const linked = await tx.student.findFirst({
          where: { id: fresh.studentId, ...softDeleteWhere },
        });
        return { student: linked, linkedExisting: true, enquiry: fresh, skipped: true };
      }

      let student = null;
      let linkedExisting = false;

      if (fresh.studentId) {
        student = await tx.student.findFirst({
          where: { id: fresh.studentId, ...softDeleteWhere },
        });
        linkedExisting = Boolean(student);
      }

      if (!student) {
        const existing = await findExistingStudent(fresh, user, tx);
        if (existing) {
          await assertStudentNotLinkedToOtherEnquiry(tx, existing.id, enquiryId);
          student = existing;
          linkedExisting = true;
          const patch = mergeStudentFieldsFromEnquiry(existing, { ...fresh, updatedBy: userId });
          student = await tx.student.update({
            where: { id: existing.id },
            data: patch,
          });
        } else {
          const companyId = fresh.branch?.companyId || enquiry.branch?.companyId;
          const payload = await buildStudentPayload(fresh, userId, companyId);
          const studentCode = await studentRepository.generateCode(companyId);
          student = await tx.student.create({
            data: {
              ...payload,
              studentCode,
            },
          });
          linkedExisting = false;
        }
      } else {
        const patch = mergeStudentFieldsFromEnquiry(student, { ...fresh, updatedBy: userId });
        student = await tx.student.update({
          where: { id: student.id },
          data: patch,
        });
      }

      const now = new Date();
      const lifecycle = {
        recordId: fresh.id,
        enquiryCode: fresh.enquiryCode,
        studentId: student.id,
        studentCode: student.studentCode,
        sameRecord: true,
        linkedExisting,
        convertedAt: fresh.convertedAt || now.toISOString(),
        documentsLinked: 0,
        appointmentsLinked: 0,
        notesLinked: 0,
      };

      lifecycle.documentsLinked = await linkEnquiryDocuments(tx, enquiryId, student.id, userId);
      lifecycle.appointmentsLinked = await linkEnquiryAppointments(tx, enquiryId, student.id);
      lifecycle.notesLinked = await linkEnquiryNotes(tx, enquiryId, student.id);

      await tx.enquiry.update({
        where: { id: enquiryId },
        data: {
          status: 'CONVERTED',
          studentId: student.id,
          convertedAt: fresh.convertedAt || now,
          updatedBy: userId,
          lastTouchedAt: now,
          metadata: {
            ...(fresh.metadata || {}),
            lifecycle,
          },
        },
      });

      if (fresh.leadId) {
        await tx.lead.updateMany({
          where: { id: fresh.leadId, deletedAt: null },
          data: {
            status: 'COMPLETED',
            studentId: student.id,
            updatedBy: userId,
            convertedAt: fresh.convertedAt || now,
          },
        });
      }

      return { student, linkedExisting, enquiry: fresh, lifecycle, skipped: false };
    });

    if (result.skipped) {
      await prisma.$transaction((tx) => syncEnquiryDataToStudent(enquiryId, result.student.id, userId, tx));
      const linked = await assertStudentInTenant(result.student.id, user);
      const fullEnquiry = await enquiryRepository.findById(enquiryId, enquiryScope);
      return {
        enquiry: fullEnquiry,
        student: linked,
        sameRecord: true,
        linkedExisting: true,
        alreadyConverted: true,
        lifecycle: fullEnquiry?.metadata?.lifecycle,
      };
    }

    const { student, linkedExisting, lifecycle } = result;

    // Create student portal login (default testing password) when email exists
    if (student?.email && !student.userId) {
      try {
        await ensureStudentPortalUser(student, {
          plainPassword: getStudentDefaultPassword(),
        });
      } catch {
        // Portal login can be created later via Forgot password / first login with 123
      }
    }

    if (!linkedExisting) {
      await prisma.activity.create({
        data: {
          userId,
          studentId: student.id,
          entityType: 'Enquiry',
          entityId: enquiryId,
          action: 'CONVERTED',
          description: `Student ${student.studentCode} promoted from enquiry ${enquiry.enquiryCode}`,
          metadata: { enquiryCode: enquiry.enquiryCode, lifecycle },
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
    } else {
      await prisma.activity.create({
        data: {
          userId,
          studentId: student.id,
          entityType: 'Enquiry',
          entityId: enquiryId,
          action: 'LINKED',
          description: `Enquiry ${enquiry.enquiryCode} linked to existing student ${student.studentCode}`,
          metadata: { enquiryCode: enquiry.enquiryCode, lifecycle },
        },
      });
    }

    await logEnquiryAudit({
      enquiryId,
      userId,
      action: 'STATUS_CHANGE',
      field: 'status',
      oldValue: enquiry.status,
      newValue: 'CONVERTED',
      description: linkedExisting
        ? `Linked to existing student ${student.studentCode} — enquiry history preserved`
        : `Promoted to student ${student.studentCode} — enquiry, demo & documents linked`,
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
      alreadyConverted: false,
      lifecycle,
    };
  },

  syncEnquiryDataToStudent: async (enquiryId, studentId, userId, req) => {
    const user = req?.user;
    if (!user) throw new AppError('Authentication required', 401);
    await assertStudentInTenant(studentId, user);
    const enquiryScope = mergeScope(user, { entity: 'enquiry' });
    const enquiry = await enquiryRepository.findById(enquiryId, enquiryScope);
    if (!enquiry) throw new AppError('Enquiry not found', 404);
    if (enquiry.studentId !== studentId) {
      throw new AppError('Enquiry is not linked to this student', 409);
    }
    return prisma.$transaction((tx) => syncEnquiryDataToStudent(enquiryId, studentId, userId, tx));
  },
};
