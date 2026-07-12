import { Router } from 'express';
import { getStudentAnalytics } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/dashboard', authenticate as any, getStudentAnalytics as any);

export default router;
