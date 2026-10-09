import { Router } from 'express';
import { fetchBill, getOperators } from '../controllers/billController.js';

const router = Router();

// POST /api/bills/fetch — Fetch bill by consumer number and utility type
router.post('/fetch', fetchBill);

// GET /api/bills/operators — List supported electricity and water operators
router.get('/operators', getOperators);

export default router;
