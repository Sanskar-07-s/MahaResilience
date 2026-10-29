import { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { PrismaClient, RechargeStatus } from '@prisma/client';
import { getPaymentGateway } from '../services/paymentGatewayService.js';
import { getRechargeProvider, RechargePlan } from '../services/rechargeProviderService.js';
import { sendRechargeReceiptEmail } from '../services/brevoEmailService.js';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'maharesilience-secret-session-key-2026-auth';

// Memory fallback store for resilient local development / testing when PostgreSQL is offline
interface RechargeOrderMemory {
  id: string;
  transactionId: string;
  idempotencyKey: string;
  userId?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  mobileNumber: string;
  operator: string;
  operatorCircle: string;
  planId: string;
  planType: string;
  amount: number;
  talktime?: string | null;
  validity: string;
  dataBenefit?: string | null;
  smsBenefit?: string | null;
  description?: string | null;
  paymentGateway: string;
  paymentOrderId?: string | null;
  paymentId?: string | null;
  paymentSignature?: string | null;
  paymentStatus: string;
  paymentAmount?: number | null;
  rechargeProvider: string;
  providerReference?: string | null;
  providerOperatorRef?: string | null;
  providerResponseMsg?: string | null;
  status: RechargeStatus;
  refundId?: string | null;
  refundStatus?: string | null;
  refundAmount?: number | null;
  failureReason?: string | null;
  receiptSent?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const inMemoryOrders = new Map<string, RechargeOrderMemory>();

/**
 * Extract authenticated user if present in Authorization header
 */
const extractOptionalUser = (req: Request): { id: string; email: string; name: string } | null => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded && decoded.id) {
        return {
          id: decoded.id,
          email: decoded.email || '',
          name: decoded.name || 'Citizen',
        };
      }
    }
  } catch {
    // Optional auth - gracefully ignore invalid token
  }
  return null;
};

/**
 * Mask phone number for security and privacy (e.g. +91 98*****816)
 */
