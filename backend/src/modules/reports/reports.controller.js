import { asyncHandler, sendSuccess } from '../../utils/response.util.js';
import { reportsService } from './reports.service.js';
import { attendanceService } from '../attendance/attendance.service.js';

export const getEnquiryReports = asyncHandler(async (req, res) => {
  const data = await reportsService.getEnquiryReports(req.query, req.user);
  sendSuccess(res, data);
});

export const getAttendanceReport = asyncHandler(async (req, res) => {
  const [classReport, demoList] = await Promise.all([
    attendanceService.classReport(req.query, req.user),
    reportsService.getEnquiryReports(req.query, req.user).then((r) => r.demo),
  ]);
  sendSuccess(res, { class: classReport, demo: demoList });
});

export const exportDataset = asyncHandler(async (req, res) => {
  const data = await reportsService.exportDataset(req.params.kind, req.user);
  sendSuccess(res, data, 'Export ready');
});
