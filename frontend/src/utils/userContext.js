/** Branch / tenant helpers — auth user may expose branch.id or branchId */
export function getUserBranchId(user) {
  if (!user) return '';
  return user.branchId || user.branch?.id || '';
}

export function getUserCompanyId(user) {
  if (!user) return '';
  return user.companyId || user.company?.id || '';
}
