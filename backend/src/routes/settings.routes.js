import { Router } from 'express';
import {
    getSettings,
    updateProfile,
    changePassword,
    uploadAvatar,
    updateNotifications,
    deleteAccount
} from '../controllers/settings.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// All settings routes require a valid JWT
router.use(authenticate);

router.get('/',                  getSettings);
router.patch('/profile',         updateProfile);
router.patch('/password',        changePassword);
router.post('/avatar',           uploadAvatar);
router.patch('/notifications',   updateNotifications);
router.delete('/account',        deleteAccount);

export default router;
