import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import studentRoutes from '../modules/student/student.routes.js';
import leadRoutes from '../modules/lead/lead.routes.js';
import dashboardRoutes from '../modules/dashboard/dashboard.routes.js';
import notificationRoutes from '../modules/notification/notification.routes.js';
import searchRoutes from '../modules/search/search.routes.js';
import enquiryRoutes from '../modules/enquiry/enquiry.routes.js';
import userRoutes from '../modules/user/user.routes.js';
import rbacRoutes from '../modules/rbac/role.routes.js';
import reportsRoutes from '../modules/reports/reports.routes.js';
import walkinRoutes from '../modules/walkin/walkin.routes.js';
import assignmentRoutes from '../modules/assignment/assignment.routes.js';
import featureRoutes from '../modules/feature/feature.routes.js';
import masterRoutes from '../modules/master/master.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/students', studentRoutes);
router.use('/leads', leadRoutes);
router.use('/walk-ins', walkinRoutes);
router.use('/assignment', assignmentRoutes);
router.use('/features', featureRoutes);
router.use('/masters', masterRoutes);
router.use('/enquiries', enquiryRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);
router.use('/search', searchRoutes);
router.use('/rbac', rbacRoutes);
router.use('/reports', reportsRoutes);

export default router;
