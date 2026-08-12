import { asyncHandler, sendSuccess } from '../../utils/response.util.js';
import { dashboardService } from './dashboard.service.js';

export const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getStats(req.user.branchId);
  sendSuccess(res, stats);
});

export const getRecentActivity = asyncHandler(async (req, res) => {
  const activity = await dashboardService.getRecentActivity();
  sendSuccess(res, activity);
});
