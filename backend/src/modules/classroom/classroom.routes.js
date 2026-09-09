import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import * as ctrl from './classroom.controller.js';

const router = Router();
const view = authorize(PERMISSIONS.ATTENDANCE_VIEW, PERMISSIONS.STUDENTS_VIEW);
const manage = authorize(PERMISSIONS.ATTENDANCE_MARK, PERMISSIONS.ATTENDANCE_EDIT);

router.use(authenticate);

router.get('/assignments', view, ctrl.listAssignments);
router.post('/assignments', manage, ctrl.createAssignment);
router.get('/assignments/:id', view, ctrl.getAssignment);
router.put('/assignments/:id', manage, ctrl.updateAssignment);
router.delete('/assignments/:id', manage, ctrl.deleteAssignment);
router.post('/assignments/:id/submit', view, ctrl.submitAssignment);
router.put('/assignments/:id/submissions/:submissionId', manage, ctrl.reviewSubmission);

router.get('/tests', view, ctrl.listTests);
router.post('/tests', manage, ctrl.createTest);
router.get('/tests/:id', view, ctrl.getTest);
router.put('/tests/:id', manage, ctrl.updateTest);
router.delete('/tests/:id', manage, ctrl.deleteTest);
router.put('/tests/:id/results', manage, ctrl.saveTestResults);

router.get('/materials', view, ctrl.listMaterials);
router.post('/materials', manage, ctrl.createMaterial);
router.get('/materials/:id', view, ctrl.getMaterial);
router.put('/materials/:id', manage, ctrl.updateMaterial);
router.delete('/materials/:id', manage, ctrl.deleteMaterial);

router.get('/students/:studentId/remarks', view, ctrl.listRemarks);
router.post('/students/:studentId/remarks', manage, ctrl.addRemark);

router.get('/performance', view, ctrl.performanceSummary);

export default router;
