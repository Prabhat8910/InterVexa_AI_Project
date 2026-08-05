import { Router } from 'express';
import { getUniversityAnalytics, getUniversityStudents } from '../controllers/university.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
const router = Router();
router.get('/analytics', authenticate, authorize('university', 'admin'), getUniversityAnalytics);
router.get('/students', authenticate, authorize('university', 'admin'), getUniversityStudents);
export default router;
