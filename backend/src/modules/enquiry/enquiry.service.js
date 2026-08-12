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
  assertEnquiryInTenant,
  assertEnquiryIdsInTenant,
  assertLeadInTenant,
  requireTenantCompany,
} from '../../utils/tenant.util.js';
import { ENQUIRY_SORT_FIELDS } from './enquiry.validators.js';
import { CLOSED_VIEW_STATUSES } from './enquiryStatus.config.js';
import { normalizeEnquiryTags } from './enquiryTags.config.js';
import { normalizeDocumentCategory } from './enquiryDocument.config.js';
import { smartReminderService } from './enquirySmartReminder.service.js';
import { SMART_REMINDER_PREFIX } from './enquirySmartReminder.config.js';

const CLOSED_STATUS_SET = new Set([...CLOSED_VIEW_STATUSES, 'CONVERTED']);

/** Walk-in leads without enquiry — auto-create so Manage Enquiry list stays in sync */
async function syncOrphanLeadsToEnquiries(user, createFromLead) {
  const companyId = requireTenantCompany(user);
  if (!companyId || !createFromLead) return;

  const orphans = await prisma.lead.findMany({
    where: {
      deletedAt: null,
      enquiry: null,
      branch: { companyId, deletedAt: null },
    },
    orderBy: { createdAt: 'asc' },
    take: 25,
  });

  if (!orphans.length) return;

  await Promise.all(
    orphans.map((lead) =>
      createFromLead(lead, user.id, { user }, { status: 'NEW', priority: 'MEDIUM' }),
    ),
  );
}

