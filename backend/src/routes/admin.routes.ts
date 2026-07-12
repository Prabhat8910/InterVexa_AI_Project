import { Router } from 'express';
import { getUsers, deleteUser, getSystemLogs } from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/users', authenticate as any, authorize('admin') as any, getUsers as any);
router.delete('/user/:id', authenticate as any, authorize('admin') as any, deleteUser as any);
router.get('/logs', authenticate as any, authorize('admin') as any, getSystemLogs as any);

export default router;
