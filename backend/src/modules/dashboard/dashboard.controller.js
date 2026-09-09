import { asyncHandler, sendSuccess } from '../../utils/response.util.js';
import { dashboardService } from './dashboard.service.js';

export const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getStats(req.user);
  sendSuccess(res, stats);
});

export const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const data = await dashboardService.getAnalytics(req.query, req.user);
  sendSuccess(res, data);
});

export const getRecentActivity = asyncHandler(async (req, res) => {
  const activity = await dashboardService.getRecentActivity(req.user);
  sendSuccess(res, activity);
});

export const getMyTarget = asyncHandler(async (req, res) => {
  const data = await dashboardService.getMyTarget(req.user);
  sendSuccess(res, data);
});