async function requireEnquiry(id, user) {
  const scopeWhere = mergeScope(user);
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
    const scopeWhere = mergeScope(user);
    return enquiryRepository.findMany({
      ...filters,
      scopeWhere,
      page: Number(page) || 1,
      limit: Number(limit) || 25,
      sort,
      userId: user.id,
    });
  },

  getSummary: async (query, user) => {
    await syncOrphanLeadsToEnquiries(user, enquiryService.createFromLead.bind(enquiryService));
    const scopeWhere = mergeScope(user);
    return enquiryRepository.getSummary({ ...query, scopeWhere, userId: user.id });
  },

  getById: async (id, user) => {
    const scopeWhere = mergeScope(user);
    let enquiry = await enquiryRepository.findById(id, scopeWhere);
    if (!enquiry) throw new AppError('Enquiry not found', 404);
    enquiry = await smartReminderService.evaluateAndProcess(enquiry);
    return enquiry;
  },

  checkDuplicates: async (params, user) => {
    const scopeWhere = mergeScope(user);
    const matches = await enquiryRepository.findDuplicates({ ...params, scopeWhere });
    return {
      hasDuplicate: matches.length > 0,
      matches,
    };
  },

  create: async (data, userId, req) => {
    const branch = await assertBranchInTenant(data.branchId, req.user);
    if (data.assignedToId) await assertUserInTenant(data.assignedToId, req.user);
    const enquiryCode = await enquiryRepository.generateCode(branch.companyId);
    const payload = {
      ...mapEnquiryInput(data),
      enquiryCode,
      assignedById: data.assignedToId ? userId : null,
      createdBy: userId,
      updatedBy: userId,
      status: data.status || 'NEW',
      priority: data.priority || 'MEDIUM',
      tags: normalizeEnquiryTags(data.tags || []),
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
      if (status && existing.status !== status) {
        return enquiryRepository.update(existing.id, {
          status,
          updatedBy: userId,
          lastTouchedAt: new Date(),
        });
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
      description: `Qualified enquiry from walk-in ${lead.leadCode}`,
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
        description: `Qualified enquiry ${enquiryCode} created from counselling`,
        metadata: { enquiryId: enquiry.id, enquiryCode, leadCode: lead.leadCode },
      },
    });

    return enquiry;
  },

  update: async (id, data, userId, req) => {
    const existing = await requireEnquiry(id, req.user);
    if (data.branchId !== undefined) await assertBranchInTenant(data.branchId, req.user);
    if (data.assignedToId) await assertUserInTenant(data.assignedToId, req.user);
    const payload = { ...mapEnquiryInput(data), updatedBy: userId };
    if (data.assignedToId !== undefined) payload.assignedById = data.assignedToId ? userId : null;
    const enquiry = await enquiryRepository.update(id, payload);
    await logEnquiryChanges(id, userId, existing, enquiry, [
      'firstName', 'lastName', 'email', 'mobile', 'status', 'priority', 'tags', 'interestedCourse', 'interestedCountry',
    ], req);
    if (data.assignedToId !== undefined && data.assignedToId !== existing.assignedToId) {
      await logEnquiryAudit({
        enquiryId: id,
        userId,
        action: 'ASSIGN',
        field: 'assignedToId',
        oldValue: existing.assignedToId || '',
        newValue: data.assignedToId || '',
        description: data.assignedToId ? 'Counsellor assigned' : 'Assignment cleared',
        req,
      });
    }
    await auditLog({
      userId, action: 'UPDATE', entityType: 'enquiry', entityId: id, oldData: existing, newData: enquiry, req,
    });
    return enquiry;
  },

  updateStatus: async (id, status, userId, req) => {
    const existing = await requireEnquiry(id, req.user);
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
    await assertUserInTenant(assignedToId, req.user);
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
    return { count: ids.length };
  },

  bulkUpdateStatus: async (ids, status, userId, req) => {
    await assertEnquiryIdsInTenant(ids, req.user);
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
    const { sortBy, sortOrder, ids: requestedIds, ...filters } = query;
    const sort = parseSort({ sortBy, sortOrder }, ENQUIRY_SORT_FIELDS);
    const scopeWhere = buildDataScopeWhere(user, { companyViaBranch: true });
    const result = await enquiryRepository.findMany({
      ...filters,
      scopeWhere,
      page: 1,
      limit: 5000,
      sort,
      userId: user.id,
    });
    const ids = requestedIds?.length ? requestedIds : result.data.map((row) => row.id);
    const exported = ids.filter((id) => result.data.some((row) => row.id === id));

    for (const id of exported) {
      await logEnquiryAudit({
        enquiryId: id,
        userId,
        action: 'EXPORTED',
        description: 'Included in enquiry export',
        req,
      });
    }

    await auditLog({
      userId,
      action: 'EXPORT',
      entityType: 'enquiry',
      newData: { count: exported.length, ids: exported },
      req,
    });

    return result.data.filter((row) => exported.includes(row.id));
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
    if (data.counsellorId) await assertUserInTenant(data.counsellorId, req.user);
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
    if (data.facultyId) await assertUserInTenant(data.facultyId, req.user);

    const demoDate = new Date(data.demoDate);
    const attendance = data.attendance || 'NOT_MARKED';
    const result = data.result || 'PENDING';

    const demo = await enquiryRepository.addDemo({
      enquiryId: id,
      userId,
      facultyId: data.facultyId || null,
      demoDate,
      className: data.className?.trim() || null,
      batch: data.batch?.trim() || null,
      attendance,
      feedback: data.feedback?.trim() || null,
      result,
      remark: data.remark?.trim() || null,
    });

    let nextStatus = enquiry.status;
    if (result === 'CONVERTED') {
      nextStatus = 'CONVERTED';
    } else if (attendance !== 'NOT_MARKED') {
      nextStatus = 'DEMO_ATTENDED';
    } else if (demoDate > new Date()) {
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

  getDocuments: async (id) => {
    const enquiry = await enquiryRepository.findById(id);
    if (!enquiry) throw new AppError('Enquiry not found', 404);
    return enquiry.documents;
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

  removeDocument: async (docId, userId, enquiryId) => {
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
