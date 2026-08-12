import { asyncHandler, sendSuccess, AppError } from '../../utils/response.util.js';
import { featureService } from './feature.service.js';
import { requireTenantCompany } from '../../utils/tenant.util.js';

export const getEffective = asyncHandler(async (req, res) => {
  const companyId = requireTenantCompany(req.user) || req.user.companyId;
  const data = await featureService.getEffective(companyId);
  sendSuccess(res, data);
});

export const getAdminFeatures = asyncHandler(async (req, res) => {
  const companyId = requireTenantCompany(req.user);
  const data = await featureService.getAdminView(companyId);
  sendSuccess(res, data);
});

export const updateFeatures = asyncHandler(async (req, res) => {
  const companyId = requireTenantCompany(req.user);
  if (!companyId) throw new AppError('Company context required', 403);
  const { updates } = req.body;
  if (!Array.isArray(updates)) throw new AppError('updates array required', 400);
  const data = await featureService.updateBulk(companyId, updates, req.user.id, req);
  sendSuccess(res, data, 'Feature toggles updated');
});

export const seedCatalog = asyncHandler(async (req, res) => {
  await featureService.seedCatalog();
  sendSuccess(res, null, 'Feature catalog synced');
});
