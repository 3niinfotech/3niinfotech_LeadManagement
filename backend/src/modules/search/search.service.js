import prisma from '../../config/database.js';
import { softDeleteWhere } from '../../utils/response.util.js';
import {
  mergeScope,
  mergeStudentRelationScope,
  isPlatformGlobalUser,
  requireTenantCompany,
  resolveBranchAccessPolicy,
} from '../../utils/tenant.util.js';
import { hasPermission } from '../../modules/rbac/rbac.util.js';

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

function invoiceScope(user) {
  if (isPlatformGlobalUser(user)) return {};
  const companyId = requireTenantCompany(user);
  return {
    OR: [
      { student: { branch: { companyId, deletedAt: null } } },
      { studentId: null, createdBy: user.id },
    ],
  };
}

function partnerScope(user) {
  if (isPlatformGlobalUser(user)) return {};
  requireTenantCompany(user);
  const studentScope = mergeScope(user, { entity: 'student' });
  return {
    students: {
      some: {
        ...softDeleteWhere,
        ...studentScope,
      },
    },
  };
}

export const searchService = {
  globalSearch: async (query, user) => {
    const leadScope = mergeScope(user);
    const enquiryScope = mergeScope(user, { entity: 'enquiry' });
    const studentScope = mergeScope(user, { entity: 'student' });
    const appVisaScope = mergeStudentRelationScope(user);

    const canView = (permission) => hasPermission(user.permissions, permission);
    const canViewEnquiries = canView('enquiry.view');
    const canViewStudents = canView('student.view');
    const canViewLeads = canView('lead.view');
    const canViewVisas = canView('visa.view');
    const canViewApplications = canView('application.view');
    const canViewInvoices = canView('accounts.invoice.view');
    const canViewPartners = canView('partner.view');
    const canViewUsers = canView('users.view');

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
      canViewEnquiries ? prisma.enquiry.findMany({
        where: {
          ...softDeleteWhere,
          ...enquiryScope,
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
      }) : Promise.resolve([]),

      canViewStudents ? prisma.student.findMany({
        where: {
          ...softDeleteWhere,
          ...studentScope,
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
      }) : Promise.resolve([]),

      canViewLeads ? prisma.lead.findMany({
        where: {
          ...softDeleteWhere,
          ...leadScope,
          ...personNameFilter(query, ['firstName', 'lastName', 'email', 'phone', 'leadCode']),
        },
        take,
        select: {
          id: true,
          leadCode: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          status: true,
          country: true,
        },
      }) : Promise.resolve([]),

      canViewVisas ? prisma.visa.findMany({
        where: {
          ...softDeleteWhere,
          ...appVisaScope,
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
      }) : Promise.resolve([]),

      canViewApplications ? prisma.application.findMany({
        where: {
          ...softDeleteWhere,
          ...appVisaScope,
          OR: [
            { university: { contains: query } },
            { course: { contains: query } },
          ],
        },
        take,
        select: { id: true, university: true, course: true, status: true },
      }) : Promise.resolve([]),

      canViewInvoices ? prisma.invoice.findMany({
        where: {
          ...softDeleteWhere,
          ...invoiceScope(user),
          OR: [{ invoiceNo: { contains: query } }],
        },
        take,
        select: { id: true, invoiceNo: true, total: true, status: true },
      }) : Promise.resolve([]),

      canViewPartners ? prisma.partner.findMany({
        where: {
          ...softDeleteWhere,
          ...partnerScope(user),
          OR: [{ name: { contains: query } }, { code: { contains: query } }],
        },
        take,
        select: { id: true, name: true, code: true },
      }) : Promise.resolve([]),

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

    const leadScope = mergeScope(user);
    const enquiryScope = mergeScope(user, { entity: 'enquiry' });
    const studentScope = mergeScope(user, { entity: 'student' });
    const canViewEnquiries = hasPermission(user.permissions, 'enquiry.view');
    const canViewStudents = hasPermission(user.permissions, 'student.view');
    const canViewLeads = hasPermission(user.permissions, 'lead.view');

    const [enquiries, students, leads] = await Promise.all([
      canViewEnquiries ? prisma.enquiry.findMany({
        where: {
          ...softDeleteWhere,
          ...enquiryScope,
          ...personNameFilter(q, ['firstName', 'lastName', 'email', 'mobile', 'enquiryCode']),
        },
        take: suggestTake,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          enquiryCode: true,
          firstName: true,
          lastName: true,
          email: true,
          mobile: true,
          interestedCountry: true,
        },
      }) : Promise.resolve([]),
      canViewStudents ? prisma.student.findMany({
        where: {
          ...softDeleteWhere,
          ...studentScope,
          ...personNameFilter(q, ['firstName', 'lastName', 'email', 'phone', 'studentCode']),
        },
        take: suggestTake,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          studentCode: true,
          email: true,
          phone: true,
        },
      }) : Promise.resolve([]),
      canViewLeads ? prisma.lead.findMany({
        where: {
          ...softDeleteWhere,
          ...leadScope,
          ...personNameFilter(q, ['firstName', 'lastName', 'email', 'phone', 'leadCode']),
        },
        take: suggestTake,
        select: {
          id: true,
          leadCode: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          country: true,
        },
      }) : Promise.resolve([]),
    ]);

    return { enquiries, students, leads };
  },
};