export const maskPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.substring(0, 2)}XXXXX${cleaned.substring(7)}`;
  }
  return phone;
};

/**
 * GET /api/recharge/operators
 * Retrieve supported operators and telecom circles
 */
export const getOperatorsAndCircles = async (req: Request, res: Response) => {
  try {
    const provider = getRechargeProvider();
    const [operators, circles] = await Promise.all([
      provider.getOperators(),
      provider.getCircles(),
    ]);

    return res.status(200).json({
      success: true,
      operators,
      circles,
    });
  } catch (error: any) {
    console.error('[RechargeController] Error fetching operators:', error);
    return res.status(500).json({
      success: false,
      error: 'Unable to retrieve operator list from telecom provider.',
    });
  }
};

/**
 * POST /api/recharge/lookup
 * Auto-detect operator and circle from 10-digit Indian mobile number
 */
export const lookupMobile = async (req: Request, res: Response) => {
  try {
    const { mobileNumber } = req.body;

    if (!mobileNumber || !/^[6-9]\d{9}$/.test(String(mobileNumber).trim())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid mobile number. Please provide a valid 10-digit Indian prepaid number starting with 6, 7, 8, or 9.',
      });
    }

    const provider = getRechargeProvider();
    const detected = await provider.lookupOperatorAndCircle(String(mobileNumber).trim());
    const circles = await provider.getCircles();
    const circleInfo = circles.find(c => c.id === detected.circle);

    return res.status(200).json({
      success: true,
      mobileNumber: String(mobileNumber).trim(),
      operator: detected.operator,
      circle: detected.circle,
      circleName: circleInfo?.name || detected.circle,
    });
  } catch (error: any) {
    console.error('[RechargeController] Mobile lookup error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to look up mobile number circle and operator.',
    });
  }
};

/**
 * GET /api/recharge/plans
 * Retrieve prepaid plans filtered by operator, circle, and optional category
 */
export const getPlans = async (req: Request, res: Response) => {
  try {
    const operator = String(req.query.operator || 'JIO').toUpperCase();
    const circle = String(req.query.circle || 'MAHARASHTRA_GOA').toUpperCase();
    const category = req.query.category ? String(req.query.category).toUpperCase() : undefined;

    const provider = getRechargeProvider();
    const plans = await provider.getPlans(operator, circle, category);

    // Group summary categories for UI tabs
    const categories = [
      { id: 'ALL', name: 'All Plans', count: plans.length },
      { id: 'TRULY_UNLIMITED', name: 'Truly Unlimited', count: plans.filter(p => p.category === 'TRULY_UNLIMITED').length },
      { id: 'DATA_ADDON', name: 'Data Add-on', count: plans.filter(p => p.category === 'DATA_ADDON').length },
      { id: 'SMART_VALIDITY', name: 'Smart Validity', count: plans.filter(p => p.category === 'SMART_VALIDITY').length },
      { id: 'ENTERTAINMENT_OTT', name: 'Entertainment & OTT', count: plans.filter(p => p.category === 'ENTERTAINMENT_OTT').length },
      { id: 'ANNUAL', name: 'Annual Plans (365 Days)', count: plans.filter(p => p.category === 'ANNUAL').length },
    ];

    return res.status(200).json({
      success: true,
      operator,
      circle,
      totalPlans: plans.length,
      categories,
      plans,
    });
  } catch (error: any) {
    console.error('[RechargeController] Error fetching plans:', error);
    return res.status(500).json({
      success: false,
      error: 'Unable to retrieve plans for the selected operator and circle.',
    });
  }
};

/**
 * POST /api/recharge/order
 * Create a pending recharge order and initiate UPI payment gateway order
 */
export const createRechargeOrder = async (req: Request, res: Response) => {
  try {
    const {
      mobileNumber,
      operator,
      circle,
      planId,
      amount,
      idempotencyKey,
      customerEmail,
      customerName,
    } = req.body;

    const cleanPhone = String(mobileNumber || '').trim();
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid 10-digit Indian mobile number. Number must start with 6, 7, 8, or 9.',
      });
    }

    if (!operator || !circle || !planId || !amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required recharge parameters: mobileNumber, operator, circle, planId, and amount are mandatory.',
      });
    }

    const provider = getRechargeProvider();
    const plans = await provider.getPlans(operator.toUpperCase(), circle.toUpperCase());
    const selectedPlan = plans.find(p => p.id === planId) || {
      id: planId,
      operator: operator.toUpperCase(),
      circle: circle.toUpperCase(),
      price: Number(amount),
      validity: '28 Days',
      data: '1.5 GB/day',
      calling: 'Unlimited Calls',
      sms: '100 SMS/day',
      category: 'TRULY_UNLIMITED' as const,
      description: `Standard ₹${amount} Recharge Pack`,
    };

    // Prevent duplicate submission with idempotency key
    const generatedIdempotencyKey = idempotencyKey || `idem_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    for (const order of inMemoryOrders.values()) {
      if (order.idempotencyKey === generatedIdempotencyKey && order.status !== RechargeStatus.PAYMENT_FAILED) {
        return res.status(200).json({
          success: true,
          isDuplicate: true,
          orderId: order.id,
          transactionReference: order.transactionId,
          transactionId: order.transactionId,
          gatewayOrderId: order.paymentOrderId,
          amount: order.amount,
          status: order.status,
          message: 'Reusing existing pending order for this idempotency key.',
        });
      }
    }

    const authenticatedUser = extractOptionalUser(req);
    const userId = authenticatedUser?.id || null;
    const userEmail = customerEmail || authenticatedUser?.email || 'citizen@maharesilience.org';
    const userName = customerName || authenticatedUser?.name || 'Maha Citizen';

    const timestamp = Date.now();
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const transactionId = `MR-REC-${timestamp}-${randomHex}`;

    const paymentGateway = getPaymentGateway();
    const gatewayOrder = await paymentGateway.createOrder({
      amountInRupees: Number(amount),
      transactionId,
      description: `MahaResilience ${operator} Mobile Recharge for +91 ${maskPhoneNumber(cleanPhone)}`,
      customer: {
        name: userName,
        email: userEmail,
        phone: cleanPhone,
      },
      notes: {
        operator: operator.toUpperCase(),
        circle: circle.toUpperCase(),
        planId,
        mobileNumber: cleanPhone,
      },
    });

    const orderId = `ord_rec_${timestamp}_${randomHex}`;
    const newOrder: RechargeOrderMemory = {
      id: orderId,
      transactionId,
      idempotencyKey: generatedIdempotencyKey,
      userId,
      userEmail,
      userName,
      mobileNumber: cleanPhone,
      operator: operator.toUpperCase(),
      operatorCircle: circle.toUpperCase(),
      planId,
      planType: selectedPlan.category,
      amount: Number(amount),
      talktime: selectedPlan.calling,
      validity: selectedPlan.validity,
      dataBenefit: selectedPlan.data,
      smsBenefit: selectedPlan.sms,
      description: selectedPlan.description,
      paymentGateway: gatewayOrder.provider,
      paymentOrderId: gatewayOrder.orderId,
      paymentId: null,
      paymentSignature: null,
      paymentStatus: 'PENDING',
      paymentAmount: Number(amount),
      rechargeProvider: 'TELECOM_API',
      providerReference: null,
      providerOperatorRef: null,
      providerResponseMsg: null,
      status: RechargeStatus.PAYMENT_PENDING,
      refundId: null,
      refundStatus: null,
      refundAmount: null,
      failureReason: null,
      receiptSent: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    inMemoryOrders.set(orderId, newOrder);
    inMemoryOrders.set(transactionId, newOrder);

    // Save to PostgreSQL if available
    try {
      await prisma.rechargeOrder.create({
        data: {
          id: orderId,
          transactionId,
          idempotencyKey: generatedIdempotencyKey,
          userId: userId || undefined,
          mobileNumber: cleanPhone,
          operator: operator.toUpperCase(),
          operatorCircle: circle.toUpperCase(),
          planId,
          planType: selectedPlan.category,
          amount: Number(amount),
          talktime: selectedPlan.calling,
          validity: selectedPlan.validity,
          dataBenefit: selectedPlan.data,
          smsBenefit: selectedPlan.sms,
          description: selectedPlan.description,
          paymentGateway: gatewayOrder.provider,
          paymentOrderId: gatewayOrder.orderId,
          paymentStatus: 'PENDING',
          paymentAmount: Number(amount),
          status: RechargeStatus.PAYMENT_PENDING,
        },
      });
    } catch (dbErr: any) {
      console.warn('[RechargeController] Database write skipped or fallback used:', dbErr.message);
    }

    return res.status(201).json({
      success: true,
      orderId,
      transactionId,
      transactionReference: transactionId,
      amount: Number(amount),
      currency: 'INR',
      status: RechargeStatus.PAYMENT_PENDING,
      gatewayOrder: {
        orderId: gatewayOrder.orderId,
        amount: gatewayOrder.amount,
        amountInRupees: gatewayOrder.amountInRupees,
        currency: gatewayOrder.currency,
        keyId: gatewayOrder.keyId,
        provider: gatewayOrder.provider,
        upiIntentSupported: gatewayOrder.upiIntentSupported,
      },
      plan: {
        id: selectedPlan.id,
        price: selectedPlan.price,
        validity: selectedPlan.validity,
        data: selectedPlan.data,
        calling: selectedPlan.calling,
        sms: selectedPlan.sms,
        description: selectedPlan.description,
      },
    });
  } catch (error: any) {
    console.error('[RechargeController] Create order error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to initiate recharge and payment order.',
    });
  }
};

