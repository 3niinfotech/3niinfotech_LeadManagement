import prisma from '../../config/database.js';
import { softDeleteWhere, buildPagination, parsePagination } from '../../utils/response.util.js';
import {
  ENQUIRY_STATUSES,
  CLOSED_ENQUIRY_STATUSES,
  CLOSED_VIEW_STATUSES,
} from './enquiryStatus.config.js';
import { getMatchedFields, normalizeEmail, normalizePassport, normalizePhone } from './enquiryDuplicate.utils.js';

const userSelect = { id: true, firstName: true, lastName: true, email: true };
const facultySelect = { id: true, name: true, code: true, email: true };
const branchSelect = { id: true, name: true, code: true };

const buildWhere = (filters = {}) => {
  const { scopeWhere, ...rest } = filters;
  const where = { ...softDeleteWhere, ...(scopeWhere || {}) };
  const {
    search, status, priority, tag, branchId, assignedToId, unassigned, view,
    userId, keyword, enquiryId, country, staffId, source,
    otherReference, applyLevel, intake, course,
    createdFrom, createdTo, updatedFrom, updatedTo, statusIn, ids,
  } = rest;

  if (Array.isArray(ids) && ids.length) {
    where.id = { in: ids };
  }

  if (statusIn) {
    const values = String(statusIn).split(',').map((s) => s.trim()).filter(Boolean);
    if (values.length) where.status = { in: values };
  } else if (status) {
    where.status = status;
  }
  if (priority) where.priority = priority;
  if (tag) {
    where.AND = [...(where.AND || []), { tags: { string_contains: `"${tag}"` } }];
  }
  if (branchId) where.branchId = branchId;
  if (enquiryId) where.enquiryCode = { contains: enquiryId };
  if (country) where.interestedCountry = { contains: country };
  if (source) where.source = { contains: source };
  if (otherReference) where.otherReference = { contains: otherReference };
  if (applyLevel) where.applyLevel = { contains: applyLevel };
  if (intake) where.intake = { contains: intake };
  if (course) where.interestedCourse = { contains: course };
  if (staffId || assignedToId) where.assignedToId = staffId || assignedToId;
  if (unassigned === 'true' || unassigned === true) where.assignedToId = null;

  if (view === 'assigned_to_me' && userId) where.assignedToId = userId;
  if (view === 'unassigned') where.assignedToId = null;
  if (view === 'closed' || view === 'dropped') where.status = { in: CLOSED_VIEW_STATUSES };
  if (view === 'untouched_5_days') {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    where.OR = [
      { lastTouchedAt: null },
      { lastTouchedAt: { lt: fiveDaysAgo } },
    ];
    where.status = { notIn: CLOSED_ENQUIRY_STATUSES };
  }

  if (createdFrom || createdTo) {
    where.createdAt = {};
    if (createdFrom) where.createdAt.gte = new Date(createdFrom);
    if (createdTo) where.createdAt.lte = new Date(createdTo);
  }
  if (updatedFrom || updatedTo) {
    where.updatedAt = {};
    if (updatedFrom) where.updatedAt.gte = new Date(updatedFrom);
    if (updatedTo) where.updatedAt.lte = new Date(updatedTo);
  }

  const term = keyword || search;
  if (term) {
    where.OR = [
      { firstName: { contains: term } },
      { lastName: { contains: term } },
      { email: { contains: term } },
      { mobile: { contains: term } },
      { enquiryCode: { contains: term } },
      { interestedCourse: { contains: term } },
      { lastRemark: { contains: term } },
    ];
  }

  return where;
};

