/**
 * rechargeService.ts — Mobile Prepaid Recharge Demo & Payment Service
 * 
 * IMPORTANT: This module operates in DEMO / SIMULATION mode.
 * No real recharge API, merchant payment gateway, or live telecom switch credentials are required.
 * Provides realistic sample plans, simulated UPI checkout, auto-refunds, and local persistence.
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
  validityDays: number;
  data: string;
  calling: string;
  sms: string;
  category: 'TRULY_UNLIMITED' | 'DATA_ADDON' | 'SMART_VALIDITY' | 'ENTERTAINMENT_OTT' | 'ANNUAL';
  description: string;
  popular?: boolean;
  isSample: boolean;
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
  isDemo: boolean;
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
  isDemo?: boolean;
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
  simulationType?: 'SUCCESS' | 'PAYMENT_FAILED' | 'RECHARGE_FAILED';
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
  isDemo?: boolean;
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
  status: 'SUCCESS' | 'PAYMENT_FAILED' | 'RECHARGE_FAILED' | 'REFUND_COMPLETED' | 'PAYMENT_PENDING';
  operatorRef?: string | null;
  paymentGateway: string;
  receiptSent?: boolean;
  createdAt: string;
  isDemo?: boolean;
}

// ─── Authoritative Realistic Sample Plans Catalog (Demo Mode) ─────────────────
export const SAMPLE_RECHARGE_PLANS: RechargePlan[] = [
  // ── Reliance Jio ───────────────────────────────────────────────────────────
  {
    id: 'jio-unl-199',
    operator: 'JIO',
    circle: 'MAHARASHTRA_GOA',
    price: 199,
    validity: '23 Days',
    validityDays: 23,
    data: '1.5 GB/Day',
    calling: 'Truly Unlimited Calls',
    sms: '100 SMS/Day',
    category: 'TRULY_UNLIMITED',
    description: 'Sample Plan: 1.5 GB/Day high-speed data, unlimited voice calls across India, 100 SMS/day, and JioCinema/JioTV access.',
    isSample: true,
  },
  {
    id: 'jio-unl-239',
    operator: 'JIO',
    circle: 'MAHARASHTRA_GOA',
    price: 239,
    validity: '28 Days',
    validityDays: 28,
    data: '1.5 GB/Day',
    calling: 'Truly Unlimited Calls',
    sms: '100 SMS/Day',
    category: 'TRULY_UNLIMITED',
    description: 'Sample Plan: Standard 28-day 1.5 GB/Day pack with unlimited 5G eligibility, free national roaming, and complimentary Jio suite.',
    popular: true,
    isSample: true,
  },
  {
    id: 'jio-unl-299',
    operator: 'JIO',
    circle: 'MAHARASHTRA_GOA',
    price: 299,
    validity: '28 Days',
    validityDays: 28,
    data: '2 GB/Day',
    calling: 'Truly Unlimited Calls',
    sms: '100 SMS/Day',
    category: 'TRULY_UNLIMITED',
    description: 'Sample Plan: 2 GB/Day high-speed data + Unlimited 5G Data, free voice calling, and premium Jio applications subscription.',
    isSample: true,
  },
  {
    id: 'jio-unl-349',
    operator: 'JIO',
    circle: 'MAHARASHTRA_GOA',
    price: 349,
    validity: '30 Days',
    validityDays: 30,
    data: '2.5 GB/Day',
    calling: 'Truly Unlimited Calls',
    sms: '100 SMS/Day',
    category: 'TRULY_UNLIMITED',
    description: 'Sample Plan: Full calendar month validity (30 Days) with 2.5 GB/Day data, unlimited 5G data booster, and high-speed voice.',
    isSample: true,
  },
  {
    id: 'jio-unl-666',
    operator: 'JIO',
    circle: 'MAHARASHTRA_GOA',
    price: 666,
    validity: '70 Days',
    validityDays: 70,
    data: '1.5 GB/Day',
    calling: 'Truly Unlimited Calls',
    sms: '100 SMS/Day',
    category: 'TRULY_UNLIMITED',
    description: 'Sample Plan: 70 Days validity pack offering 1.5 GB/Day (105 GB total), unlimited voice, and 100 SMS/day.',
    isSample: true,
  },
  {
    id: 'jio-unl-899',
    operator: 'JIO',
    circle: 'MAHARASHTRA_GOA',
    price: 899,
    validity: '90 Days',
    validityDays: 90,
    data: '2 GB/Day',
    calling: 'Truly Unlimited Calls',
    sms: '100 SMS/Day',
    category: 'TRULY_UNLIMITED',
    description: 'Sample Plan: 3 months quarterly pack with 2 GB/Day + 20 GB extra data, unlimited 5G, and 100 SMS/day.',
    isSample: true,
  },
  {
    id: 'jio-data-19',
    operator: 'JIO',
    circle: 'MAHARASHTRA_GOA',
    price: 19,
    validity: '1 Day',
    validityDays: 1,
    data: '1.5 GB Total',
    calling: 'No Voice (Data Only)',
    sms: 'No SMS',
    category: 'DATA_ADDON',
    description: 'Sample Data Add-on: Instant 1.5 GB booster for emergency data needs. Valid till midnight.',
    isSample: true,
  },
  {
    id: 'jio-data-29',
    operator: 'JIO',
    circle: 'MAHARASHTRA_GOA',
    price: 29,
    validity: '1 Day',
    validityDays: 1,
    data: '2 GB Total',
    calling: 'No Voice (Data Only)',
    sms: 'No SMS',
    category: 'DATA_ADDON',
    description: 'Sample Data Add-on: 2 GB high-speed booster for continuous streaming or download tasks.',
    isSample: true,
  },
  {
    id: 'jio-data-61',
    operator: 'JIO',
    circle: 'MAHARASHTRA_GOA',
    price: 61,
    validity: 'Active Plan',
    validityDays: 28,
    data: '6 GB Total',
    calling: 'Active Plan Voice',
    sms: 'Active Plan SMS',
    category: 'DATA_ADDON',
    description: 'Sample Data Booster: 6 GB extra data valid till existing base plan expiry. Unlocks 5G trial.',
    isSample: true,
  },
  {
    id: 'jio-data-181',
    operator: 'JIO',
    circle: 'MAHARASHTRA_GOA',
    price: 181,
    validity: '30 Days',
    validityDays: 30,
    data: '30 GB Total',
    calling: 'No Voice (Work Pack)',
    sms: 'No SMS',
    category: 'DATA_ADDON',
    description: 'Sample Work-from-Home Pack: 30 GB bulk data (no daily limit) valid for 30 days.',
    isSample: true,
  },
  {
    id: 'jio-ott-857',
    operator: 'JIO',
    circle: 'MAHARASHTRA_GOA',
    price: 857,
    validity: '84 Days',
    validityDays: 84,
    data: '2 GB/Day',
    calling: 'Truly Unlimited Calls',
    sms: '100 SMS/Day',
    category: 'ENTERTAINMENT_OTT',
    description: 'Sample Entertainment Pack: 2 GB/Day for 84 days including 84-day Amazon Prime Video Mobile subscription.',
    isSample: true,
  },
  {
    id: 'jio-ann-3599',
    operator: 'JIO',
    circle: 'MAHARASHTRA_GOA',
    price: 3599,
    validity: '365 Days',
    validityDays: 365,
    data: '2.5 GB/Day',
    calling: 'Truly Unlimited Calls',
    sms: '100 SMS/Day',
    category: 'ANNUAL',
    description: 'Sample Annual Pack: 365 Days uninterrupted service with 2.5 GB/Day (912.5 GB total) and unlimited 5G data.',
    isSample: true,
  },

  // ── Bharti Airtel ──────────────────────────────────────────────────────────
  {
    id: 'airtel-unl-199',
    operator: 'AIRTEL',
    circle: 'MAHARASHTRA_GOA',
    price: 199,
    validity: '28 Days',
    validityDays: 28,
    data: '1 GB/Day',
    calling: 'Truly Unlimited Calls',
    sms: '100 SMS/Day',
    category: 'TRULY_UNLIMITED',
    description: 'Sample Plan: 1 GB/Day data, unlimited local/STD/roaming calls, 100 SMS/day, and free Hellotunes.',
    isSample: true,
  },
  {
    id: 'airtel-unl-299',
    operator: 'AIRTEL',
    circle: 'MAHARASHTRA_GOA',
    price: 299,
    validity: '28 Days',
    validityDays: 28,
    data: '1.5 GB/Day',
    calling: 'Truly Unlimited Calls',
    sms: '100 SMS/Day',
    category: 'TRULY_UNLIMITED',
    description: 'Sample Plan: 1.5 GB/Day data, unlimited calls, 100 SMS/day, Wynk Music, and Unlimited 5G Plus eligibility.',
    popular: true,
    isSample: true,
  },
  {
    id: 'airtel-unl-349',
    operator: 'AIRTEL',
    circle: 'MAHARASHTRA_GOA',
    price: 349,
    validity: '28 Days',
    validityDays: 28,
    data: '2 GB/Day',
    calling: 'Truly Unlimited Calls',
    sms: '100 SMS/Day',
    category: 'TRULY_UNLIMITED',
    description: 'Sample Plan: 2 GB/Day high-speed data, unlimited calls, 100 SMS/day, and Airtel Xstream Play access.',
    isSample: true,
  },
  {
    id: 'airtel-unl-549',
    operator: 'AIRTEL',
    circle: 'MAHARASHTRA_GOA',
    price: 549,
    validity: '56 Days',
    validityDays: 56,
    data: '3 GB/Day',
    calling: 'Truly Unlimited Calls',
    sms: '100 SMS/Day',
    category: 'TRULY_UNLIMITED',
    description: 'Sample Plan: Heavy usage 3 GB/Day pack for 56 days with unlimited 5G Plus and Apollo 24|7 circle benefits.',
    isSample: true,
  },
  {
    id: 'airtel-data-22',
    operator: 'AIRTEL',
    circle: 'MAHARASHTRA_GOA',
    price: 22,
    validity: '1 Day',
    validityDays: 1,
    data: '1 GB Total',
    calling: 'No Voice (Data Only)',
    sms: 'No SMS',
    category: 'DATA_ADDON',
    description: 'Sample Data Add-on: 1 GB extra high-speed data valid for 1 day.',
    isSample: true,
  },
  {
    id: 'airtel-data-65',
    operator: 'AIRTEL',
    circle: 'MAHARASHTRA_GOA',
    price: 65,
    validity: 'Active Base Plan',
    validityDays: 28,
    data: '4 GB Total',
    calling: 'No Voice',
    sms: 'No SMS',
    category: 'DATA_ADDON',
    description: 'Sample Data Pack: 4 GB additional data valid till your current recharge plan expires.',
    isSample: true,
  },
  {
    id: 'airtel-val-155',
    operator: 'AIRTEL',
    circle: 'MAHARASHTRA_GOA',
    price: 155,
    validity: '24 Days',
    validityDays: 24,
    data: '1 GB Total',
    calling: 'Unlimited Local & STD',
    sms: '300 Total SMS',
    category: 'SMART_VALIDITY',
    description: 'Sample Smart Validity: Budget pack keeping SIM active with unlimited voice calls and 1 GB data.',
    isSample: true,
  },
  {
    id: 'airtel-ott-839',
    operator: 'AIRTEL',
    circle: 'MAHARASHTRA_GOA',
    price: 839,
    validity: '84 Days',
    validityDays: 84,
    data: '2 GB/Day',
    calling: 'Truly Unlimited Calls',
    sms: '100 SMS/Day',
    category: 'ENTERTAINMENT_OTT',
    description: 'Sample OTT Pack: 2 GB/Day for 84 days with Disney+ Hotstar Mobile 3-month membership included.',
    isSample: true,
  },
  {
    id: 'airtel-ann-1799',
    operator: 'AIRTEL',
    circle: 'MAHARASHTRA_GOA',
    price: 1799,
    validity: '365 Days',
    validityDays: 365,
    data: '24 GB Total',
    calling: 'Truly Unlimited Calls',
    sms: '3600 Total SMS',
    category: 'ANNUAL',
    description: 'Sample Annual Voice Pack: 365 Days SIM validity with unlimited voice calling and 24 GB bulk data.',
    isSample: true,
  },
  {
    id: 'airtel-ann-3359',
    operator: 'AIRTEL',
    circle: 'MAHARASHTRA_GOA',
    price: 3359,
    validity: '365 Days',
    validityDays: 365,
    data: '2.5 GB/Day',
    calling: 'Truly Unlimited Calls',
    sms: '100 SMS/Day',
    category: 'ANNUAL',
    description: 'Sample Annual Power Pack: 2.5 GB/Day (912.5 GB total), 1-Year Disney+ Hotstar, and Unlimited 5G Plus.',
    isSample: true,
  },

  // ── Vodafone Idea (Vi) ─────────────────────────────────────────────────────
  {
    id: 'vi-unl-199',
    operator: 'VI',
    circle: 'MAHARASHTRA_GOA',
    price: 199,
    validity: '21 Days',
    validityDays: 21,
    data: '1 GB/Day',
    calling: 'Truly Unlimited Calls',
    sms: '100 SMS/Day',
    category: 'TRULY_UNLIMITED',
    description: 'Sample Plan: 1 GB/Day data, unlimited voice calls, and 100 SMS/day for 21 days.',
    isSample: true,
  },
  {
    id: 'vi-unl-299',
    operator: 'VI',
    circle: 'MAHARASHTRA_GOA',
    price: 299,
    validity: '28 Days',
    validityDays: 28,
    data: '1.5 GB/Day',
    calling: 'Truly Unlimited Calls',
    sms: '100 SMS/Day',
    category: 'TRULY_UNLIMITED',
    description: 'Sample Plan: 1.5 GB/Day with "Binge All Night" (12AM to 6AM free data) + Weekend Data Rollover.',
    popular: true,
    isSample: true,
  },
  {
    id: 'vi-unl-349',
    operator: 'VI',
    circle: 'MAHARASHTRA_GOA',
    price: 349,
    validity: '28 Days',
    validityDays: 28,
    data: '1.5 GB/Day',
    calling: 'Truly Unlimited Calls',
    sms: '100 SMS/Day',
    category: 'TRULY_UNLIMITED',
    description: 'Sample Plan: Vi Hero Unlimited with Data Delight (up to 2 GB emergency backup data every month).',
    isSample: true,
  },
  {
    id: 'vi-unl-479',
    operator: 'VI',
    circle: 'MAHARASHTRA_GOA',
    price: 479,
    validity: '56 Days',
    validityDays: 56,
    data: '1.5 GB/Day',
    calling: 'Truly Unlimited Calls',
    sms: '100 SMS/Day',
    category: 'TRULY_UNLIMITED',
    description: 'Sample Plan: 56 Days validity, 1.5 GB/Day, Binge All Night, and Weekend Data Rollover.',
    isSample: true,
  },
  {
    id: 'vi-unl-719',
    operator: 'VI',
    circle: 'MAHARASHTRA_GOA',
    price: 719,
    validity: '84 Days',
    validityDays: 84,
    data: '1.5 GB/Day',
    calling: 'Truly Unlimited Calls',
    sms: '100 SMS/Day',
    category: 'TRULY_UNLIMITED',
    description: 'Sample Plan: 84 Days long-term value pack with 1.5 GB/Day and Vi Movies & TV app access.',
    isSample: true,
  },
  {
    id: 'vi-val-99',
    operator: 'VI',
    circle: 'MAHARASHTRA_GOA',
    price: 99,
    validity: '15 Days',
    validityDays: 15,
    data: '200 MB Total',
    calling: '₹99 Talktime (2.5p/sec)',
    sms: 'Standard SMS rates',
    category: 'SMART_VALIDITY',
    description: 'Sample Minimum Recharge: Keeps SIM active for incoming and gives ₹99 talktime value for 15 days.',
    isSample: true,
  },
  {
    id: 'vi-data-19',
    operator: 'VI',
    circle: 'MAHARASHTRA_GOA',
    price: 19,
    validity: '1 Day',
    validityDays: 1,
    data: '1 GB Total',
    calling: 'No Voice',
    sms: 'No SMS',
    category: 'DATA_ADDON',
    description: 'Sample Data Add-on: 1 GB extra data valid for 24 hours.',
    isSample: true,
  },
  {
    id: 'vi-data-49',
    operator: 'VI',
    circle: 'MAHARASHTRA_GOA',
    price: 49,
    validity: '1 Day',
    validityDays: 1,
    data: '20 GB Total',
    calling: 'No Voice',
    sms: 'No SMS',
    category: 'DATA_ADDON',
    description: 'Sample Super Data Booster: 20 GB high-speed bulk data for 1 day (heavy download/gaming).',
    isSample: true,
  },
  {
    id: 'vi-ann-2899',
    operator: 'VI',
    circle: 'MAHARASHTRA_GOA',
    price: 2899,
    validity: '365 Days',
    validityDays: 365,
    data: '1.5 GB/Day',
    calling: 'Truly Unlimited Calls',
    sms: '100 SMS/Day',
    category: 'ANNUAL',
    description: 'Sample Annual Hero Pack: 365 Days uninterrupted service with 1.5 GB/Day and Binge All Night.',
    isSample: true,
  },

  // ── BSNL Prepaid ───────────────────────────────────────────────────────────
  {
    id: 'bsnl-val-107',
    operator: 'BSNL',
    circle: 'MAHARASHTRA_GOA',
    price: 107,
    validity: '35 Days',
    validityDays: 35,
    data: '3 GB Total',
    calling: '200 Mins Voice',
    sms: 'No SMS',
    category: 'SMART_VALIDITY',
    description: 'Sample BSNL Smart Validity: Budget 35-day validity with 200 minutes voice calls and 3 GB data.',
    isSample: true,
  },
  {
    id: 'bsnl-unl-153',
    operator: 'BSNL',
    circle: 'MAHARASHTRA_GOA',
    price: 153,
    validity: '26 Days',
    validityDays: 26,
    data: '1 GB/Day',
    calling: 'Truly Unlimited Calls',
    sms: '100 SMS/Day',
    category: 'TRULY_UNLIMITED',
    description: 'Sample BSNL Plan: 1 GB/Day, unlimited local/STD voice, and 100 SMS/day for 26 days.',
    isSample: true,
  },
  {
    id: 'bsnl-unl-199',
    operator: 'BSNL',
    circle: 'MAHARASHTRA_GOA',
    price: 199,
    validity: '30 Days',
    validityDays: 30,
    data: '2 GB/Day',
    calling: 'Truly Unlimited Calls',
    sms: '100 SMS/Day',
    category: 'TRULY_UNLIMITED',
    description: 'Sample BSNL Plan: 2 GB/Day data, unlimited voice calls to any network, and free caller tunes for 30 days.',
    popular: true,
    isSample: true,
  },
  {
    id: 'bsnl-val-397',
    operator: 'BSNL',
    circle: 'MAHARASHTRA_GOA',
    price: 397,
    validity: '150 Days',
    validityDays: 150,
    data: '2 GB/Day (First 30d)',
    calling: 'Unlimited (First 30d)',
    sms: '100 SMS/Day (30d)',
    category: 'SMART_VALIDITY',
    description: 'Sample Semi-Annual Validity: 150 Days active SIM validity with 30 days unlimited voice & 2 GB/Day.',
    isSample: true,
  },
  {
    id: 'bsnl-val-797',
    operator: 'BSNL',
    circle: 'MAHARASHTRA_GOA',
    price: 797,
    validity: '300 Days',
    validityDays: 300,
    data: '2 GB/Day (First 60d)',
    calling: 'Unlimited (First 60d)',
    sms: '100 SMS/Day (60d)',
    category: 'SMART_VALIDITY',
    description: 'Sample 300 Days Long Saver: 300 Days validity with 60 days of unlimited voice and 2 GB/Day data.',
    isSample: true,
  },
  {
    id: 'bsnl-data-16',
    operator: 'BSNL',
    circle: 'MAHARASHTRA_GOA',
    price: 16,
    validity: '1 Day',
    validityDays: 1,
    data: '2 GB Total',
    calling: 'No Voice',
    sms: 'No SMS',
    category: 'DATA_ADDON',
    description: 'Sample Mini Booster: 2 GB emergency data valid for 1 day.',
    isSample: true,
  },
  {
    id: 'bsnl-ann-1999',
    operator: 'BSNL',
    circle: 'MAHARASHTRA_GOA',
    price: 1999,
    validity: '365 Days',
    validityDays: 365,
    data: '600 GB Bulk Data',
    calling: 'Truly Unlimited Calls',
    sms: '100 SMS/Day',
    category: 'ANNUAL',
    description: 'Sample BSNL Annual Pack: 365 Days validity, 600 GB high-speed data (no daily cap), and unlimited calling.',
    isSample: true,
  },
  {
    id: 'bsnl-ann-2399',
    operator: 'BSNL',
    circle: 'MAHARASHTRA_GOA',
    price: 2399,
    validity: '395 Days',
    validityDays: 395,
    data: '2 GB/Day',
    calling: 'Truly Unlimited Calls',
    sms: '100 SMS/Day',
    category: 'ANNUAL',
    description: 'Sample Extended Annual Pack: 395 Days (13 months) validity with 2 GB/Day and unlimited voice calling.',
    isSample: true,
  },
];

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
 * Fetch supported operators and circles (with instant offline fallback)
 */
