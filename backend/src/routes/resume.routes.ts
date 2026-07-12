import { Router } from 'express';
import multer from 'multer';
import { analyzeResume } from '../controllers/resume.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Configure multer memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // limit size to 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF documents are allowed.'));
    }
  }
});

router.post('/analyze', authenticate as any, upload.single('file'), analyzeResume as any);

export default router;
