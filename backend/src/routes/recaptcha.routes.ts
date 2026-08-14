import { Router } from 'express';
import { verifyRecaptchaToken } from '../controllers/recaptcha.controller';

const router = Router();

router.post('/verify', verifyRecaptchaToken);

export default router;
