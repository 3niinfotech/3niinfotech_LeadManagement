import { AppError, parseSort } from '../../utils/response.util.js';
import { auditLog } from '../../middleware/audit.middleware.js';
import prisma from '../../config/database.js';
import { buildDataScopeWhere } from '../../utils/scope.util.js';
import {
  mergeScope,
  assertBranchInTenant,
  assertCounsellorInTenant,
  assertLeadInTenant,
  resolveCompanyIdForBranch,
  requireTenantCompany,
  resolveWriteBranchId,
} from '../../utils/tenant.util.js';
import { notifyUser, notifyVisitorRegistered, notifyCounsellorAssigned } from '../notification/notification.dispatcher.js';
import { assignmentService } from '../assignment/assignment.service.js';
import { assignmentEngine } from '../assignment/assignment.engine.js';
import { enquiryService } from '../enquiry/enquiry.service.js';
import { walkinRepository } from './walkin.repository.js';
import { userRepository } from '../user/user.repository.js';
import { WALKIN_SORT_FIELDS } from './walkin.validators.js';
import { splitFullName, buildQrPayload } from './walkin.utils.js';

async function openEnquiryForAssignedVisitor(lead, userId, req) {
  if (!lead?.assignedToId) return null;
  return enquiryService.createFromLead(lead, userId, req, {
    status: 'NEW',
    priority: 'MEDIUM',
    fromAssignment: true,
  });
}