export const fetchOperatorsAndCircles = async (): Promise<{
  operators: TelecomOperator[];
  circles: TelecomCircle[];
}> => {
  try {
    const res = await fetch(getApiUrl('/api/recharge/operators'));
    if (res.ok) {
      const data = await res.json();
      if (data.operators && data.operators.length > 0) {
        return {
          operators: data.operators,
          circles: data.circles,
        };
      }
    }
  } catch {}

  // Reliable instant fallback
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
};

/**
 * Auto-detect telecom operator and circle from 10-digit mobile number
 */
export const lookupMobileNumber = async (
  mobileNumber: string
): Promise<{ operator: string; circle: string; circleName?: string }> => {
  const cleanPhone = mobileNumber.replace(/\D/g, '').slice(-10);

  try {
    const res = await fetch(getApiUrl('/api/recharge/lookup'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobileNumber: cleanPhone }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.operator) {
        return {
          operator: data.operator,
          circle: data.circle || 'MAHARASHTRA_GOA',
          circleName: data.circleName || 'Maharashtra & Goa (excl. Mumbai)',
        };
      }
    }
  } catch {}

  // Fallback client-side prefix lookup
  const p2 = cleanPhone.slice(0, 2);
  let operator = 'JIO';
  if (['98', '97', '99', '81', '80'].includes(p2)) {
    operator = 'AIRTEL';
  } else if (['90', '91', '88', '89', '84'].includes(p2)) {
    operator = 'VI';
  } else if (['94', '95'].includes(p2)) {
    operator = 'BSNL';
  } else {
    operator = 'JIO';
  }

  return {
    operator,
    circle: 'MAHARASHTRA_GOA',
    circleName: 'Maharashtra & Goa (excl. Mumbai)',
  };
};

