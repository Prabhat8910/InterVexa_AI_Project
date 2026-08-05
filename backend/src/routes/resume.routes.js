import { Router } from 'express';
import multer from 'multer';
import { analyzeResume } from '../controllers/resume.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
const router = Router();
// Configure multer memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // limit size to 5MB
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        }
        else {
            cb(new Error('Only PDF documents are allowed.'));
        }
    }
});
router.post('/analyze', authenticate, upload.single('file'), analyzeResume);
export default router;
