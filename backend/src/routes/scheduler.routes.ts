import { Router } from 'express';
import { 
  scheduleInterview, 
  getInterviews, 
  getInterviewById, 
  updateInterview, 
  deleteInterview 
} from '../controllers/scheduler.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/schedule', authenticate as any, scheduleInterview as any);
router.get('/interviews', authenticate as any, getInterviews as any);
router.get('/interviews/:id', authenticate as any, getInterviewById as any);
router.put('/interviews/:id', authenticate as any, updateInterview as any);
router.delete('/interviews/:id', authenticate as any, deleteInterview as any);

export default router;
