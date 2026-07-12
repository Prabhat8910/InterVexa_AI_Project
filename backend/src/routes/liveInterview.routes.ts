import { Router } from 'express';
import { 
  createLiveRoom, 
  joinLiveRoom, 
  endLiveRoom, 
  getLiveSession
} from '../controllers/liveInterview.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/create', authenticate as any, createLiveRoom as any);
router.post('/join', authenticate as any, joinLiveRoom as any);
router.post('/end', authenticate as any, endLiveRoom as any);
router.get('/session/:id', authenticate as any, getLiveSession as any);

export default router;