/**
 * POST /api/recharge/verify
 * Verify payment signature from gateway and fulfill telecom recharge
 */
export const verifyPaymentAndFulfillRecharge = async (req: Request, res: Response) => {
  try {
    const {
      orderId,
      transactionId,
      transactionReference,
      gatewayOrderId,
      gatewayPaymentId,
      gatewaySignature,
      paymentMethod = 'UPI',
    } = req.body;

    const targetTx = transactionId || transactionReference;

    if (!orderId && !targetTx) {
      return res.status(400).json({
        success: false,
        error: 'Either orderId or transactionReference/transactionId is required for payment verification.',
      });
    }

    let order: RechargeOrderMemory | null = null;
    if (orderId && inMemoryOrders.has(orderId)) {
      order = inMemoryOrders.get(orderId)!;
    } else if (targetTx && inMemoryOrders.has(targetTx)) {
      order = inMemoryOrders.get(targetTx)!;
    }

    if (!order) {
      try {
        const dbOrder = await prisma.rechargeOrder.findFirst({
          where: {
            OR: [
              ...(orderId ? [{ id: orderId }] : []),
              ...(targetTx ? [{ transactionId: targetTx }] : []),
            ],
          },
        });
        if (dbOrder) {
          order = {
            ...dbOrder,
            createdAt: dbOrder.createdAt,
            updatedAt: dbOrder.updatedAt,
          } as unknown as RechargeOrderMemory;
          inMemoryOrders.set(order.id, order);
          inMemoryOrders.set(order.transactionId, order);
        }
      } catch (dbErr: any) {
        console.warn('[RechargeController] DB lookup error:', dbErr.message);
      }
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Recharge order record not found.',
      });
    }

    if (order.status === RechargeStatus.SUCCESS) {
      return res.status(200).json({
        success: true,
        alreadyProcessed: true,
        status: RechargeStatus.SUCCESS,
        transactionReference: order.transactionId,
        transactionId: order.transactionId,
        operatorReference: order.providerOperatorRef,
        message: 'Recharge was already fulfilled successfully.',
      });
    }

    // 1. Verify Payment via Payment Gateway
    const paymentGateway = getPaymentGateway();
    const targetGatewayOrderId = gatewayOrderId || order.paymentOrderId || '';
    const verification = await paymentGateway.verifyPayment({
      orderId: targetGatewayOrderId,
      paymentId: gatewayPaymentId || `pay_mock_${Date.now()}`,
      signature: gatewaySignature || 'test_signature',
    });

    if (!verification.verified) {
      order.status = RechargeStatus.PAYMENT_FAILED;
      order.failureReason = verification.error || 'Signature verification failed';
      order.updatedAt = new Date();

      try {
        await prisma.rechargeOrder.update({
          where: { id: order.id },
          data: {
            status: RechargeStatus.PAYMENT_FAILED,
            failureReason: order.failureReason,
            paymentStatus: 'FAILED',
          },
        });
      } catch {}

      return res.status(400).json({
        success: false,
        status: RechargeStatus.PAYMENT_FAILED,
        error: verification.error || 'Payment signature verification failed. Recharge not initiated.',
      });
    }

    // Update state to PAYMENT_VERIFIED -> RECHARGE_PENDING
    order.status = RechargeStatus.RECHARGE_PENDING;
    order.paymentId = verification.paymentId;
    order.paymentSignature = gatewaySignature;
    order.paymentStatus = 'SUCCESS';
    order.updatedAt = new Date();

    // 2. Fulfill Recharge with Telecom Provider
    const rechargeProvider = getRechargeProvider();
    const rechargeResult = await rechargeProvider.initiateRecharge({
      transactionReference: order.transactionId,
      mobileNumber: order.mobileNumber,
      operator: order.operator,
      circle: order.operatorCircle,
      planId: order.planId,
      amount: order.amount,
    });

    if (!rechargeResult.success) {
      order.status = RechargeStatus.REFUND_INITIATED;
      order.failureReason = rechargeResult.message;
      order.updatedAt = new Date();

      console.warn(`[RechargeController] Recharge failed for ${order.transactionId}. Initiating auto-refund...`);
      const refundResult = await paymentGateway.processRefund({
        paymentId: verification.paymentId,
        amountInRupees: order.amount,
        reason: rechargeResult.message || 'Telecom operator failed to credit recharge pack.',
        idempotencyKey: `rfnd_${order.transactionId}`,
      });

      if (refundResult.success) {
        order.status = RechargeStatus.REFUND_COMPLETED;
        order.refundId = refundResult.refundId;
        order.refundStatus = 'COMPLETED';
        order.refundAmount = order.amount;
      } else {
        order.status = RechargeStatus.RECHARGE_FAILED;
      }

      try {
        await prisma.rechargeOrder.update({
          where: { id: order.id },
          data: {
            status: order.status,
            refundId: order.refundId,
            refundStatus: order.refundStatus,
            refundAmount: order.refundAmount,
            failureReason: order.failureReason,
          },
        });
      } catch {}

      return res.status(400).json({
        success: false,
        status: order.status,
        refundInitiated: true,
        refundId: order.refundId,
        error: rechargeResult.message,
        message: 'Operator rejected recharge. Full amount has been refunded to your source UPI account.',
      });
    }

    // 3. Recharge Success! Update state
    order.status = RechargeStatus.SUCCESS;
    order.providerReference = rechargeResult.providerReference;
    order.providerOperatorRef = rechargeResult.operatorReference || rechargeResult.providerReference;
    order.updatedAt = new Date();

    try {
      await prisma.rechargeOrder.update({
        where: { id: order.id },
        data: {
          status: RechargeStatus.SUCCESS,
          paymentId: verification.paymentId,
          providerReference: order.providerReference,
          providerOperatorRef: order.providerOperatorRef,
          rechargeCompletedAt: new Date(),
        },
      });
    } catch {}

    // 4. Dispatch Email Receipt asynchronously
    const targetEmail = order.userEmail || 'citizen@maharesilience.org';
    const targetName = order.userName || 'Maha Citizen';
    const paymentDateStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    sendRechargeReceiptEmail({
      toEmail: targetEmail,
      toName: targetName,
      mobileNumber: order.mobileNumber,
      operatorName: order.operator,
      circleName: order.operatorCircle,
      planDescription: order.description || `Prepaid Plan ₹${order.amount}`,
      validity: order.validity || '28 Days',
      dataBenefit: order.dataBenefit || '1.5 GB/day',
      callingBenefit: order.talktime || 'Unlimited Calls & 100 SMS/Day',
      amountPaid: order.amount,
      transactionId: order.transactionId,
      operatorRef: order.providerOperatorRef || undefined,
      paymentMethod: paymentMethod.toUpperCase(),
      paymentDate: paymentDateStr,
    }).then(sent => {
      if (sent) {
        order!.receiptSent = true;
      }
    }).catch(err => {
      console.error('[RechargeController] Non-fatal email receipt error:', err.message);
    });

    return res.status(200).json({
      success: true,
      status: RechargeStatus.SUCCESS,
      orderId: order.id,
      transactionReference: order.transactionId,
      transactionId: order.transactionId,
      operatorReference: order.providerOperatorRef,
      amount: order.amount,
      mobileNumber: maskPhoneNumber(order.mobileNumber),
      message: `${order.operator} recharge of ₹${order.amount} credited successfully!`,
      receiptEmailSent: true,
      receiptEmailAddress: targetEmail,
    });
  } catch (error: any) {
    console.error('[RechargeController] Payment verification error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Payment verification encountered an internal error.',
    });
  }
};

