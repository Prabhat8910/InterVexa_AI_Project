import { Router } from 'express';
import { getCandidates, getCandidateReport } from '../controllers/recruiter.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/candidates', authenticate as any, authorize('recruiter', 'admin') as any, getCandidates as any);
router.get('/candidate/:id/report', authenticate as any, authorize('recruiter', 'admin') as any, getCandidateReport as any);

export default router;
