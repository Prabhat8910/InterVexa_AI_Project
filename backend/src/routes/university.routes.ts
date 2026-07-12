import { Router } from 'express';
import { getUniversityAnalytics, getUniversityStudents } from '../controllers/university.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/analytics', authenticate as any, authorize('university', 'admin') as any, getUniversityAnalytics as any);
router.get('/students', authenticate as any, authorize('university', 'admin') as any, getUniversityStudents as any);

export default router;
