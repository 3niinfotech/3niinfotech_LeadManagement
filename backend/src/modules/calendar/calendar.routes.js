import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import * as calendarController from './calendar.controller.js';

const router = Router();

router.use(authenticate);

router.get('/events', authorize(PERMISSIONS.CALENDAR_VIEW), calendarController.getEvents);
router.get('/summary', authorize(PERMISSIONS.CALENDAR_VIEW), calendarController.getSummary);
router.get('/enquiries/search', authorize(PERMISSIONS.CALENDAR_CREATE), calendarController.searchEnquiries);
router.post('/enquiries/:enquiryId/followups', authorize(PERMISSIONS.CALENDAR_CREATE), calendarController.addFollowup);
router.post('/enquiries/:enquiryId/appointments', authorize(PERMISSIONS.CALENDAR_CREATE), calendarController.addAppointment);
router.patch('/events/:id/reschedule', authorize(PERMISSIONS.CALENDAR_RESCHEDULE, PERMISSIONS.CALENDAR_UPDATE), calendarController.reschedule);
router.patch('/events/:id/complete', authorize(PERMISSIONS.CALENDAR_COMPLETE, PERMISSIONS.CALENDAR_UPDATE), calendarController.complete);
router.patch('/events/:id/assign', authorize(PERMISSIONS.CALENDAR_ASSIGN), calendarController.assign);

export default router;
