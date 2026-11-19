import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import * as taskController from './task.controller.js';

const router = Router();

router.use(authenticate);

router.post('/', taskController.createTask);
router.get('/', taskController.getTasks);
router.get('/stats', taskController.getTaskStats);
router.get('/:id', taskController.getTaskById);
router.patch('/:id', taskController.updateTask);
router.patch('/:id/complete', taskController.completeTask);
router.patch('/:id/reassign', taskController.reassignTask);
router.post('/:id/comments', taskController.addComment);
router.delete('/:id', taskController.deleteTask);

export default router;

