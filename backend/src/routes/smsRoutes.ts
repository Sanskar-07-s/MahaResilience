import { Router } from 'express';
import {
  sendSmsController,
  sendSosController,
  sendOtpController,
  verifyOtpController
} from '../controllers/smsController.js';

const router = Router();

router.post('/send', sendSmsController);
router.post('/sos', sendSosController);
router.post('/otp', sendOtpController);
router.post('/otp/verify', verifyOtpController);

export default router;
