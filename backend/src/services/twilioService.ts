import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID || 'ACmockaccount';
const apiKeySid = process.env.TWILIO_API_KEY_SID || 'SKmockapisid';
const apiKeySecret = process.env.TWILIO_API_KEY_SECRET || 'mockapisecret';
const phoneNumber = process.env.TWILIO_PHONE_NUMBER || '+17372212163';
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID || 'VA-mock-verify-sid';

let client: any = null;
try {
  client = twilio(apiKeySid, apiKeySecret, { accountSid });
} catch (_) {}

export const sendSMS = async (to: string, body: string) => {
  console.log(`[Twilio Service] Sending SMS to ${to}: ${body}`);
  if (!client || !process.env.TWILIO_ACCOUNT_SID) {
    return { sid: 'mock-sms-' + Date.now(), status: 'simulated' };
  }
  return client.messages.create({
    body,
    from: phoneNumber,
    to,
  });
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
  console.log(`[Twilio Service] Dispatching OTP code for verification to ${phone}`);
  if (!client || !process.env.TWILIO_ACCOUNT_SID) {
    return { sid: 'mock-otp-' + Date.now() };
  }
  return client.verify.v2.services(verifyServiceSid).verifications.create({
    to: phone,
    channel: 'sms',
  });
};

export const verifyOTP = async (phone: string, code: string) => {
  console.log(`[Twilio Service] Checking verification code ${code} for phone ${phone}`);
  if (!client || !process.env.TWILIO_ACCOUNT_SID) {
    return true;
  }
  const verificationCheck = await client.verify.v2
    .services(verifyServiceSid)
    .verificationChecks.create({
      to: phone,
      code,
    });
  return verificationCheck.status === 'approved';
};
