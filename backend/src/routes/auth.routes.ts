import { Router } from 'express';
import { register, login, getMe, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { validateRegister, validateLogin, validateForgotPassword, validateResetPassword } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/me', authenticate as any, getMe as any);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/reset-password/:token', validateResetPassword, resetPassword);

export default router;
