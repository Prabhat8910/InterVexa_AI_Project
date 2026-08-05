import { Router } from 'express';
import { getRoadmap, generateRoadmap } from '../controllers/career.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
const router = Router();
router.get('/roadmap', authenticate, getRoadmap);
router.post('/roadmap', authenticate, generateRoadmap);
export default router;
