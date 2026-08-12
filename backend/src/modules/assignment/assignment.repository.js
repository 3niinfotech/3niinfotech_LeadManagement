import prisma from '../../config/database.js';
import { COUNSELLOR_ROLE_SLUGS } from './assignment.config.js';

const userSelect = { id: true, firstName: true, lastName: true, email: true, branchId: true };
const leadInclude = {
  branch: { select: { id: true, name: true, code: true } },
  assignedTo: { select: userSelect },
  enquiry: { select: { id: true, enquiryCode: true, status: true } },
};

export const assignmentRepository = {
  findLeadById: (id) => prisma.lead.findFirst({
    where: { id, deletedAt: null },
    include: leadInclude,
  }),

  findStudentByPhone: async (phone, companyId, branchId) => {
    const student = await prisma.student.findFirst({
      where: {
        phone: { contains: phone.slice(-10) },
        deletedAt: null,
        ...(branchId ? { branchId } : { branch: { companyId } }),
      },
      select: { id: true, studentCode: true, firstName: true, lastName: true, phone: true },
    });
    return student;
  },

  findEnquiryByPhone: async (phone, companyId, branchId) => {
    const enquiry = await prisma.enquiry.findFirst({
      where: {
        mobile: { contains: phone.slice(-10) },
        deletedAt: null,
        status: { notIn: ['LOST', 'CONVERTED'] },
        ...(branchId ? { branchId } : { branch: { companyId } }),
      },
      select: { id: true, enquiryCode: true, firstName: true, lastName: true, mobile: true, status: true },
    });
    return enquiry;
  },

  listEligibleCounsellors: async (branchId, excludeIds = [], companyId = null) => {
    const users = await prisma.user.findMany({
      where: {
        ...(companyId ? { companyId } : {}),
        ...(branchId ? { branchId } : {}),
        status: 'ACTIVE',
        deletedAt: null,
        id: excludeIds.length ? { notIn: excludeIds } : undefined,
        role: { slug: { in: COUNSELLOR_ROLE_SLUGS } },
      },
      include: {
        counsellorPresence: true,
        role: { select: { slug: true, name: true } },
      },
    });
    return users;
  },

  upsertPresence: (userId, branchId, data) => prisma.counsellorPresence.upsert({
    where: { userId },
    create: { userId, branchId, ...data },
    update: data,
  }),

  getPresence: (userId) => prisma.counsellorPresence.findUnique({ where: { userId } }),

  createOffer: (data) => prisma.assignmentOffer.create({ data }),

  updateOffer: (id, data) => prisma.assignmentOffer.update({ where: { id }, data }),

  findPendingOfferForLead: (leadId) => prisma.assignmentOffer.findFirst({
    where: { leadId, status: 'PENDING' },
    orderBy: { offeredAt: 'desc' },
    include: { counsellor: { select: userSelect } },
  }),

  findPendingOffersForCounsellor: (counsellorId) => prisma.assignmentOffer.findMany({
    where: { counsellorId, status: 'PENDING', expiresAt: { gt: new Date() } },
    include: { lead: { include: leadInclude } },
    orderBy: { offeredAt: 'asc' },
  }),

  expireStaleOffers: () => prisma.assignmentOffer.updateMany({
    where: { status: 'PENDING', expiresAt: { lte: new Date() } },
    data: { status: 'EXPIRED', respondedAt: new Date() },
  }),

  getExpiredOffersNeedingReroute: async () => {
    const offers = await prisma.assignmentOffer.findMany({
      where: {
        status: 'EXPIRED',
        respondedAt: { gte: new Date(Date.now() - 60000) },
      },
      include: { lead: true },
      take: 50,
    });
    return offers.filter((o) => o.lead?.status === 'WAITING' && !o.lead?.assignedToId);
  },

  countActiveSessions: (counsellorId) => prisma.counsellingSession.count({
    where: { counsellorId, status: 'ACTIVE' },
  }),

  countPendingOffers: (counsellorId) => prisma.assignmentOffer.count({
    where: { counsellorId, status: 'PENDING', expiresAt: { gt: new Date() } },
  }),

  countTodayAssignments: async (counsellorId) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return prisma.assignmentOffer.count({
      where: {
        counsellorId,
        status: 'ACCEPTED',
        respondedAt: { gte: start },
      },
    });
  },

  createSession: (data) => prisma.counsellingSession.create({ data }),

  endSession: (id, data) => prisma.counsellingSession.update({ where: { id }, data }),

  findActiveSession: (leadId) => prisma.counsellingSession.findFirst({
    where: { leadId, status: 'ACTIVE' },
  }),

  logAudit: (data) => prisma.assignmentAuditLog.create({ data }),

  updateLead: (id, data) => prisma.lead.update({
    where: { id },
    data,
    include: leadInclude,
  }),

  getBranchQueue: (branchId, scopeWhere = {}) => prisma.lead.findMany({
    where: {
      branchId,
      deletedAt: null,
      status: { in: ['WAITING', 'IN_COUNSELLING', 'APPOINTMENT'] },
      ...scopeWhere,
    },
    include: leadInclude,
    orderBy: [{ priority: 'desc' }, { walkInAt: 'asc' }],
    take: 100,
  }),

  getCounsellorQueue: async (counsellorId) => {
    const [assigned, offers, activeSession, completedToday] = await Promise.all([
      prisma.lead.findMany({
        where: {
          assignedToId: counsellorId,
          deletedAt: null,
          status: { in: ['WAITING', 'IN_COUNSELLING', 'APPOINTMENT'] },
        },
        include: leadInclude,
        orderBy: { walkInAt: 'asc' },
      }),
      prisma.assignmentOffer.findMany({
        where: { counsellorId, status: 'PENDING', expiresAt: { gt: new Date() } },
        include: { lead: { include: leadInclude } },
        orderBy: { offeredAt: 'asc' },
      }),
      prisma.counsellingSession.findFirst({
        where: { counsellorId, status: 'ACTIVE' },
        include: { lead: { include: leadInclude } },
      }),
      prisma.counsellingSession.count({
        where: {
          counsellorId,
          status: 'COMPLETED',
          endedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);

    return { assigned, offers, activeSession, completedToday };
  },
};
