import { API } from '../../../config/api';
import { apiGet, apiPatch, apiPost } from '../../../api/apiClient';

export const calendarApi = {
  getEvents: (params) => apiGet(API.CALENDAR_EVENTS, params).then((r) => r.data),
  getSummary: (params) => apiGet(API.CALENDAR_SUMMARY, params).then((r) => r.data),
  reschedule: (id, body) => apiPatch(API.CALENDAR_EVENT_RESCHEDULE(id), body).then((r) => r.data),
  complete: (id) => apiPatch(API.CALENDAR_EVENT_COMPLETE(id), {}).then((r) => r.data),
  assign: (id, assignedToId) => apiPatch(API.CALENDAR_EVENT_ASSIGN(id), { assignedToId }).then((r) => r.data),
  searchEnquiries: (query) => apiGet(API.CALENDAR_ENQUIRY_SEARCH, { q: query }).then((r) => r.data),
  createFollowup: (enquiryId, body) => apiPost(API.CALENDAR_ENQUIRY_FOLLOWUPS(enquiryId), body).then((r) => r.data),
  createAppointment: (enquiryId, body) => apiPost(API.CALENDAR_ENQUIRY_APPOINTMENTS(enquiryId), body).then((r) => r.data),
};