/**
 * GET /api/recharge/status/:transactionReference
 * Polling endpoint to check live status of an order
 */
export const checkRechargeStatus = async (req: Request, res: Response) => {
  try {
    const { transactionReference } = req.params;

    let order = inMemoryOrders.get(transactionReference);

    if (!order) {
      try {
        const dbOrder = await prisma.rechargeOrder.findFirst({
          where: {
            OR: [
              { transactionId: transactionReference },
              { id: transactionReference },
            ],
          },
        });
        if (dbOrder) {
          order = {
            ...dbOrder,
            createdAt: dbOrder.createdAt,
            updatedAt: dbOrder.updatedAt,
          } as unknown as RechargeOrderMemory;
        }
      } catch {}
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Recharge transaction not found.',
      });
    }

    return res.status(200).json({
      success: true,
      orderId: order.id,
      transactionId: order.transactionId,
      transactionReference: order.transactionId,
      mobileNumber: maskPhoneNumber(order.mobileNumber),
      operator: order.operator,
      circle: order.operatorCircle,
      amount: order.amount,
      status: order.status,
      operatorReference: order.providerOperatorRef,
      receiptSent: order.receiptSent,
      refundId: order.refundId,
      failureReason: order.failureReason,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    });
  } catch (error: any) {
    console.error('[RechargeController] Status check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Unable to check recharge transaction status.',
    });
  }
};

