import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  resolveIdentity,
  updatePresence,
  getMyAvailability,
  heartbeat,
  goOffline,
  acceptOffer,
  rejectOffer,
  startSession,
  completeSession,
  reassign,
  getConfig,
  updateConfig,
  getUnassigned,
  recommendForEnquiry,
  autoAssignEnquiry,
  bulkAutoAssign,
  manualAssignEnquiry,
  enquiryAssignmentHistory,
  temporaryOverride,
  getMySla,
  getSlaOverview,
} from './assignment.controller.js';
import {
  presenceUpdateSchema,
  offerResponseSchema,
  reassignSchema,
  manualAssignSchema,
  bulkAutoAssignSchema,
  assignmentConfigSchema,
  temporaryOverrideSchema,
} from './assignment.validators.js';
import {
  listCourseCounsellorMappings,
  createCourseCounsellorMapping,
  updateCourseCounsellorMapping,
  deleteCourseCounsellorMapping,
  resolveCourseCounsellor,
} from './courseCounsellorMapping.controller.js';
import {
  courseCounsellorMappingCreateSchema,
  courseCounsellorMappingUpdateSchema,
} from './courseCounsellorMapping.validators.js';

const router = Router();
router.use(authenticate);

router.get('/resolve-identity', resolveIdentity);

router.get('/config', authorize('settings.view', 'masters.view'), getConfig);
router.put('/config', authorize('settings.manage', 'masters.manage'), validate(assignmentConfigSchema), updateConfig);

router.get(
  '/course-counsellor-mappings',
  authorize('settings.view', 'masters.view'),
  listCourseCounsellorMappings,
);
router.post(
  '/course-counsellor-mappings',
  authorize('settings.manage', 'masters.manage'),
  validate(courseCounsellorMappingCreateSchema),
  createCourseCounsellorMapping,
);
router.patch(
  '/course-counsellor-mappings/:id',
  authorize('settings.manage', 'masters.manage'),
  validate(courseCounsellorMappingUpdateSchema),
  updateCourseCounsellorMapping,
);
router.delete(
  '/course-counsellor-mappings/:id',
  authorize('settings.manage', 'masters.manage'),
  deleteCourseCounsellorMapping,
);
router.get(
  '/course-counsellor/resolve',
  authorize('enquiry.view', 'enquiry.create', 'enquiry.update', 'reception.walkin.create', 'masters.view'),
  resolveCourseCounsellor,
);

router.get('/unassigned-enquiries', authorize('enquiry.view', 'enquiry.assign'), getUnassigned);
router.get('/enquiries/:enquiryId/recommend', authorize('enquiry.view', 'enquiry.assign'), recommendForEnquiry);
router.post('/enquiries/:enquiryId/auto-assign', authorize('enquiry.assign'), autoAssignEnquiry);
router.post('/enquiries/:enquiryId/assign', authorize('enquiry.assign'), validate(manualAssignSchema), manualAssignEnquiry);
router.post('/enquiries/bulk-auto-assign', authorize('enquiry.assign', 'enquiry.bulk'), validate(bulkAutoAssignSchema), bulkAutoAssign);
router.get('/enquiries/:enquiryId/history', authorize('enquiry.view', 'enquiry.assign'), enquiryAssignmentHistory);

router.get('/sla/my', getMySla);
router.get('/sla/overview', authorize('reports.view', 'enquiry.view', 'settings.view'), getSlaOverview);

router.get('/my-availability', getMyAvailability);
router.patch('/presence', validate(presenceUpdateSchema), updatePresence);
router.post('/heartbeat', heartbeat);
router.post('/go-offline', goOffline);
router.post('/temporary-override', validate(temporaryOverrideSchema), temporaryOverride);

router.post('/offers/:id/accept', acceptOffer);
router.post('/offers/:id/reject', validate(offerResponseSchema), rejectOffer);

router.post('/sessions/:leadId/start', startSession);
router.post('/sessions/:leadId/complete', completeSession);

router.post(
  '/leads/:leadId/reassign',
  authorize('reception.walkin.assign', 'enquiry.assign'),
  validate(reassignSchema),
  reassign,
);

export default router;
