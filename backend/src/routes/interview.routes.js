import { Router } from 'express';
import { startInterview, getSession, getReport, downloadReportPDF } from '../controllers/interview.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
const router = Router();
router.post('/start', authenticate, startInterview);
router.get('/session/:id', authenticate, getSession);
router.get('/report/:id', authenticate, getReport);
router.get('/report/:id/pdf', authenticate, downloadReportPDF);
export default router;
