import prisma from '../../config/database.js';
import { softDeleteWhere } from '../../utils/response.util.js';
import { mergeScope } from '../../utils/tenant.util.js';
import { academicBranchScope } from '../attendance/attendance.scope.js';
import { STUDENT_ROLE_SLUGS } from '../../config/portal.config.js';

const userSelect = { id: true, firstName: true, lastName: true, email: true };
const facultySelect = { id: true, name: true, code: true, email: true };
const branchSelect = { id: true, name: true, code: true };

function andWhere(...parts) {
  const filtered = parts.filter((p) => p && Object.keys(p).length);
  if (!filtered.length) return {};
  if (filtered.length === 1) return filtered[0];
  return { AND: filtered };
}

function personName(u) {
  if (!u) return null;
  return `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name || u.email || null;
}

export const calendarRepository = {
  findEnquiryFollowups: async ({ user, from, to, branchId, assignedTo, search }) => {
    const scope = mergeScope(user, { entity: 'enquiry' });
    const enquiryWhere = andWhere(
      softDeleteWhere,
      scope,
      branchId ? { branchId } : null,
      assignedTo ? { assignedToId: assignedTo } : null,
      search
        ? {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { email: { contains: search } },
            { mobile: { contains: search } },
            { enquiryCode: { contains: search } },
          ],
        }
        : null,
    );

    return prisma.enquiryFollowup.findMany({
      where: {
        OR: [
          { nextDate: { gte: from, lte: to } },
          { AND: [{ nextDate: null }, { followupAt: { gte: from, lte: to } }] },
        ],
        enquiry: enquiryWhere,
      },
      include: {
        user: { select: userSelect },
        enquiry: {
          select: {
            id: true,
            enquiryCode: true,
            firstName: true,
            lastName: true,
            email: true,
            mobile: true,
            status: true,
            priority: true,
            branchId: true,
            assignedToId: true,
            assignedTo: { select: userSelect },
            branch: { select: branchSelect },
            studentId: true,
          },
        },
      },
      orderBy: { followupAt: 'asc' },
      take: 2000,
    });
  },

  findEnquiryAppointments: async ({ user, from, to, branchId, assignedTo, search }) => {
    const scope = mergeScope(user, { entity: 'enquiry' });
    const enquiryWhere = andWhere(
      softDeleteWhere,
      scope,
      branchId ? { branchId } : null,
      search
        ? {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { email: { contains: search } },
            { mobile: { contains: search } },
            { enquiryCode: { contains: search } },
          ],
        }
        : null,
    );

    return prisma.enquiryAppointment.findMany({
      where: {
        startAt: { gte: from, lte: to },
        ...(assignedTo
          ? { OR: [{ counsellorId: assignedTo }, { userId: assignedTo }] }
          : {}),
        enquiry: enquiryWhere,
      },
      include: {
        user: { select: userSelect },
        counsellor: { select: userSelect },
        enquiry: {
          select: {
            id: true,
            enquiryCode: true,
            firstName: true,
            lastName: true,
            email: true,
            mobile: true,
            status: true,
            priority: true,
            branchId: true,
            assignedToId: true,
            assignedTo: { select: userSelect },
            branch: { select: branchSelect },
            studentId: true,
          },
        },
      },
      orderBy: { startAt: 'asc' },
      take: 2000,
    });
  },

  findLeadFollowups: async ({ user, from, to, branchId, assignedTo, search }) => {
    const scope = mergeScope(user, { entity: 'lead', ownerField: 'assignedToId' });
    return prisma.lead.findMany({
      where: andWhere(
        softDeleteWhere,
        scope,
        { followUpAt: { gte: from, lte: to } },
        { enquiry: null },
        branchId ? { branchId } : null,
        assignedTo ? { assignedToId: assignedTo } : null,
        search
          ? {
            OR: [
              { firstName: { contains: search } },
              { lastName: { contains: search } },
              { phone: { contains: search } },
              { email: { contains: search } },
              { leadCode: { contains: search } },
            ],
          }
          : null,
      ),
      select: {
        id: true,
        leadCode: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        status: true,
        priority: true,
        followUpAt: true,
        branchId: true,
        assignedToId: true,
        assignedTo: { select: userSelect },
        branch: { select: branchSelect },
        studentId: true,
      },
      orderBy: { followUpAt: 'asc' },
      take: 1000,
    });
  },

  findStudentAppointments: async ({ user, from, to, branchId, assignedTo, search }) => {
    const studentScope = mergeScope(user, { entity: 'student', ownerField: 'assignedToId' });
    return prisma.appointment.findMany({
      where: andWhere(
        softDeleteWhere,
        { startAt: { gte: from, lte: to } },
        {
          student: andWhere(
            softDeleteWhere,
            studentScope,
            branchId ? { branchId } : null,
            assignedTo ? { assignedToId: assignedTo } : null,
            search
              ? {
                OR: [
                  { firstName: { contains: search } },
                  { lastName: { contains: search } },
                  { email: { contains: search } },
                  { phone: { contains: search } },
                  { studentCode: { contains: search } },
                ],
              }
              : null,
          ),
        },
      ),
      include: {
        student: {
          select: {
            id: true,
            studentCode: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            status: true,
            branchId: true,
            assignedToId: true,
            assignedTo: { select: userSelect },
            branch: { select: branchSelect },
          },
        },
      },
      orderBy: { startAt: 'asc' },
      take: 1000,
    });
  },

  findInvoiceDues: async ({ user, from, to, branchId, assignedTo, search }) => {
    const studentScope = mergeScope(user, { entity: 'student', ownerField: 'assignedToId' });
    return prisma.invoice.findMany({
      where: andWhere(
        softDeleteWhere,
        { dueDate: { gte: from, lte: to } },
        { status: { notIn: ['PAID', 'CANCELLED'] } },
        {
          OR: [
            {
              student: andWhere(
                softDeleteWhere,
                studentScope,
                branchId ? { branchId } : null,
                assignedTo ? { assignedToId: assignedTo } : null,
                search
                  ? {
                    OR: [
                      { firstName: { contains: search } },
                      { lastName: { contains: search } },
                      { email: { contains: search } },
                      { studentCode: { contains: search } },
                    ],
                  }
                  : null,
              ),
            },
            // Company invoices without student still tenant-walled via created company — skip if no student
          ],
        },
        search
          ? {
            OR: [
              { invoiceNo: { contains: search } },
              { notes: { contains: search } },
            ],
          }
          : null,
      ),
      include: {
        student: {
          select: {
            id: true,
            studentCode: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            branchId: true,
            assignedToId: true,
            assignedTo: { select: userSelect },
            branch: { select: branchSelect },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 1000,
    });
  },

  findFeeInstallmentDues: async ({ user, from, to, branchId, assignedTo, search }) => {
    const studentScope = mergeScope(user, { entity: 'student', ownerField: 'assignedToId' });
    return prisma.feeInstallment.findMany({
      where: {
        dueDate: { gte: from, lte: to },
        status: { not: 'PAID' },
        feePlan: {
          ...softDeleteWhere,
          student: andWhere(
            softDeleteWhere,
            studentScope,
            branchId ? { branchId } : null,
            assignedTo ? { assignedToId: assignedTo } : null,
          ),
        },
        ...(search
          ? {
            OR: [
              { title: { contains: search } },
              {
                feePlan: {
                  student: {
                    OR: [
                      { firstName: { contains: search } },
                      { lastName: { contains: search } },
                      { email: { contains: search } },
                      { phone: { contains: search } },
                      { studentCode: { contains: search } },
                    ],
                  },
                },
              },
            ],
          }
          : {}),
      },
      include: {
        feePlan: {
          include: {
            student: {
              select: {
                id: true,
                studentCode: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                branchId: true,
                assignedToId: true,
                assignedTo: { select: userSelect },
                branch: { select: branchSelect },
              },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 1000,
    });
  },

  findApplicationOffers: async ({ user, from, to, branchId, assignedTo, search }) => {
    const studentScope = mergeScope(user, { entity: 'student', ownerField: 'assignedToId' });
    return prisma.application.findMany({
      where: andWhere(
        softDeleteWhere,
        { offerDate: { gte: from, lte: to } },
        {
          student: andWhere(
            softDeleteWhere,
            studentScope,
            branchId ? { branchId } : null,
            assignedTo ? { assignedToId: assignedTo } : null,
            search
              ? {
                OR: [
                  { firstName: { contains: search } },
                  { lastName: { contains: search } },
                  { studentCode: { contains: search } },
                ],
              }
              : null,
          ),
        },
        search ? { OR: [{ university: { contains: search } }, { course: { contains: search } }, { applicationNo: { contains: search } }] } : null,
      ),
      include: {
        student: {
          select: {
            id: true,
            studentCode: true,
            firstName: true,
            lastName: true,
            branchId: true,
            assignedToId: true,
            assignedTo: { select: userSelect },
            branch: { select: branchSelect },
          },
        },
      },
      take: 500,
    });
  },

  findVisaExpiries: async ({ user, from, to, branchId, assignedTo, search }) => {
    const studentScope = mergeScope(user, { entity: 'student', ownerField: 'assignedToId' });
    return prisma.visa.findMany({
      where: andWhere(
        softDeleteWhere,
        { expiryDate: { gte: from, lte: to } },
        {
          student: andWhere(
            softDeleteWhere,
            studentScope,
            branchId ? { branchId } : null,
            assignedTo ? { assignedToId: assignedTo } : null,
          ),
        },
        search ? { OR: [{ country: { contains: search } }, { visaType: { contains: search } }] } : null,
      ),
      include: {
        student: {
          select: {
            id: true,
            studentCode: true,
            firstName: true,
            lastName: true,
            branchId: true,
            assignedToId: true,
            assignedTo: { select: userSelect },
            branch: { select: branchSelect },
          },
        },
      },
      take: 500,
    });
  },

  findEnquiryDemos: async ({ user, from, to, branchId, assignedTo, search }) => {
    const enquiryWhere = andWhere(
      softDeleteWhere,
      mergeScope(user, { entity: 'enquiry' }),
      branchId ? { branchId } : null,
      assignedTo ? { assignedToId: assignedTo } : null,
      search
        ? {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { enquiryCode: { contains: search } },
          ],
        }
        : null,
    );
    return prisma.enquiryDemo.findMany({
      where: {
        demoDate: { gte: from, lte: to },
        sessionStatus: { not: 'RESCHEDULED' },
        enquiry: enquiryWhere,
      },
      include: {
        faculty: { select: facultySelect },
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
          },
        },
      },
      take: 1000,
    });
  },

  findClassSessions: async ({ user, from, to, branchId }) => {
    const slug = user.role?.slug;
    const ownerWhere = slug === 'teacher' || STUDENT_ROLE_SLUGS.includes(slug)
      ? academicBranchScope(user, 'session')
      : {
        batch: {
          enrollments: {
            some: { isActive: true, student: mergeScope(user, { entity: 'student' }) },
          },
        },
      };
    return prisma.classSession.findMany({
      where: andWhere(
        softDeleteWhere,
        { startAt: { gte: from, lte: to }, status: { not: 'CANCELLED' } },
        branchId ? { branchId } : null,
        ownerWhere,
      ),
      include: {
        batch: { select: { id: true, name: true, courseName: true, code: true } },
        instructor: { select: userSelect },
        branch: { select: branchSelect },
      },
      take: 1000,
    });
  },

  getEnquiryFollowupById: (id) => prisma.enquiryFollowup.findUnique({
    where: { id },
    include: { enquiry: { select: { id: true, branchId: true, assignedToId: true, deletedAt: true } } },
  }),

  getEnquiryAppointmentById: (id) => prisma.enquiryAppointment.findUnique({
    where: { id },
    include: { enquiry: { select: { id: true, branchId: true, assignedToId: true, deletedAt: true } } },
  }),

  getStudentAppointmentById: (id) => prisma.appointment.findFirst({
    where: { id, ...softDeleteWhere },
    include: { student: { select: { id: true, userId: true, deletedAt: true } } },
  }),

  updateEnquiryFollowup: (id, data) => prisma.enquiryFollowup.update({ where: { id }, data }),

  updateEnquiryAppointment: (id, data) => prisma.enquiryAppointment.update({ where: { id }, data }),

  updateStudentAppointment: (id, data) => prisma.appointment.update({ where: { id }, data }),

  updateLeadFollowUpAt: (id, followUpAt) => prisma.lead.update({
    where: { id },
    data: { followUpAt, updatedAt: new Date() },
  }),

  getLeadById: (id) => prisma.lead.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, branchId: true, assignedToId: true, followUpAt: true },
  }),

  personName,
};
