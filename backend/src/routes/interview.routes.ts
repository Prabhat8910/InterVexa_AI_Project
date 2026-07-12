import { Router } from 'express';
import { 
  startInterview, 
  getSession, 
  getReport, 
  downloadReportPDF
} from '../controllers/interview.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/start', authenticate as any, startInterview as any);
router.get('/session/:id', authenticate as any, getSession as any);
router.get('/report/:id', authenticate as any, getReport as any);
router.get('/report/:id/pdf', authenticate as any, downloadReportPDF as any);

export default router;
