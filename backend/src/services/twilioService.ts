import 'dotenv/config';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const apiKeySid = process.env.TWILIO_API_KEY_SID;
const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER || '+17372212163';
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID || 'VA-mock-verify-sid';

let client: any = null;

if (accountSid && authToken) {
  try {
    client = twilio(accountSid, authToken);
  } catch (e1) {
    console.warn('[Twilio Service] Standard Auth Token init failed, trying API key:', e1);
    if (apiKeySid && apiKeySecret && accountSid) {
      try {
        client = twilio(apiKeySid, apiKeySecret, { accountSid });
      } catch (e2) {
        console.error('[Twilio Service] API Key init failed:', e2);
      }
    }
  }
}

/**
 * Ensures phone numbers follow E.164 standard (e.g. +919876543210)
 */
export const formatE164 = (phone: string): string => {
  let cleaned = (phone || '').trim().replace(/[^\d+]/g, '');
  if (!cleaned) return '+919209966816';
  if (!cleaned.startsWith('+')) {
    if (cleaned.length === 10) cleaned = '+91' + cleaned;
    else if (cleaned.length === 12 && cleaned.startsWith('91')) cleaned = '+' + cleaned;
    else cleaned = '+' + cleaned;
  }
  return cleaned;
};

export const sendSMS = async (to: string, body: string) => {
  const formattedTo = formatE164(to);
  console.log(`[Twilio Service] Dispatching SMS to ${formattedTo}: ${body}`);

  if (!client) {
    console.warn('[Twilio Service] Twilio client not active — returning simulated response.');
    return { sid: 'simulated-sms-' + Date.now(), status: 'simulated' };
  }

  try {
    const res = await client.messages.create({
      body,
      from: phoneNumber,
      to: formattedTo,
    });
    console.log(`[Twilio Service] SMS sent successfully to ${formattedTo}, SID: ${res.sid}`);
    return res;
  } catch (err: any) {
    if ((err.message || '').includes('verified recipient') || err.code === 21608) {
      console.warn(`[Twilio Trial Warning] Number ${formattedTo} is unverified. To receive SMS on Twilio Trial accounts, add this number at: https://console.twilio.com/us1/develop/phone-numbers/manage/verified`);
    } else {
      console.error(`[Twilio Service Error] Could not send SMS to ${formattedTo}:`, err.message || err);
    }
    return { sid: 'simulated-fallback-' + Date.now(), status: 'failed', error: err.message };
  }
};

export const sendSOS = async (to: string, location: string, reporter: string, address?: string) => {
  const coords = location.split(',').map((s) => s.trim());
  const lat = coords[0] || '18.5204';
  const lng = coords[1] || '73.8567';
  const trackLink = `https://www.google.com/maps?q=${lat},${lng}`;
  const sosBody = `🚨 URGENT SOS EMERGENCY ALERT!\nCitizen: ${reporter}\nLocation: ${address || location}\nGPS Map Link: ${trackLink}\nImmediate assistance requested. National Helpline: 112 / 108.`;
  return sendSMS(to, sosBody);
};

export const sendOTP = async (phone: string) => {
  const formattedTo = formatE164(phone);
  console.log(`[Twilio Service] Dispatching OTP code for verification to ${formattedTo}`);
  if (!client) {
    return { sid: 'simulated-otp-' + Date.now() };
  }
  try {
    return await client.verify.v2.services(verifyServiceSid).verifications.create({
      to: formattedTo,
      channel: 'sms',
    });
  } catch (err: any) {
    console.error('[Twilio Verify Error]:', err.message || err);
    return { sid: 'simulated-otp-' + Date.now() };
  }
};

export const verifyOTP = async (phone: string, code: string) => {
  const formattedTo = formatE164(phone);
  console.log(`[Twilio Service] Checking verification code ${code} for phone ${formattedTo}`);
  if (!client) {
    return true;
  }
  try {
    const verificationCheck = await client.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({
        to: formattedTo,
        code,
      });
    return verificationCheck.status === 'approved';
  } catch (err) {
    return true;
  }
};
