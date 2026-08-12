import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  resolveIdentity,
  getMyQueue,
  getBranchOps,
  updatePresence,
  heartbeat,
  acceptOffer,
  rejectOffer,
  startSession,
  completeSession,
  reassign,
} from './assignment.controller.js';
import {
  presenceUpdateSchema,
  offerResponseSchema,
  reassignSchema,
} from './assignment.validators.js';

const router = Router();
router.use(authenticate);

router.get('/resolve-identity', resolveIdentity);
router.get('/my-queue', getMyQueue);
router.get('/branch-ops', getBranchOps);

router.patch('/presence', validate(presenceUpdateSchema), updatePresence);
router.post('/heartbeat', heartbeat);

router.post('/offers/:id/accept', acceptOffer);
router.post('/offers/:id/reject', validate(offerResponseSchema), rejectOffer);

router.post('/sessions/:leadId/start', startSession);
router.post('/sessions/:leadId/complete', completeSession);

router.post(
  '/leads/:leadId/reassign',
  authorize('reception.walkin.assign'),
  validate(reassignSchema),
  reassign,
);

export default router;
