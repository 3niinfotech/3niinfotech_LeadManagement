import { asyncHandler, sendSuccess } from '../../utils/response.util.js';
import { reminderService } from './reminder.service.js';

export const getFeed = asyncHandler(async (req, res) => {
  const data = await reminderService.getFeed(req.query || {}, req.user);
  sendSuccess(res, data, 'Reminders');
});

export const getSummary = asyncHandler(async (req, res) => {
  const data = await reminderService.getSummary(req.query || {}, req.user);
  sendSuccess(res, data, 'Reminder summary');
});