export const enquiryRepository = {
  findMany: async ({ page, limit, sort, ...filters }) => {
    const { skip } = parsePagination({ page, limit });
    const where = buildWhere(filters);

    const [data, total] = await Promise.all([
      prisma.enquiry.findMany({
        where,
        skip,
        take: limit,
        orderBy: sort,
        include: {
          branch: { select: branchSelect },
          assignedTo: { select: userSelect },
          assignedBy: { select: userSelect },
          documents: {
            where: { category: 'PHOTO' },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              filePath: true,
              mimeType: true,
              fileName: true,
            },
          },
        },
      }),
      prisma.enquiry.count({ where }),
    ]);

    const rows = data.map((row) => {
      const photo = row.documents?.[0];
      const isImage = photo?.mimeType?.startsWith('image/')
        || /\.(jpe?g|png|gif|webp|bmp)$/i.test(photo?.fileName || '');
      const { documents, ...rest } = row;
      return {
        ...rest,
        photoUrl: isImage && photo?.filePath ? photo.filePath : null,
      };
    });

    return { data: rows, pagination: buildPagination(page, limit, total) };
  },

  findById: (id, scopeWhere = {}) => prisma.enquiry.findFirst({
    where: { id, ...softDeleteWhere, ...scopeWhere },
    include: {
      branch: true,
      assignedTo: { select: userSelect },
      assignedBy: { select: userSelect },
      followups: { orderBy: { createdAt: 'desc' }, include: { user: { select: userSelect } } },
      appointments: {
        orderBy: { startAt: 'desc' },
        include: {
          user: { select: userSelect },
          counsellor: { select: userSelect },
        },
      },
      demos: {
        orderBy: { demoDate: 'desc' },
        include: {
          user: { select: userSelect },
          faculty: { select: facultySelect },
          attendanceMarkedBy: { select: userSelect },
        },
      },
      notes: {
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        include: {
          user: { select: userSelect },
          attachments: { orderBy: { createdAt: 'asc' } },
        },
      },
      documents: { orderBy: { createdAt: 'desc' } },
      communications: {
        orderBy: { sentAt: 'desc' },
        include: { user: { select: userSelect } },
      },
      student: {
        select: {
          id: true,
          studentCode: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          status: true,
          deletedAt: true,
        },
      },
      auditLogs: {
        orderBy: { createdAt: 'desc' },
        take: 500,
        include: { user: { select: userSelect } },
      },
    },
  }),

  create: (data) => prisma.enquiry.create({ data }),
  update: (id, data) => prisma.enquiry.update({ where: { id }, data }),

  softDelete: (id, userId) => prisma.enquiry.update({
    where: { id },
    data: { deletedAt: new Date(), updatedBy: userId },
  }),

  bulkSoftDelete: (ids, userId) => prisma.enquiry.updateMany({
    where: { id: { in: ids }, ...softDeleteWhere },
    data: { deletedAt: new Date(), updatedBy: userId },
  }),

  bulkAssign: (ids, assignedToId, assignedById, userId) => prisma.enquiry.updateMany({
    where: { id: { in: ids }, ...softDeleteWhere },
    data: { assignedToId, assignedById, updatedBy: userId, lastTouchedAt: new Date() },
  }),

  bulkUpdateStatus: (ids, status, userId) => prisma.enquiry.updateMany({
    where: { id: { in: ids }, ...softDeleteWhere },
    data: { status, updatedBy: userId, lastTouchedAt: new Date() },
  }),

  bulkMoveBranch: (ids, branchId, userId) => prisma.enquiry.updateMany({
    where: { id: { in: ids }, ...softDeleteWhere },
    data: { branchId, updatedBy: userId, lastTouchedAt: new Date() },
  }),

  listBranches: async (companyId) => prisma.branch.findMany({
    where: companyId ? { companyId } : undefined,
    select: { id: true, name: true, code: true },
    orderBy: { name: 'asc' },
    take: 100,
  }),

  getSummary: async (filters = {}) => {
    const baseWhere = buildWhere(filters);
    const [total, ...counts] = await Promise.all([
      prisma.enquiry.count({ where: baseWhere }),
      ...ENQUIRY_STATUSES.map((status) => prisma.enquiry.count({
        where: { ...baseWhere, status: status.value },
      })),
    ]);

    const summary = { total };
    ENQUIRY_STATUSES.forEach((status, index) => {
      summary[status.summaryKey] = counts[index];
    });
    return summary;
  },

  generateCode: async (companyId) => {
    const company = companyId
      ? await prisma.company.findUnique({ where: { id: companyId }, select: { code: true } })
      : null;
    const coPrefix = (company?.code || 'CO').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    const count = await prisma.enquiry.count({
      where: companyId ? { branch: { companyId } } : undefined,
    });
    return `${coPrefix}-ENQ${String(count + 1).padStart(6, '0')}`;
  },

  addFollowup: (data) => prisma.enquiryFollowup.create({ data }),
  addAppointment: (data) => prisma.enquiryAppointment.create({ data }),
  addDemo: (data) => prisma.enquiryDemo.create({
    data,
    include: {
      user: { select: userSelect },
      faculty: { select: facultySelect },
      attendanceMarkedBy: { select: userSelect },
    },
  }),

  findDemoById: (id) => prisma.enquiryDemo.findUnique({
    where: { id },
    include: {
      user: { select: userSelect },
      faculty: { select: facultySelect },
      attendanceMarkedBy: { select: userSelect },
      enquiry: {
        select: {
          id: true,
          enquiryCode: true,
          firstName: true,
          lastName: true,
          branchId: true,
          assignedToId: true,
          assignedTo: { select: userSelect },
          branch: { select: branchSelect },
          studentId: true,
          interestedCourse: true,
          status: true,
        },
      },
    },
  }),

  updateDemo: (id, data) => prisma.enquiryDemo.update({
    where: { id },
    data,
    include: {
      user: { select: userSelect },
      faculty: { select: facultySelect },
      attendanceMarkedBy: { select: userSelect },
    },
  }),

  listDemos: (where, { skip = 0, take = 50 } = {}) => prisma.enquiryDemo.findMany({
    where,
    include: {
      user: { select: userSelect },
      faculty: { select: facultySelect },
      attendanceMarkedBy: { select: userSelect },
      enquiry: {
        select: {
          id: true,
          enquiryCode: true,
          firstName: true,
          lastName: true,
          mobile: true,
          email: true,
          priority: true,
          interestedCountry: true,
          branchId: true,
          assignedToId: true,
          assignedTo: { select: userSelect },
          branch: { select: branchSelect },
          studentId: true,
          interestedCourse: true,
          status: true,
        },
      },
    },
    orderBy: { demoDate: 'desc' },
    skip,
    take,
  }),

  countDemos: (where) => prisma.enquiryDemo.count({ where }),
  addNote: (data) => prisma.enquiryNote.create({
    data,
    include: {
      user: { select: userSelect },
      attachments: true,
    },
  }),
  updateNote: (id, data) => prisma.enquiryNote.update({
    where: { id },
    data,
    include: {
      user: { select: userSelect },
      attachments: { orderBy: { createdAt: 'asc' } },
    },
  }),
  findNoteById: (id) => prisma.enquiryNote.findUnique({
    where: { id },
    include: {
      user: { select: userSelect },
      attachments: { orderBy: { createdAt: 'asc' } },
    },
  }),
  addNoteAttachment: (data) => prisma.enquiryNoteAttachment.create({ data }),
  addDocument: (data) => prisma.enquiryDocument.create({ data }),
  deleteDocument: (id) => prisma.enquiryDocument.delete({ where: { id } }),
  addCommunication: (data) => prisma.enquiryCommunication.create({
    data,
    include: { user: { select: userSelect } },
  }),

  getTimeline: (enquiryId) => prisma.enquiryAuditLog.findMany({
    where: { enquiryId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: userSelect },
    },
  }),

  createImportBatch: (data) => prisma.enquiryImportBatch.create({ data }),
  updateImportBatch: (id, data) => prisma.enquiryImportBatch.update({ where: { id }, data }),
  listImportBatches: (userId) => prisma.enquiryImportBatch.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { duplicateRows: true } } },
  }),
  getImportDuplicates: (batchId) => prisma.enquiryImportDuplicate.findMany({
    where: { batchId },
    orderBy: { createdAt: 'asc' },
  }),
  addImportDuplicate: (data) => prisma.enquiryImportDuplicate.create({ data }),

  findDuplicates: async ({ email, mobile, alternateNo, passportNo, excludeId, scopeWhere }) => {
    const baseWhere = { ...softDeleteWhere, ...(scopeWhere || {}) };
    if (excludeId) baseWhere.id = { not: excludeId };

    const or = [];
    const normalizedEmail = normalizeEmail(email);
    if (normalizedEmail) {
      const [local, domain] = normalizedEmail.split('@');
      if (local && domain) {
        or.push({ AND: [{ email: { contains: local } }, { email: { contains: `@${domain}` } }] });
      }
    }

    const mobileDigits = normalizePhone(mobile);
    if (mobileDigits) {
      or.push({ mobile: { contains: mobileDigits } });
      or.push({ alternateNo: { contains: mobileDigits } });
    }

    const altDigits = normalizePhone(alternateNo);
    if (altDigits) {
      or.push({ mobile: { contains: altDigits } });
      or.push({ alternateNo: { contains: altDigits } });
    }

    const passport = normalizePassport(passportNo);
    if (passport.length >= 4) or.push({ passportNo: passport });

    if (!or.length) return [];

    const candidates = await prisma.enquiry.findMany({
      where: { ...baseWhere, OR: or },
      take: 8,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        enquiryCode: true,
        firstName: true,
        lastName: true,
        email: true,
        mobile: true,
        alternateNo: true,
        passportNo: true,
        status: true,
        createdAt: true,
      },
    });

    return candidates
      .map((record) => ({
        ...record,
        matchedOn: getMatchedFields(record, { email, mobile, alternateNo, passportNo }),
      }))
      .filter((record) => record.matchedOn.length > 0);
  },
};
