import { Router } from 'express';
import {
  sendSmsController,
  sendSosController,
  sendOtpController,
  verifyOtpController,
  requestContactVerifyController,
  verifyContactController
} from '../controllers/smsController.js';

const router = Router();

router.post('/send', sendSmsController);
router.post('/sos', sendSosController);
router.post('/otp', sendOtpController);
router.post('/otp/verify', verifyOtpController);
router.post('/contact/request-verify', requestContactVerifyController);
router.post('/contact/verify', verifyContactController);

export default router;
