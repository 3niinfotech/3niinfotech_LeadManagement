import prisma from '../../config/database.js';

export const roleApplicationRepository = {
  async generateCode(companyId) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { code: true },
    });
    const prefix = (company?.code || 'CO').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    const count = await prisma.roleApplication.count({ where: { companyId } });
    return `${prefix}-APP${String(count + 1).padStart(6, '0')}`;
  },

  findMany({ skip, limit, where, orderBy }) {
    return prisma.roleApplication.findMany({
      where: { deletedAt: null, ...where },
      skip,
      take: limit,
      orderBy: orderBy || { createdAt: 'desc' },
      include: {
        branch: { select: { id: true, name: true, code: true, city: true } },
        company: { select: { id: true, name: true, code: true } },
        reviewedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        approvedUser: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  },

  count(where) {
    return prisma.roleApplication.count({ where: { deletedAt: null, ...where } });
  },

  findById(id) {
    return prisma.roleApplication.findFirst({
      where: { id, deletedAt: null },
      include: {
        branch: { select: { id: true, name: true, code: true, city: true } },
        company: { select: { id: true, name: true, code: true } },
        reviewedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        approvedUser: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  },

  create(data) {
    return prisma.roleApplication.create({ data });
  },

  update(id, data) {
    return prisma.roleApplication.update({ where: { id }, data });
  },

  statusSummary(companyId) {
    return prisma.roleApplication.groupBy({
      by: ['status'],
      where: { deletedAt: null, ...(companyId ? { companyId } : {}) },
      _count: { _all: true },
    });
  },

  findPendingByEmail(email, companyId) {
    return prisma.roleApplication.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        companyId,
        status: 'PENDING',
        deletedAt: null,
      },
    });
  },
};
