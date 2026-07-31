import { Router } from 'express';
import { getDisasterAlerts } from '../controllers/alertController.js';

const router = Router();

router.get('/', getDisasterAlerts);

export default router;
