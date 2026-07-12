import { Router } from 'express';
import { getRoadmap, generateRoadmap } from '../controllers/career.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/roadmap', authenticate as any, getRoadmap as any);
router.post('/roadmap', authenticate as any, generateRoadmap as any);

export default router;
