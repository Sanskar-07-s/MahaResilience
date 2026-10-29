import { Router } from 'express';
import {
  getOperatorsAndCircles,
  lookupMobile,
  getPlans,
  createRechargeOrder,
  verifyPaymentAndFulfillRecharge,
  checkRechargeStatus,
  getRechargeHistory,
  handlePaymentWebhook,
} from '../controllers/rechargeController.js';

const router = Router();

// Retrieve supported operators and telecom circles
router.get('/operators', getOperatorsAndCircles);

// Auto-detect circle & operator from 10-digit Indian phone number
router.post('/lookup', lookupMobile);

// Browse prepaid recharge plans with category filtering
router.get('/plans', getPlans);

// Create pending recharge order and initiate UPI payment gateway order
router.post('/order', createRechargeOrder);

// Verify payment signature and fulfill operator recharge
router.post('/verify', verifyPaymentAndFulfillRecharge);

// Check transaction status (polling)
router.get('/status/:transactionReference', checkRechargeStatus);

// Retrieve recharge order history
router.get('/history', getRechargeHistory);

// Payment Gateway Webhook
router.post('/webhook', handlePaymentWebhook);

export default router;