/**
 * Filter demo sample plans locally
 */
export const getDemoFallbackPlans = (
  operator: string,
  circle: string,
  category?: string
): { plans: RechargePlan[]; categories: PlanCategorySummary[] } => {
  const opUpper = operator.toUpperCase();
  const catUpper = category ? category.toUpperCase() : 'ALL';

  // Plans matching operator
  const opPlans = SAMPLE_RECHARGE_PLANS.filter((p) => p.operator === opUpper);

  // Compute category counts for pills
  const categories: PlanCategorySummary[] = [
    { id: 'ALL', name: 'All Plans', count: opPlans.length },
    { id: 'TRULY_UNLIMITED', name: 'Truly Unlimited', count: opPlans.filter(p => p.category === 'TRULY_UNLIMITED').length },
    { id: 'DATA_ADDON', name: 'Data Add-on', count: opPlans.filter(p => p.category === 'DATA_ADDON').length },
    { id: 'SMART_VALIDITY', name: 'Smart Validity', count: opPlans.filter(p => p.category === 'SMART_VALIDITY').length },
    { id: 'ENTERTAINMENT_OTT', name: 'Entertainment & OTT', count: opPlans.filter(p => p.category === 'ENTERTAINMENT_OTT').length },
    { id: 'ANNUAL', name: 'Annual Plans (365 Days)', count: opPlans.filter(p => p.category === 'ANNUAL').length },
  ];

  const filtered = catUpper === 'ALL'
    ? opPlans
    : opPlans.filter(p => p.category === catUpper);

  return {
    plans: filtered,
    categories,
  };
};

