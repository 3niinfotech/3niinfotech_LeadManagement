import { z } from 'zod';
import { AppError } from '../../utils/response.util.js';
import { parseSort } from '../../utils/response.util.js';
import { studentRepository, STUDENT_SORT_FIELDS } from './student.repository.js';
import { auditLog } from '../../middleware/audit.middleware.js';
import prisma from '../../config/database.js';
import { softDeleteWhere } from '../../utils/response.util.js';
import {
  mergeScope,
  assertBranchInTenant,
  assertUserInTenant,
  assertStudentInTenant,
  assertStudentIdsInTenant,
  resolveCompanyIdForBranch,
} from '../../utils/tenant.util.js';

import {
  normalizeStudentMasterFields,
  hydrateStudentMasterLabels,
  hydrateStudentListMasterLabels,
} from '../../utils/masterFieldNormalize.util.js';
import { attachStudentPhotoUrl } from '../../utils/studentPhoto.util.js';
import { masterRepository } from '../master/master.repository.js';
import { normalizeDocumentCategory } from '../enquiry/enquiryDocument.config.js';
import { assignmentEngine } from '../assignment/assignment.engine.js';
import { pickBestCandidate } from '../assignment/assignment.scoring.js';
import { assignmentRepository } from '../assignment/assignment.repository.js';
import { AGENT_ROLE_SLUGS } from '../../config/portal.config.js';
import { ensureStudentPrimaryApplication } from '../student-portal/student-portal.service.js';
import {
  notifyAgentReferredStudent,
  notifyCounsellorAssignment,
  notifyDocumentEvent,
} from '../notification/notification.dispatcher.js';

export const createStudentSchema = z.object({
  branchId: z.string().uuid(),
  partnerId: z.string().uuid().optional().nullable().or(z.literal('')),
  assignedToId: z.string().uuid().optional().nullable().or(z.literal('')),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  passportNo: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  emergencyContact: z.string().max(200).optional().nullable(),
  status: z.enum(['ENQUIRY', 'REGISTERED', 'DOCUMENT_PENDING', 'APPLICATION_SUBMITTED', 'OFFER_RECEIVED', 'VISA_APPLIED', 'VISA_GRANTED', 'ENROLLED', 'DEFERRED', 'WITHDRAWN']).optional().nullable().or(z.literal('')),
  intake: z.string().optional().nullable(),
  course: z.string().optional().nullable(),
  university: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
});

export const updateStudentSchema = z.object({
  branchId: z.string().uuid().optional().nullable().or(z.literal('')),
  partnerId: z.string().uuid().optional().nullable().or(z.literal('')),
  assignedToId: z.string().uuid().optional().nullable().or(z.literal('')),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  passportNo: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  emergencyContact: z.string().max(200).optional().nullable(),
  status: z.enum(['ENQUIRY', 'REGISTERED', 'DOCUMENT_PENDING', 'APPLICATION_SUBMITTED', 'OFFER_RECEIVED', 'VISA_APPLIED', 'VISA_GRANTED', 'ENROLLED', 'DEFERRED', 'WITHDRAWN']).optional().nullable().or(z.literal('')),
  intake: z.string().optional().nullable(),
  course: z.string().optional().nullable(),
  university: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
});

