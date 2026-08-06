import crypto from 'crypto';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

const twilioClient = accountSid && authToken ? twilio(accountSid, authToken) : null;

export interface OTPRecord {
  phone: string;
  otpHash: string;
  expiresAt: number; // timestamp in ms
  attempts: number;
  requestCount: number;
  lastRequestedAt: number;
}

// In-memory OTP storage (per phone number)
const otpStore = new Map<string, OTPRecord>();

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 30 * 1000; // 30 seconds
const MAX_ATTEMPTS = 3;
const MAX_HOURLY_REQUESTS = 5;

/**
 * Generates a cryptographically secure 6-digit OTP
 */
export const generateSecureOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Hashes OTP code using SHA-256 for secure storage
 */
export const hashOTP = (otp: string): string => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

/**
 * Format phone number to E.164
 */
export const formatPhoneNumber = (phone: string): string => {
  let cleaned = phone.trim().replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+')) {
    cleaned = `+91${cleaned.replace(/^0+/, '')}`;
  }
  return cleaned;
};

/**
 * Send OTP via Twilio SMS
 */
export const sendOTPSMS = async (phone: string, otp: string): Promise<boolean> => {
  const formattedPhone = formatPhoneNumber(phone);
  const messageBody = `MahaResilience Verification Code\n\nYour verification code is:\n${otp}\n\nThis code expires in 5 minutes.\nDo not share this code with anyone.`;

  if (!twilioClient || !fromPhone) {
    console.log(`[Twilio SMS Dev Mode] SMS to ${formattedPhone}: ${otp}`);
    return true;
  }

  try {
    const res = await twilioClient.messages.create({
      body: messageBody,
      from: fromPhone,
      to: formattedPhone,
    });
    console.log(`[Twilio SMS Success] Message SID: ${res.sid} sent to ${formattedPhone}`);
    return true;
  } catch (error: any) {
    console.error('[Twilio SMS Error]:', error.message || error);
    // If Twilio API credentials fail or trial number restricted, log fallback
    console.log(`[Twilio SMS Fallback Log] OTP for ${formattedPhone}: ${otp}`);
    return false;
  }
};

/**
 * Process OTP generation and rate limiting
 */
export const requestOTP = async (phone: string): Promise<{ success: boolean; expiresIn: number; error?: string }> => {
  const formattedPhone = formatPhoneNumber(phone);
  const now = Date.now();
  const existing = otpStore.get(formattedPhone);

  if (existing) {
    // Check resend cooldown (30s)
    if (now - existing.lastRequestedAt < RESEND_COOLDOWN_MS) {
      const waitSec = Math.ceil((RESEND_COOLDOWN_MS - (now - existing.lastRequestedAt)) / 1000);
      return { success: false, expiresIn: 0, error: `Please wait ${waitSec} seconds before requesting a new OTP.` };
    }

    // Reset request count if more than 1 hour passed
    let requestCount = existing.requestCount;
    if (now - existing.lastRequestedAt > 60 * 60 * 1000) {
      requestCount = 0;
    }

    // Rate limit: Max 5 requests per hour
    if (requestCount >= MAX_HOURLY_REQUESTS) {
      return { success: false, expiresIn: 0, error: 'Maximum 5 OTP requests per hour exceeded. Please try again later.' };
    }

    const otp = generateSecureOTP();
    const otpHash = hashOTP(otp);

    otpStore.set(formattedPhone, {
      phone: formattedPhone,
      otpHash,
      expiresAt: now + OTP_EXPIRY_MS,
      attempts: 0,
      requestCount: requestCount + 1,
      lastRequestedAt: now,
    });

    await sendOTPSMS(formattedPhone, otp);
    return { success: true, expiresIn: 300 };
  }

  // First request
  const otp = generateSecureOTP();
  const otpHash = hashOTP(otp);

  otpStore.set(formattedPhone, {
    phone: formattedPhone,
    otpHash,
    expiresAt: now + OTP_EXPIRY_MS,
    attempts: 0,
    requestCount: 1,
    lastRequestedAt: now,
  });

  await sendOTPSMS(formattedPhone, otp);
  return { success: true, expiresIn: 300 };
};

/**
 * Verify input OTP code against stored hash
 */
export const verifyOTP = (phone: string, inputOtp: string): { success: boolean; error?: string } => {
  const formattedPhone = formatPhoneNumber(phone);
  const record = otpStore.get(formattedPhone);
  const now = Date.now();

  if (!record) {
    return { success: false, error: 'No active OTP request found for this phone number. Please request a new OTP.' };
  }

  // Expiry check (5 minutes)
  if (now > record.expiresAt) {
    otpStore.delete(formattedPhone);
    return { success: false, error: 'OTP code has expired. Please request a new OTP.' };
  }

  // Attempt limit check (Max 3)
  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(formattedPhone);
    return { success: false, error: 'Maximum 3 verification attempts reached. Please request a new OTP.' };
  }

  const inputHash = hashOTP(inputOtp);
  if (inputHash !== record.otpHash) {
    record.attempts += 1;
    otpStore.set(formattedPhone, record);

    if (record.attempts >= MAX_ATTEMPTS) {
      otpStore.delete(formattedPhone);
      return { success: false, error: 'Maximum 3 verification attempts reached. Please request a new OTP.' };
    }

    const remaining = MAX_ATTEMPTS - record.attempts;
    return { success: false, error: `Invalid OTP code. ${remaining} attempt(s) remaining.` };
  }

  // Verification successful -> delete OTP record to prevent replay attacks
  otpStore.delete(formattedPhone);
  return { success: true };
};
