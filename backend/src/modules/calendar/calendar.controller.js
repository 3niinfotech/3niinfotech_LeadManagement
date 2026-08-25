import { asyncHandler, sendSuccess } from '../../utils/response.util.js';
import { calendarService } from './calendar.service.js';
import {
  calendarEventsQuerySchema,
  calendarSummaryQuerySchema,
  calendarRescheduleSchema,
  calendarAssignSchema,
} from './calendar.validators.js';
import { followupSchema, appointmentSchema } from '../enquiry/enquiry.validators.js';
import { enquiryService } from '../enquiry/enquiry.service.js';

export const searchEnquiries = asyncHandler(async (req, res) => {
  const data = await calendarService.searchEnquiries(String(req.query.q || ''), req.user);
  sendSuccess(res, data, 'Calendar enquiry options');
});

export const addFollowup = asyncHandler(async (req, res) => {
  const body = followupSchema.parse(req.body);
  const data = await enquiryService.addFollowup(req.params.enquiryId, body, req.user.id, req);
  sendSuccess(res, data, 'Follow-up added', 201);
});

export const addAppointment = asyncHandler(async (req, res) => {
  const body = appointmentSchema.parse(req.body);
  const data = await enquiryService.addAppointment(req.params.enquiryId, body, req.user.id, req);
  sendSuccess(res, data, 'Appointment added', 201);
});

export const getEvents = asyncHandler(async (req, res) => {
  const query = calendarEventsQuerySchema.parse(req.query);
  const data = await calendarService.getEvents(query, req.user);
  sendSuccess(res, data, 'Calendar events');
});

export const getSummary = asyncHandler(async (req, res) => {
  const query = calendarSummaryQuerySchema.parse(req.query);
  const data = await calendarService.getSummary(query, req.user);
  sendSuccess(res, data, 'Calendar summary');
});

export const reschedule = asyncHandler(async (req, res) => {
  const body = calendarRescheduleSchema.parse(req.body);
  const data = await calendarService.reschedule(req.params.id, body, req.user, req);
  sendSuccess(res, data, 'Event rescheduled');
});

export const complete = asyncHandler(async (req, res) => {
  const data = await calendarService.complete(req.params.id, req.user, req);
  sendSuccess(res, data, 'Event completed');
});

export const assign = asyncHandler(async (req, res) => {
  const body = calendarAssignSchema.parse(req.body);
  const data = await calendarService.assign(req.params.id, body.assignedToId, req.user, req);
  sendSuccess(res, data, 'Event assigned');
});
