import { Router } from 'express';
import { getCandidates, getCandidateReport } from '../controllers/recruiter.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
const router = Router();
router.get('/candidates', authenticate, authorize('recruiter', 'admin'), getCandidates);
router.get('/candidate/:id/report', authenticate, authorize('recruiter', 'admin'), getCandidateReport);
export default router;
