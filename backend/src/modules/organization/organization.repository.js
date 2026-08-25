import prisma from '../../config/database.js';
import { softDeleteWhere } from '../../utils/response.util.js';

const companySelect = {
  id: true,
  name: true,
  code: true,
  legalName: true,
  email: true,
  phone: true,
  address: true,
  addressLine1: true,
  addressLine2: true,
  city: true,
  state: true,
  postalCode: true,
  taxNumber: true,
  registrationNumber: true,
  website: true,
  logo: true,
  settings: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  country: { select: { id: true, name: true, code: true } },
};

const branchSelect = {
  id: true,
  companyId: true,
  name: true,
  code: true,
  email: true,
  phone: true,
  address: true,
  addressLine1: true,
  addressLine2: true,
  city: true,
  state: true,
  postalCode: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  country: { select: { id: true, name: true, code: true } },
  _count: { select: { users: true, enquiries: true, students: true } },
};

export const organizationRepository = {
  findCompanyById: (id) => prisma.company.findFirst({
    where: { id, ...softDeleteWhere },
    select: companySelect,
  }),

  updateCompany: (id, data) => prisma.company.update({
    where: { id },
    data,
    select: companySelect,
  }),

  listBranches: (companyId, { search, status } = {}) => {
    const where = {
      companyId,
      ...softDeleteWhere,
    };
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;
    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { code: { contains: q } },
        { city: { contains: q } },
      ];
    }
    return prisma.branch.findMany({
      where,
      select: branchSelect,
      orderBy: [{ name: 'asc' }],
    });
  },

  findBranchById: (id, companyId) => prisma.branch.findFirst({
    where: { id, companyId, ...softDeleteWhere },
    select: branchSelect,
  }),

  createBranch: (data) => prisma.branch.create({
    data,
    select: branchSelect,
  }),

  updateBranch: (id, data) => prisma.branch.update({
    where: { id },
    data,
    select: branchSelect,
  }),

  countBranches: (companyId) => prisma.branch.count({
    where: { companyId, ...softDeleteWhere },
  }),
};
