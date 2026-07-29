import { Router } from 'express';
import { getNearbyShelters, getNearbyHospitals, createAlert, getActiveAlerts, triggerSOS } from '../controllers/emergencyController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { Role } from '@prisma/client';

const router = Router();

router.get('/shelters', getNearbyShelters);
router.get('/hospitals', getNearbyHospitals);
router.get('/alerts', getActiveAlerts);

// Logged-in citizen SOS endpoint
router.post('/sos', authenticate as any, triggerSOS as any);

// Official alert publishing endpoint
router.post('/alerts', authenticate as any, authorize([Role.OFFICIAL, Role.ADMIN]) as any, createAlert as any);

export default router;