export const walkinService = {
  getAll: async (query, user) => {
    const { page, limit, sortBy, sortOrder, ...filters } = query;
    const sort = parseSort({ sortBy, sortOrder }, WALKIN_SORT_FIELDS);
    const scopeWhere = mergeScope(user);
    return walkinRepository.findMany({
      ...filters,
      scopeWhere,
      page: Number(page) || 1,
      limit: Number(limit) || 25,
      sort: sort || { walkInAt: 'desc' },
    });
  },

  getSummary: (query, user) => {
    const scopeWhere = mergeScope(user);
    return walkinRepository.getSummary({ ...query, scopeWhere });
  },

  getById: async (id, user) => {
    const lead = await assertLeadInTenant(id, user);
    const notes = await walkinRepository.listNotes(id);
    return { ...lead, leadNotes: notes };
  },

  checkDuplicate: async (phone, branchId, excludeId, user) => {
    await assertBranchInTenant(branchId, user);
    const existing = await walkinRepository.findByPhone(phone, branchId, excludeId);
    const companyId = requireTenantCompany(user) || (await assertBranchInTenant(branchId, user)).companyId;
    const identity = await assignmentService.resolveIdentity(phone, branchId, companyId);
    return {
      hasDuplicate: Boolean(existing) || identity.matchType !== 'NEW',
      existing,
      identity,
    };
  },

  create: async (data, userId, req) => {
    const user = req.user;
    const branchId = await resolveWriteBranchId(user, data.branchId);
    const branch = await assertBranchInTenant(branchId, user);

    if (!data.assignedToId) {
      throw new AppError('Counsellor assignment is required — Reception must select a counsellor', 400);
    }
    await assertCounsellorInTenant(data.assignedToId, user);

    const dup = await walkinRepository.findByPhone(data.phone, branchId);
    if (dup) {
      throw new AppError(
        `Active visitor already exists for this mobile (${dup.leadCode}). Open Reception to manage the visitor.`,
        409,
      );
    }

    const { firstName, lastName } = splitFullName(data.fullName);
    const leadCode = await walkinRepository.generateLeadCode(branch.companyId);
    // Preserve required DB column — not a queue token (legacy field retained).
    const tokenNumber = `REF-${leadCode}`;
    const qrPayload = buildQrPayload({ leadCode, tokenNumber });

    const lead = await walkinRepository.create({
      leadCode,
      tokenNumber,
      branchId,
      assignedToId: data.assignedToId,
      receptionUserId: userId,
      firstName,
      lastName,
      email: data.email?.trim() || null,
      phone: data.phone.trim(),
      country: data.interestedCountry?.trim() || data.country?.trim() || null,
      interestedCourse: data.interestedCourse?.trim() || null,
      source: data.source || 'Walk-in',
      status: 'WALK_IN',
      priority: data.priority || 'NORMAL',
      notes: data.notes?.trim() || null,
      walkInAt: new Date(),
      createdBy: userId,
      updatedBy: userId,
      metadata: {
        entryType: 'WALK_IN',
        qrPayload,
        gender: data.gender || null,
        dateOfBirth: data.dateOfBirth || null,
        city: data.city || null,
        interestedCountry: data.interestedCountry || null,
        studyLevel: data.studyLevel || null,
        preferredLanguage: data.preferredLanguage || null,
        visitPurpose: data.visitPurpose || null,
        assignedManually: true,
      },
    });

    await prisma.activity.create({
      data: {
        userId,
        leadId: lead.id,
        entityType: 'LEAD',
        entityId: lead.id,
        action: 'WALK_IN_REGISTERED',
        description: `Walk-in registered and assigned — ${leadCode}`,
        metadata: { leadCode, status: 'WALK_IN', assignedToId: data.assignedToId },
      },
    });

    await auditLog({
      userId,
      action: 'CREATE',
      entityType: 'Lead',
      entityId: lead.id,
      newData: { leadCode, status: 'WALK_IN', branchId, assignedToId: data.assignedToId },
      req,
    });

    // No auto-queue / offer loop — Reception already assigned.
    const freshLead = await walkinRepository.findById(lead.id);

    let assigneeName = null;
    let enquiry = null;
    if (freshLead?.assignedToId) {
      const assignee = await prisma.user.findFirst({
        where: { id: freshLead.assignedToId, deletedAt: null },
        select: { firstName: true, lastName: true },
      });
      if (assignee) {
        assigneeName = `${assignee.firstName || ''} ${assignee.lastName || ''}`.trim();
      }
      enquiry = await openEnquiryForAssignedVisitor(freshLead, userId, req);
      await notifyCounsellorAssigned({
        counsellorId: freshLead.assignedToId,
        lead: freshLead,
        enquiry,
        actorId: userId,
      });
    }

    try {
      await notifyVisitorRegistered({
        lead: freshLead || lead,
        enquiry,
        actorId: userId,
        companyId: branch.companyId,
        assigneeName,
      });
    } catch {
      // Registration must succeed even if manager notify fails
    }

    return { ...(freshLead || lead), enquiry };
  },

  recommendCounsellors: async (query, user) => {
    const branchId = await resolveWriteBranchId(user, query.branchId || null);
    const branch = await assertBranchInTenant(branchId, user);
    return assignmentEngine.recommendCounsellors({
      branchId,
      companyId: branch.companyId,
      country: query.country || query.interestedCountry || null,
      interestedCourse: query.interestedCourse || null,
      preferredLanguage: query.preferredLanguage || null,
      visitPurpose: query.visitPurpose || null,
      priority: query.priority || 'NORMAL',
    });
  },

  update: async (id, data, userId, req) => {
    const existing = await assertLeadInTenant(id, req.user);

    if (data.branchId) await assertBranchInTenant(data.branchId, req.user);
    if (data.assignedToId) await assertCounsellorInTenant(data.assignedToId, req.user);

    if (data.phone && data.branchId) {
      const dup = await walkinRepository.findByPhone(data.phone, data.branchId, id);
      if (dup) throw new AppError('Another lead already uses this mobile number', 409);
    }

    const payload = { updatedBy: userId };
    if (data.fullName) {
      const { firstName, lastName } = splitFullName(data.fullName);
      payload.firstName = firstName;
      payload.lastName = lastName;
    }
    if (data.phone !== undefined) payload.phone = data.phone.trim();
    if (data.country !== undefined) payload.country = data.country?.trim() || null;
    if (data.interestedCourse !== undefined) payload.interestedCourse = data.interestedCourse?.trim() || null;
    if (data.source !== undefined) payload.source = data.source;
    if (data.branchId !== undefined) payload.branchId = data.branchId;
    if (data.assignedToId !== undefined) payload.assignedToId = data.assignedToId;
    if (data.priority !== undefined) payload.priority = data.priority;
    if (data.notes !== undefined) payload.notes = data.notes?.trim() || null;
    if (data.status !== undefined) payload.status = data.status;

    const lead = await walkinRepository.update(id, payload);

    await prisma.activity.create({
      data: {
        userId,
        leadId: id,
        entityType: 'LEAD',
        entityId: id,
        action: 'UPDATE',
        description: 'Walk-in lead updated',
      },
    });

    await auditLog({
      userId,
      action: 'UPDATE',
      entityType: 'Lead',
      entityId: id,
      oldData: existing,
      newData: lead,
      req,
    });

    if (data.assignedToId && data.assignedToId !== existing.assignedToId) {
      const enquiry = await openEnquiryForAssignedVisitor(lead, userId, req);
      await notifyCounsellorAssigned({
        counsellorId: data.assignedToId,
        lead,
        enquiry,
        actorId: userId,
      });
      return { ...lead, enquiry };
    }

    return lead;
  },

  updateStatus: async (id, status, userId, req) => {
    const existing = await assertLeadInTenant(id, req.user);

    const lead = await walkinRepository.update(id, { status, updatedBy: userId });

    await prisma.activity.create({
      data: {
        userId,
        leadId: id,
        entityType: 'LEAD',
        entityId: id,
        action: 'STATUS_CHANGE',
        description: `Status changed to ${status}`,
        metadata: { from: existing.status, to: status },
      },
    });

    await auditLog({
      userId,
      action: 'STATUS_CHANGE',
      entityType: 'Lead',
      entityId: id,
      oldData: { status: existing.status },
      newData: { status },
      req,
    });

    if (status === 'IN_COUNSELLING' && existing.assignedToId && existing.assignedToId !== userId) {
      await notifyUser(existing.assignedToId, {
        type: 'INFO',
        title: 'Counselling started',
        message: `Counselling started for ${existing.firstName} ${existing.lastName || ''}`.trim(),
        link: `/reception/walk-ins?lead=${id}`,
        metadata: { leadId: id, event: 'COUNSELLING_STARTED' },
      });
    }

    return lead;
  },

  delete: async (id, userId, req) => {
    const existing = await assertLeadInTenant(id, req.user);
    await walkinRepository.softDelete(id, userId);
    await auditLog({
      userId,
      action: 'DELETE',
      entityType: 'Lead',
      entityId: id,
      oldData: existing,
      req,
    });
  },

  addNote: async (id, content, userId, user) => {
    await assertLeadInTenant(id, user);

    const note = await walkinRepository.addNote({
      entityType: 'LEAD',
      entityId: id,
      userId,
      content: content.trim(),
    });

    await prisma.activity.create({
      data: {
        userId,
        leadId: id,
        entityType: 'LEAD',
        entityId: id,
        action: 'NOTE_ADDED',
        description: 'Note added',
      },
    });

    return note;
  },

  getBranches: (user) => {
    const companyId = requireTenantCompany(user);
    return walkinRepository.listBranches(companyId);
  },

  getCounsellors: (branchId, user) => {
    const companyId = requireTenantCompany(user);
    const effectiveBranch = branchId || null;
    if (effectiveBranch) {
      return assertBranchInTenant(effectiveBranch, user).then(() =>
        userRepository.listCounsellors({ branchId: effectiveBranch, companyId }),
      );
    }
    return userRepository.listCounsellors({ companyId });
  },

  applyCounsellorDecision: async (id, input, userId, req) => {
    const lead = await assertLeadInTenant(id, req.user);

    const { decision, reason, followUpDate, remarks } = input;
    const noteText = [reason, remarks].filter(Boolean).join(' — ').trim();
    let enquiry = lead.enquiry || null;

    const logDecision = async (description, metadata = {}) => {
      await prisma.activity.create({
        data: {
          userId,
          leadId: id,
          entityType: 'LEAD',
          entityId: id,
          action: 'COUNSELLOR_DECISION',
          description,
          metadata: { decision, ...metadata },
        },
      });
      await auditLog({
        userId,
        action: 'UPDATE',
        entityType: 'Lead',
        entityId: id,
        newData: { decision, ...metadata },
        req,
      });
      if (noteText) await walkinRepository.addNote({
        entityType: 'LEAD',
        entityId: id,
        userId,
        content: `[${decision}] ${noteText}`,
      });
    };

    if (decision === 'INTERESTED') {
      enquiry = await enquiryService.createFromLead(lead, userId, req);
      await walkinRepository.update(id, {
        status: 'IN_COUNSELLING',
        updatedBy: userId,
      });
      await logDecision(`Interested — enquiry ${enquiry.enquiryCode} created`, {
        enquiryId: enquiry.id,
      });
      return { lead: await walkinRepository.findById(id), enquiry, decision };
    }

    if (decision === 'NOT_INTERESTED') {
      await walkinRepository.update(id, {
        status: 'CANCELLED',
        notes: noteText || lead.notes,
        updatedBy: userId,
      });
      await logDecision('Not interested — visit closed', { reason });
      return { lead: await walkinRepository.findById(id), enquiry: null, decision };
    }

    if (decision === 'FOLLOW_UP') {
      await walkinRepository.update(id, {
        status: 'WALK_IN',
        followUpAt: followUpDate ? new Date(followUpDate) : null,
        updatedBy: userId,
      });
      await logDecision('Follow-up required', { followUpDate });
      return { lead: await walkinRepository.findById(id), enquiry: null, decision };
    }

    if (decision === 'APPOINTMENT') {
      await walkinRepository.update(id, {
        status: 'APPOINTMENT',
        updatedBy: userId,
      });
      await logDecision('Appointment required');
      return { lead: await walkinRepository.findById(id), enquiry: null, decision };
    }

    if (decision === 'DEMO') {
      await walkinRepository.update(id, {
        status: 'IN_COUNSELLING',
        updatedBy: userId,
      });
      await logDecision('Demo registration required');
      return { lead: await walkinRepository.findById(id), enquiry: null, decision };
    }

    if (decision === 'EXISTING_STUDENT') {
      await walkinRepository.update(id, {
        status: 'COMPLETED',
        updatedBy: userId,
      });
      await logDecision('Linked to existing student', { reason });
      return { lead: await walkinRepository.findById(id), enquiry: null, decision };
    }

    throw new AppError('Invalid counsellor decision', 400);
  },
};
