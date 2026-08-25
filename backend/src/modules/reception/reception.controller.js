import { asyncHandler, sendSuccess } from '../../utils/response.util.js';
import { receptionService } from './reception.service.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const data = await receptionService.getDashboard(req.user);
  sendSuccess(res, data);
});
