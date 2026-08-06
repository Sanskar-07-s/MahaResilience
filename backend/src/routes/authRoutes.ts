import { Router } from 'express';
import { register, login, getProfile } from '../controllers/authController.js';
import { sendOtpController, verifyOtpController } from '../controllers/twilioOtpController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/send-otp', sendOtpController);
router.post('/verify-otp', verifyOtpController);
router.get('/profile', authenticate as any, getProfile as any);

export default router;
