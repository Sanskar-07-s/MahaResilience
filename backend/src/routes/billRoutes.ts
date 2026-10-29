import { Router } from 'express';
import { fetchBill, getOperators, processBillPaymentReceipt } from '../controllers/billController.js';

const router = Router();

// POST /api/bills/fetch — Fetch bill by consumer number and utility type
router.post('/fetch', fetchBill);

// GET /api/bills/operators — List supported electricity and water operators
router.get('/operators', getOperators);

// POST /api/bills/pay — Process payment and dispatch receipt email
router.post('/pay', processBillPaymentReceipt);

// POST /api/bills/send-receipt — Send receipt email for verified bill
router.post('/send-receipt', processBillPaymentReceipt);

export default router;
