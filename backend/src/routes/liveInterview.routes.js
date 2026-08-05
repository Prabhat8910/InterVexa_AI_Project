import { Router } from 'express';
import { createLiveRoom, joinLiveRoom, endLiveRoom, getLiveSession } from '../controllers/liveInterview.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
const router = Router();
router.post('/create', authenticate, createLiveRoom);
router.post('/join', authenticate, joinLiveRoom);
router.post('/end', authenticate, endLiveRoom);
router.get('/session/:id', authenticate, getLiveSession);
export default router;
