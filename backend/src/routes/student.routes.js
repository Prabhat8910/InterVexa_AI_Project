import { Router } from 'express';
import { getProfile, updateProfile, getDashboard } from '../controllers/student.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
const router = Router();
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.get('/dashboard', authenticate, getDashboard);
export default router;
