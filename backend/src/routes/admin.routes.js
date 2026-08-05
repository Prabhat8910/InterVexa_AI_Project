import { Router } from 'express';
import { getUsers, deleteUser, getSystemLogs } from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
const router = Router();
router.get('/users', authenticate, authorize('admin'), getUsers);
router.delete('/user/:id', authenticate, authorize('admin'), deleteUser);
router.get('/logs', authenticate, authorize('admin'), getSystemLogs);
export default router;
