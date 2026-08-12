import { AppError, buildPagination, parsePagination } from '../../utils/response.util.js';
import { userRepository } from './user.repository.js';

const formatUser = (user) => {
  if (!user) return null;
  const { _count, password, ...rest } = user;
  return {
    ...rest,
    workload: _count
      ? {
          enquiries: _count.assignedEnquiries,
          leads: _count.assignedLeads,
          students: _count.assignedStudents,
          total: _count.assignedEnquiries + _count.assignedLeads + _count.assignedStudents,
        }
      : undefined,
  };
};

export const userService = {
  getAll: async (query, requester) => {
    const { page, limit, skip } = parsePagination(query);
    const companyId = requester.role?.slug === 'super_admin' ? query.companyId : requester.companyId;

    const { users, total } = await userRepository.findMany({
      skip,
      limit,
      search: query.search?.trim() || undefined,
      roleSlug: query.role || undefined,
      branchId: query.branchId || undefined,
      status: query.status || undefined,
      companyId: companyId || undefined,
    });

    return {
      data: users.map(formatUser),
      pagination: buildPagination(page, limit, total),
    };
  },

  getById: async (id, requester) => {
    const user = await userRepository.findById(id);
    if (!user) throw new AppError('User not found', 404);

    if (
      requester.id !== id
      && requester.role?.slug !== 'super_admin'
      && requester.role?.slug !== 'admin'
      && !requester.permissions?.includes('users:view')
    ) {
      throw new AppError('Access denied', 403);
    }

    if (
      requester.role?.slug !== 'super_admin'
      && requester.companyId
      && user.companyId !== requester.companyId
    ) {
      throw new AppError('Access denied', 403);
    }

    return formatUser(user);
  },

  getRoles: async () => {
    const roles = await userRepository.findRoles();
    return roles;
  },

  getTeamSummary: async (requester) => {
    const companyId = requester.role?.slug === 'super_admin' ? undefined : requester.companyId;
    return userRepository.getTeamSummary(companyId);
  },
};