export const studentService = {
  getAll: async (query, user) => {
    const sort = parseSort(query, STUDENT_SORT_FIELDS);
    const scopeWhere = mergeScope(user, { entity: 'student' });
    const result = await studentRepository.findMany({ ...query, sort, scopeWhere });
    if (user.companyId && result?.data?.length) {
      result.data = await hydrateStudentListMasterLabels(result.data, user.companyId);
    }
    return result;
  },

  getSummary: async (query, user) => {
    const scopeWhere = mergeScope(user, { entity: 'student' });
    if (query?.branchId) scopeWhere.branchId = query.branchId;
    return studentRepository.getSummaryCounts(scopeWhere);
  },

  exportStudents: async (query, user, userId, req) => {
    const { ids: requestedIds } = query;
    const selected = Array.isArray(requestedIds) && requestedIds.length > 0;
    const scopeWhere = mergeScope(user, { entity: 'student' });

    const result = await studentRepository.findMany({
      ...query,
      ...(selected ? { ids: requestedIds } : {}),
      scopeWhere,
      page: 1,
      limit: selected ? Math.max(requestedIds.length, 1) : 5000,
    });

    const { buildStudentExportWorkbook, buildStudentExportFilename } = await import('./student.export.service.js');
    const buffer = await buildStudentExportWorkbook(result.data, { selected });
    const filename = buildStudentExportFilename({ selected });

    await auditLog({
      userId,
      action: 'EXPORT',
      entityType: 'Student',
      newData: { count: result.data.length, selected },
      req,
    });

    return { buffer, filename, count: result.data.length, selected };
  },

  bulkUpdateStatus: async (ids, status, userId, req) => {
    await assertStudentIdsInTenant(ids, req.user);
    const scopeWhere = mergeScope(req.user, { entity: 'student' });
    await studentRepository.bulkUpdateStatus(ids, status, userId, scopeWhere);
    await auditLog({ userId, action: 'UPDATE', entityType: 'Student', entityId: ids.join(','), newData: { status }, req });
  },

  getById: async (id, user) => {
    await assertStudentInTenant(id, user);
    let student = await studentRepository.findById(id);
    if (!student) return null;

    const companyId = student.branch?.companyId || user?.companyId;
    if (companyId) {
      student = await hydrateStudentMasterLabels(student, companyId);
    }

    const enquiryId = student.enquiry?.id || student.metadata?.enquiryId;
    if (enquiryId) {
      try {
        const { enquiryConversionService } = await import('../enquiry/enquiryConversion.service.js');
        await enquiryConversionService.syncEnquiryDataToStudent(enquiryId, id, user.id, { user });
        student = await studentRepository.findById(id);
        if (companyId) {
          student = await hydrateStudentMasterLabels(student, companyId);
        }
      } catch {
        /* sync is best-effort on read */
      }
    }

    return attachStudentPhotoUrl(student);
  },

  create: async (data, userId, req) => {
    await assertBranchInTenant(data.branchId, req.user);
    if (data.assignedToId) await assertUserInTenant(data.assignedToId, req.user);

    const userRoleSlug = (req?.user?.role?.slug || req?.user?.role?.name || req?.user?.role || '').toLowerCase();
    const isAgent = AGENT_ROLE_SLUGS.includes(userRoleSlug);

    let partnerId = data.partnerId;
    if (isAgent) {
      const partner = await prisma.partner.findFirst({
        where: { userId },
      });
      if (partner) {
        partnerId = partner.id;
      }
    }

    const companyId = await resolveCompanyIdForBranch(data.branchId, req.user);
    const normalizedData = await normalizeStudentMasterFields({
      ...data,
      partnerId,
    }, companyId);
    const studentCode = await studentRepository.generateCode(companyId);

    let status = normalizedData.status;
    if (!status) {
      const defaultStatus = await masterRepository.findDefaultStudentStatus(companyId);
      if (defaultStatus?.code) status = defaultStatus.code;
    }

    let assignedCounsellor = null;
    let assignmentScore = null;
    // Auto-assign counsellor via Assignment Engine if not manually specified
    if (!normalizedData.assignedToId) {
      try {
        const leadHint = {
          branchId: normalizedData.branchId,
          country: normalizedData.country || null,
          interestedCountry: normalizedData.country || null,
          interestedCourse: normalizedData.course || null,
          priority: 'HIGH',
          metadata: {
            source: isAgent ? 'AGENT_REFERRAL' : 'STUDENT_REGISTRATION',
            partnerId,
          },
        };
        const { rows, config } = await assignmentEngine.scoreAllForLead(leadHint, {
          branchId: normalizedData.branchId,
          companyId,
          excludeIds: [],
        });
        const { selected } = pickBestCandidate(rows, config?.fallback);
        if (selected?.routable) {
          normalizedData.assignedToId = selected.id;
          assignedCounsellor = selected;
          assignmentScore = selected.score;
        }
      } catch (err) {
        console.warn('[student.service.create] auto-assignment warning:', err.message);
      }
    }

    const student = await studentRepository.create({
      ...normalizedData,
      status,
      studentCode,
      createdBy: userId,
      dateOfBirth: normalizedData.dateOfBirth ? new Date(normalizedData.dateOfBirth) : null,
    });

    if (student.course || student.country || student.university) {
      await ensureStudentPrimaryApplication(student, userId).catch((err) =>
        console.warn('[student.create] ensureStudentPrimaryApplication warning:', err.message)
      );
    }

    if (isAgent) {
      await notifyAgentReferredStudent({
        student,
        partnerUserId: userId,
        assignedCounsellorId: assignedCounsellor?.id || normalizedData.assignedToId || null,
        branchId: normalizedData.branchId,
        companyId,
      }).catch((e) => console.warn('[student.create] notifyAgentReferredStudent error:', e.message));
    } else if (assignedCounsellor?.id || normalizedData.assignedToId) {
      const counsellorId = assignedCounsellor?.id || normalizedData.assignedToId;
      await notifyCounsellorAssignment({
        student,
        counsellorId,
        previousCounsellorId: null,
        actorId: userId,
        companyId,
        branchId: normalizedData.branchId,
      }).catch((e) => console.warn('[student.create] notifyCounsellorAssignment error:', e.message));

      if (assignedCounsellor) {
        await assignmentRepository.upsertPresence(assignedCounsellor.id, normalizedData.branchId, {
          lastAssignedAt: new Date(),
        }).catch(() => {});
      }
    }

    await prisma.activity.create({
      data: { userId, studentId: student.id, action: 'CREATE', description: `Student ${studentCode} created` },
    });

    await auditLog({ userId, action: 'CREATE', entityType: 'Student', entityId: student.id, newData: student, req });
    return student;
  },

  update: async (id, data, userId, req) => {
    const existing = await assertStudentInTenant(id, req.user);
    const { emergencyContact, ...rest } = data;

    const userRoleSlug = (req?.user?.role?.slug || req?.user?.role?.name || req?.user?.role || '').toLowerCase();
    if (AGENT_ROLE_SLUGS.includes(userRoleSlug)) {
      delete rest.assignedToId;
      delete rest.partnerId;
      delete rest.branchId;
    }

    if (rest.branchId && rest.branchId !== '') await assertBranchInTenant(rest.branchId, req.user);
    else delete rest.branchId;

    if (rest.assignedToId && rest.assignedToId !== '') await assertUserInTenant(rest.assignedToId, req.user);
    else if (rest.assignedToId === '') rest.assignedToId = null;

    if (rest.partnerId === '') rest.partnerId = null;
    if (rest.email === '') rest.email = null;
    if (rest.phone === '') rest.phone = null;
    if (rest.gender === '') rest.gender = null;
    if (rest.nationality === '') rest.nationality = null;
    if (rest.passportNo === '') rest.passportNo = null;
    if (rest.address === '') rest.address = null;
    if (rest.intake === '') rest.intake = null;
    if (rest.course === '') rest.course = null;
    if (rest.university === '') rest.university = null;
    if (rest.country === '') rest.country = null;
    if (rest.status === '') delete rest.status;

    const companyId = existing.branch?.companyId || req.user?.companyId
      || (rest.branchId ? await resolveCompanyIdForBranch(rest.branchId, req.user) : null);

    const normalizedData = companyId
      ? await normalizeStudentMasterFields(rest, companyId)
      : rest;

    let parsedDateOfBirth = undefined;
    if (normalizedData.dateOfBirth !== undefined) {
      if (!normalizedData.dateOfBirth || normalizedData.dateOfBirth === '') {
        parsedDateOfBirth = null;
      } else {
        const d = new Date(normalizedData.dateOfBirth);
        parsedDateOfBirth = Number.isNaN(d.getTime()) ? null : d;
      }
    }

    const updatePayload = {
      ...normalizedData,
      updatedBy: userId,
      ...(parsedDateOfBirth !== undefined ? { dateOfBirth: parsedDateOfBirth } : {}),
    };

    if (emergencyContact !== undefined) {
      const meta = (existing.metadata && typeof existing.metadata === 'object')
        ? { ...existing.metadata }
        : {};
      const value = emergencyContact?.trim?.() || emergencyContact || null;
      meta.emergencyContact = value;
      meta.alternateNo = value;
      updatePayload.metadata = meta;
    }

    const student = await studentRepository.update(id, updatePayload);

    // Keep linked enquiry / lead / portal user contact in sync (one person = one master)
    const enquiryPatch = {};
    if (normalizedData.phone !== undefined) enquiryPatch.mobile = normalizedData.phone;
    if (normalizedData.address !== undefined) enquiryPatch.address = normalizedData.address;
    if (emergencyContact !== undefined) {
      enquiryPatch.alternateNo = emergencyContact?.trim?.() || emergencyContact || null;
    }
    if (Object.keys(enquiryPatch).length) {
      const enquiry = await prisma.enquiry.findFirst({
        where: { studentId: id, deletedAt: null },
        select: { id: true, metadata: true },
      });
      if (enquiry) {
        const enquiryMeta = (enquiry.metadata && typeof enquiry.metadata === 'object')
          ? { ...enquiry.metadata }
          : {};
        if (emergencyContact !== undefined) {
          enquiryMeta.emergencyContact = emergencyContact?.trim?.() || emergencyContact || null;
          enquiryPatch.metadata = enquiryMeta;
        }
        await prisma.enquiry.update({
          where: { id: enquiry.id },
          data: { ...enquiryPatch, updatedBy: userId },
        });
      }
    }

    if (normalizedData.phone !== undefined) {
      if (existing.userId) {
        await prisma.user.update({
          where: { id: existing.userId },
          data: { phone: normalizedData.phone },
        });
      }
      await prisma.lead.updateMany({
        where: { studentId: id, deletedAt: null },
        data: { phone: normalizedData.phone, updatedBy: userId },
      });
    }

    await prisma.activity.create({
      data: { userId, studentId: id, action: 'UPDATE', description: 'Student record updated' },
    });

    if (normalizedData.assignedToId && normalizedData.assignedToId !== existing.assignedToId) {
      await notifyCounsellorAssignment({
        student,
        counsellorId: normalizedData.assignedToId,
        previousCounsellorId: existing.assignedToId || null,
        actorId: userId,
        companyId,
        branchId: student.branchId,
      }).catch((e) => console.warn('[student.update] notifyCounsellorAssignment warning:', e.message));
    }

    await auditLog({ userId, action: 'UPDATE', entityType: 'Student', entityId: id, oldData: existing, newData: student, req });
    return student;
  },

  delete: async (id, userId, req) => {
    const existing = await assertStudentInTenant(id, req.user);
    const linkedEnquiry = await prisma.enquiry.findFirst({
      where: { studentId: id, status: 'CONVERTED', ...softDeleteWhere },
      select: { enquiryCode: true },
    });
    if (linkedEnquiry) {
      throw new AppError(
        `Cannot delete student linked to converted enquiry ${linkedEnquiry.enquiryCode}. The enquiry stays for history; edit the student profile instead.`,
        409,
      );
    }
    await studentRepository.softDelete(id, userId);
    await auditLog({ userId, action: 'DELETE', entityType: 'Student', entityId: id, oldData: existing, req });
  },

  bulkDelete: async (ids, userId, req) => {
    await assertStudentIdsInTenant(ids, req.user);
    const linked = await prisma.enquiry.findMany({
      where: { studentId: { in: ids }, status: 'CONVERTED', ...softDeleteWhere },
      select: { studentId: true, enquiryCode: true },
    });
    if (linked.length) {
      const codes = [...new Set(linked.map((e) => e.enquiryCode))].join(', ');
      throw new AppError(
        `Cannot delete: student(s) linked to converted enquiry(ies): ${codes}. Enquiry history is preserved separately.`,
        409,
      );
    }
    await studentRepository.bulkSoftDelete(ids, userId, mergeScope(req.user, { entity: 'student' }));
    await auditLog({ userId, action: 'DELETE', entityType: 'Student', entityId: ids.join(','), req });
  },

  bulkAssign: async (ids, assignedToId, userId, req) => {
    await assertStudentIdsInTenant(ids, req.user);
    if (assignedToId) await assertUserInTenant(assignedToId, req.user);
    await studentRepository.bulkAssign(ids, assignedToId, userId, mergeScope(req.user, { entity: 'student' }));
    await auditLog({ userId, action: 'ASSIGN', entityType: 'Student', entityId: ids.join(','), newData: { assignedToId }, req });
  },

  getDocuments: async (studentId, user) => {
    await assertStudentInTenant(studentId, user);
    return prisma.document.findMany({
      where: { studentId, ...softDeleteWhere },
      orderBy: { createdAt: 'desc' },
    });
  },

  addDocument: async (studentId, file, userId, category, req) => {
    await assertStudentInTenant(studentId, req.user);
    const doc = await prisma.document.create({
      data: {
        studentId,
        entityType: 'Student',
        entityId: studentId,
        name: file.originalname,
        fileName: file.filename,
        filePath: `students/${file.filename}`,
        fileSize: file.size,
        mimeType: file.mimetype,
        category: normalizeDocumentCategory(category),
        createdBy: userId,
        metadata: { source: 'student', uploadedDuring: 'Student' },
      },
    });
    await prisma.activity.create({
      data: {
        userId,
        studentId,
        action: 'DOCUMENT',
        description: `Uploaded ${file.originalname}`,
        entityType: 'Document',
        entityId: doc.id,
      },
    });
    await auditLog({ userId, action: 'CREATE', entityType: 'Document', entityId: doc.id, newData: doc, req });
    return doc;
  },

  removeDocument: async (studentId, docId, userId, req) => {
    await assertStudentInTenant(studentId, req.user);
    const doc = await prisma.document.findFirst({
      where: { id: docId, studentId, ...softDeleteWhere },
    });
    if (!doc) throw new AppError('Document not found', 404);
    await prisma.document.update({
      where: { id: docId },
      data: { deletedAt: new Date() },
    });
    await prisma.activity.create({
      data: {
        userId,
        studentId,
        action: 'DOCUMENT_DELETE',
        description: doc.name || doc.fileName,
        entityType: 'Document',
        entityId: docId,
      },
    });
    await auditLog({ userId, action: 'DELETE', entityType: 'Document', entityId: docId, oldData: doc, req });
    return { id: docId };
  },

  updateDocumentStatus: async (studentId, docId, { status, rejectionReason }, userId, req) => {
    await assertStudentInTenant(studentId, req.user);
    const doc = await prisma.document.findFirst({
      where: { id: docId, studentId, ...softDeleteWhere },
    });
    if (!doc) throw new AppError('Document not found', 404);

    const prevMeta = (doc.metadata && typeof doc.metadata === 'object') ? { ...doc.metadata } : {};
    const updatedMeta = {
      ...prevMeta,
      status,
      rejectionReason: status === 'REJECTED' ? (rejectionReason || 'Document rejected by counsellor') : null,
      verifiedAt: status === 'VERIFIED' ? new Date().toISOString() : null,
      verifiedBy: status === 'VERIFIED' ? userId : null,
      reviewedBy: userId,
      reviewedAt: new Date().toISOString(),
    };

    const updated = await prisma.document.update({
      where: { id: docId },
      data: { metadata: updatedMeta },
    });

    await prisma.activity.create({
      data: {
        userId,
        studentId,
        action: status === 'VERIFIED' ? 'APPROVE' : status === 'REJECTED' ? 'REJECT' : 'DOCUMENT',
        description: `Document ${doc.name} ${status.toLowerCase()}${rejectionReason ? `: ${rejectionReason}` : ''}`,
        entityType: 'Document',
        entityId: docId,
      },
    });

    try {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: { id: true, firstName: true, lastName: true, assignedToId: true, branchId: true, branch: { select: { companyId: true } } },
      });
      if (student) {
        await notifyDocumentEvent({
          document: updated,
          student,
          eventType: status === 'VERIFIED' ? 'APPROVED' : status === 'REJECTED' ? 'REJECTED' : 'UPLOADED',
          status,
          rejectionReason,
          reviewerUser: req.user,
          companyId: student.branch?.companyId,
        });
      }
    } catch (e) {
      console.warn('[updateDocumentStatus] notifyDocumentEvent warning:', e.message);
    }

    return updated;
  },
};