/**
 * GET /api/recharge/history
 * Fetch transaction history for authenticated user or recent mobile numbers
 */
export const getRechargeHistory = async (req: Request, res: Response) => {
  try {
    const user = extractOptionalUser(req);
    const filterPhone = req.query.phone ? String(req.query.phone).trim() : null;

    let history: RechargeOrderMemory[] = [];

    try {
      const whereClause: any = {};
      if (user && user.id) {
        whereClause.userId = user.id;
      } else if (filterPhone) {
        whereClause.mobileNumber = filterPhone;
      }

      const dbOrders = await prisma.rechargeOrder.findMany({
        where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      if (dbOrders && dbOrders.length > 0) {
        history = dbOrders as unknown as RechargeOrderMemory[];
      }
    } catch (dbErr: any) {
      console.warn('[RechargeController] History DB lookup fallback:', dbErr.message);
    }

    if (history.length === 0) {
      history = Array.from(inMemoryOrders.values())
        .filter((order, idx, arr) => arr.findIndex(o => o.transactionId === order.transactionId) === idx)
        .filter(order => {
          if (user && user.id && order.userId === user.id) return true;
          if (filterPhone && order.mobileNumber === filterPhone) return true;
          return !user && !filterPhone;
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 20);
    }

    const sanitizedHistory = history.map(item => ({
      id: item.id,
      transactionId: item.transactionId,
      transactionReference: item.transactionId,
      mobileNumber: maskPhoneNumber(item.mobileNumber),
      operator: item.operator,
      circle: item.operatorCircle,
      description: item.description,
      validity: item.validity,
      amount: item.amount,
      status: item.status,
      operatorRef: item.providerOperatorRef,
      paymentGateway: item.paymentGateway,
      receiptSent: item.receiptSent,
      createdAt: item.createdAt,
    }));

    return res.status(200).json({
      success: true,
      count: sanitizedHistory.length,
      history: sanitizedHistory,
    });
  } catch (error: any) {
    console.error('[RechargeController] Error fetching history:', error);
    return res.status(500).json({
      success: false,
      error: 'Unable to retrieve recharge transaction history.',
    });
  }
};

/**
 * POST /api/recharge/webhook
 * Webhook handler for payment gateway events
 */
export const handlePaymentWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const bodyStr = JSON.stringify(req.body);
    const paymentGateway = getPaymentGateway();

    if (signature && !paymentGateway.verifyWebhookSignature(bodyStr, signature)) {
      return res.status(400).json({ error: 'Invalid webhook signature.' });
    }

    const event = req.body.event;
    console.log(`[RechargeController] Received webhook event: ${event}`);

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('[RechargeController] Webhook processing error:', error);
    return res.status(500).json({ error: 'Webhook processing error.' });
  }
};
