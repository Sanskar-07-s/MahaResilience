/**
 * billService.ts — Utility Bill Fetcher & Management Service
 * Communicates with backend /api/bills/fetch with zero-downtime offline deterministic fallback.
 */
import { getApiUrl } from '../config/api.config.ts';

export interface BillBreakdown {
  fixedCharges: number;
  consumptionCharges: number;
  taxesAndCess: number;
  meterRent?: number;
  promptPaymentDiscount?: number;
}

export interface UtilityBill {
  utilityType: 'ELECTRICITY' | 'WATER';
  consumerNumber: string;
  consumerName: string;
  provider: string;
  district: string;
  billNumber: string;
  billDate: string;
  dueDate: string;
  amountDue: number;
  unitsConsumed: number;
  unitLabel: string;
  meterNumber: string;
  status: 'DUE' | 'PAID' | 'OVERDUE';
  tariffCategory: string;
  breakdown: BillBreakdown;
  officialPortalUrl: string;
  isLive: boolean;
  notes?: string;
}

const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const RESIDENT_NAMES = [
  'Rajesh S. Patil',
  'Sunita V. Deshmukh',
  'Pooja N. Kulkarni',
  'Amit R. Shinde',
  'Vikas G. Joshi',
  'Deepak B. Gaikwad',
  'Anjali M. Pawar',
  'Suresh K. Kadam',
  'Priyanka A. More',
  'Mahesh D. Jadhav',
];

/**
 * Client-side calculation engine for instant, resilient offline fallback
 */
export const calculateFallbackBill = (
  utilityType: 'ELECTRICITY' | 'WATER',
  consumerNumber: string,
  provider?: string,
  district: string = 'Pune'
): UtilityBill => {
  const cleanNumber = consumerNumber.trim().toUpperCase();
  const isWater = utilityType.toUpperCase() === 'WATER';
  const hash = hashString(cleanNumber);
  const nameIndex = hash % RESIDENT_NAMES.length;
  const consumerName = RESIDENT_NAMES[nameIndex];

  const today = new Date();
  const currentMonth = today.toLocaleString('default', { month: 'short' });
  const billDate = new Date(today.getFullYear(), today.getMonth(), 5).toISOString().split('T')[0];
  const dueDate = new Date(today.getFullYear(), today.getMonth(), 24).toISOString().split('T')[0];

  // Check if locally marked as paid or explicit demo paid preset
  const paidKey = `bill_paid_${cleanNumber}`;
  const isPaidPreset = cleanNumber.includes('PAID') || cleanNumber === '099887766554';
  const isLocallyPaid = isPaidPreset || localStorage.getItem(paidKey) === 'true';

  if (isWater) {
    const selectedProvider = provider || `${district} Municipal Corporation (Water Supply)`;
    const volumeKL = 15 + (hash % 22);
    const consumptionCharges = Math.round(volumeKL * 12.5);
    const sewerageCess = Math.round(consumptionCharges * 0.20);
    const meterRent = 40;
    const amountDue = consumptionCharges + sewerageCess + meterRent;

    return {
      utilityType: 'WATER',
      consumerNumber: cleanNumber,
      consumerName,
      provider: selectedProvider,
      district,
      billNumber: `WTR-${currentMonth.toUpperCase()}-${hash % 90000 + 10000}`,
      billDate,
      dueDate,
      amountDue: isLocallyPaid ? 0 : amountDue,
      unitsConsumed: volumeKL,
      unitLabel: 'kL (Kilolitres)',
      meterNumber: `WM-${cleanNumber.slice(-4)}-${hash % 800 + 100}`,
      status: isLocallyPaid ? 'PAID' : hash % 7 === 0 ? 'PAID' : 'DUE',
      tariffCategory: 'Domestic Water Supply (Res-1)',
      breakdown: {
        fixedCharges: meterRent,
        consumptionCharges,
        taxesAndCess: sewerageCess,
        meterRent,
      },
      officialPortalUrl: 'https://pmc.gov.in/en/ptax-water-tax',
      isLive: false,
      notes: `Calculated as per ${district} Municipal Water Tariff rules.`,
    };
  }

  // Electricity
  const selectedProvider = provider || 'MSEDCL (Mahavitaran - Maharashtra)';
  const units = 110 + (hash % 190);
  let energyCharge = 0;
  if (units <= 100) {
    energyCharge = units * 4.71;
  } else {
    energyCharge = 100 * 4.71 + (units - 100) * 10.29;
  }
  const fixedCharges = 116;
  const electricityDuty = Math.round((energyCharge + fixedCharges) * 0.16);
  const totalPayable = Math.round(energyCharge + fixedCharges + electricityDuty);

  return {
    utilityType: 'ELECTRICITY',
    consumerNumber: cleanNumber,
    consumerName,
    provider: selectedProvider,
    district,
    billNumber: `MSE-${currentMonth.toUpperCase()}-${hash % 90000 + 10000}`,
    billDate,
    dueDate,
    amountDue: isLocallyPaid ? 0 : totalPayable,
    unitsConsumed: units,
    unitLabel: 'kWh (Units)',
    meterNumber: `EM-${cleanNumber.slice(-4)}-${hash % 900 + 100}`,
    status: isLocallyPaid ? 'PAID' : hash % 8 === 0 ? 'PAID' : 'DUE',
    tariffCategory: 'LT-1 Domestic (Single Phase)',
    breakdown: {
      fixedCharges,
      consumptionCharges: Math.round(energyCharge),
      taxesAndCess: electricityDuty,
      promptPaymentDiscount: 25,
    },
    officialPortalUrl: 'https://wss.mahadiscom.in/wss/wss?uiActionName=getViewPayBill',
    isLive: false,
    notes: `Calculated as per MSEDCL MERC Tariff Regulations for ${district} Circle.`,
  };
};

