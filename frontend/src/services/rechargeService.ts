/**
 * rechargeService.ts — Mobile Prepaid Recharge & Payment API Client
 * Connects frontend with backend /api/recharge endpoints with resilient error handling.
 */
import { getApiUrl } from '../config/api.config.ts';

export interface TelecomOperator {
  id: string; // 'JIO' | 'AIRTEL' | 'VI' | 'BSNL'
  name: string;
  code: string;
  logoColor: string;
  badge: string;
  supportedCircles: string[];
}

export interface TelecomCircle {
  id: string;
  name: string;
  code: string;
}

export interface RechargePlan {
  id: string;
  operator: string;
  circle: string;
  price: number;
  validity: string;
  data: string;
  calling: string;
  sms: string;
  category: 'TRULY_UNLIMITED' | 'DATA_ADDON' | 'SMART_VALIDITY' | 'ENTERTAINMENT_OTT' | 'ANNUAL';
  description: string;
  popular?: boolean;
}

export interface PlanCategorySummary {
  id: string;
  name: string;
  count: number;
}

export interface CreateOrderParams {
  mobileNumber: string;
  operator: string;
  circle: string;
  planId: string;
  amount: number;
  customerName?: string;
  customerEmail?: string;
  idempotencyKey?: string;
}

export interface GatewayOrderDetails {
  orderId: string;
  amount: number;
  amountInRupees: number;
  currency: string;
  keyId: string;
  provider: string;
  upiIntentSupported: boolean;
}

export interface CreateOrderResponse {
  success: boolean;
  orderId: string;
  transactionReference: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: string;
  gatewayOrder: GatewayOrderDetails;
  plan: {
    id: string;
    price: number;
    validity: string;
    data: string;
    calling: string;
    sms: string;
    description: string;
  };
  isDuplicate?: boolean;
  error?: string;
}

export interface VerifyPaymentParams {
  orderId: string;
  transactionReference?: string;
  transactionId?: string;
  gatewayOrderId: string;
  gatewayPaymentId: string;
  gatewaySignature: string;
  paymentMethod?: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  status: string;
  orderId?: string;
  transactionReference?: string;
  transactionId?: string;
  operatorReference?: string;
  amount?: number;
  mobileNumber?: string;
  message?: string;
  refundInitiated?: boolean;
  refundId?: string;
  receiptEmailSent?: boolean;
  receiptEmailAddress?: string;
  error?: string;
}

export interface RechargeHistoryItem {
  id: string;
  transactionReference: string;
  transactionId: string;
  mobileNumber: string;
  operator: string;
  circle: string;
  description?: string;
  validity: string;
  amount: number;
  status: string;
  operatorRef?: string | null;
  paymentGateway: string;
  receiptSent?: boolean;
  createdAt: string;
}

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Fetch supported operators and circles
 */
export const fetchOperatorsAndCircles = async (): Promise<{
  operators: TelecomOperator[];
  circles: TelecomCircle[];
}> => {
  try {
    const res = await fetch(getApiUrl('/api/recharge/operators'));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      operators: data.operators || [],
      circles: data.circles || [],
    };
  } catch (error) {
    console.warn('[rechargeService] Falling back to default telecom list:', error);
    return {
      operators: [
        { id: 'JIO', name: 'Reliance Jio', code: 'JIO', logoColor: '#0A2885', badge: 'True 5G', supportedCircles: ['ALL'] },
        { id: 'AIRTEL', name: 'Bharti Airtel', code: 'AIRTEL', logoColor: '#E60000', badge: '5G Plus', supportedCircles: ['ALL'] },
        { id: 'VI', name: 'Vodafone Idea (Vi)', code: 'VI', logoColor: '#EE1D23', badge: 'GIGAnet', supportedCircles: ['ALL'] },
        { id: 'BSNL', name: 'BSNL Mobile', code: 'BSNL', logoColor: '#00529B', badge: 'Connecting India', supportedCircles: ['ALL'] },
      ],
      circles: [
        { id: 'MAHARASHTRA_GOA', name: 'Maharashtra & Goa (excl. Mumbai)', code: 'MH' },
        { id: 'MUMBAI', name: 'Mumbai Metro Circle', code: 'MU' },
        { id: 'GUJARAT', name: 'Gujarat', code: 'GJ' },
        { id: 'DELHI_NCR', name: 'Delhi NCR', code: 'DL' },
        { id: 'KARNATAKA', name: 'Karnataka (Bengaluru)', code: 'KA' },
      ],
    };
  }
};

/**
 * Auto-detect telecom operator and circle by 10-digit mobile number
 */
export const lookupMobileNumber = async (
  mobileNumber: string
): Promise<{ operator: string; circle: string; circleName?: string }> => {
  const res = await fetch(getApiUrl('/api/recharge/lookup'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobileNumber }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Unable to detect telecom circle');
  }

  return {
    operator: data.operator,
    circle: data.circle,
    circleName: data.circleName,
  };
};

/**
 * Fetch plans for selected operator and circle
 */
export const fetchPlans = async (
  operator: string,
  circle: string,
  category?: string
): Promise<{ plans: RechargePlan[]; categories: PlanCategorySummary[] }> => {
  const query = new URLSearchParams({ operator, circle });
  if (category && category !== 'ALL') query.append('category', category);

  const res = await fetch(getApiUrl(`/api/recharge/plans?${query.toString()}`));
  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to load plans');
  }

  return {
    plans: data.plans || [],
    categories: data.categories || [],
  };
};

/**
 * Create pending order & retrieve payment gateway parameters
 */
export const createRechargeOrder = async (
  params: CreateOrderParams
): Promise<CreateOrderResponse> => {
  const res = await fetch(getApiUrl('/api/recharge/order'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to create recharge order');
  }

  return data;
};

/**
 * Verify payment signature and fulfill telecom recharge
 */
export const verifyPaymentAndRecharge = async (
  params: VerifyPaymentParams
): Promise<VerifyPaymentResponse> => {
  const res = await fetch(getApiUrl('/api/recharge/verify'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || data.message || 'Payment or recharge verification failed');
  }

  return data;
};

/**
 * Check transaction status (polling)
 */
export const checkRechargeStatus = async (transactionReference: string) => {
  const res = await fetch(getApiUrl(`/api/recharge/status/${encodeURIComponent(transactionReference)}`));
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Transaction status check failed');
  }
  return data;
};

/**
 * Retrieve user recharge history
 */
export const fetchRechargeHistory = async (phone?: string): Promise<RechargeHistoryItem[]> => {
  try {
    const url = phone
      ? getApiUrl(`/api/recharge/history?phone=${encodeURIComponent(phone)}`)
      : getApiUrl('/api/recharge/history');

    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) return [];
    const data = await res.json();
    return data.history || [];
  } catch (error) {
    console.warn('[rechargeService] History fetch error:', error);
    return [];
  }
};

