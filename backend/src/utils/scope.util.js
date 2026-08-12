/**
 * Build Prisma where clause from user's data scope.
 * TEAM falls back to branch until team hierarchy is modeled.
 */
export function buildDataScopeWhere(user, options = {}) {
  const {
    ownerField = 'assignedToId',
    branchField = 'branchId',
    companyField = 'companyId',
  } = options;

  const scope = user.dataScope || user.role?.dataScope || 'OWN';

  switch (scope) {
    case 'GLOBAL':
      return {};
    case 'COMPANY':
      if (options.companyViaBranch && user.companyId) {
        return { branch: { companyId: user.companyId } };
      }
      return user.companyId ? { [companyField]: user.companyId } : {};
    case 'BRANCH':
      return user.branchId ? { [branchField]: user.branchId } : {};
    case 'TEAM':
      if (user.teamMemberIds?.length) {
        return { [ownerField]: { in: [...user.teamMemberIds, user.id] } };
      }
      return user.branchId ? { [branchField]: user.branchId } : { [ownerField]: user.id };
    case 'OWN':
    default:
      return { [ownerField]: user.id };
  }
}
