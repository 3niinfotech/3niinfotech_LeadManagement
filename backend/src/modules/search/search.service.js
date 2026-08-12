import prisma from '../../config/database.js';
import { softDeleteWhere } from '../../utils/response.util.js';

const take = 6;
const suggestTake = 4;

/** Build OR conditions for person-name style queries (e.g. "Rahul Patel") */
function personNameFilter(query, fields = ['firstName', 'lastName', 'email']) {
  const trimmed = query.trim();
  const terms = trimmed.split(/\s+/).filter(Boolean);
  const or = fields.flatMap((field) => [{ [field]: { contains: trimmed } }]);

  if (terms.length >= 2) {
    or.push({
      AND: [
        { firstName: { contains: terms[0] } },
        { lastName: { contains: terms.slice(1).join(' ') } },
      ],
    });
  }

  return { OR: or };
}

export const searchService = {
  globalSearch: async (query, user) => {
    const branchIdOnly = user.role?.slug === 'super_admin' && user.companyId
      ? { branch: { companyId: user.companyId } }
      : (user.branchId ? { branchId: user.branchId } : {});

    const canViewUsers = user.permissions?.includes('users:view')
      || user.role?.slug === 'super_admin'
      || user.role?.slug === 'admin';

    const [
      enquiries,
      students,
      leads,
      visas,
      applications,
      invoices,
      partners,
      users,
    ] = await Promise.all([
      prisma.enquiry.findMany({
        where: {
          ...softDeleteWhere,
          ...branchIdOnly,
          ...personNameFilter(query, ['firstName', 'lastName', 'email', 'mobile', 'enquiryCode']),
        },
        take,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          enquiryCode: true,
          firstName: true,
          lastName: true,
          email: true,
          mobile: true,
          status: true,
          interestedCountry: true,
          interestedCourse: true,
          assignedTo: { select: { firstName: true, lastName: true } },
        },
      }),

      prisma.student.findMany({
        where: {
          ...softDeleteWhere,
          ...branchIdOnly,
          ...personNameFilter(query, ['firstName', 'lastName', 'email', 'studentCode', 'phone']),
        },
        take,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          studentCode: true,
          email: true,
          phone: true,
          status: true,
          country: true,
        },
      }),

      prisma.lead.findMany({
        where: {
          ...softDeleteWhere,
          ...branchIdOnly,
          ...personNameFilter(query),
        },
        take,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          status: true,
          country: true,
        },
      }),

      prisma.visa.findMany({
        where: {
          ...softDeleteWhere,
          ...(user.branchId ? { student: { branchId: user.branchId } } : {}),
          OR: [
            { applicationNo: { contains: query } },
            { country: { contains: query } },
            { student: personNameFilter(query) },
          ],
        },
        take,
        select: {
          id: true,
          country: true,
          status: true,
          applicationNo: true,
          student: { select: { firstName: true, lastName: true } },
        },
      }),

      prisma.application.findMany({
        where: {
          ...softDeleteWhere,
          ...(user.branchId ? { student: { branchId: user.branchId } } : {}),
          OR: [
            { university: { contains: query } },
            { course: { contains: query } },
          ],
        },
        take,
        select: { id: true, university: true, course: true, status: true },
      }),

      prisma.invoice.findMany({
        where: { ...softDeleteWhere, OR: [{ invoiceNo: { contains: query } }] },
        take,
        select: { id: true, invoiceNo: true, total: true, status: true },
      }),

      prisma.partner.findMany({
        where: {
          ...softDeleteWhere,
          OR: [{ name: { contains: query } }, { code: { contains: query } }],
        },
        take,
        select: { id: true, name: true, code: true },
      }),

      canViewUsers
        ? prisma.user.findMany({
            where: {
              ...softDeleteWhere,
              status: 'ACTIVE',
              ...(user.companyId ? { companyId: user.companyId } : {}),
              ...personNameFilter(query),
            },
            take: 4,
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: { select: { name: true, slug: true } },
              branch: { select: { name: true } },
            },
          })
        : Promise.resolve([]),
    ]);

    const total =
      enquiries.length
      + students.length
      + leads.length
      + visas.length
      + applications.length
      + invoices.length
      + partners.length
      + users.length;

    return {
      enquiries,
      students,
      leads,
      visas,
      applications,
      invoices,
      partners,
      users,
      total,
    };
  },

  /** Lightweight autocomplete — faster, fewer results */
  getSuggestions: async (query, user) => {
    const q = query.trim();
    if (!q) return { enquiries: [], students: [], leads: [] };

    const branchIdOnly = user.role?.slug === 'super_admin' && user.companyId
      ? { branch: { companyId: user.companyId } }
      : (user.branchId ? { branchId: user.branchId } : {});

    const [enquiries, students, leads] = await Promise.all([
      prisma.enquiry.findMany({
        where: {
          ...softDeleteWhere,
          ...branchIdOnly,
          ...personNameFilter(q, ['firstName', 'lastName', 'email', 'enquiryCode']),
        },
        take: suggestTake,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          enquiryCode: true,
          firstName: true,
          lastName: true,
          email: true,
          interestedCountry: true,
        },
      }),
      prisma.student.findMany({
        where: {
          ...softDeleteWhere,
          ...branchIdOnly,
          ...personNameFilter(q, ['firstName', 'lastName', 'email', 'studentCode']),
        },
        take: suggestTake,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          studentCode: true,
          email: true,
        },
      }),
      prisma.lead.findMany({
        where: {
          ...softDeleteWhere,
          ...branchIdOnly,
          ...personNameFilter(q),
        },
        take: suggestTake,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          country: true,
        },
      }),
    ]);

    return { enquiries, students, leads };
  },
};
