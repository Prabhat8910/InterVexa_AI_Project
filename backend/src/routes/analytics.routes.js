import { Router } from 'express';
import { getStudentAnalytics } from '../controllers/analytics.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
const router = Router();
router.get('/dashboard', authenticate, getStudentAnalytics);
export default router;
