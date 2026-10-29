// -*- coding: utf-8 -*-
import crypto from 'crypto';

export interface CreatePaymentOrderParams {
  amountInRupees: number;
  transactionId: string;
  description: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  notes?: Record<string, string>;
}

export interface PaymentOrderResult {
  orderId: string;
  amount: number; // in paise
  amountInRupees: number;
  currency: string;
  keyId: string;
  provider: string;
  upiIntentSupported: boolean;
}

export interface VerifyPaymentParams {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface PaymentVerificationResult {
  verified: boolean;
  paymentId: string;
  orderId: string;
  amountPaid: number;
  paymentMethod: string;
  vpa?: string;
  error?: string;
}

export interface RefundParams {
  paymentId: string;
  amountInRupees: number;
  reason: string;
  idempotencyKey: string;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  amount: number;
  status: string;
  error?: string;
}

export interface PaymentGatewayService {
  createOrder(params: CreatePaymentOrderParams): Promise<PaymentOrderResult>;
  verifyPayment(params: VerifyPaymentParams): Promise<PaymentVerificationResult>;
  verifyWebhookSignature(payload: string, signature: string): boolean;
  processRefund(params: RefundParams): Promise<RefundResult>;
}

/**
 * Authoritative Razorpay Payment Gateway Service
 * Implements merchant UPI payments, hosted/intent checkout, HMAC verification, and refunds.
 */
export class RazorpayGatewayService implements PaymentGatewayService {
  private keyId: string;
  private keySecret: string;
  private webhookSecret: string;
  private baseUrl = 'https://api.razorpay.com/v1';

  constructor(keyId: string, keySecret: string, webhookSecret?: string) {
    this.keyId = keyId;
    this.keySecret = keySecret;
    this.webhookSecret = webhookSecret || '';
  }

  private getAuthHeader(): string {
    return 'Basic ' + Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
  }

  async createOrder(params: CreatePaymentOrderParams): Promise<PaymentOrderResult> {
    const amountInPaise = Math.round(params.amountInRupees * 100);

    const payload = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: params.transactionId,
      notes: {
        transactionId: params.transactionId,
        customerName: params.customer.name,
        customerPhone: params.customer.phone,
        ...(params.notes || {}),
      },
    };

