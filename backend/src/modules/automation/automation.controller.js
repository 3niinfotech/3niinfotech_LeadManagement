import { asyncHandler, sendSuccess } from '../../utils/response.util.js';
import { automationService } from './automation.service.js';

export const getAutomationCenter = asyncHandler(async (req, res) => {
  const data = await automationService.getCenter(req.user);
  sendSuccess(res, data);
});

export const getAutomationHistory = asyncHandler(async (req, res) => {
  const data = await automationService.getExecutionHistory(req.user, req.query);
  sendSuccess(res, data);
});

export const updateAutomationRule = asyncHandler(async (req, res) => {
  const data = await automationService.updateRule(
    req.user,
    req.params.ruleId,
    req.body,
    req,
  );
  sendSuccess(res, data, 'Automation rule updated');
});
