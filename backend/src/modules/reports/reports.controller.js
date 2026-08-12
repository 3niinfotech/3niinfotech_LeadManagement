import { asyncHandler, sendSuccess } from '../../utils/response.util.js';
import { reportsService } from './reports.service.js';

export const getEnquiryReports = asyncHandler(async (req, res) => {
  const data = await reportsService.getEnquiryReports(req.query, req.user);
  sendSuccess(res, data);
});