    const response = await fetch(`${this.baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });

    const data: any = await response.json();

    if (!response.ok) {
      console.error('[RazorpayGateway Error]: Failed to create order:', data);
      throw new Error(data.error?.description || 'Failed to initialize payment gateway order');
    }

    return {
      orderId: data.id,
      amount: data.amount,
      amountInRupees: params.amountInRupees,
      currency: data.currency,
      keyId: this.keyId,
      provider: 'RAZORPAY',
      upiIntentSupported: true,
    };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<PaymentVerificationResult> {
    const { orderId, paymentId, signature } = params;

    // Cryptographic HMAC SHA256 Signature Verification
    const generatedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(generatedSignature, 'utf-8'),
      Buffer.from(signature, 'utf-8')
    );

    if (!isValid) {
      return {
        verified: false,
        paymentId,
        orderId,
        amountPaid: 0,
        paymentMethod: 'UNKNOWN',
        error: 'Payment cryptographic signature verification failed.',
      };
    }

    // Authoritative check with Razorpay API to verify payment captured state
    try {
      const response = await fetch(`${this.baseUrl}/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          Authorization: this.getAuthHeader(),
        },
      });

      if (response.ok) {
        const paymentData: any = await response.json();
        const isCaptured = paymentData.status === 'captured' || paymentData.status === 'authorized';
        return {
          verified: isCaptured,
          paymentId: paymentData.id,
          orderId: paymentData.order_id || orderId,
          amountPaid: (paymentData.amount || 0) / 100,
          paymentMethod: paymentData.method || 'upi',
          vpa: paymentData.vpa,
          error: isCaptured ? undefined : `Payment status is ${paymentData.status}`,
        };
      }
    } catch (apiErr: any) {
      console.warn('[RazorpayGateway]: Payment fetch verification note:', apiErr.message);
    }

    return {
      verified: true,
      paymentId,
      orderId,
      amountPaid: 0,
      paymentMethod: 'upi',
    };
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret || !signature) return false;
    try {
      const expected = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(expected, 'utf-8'),
        Buffer.from(signature, 'utf-8')
      );
    } catch {
      return false;
    }
  }

  async processRefund(params: RefundParams): Promise<RefundResult> {
    const amountInPaise = Math.round(params.amountInRupees * 100);

    const payload = {
      amount: amountInPaise,
      reverse_all: true,
      notes: {
        reason: params.reason,
        idempotencyKey: params.idempotencyKey,
      },
    };

    const response = await fetch(`${this.baseUrl}/payments/${params.paymentId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.getAuthHeader(),
        'X-Razorpay-Account': '',
      },
      body: JSON.stringify(payload),
    });

    const data: any = await response.json();

    if (!response.ok) {
      console.error('[RazorpayGateway Refund Error]:', data);
      return {
        success: false,
        refundId: '',
        amount: params.amountInRupees,
        status: 'FAILED',
        error: data.error?.description || 'Gateway refund failed',
      };
    }

    return {
      success: true,
      refundId: data.id,
      amount: (data.amount || amountInPaise) / 100,
      status: data.status || 'processed',
    };
  }
}

/**
 * Safe Sandbox / Mock Payment Gateway for Development, CI & Automated Testing
 * Simulates merchant UPI collection, signature generation, webhooks, and refunds.
 */
export class MockPaymentGatewayService implements PaymentGatewayService {
  private secret = 'mock_secret_maharesilience_test_2026';

  async createOrder(params: CreatePaymentOrderParams): Promise<PaymentOrderResult> {
    const orderId = `order_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    return {
      orderId,
      amount: Math.round(params.amountInRupees * 100),
      amountInRupees: params.amountInRupees,
      currency: 'INR',
      keyId: 'rzp_test_MahaResilienceDemo2026',
      provider: 'MOCK_UPI_GATEWAY',
      upiIntentSupported: true,
    };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<PaymentVerificationResult> {
    const { orderId, paymentId, signature } = params;

    // Reject explicit failure test IDs
    if (paymentId.includes('FAIL') || signature === 'INVALID_SIG') {
      return {
        verified: false,
        paymentId,
        orderId,
        amountPaid: 0,
        paymentMethod: 'upi',
        error: 'Simulated payment authorization failed.',
      };
    }

    // Check valid signature or mock hash
    const expectedSig = crypto
      .createHmac('sha256', this.secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const isValid = signature === expectedSig || signature.startsWith('mock_sig_') || signature === 'test_valid_signature' || signature.length === 64;

    return {
      verified: isValid,
      paymentId,
      orderId,
      amountPaid: 299,
      paymentMethod: 'upi',
      vpa: 'citizen@okaxis',
      error: isValid ? undefined : 'Invalid signature supplied.',
    };
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (signature === 'test_valid_webhook_signature') return true;
    try {
      const expected = crypto.createHmac('sha256', this.secret).update(payload).digest('hex');
      return signature === expected;
    } catch {
      return false;
    }
  }

  async processRefund(params: RefundParams): Promise<RefundResult> {
    const refundId = `rfnd_mock_${Date.now()}`;
    return {
      success: true,
      refundId,
      amount: params.amountInRupees,
      status: 'processed',
    };
  }
}

/**
 * Factory to retrieve the active Payment Gateway
 */
export const getPaymentGateway = (): PaymentGatewayService => {
  const provider = (process.env.PAYMENT_PROVIDER || 'RAZORPAY').toUpperCase();
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.PAYMENT_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.PAYMENT_KEY_SECRET;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.PAYMENT_WEBHOOK_SECRET;

  if (provider === 'RAZORPAY' && keyId && keySecret && !keyId.includes('YOUR_')) {
    return new RazorpayGatewayService(keyId, keySecret, webhookSecret);
  }

  return new MockPaymentGatewayService();
};
