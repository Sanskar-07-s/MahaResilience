import { Router } from 'express';
import { getNearbyShelters, getNearbyHospitals, createAlert, getActiveAlerts } from '../controllers/emergencyController.js';
import { sendSosController } from '../controllers/smsController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { Role } from '@prisma/client';

const router = Router();

router.get('/shelters', getNearbyShelters);
router.get('/hospitals', getNearbyHospitals);
router.get('/alerts', getActiveAlerts);

// SOS emergency dispatch (Twilio SMS + Brevo Email)
router.post('/sos', sendSosController);

// Official alert publishing endpoint
router.post('/alerts', authenticate as any, authorize([Role.OFFICIAL, Role.ADMIN]) as any, createAlert as any);

export default router;
