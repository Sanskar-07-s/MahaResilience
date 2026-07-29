import { Router } from 'express';
import { getSchemes, createScheme, checkEligibility } from '../controllers/schemeController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', getSchemes);
router.post('/check-eligibility', checkEligibility);

// Admin-only creation endpoint
router.post('/', authenticate as any, authorize([Role.ADMIN]) as any, createScheme as any);

export default router;