/**
 * Fetch plans for selected operator, circle, and category
 * Tries backend first; seamlessly falls back to SAMPLE_RECHARGE_PLANS so the catalog is NEVER empty.
 */
export const fetchPlans = async (
  operator: string,
  circle: string,
  category?: string
): Promise<{ plans: RechargePlan[]; categories: PlanCategorySummary[] }> => {
  const query = new URLSearchParams({ operator, circle });
  if (category && category !== 'ALL') query.append('category', category);

  try {
    const res = await fetch(getApiUrl(`/api/recharge/plans?${query.toString()}`));
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.plans) && data.plans.length > 0) {
        return {
          plans: data.plans.map((p: any) => ({ ...p, isSample: true })),
          categories: data.categories || [],
        };
      }
    }
  } catch {}

  // Always return realistic sample plans
  return getDemoFallbackPlans(operator, circle, category);
};

/**
 * Helper to get/set demo history from LocalStorage
 */
const getLocalDemoHistory = (): RechargeHistoryItem[] => {
  try {
    const raw = localStorage.getItem('maharesilience_demo_recharge_history');
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
};

const saveLocalDemoHistory = (order: RechargeHistoryItem) => {
  try {
    const existing = getLocalDemoHistory();
    const updated = [order, ...existing.filter(o => o.transactionReference !== order.transactionReference)].slice(0, 30);
    localStorage.setItem('maharesilience_demo_recharge_history', JSON.stringify(updated));
  } catch {}
};

/**
 * Create recharge order (supports both backend and local demo persistence)
 */
export const createRechargeOrder = async (
  params: CreateOrderParams
): Promise<CreateOrderResponse> => {
  // Try backend first
  try {
    const res = await fetch(getApiUrl('/api/recharge/order'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return { ...data, isDemo: true };
      }
    }
  } catch {}

  // Fallback demo order generator
  const timestamp = Date.now();
  const rand = Math.floor(1000 + Math.random() * 9000);
  const orderId = `demo_ord_${timestamp}_${rand}`;
  const transactionReference = `DEMO-MR-REC-${timestamp}-${rand}`;

  // Find plan details
  const fallbackList = SAMPLE_RECHARGE_PLANS.filter(p => p.operator === params.operator.toUpperCase());
  const plan = fallbackList.find(p => p.id === params.planId) || {
    id: params.planId,
    price: params.amount,
    validity: '28 Days',
    data: '1.5 GB/Day',
    calling: 'Unlimited Calls',
    sms: '100 SMS/Day',
    description: `Sample ₹${params.amount} Recharge Pack`,
    category: 'TRULY_UNLIMITED' as const,
  };

  const demoOrder: CreateOrderResponse = {
    success: true,
    orderId,
    transactionReference,
    transactionId: transactionReference,
    amount: params.amount,
    currency: 'INR',
    status: 'PAYMENT_PENDING',
    isDemo: true,
    gatewayOrder: {
      orderId: `demo_gateway_order_${timestamp}`,
      amount: params.amount * 100,
      amountInRupees: params.amount,
      currency: 'INR',
      keyId: 'rzp_demo_simulator',
      provider: 'SIMULATED_UPI_GATEWAY',
      upiIntentSupported: true,
      isDemo: true,
    },
    plan: {
      id: plan.id,
      price: plan.price,
      validity: plan.validity,
      data: plan.data,
      calling: plan.calling,
      sms: plan.sms,
      description: plan.description,
    },
  };

  return demoOrder;
};

/**
 * Verify payment & fulfill demo recharge (with simulated testing modes)
 */
export const verifyPaymentAndRecharge = async (
  params: VerifyPaymentParams
): Promise<VerifyPaymentResponse> => {
  const simType = params.simulationType || 'SUCCESS';

  // If user requested simulated failure
  if (simType === 'PAYMENT_FAILED') {
    return {
      success: false,
      status: 'PAYMENT_FAILED',
      error: 'Simulated Payment Failure: UPI authorization declined or cancelled by citizen.',
      isDemo: true,
    };
  }

  if (simType === 'RECHARGE_FAILED') {
    const refundId = `DEMO-RFND-${Date.now()}`;
    const txRef = params.transactionReference || params.transactionId || `DEMO-MR-REC-${Date.now()}`;
    
    // Save to local history as refund
    saveLocalDemoHistory({
      id: params.orderId,
      transactionReference: txRef,
      transactionId: txRef,
      mobileNumber: '6000000000',
      operator: 'VI',
      circle: 'MAHARASHTRA_GOA',
      validity: '28 Days',
      amount: 299,
      status: 'REFUND_COMPLETED',
      operatorRef: 'REJECTED_BY_SWITCH',
      paymentGateway: 'SIMULATED_UPI',
      receiptSent: false,
      createdAt: new Date().toISOString(),
      isDemo: true,
    });

    return {
      success: false,
      status: 'REFUND_COMPLETED',
      refundInitiated: true,
      refundId,
      error: 'Simulated Operator Rejection: Telecom switch reported invalid denomination.',
      message: 'Operator rejected recharge pack. Full simulated refund credited to source UPI account.',
      isDemo: true,
    };
  }

  // Try backend verification if available
  try {
    const res = await fetch(getApiUrl('/api/recharge/verify'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return { ...data, isDemo: true };
      }
    }
  } catch {}

  // Fallback demo success
  const txRef = params.transactionReference || params.transactionId || `DEMO-MR-REC-${Date.now()}`;
  const opRef = `DEMO-OPR-${Math.floor(10000000 + Math.random() * 90000000)}`;

  const response: VerifyPaymentResponse = {
    success: true,
    status: 'SUCCESS',
    orderId: params.orderId,
    transactionReference: txRef,
    transactionId: txRef,
    operatorReference: opRef,
    amount: 239,
    message: 'Prepaid recharge pack activated successfully (Demo Mode).',
    receiptEmailSent: true,
    receiptEmailAddress: 'citizen@maharesilience.org',
    isDemo: true,
  };

  return response;
};

/**
 * Fetch recharge history (merges backend API with local demo history)
 */
export const fetchRechargeHistory = async (phone?: string): Promise<RechargeHistoryItem[]> => {
  let backendHistory: RechargeHistoryItem[] = [];

  try {
    const url = phone
      ? getApiUrl(`/api/recharge/history?phone=${encodeURIComponent(phone)}`)
      : getApiUrl('/api/recharge/history');

    const res = await fetch(url, { headers: getAuthHeaders() });
    if (res.ok) {
      const data = await res.json();
      backendHistory = (data.history || []).map((h: any) => ({ ...h, isDemo: true }));
    }
  } catch {}

  const localHistory = getLocalDemoHistory();
  const combined = [...localHistory, ...backendHistory];

  // Deduplicate by transactionReference
  const uniqueMap = new Map<string, RechargeHistoryItem>();
  for (const item of combined) {
    if (!uniqueMap.has(item.transactionReference)) {
      uniqueMap.set(item.transactionReference, item);
    }
  }

  return Array.from(uniqueMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

export const recordDemoOrderLocally = (order: RechargeHistoryItem) => {
  saveLocalDemoHistory(order);
};