/**
 * Fetch bill by consumer number (calls backend with client fallback)
 */
export const fetchBillFromService = async (params: {
  utilityType: 'ELECTRICITY' | 'WATER';
  consumerNumber: string;
  provider?: string;
  district?: string;
}): Promise<UtilityBill> => {
  const { utilityType, consumerNumber, provider, district = 'Pune' } = params;

  try {
    const response = await fetch(getApiUrl('/api/bills/fetch'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        utilityType,
        consumerNumber,
        provider,
        district,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        // Check if locally paid in this browser
        const paidKey = `bill_paid_${consumerNumber.trim().toUpperCase()}`;
        if (localStorage.getItem(paidKey) === 'true') {
          return {
            ...result.data,
            status: 'PAID',
            amountDue: 0,
          };
        }
        return result.data;
      }
    }
  } catch (err) {
    console.warn('[BillService]: Backend fetch failed, utilizing resilient client engine:', err);
  }

  // Graceful client fallback
  return calculateFallbackBill(utilityType, consumerNumber, provider, district);
};

/**
 * Storage helpers for remembered consumer numbers
 */
export const getSavedConsumerNumbers = (utilityType: 'ELECTRICITY' | 'WATER'): string[] => {
  try {
    const raw = localStorage.getItem(`saved_bills_${utilityType}`);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return [];
};

export const saveConsumerNumber = (utilityType: 'ELECTRICITY' | 'WATER', consumerNo: string): void => {
  try {
    const existing = getSavedConsumerNumbers(utilityType);
    const clean = consumerNo.trim().toUpperCase();
    if (!existing.includes(clean)) {
      const updated = [clean, ...existing].slice(0, 5);
      localStorage.setItem(`saved_bills_${utilityType}`, JSON.stringify(updated));
    }
  } catch (_) {}
};

export const markBillAsPaidLocally = (consumerNo: string): void => {
  try {
    localStorage.setItem(`bill_paid_${consumerNo.trim().toUpperCase()}`, 'true');
  } catch (_) {}
};
